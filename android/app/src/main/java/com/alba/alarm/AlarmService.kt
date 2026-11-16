package com.alba.alarm

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
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.alba.MainActivity
import com.alba.R

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
            try {
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                nm?.cancel(NOTIFICATION_ID)
            } catch (_: Exception) {}
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

        // Ringing notification matching Alarmy format (Image 3)
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("Alarmy")
            .setContentText("Tap to dismiss ⏰ ⏰ ⏰ ⏰")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)

        val notification = notificationBuilder.build()
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(
                    NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
                )
            } else {
                startForeground(NOTIFICATION_ID, notification)
            }
        } catch (e: Exception) {
            Log.e(TAG, "startForeground failed", e)
            stopSelf()
            return START_NOT_STICKY
        }

        // Stop any background sleep music immediately so alarm has exclusive audio
        SleepMusicManager.stop()

        // Play sound and vibration
        startAlarmAudio(alarm)
        if (alarm?.vibrate != false) {
            startVibration()
        }

        // Release the broadcast receiver's wake lock now that foreground service is holding state
        AlarmReceiver.releaseWakeLock(alarmId)

        return START_STICKY
    }

    private val volumeFadeHandler = Handler(Looper.getMainLooper())
    private var volumeFadeRunnable: Runnable? = null

    private fun startCrescendoVolume(player: MediaPlayer, targetVolume: Float) {
        // Start gently at 10% volume
        var currentVol = 0.10f.coerceAtMost(targetVolume)
        try {
            player.setVolume(currentVol, currentVol)
        } catch (e: Exception) {}

        volumeFadeRunnable?.let { r: Runnable -> volumeFadeHandler.removeCallbacks(r) }
        volumeFadeRunnable = object : Runnable {
            override fun run() {
                try {
                    if (isRinging && player.isPlaying && currentVol < targetVolume) {
                        // Increase volume by 6% every 1.5 seconds until target volume
                        currentVol = (currentVol + 0.06f).coerceAtMost(targetVolume)
                        player.setVolume(currentVol, currentVol)
                        if (currentVol < targetVolume) {
                            volumeFadeHandler.postDelayed(this, 1500)
                        }
                    }
                } catch (e: Exception) {}
            }
        }
        volumeFadeHandler.postDelayed(volumeFadeRunnable!!, 1500)
    }

    private fun startAlarmAudio(alarm: AlarmModel?) {
        try {
            // Guard: If audio is already playing, skip duplicate initialization
            if (mediaPlayer?.isPlaying == true) {
                Log.d(TAG, "Audio is already playing, skipping duplicate start request")
                return
            }

            mediaPlayer?.release()
            mediaPlayer = null

            // Request AudioFocus & Ensure Stream Volume
            val audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setLegacyStreamType(AudioManager.STREAM_ALARM)
                .build()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val focusRequest = android.media.AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
                    .setAudioAttributes(audioAttributes)
                    .build()
                audioManager?.requestAudioFocus(focusRequest)
            } else {
                @Suppress("DEPRECATION")
                audioManager?.requestAudioFocus(null, AudioManager.STREAM_ALARM, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            }

            // Ensure physical alarm stream is audible (prevent silent playback if phone was muted)
            val maxStreamVol = audioManager?.getStreamMaxVolume(AudioManager.STREAM_ALARM) ?: 1
            val currentStreamVol = audioManager?.getStreamVolume(AudioManager.STREAM_ALARM) ?: 0
            if (currentStreamVol < (maxStreamVol * 0.4f).toInt()) {
                audioManager?.setStreamVolume(
                    AudioManager.STREAM_ALARM,
                    (maxStreamVol * 0.8f).toInt().coerceAtLeast(1),
                    0
                )
            }

            var soundUri: Uri? = null

            // 1. Check if alarm.soundId maps to bundled raw sound resource
            val soundId = alarm?.soundId
            if (!soundId.isNullOrEmpty() && (soundId.startsWith("file://") || soundId.startsWith("content://"))) {
                soundUri = Uri.parse(soundId)
            } else if (!soundId.isNullOrEmpty()) {
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

            val targetVol = (alarm?.volume ?: 1.0f).coerceIn(0.1f, 1.0f)

            mediaPlayer = MediaPlayer().apply {
                setDataSource(this@AlarmService, soundUri!!)
                setAudioAttributes(audioAttributes)
                isLooping = true
                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra. Falling back to default ringtone.")
                    try {
                        reset()
                        val fallbackUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                            ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
                        setDataSource(this@AlarmService, fallbackUri)
                        prepare()
                        start()
                    } catch (e: Exception) {
                        Log.e(TAG, "Fallback ringtone also failed", e)
                    }
                    true
                }
                prepare()
                start()
                if (alarm?.gentleWakeup == true) {
                    startCrescendoVolume(this, targetVol)
                } else {
                    setVolume(targetVol, targetVol)
                }
            }
            Log.d(TAG, "Audio started playing successfully with URI: $soundUri (vol: $targetVol)")
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

        volumeFadeRunnable?.let { r: Runnable -> volumeFadeHandler.removeCallbacks(r) }
        volumeFadeRunnable = null

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

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE)
            } else {
                @Suppress("DEPRECATION")
                stopForeground(true)
            }
            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            nm?.cancel(NOTIFICATION_ID)
        } catch (e: Exception) {
            Log.e(TAG, "Error removing notification on destroy", e)
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

