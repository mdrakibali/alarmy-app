package com.alarmyclone.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmActionReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_DISMISS = "com.alarmyclone.ACTION_DISMISS"
        const val ACTION_SNOOZE = "com.alarmyclone.ACTION_SNOOZE"
        private const val TAG = "AlarmActionReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val alarmId = intent.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID) ?: return
        Log.d(TAG, "Received action: ${intent.action} for alarm: $alarmId")

        when (intent.action) {
            ACTION_DISMISS -> {
                AlarmService.stop(context)
            }
            ACTION_SNOOZE -> {
                val alarm = AlarmStorage.getAlarm(context, alarmId)
                val intervalMin = alarm?.snoozeIntervalMin ?: 5
                val snoozeTimeMs = System.currentTimeMillis() + (intervalMin * 60 * 1000L)

                // Reschedule for snooze time
                alarm?.let {
                    val snoozedAlarm = it.copy(triggerTimeMs = snoozeTimeMs)
                    AlarmScheduler.schedule(context, snoozedAlarm)
                }

                // Stop current ringing
                AlarmService.stop(context)
            }
        }
    }
}

