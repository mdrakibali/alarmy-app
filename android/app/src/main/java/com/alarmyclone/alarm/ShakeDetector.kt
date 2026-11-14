package com.alarmyclone.alarm

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlin.math.sqrt

class ShakeDetector(
    context: Context,
    private val onShakeListener: () -> Unit
) : SensorEventListener {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val accelerometer = sensorManager?.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)

    private var lastShakeTimestamp: Long = 0
    private var isListening = false

    companion object {
        // Minimum acceleration force to count as a shake (in Gs, where 1G = 9.8m/s²)
        private const val SHAKE_THRESHOLD_GRAVITY = 1.9f
        // Minimum time gap between two recognized shakes in milliseconds
        private const val SHAKE_SLOP_TIME_MS = 250
    }

    fun start(): Boolean {
        if (isListening) return true
        if (sensorManager == null || accelerometer == null) return false

        val registered = sensorManager.registerListener(
            this,
            accelerometer,
            SensorManager.SENSOR_DELAY_GAME
        )
        isListening = registered
        return registered
    }

    fun stop() {
        if (!isListening) return
        sensorManager?.unregisterListener(this)
        isListening = false
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || event.sensor.type != Sensor.TYPE_ACCELEROMETER) return

        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]

        val gX = x / SensorManager.GRAVITY_EARTH
        val gY = y / SensorManager.GRAVITY_EARTH
        val gZ = z / SensorManager.GRAVITY_EARTH

        // Total g-force magnitude
        val gForce = sqrt((gX * gX + gY * gY + gZ * gZ).toDouble()).toFloat()

        if (gForce > SHAKE_THRESHOLD_GRAVITY) {
            val now = System.currentTimeMillis()
            if (lastShakeTimestamp + SHAKE_SLOP_TIME_MS > now) {
                return
            }
            lastShakeTimestamp = now
            onShakeListener()
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // No-op
    }
}
