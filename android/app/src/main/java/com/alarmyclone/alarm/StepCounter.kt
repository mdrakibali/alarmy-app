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
    private val stepDetectorSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_DETECTOR)
    private val stepCounterSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    private val accelSensor = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    private var activeSensor: Sensor? = null
    private var baseline: Float? = null
    private var detectedSteps = 0

    // Human walking gait analysis (filters out bed shaking, phone tilting, and casual hand movement)
    private var gravityX = 0f
    private var gravityY = 9.8f
    private var gravityZ = 0f
    private var hasGravityInit = false

    private var isWaveHigh = false
    private var lastStepTimeMs = 0L
    private var consecutiveStrides = 0

    fun start(): Boolean {
        if (sensorManager == null) {
            onUnavailable()
            return false
        }

        // Prioritize real-time hardware walking detector: STEP_DETECTOR -> STEP_COUNTER -> ACCELEROMETER
        val candidate = stepDetectorSensor ?: stepCounterSensor ?: accelSensor
        if (candidate == null) {
            onUnavailable()
            return false
        }

        activeSensor = candidate
        val rate = if (candidate.type == Sensor.TYPE_ACCELEROMETER) {
            SensorManager.SENSOR_DELAY_GAME
        } else {
            SensorManager.SENSOR_DELAY_FASTEST
        }

        val ok = sensorManager.registerListener(this, candidate, rate)
        if (!ok) {
            onUnavailable()
        }
        return ok
    }

    fun stop() {
        sensorManager?.unregisterListener(this)
        hasGravityInit = false
        consecutiveStrides = 0
        isWaveHigh = false
    }

    override fun onSensorChanged(event: SensorEvent) {
        when (event.sensor.type) {
            Sensor.TYPE_STEP_DETECTOR -> {
                // Hardware step detector: ASIC calibrated by Android & chip manufacturer for true human walking steps
                if (event.values.firstOrNull() == 1.0f) {
                    detectedSteps += 1
                    onSteps(detectedSteps)
                }
            }
            Sensor.TYPE_STEP_COUNTER -> {
                val total = event.values.firstOrNull() ?: return
                val start = baseline
                if (start == null) {
                    baseline = total
                    onSteps(0)
                    return
                }
                val count = (total - start).toInt().coerceAtLeast(0)
                if (count > detectedSteps) {
                    detectedSteps = count
                    onSteps(detectedSteps)
                }
            }
            Sensor.TYPE_ACCELEROMETER -> {
                val x = event.values[0]
                val y = event.values[1]
                val z = event.values[2]

                // 1. Separate Earth gravity vector from dynamic body movement using Low-Pass Filter
                val alpha = 0.85f
                if (!hasGravityInit) {
                    gravityX = x
                    gravityY = y
                    gravityZ = z
                    hasGravityInit = true
                } else {
                    gravityX = alpha * gravityX + (1f - alpha) * x
                    gravityY = alpha * gravityY + (1f - alpha) * y
                    gravityZ = alpha * gravityZ + (1f - alpha) * z
                }

                val gMag = sqrt((gravityX * gravityX + gravityY * gravityY + gravityZ * gravityZ).toDouble()).toFloat()
                if (gMag < 1.0f) return

                // 2. Linear acceleration (body motion without gravity)
                val linX = x - gravityX
                val linY = y - gravityY
                val linZ = z - gravityZ

                // 3. Project dynamic motion onto gravity vector -> True vertical acceleration (heel-strike ground reaction)
                // Moving phone forward and backward in bed produces negligible vertical acceleration.
                val verticalAcc = (linX * gravityX + linY * gravityY + linZ * gravityZ) / gMag

                val now = System.currentTimeMillis()
                val dt = now - lastStepTimeMs

                // 4. Human walking gait cadence window (330ms to 1150ms per step, equivalent to 0.9Hz - 3.0Hz)
                if (verticalAcc > 1.35f && !isWaveHigh) {
                    if (dt in 330..1150) {
                        consecutiveStrides++
                        isWaveHigh = true
                        lastStepTimeMs = now

                        // Anti-cheat: Require at least 2 consecutive rhythmic strides before committing steps
                        if (consecutiveStrides >= 2) {
                            val add = if (consecutiveStrides == 2) 2 else 1
                            detectedSteps += add
                            onSteps(detectedSteps)
                        }
                    } else if (dt > 1150) {
                        // User paused walking; reset consecutive stride counter
                        consecutiveStrides = 1
                        isWaveHigh = true
                        lastStepTimeMs = now
                    }
                } else if (verticalAcc < -0.6f && isWaveHigh) {
                    // Gait cycle trough (foot lift-off), ready for the next heel strike
                    isWaveHigh = false
                }
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
