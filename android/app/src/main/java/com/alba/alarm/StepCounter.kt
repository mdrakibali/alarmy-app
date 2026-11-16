package com.alba.alarm

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import android.os.SystemClock

class StepCounter(
    private val context: Context,
    private val onSteps: (Int) -> Unit,
    private val onUnavailable: () -> Unit,
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val walkCounter = WalkCounter()
    private var isListening = false
    private var totalSteps = 0
    private var lastDetectorStep = -1L
    private var listeningSince = 0L

    fun start(): Boolean {
        if (sensorManager == null) {
            onUnavailable()
            return false
        }
        if (isListening) return true

        walkCounter.resetAll()
        totalSteps = 0
        lastDetectorStep = -1L
        listeningSince = SystemClock.elapsedRealtime()

        val hasActivityPermission = Build.VERSION.SDK_INT < 29 ||
                context.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED

        val stepDetector = if (hasActivityPermission) {
            sensorManager.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
        } else null

        isListening = try {
            stepDetector != null && sensorManager.registerListener(
                this,
                stepDetector,
                SensorManager.SENSOR_DELAY_NORMAL,
            )
        } catch (_: SecurityException) {
            false
        }

        if (!isListening) {
            val accel = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            isListening = accel != null && sensorManager.registerListener(
                this,
                accel,
                20_000, // 50 Hz
            )
        }

        if (!isListening) {
            onUnavailable()
            return false
        }
        return true
    }

    fun stop() {
        if (!isListening) return
        sensorManager?.unregisterListener(this)
        isListening = false
        walkCounter.resetMotion()
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (!isListening) return
        val now = event.timestamp / 1_000_000L
        if (now < listeningSince) return

        val isStep = if (event.sensor.type == Sensor.TYPE_STEP_DETECTOR) {
            val val0 = event.values.firstOrNull() ?: 0f
            if (val0 != 1f || (lastDetectorStep >= 0 && now - lastDetectorStep < 250L)) {
                false
            } else {
                lastDetectorStep = now
                true
            }
        } else {
            walkCounter.update(event.values[0], event.values[1], event.values[2], now) == 1
        }

        if (isStep) {
            totalSteps++
            onSteps(totalSteps)
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
