package com.alba.alarm

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.SystemClock
import android.util.Log

/**
 * High-precision Flip detector using Android's Gravity / Accelerometer sensor.
 * Detects transitions between screen face-up and screen face-down.
 * 
 * Logic:
 *  - Face Up: Z-axis > 6.5 m/s²
 *  - Face Down: Z-axis < -6.5 m/s²
 * 
 * One complete flip requires:
 *   Face Up -> Face Down -> Face Up (or vice-versa), with min 300ms debounce to prevent shaking cheats.
 */
class FlipDetector(
    context: Context,
    private val onFlip: (flipCount: Int, isFaceDown: Boolean) -> Unit
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val sensor: Sensor? = sensorManager?.getDefaultSensor(Sensor.TYPE_GRAVITY)
        ?: sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    private var currentCount = 0
    private var isFaceDown = false
    private var lastFlipTimeMs = 0L

    companion object {
        private const val TAG = "FlipDetector"
        private const val FACE_DOWN_THRESHOLD = -6.5f
        private const val FACE_UP_THRESHOLD = 6.5f
        private const val MIN_FLIP_INTERVAL_MS = 350L // Prevents rapid shaking cheats
    }

    fun start() {
        if (sensor == null) {
            Log.w(TAG, "No Accelerometer or Gravity sensor found on device")
            return
        }
        currentCount = 0
        isFaceDown = false
        lastFlipTimeMs = 0L
        sensorManager?.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
        Log.d(TAG, "FlipDetector started")
    }

    fun stop() {
        sensorManager?.unregisterListener(this)
        Log.d(TAG, "FlipDetector stopped")
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return

        val z = event.values[2]
        val now = SystemClock.elapsedRealtime()

        if (!isFaceDown && z < FACE_DOWN_THRESHOLD) {
            // Transitioned to Face Down
            if (now - lastFlipTimeMs > MIN_FLIP_INTERVAL_MS) {
                isFaceDown = true
                lastFlipTimeMs = now
                onFlip(currentCount, true)
            }
        } else if (isFaceDown && z > FACE_UP_THRESHOLD) {
            // Transitioned back to Face Up -> 1 Complete Flip!
            if (now - lastFlipTimeMs > MIN_FLIP_INTERVAL_MS) {
                isFaceDown = false
                lastFlipTimeMs = now
                currentCount++
                onFlip(currentCount, false)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}

