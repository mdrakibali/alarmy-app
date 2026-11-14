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

    fun schedule(
        context: Context,
        alarm: AlarmModel,
        explicitTriggerTimeMs: Long? = null,
        recalculateWallClock: Boolean = false,
    ): Boolean {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return false
        if (!canScheduleExactAlarms(context)) {
            Log.e(TAG, "Exact alarm permission missing for ${alarm.id}")
            val stored = AlarmStorage.saveAlarm(context, alarm.copy(enabled = false))
            cancelPending(context, alarm.id, stored.requestCode)
            return false
        }

        val now = System.currentTimeMillis()
        val keepSnoozeInstant = alarm.snoozeUsed > 0 && alarm.triggerTimeMs > now && !recalculateWallClock
        val triggerTimeMs = when {
            explicitTriggerTimeMs != null && explicitTriggerTimeMs > now -> explicitTriggerTimeMs
            keepSnoozeInstant -> alarm.triggerTimeMs
            else -> calculateNextOccurrence(alarm)
        }
        val prepared = alarm.copy(
            triggerTimeMs = triggerTimeMs,
            snoozeUsed = if (explicitTriggerTimeMs != null) alarm.snoozeUsed else 0,
        )
        val stored = AlarmStorage.saveAlarm(context, prepared)

        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(EXTRA_ALARM_ID, stored.id)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getBroadcast(context, stored.requestCode, intent, flags)
        cancelLegacyHashPending(context, stored.id)

        val showIntent = Intent(context, MainActivity::class.java).apply {
            setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val showPendingIntent = PendingIntent.getActivity(
            context,
            stored.requestCode,
            showIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return try {
            val alarmClockInfo = AlarmManager.AlarmClockInfo(triggerTimeMs, showPendingIntent)
            alarmManager.setAlarmClock(alarmClockInfo, pendingIntent)
            Log.d(TAG, "Scheduled alarm clock for ${stored.id} code=${stored.requestCode} at $triggerTimeMs")
            true
        } catch (e: SecurityException) {
            Log.e(TAG, "Exact alarm permission denied when scheduling ${stored.id}", e)
            AlarmStorage.saveAlarm(context, stored.copy(enabled = false))
            false
        } catch (e: Exception) {
            Log.e(TAG, "Failed to schedule alarm ${stored.id}", e)
            AlarmStorage.saveAlarm(context, stored.copy(enabled = false))
            false
        }
    }

    fun cancel(context: Context, alarmId: String) {
        val existing = AlarmStorage.getAlarm(context, alarmId)
        cancelPending(context, alarmId, existing?.requestCode ?: 0)
        AlarmStorage.removeAlarm(context, alarmId)
        Log.d(TAG, "Cancelled alarm $alarmId")
    }

    private fun cancelPending(context: Context, alarmId: String, requestCode: Int) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(EXTRA_ALARM_ID, alarmId)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        if (requestCode != 0) {
            alarmManager.cancel(PendingIntent.getBroadcast(context, requestCode, intent, flags))
        }
        cancelLegacyHashPending(context, alarmId)
    }

    private fun cancelLegacyHashPending(context: Context, alarmId: String) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, AlarmReceiver::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_TRIGGER
            putExtra(EXTRA_ALARM_ID, alarmId)
        }
        val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        alarmManager.cancel(PendingIntent.getBroadcast(context, alarmId.hashCode(), intent, flags))
    }

    fun scheduleSnooze(context: Context, alarmId: String, intervalMin: Int): Boolean {
        val alarm = AlarmStorage.getAlarm(context, alarmId) ?: return false
        if (!alarm.snoozeEnabled) return false
        if (alarm.snoozeUsed >= alarm.snoozeMaxCount) {
            Log.d(TAG, "Snooze cap reached for $alarmId (${alarm.snoozeUsed}/${alarm.snoozeMaxCount})")
            return false
        }
        val delayMs = intervalMin.coerceAtLeast(1) * 60 * 1000L
        val snoozeTriggerTime = System.currentTimeMillis() + delayMs
        val snoozed = alarm.copy(snoozeUsed = alarm.snoozeUsed + 1, triggerTimeMs = snoozeTriggerTime)
        val ok = schedule(context, snoozed, explicitTriggerTimeMs = snoozeTriggerTime)
        Log.d(TAG, "Snooze $alarmId result=$ok used=${snoozed.snoozeUsed}")
        return ok
    }

    fun rescheduleAll(context: Context, recalculateWallClock: Boolean = false) {
        val alarms = AlarmStorage.getAllAlarms(context)
        Log.d(TAG, "Rescheduling ${alarms.size} alarms recalculate=$recalculateWallClock")
        for (alarm in alarms) {
            if (alarm.enabled) {
                schedule(context, alarm, recalculateWallClock = recalculateWallClock)
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

