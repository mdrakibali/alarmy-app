package com.alba.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmActionReceiver : BroadcastReceiver() {
    companion object {
        const val ACTION_DISMISS = "com.alba.ACTION_DISMISS"
        const val ACTION_SNOOZE = "com.alba.ACTION_SNOOZE"
        const val ACTION_DISMISS_SNOOZE = "com.alba.ACTION_DISMISS_SNOOZE"
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
                AlarmScheduler.scheduleSnooze(context, alarmId, intervalMin)
                AlarmService.stop(context)
            }
            ACTION_DISMISS_SNOOZE -> {
                AlarmScheduler.dismissSnooze(context, alarmId)
                AlarmModule.instance?.sendEvent("onSnoozeDismissed", alarmId)
            }
        }
    }
}

