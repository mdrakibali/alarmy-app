package com.alarmyclone.alarm

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.alarmyclone.MainActivity

class AlarmService : Service() {
    companion object {
        const val CHANNEL_ID = "alarmy_ringing_channel"
        const val NOTIFICATION_ID = 1001
        private const val TAG = "AlarmService"

        var isRinging: Boolean = false
            private set
        var currentAlarmId: String? = null
            private set

        fun stop(context: Context) {
            val intent = Intent(context, AlarmService::class.java)
            context.stopService(intent)
        }
    }

    private var mediaPlayer: MediaPlayer? = null
    private var vibrator: Vibrator? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val alarmId = intent?.getStringExtra(AlarmScheduler.EXTRA_ALARM_ID)
        currentAlarmId = alarmId
        isRinging = true

        val alarm = alarmId?.let { AlarmStorage.getAlarm(this, it) }
        val label = alarm?.label ?: "Alarm"

        // Build Full-screen Intent to launch Activity
        val fullScreenIntent = Intent(this, MainActivity::class.java).apply {
            action = AlarmReceiver.ACTION_ALARM_RINGING
            putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this,
            NOTIFICATION_ID,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        try {
            startActivity(fullScreenIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start activity directly from service", e)
        }

        AlarmModule.emitAlarmRinging(alarmId)

        // Notification actions
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(label)
            .setContentText("Alarm is ringing!")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)

        // Snooze button in notification
        if (alarm?.snoozeEnabled == true) {
            val snoozeIntent = Intent(this, AlarmActionReceiver::class.java).apply {
                action = AlarmActionReceiver.ACTION_SNOOZE
                putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            }
            val snoozePendingIntent = PendingIntent.getBroadcast(
                this,
                1002,
                snoozeIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            notificationBuilder.addAction(
                android.R.drawable.ic_menu_recent_history,
                "Snooze (${alarm.snoozeIntervalMin}m)",
                snoozePendingIntent
            )
        }

        // Dismiss action if no missions
        if (alarm == null || alarm.missions.isEmpty()) {
            val dismissIntent = Intent(this, AlarmActionReceiver::class.java).apply {
                action = AlarmActionReceiver.ACTION_DISMISS
                putExtra(AlarmScheduler.EXTRA_ALARM_ID, alarmId)
            }
            val dismissPendingIntent = PendingIntent.getBroadcast(
                this,
                1003,
                dismissIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            notificationBuilder.addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Dismiss",
                dismissPendingIntent
            )
        } else {
            // Dismiss requires completing mission, opening app
            notificationBuilder.addAction(
                android.R.drawable.ic_media_play,
                "Solve Mission to Dismiss",
                fullScreenPendingIntent
            )
        }

        val notification = notificationBuilder.build()
        startForeground(NOTIFICATION_ID, notification)

        // Stop any background sleep music immediately so alarm has exclusive audio
        SleepMusicManager.stop()

        // Play sound and vibration
        startAlarmAudio(alarm)
        if (alarm?.vibrate != false) {
            startVibration()
        }

        // Release the broadcast receiver's wake lock now that foreground service is holding state
        AlarmReceiver.releaseWakeLock()

        return START_STICKY
    }

    private fun startAlarmAudio(alarm: AlarmModel?) {
        try {
            mediaPlayer?.release()
            mediaPlayer = null

            var soundUri: Uri? = null

            // 1. Check if alarm.soundId maps to bundled raw sound resource
            val soundId = alarm?.soundId
            if (!soundId.isNullOrEmpty()) {
                val cleanId = soundId.lowercase().replace("-", "_")
                val resId = resources.getIdentifier(cleanId, "raw", packageName)
                if (resId != 0) {
                    soundUri = Uri.parse("android.resource://$packageName/$resId")
                }
            }

            // 2. Fallback to system ringtone manager if not found
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
            }
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            }
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            }

            mediaPlayer = MediaPlayer().apply {
                setDataSource(this@AlarmService, soundUri!!)
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setLegacyStreamType(AudioManager.STREAM_ALARM)
                    .build()
                setAudioAttributes(audioAttributes)
                isLooping = true
                val vol = alarm?.volume ?: 1.0f
                setVolume(vol, vol)
                prepare()
                start()
            }
            Log.d(TAG, "Audio started playing successfully with URI: $soundUri")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play alarm audio", e)
        }
    }

    private fun startVibration() {
        try {
            vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            val pattern = longArrayOf(0, 800, 400, 800, 400)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = VibrationEffect.createWaveform(pattern, 0)
                vibrator?.vibrate(effect)
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(pattern, 0)
            }
            Log.d(TAG, "Vibration started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start vibration", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isRinging = false
        currentAlarmId = null

        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping MediaPlayer", e)
        }

        try {
            vibrator?.cancel()
            vibrator = null
        } catch (e: Exception) {
            Log.e(TAG, "Error cancelling Vibrator", e)
        }

        AlarmReceiver.releaseWakeLock()
        Log.d(TAG, "AlarmService destroyed")
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Alarm Ringing",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Channel for ringing alarms"
                setSound(null, null) // Sound is handled by MediaPlayer for volume control
                enableVibration(false) // Vibration handled explicitly
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }
}

