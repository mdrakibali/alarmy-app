package com.alba.alarm

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Robust, illumination-tolerant photo comparison engine.
 *
 * Uses a weighted ensemble of:
 * 1. Gradient / Difference Hash (dHash): Invariant to brightness and contrast changes.
 * 2. Normalized Average Hash (aHash): Captures global luminance distribution.
 * 3. Color Tone Correlation: Ensures overall room/object color palette matches.
 */
object PhotoMatcher {

    fun similarityPercent(pathA: String, pathB: String): Int {
        val bmpA = decodeSampledBitmap(pathA, 128, 128) ?: return 0
        val bmpB = decodeSampledBitmap(pathB, 128, 128) ?: return 0

        try {
            val dHashScore = computeDHashSimilarity(bmpA, bmpB)
            val aHashScore = computeAHashSimilarity(bmpA, bmpB)
            val colorScore = computeColorSimilarity(bmpA, bmpB)

            // dHash is weighted highest because it captures object contours and edges
            // regardless of morning vs evening ambient lighting.
            val combined = (0.55 * dHashScore + 0.30 * aHashScore + 0.15 * colorScore)
            return combined.toInt().coerceIn(0, 100)
        } finally {
            bmpA.recycle()
            bmpB.recycle()
        }
    }

    fun passes(pathA: String, pathB: String, threshold: Int): Boolean {
        return similarityPercent(pathA, pathB) >= threshold.coerceIn(1, 99)
    }

    /** Difference Hash (dHash) on 16x16 gradient grid (256 bits). */
    private fun computeDHashSimilarity(bmpA: Bitmap, bmpB: Bitmap): Double {
        val bitsA = getDHashBits(bmpA)
        val bitsB = getDHashBits(bmpB)
        var matches = 0
        val total = bitsA.size
        for (i in 0 until total) {
            if (bitsA[i] == bitsB[i]) matches++
        }
        return (matches.toDouble() / total.toDouble()) * 100.0
    }

    private fun getDHashBits(src: Bitmap): BooleanArray {
        val scaled = Bitmap.createScaledBitmap(src, 17, 16, true)
        val pixels = IntArray(17 * 16)
        scaled.getPixels(pixels, 0, 17, 0, 0, 17, 16)
        if (scaled != src) scaled.recycle()

        val bits = BooleanArray(16 * 16)
        var bitIdx = 0
        for (y in 0 until 16) {
            for (x in 0 until 16) {
                val left = luminance(pixels[y * 17 + x])
                val right = luminance(pixels[y * 17 + x + 1])
                bits[bitIdx++] = left > right
            }
        }
        return bits
    }

    /** Average Hash (aHash) with contrast normalization. */
    private fun computeAHashSimilarity(bmpA: Bitmap, bmpB: Bitmap): Double {
        val bitsA = getAHashBits(bmpA)
        val bitsB = getAHashBits(bmpB)
        var matches = 0
        val total = bitsA.size
        for (i in 0 until total) {
            if (bitsA[i] == bitsB[i]) matches++
        }
        return (matches.toDouble() / total.toDouble()) * 100.0
    }

    private fun getAHashBits(src: Bitmap): BooleanArray {
        val scaled = Bitmap.createScaledBitmap(src, 16, 16, true)
        val pixels = IntArray(16 * 16)
        scaled.getPixels(pixels, 0, 16, 0, 0, 16, 16)
        if (scaled != src) scaled.recycle()

        var sum = 0L
        val grays = IntArray(256)
        for (i in 0 until 256) {
            val lum = luminance(pixels[i])
            grays[i] = lum
            sum += lum
        }
        val avg = sum / 256

        val bits = BooleanArray(256)
        for (i in 0 until 256) {
            bits[i] = grays[i] >= avg
        }
        return bits
    }

    /** Downscaled color bin correlation. */
    private fun computeColorSimilarity(bmpA: Bitmap, bmpB: Bitmap): Double {
        val scaledA = Bitmap.createScaledBitmap(bmpA, 16, 16, true)
        val scaledB = Bitmap.createScaledBitmap(bmpB, 16, 16, true)
        val pxA = IntArray(256)
        val pxB = IntArray(256)
        scaledA.getPixels(pxA, 0, 16, 0, 0, 16, 16)
        scaledB.getPixels(pxB, 0, 16, 0, 0, 16, 16)
        if (scaledA != bmpA) scaledA.recycle()
        if (scaledB != bmpB) scaledB.recycle()

        var diffSum = 0.0
        for (i in 0 until 256) {
            val cA = pxA[i]
            val cB = pxB[i]
            val rDiff = abs(Color.red(cA) - Color.red(cB))
            val gDiff = abs(Color.green(cA) - Color.green(cB))
            val bDiff = abs(Color.blue(cA) - Color.blue(cB))
            diffSum += (rDiff + gDiff + bDiff) / (3.0 * 255.0)
        }
        val avgDiff = diffSum / 256.0
        return ((1.0 - avgDiff) * 100.0).coerceIn(0.0, 100.0)
    }

    private fun luminance(color: Int): Int {
        val r = (color shr 16) and 0xFF
        val g = (color shr 8) and 0xFF
        val b = color and 0xFF
        return (r * 299 + g * 587 + b * 114) / 1000
    }

    private fun decodeSampledBitmap(path: String, reqWidth: Int, reqHeight: Int): Bitmap? {
        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(path, options)
        if (options.outWidth <= 0 || options.outHeight <= 0) return null

        options.inSampleSize = calculateInSampleSize(options, reqWidth, reqHeight)
        options.inJustDecodeBounds = false
        options.inPreferredConfig = Bitmap.Config.ARGB_8888
        return BitmapFactory.decodeFile(path, options)
    }

    private fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
        val height = options.outHeight
        val width = options.outWidth
        var inSampleSize = 1

        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }
}
