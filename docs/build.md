# Alba (Alarmy Clone) — অ্যাপ বিল্ড ও ডিপ্লয়মেন্ট গাইড

এই ডকুমেন্টে **Alba** অ্যাপের লোকাল ডেভেলপমেন্ট রান, লোকাল রিলিজ APK/AAB বিল্ড, EAS CLI দিয়ে ক্লাউড বিল্ড (ম্যাক ছাড়া iOS ও Android বিল্ড), অ্যাপ সাইজ কমানোর কৌশল এবং সাধারণ সমস্যার সমাধান বিস্তারিত আলোচনা করা হয়েছে।

---

## ১. পূর্বশর্ত ও ডেভেলপমেন্ট এনভায়রনমেন্ট (Prerequisites)

লোকাল মেশিনে অ্যাপ রান ও বিল্ড করার জন্য নিচের টুলগুলো ইনস্টল ও কনফিগার করা থাকতে হবে:

- **Node.js**: v18+ বা v20+ LTS
- **JDK (Java Development Kit)**: OpenJDK 17
- **Android SDK & Build-Tools**: 
  - Android SDK Platform 35 / 34
  - Android SDK Build-Tools 35.0.0
  - NDK 27.1.12297006
  - CMake 3.22.1
- **ADB (Android Debug Bridge)**: USB debugging এনাবল করা অ্যান্ড্রয়েড ডিভাইস বা একটি Android Virtual Device (AVD / Emulator).

এনভায়রনমেন্ট ভেরিয়েবল চেক করতে নিশ্চিত করুন আপনার `~/.bashrc` বা `~/.zshrc`-এ নিচের পাথগুলো যুক্ত আছে:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
```

---

## ২. লোকাল ডেভেলপমেন্ট ও টেস্টিং (Local Development)

### ক. ডিপেন্ডেন্সি ইনস্টল
```bash
npm install
```

### খ. মেট্রো বান্ডলার (Metro Bundler) চালু করা
```bash
npm start
```
*ক্যাশ সহ নতুন করে রান করতে চাইলে:* `npx react-native start --reset-cache`

### গ. অ্যান্ড্রয়েড ডিভাইসে রান করা
ইউএসবি বা ওয়াইফাই দিয়ে ফোন কানেক্ট করার পর:
```bash
npm run android
```
*(এটি স্বয়ংক্রিয়ভাবে `adb reverse tcp:8081 tcp:8081` এক্সিকিউট করে এবং অ্যাপটি ডিভাইসে ইনস্টল ও ওপেন করে।)*

### ঘ. ওয়্যারলেস ডিবাগিং ও স্ক্রিন মিররিং (কাস্টম স্ক্রিপ্ট)
```bash
# ওয়াইফাই এর মাধ্যমে কানেক্ট করতে
npm run connect

# scrcpy স্ক্রিন মিরর ও মেট্রো ব্যাকগ্রাউন্ড সহ রান করতে
npm run dev
```

---

## ৩. লোকাল প্রোডাকশন বিল্ড (Local Production Builds)

### ক. টেস্টযোগ্য রিলিজ APK তৈরি (Installable Release APK)
সরাসরি যে কোনো ফোনে ইনস্টল করে টেস্ট করার জন্য:

```bash
npm run build:apk
```
*অথবা ম্যানুয়ালি:*
```bash
cd android
./gradlew assembleRelease
cd ..
```

**জেনারেট হওয়া APK ফাইলের লোকেশন:**
`android/app/build/outputs/apk/release/`

এখানে আপনি দুই ধরনের APK পাবেন:
1. **Universal APK**: `app-universal-release.apk` (সব ধরনের আর্কিটেকচারে চলবে, সাইজ আনুমানিক ৪০-৫০ MB)।
2. **Architecture-Specific APKs** (আর্কিটেকচার অনুযায়ী আলাদা সাইজ, মাত্র ২৫-৩০ MB):
   - `app-arm64-v8a-release.apk` (আধুনিক প্রায় সকল অ্যান্ড্রয়েড ফোনের জন্য)
   - `app-armeabi-v7a-release.apk` (পুরনো ৩২-বিট ফোনের জন্য)
   - `app-x86_64-release.apk` (ইমুলেটরের জন্য)

---

### খ. গুগল প্লে-স্টোরের জন্য AAB তৈরি (Android App Bundle)
Google Play Store-এ আপলোড করার জন্য `.aab` ফরম্যাটে বিল্ড করতে হয়:

```bash
cd android
./gradlew bundleRelease
cd ..
```

**জেনারেট হওয়া AAB ফাইলের লোকেশন:**
`android/app/build/outputs/bundle/release/app-release.aab`
*(গুগল প্লে স্বয়ংক্রিয়ভাবে ব্যবহারকারীর ফোনের হার্ডওয়্যার অনুযায়ী মিনিমাল সাইজের ডাইনামিক APK ডেলিভারি করবে, ফলে ব্যবহারকারীর ডাউনলোডের সাইজ হবে মাত্র ২০-২৫ MB!)*

---

### গ. নিজস্ব প্রোডাকশন Keystore তৈরি ও সাইনিং (Production Keystore)
প্লে-স্টোরে পাবলিশ করার আগে নিজস্ব সিকিউর কীস্টোর ফাইল জেনারেট করা আবশ্যক:

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
এই ফাইলটি `android/app/` ফোল্ডারে রাখুন এবং `android/gradle.properties`-এ কী-এর তথ্য যুক্ত করুন:
```properties
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=your_password
MYAPP_UPLOAD_KEY_PASSWORD=your_password
```

---

## ৪. EAS CLI দিয়ে ক্লাউড বিল্ড (ম্যাক ছাড়া Android ও iOS বিল্ড)

Alba প্রোজেক্টের রুটে একটি প্রোডাকশন-রেডি `eas.json` কনফিগারেশন ফাইল দেওয়া আছে। এর মাধ্যমে আপনার নিজের ম্যাক পিসি না থাকলেও **Expo Cloud Build** ব্যবহার করে সরাসরি ক্লাউডেই অ্যান্ড্রয়েড এবং আইওএস (iOS) বিল্ড তৈরি করা সম্ভব।

### ধাপ ১: EAS CLI গ্লোবালি ইনস্টল করুন
```bash
npm install -g eas-cli
```

### ধাপ ২: ফ্রি Expo একাউন্ট খুলে লগইন করুন
1. ব্রাউজারে [expo.dev/signup](https://expo.dev/signup) পেজে গিয়ে একটি ফ্রি অ্যাকাউন্ট তৈরি করুন।
2. টার্মিনালে রান করুন:
```bash
eas login
```
*(আপনার এক্সপো ইমেইল ও পাসওয়ার্ড প্রদান করে লগইন সম্পন্ন করুন)*

### ধাপ ৩: প্রোজেক্টটি EAS-এর সাথে লিংক করুন
```bash
eas init
```
*(এটি আপনার প্রোজেক্ট শনাক্ত করে এক্সপো ক্লাউড ড্যাশবোর্ডের সাথে লিঙ্ক করে দেবে এবং একটি ইউনিক Project ID সেট করবে)*

---

### ক্লাউড থেকে অ্যাপ বিল্ড করার কমান্ডসমূহ:

#### ১. ক্লাউডে টেস্টযোগ্য Android APK বিল্ড:
```bash
eas build -p android --profile preview
```
- **কী ঘটবে:** পুরো সোর্সকোড EAS ক্লাউডে আপলোড হবে এবং ক্লাউড লিনাক্স সার্ভারে স্বয়ংক্রিয়ভাবে `:app:assembleRelease` রান করবে।
- **ডেলিভারি:** বিল্ড শেষ হলে টার্মিনালে সরাসরি ডাউনলোড লিঙ্ক এবং একটি QR কোড পাবেন। ফোনের ক্যামেরা দিয়ে স্ক্যান করলেই APK সরাসরি ডাউনলোড হয়ে যাবে।

#### ২. ক্লাউডে Google Play Store-এর জন্য Android AAB বিল্ড:
```bash
eas build -p android --profile production
```
- প্রোডাকশন রেডি সাইন করা `.aab` ফাইল ক্লাউড ড্যাশবোর্ড থেকে ডাউনলোড করতে পারবেন।

#### ৩. ক্লাউডে iOS বিল্ড (ম্যাক পিসি ছাড়াই!):
```bash
# বাস্তব আইফোনে টেস্ট করার জন্য (Apple Developer Account প্রয়োজন)
eas build -p ios --profile preview

# ম্যাক সিমুলেটরে টেস্ট করার জন্য (.tar.gz / .app)
eas build -p ios --profile preview-simulator
```
- **ম্যাজিক:** আপনার লোকাল মেশিন লিনাক্স (Debian) বা উইন্ডোজ হলেও, Expo-র নিজস্ব ক্লাউড অ্যাপল ম্যাক সার্ভারে কোডটি বিল্ড হবে এবং আইফোনে সরাসরি ইনস্টল করার লিঙ্ক দিয়ে দেবে।

---

## ৫. অ্যাপ সাইজ কমানোর কৌশল (App Size Optimization)

Alba প্রোজেক্টে সাইজ অপ্টিমাইজেশনের জন্য নিচের ফিচারগুলো ইতোমধ্যে কনফিগার করা আছে:

1. **R8 / ProGuard কোড অবফাসকেশন ও শ্রিন্কিং (`enableProguardInReleaseBuilds = true`):**
   - অপ্রয়োজনীয় ডুপ্লিকেট ক্লাস ও মেথড মুছে ফেলে বাইটকোড সাইজ ৫০%-৬০% পর্যন্ত কমিয়ে দেয়।
2. **রিসোর্স শ্রিন্কিং (`shrinkResources true`):**
   - কোডে কখনো ব্যবহার না হওয়া লেআউট, ড্রয়েবল বা স্ট্রিং রিসোর্সগুলো স্বয়ংক্রিয়ভাবে মুছে ফেলে।
3. **ABI আর্কিটেকচার স্প্লিটস (`splits { abi { enable true ... } }`):**
   - সবগুলো আর্কিটেকচারের জন্য একটি ভারী APK-র বদলে প্রতিটি হার্ডওয়্যারের (arm64-v8a, armeabi-v7a) জন্য আলাদা হালকা এপিকে তৈরি করে।
4. **Hermes JS ইঞ্জিন (`hermesEnabled=true`):**
   - জাভাস্ক্রিপ্ট কোড আগেই বাইটকোডে কম্পাইল করে রাখে, যার ফলে অ্যাপ খোলার স্পিড অনেক দ্রুত হয় এবং র‍্যাম খরচ কমে যায়।

---

## ৬. সাধারণ সমস্যা ও সমাধান (Troubleshooting)

### সমস্যা ১: পূর্ববর্তী বিল্ডের ক্যাশ বা কনফ্লিক্ট দেখা দেওয়া
```bash
# প্রোজেক্টের ক্যাশ ও অ্যান্ড্রয়েড বিল্ড সম্পূর্ণ ক্লিন করুন
npm run clean
```
*অথবা:*
```bash
cd android && ./gradlew clean && cd ..
```

### সমস্যা ২: Metro Bundler ক্যাশ সমস্যা
```bash
npx react-native start --reset-cache
```

### সমস্যা ৩: ADB Connection Error (Port 8081 unavailable)
```bash
adb kill-server && adb start-server
adb reverse tcp:8081 tcp:8081
```

### সমস্যা ৪: Gradle Daemon সম্পর্কিত সতর্কতা
AGP 9+ এ `android.builtInKotlin=false` এবং `android.newDsl=false` সম্পর্কিত সতর্কবার্তা স্বাভাবিক। প্রোজেক্টের `gradle.properties` ফাইলে এগুলো সুনির্দিষ্টভাবে সেট করা আছে যাতে বর্তমান থার্ড-পার্টি লাইব্রেরিগুলো নিরবচ্ছিন্নভাবে কম্পাইল হতে পারে।

---

## ৭. কোড কোয়ালিটি ও টেস্ট ভেরিফিকেশন (Quality Assurance)

যেকোনো নতুন বিল্ড করার পূর্বে কোড সঠিক আছে কিনা নিশ্চিত হতে নিচের কমান্ডগুলো রান করুন:

```bash
# টাইপস্ক্রিপ্ট কম্পাইলেশন ও টাইপ চেকিং
npm run typecheck

# ESLint কোড স্টাইল ও সিনট্যাক্স অ্যানালাইসিস
npm run lint

# ইউনিট টেস্ট ও বিজনেস লজিক টেস্টিং
npm test
```
*(নিশ্চিত করুন যে সবগুলো টেস্ট গ্রিন/পাস করেছে এবং ০টি এরর আছে।)*
