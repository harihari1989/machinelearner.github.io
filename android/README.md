# Machine Learner for Android

This project packages the complete Machine Learner website as an offline-first Android app. The web source remains canonical: every Android build runs `syncWebContent`, which copies the root HTML, CSS, JavaScript, Manim media, ONNX model, WebAssembly runtime, and Python wheels into generated app assets.

## Learning experience

- Native table of contents covering all ten website chapters
- Previous/next chapter controls and per-chapter reading progress
- Automatic resume at the most recently viewed lesson
- Responsive Android-specific reading styles and accessible touch targets
- Pinch zoom, hardware-accelerated canvases, and fullscreen Manim videos
- Local ONNX inference and isolated Pyodide code labs
- External papers and documentation open in the device browser
- Light and dark Android chrome while preserving the website theme controls

The app serves bundled content from `https://appassets.androidplatform.net` with `WebViewAssetLoader`. This gives workers, `fetch`, WASM, and module scripts a real same-origin HTTPS context without enabling unsafe `file://` access.

## Open in Android Studio

1. Open the `android` directory as the project.
2. Use JDK 17 and install Android SDK 35.
3. Let Gradle synchronize dependencies.
4. Run the `app` configuration on an Android 8.0 or newer device or emulator.

## Command-line build

```sh
cd android
export JAVA_HOME=/path/to/jdk-17
./gradlew :app:assembleDebug
```

The debug APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`. Core lessons and labs are bundled; outbound reference links and web fonts still use the network when available.

## Validation

```sh
node android/scripts/validate-android-project.mjs
cd android
./gradlew testDebugUnitTest lintDebug assembleDebug
```

The static validator checks that the native catalog matches every chapter in `index.html`, local website references resolve, the complete asset tree is included, and the WebView retains its security and learning-experience settings.
