package com.alarmyclone.alarm

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.alarmyclone.MainActivity
import com.alarmyclone.R
import java.util.Calendar

object AlarmScheduler {
    private const val TAG = "AlarmScheduler"
    const val EXTRA_ALARM_ID = "extra_alarm_id"
    const val SNOOZE_NOTIFICATION_ID = 1002
    const val SNOOZE_CHANNEL_ID = "alarmy_snooze_channel"
    const val ACTION_OPEN_SNOOZE = "com.alarmyclone.OPEN_SNOOZE"
    const val EXTRA_SNOOZE_TRIGGER_MS = "snoozeTriggerMs"
    const val EXTRA_SNOOZE_INTERVAL = "snoozeInterval"

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
            snoozeUsed = if (explicitTriggerTimeMs != null || keepSnoozeInstant) alarm.snoozeUsed else 0,
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
        cancelSnoozeNotification(context)
        AlarmStorage.removeAlarm(context, alarmId)
        Log.d(TAG, "Cancelled alarm $alarmId")
    }

    fun disable(context: Context, alarmId: String, model: AlarmModel? = null) {
        val existing = AlarmStorage.getAlarm(context, alarmId)
        val code = model?.requestCode ?: existing?.requestCode ?: 0
        cancelPending(context, alarmId, code)
        cancelSnoozeNotification(context)
        val toSave = (model ?: existing)?.copy(enabled = false, snoozeUsed = 0)
        if (toSave != null) {
            AlarmStorage.saveAlarm(context, toSave)
        }
        Log.d(TAG, "Disabled alarm $alarmId (preserved in database)")
    }

    fun dismissSnooze(context: Context, alarmId: String): Boolean {
        cancelSnoozeNotification(context)
        val existing = AlarmStorage.getAlarm(context, alarmId)
        if (existing != null) {
            cancelPending(context, alarmId, existing.requestCode)
            AlarmService.stop(context)
            if (existing.repeatDays.isNotEmpty()) {
                schedule(context, existing.copy(snoozeUsed = 0), recalculateWallClock = true)
            } else {
                AlarmStorage.saveAlarm(context, existing.copy(enabled = false, snoozeUsed = 0))
            }
            Log.d(TAG, "Safely dismissed snooze for $alarmId (repeating=${existing.repeatDays.isNotEmpty()})")
            return true
        } else {
            cancelLegacyHashPending(context, alarmId)
            AlarmService.stop(context)
            return false
        }
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
        if (ok) {
            showSnoozeNotification(context, snoozed, snoozeTriggerTime, intervalMin)
        }
        Log.d(TAG, "Snooze $alarmId result=$ok used=${snoozed.snoozeUsed}")
        return ok
    }

    fun showSnoozeNotification(
        context: Context,
        alarm: AlarmModel,
        snoozeTriggerTimeMs: Long,
        intervalMin: Int
    ) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                SNOOZE_CHANNEL_ID,
                "Snoozed Alarms",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notification shown when an alarm is snoozed"
                enableVibration(false)
                setSound(null, null)
            }
            nm.createNotificationChannel(channel)
        }

        // Tapping this notification opens MainActivity directly to SnoozeCountdown
        val openIntent = Intent(context, MainActivity::class.java).apply {
            action = ACTION_OPEN_SNOOZE
            putExtra(EXTRA_ALARM_ID, alarm.id)
            putExtra(EXTRA_SNOOZE_INTERVAL, intervalMin)
            putExtra(EXTRA_SNOOZE_TRIGGER_MS, snoozeTriggerTimeMs)
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            )
        }
        val openPendingIntent = PendingIntent.getActivity(
            context,
            SNOOZE_NOTIFICATION_ID,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Dismiss action button (cancels snooze)
        val dismissIntent = Intent(context, AlarmActionReceiver::class.java).apply {
            action = AlarmActionReceiver.ACTION_DISMISS_SNOOZE
            putExtra(EXTRA_ALARM_ID, alarm.id)
        }
        val dismissPendingIntent = PendingIntent.getBroadcast(
            context,
            alarm.requestCode + 200,
            dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val cal = Calendar.getInstance().apply { timeInMillis = snoozeTriggerTimeMs }
        val hours = cal.get(Calendar.HOUR_OF_DAY)
        val mins = cal.get(Calendar.MINUTE)
        val amPm = if (hours >= 12) "PM" else "AM"
        val hour12 = if (hours % 12 == 0) 12 else hours % 12
        val timeStr = String.format("%02d:%02d %s", hour12, mins, amPm)

        val notification = NotificationCompat.Builder(context, SNOOZE_CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Alba - Snoozed 😴")
            .setContentText("Rings again at $timeStr (${alarm.label})")
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(openPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss Alarm", dismissPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()

        nm.notify(SNOOZE_NOTIFICATION_ID, notification)
    }

    fun cancelSnoozeNotification(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        nm?.cancel(SNOOZE_NOTIFICATION_ID)
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

