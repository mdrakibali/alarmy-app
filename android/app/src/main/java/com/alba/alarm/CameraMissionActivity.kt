package com.alba.alarm

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.ColorStateList
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.media.AudioManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.AspectRatio
import androidx.camera.core.Camera
import androidx.camera.core.CameraControl
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import com.google.android.gms.tasks.Task
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.pose.Pose
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import kotlin.math.max

class CameraMissionActivity : ComponentActivity() {

    companion object {
        const val TAG = "CameraMissionActivity"

        const val EXTRA_MODE = "mode"
        const val EXTRA_TARGET = "target"
        const val EXTRA_BARCODE_VALUE = "barcodeValue"
        const val EXTRA_BARCODE_NAME = "barcodeName"
        const val EXTRA_REFERENCE_PATH = "referencePath"
        const val EXTRA_MATCH_THRESHOLD = "matchThreshold"

        const val EXTRA_PATH = "path"
        const val EXTRA_VALUE = "value"
        const val EXTRA_FORMAT = "format"
        const val EXTRA_COUNT = "count"
        const val EXTRA_SCORE = "score"
        const val EXTRA_COMPLETED = "completed"
        const val EXTRA_REASON = "reason"

        const val MODE_PHOTO = "photo"
        const val MODE_BARCODE = "barcode"
        const val MODE_SQUAT = "squat"
        const val MODE_REGISTER_BARCODE = "register_barcode"
        const val MODE_REGISTER_PHOTO = "register_photo"
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()

    private var camera: Camera? = null
    private var cameraControl: CameraControl? = null
    private var imageCapture: ImageCapture? = null
    private var isTorchOn = false
    private var isFrontCamera = false

    private var toneGenerator: ToneGenerator? = null
    private var isFinished = false

    private lateinit var rootContainer: FrameLayout
    private lateinit var previewView: PreviewView

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) setupCamera() else finishCancelled("permission_denied")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initToneGenerator()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            setupCamera()
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun initToneGenerator() {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_ALARM, 90)
        } catch (_: Throwable) {
            toneGenerator = null
        }
    }

    private fun playBeep(isFinal: Boolean = false) {
        try {
            if (isFinal) {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_ACK, 350)
            } else {
                toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP2, 160)
            }
        } catch (_: Throwable) {}
    }

    private fun vibrateFeedback(type: String) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                (getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            } ?: return

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                when (type) {
                    "rep" -> vibrator.vibrate(VibrationEffect.createOneShot(70L, VibrationEffect.DEFAULT_AMPLITUDE))
                    "success" -> vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 100, 80, 180), -1))
                    "error" -> vibrator.vibrate(VibrationEffect.createWaveform(longArrayOf(0, 80, 60, 80), -1))
                }
            } else {
                @Suppress("DEPRECATION")
                when (type) {
                    "rep" -> vibrator.vibrate(70L)
                    "success" -> vibrator.vibrate(longArrayOf(0, 100, 80, 180), -1)
                    "error" -> vibrator.vibrate(longArrayOf(0, 80, 60, 80), -1)
                }
            }
        } catch (_: Throwable) {}
    }

    private fun toggleTorch() {
        isTorchOn = !isTorchOn
        try {
            cameraControl?.enableTorch(isTorchOn)
        } catch (_: Throwable) {}
    }

    private fun dp(v: Int): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v.toFloat(), resources.displayMetrics).toInt()

    private fun setupCamera() {
        rootContainer = FrameLayout(this).apply {
            setBackgroundColor(0xFF0E1116.toInt())
        }
        previewView = PreviewView(this).apply {
            scaleType = PreviewView.ScaleType.FILL_CENTER
            implementationMode = PreviewView.ImplementationMode.COMPATIBLE
        }
        rootContainer.addView(previewView, FrameLayout.LayoutParams(-1, -1))
        setContentView(rootContainer)

        val mode = intent.getStringExtra(EXTRA_MODE) ?: MODE_PHOTO
        when (mode) {
            MODE_SQUAT -> buildSquatFlow()
            MODE_BARCODE -> buildBarcodeMissionFlow()
            MODE_REGISTER_BARCODE -> buildBarcodeRegisterFlow()
            MODE_REGISTER_PHOTO -> buildPhotoRegisterFlow()
            else -> buildPhotoMissionFlow()
        }
    }

    // =========================================================================
    // 1. SQUAT MISSION FLOW
    // =========================================================================

    private fun buildSquatFlow() {
        val targetReps = intent.getIntExtra(EXTRA_TARGET, 3).coerceAtLeast(1)
        val squatCounter = SquatCounter()
        val skeletonOverlay = SkeletonView(this)
        rootContainer.addView(skeletonOverlay, FrameLayout.LayoutParams(-1, -1))

        // Top Header Badge
        val remainingText = TextView(this).apply {
            text = "$targetReps"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 44f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        val subLabel = TextView(this).apply {
            text = "squats left"
            setTextColor(0xFF9AA3AF.toInt())
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
        }
        val topBadge = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0xB310151E.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setPadding(dp(20), dp(10), dp(20), dp(12))
            addView(remainingText)
            addView(subLabel)
        }
        rootContainer.addView(
            topBadge,
            FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.START).apply {
                setMargins(dp(16), dp(36), 0, 0)
            },
        )

        // Bottom Status Box
        val statusPill = TextView(this).apply {
            text = "Stand in front of the camera"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0xD90E1116.toInt())
                cornerRadius = dp(24).toFloat()
            }
            setPadding(dp(22), dp(10), dp(22), dp(10))
        }
        rootContainer.addView(
            statusPill,
            FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(16), 0, dp(16), dp(72))
            },
        )

        // Depth Progress Bar
        val depthBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 100
            progress = 0
            isIndeterminate = false
            progressTintList = ColorStateList.valueOf(0xFFFF8A3D.toInt())
            progressBackgroundTintList = ColorStateList.valueOf(0x80333E4D.toInt())
        }
        val depthContainer = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            background = GradientDrawable().apply {
                setColor(0xB310151E.toInt())
                cornerRadius = dp(14).toFloat()
            }
            setPadding(dp(16), dp(8), dp(16), dp(8))
            val dLabel = TextView(this@CameraMissionActivity).apply {
                text = "Depth"
                setTextColor(0xFF9AA3AF.toInt())
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
                typeface = Typeface.DEFAULT_BOLD
            }
            addView(dLabel)
            addView(depthBar, LinearLayout.LayoutParams(0, dp(8), 1f).apply { marginStart = dp(12) })
        }
        rootContainer.addView(
            depthContainer,
            FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM).apply {
                setMargins(dp(16), 0, dp(16), dp(20))
            },
        )

        // Close/Emergency Button
        val closeBtn = TextView(this).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0x80000000.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setOnClickListener { finishCancelled("user_closed") }
        }
        rootContainer.addView(
            closeBtn,
            FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.END).apply {
                setMargins(0, dp(36), dp(16), 0)
            },
        )

        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val front = CameraSelector.DEFAULT_FRONT_CAMERA
            val selector = if (provider.hasCamera(front)) front else CameraSelector.DEFAULT_BACK_CAMERA
            isFrontCamera = (selector == front)

            val preview = Preview.Builder().setTargetAspectRatio(AspectRatio.RATIO_4_3).build()
            preview.surfaceProvider = previewView.surfaceProvider

            val poseDetector = PoseDetection.getClient(
                PoseDetectorOptions.Builder().setDetectorMode(PoseDetectorOptions.STREAM_MODE).build(),
            )

            val analysis = ImageAnalysis.Builder()
                .setTargetAspectRatio(AspectRatio.RATIO_4_3)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                if (isFinished) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                val media = imageProxy.image
                if (media == null) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                val rotation = imageProxy.imageInfo.rotationDegrees
                val isSideways = rotation % 180 != 0
                val frameW = if (isSideways) imageProxy.height else imageProxy.width
                val frameH = if (isSideways) imageProxy.width else imageProxy.height

                val inputImage = InputImage.fromMediaImage(media, rotation)
                poseDetector.process(inputImage)
                    .addOnSuccessListener { pose ->
                        if (isFinished) return@addOnSuccessListener
                        val legs = extractLegs(pose)
                        val nowMs = SystemClock.elapsedRealtime()
                        val counted = squatCounter.update(legs, frameH.toFloat(), nowMs)

                        mainHandler.post {
                            if (isFinished) return@post
                            val state = squatCounter.state
                            val isDeep = (state == SquatCounter.State.DOWN)
                            skeletonOverlay.update(pose, frameW, frameH, isFrontCamera, isDeep)

                            depthBar.progress = (squatCounter.depth * 100).toInt()
                            depthBar.progressTintList = ColorStateList.valueOf(
                                if (isDeep) 0xFF34D399.toInt() else 0xFFFF8A3D.toInt(),
                            )

                            val left = (targetReps - squatCounter.reps).coerceAtLeast(0)
                            remainingText.text = "$left"

                            if (counted) {
                                playBeep(squatCounter.reps >= targetReps)
                                vibrateFeedback("rep")
                                if (squatCounter.reps >= targetReps) {
                                    isFinished = true
                                    vibrateFeedback("success")
                                    statusPill.text = "Goal Complete! 🏋️✓"
                                    statusPill.setTextColor(0xFF34D399.toInt())
                                    mainHandler.postDelayed({
                                        val data = Intent().apply {
                                            putExtra(EXTRA_COUNT, squatCounter.reps)
                                            putExtra(EXTRA_COMPLETED, true)
                                        }
                                        setResult(Activity.RESULT_OK, data)
                                        finish()
                                    }, 500)
                                    return@post
                                } else {
                                    statusPill.text = "Nice rep! Squat down again"
                                }
                            } else {
                                statusPill.text = when (state) {
                                    SquatCounter.State.NOT_VISIBLE -> if (pose.allPoseLandmarks.isEmpty()) "Step into camera frame" else "Step back so feet are in view"
                                    SquatCounter.State.STAND_UP -> "Stand up straight"
                                    SquatCounter.State.READY -> "Squat down"
                                    SquatCounter.State.DOWN -> "Now stand up"
                                }
                            }
                        }
                    }
                    .addOnCompleteListener { imageProxy.close() }
            }

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(this, selector, preview, analysis)
                cameraControl = camera?.cameraControl
            } catch (e: Exception) {
                Log.e(TAG, "Squat camera bind error", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun extractLegs(pose: Pose): List<SquatCounter.Leg> {
        val lHip = pose.getPoseLandmark(PoseLandmark.LEFT_HIP)?.takeIf { it.inFrameLikelihood >= 0.45f }
        val lKnee = pose.getPoseLandmark(PoseLandmark.LEFT_KNEE)?.takeIf { it.inFrameLikelihood >= 0.45f }
        val lAnkle = pose.getPoseLandmark(PoseLandmark.LEFT_ANKLE)?.takeIf { it.inFrameLikelihood >= 0.45f }

        val rHip = pose.getPoseLandmark(PoseLandmark.RIGHT_HIP)?.takeIf { it.inFrameLikelihood >= 0.45f }
        val rKnee = pose.getPoseLandmark(PoseLandmark.RIGHT_KNEE)?.takeIf { it.inFrameLikelihood >= 0.45f }
        val rAnkle = pose.getPoseLandmark(PoseLandmark.RIGHT_ANKLE)?.takeIf { it.inFrameLikelihood >= 0.45f }

        val legs = mutableListOf<SquatCounter.Leg>()
        if (lHip != null && lKnee != null && lAnkle != null) {
            legs.add(
                SquatCounter.Leg(
                    SquatCounter.Point(lHip.position.x, lHip.position.y),
                    SquatCounter.Point(lKnee.position.x, lKnee.position.y),
                    SquatCounter.Point(lAnkle.position.x, lAnkle.position.y),
                ),
            )
        }
        if (rHip != null && rKnee != null && rAnkle != null) {
            legs.add(
                SquatCounter.Leg(
                    SquatCounter.Point(rHip.position.x, rHip.position.y),
                    SquatCounter.Point(rKnee.position.x, rKnee.position.y),
                    SquatCounter.Point(rAnkle.position.x, rAnkle.position.y),
                ),
            )
        }
        return legs
    }

    // =========================================================================
    // 2. BARCODE MISSION FLOW (LIVE IN-CAMERA VERIFICATION)
    // =========================================================================

    private fun buildBarcodeMissionFlow() {
        val expectedCode = intent.getStringExtra(EXTRA_BARCODE_VALUE)?.trim().orEmpty()
        val targetName = intent.getStringExtra(EXTRA_BARCODE_NAME)?.trim() ?: "Registered Barcode"

        val reticleView = BarcodeReticleView(this)
        rootContainer.addView(reticleView, FrameLayout.LayoutParams(-1, -1))

        // Top Header
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GradientDrawable().apply {
                setColor(0xB310151E.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setPadding(dp(20), dp(10), dp(20), dp(10))
            val title = TextView(this@CameraMissionActivity).apply {
                text = "BARCODE MISSION 📷"
                setTextColor(0xFF34D399.toInt())
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                typeface = Typeface.DEFAULT_BOLD
            }
            val sub = TextView(this@CameraMissionActivity).apply {
                text = "Scan: $targetName"
                setTextColor(Color.WHITE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 16f)
                typeface = Typeface.DEFAULT_BOLD
                setPadding(0, dp(2), 0, 0)
            }
            addView(title)
            addView(sub)
        }
        rootContainer.addView(
            header,
            FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(16), dp(36), dp(16), 0)
            },
        )

        // Torch Toggle Button
        val torchBtn = TextView(this).apply {
            text = "🔦"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0x80000000.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setOnClickListener {
                toggleTorch()
                setTextColor(if (isTorchOn) 0xFFFBBF24.toInt() else Color.WHITE)
            }
        }
        rootContainer.addView(
            torchBtn,
            FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.END).apply {
                setMargins(0, dp(36), dp(16), 0)
            },
        )

        // Live Warning / Status Pill
        val feedbackPill = TextView(this).apply {
            text = "Point camera at the barcode"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0xD90E1116.toInt())
                cornerRadius = dp(24).toFloat()
            }
            setPadding(dp(20), dp(12), dp(20), dp(12))
        }
        rootContainer.addView(
            feedbackPill,
            FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(20), 0, dp(20), dp(32))
            },
        )

        val scanner = BarcodeScanning.getClient()
        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            val preview = Preview.Builder().setTargetAspectRatio(AspectRatio.RATIO_16_9).build()
            preview.surfaceProvider = previewView.surfaceProvider

            val analysis = ImageAnalysis.Builder()
                .setTargetAspectRatio(AspectRatio.RATIO_16_9)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            var lastMismatchCode = ""
            var lastMismatchTime = 0L

            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                if (isFinished) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                val media = imageProxy.image
                if (media == null) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                val inputImage = InputImage.fromMediaImage(media, imageProxy.imageInfo.rotationDegrees)
                scanner.process(inputImage)
                    .addOnSuccessListener { barcodes ->
                        val code = barcodes.firstOrNull { !it.rawValue.isNullOrBlank() }?.rawValue ?: return@addOnSuccessListener
                        val now = SystemClock.elapsedRealtime()

                        if (expectedCode.isEmpty() || code == expectedCode) {
                            if (!isFinished) {
                                isFinished = true
                                mainHandler.post {
                                    playBeep(true)
                                    vibrateFeedback("success")
                                    reticleView.setSuccess(true)
                                    feedbackPill.text = "Code Verified! ✓"
                                    feedbackPill.setTextColor(0xFF34D399.toInt())
                                    feedbackPill.background = GradientDrawable().apply {
                                        setColor(0xEE064E3B.toInt())
                                        cornerRadius = dp(24).toFloat()
                                    }
                                    mainHandler.postDelayed({
                                        val data = Intent().apply {
                                            putExtra(EXTRA_VALUE, code)
                                            putExtra(EXTRA_COMPLETED, true)
                                        }
                                        setResult(Activity.RESULT_OK, data)
                                        finish()
                                    }, 400)
                                }
                            }
                        } else {
                            if (code != lastMismatchCode || now - lastMismatchTime > 2000L) {
                                lastMismatchCode = code
                                lastMismatchTime = now
                                mainHandler.post {
                                    vibrateFeedback("error")
                                    feedbackPill.text = "Scanned: $code\nExpected: $expectedCode"
                                    feedbackPill.setTextColor(0xFFF87171.toInt())
                                    feedbackPill.background = GradientDrawable().apply {
                                        setColor(0xEE450A0A.toInt())
                                        cornerRadius = dp(24).toFloat()
                                    }
                                }
                            }
                        }
                    }
                    .addOnCompleteListener { imageProxy.close() }
            }

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(this, selector, preview, analysis)
                cameraControl = camera?.cameraControl
            } catch (e: Exception) {
                Log.e(TAG, "Barcode camera bind error", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // =========================================================================
    // 3. BARCODE REGISTRATION FLOW (3-FRAME CONFIRMATION)
    // =========================================================================

    private fun buildBarcodeRegisterFlow() {
        val reticleView = BarcodeReticleView(this)
        rootContainer.addView(reticleView, FrameLayout.LayoutParams(-1, -1))

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GradientDrawable().apply {
                setColor(0xB310151E.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setPadding(dp(20), dp(10), dp(20), dp(10))
            val title = TextView(this@CameraMissionActivity).apply {
                text = "REGISTER BARCODE 📷"
                setTextColor(0xFF38BDF8.toInt())
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                typeface = Typeface.DEFAULT_BOLD
            }
            val sub = TextView(this@CameraMissionActivity).apply {
                text = "Hold code steady in the frame"
                setTextColor(Color.WHITE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
                typeface = Typeface.DEFAULT_BOLD
                setPadding(0, dp(2), 0, 0)
            }
            addView(title)
            addView(sub)
        }
        rootContainer.addView(
            header,
            FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(16), dp(36), dp(16), 0)
            },
        )

        val closeBtn = TextView(this).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0x80000000.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setOnClickListener { finishCancelled("register_cancelled") }
        }
        rootContainer.addView(
            closeBtn,
            FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.END).apply {
                setMargins(0, dp(36), dp(16), 0)
            },
        )

        val statusPill = TextView(this).apply {
            text = "Scanning..."
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0xD90E1116.toInt())
                cornerRadius = dp(24).toFloat()
            }
            setPadding(dp(20), dp(10), dp(20), dp(10))
        }
        rootContainer.addView(
            statusPill,
            FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(16), 0, dp(16), dp(36))
            },
        )

        val scanner = BarcodeScanning.getClient()
        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            val preview = Preview.Builder().setTargetAspectRatio(AspectRatio.RATIO_16_9).build()
            preview.surfaceProvider = previewView.surfaceProvider

            val analysis = ImageAnalysis.Builder()
                .setTargetAspectRatio(AspectRatio.RATIO_16_9)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()

            var candidateValue: String? = null
            var candidateFormat: String? = null
            var confirmCount = 0

            analysis.setAnalyzer(cameraExecutor) { imageProxy ->
                if (isFinished) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                val media = imageProxy.image
                if (media == null) {
                    imageProxy.close()
                    return@setAnalyzer
                }
                val inputImage = InputImage.fromMediaImage(media, imageProxy.imageInfo.rotationDegrees)
                scanner.process(inputImage)
                    .addOnSuccessListener { barcodes ->
                        val item = barcodes.firstOrNull { !it.rawValue.isNullOrBlank() }
                        val code = item?.rawValue
                        if (code != null) {
                            if (code == candidateValue) {
                                confirmCount++
                            } else {
                                candidateValue = code
                                candidateFormat = item.format.toString()
                                confirmCount = 1
                            }
                            if (confirmCount >= 3 && !isFinished) {
                                isFinished = true
                                mainHandler.post {
                                    playBeep(true)
                                    vibrateFeedback("success")
                                    reticleView.setSuccess(true)
                                    statusPill.text = "Registered: $code ✓"
                                    statusPill.setTextColor(0xFF34D399.toInt())
                                    mainHandler.postDelayed({
                                        val data = Intent().apply {
                                            putExtra(EXTRA_VALUE, code)
                                            putExtra(EXTRA_FORMAT, candidateFormat)
                                            putExtra(EXTRA_COMPLETED, true)
                                        }
                                        setResult(Activity.RESULT_OK, data)
                                        finish()
                                    }, 400)
                                }
                            }
                        }
                    }
                    .addOnCompleteListener { imageProxy.close() }
            }

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(this, selector, preview, analysis)
                cameraControl = camera?.cameraControl
            } catch (e: Exception) {
                Log.e(TAG, "Register barcode camera bind error", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // =========================================================================
    // 4. PHOTO MISSION FLOW (WITH PiP REFERENCE & IN-CAMERA VERIFICATION)
    // =========================================================================

    private fun buildPhotoMissionFlow() {
        val referencePath = intent.getStringExtra(EXTRA_REFERENCE_PATH).orEmpty()
        val threshold = intent.getIntExtra(EXTRA_MATCH_THRESHOLD, 68).coerceIn(40, 95)

        val reticleView = PhotoReticleView(this)
        rootContainer.addView(reticleView, FrameLayout.LayoutParams(-1, -1))

        // Top Header
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GradientDrawable().apply {
                setColor(0xB310151E.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setPadding(dp(18), dp(10), dp(18), dp(10))
            val title = TextView(this@CameraMissionActivity).apply {
                text = "PHOTO MISSION 📸"
                setTextColor(0xFF38BDF8.toInt())
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                typeface = Typeface.DEFAULT_BOLD
            }
            val sub = TextView(this@CameraMissionActivity).apply {
                text = "Take matching target photo"
                setTextColor(Color.WHITE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
                typeface = Typeface.DEFAULT_BOLD
                setPadding(0, dp(2), 0, 0)
            }
            addView(title)
            addView(sub)
        }
        rootContainer.addView(
            header,
            FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(16), dp(36), dp(16), 0)
            },
        )

        // Torch Toggle Button
        val torchBtn = TextView(this).apply {
            text = "🔦"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0x80000000.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setOnClickListener {
                toggleTorch()
                setTextColor(if (isTorchOn) 0xFFFBBF24.toInt() else Color.WHITE)
            }
        }
        rootContainer.addView(
            torchBtn,
            FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.START).apply {
                setMargins(dp(16), dp(36), 0, 0)
            },
        )

        // Picture-in-Picture (PiP) Reference Thumbnail
        if (referencePath.isNotEmpty() && File(referencePath).exists()) {
            val pipBitmap = runCatching {
                val opts = BitmapFactory.Options().apply { inSampleSize = 4 }
                BitmapFactory.decodeFile(referencePath, opts)
            }.getOrNull()

            if (pipBitmap != null) {
                val pipContainer = FrameLayout(this).apply {
                    background = GradientDrawable().apply {
                        setColor(0xCC000000.toInt())
                        cornerRadius = dp(14).toFloat()
                        setStroke(dp(2), 0xFF38BDF8.toInt())
                    }
                    clipToOutline = true
                    setPadding(dp(3), dp(3), dp(3), dp(3))
                    val img = ImageView(this@CameraMissionActivity).apply {
                        setImageBitmap(pipBitmap)
                        scaleType = ImageView.ScaleType.CENTER_CROP
                    }
                    val badge = TextView(this@CameraMissionActivity).apply {
                        text = "TARGET"
                        setTextColor(Color.WHITE)
                        setTextSize(TypedValue.COMPLEX_UNIT_SP, 9f)
                        typeface = Typeface.DEFAULT_BOLD
                        background = GradientDrawable().apply {
                            setColor(0xCC0284C7.toInt())
                            cornerRadius = dp(6).toFloat()
                        }
                        setPadding(dp(6), dp(2), dp(6), dp(2))
                    }
                    addView(img, FrameLayout.LayoutParams(-1, -1))
                    addView(badge, FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                        bottomMargin = dp(4)
                    })
                }
                rootContainer.addView(
                    pipContainer,
                    FrameLayout.LayoutParams(dp(76), dp(100), Gravity.TOP or Gravity.END).apply {
                        setMargins(0, dp(36), dp(16), 0)
                    },
                )
            }
        }

        // Live Warning / Status Banner
        val statusBanner = TextView(this).apply {
            text = "Frame the object and press shutter"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0xD90E1116.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setPadding(dp(20), dp(10), dp(20), dp(10))
        }
        rootContainer.addView(
            statusBanner,
            FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(20), 0, dp(20), dp(116))
            },
        )

        // Shutter Button
        var isTakingShot = false
        val shutterBtn = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                setColor(Color.TRANSPARENT)
                shape = GradientDrawable.OVAL
                setStroke(dp(4), Color.WHITE)
            }
            val inner = View(this@CameraMissionActivity).apply {
                background = GradientDrawable().apply {
                    setColor(Color.WHITE)
                    shape = GradientDrawable.OVAL
                }
            }
            addView(inner, FrameLayout.LayoutParams(dp(60), dp(60), Gravity.CENTER))
        }
        rootContainer.addView(
            shutterBtn,
            FrameLayout.LayoutParams(dp(76), dp(76), Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                bottomMargin = dp(24)
            },
        )

        val capture = ImageCapture.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_16_9)
            .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
            .build()
        imageCapture = capture

        shutterBtn.setOnClickListener {
            if (isTakingShot || isFinished) return@setOnClickListener
            isTakingShot = true
            statusBanner.text = "Comparing photo similarity..."
            statusBanner.setTextColor(0xFF38BDF8.toInt())

            val captureFile = File(getExternalFilesDir("missions"), "shot-${System.currentTimeMillis()}.jpg")
            captureFile.parentFile?.mkdirs()
            val options = ImageCapture.OutputFileOptions.Builder(captureFile).build()

            capture.takePicture(options, cameraExecutor, object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    val capturedPath = captureFile.absolutePath
                    val score = if (referencePath.isNotEmpty() && File(referencePath).exists()) {
                        PhotoMatcher.similarityPercent(referencePath, capturedPath)
                    } else 100

                    mainHandler.post {
                        val passed = (score >= threshold)
                        if (passed) {
                            isFinished = true
                            playBeep(true)
                            vibrateFeedback("success")
                            statusBanner.text = "Photo Matched! $score% ✓"
                            statusBanner.setTextColor(0xFF34D399.toInt())
                            statusBanner.background = GradientDrawable().apply {
                                setColor(0xEE064E3B.toInt())
                                cornerRadius = dp(20).toFloat()
                            }
                            mainHandler.postDelayed({
                                val data = Intent().apply {
                                    putExtra(EXTRA_PATH, capturedPath)
                                    putExtra(EXTRA_SCORE, score)
                                    putExtra(EXTRA_COMPLETED, true)
                                }
                                setResult(Activity.RESULT_OK, data)
                                finish()
                            }, 450)
                        } else {
                            isTakingShot = false
                            vibrateFeedback("error")
                            statusBanner.text = "Match $score% (Needed $threshold%)\nAlign closer with reference photo"
                            statusBanner.setTextColor(0xFFF87171.toInt())
                            statusBanner.background = GradientDrawable().apply {
                                setColor(0xEE450A0A.toInt())
                                cornerRadius = dp(20).toFloat()
                            }
                        }
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    mainHandler.post {
                        isTakingShot = false
                        statusBanner.text = "Capture failed, try again"
                        statusBanner.setTextColor(0xFFF87171.toInt())
                    }
                }
            })
        }

        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            val preview = Preview.Builder().setTargetAspectRatio(AspectRatio.RATIO_16_9).build()
            preview.surfaceProvider = previewView.surfaceProvider

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(this, selector, preview, capture)
                cameraControl = camera?.cameraControl
            } catch (e: Exception) {
                Log.e(TAG, "Photo camera bind error", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    // =========================================================================
    // 5. PHOTO REGISTRATION FLOW
    // =========================================================================

    private fun buildPhotoRegisterFlow() {
        val reticleView = PhotoReticleView(this)
        rootContainer.addView(reticleView, FrameLayout.LayoutParams(-1, -1))

        val header = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            background = GradientDrawable().apply {
                setColor(0xB310151E.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setPadding(dp(20), dp(10), dp(20), dp(10))
            val title = TextView(this@CameraMissionActivity).apply {
                text = "REGISTER REFERENCE PHOTO 📸"
                setTextColor(0xFF38BDF8.toInt())
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
                typeface = Typeface.DEFAULT_BOLD
            }
            val sub = TextView(this@CameraMissionActivity).apply {
                text = "Frame your target item clearly"
                setTextColor(Color.WHITE)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
                typeface = Typeface.DEFAULT_BOLD
                setPadding(0, dp(2), 0, 0)
            }
            addView(title)
            addView(sub)
        }
        rootContainer.addView(
            header,
            FrameLayout.LayoutParams(-2, -2, Gravity.TOP or Gravity.CENTER_HORIZONTAL).apply {
                setMargins(dp(16), dp(36), dp(16), 0)
            },
        )

        val closeBtn = TextView(this).apply {
            text = "✕"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(0x80000000.toInt())
                cornerRadius = dp(20).toFloat()
            }
            setOnClickListener { finishCancelled("register_cancelled") }
        }
        rootContainer.addView(
            closeBtn,
            FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.END).apply {
                setMargins(0, dp(36), dp(16), 0)
            },
        )

        val shutterBtn = FrameLayout(this).apply {
            background = GradientDrawable().apply {
                setColor(Color.TRANSPARENT)
                shape = GradientDrawable.OVAL
                setStroke(dp(4), Color.WHITE)
            }
            val inner = View(this@CameraMissionActivity).apply {
                background = GradientDrawable().apply {
                    setColor(Color.WHITE)
                    shape = GradientDrawable.OVAL
                }
            }
            addView(inner, FrameLayout.LayoutParams(dp(60), dp(60), Gravity.CENTER))
        }
        rootContainer.addView(
            shutterBtn,
            FrameLayout.LayoutParams(dp(76), dp(76), Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL).apply {
                bottomMargin = dp(28)
            },
        )

        val capture = ImageCapture.Builder()
            .setTargetAspectRatio(AspectRatio.RATIO_16_9)
            .build()
        imageCapture = capture

        shutterBtn.setOnClickListener {
            val captureFile = File(getExternalFilesDir("references"), "ref-${System.currentTimeMillis()}.jpg")
            captureFile.parentFile?.mkdirs()
            val options = ImageCapture.OutputFileOptions.Builder(captureFile).build()

            capture.takePicture(options, cameraExecutor, object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    mainHandler.post {
                        playBeep(true)
                        vibrateFeedback("success")
                        val data = Intent().apply {
                            putExtra(EXTRA_PATH, captureFile.absolutePath)
                            putExtra(EXTRA_COMPLETED, true)
                        }
                        setResult(Activity.RESULT_OK, data)
                        finish()
                    }
                }

                override fun onError(exception: ImageCaptureException) {
                    mainHandler.post {
                        vibrateFeedback("error")
                    }
                }
            })
        }

        val providerFuture = ProcessCameraProvider.getInstance(this)
        providerFuture.addListener({
            val provider = providerFuture.get()
            val selector = CameraSelector.DEFAULT_BACK_CAMERA
            val preview = Preview.Builder().setTargetAspectRatio(AspectRatio.RATIO_16_9).build()
            preview.surfaceProvider = previewView.surfaceProvider

            try {
                provider.unbindAll()
                camera = provider.bindToLifecycle(this, selector, preview, capture)
                cameraControl = camera?.cameraControl
            } catch (e: Exception) {
                Log.e(TAG, "Photo register camera bind error", e)
            }
        }, ContextCompat.getMainExecutor(this))
    }

    private fun finishCancelled(reason: String) {
        val data = Intent().apply { putExtra(EXTRA_REASON, reason) }
        setResult(Activity.RESULT_CANCELED, data)
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        cameraExecutor.shutdown()
        toneGenerator?.release()
        toneGenerator = null
    }

    // =========================================================================
    // CUSTOM OVERLAY VIEWS
    // =========================================================================

    /** Draws skeleton bones and joint landmarks over the live preview. */
    private class SkeletonView(context: Context) : View(context) {
        private var pose: Pose? = null
        private var frameW = 1
        private var frameH = 1
        private var mirrored = false
        private var isDeep = false

        private val bonePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            strokeWidth = 10f
            strokeCap = Paint.Cap.ROUND
        }
        private val jointPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            color = Color.WHITE
        }

        fun update(newPose: Pose?, width: Int, height: Int, mirror: Boolean, deep: Boolean) {
            pose = newPose
            frameW = width
            frameH = height
            mirrored = mirror
            isDeep = deep
            bonePaint.color = if (deep) 0xFF34D399.toInt() else 0xFF38BDF8.toInt()
            invalidate()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val p = pose ?: return
            if (frameW <= 0 || frameH <= 0 || width <= 0 || height <= 0) return

            val scale = max(width / frameW.toFloat(), height / frameH.toFloat())
            val dx = (width - frameW * scale) / 2f
            val dy = (height - frameH * scale) / 2f

            fun tx(rawX: Float): Float =
                (dx + rawX * scale).let { if (mirrored) width - it else it }
            fun ty(rawY: Float): Float = dy + rawY * scale

            val bones = listOf(
                PoseLandmark.LEFT_SHOULDER to PoseLandmark.RIGHT_SHOULDER,
                PoseLandmark.LEFT_SHOULDER to PoseLandmark.LEFT_ELBOW,
                PoseLandmark.LEFT_ELBOW to PoseLandmark.LEFT_WRIST,
                PoseLandmark.RIGHT_SHOULDER to PoseLandmark.RIGHT_ELBOW,
                PoseLandmark.RIGHT_ELBOW to PoseLandmark.RIGHT_WRIST,
                PoseLandmark.LEFT_SHOULDER to PoseLandmark.LEFT_HIP,
                PoseLandmark.RIGHT_SHOULDER to PoseLandmark.RIGHT_HIP,
                PoseLandmark.LEFT_HIP to PoseLandmark.RIGHT_HIP,
                PoseLandmark.LEFT_HIP to PoseLandmark.LEFT_KNEE,
                PoseLandmark.LEFT_KNEE to PoseLandmark.LEFT_ANKLE,
                PoseLandmark.RIGHT_HIP to PoseLandmark.RIGHT_KNEE,
                PoseLandmark.RIGHT_KNEE to PoseLandmark.RIGHT_ANKLE,
            )

            for ((startType, endType) in bones) {
                val lmStart = p.getPoseLandmark(startType) ?: continue
                val lmEnd = p.getPoseLandmark(endType) ?: continue
                if (lmStart.inFrameLikelihood < 0.35f || lmEnd.inFrameLikelihood < 0.35f) continue
                canvas.drawLine(tx(lmStart.position.x), ty(lmStart.position.y), tx(lmEnd.position.x), ty(lmEnd.position.y), bonePaint)
            }

            val joints = listOf(
                PoseLandmark.LEFT_SHOULDER, PoseLandmark.RIGHT_SHOULDER,
                PoseLandmark.LEFT_ELBOW, PoseLandmark.RIGHT_ELBOW,
                PoseLandmark.LEFT_WRIST, PoseLandmark.RIGHT_WRIST,
                PoseLandmark.LEFT_HIP, PoseLandmark.RIGHT_HIP,
                PoseLandmark.LEFT_KNEE, PoseLandmark.RIGHT_KNEE,
                PoseLandmark.LEFT_ANKLE, PoseLandmark.RIGHT_ANKLE,
            )
            for (jt in joints) {
                val lm = p.getPoseLandmark(jt) ?: continue
                if (lm.inFrameLikelihood < 0.35f) continue
                canvas.drawCircle(tx(lm.position.x), ty(lm.position.y), 10f, jointPaint)
            }
        }
    }

    /** Viewfinder box with corner brackets and animated scanner laser for barcodes. */
    private class BarcodeReticleView(context: Context) : View(context) {
        private var isSuccess = false
        private var scanLineY = 0f
        private var scanDown = true

        private val bracketPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            strokeWidth = 8f
            style = Paint.Style.STROKE
            color = 0xFF38BDF8.toInt()
        }
        private val laserPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            strokeWidth = 4f
            color = 0xFF38BDF8.toInt()
        }

        fun setSuccess(success: Boolean) {
            isSuccess = success
            bracketPaint.color = if (success) 0xFF34D399.toInt() else 0xFF38BDF8.toInt()
            laserPaint.color = bracketPaint.color
            invalidate()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val boxSize = width.coerceAtMost(height) * 0.72f
            val left = (width - boxSize) / 2f
            val top = (height - boxSize) / 2f
            val right = left + boxSize
            val bottom = top + boxSize
            val cornerLen = 42f

            // 4 corners
            canvas.drawLine(left, top, left + cornerLen, top, bracketPaint)
            canvas.drawLine(left, top, left, top + cornerLen, bracketPaint)

            canvas.drawLine(right, top, right - cornerLen, top, bracketPaint)
            canvas.drawLine(right, top, right, top + cornerLen, bracketPaint)

            canvas.drawLine(left, bottom, left + cornerLen, bottom, bracketPaint)
            canvas.drawLine(left, bottom, left, bottom - cornerLen, bracketPaint)

            canvas.drawLine(right, bottom, right - cornerLen, bottom, bracketPaint)
            canvas.drawLine(right, bottom, right, bottom - cornerLen, bracketPaint)

            // Animated Laser Line
            if (!isSuccess) {
                if (scanLineY < top || scanLineY > bottom) scanLineY = top
                canvas.drawLine(left + 10f, scanLineY, right - 10f, scanLineY, laserPaint)
                scanLineY += if (scanDown) 6f else -6f
                if (scanLineY >= bottom - 10f) scanDown = false
                if (scanLineY <= top + 10f) scanDown = true
                postInvalidateDelayed(16)
            }
        }
    }

    /** Reticle overlay for photo capture. */
    private class PhotoReticleView(context: Context) : View(context) {
        private val reticlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            strokeWidth = 4f
            style = Paint.Style.STROKE
            color = 0x80FFFFFF.toInt()
        }

        override fun onDraw(canvas: Canvas) {
            super.onDraw(canvas)
            val boxW = width * 0.82f
            val boxH = boxW * 1.0f
            val left = (width - boxW) / 2f
            val top = (height - boxH) / 2.2f
            val right = left + boxW
            val bottom = top + boxH
            val corner = 32f

            canvas.drawLine(left, top, left + corner, top, reticlePaint)
            canvas.drawLine(left, top, left, top + corner, reticlePaint)

            canvas.drawLine(right, top, right - corner, top, reticlePaint)
            canvas.drawLine(right, top, right, top + corner, reticlePaint)

            canvas.drawLine(left, bottom, left + corner, bottom, reticlePaint)
            canvas.drawLine(left, bottom, left, bottom - corner, reticlePaint)

            canvas.drawLine(right, bottom, right - corner, bottom, reticlePaint)
            canvas.drawLine(right, bottom, right, bottom - corner, reticlePaint)
        }
    }
}
