package com.alarmyclone.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.alarmyclone.MainActivity
import java.util.Calendar

object AlarmScheduler {
    private const val TAG = "AlarmScheduler"
    const val EXTRA_ALARM_ID = "extra_alarm_id"

    fun canScheduleExactAlarms(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            alarmManager?.canScheduleExactAlarms() ?: false
        } else {
            true
        }
    }

    fun schedule(context: Context, alarm: AlarmModel) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        // Compute next occurrence
        val triggerTimeMs = calculateNextOccurrence(alarm)
        alarm.triggerTimeMs = triggerTimeMs
        AlarmStorage.saveAlarm(context, alarm)

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(EXTRA_ALARM_ID, alarm.id)
        }

        val requestCode = alarm.id.hashCode()
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags)

        // PendingIntent to launch app when clicking alarm info
        val showIntent = Intent(context, MainActivity::class.java).apply {
            setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val showPendingIntent = PendingIntent.getActivity(
            context,
            requestCode,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerTimeMs, showPendingIntent)
                alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
                Log.d(TAG, "Scheduled alarm clock for ${alarm.id} at $triggerTimeMs")
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTimeMs, pendingIntent)
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Exact alarm permission denied when scheduling ${alarm.id}", e)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule alarm ${alarm.id}", e)
        }
    }

    fun cancel(context: Context, alarmId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(EXTRA_ALARM_ID, alarmId)
        }
        val requestCode = alarmId.hashCode()
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags)

        alarmManager.cancel(pendingIntent)
        AlarmStorage.removeAlarm(context, alarmId)
        Log.d(TAG, "Cancelled alarm $alarmId")
    }

    fun rescheduleAll(context: Context) {
        val alarms = AlarmStorage.getAllAlarms(context)
        Log.d(TAG, "Rescheduling ${alarms.size} alarms")
        for (alarm in alarms) {
            if (alarm.enabled) {
                schedule(context, alarm)
            }
        }
    }

    /**
     * Calculate next trigger timestamp strictly after current time
     */
    fun calculateNextOccurrence(alarm: AlarmModel): Long {
        val now = Calendar.getInstance()
        val candidate = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, alarm.hour)
            set(Calendar.MINUTE, alarm.minute)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        // If one-time alarm
        if (alarm.repeatDays.isEmpty()) {
            if (candidate.timeInMillis <= now.timeInMillis) {
                candidate.add(Calendar.DAY_OF_YEAR, 1)
            }
            return candidate.timeInMillis
        }

        // Repeat days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        for (offset in 0..7) {
            val check = Calendar.getInstance().apply {
                timeInMillis = candidate.timeInMillis
                add(Calendar.DAY_OF_YEAR, offset)
            }
            // Calendar.DAY_OF_WEEK: Sunday = 1, Saturday = 7 -> convert to 0..6
            val dayOfWeek = check.get(Calendar.DAY_OF_WEEK) - 1
            if (alarm.repeatDays.contains(dayOfWeek)) {
                if (check.timeInMillis > now.timeInMillis) {
                    return check.timeInMillis
                }
            }
        }

        candidate.add(Calendar.DAY_OF_YEAR, 1)
        return candidate.timeInMillis
    }
}

