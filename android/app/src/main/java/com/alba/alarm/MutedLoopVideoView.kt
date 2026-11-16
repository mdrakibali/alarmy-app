package com.alba.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.widget.FrameLayout
import android.widget.VideoView

import android.media.MediaPlayer

/**
 * Full-bleed wallpaper video with configurable mute / audio toggle.
 */
class MutedLoopVideoView(context: Context) : FrameLayout(context) {
    private val video = VideoView(context)
    private var current: String? = null
    private var isMuted: Boolean = true
    private var volumeLevel: Float = 1.0f
    private var mediaPlayerRef: MediaPlayer? = null

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            video.setAudioFocusRequest(AudioManager.AUDIOFOCUS_NONE)
        }
        addView(
            video,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
        )
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
        applyVolume()
    }

    fun setVolumeLevel(vol: Float) {
        volumeLevel = vol.coerceIn(0f, 1f)
        applyVolume()
    }

    private fun applyVolume() {
        val vol = if (isMuted) 0f else volumeLevel
        try {
            mediaPlayerRef?.setVolume(vol, vol)
        } catch (_: Exception) {}
    }

    fun setSource(uri: String?) {
        if (uri.isNullOrBlank()) {
            current = null
            video.stopPlayback()
            mediaPlayerRef = null
            return
        }
        if (uri == current) return
        current = uri
        video.setVideoURI(Uri.parse(uri))
        video.setOnPreparedListener { player ->
            mediaPlayerRef = player
            player.isLooping = true
            applyVolume()
            player.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE)
                    .build(),
            )
            video.start()
        }
    }

    override fun onDetachedFromWindow() {
        video.stopPlayback()
        super.onDetachedFromWindow()
    }
}
