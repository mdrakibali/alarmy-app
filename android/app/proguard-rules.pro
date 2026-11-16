# Add project specific ProGuard rules here.

# Keep our native Alba alarm and camera classes
-keep class com.alba.** { *; }
-keepclassmembers class com.alba.** { *; }

# React Native & Hermes
-keep class com.facebook.react.** { *; }
-keepclassmembers class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# MLKit Pose Detection & Barcode Scanning
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.vision.** { *; }
-keep class com.google.android.gms.internal.mlkit_** { *; }
-dontwarn com.google.mlkit.**

# CameraX
-keep class androidx.camera.** { *; }
-dontwarn androidx.camera.**

# MMKV & Nitro
-keep class com.tencent.mmkv.** { *; }
-keep class com.margelo.nitro.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
