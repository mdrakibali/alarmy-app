package com.alarmyclone.alarm

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions
import java.io.File
import java.util.concurrent.Executors
import kotlin.math.acos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min

class CameraMissionActivity : ComponentActivity() {
    private val cameraExecutor = Executors.newSingleThreadExecutor()
    private var imageCapture: ImageCapture? = null
    private var squatReps = 0
    private var finished = false

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) startCamera() else finishCancelled("permission")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCamera() {
        val previewView = PreviewView(this)
        val overlayView = PoseGraphicOverlay(this)
        val label = TextView(this).apply {
            text = "Camera"
            setTextColor(0xFFFFFFFF.toInt())
            textSize = 22f
            setPadding(48, 120, 48, 48)
        }
        val root = FrameLayout(this).apply {
            setBackgroundColor(0xFF000000.toInt())
            addView(previewView, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ))
            addView(overlayView, FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
            ))
            addView(label)
        }
        setContentView(root)

        val mode = intent.getStringExtra(EXTRA_MODE) ?: MODE_PHOTO
        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val preview = Preview.Builder().build().also {
                it.surfaceProvider = previewView.surfaceProvider
            }
            val front = CameraSelector.DEFAULT_FRONT_CAMERA
            val selector = if (mode == MODE_SQUAT && runCatching { provider.hasCamera(front) }.getOrDefault(false)) {
                front
            } else {
                CameraSelector.DEFAULT_BACK_CAMERA
            }
            provider.unbindAll()
            when (mode) {
                MODE_BARCODE -> bindBarcode(provider, preview, selector, label)
                MODE_SQUAT -> bindSquat(provider, preview, selector, label, overlayView)
                else -> bindPhoto(provider, preview, selector, label)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun bindPhoto(
        provider: ProcessCameraProvider,
        preview: Preview,
        selector: CameraSelector,
        label: TextView,
    ) {
        val capture = ImageCapture.Builder().build()
        imageCapture = capture
        provider.bindToLifecycle(this, selector, preview, capture)
        label.text = "Tap the screen to capture"
        label.setOnClickListener { takePhoto() }
        findViewById<FrameLayout>(android.R.id.content).getChildAt(0)?.setOnClickListener { takePhoto() }
    }

    private fun takePhoto() {
        val capture = imageCapture ?: return
        val file = File(getExternalFilesDir("missions"), "capture-${System.currentTimeMillis()}.jpg")
        file.parentFile?.mkdirs()
        val options = ImageCapture.OutputFileOptions.Builder(file).build()
        capture.takePicture(options, cameraExecutor, object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                val data = intent.apply { putExtra(EXTRA_PATH, file.absolutePath) }
                setResult(RESULT_OK, data)
                finish()
            }

            override fun onError(exception: ImageCaptureException) {
                Log.e(TAG, "capture failed", exception)
                finishCancelled("capture")
            }
        })
    }

    private fun bindBarcode(
        provider: ProcessCameraProvider,
        preview: Preview,
        selector: CameraSelector,
        label: TextView,
    ) {
        label.text = "Point at the registered code"
        val scanner = BarcodeScanning.getClient()
        val analysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
        analysis.setAnalyzer(cameraExecutor) { imageProxy ->
            val media = imageProxy.image
            if (media == null || finished) {
                imageProxy.close()
                return@setAnalyzer
            }
            val image = InputImage.fromMediaImage(media, imageProxy.imageInfo.rotationDegrees)
            scanner.process(image)
                .addOnSuccessListener { codes ->
                    val value = codes.firstOrNull { !it.rawValue.isNullOrBlank() }?.rawValue
                    if (value != null && !finished) {
                        finished = true
                        val data = intent.apply { putExtra(EXTRA_VALUE, value) }
                        setResult(RESULT_OK, data)
                        finish()
                    }
                }
                .addOnCompleteListener { imageProxy.close() }
        }
        provider.bindToLifecycle(this, selector, preview, analysis)
    }

    private fun bindSquat(
        provider: ProcessCameraProvider,
        preview: Preview,
        selector: CameraSelector,
        label: TextView,
        overlay: PoseGraphicOverlay,
    ) {
        label.visibility = View.GONE
        val isFront = (selector == CameraSelector.DEFAULT_FRONT_CAMERA)
        val target = intent.getIntExtra(EXTRA_TARGET, 10).coerceAtLeast(1)
        val options = AccuratePoseDetectorOptions.Builder()
            .setDetectorMode(AccuratePoseDetectorOptions.STREAM_MODE)
            .build()
        val detector = PoseDetection.getClient(options)
        val analysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
        var phase = "Standing"
        var missing = 0
        analysis.setAnalyzer(cameraExecutor) { imageProxy ->
            val media = imageProxy.image
            if (media == null || finished) {
                imageProxy.close()
                return@setAnalyzer
            }
            val rotationDegrees = imageProxy.imageInfo.rotationDegrees
            val image = InputImage.fromMediaImage(media, rotationDegrees)
            detector.process(image)
                .addOnSuccessListener { pose ->
                    val knee = kneeAngle(
                        pose.getPoseLandmark(PoseLandmark.LEFT_HIP),
                        pose.getPoseLandmark(PoseLandmark.LEFT_KNEE),
                        pose.getPoseLandmark(PoseLandmark.LEFT_ANKLE),
                    ) ?: kneeAngle(
                        pose.getPoseLandmark(PoseLandmark.RIGHT_HIP),
                        pose.getPoseLandmark(PoseLandmark.RIGHT_KNEE),
                        pose.getPoseLandmark(PoseLandmark.RIGHT_ANKLE),
                    )
                    if (finished) return@addOnSuccessListener
                    if (knee == null) {
                        missing += 1
                        val msg = if (missing > 15) "Step back & face camera" else "Detecting..."
                        overlay.updatePose(
                            pose = pose,
                            imgWidth = image.width,
                            imgHeight = image.height,
                            isFront = isFront,
                            phase = msg,
                            reps = squatReps,
                            target = target,
                            kneeAngle = null
                        )
                        return@addOnSuccessListener
                    }
                    missing = 0
                    when (phase) {
                        "Standing" -> if (knee < 150) phase = "Descending"
                        "Descending" -> when {
                            knee < 95 -> phase = "Good Squat ✓"
                            knee > 165 -> phase = "Standing"
                        }
                        "Good Squat ✓" -> if (knee > 120) phase = "Ascending"
                        "Ascending" -> if (knee > 160) {
                            phase = "Standing"
                            squatReps += 1
                        }
                    }

                    overlay.updatePose(
                        pose = pose,
                        imgWidth = image.width,
                        imgHeight = image.height,
                        isFront = isFront,
                        phase = phase,
                        reps = squatReps,
                        target = target,
                        kneeAngle = knee
                    )

                    if (squatReps >= target) {
                        finished = true
                        val data = intent.apply {
                            putExtra(EXTRA_COUNT, squatReps)
                            putExtra(EXTRA_COMPLETED, true)
                        }
                        setResult(RESULT_OK, data)
                        finish()
                    }
                }
                .addOnCompleteListener { imageProxy.close() }
        }
        provider.bindToLifecycle(this, selector, preview, analysis)
    }

    private fun kneeAngle(hip: PoseLandmark?, knee: PoseLandmark?, ankle: PoseLandmark?): Double? {
        if (hip == null || knee == null || ankle == null) return null
        if (min(hip.inFrameLikelihood, min(knee.inFrameLikelihood, ankle.inFrameLikelihood)) < 0.45f) {
            return null
        }
        val abx = hip.position.x - knee.position.x
        val aby = hip.position.y - knee.position.y
        val cbx = ankle.position.x - knee.position.x
        val cby = ankle.position.y - knee.position.y
        val mag = hypot(abx.toDouble(), aby.toDouble()) * hypot(cbx.toDouble(), cby.toDouble())
        if (mag == 0.0) return null
        val dot = abx * cbx + aby * cby
        return Math.toDegrees(acos((dot / mag).coerceIn(-1.0, 1.0)))
    }

    private fun finishCancelled(reason: String) {
        setResult(RESULT_CANCELED, intent.apply { putExtra(EXTRA_REASON, reason) })
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
    }

    companion object {
        private const val TAG = "CameraMission"
        const val EXTRA_MODE = "mode"
        const val EXTRA_TARGET = "target"
        const val EXTRA_PATH = "path"
        const val EXTRA_VALUE = "value"
        const val EXTRA_COUNT = "count"
        const val EXTRA_COMPLETED = "completed"
        const val EXTRA_REASON = "reason"
        const val MODE_PHOTO = "photo"
        const val MODE_BARCODE = "barcode"
        const val MODE_SQUAT = "squat"
    }
}

class PoseGraphicOverlay(context: Context) : View(context) {
    private val lock = Any()
    private var currentPose: Pose? = null
    private var imageWidth: Int = 0
    private var imageHeight: Int = 0
    private var isFrontFacing: Boolean = true
    private var phaseText: String = "Standing"
    private var repCount: Int = 0
    private var targetReps: Int = 10
    private var kneeAngleDeg: Double? = null

    // Bright Cyan Lines matching user reference image
    private val linePaint = Paint().apply {
        color = 0xFF00E5FF.toInt()
        strokeWidth = 12f
        style = Paint.Style.STROKE
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
        isAntiAlias = true
    }

    // Yellow Joint Dots matching user reference image
    private val dotPaint = Paint().apply {
        color = 0xFFFFEB3B.toInt()
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    // Cyan Border around Yellow Dots
    private val dotBorderPaint = Paint().apply {
        color = 0xFF00E5FF.toInt()
        strokeWidth = 4f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    // Top Title Paint matching "Output: Squat"
    private val hudTitlePaint = Paint().apply {
        color = 0xFF00E5FF.toInt()
        textSize = 58f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
        setShadowLayer(8f, 2f, 2f, 0xFF000000.toInt())
    }

    // Subtitle Text Paint
    private val hudSubtitlePaint = Paint().apply {
        color = 0xFFFFFFFF.toInt()
        textSize = 40f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
        setShadowLayer(6f, 2f, 2f, 0xFF000000.toInt())
    }

    // Angle Annotation Paint (red pen style as user drew)
    private val anglePaint = Paint().apply {
        color = 0xFFFF1744.toInt()
        textSize = 34f
        typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
        isAntiAlias = true
        setShadowLayer(4f, 1f, 1f, 0xFF000000.toInt())
    }

    // Frosted Card Background
    private val hudCardPaint = Paint().apply {
        color = 0xAA000000.toInt()
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val hudCardBorder = Paint().apply {
        color = 0x5500E5FF.toInt()
        strokeWidth = 3f
        style = Paint.Style.STROKE
        isAntiAlias = true
    }

    fun updatePose(
        pose: Pose?,
        imgWidth: Int,
        imgHeight: Int,
        isFront: Boolean,
        phase: String,
        reps: Int,
        target: Int,
        kneeAngle: Double?
    ) {
        synchronized(lock) {
            currentPose = pose
            imageWidth = imgWidth
            imageHeight = imgHeight
            isFrontFacing = isFront
            phaseText = phase
            repCount = reps
            targetReps = target
            kneeAngleDeg = kneeAngle
        }
        postInvalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        val pose: Pose?
        val imgW: Int
        val imgH: Int
        val isFront: Boolean
        val phase: String
        val reps: Int
        val target: Int
        val angle: Double?

        synchronized(lock) {
            pose = currentPose
            imgW = imageWidth
            imgH = imageHeight
            isFront = isFrontFacing
            phase = phaseText
            reps = repCount
            target = targetReps
            angle = kneeAngleDeg
        }

        // Draw HUD Header Badge ("Output: Squat" as in user screenshot)
        val cardLeft = 36f
        val cardTop = 80f
        val cardRight = width - 36f
        val cardBottom = 250f
        canvas.drawRoundRect(cardLeft, cardTop, cardRight, cardBottom, 32f, 32f, hudCardPaint)
        canvas.drawRoundRect(cardLeft, cardTop, cardRight, cardBottom, 32f, 32f, hudCardBorder)

        canvas.drawText("Output: Squat", cardLeft + 32f, cardTop + 68f, hudTitlePaint)
        val angleLabel = if (angle != null) " • Knee: ${angle.toInt()}°" else ""
        canvas.drawText("Squats: $reps / $target ($phase)$angleLabel", cardLeft + 32f, cardTop + 132f, hudSubtitlePaint)

        if (pose == null || imgW <= 0 || imgH <= 0) return

        val viewW = width.toFloat()
        val viewH = height.toFloat()
        val scale = max(viewW / imgW, viewH / imgH)
        val offsetX = (viewW - imgW * scale) / 2f
        val offsetY = (viewH - imgH * scale) / 2f

        fun transformX(x: Float): Float {
            return if (isFront) {
                viewW - (x * scale + offsetX)
            } else {
                x * scale + offsetX
            }
        }

        fun transformY(y: Float): Float {
            return y * scale + offsetY
        }

        fun drawLineBetween(lm1: PoseLandmark?, lm2: PoseLandmark?) {
            if (lm1 == null || lm2 == null) return
            if (lm1.inFrameLikelihood < 0.35f || lm2.inFrameLikelihood < 0.35f) return
            val x1 = transformX(lm1.position.x)
            val y1 = transformY(lm1.position.y)
            val x2 = transformX(lm2.position.x)
            val y2 = transformY(lm2.position.y)
            canvas.drawLine(x1, y1, x2, y2, linePaint)
        }

        fun drawJointDot(lm: PoseLandmark?) {
            if (lm == null || lm.inFrameLikelihood < 0.35f) return
            val x = transformX(lm.position.x)
            val y = transformY(lm.position.y)
            canvas.drawCircle(x, y, 14f, dotPaint)
            canvas.drawCircle(x, y, 14f, dotBorderPaint)
        }

        // Key Landmarks
        val leftShoulder = pose.getPoseLandmark(PoseLandmark.LEFT_SHOULDER)
        val rightShoulder = pose.getPoseLandmark(PoseLandmark.RIGHT_SHOULDER)
        val leftElbow = pose.getPoseLandmark(PoseLandmark.LEFT_ELBOW)
        val rightElbow = pose.getPoseLandmark(PoseLandmark.RIGHT_ELBOW)
        val leftWrist = pose.getPoseLandmark(PoseLandmark.LEFT_WRIST)
        val rightWrist = pose.getPoseLandmark(PoseLandmark.RIGHT_WRIST)
        val leftHip = pose.getPoseLandmark(PoseLandmark.LEFT_HIP)
        val rightHip = pose.getPoseLandmark(PoseLandmark.RIGHT_HIP)
        val leftKnee = pose.getPoseLandmark(PoseLandmark.LEFT_KNEE)
        val rightKnee = pose.getPoseLandmark(PoseLandmark.RIGHT_KNEE)
        val leftAnkle = pose.getPoseLandmark(PoseLandmark.LEFT_ANKLE)
        val rightAnkle = pose.getPoseLandmark(PoseLandmark.RIGHT_ANKLE)
        val leftHeel = pose.getPoseLandmark(PoseLandmark.LEFT_HEEL)
        val rightHeel = pose.getPoseLandmark(PoseLandmark.RIGHT_HEEL)
        val leftFootIndex = pose.getPoseLandmark(PoseLandmark.LEFT_FOOT_INDEX)
        val rightFootIndex = pose.getPoseLandmark(PoseLandmark.RIGHT_FOOT_INDEX)
        val nose = pose.getPoseLandmark(PoseLandmark.NOSE)
        val leftEye = pose.getPoseLandmark(PoseLandmark.LEFT_EYE)
        val rightEye = pose.getPoseLandmark(PoseLandmark.RIGHT_EYE)
        val leftEar = pose.getPoseLandmark(PoseLandmark.LEFT_EAR)
        val rightEar = pose.getPoseLandmark(PoseLandmark.RIGHT_EAR)

        // Arms & Shoulders (Cyan lines)
        drawLineBetween(leftShoulder, rightShoulder)
        drawLineBetween(leftShoulder, leftElbow)
        drawLineBetween(leftElbow, leftWrist)
        drawLineBetween(rightShoulder, rightElbow)
        drawLineBetween(rightElbow, rightWrist)

        // Torso
        drawLineBetween(leftShoulder, leftHip)
        drawLineBetween(rightShoulder, rightHip)
        drawLineBetween(leftHip, rightHip)

        // Legs
        drawLineBetween(leftHip, leftKnee)
        drawLineBetween(leftKnee, leftAnkle)
        drawLineBetween(rightHip, rightKnee)
        drawLineBetween(rightKnee, rightAnkle)

        // Feet triangles
        drawLineBetween(leftAnkle, leftHeel)
        drawLineBetween(leftHeel, leftFootIndex)
        drawLineBetween(leftAnkle, leftFootIndex)
        drawLineBetween(rightAnkle, rightHeel)
        drawLineBetween(rightHeel, rightFootIndex)
        drawLineBetween(rightAnkle, rightFootIndex)

        // Face
        drawLineBetween(leftEye, nose)
        drawLineBetween(rightEye, nose)
        drawLineBetween(leftEye, leftEar)
        drawLineBetween(rightEye, rightEar)

        // Joint Dots (Yellow circles with Cyan border)
        drawJointDot(nose)
        drawJointDot(leftEye)
        drawJointDot(rightEye)
        drawJointDot(leftEar)
        drawJointDot(rightEar)
        drawJointDot(leftShoulder)
        drawJointDot(rightShoulder)
        drawJointDot(leftElbow)
        drawJointDot(rightElbow)
        drawJointDot(leftWrist)
        drawJointDot(rightWrist)
        drawJointDot(leftHip)
        drawJointDot(rightHip)
        drawJointDot(leftKnee)
        drawJointDot(rightKnee)
        drawJointDot(leftAnkle)
        drawJointDot(rightAnkle)
        drawJointDot(leftHeel)
        drawJointDot(rightHeel)
        drawJointDot(leftFootIndex)
        drawJointDot(rightFootIndex)

        // Draw Knee Angle text near knee if available
        if (angle != null) {
            val kneeLm = if ((leftKnee?.inFrameLikelihood ?: 0f) > (rightKnee?.inFrameLikelihood ?: 0f)) leftKnee else rightKnee
            if (kneeLm != null && kneeLm.inFrameLikelihood > 0.4f) {
                val kx = transformX(kneeLm.position.x)
                val ky = transformY(kneeLm.position.y)
                canvas.drawText("${angle.toInt()}°", kx + 24f, ky - 10f, anglePaint)
            }
        }
    }
}
