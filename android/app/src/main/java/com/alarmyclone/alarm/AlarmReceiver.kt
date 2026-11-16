package com.alarmyclone.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.PowerManager
import android.util.Log
import androidx.core.content.ContextCompat
import com.alarmyclone.MainActivity

class AlarmReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_ALARM_TRIGGER = "com.alarmyclone.ALARM_TRIGGER"
        const val ACTION_ALARM_RINGING = "com.alarmyclone.ALARM_RINGING"
        private const val TAG = "AlarmReceiver"
        private val activeWakeLocks = java.util.concurrent.ConcurrentHashMap<String, PowerManager.WakeLock>()

        fun releaseWakeLock(alarmId: String? = null) {
            try {
                if (alarmId != null) {
                    activeWakeLocks.remove(alarmId)?.let {
                        if (it.isHeld) {
                            it.release()
                        }
                    }
                } else {
                    val iterator = activeWakeLocks.values.iterator()
                    while (iterator.hasNext()) {
                        val wl = iterator.next()
                        if (wl.isHeld) {
                            wl.release()
                        }
                        iterator.remove()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error releasing WakeLock", e)
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
        Log.d(TAG, "Alarm triggered for ID: $alarmId")

        // Acquire WakeLock to keep CPU awake while service starts
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        powerManager?.let { pm ->
            try {
                val wl = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                    "AlarmyClone:AlarmReceiver:$alarmId"
                ).apply {
                    setReferenceCounted(false)
                    acquire(3 * 60 * 1000L /* 3 minutes timeout */)
                }
                activeWakeLocks.put(alarmId, wl)?.let { oldWl ->
                    if (oldWl.isHeld) oldWl.release()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error acquiring WakeLock for $alarmId", e)
            }
        }

        val alarm = AlarmStorage.getAlarm(context, alarmId)

        // Cancel any active snooze notification since the alarm is now actively ringing
        AlarmScheduler.cancelSnoozeNotification(context)

        // Start Foreground Service that plays sound & vibration
        val serviceIntent = Intent(context, AlarmService::class.java).apply {
            putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
        }
        try {
            ContextCompat.startForegroundService(context, serviceIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start AlarmService", e)
        }

        // Start Activity to turn on screen and show ringing UI
        val activityIntent = Intent(context, MainActivity::class.java).apply {
            action = ACTION_ALARM_RINGING
            putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            setFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
        }
        try {
            context.startActivity(activityIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch MainActivity from receiver", e)
        }

        // If it's a repeating alarm, reschedule for next cycle; if one-time, disable
        alarm?.let {
            if (it.repeatDays.isNotEmpty()) {
                AlarmScheduler.schedule(context, it)
            } else {
                val updated = it.copy(enabled = false)
                AlarmStorage.saveAlarm(context, updated)
            }
        }
    }
}

