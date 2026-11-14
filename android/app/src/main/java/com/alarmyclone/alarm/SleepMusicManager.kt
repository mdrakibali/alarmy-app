package com.alarmyclone.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log

object SleepMusicManager {
    private const val TAG = "SleepMusicManager"

    private var mediaPlayer: MediaPlayer? = null
    private var handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null
    private var fadeRunnable: Runnable? = null

    var currentSoundId: String? = null
        private set
    var isPlaying: Boolean = false
        private set
    var currentVolume: Float = 0.8f
        private set
    var timerRemainingSeconds: Int = 0
        private set

    fun play(
        context: Context,
        soundId: String,
        volume: Float = 0.8f,
        loop: Boolean = true,
        timerMinutes: Int = 0
    ): Boolean {
        try {
            stop()

            currentSoundId = soundId
            currentVolume = volume.coerceIn(0.0f, 1.0f)

            val cleanId = soundId.lowercase().replace("-", "_")
            val resId = context.resources.getIdentifier(cleanId, "raw", context.packageName)
            if (resId == 0) {
                Log.e(TAG, "Resource not found for sleep sound: $cleanId")
                return false
            }

            val soundUri = Uri.parse("android.resource://${context.packageName}/$resId")

            mediaPlayer = MediaPlayer().apply {
                setDataSource(context, soundUri)
                val audioAttributes = AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build()
                setAudioAttributes(audioAttributes)
                isLooping = loop
                setVolume(currentVolume, currentVolume)
                setOnPreparedListener { mp ->
                    try {
                        mp.start()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error starting player after prepare", e)
                    }
                }
                setOnErrorListener { mp, what, extra ->
                    Log.e(TAG, "MediaPlayer error: $what, $extra")
                    stop()
                    true
                }
                prepareAsync()
            }

            isPlaying = true
            Log.d(TAG, "Sleep sound started: $cleanId at volume $currentVolume")

            // Setup timer if requested
            if (timerMinutes > 0) {
                startSleepTimer(timerMinutes)
            }

            return true
        } catch (e: Exception) {
            Log.e(TAG, "Error playing sleep music", e)
            stop()
            return false
        }
    }

    fun pause() {
        try {
            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.pause()
                }
            }
            isPlaying = false
        } catch (e: Exception) {
            Log.e(TAG, "Error pausing sleep music", e)
        }
    }

    fun resume(): Boolean {
        try {
            mediaPlayer?.let {
                it.start()
                isPlaying = true
                return true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error resuming sleep music", e)
        }
        return false
    }

    fun stop() {
        try {
            clearTimer()
            clearFade()

            mediaPlayer?.let {
                if (it.isPlaying) {
                    it.stop()
                }
                it.release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping sleep music", e)
        } finally {
            mediaPlayer = null
            isPlaying = false
            currentSoundId = null
            timerRemainingSeconds = 0
        }
    }

    fun setVolume(volume: Float) {
        currentVolume = volume.coerceIn(0.0f, 1.0f)
        try {
            mediaPlayer?.setVolume(currentVolume, currentVolume)
        } catch (e: Exception) {
            Log.e(TAG, "Error setting volume", e)
        }
    }

    fun seekTo(positionMs: Int) {
        try {
            mediaPlayer?.seekTo(positionMs)
        } catch (e: Exception) {
            Log.e(TAG, "Error seeking", e)
        }
    }

    fun getDuration(): Int {
        return try {
            mediaPlayer?.duration ?: 0
        } catch (e: Exception) {
            0
        }
    }

    fun getCurrentPosition(): Int {
        return try {
            mediaPlayer?.currentPosition ?: 0
        } catch (e: Exception) {
            0
        }
    }

    private fun startSleepTimer(minutes: Int) {
        clearTimer()
        timerRemainingSeconds = minutes * 60

        timerRunnable = object : Runnable {
            override fun run() {
                timerRemainingSeconds--
                if (timerRemainingSeconds <= 30 && timerRemainingSeconds > 0 && fadeRunnable == null) {
                    startGradualFadeOut(timerRemainingSeconds)
                }

                if (timerRemainingSeconds <= 0) {
                    stop()
                } else {
                    handler.postDelayed(this, 1000)
                }
            }
        }
        handler.postDelayed(timerRunnable!!, 1000)
    }

    private fun startGradualFadeOut(secondsRemaining: Int) {
        val startVolume = currentVolume
        val totalSteps = secondsRemaining * 10
        var currentStep = 0

        fadeRunnable = object : Runnable {
            override fun run() {
                currentStep++
                val fraction = 1.0f - (currentStep.toFloat() / totalSteps)
                val targetVol = (startVolume * fraction).coerceIn(0.0f, 1.0f)
                setVolume(targetVol)

                if (currentStep < totalSteps && isPlaying) {
                    handler.postDelayed(this, 100)
                }
            }
        }
        handler.post(fadeRunnable!!)
    }

    private fun clearTimer() {
        timerRunnable?.let { handler.removeCallbacks(it) }
        timerRunnable = null
    }

    private fun clearFade() {
        fadeRunnable?.let { handler.removeCallbacks(it) }
        fadeRunnable = null
    }
}

