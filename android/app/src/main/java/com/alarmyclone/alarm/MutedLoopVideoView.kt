package com.alarmyclone.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.widget.FrameLayout
import android.widget.VideoView

/**
 * Full-bleed wallpaper video. Volume stays at zero so it cannot replace the alarm.
 */
class MutedLoopVideoView(context: Context) : FrameLayout(context) {
    private val video = VideoView(context)
    private var current: String? = null

    init {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            video.setAudioFocusRequest(AudioManager.AUDIOFOCUS_NONE)
        }
        addView(
            video,
            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT),
        )
    }

    fun setSource(uri: String?) {
        if (uri.isNullOrBlank()) {
            current = null
            video.stopPlayback()
            return
        }
        if (uri == current) return
        current = uri
        video.setVideoURI(Uri.parse(uri))
        video.setOnPreparedListener { player ->
            player.isLooping = true
            player.setVolume(0f, 0f)
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
