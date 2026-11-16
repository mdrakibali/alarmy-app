package com.alba.alarm

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import kotlin.math.abs

object PhotoMatcher {
    fun similarityPercent(pathA: String, pathB: String): Int {
        val a = hash(pathA) ?: return 0
        val b = hash(pathB) ?: return 0
        var distance = 0
        for (i in a.indices) {
            distance += (a[i] xor b[i]).countOneBits()
        }
        val bits = a.size * 8
        val score = (1.0 - distance.toDouble() / bits.toDouble()) * 100.0
        return score.toInt().coerceIn(0, 100)
    }

    private fun hash(path: String): IntArray? {
        val bitmap = decodeScaled(path, 16, 16) ?: return null
        val pixels = IntArray(16 * 16)
        bitmap.getPixels(pixels, 0, 16, 0, 0, 16, 16)
        bitmap.recycle()
        var sum = 0L
        val gray = IntArray(pixels.size)
        pixels.forEachIndexed { index, color ->
            val r = (color shr 16) and 0xFF
            val g = (color shr 8) and 0xFF
            val b = color and 0xFF
            val value = (r * 30 + g * 59 + b * 11) / 100
            gray[index] = value
            sum += value
        }
        val average = sum / gray.size
        val bits = IntArray(4)
        gray.forEachIndexed { index, value ->
            if (value >= average) {
                bits[index / 32] = bits[index / 32] or (1 shl (index % 32))
            }
        }
        return bits
    }

    private fun decodeScaled(path: String, width: Int, height: Int): Bitmap? {
        val raw = BitmapFactory.decodeFile(path) ?: return null
        val scaled = Bitmap.createScaledBitmap(raw, width, height, true)
        if (scaled != raw) raw.recycle()
        return scaled
    }

    fun passes(pathA: String, pathB: String, threshold: Int): Boolean {
        return similarityPercent(pathA, pathB) >= threshold.coerceIn(1, 99)
    }

    fun hammingPreview(distance: Int): Int = abs(distance)
}
