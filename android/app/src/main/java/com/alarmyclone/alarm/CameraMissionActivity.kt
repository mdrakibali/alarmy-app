package com.alarmyclone.alarm

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
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
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions
import java.io.File
import java.util.concurrent.Executors
import kotlin.math.acos
import kotlin.math.hypot
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
                MODE_SQUAT -> bindSquat(provider, preview, selector, label)
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
    ) {
        val target = intent.getIntExtra(EXTRA_TARGET, 10).coerceAtLeast(1)
        label.text = "Squats 0 / $target"
        val options = AccuratePoseDetectorOptions.Builder()
            .setDetectorMode(AccuratePoseDetectorOptions.STREAM_MODE)
            .build()
        val detector = PoseDetection.getClient(options)
        val analysis = ImageAnalysis.Builder()
            .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
            .build()
        var phase = "standing"
        var missing = 0
        analysis.setAnalyzer(cameraExecutor) { imageProxy ->
            val media = imageProxy.image
            if (media == null || finished) {
                imageProxy.close()
                return@setAnalyzer
            }
            val image = InputImage.fromMediaImage(media, imageProxy.imageInfo.rotationDegrees)
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
                        if (missing > 20) {
                            runOnUiThread { label.text = "No person in frame. Step back and face the camera." }
                        }
                        return@addOnSuccessListener
                    }
                    missing = 0
                    when (phase) {
                        "standing" -> if (knee < 150) phase = "descending"
                        "descending" -> when {
                            knee < 95 -> phase = "bottom"
                            knee > 165 -> phase = "standing"
                        }
                        "bottom" -> if (knee > 120) phase = "ascending"
                        "ascending" -> if (knee > 160) {
                            phase = "standing"
                            squatReps += 1
                        }
                    }
                    val status = when (phase) {
                        "descending" -> "Going down"
                        "bottom" -> "Squat depth reached"
                        "ascending" -> "Standing up"
                        else -> "Standing"
                    }
                    runOnUiThread { label.text = "$status\n$squatReps / $target" }
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
        if (min(hip.inFrameLikelihood, min(knee.inFrameLikelihood, ankle.inFrameLikelihood)) < 0.6f) {
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
