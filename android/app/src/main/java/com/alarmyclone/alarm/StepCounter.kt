package com.alarmyclone.alarm

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class StepCounter(
    context: Context,
    private val onSteps: (Int) -> Unit,
    private val onUnavailable: () -> Unit,
) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val stepCounterSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    private val stepDetectorSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    private val accelSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    private var activeSensor: Sensor? = null
    private var baseline: Float? = null
    private var detectedSteps = 0

    // Accelerometer peak detection variables
    private var isPeaking = false
    private var lastStepTimeMs = 0L

    fun start(): Boolean {
        if (sensorManager == null) {
            onUnavailable()
            return false
        }

        // Try in order: STEP_COUNTER -> STEP_DETECTOR -> ACCELEROMETER
        val candidate = stepCounterSensor ?: stepDetectorSensor ?: accelSensor
        if (candidate == null) {
            onUnavailable()
            return false
        }

        activeSensor = candidate
        val rate = if (candidate.type == Sensor.TYPE_ACCELEROMETER) {
            SensorManager.SENSOR_DELAY_GAME
        } else {
            SensorManager.SENSOR_DELAY_UI
        }

        val ok = sensorManager.registerListener(this, candidate, rate)
        if (!ok) {
            onUnavailable()
        }
        return ok
    }

    fun stop() {
        sensorManager?.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_STEP_COUNTER -> {
                val total = event.values.firstOrNull() ?: return
                val start = baseline
                if (start == null) {
                    baseline = total
                    onSteps(0)
                    return
                }
                val count = (total - start).toInt().coerceAtLeast(0)
                onSteps(count)
            }
            Sensor.TYPE_STEP_DETECTOR -> {
                if (event.values.firstOrNull() == 1.0f) {
                    detectedSteps += 1
                    onSteps(detectedSteps)
                }
            }
            Sensor.TYPE_ACCELEROMETER -> {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]
                val magnitude = sqrt((x * x + y * y + z * z).toDouble()).toFloat()

                val now = System.currentTimeMillis()
                // Walking cadence peak detection:
                // Threshold ~11.8 m/s^2, minimum 300ms between steps to filter out slight shakes
                if (magnitude > 11.8f && !isPeaking && (now - lastStepTimeMs > 300)) {
                    isPeaking = true
                    lastStepTimeMs = now
                    detectedSteps += 1
                    onSteps(detectedSteps)
                } else if (magnitude < 9.6f) {
                    isPeaking = false
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
