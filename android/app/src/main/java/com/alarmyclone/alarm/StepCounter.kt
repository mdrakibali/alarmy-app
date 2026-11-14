package com.alarmyclone.alarm

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager

class StepCounter(
    context: Context,
    private val onSteps: (Int) -> Unit,
    private val onUnavailable: () -> Unit,
) : SensorEventListener {
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as? SensorManager
    private val sensor = sensorManager?.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
    private var baseline: Float? = null

    fun start(): Boolean {
        if (sensorManager == null || sensor == null) {
            onUnavailable()
            return false
        }
        val ok = sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_NORMAL)
        if (!ok) onUnavailable()
        return ok
    }

    fun stop() {
        sensorManager?.unregisterListener(this)
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type != Sensor.TYPE_STEP_COUNTER) return
        val total = event.values.firstOrNull() ?: return
        val start = baseline
        if (start == null) {
            baseline = total
            onSteps(0)
            return
        }
        onSteps((total - start).toInt().coerceAtLeast(0))
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit
}
