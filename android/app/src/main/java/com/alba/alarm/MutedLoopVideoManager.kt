package com.alba.alarm

import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp

class MutedLoopVideoManager : SimpleViewManager<MutedLoopVideoView>() {
    override fun getName(): String = "MutedLoopVideo"

    override fun createViewInstance(reactContext: ThemedReactContext): MutedLoopVideoView {
        return MutedLoopVideoView(reactContext)
    }

    @ReactProp(name = "src")
    fun setSrc(view: MutedLoopVideoView, src: String?) {
        view.setSource(src)
    }
}
