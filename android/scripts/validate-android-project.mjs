#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const androidRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(androidRoot, '..');
const read = relativePath => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
const exists = relativePath => existsSync(path.join(repositoryRoot, relativePath));
let failures = 0;

function check(condition, message) {
    if (condition) console.log(`PASS ${message}`);
    else {
        failures += 1;
        console.error(`FAIL ${message}`);
    }
}

const html = read('index.html');
const build = read('android/app/build.gradle');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const activity = read('android/app/src/main/java/io/github/machinelearner/MainActivity.java');
const catalog = read('android/app/src/main/java/io/github/machinelearner/LearningCatalog.java');
const shell = read('android/app/src/main/assets/android/android-shell.js');

for (const requiredFile of [
    'android/settings.gradle',
    'android/build.gradle',
    'android/gradlew',
    'android/gradle/wrapper/gradle-wrapper.properties',
    'android/app/src/main/res/layout/activity_main.xml',
    'android/app/src/main/assets/android/android-shell.css',
]) {
    check(exists(requiredFile), `Android project file ${requiredFile}`);
}

const chapterIds = [...html.matchAll(/<section[^>]+class="[^"]*chapter[^"]*"[^>]+data-chapter="([^"]+)"/g)]
    .map(match => match[1]);
const visibleChapterIds = [...html.matchAll(/<button[^>]+class="[^"]*chapter-btn[^"]*"[^>]+data-chapter="([^"]+)"/g)]
    .map(match => match[1]);
const catalogEntries = [...catalog.matchAll(/new LearningDestination\("([^"]+)",\s*"([^"]+)"/g)]
    .map(([, chapter, anchor]) => ({ chapter, anchor }));

check(chapterIds.length === 10, `${chapterIds.length} website chapters detected`);
check(visibleChapterIds.length === 7, `${visibleChapterIds.length} learner-facing chapters detected`);
check(catalogEntries.length === visibleChapterIds.length, 'native catalog matches the focused curriculum');
for (const chapterId of visibleChapterIds) {
    check(catalogEntries.some(entry => entry.chapter === chapterId), `native destination ${chapterId}`);
}
for (const entry of catalogEntries) {
    check(chapterIds.includes(entry.chapter), `website chapter ${entry.chapter}`);
    check(html.includes(`id="${entry.anchor}"`), `destination anchor ${entry.anchor}`);
}
check(!html.includes('Kid Comic') && !html.includes('Holiday Kids'), 'child and holiday themes are removed');

check(build.includes('include "*.css"') && build.includes('include "*.js"'), 'all root styles and scripts are synchronized');
check(build.includes('include "assets/**"'), 'models, media, and Python runtime are synchronized');
check(build.includes('manim/scene-manifest.json'), 'Manim manifest is synchronized');
check(build.includes('noCompress += ["wasm", "mjs", "whl", "onnx", "webm", "mp4", "zip"]'), 'large executable and media assets remain streamable');

check(manifest.includes('android:hardwareAccelerated="true"'), 'hardware-accelerated visual lessons');
check(manifest.includes('android:largeHeap="true"'), 'memory headroom for Pyodide and ONNX');
check(manifest.includes('android:usesCleartextTraffic="false"'), 'cleartext WebView traffic disabled');
check(manifest.includes('android.webkit.WebView.MetricsOptOut'), 'WebView metrics opt-out declared');
check(activity.includes('WebViewAssetLoader'), 'secure local HTTPS asset origin');
check(activity.includes('setAllowFileAccess(false)'), 'file URL access disabled');
check(activity.includes('MIXED_CONTENT_NEVER_ALLOW'), 'mixed content disabled');
check(activity.includes('setBuiltInZoomControls(true)'), 'accessible lesson zoom enabled');
check(activity.includes('fontScale'), 'system text scaling is honored');
check(activity.includes('WindowInsetsCompat.Type.systemBars()'), 'system bar insets are applied');
check(activity.includes('onShowCustomView'), 'fullscreen video support');
check(shell.includes('AndroidLearning?.openExternal'), 'external sources leave the trusted learning WebView');
check(shell.includes('machine-learner-android-progress-v1'), 'learning position persistence');

check(
    !read('math-foundations-lab.js').includes('cdn.jsdelivr.net/pyodide'),
    'math playground uses the bundled Python sandbox'
);

const localStaticReferences = [...html.matchAll(/(?:src|href)="([^"?#]+)(?:[?#][^"]*)?"/g)]
    .map(match => match[1])
    .filter(reference => !/^(?:https?:|mailto:|data:)/.test(reference));
const missingReferences = [...new Set(localStaticReferences.filter(reference => !exists(reference)))];
check(missingReferences.length === 0, `${localStaticReferences.length} static website references resolve`);
if (missingReferences.length) console.error(`Missing references: ${missingReferences.join(', ')}`);

if (failures) {
    console.error(`Android project validation failed with ${failures} issue(s).`);
    process.exit(1);
}

console.log('Android project validation passed.');
