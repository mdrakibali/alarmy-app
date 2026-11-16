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
        private var wakeLock: PowerManager.WakeLock? = null

        fun releaseWakeLock() {
            try {
                wakeLock?.let {
                    if (it.isHeld) {
                        it.release()
                    }
                }
                wakeLock = null
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
        powerManager?.let {
            wakeLock = it.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK or PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "AlarmyClone:AlarmReceiverWakeLock"
            ).apply {
                acquire(3 * 60 * 1000L /* 3 minutes timeout */)
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

