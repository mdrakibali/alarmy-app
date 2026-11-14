package com.alarmyclone.alarm

import android.media.MediaPlayer
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.FrameLayout
import android.widget.VideoView
import androidx.activity.ComponentActivity

/**
 * Preview-only video wallpaper player.
 * Starts muted so it cannot replace the alarm sound.
 */
class VideoPreviewActivity : ComponentActivity() {
    private var videoView: VideoView? = null
    private var player: MediaPlayer? = null
    private var muted = true

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val uri = intent.data ?: intent.getStringExtra(EXTRA_URI)?.let(Uri::parse)
        if (uri == null) {
            finish()
            return
        }
        val video = VideoView(this)
        val unmute = Button(this).apply { text = "Unmute video" }
        val root = FrameLayout(this)
        root.addView(video, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ))
        root.addView(unmute, FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.WRAP_CONTENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
        ).apply { gravity = android.view.Gravity.BOTTOM or android.view.Gravity.CENTER_HORIZONTAL })
        setContentView(root)
        videoView = video
        video.setVideoURI(uri)
        video.setOnPreparedListener { media ->
            player = media
            media.isLooping = true
            media.setVolume(0f, 0f)
            video.start()
        }
        video.setOnErrorListener { _, _, _ ->
            finish()
            true
        }
        unmute.setOnClickListener {
            muted = !muted
            val volume = if (muted) 0f else 1f
            player?.setVolume(volume, volume)
            unmute.text = if (muted) "Unmute video" else "Mute video"
        }
    }

    override fun onPause() {
        videoView?.pause()
        super.onPause()
    }

    override fun onDestroy() {
        videoView?.stopPlayback()
        player = null
        videoView = null
        super.onDestroy()
    }

    companion object {
        const val EXTRA_URI = "video_uri"
    }
}
