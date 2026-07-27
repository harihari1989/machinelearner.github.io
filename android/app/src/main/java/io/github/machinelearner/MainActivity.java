package io.github.machinelearner;

import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ArrayAdapter;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.webkit.WebViewAssetLoader;

import io.github.machinelearner.databinding.ActivityMainBinding;

import org.json.JSONObject;

import java.util.List;
import java.util.Locale;

public final class MainActivity extends AppCompatActivity implements LocalContentWebViewClient.Listener {
    private static final String START_URL =
            "https://appassets.androidplatform.net/assets/site/index.html";
    private static final String PREFERENCES = "learning_state";
    private static final String LAST_CHAPTER = "last_chapter";
    private static final String LAST_ANCHOR = "last_anchor";

    private ActivityMainBinding binding;
    private SharedPreferences preferences;
    private int currentDestinationIndex = 0;
    private boolean pageReady = false;
    private boolean restoredWebViewState = false;
    private View fullscreenView;
    private WebChromeClient.CustomViewCallback fullscreenCallback;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        getWindow().setStatusBarColor(getColor(R.color.brand_navy));
        getWindow().setNavigationBarColor(getColor(R.color.brand_navy));

        preferences = getSharedPreferences(PREFERENCES, MODE_PRIVATE);
        currentDestinationIndex = LearningCatalog.indexOfChapter(
                preferences.getString(LAST_CHAPTER, "foundations")
        );

        configureWebView();
        configureNativeNavigation();
        configureBackNavigation();
        updateDestinationChrome();

        if (savedInstanceState != null) {
            restoredWebViewState = binding.learningWebView.restoreState(savedInstanceState) != null;
        }
        if (!restoredWebViewState) {
            String anchor = safeAnchor(preferences.getString(
                    LAST_ANCHOR,
                    LearningCatalog.at(currentDestinationIndex).getAnchorId()
            ));
            binding.learningWebView.loadUrl(START_URL + "#" + anchor);
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @SuppressWarnings("deprecation")
    private void configureWebView() {
        WebView webView = binding.learningWebView;
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);

        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new LocalContentWebViewClient(assetLoader, this));
        webView.setWebChromeClient(new LearningChromeClient());
        webView.addJavascriptInterface(new LearningBridge(), "AndroidLearning");
    }

    private void configureNativeNavigation() {
        binding.contentsButton.setOnClickListener(view -> showContents());
        binding.currentChapterCard.setOnClickListener(view -> showContents());
        binding.previousChapterButton.setOnClickListener(view -> navigateBy(-1));
        binding.nextChapterButton.setOnClickListener(view -> navigateBy(1));
        binding.retryButton.setOnClickListener(view -> {
            binding.errorPanel.setVisibility(View.GONE);
            binding.learningWebView.reload();
        });
    }

    private void configureBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (fullscreenView != null) {
                    hideFullscreenContent();
                } else if (binding.learningWebView.canGoBack()) {
                    binding.learningWebView.goBack();
                } else {
                    finish();
                }
            }
        });
    }

    private void showContents() {
        List<LearningDestination> destinations = LearningCatalog.all();
        String[] labels = new String[destinations.size()];
        for (int index = 0; index < destinations.size(); index += 1) {
            labels[index] = destinations.get(index).getDisplayLabel();
        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(
                this,
                R.layout.item_chapter,
                R.id.chapterItemText,
                labels
        );
        new AlertDialog.Builder(this)
                .setTitle(R.string.choose_chapter)
                .setSingleChoiceItems(adapter, currentDestinationIndex, (dialog, which) -> {
                    dialog.dismiss();
                    navigateTo(which);
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }

    private void navigateBy(int offset) {
        navigateTo(currentDestinationIndex + offset);
    }

    private void navigateTo(int destinationIndex) {
        if (destinationIndex < 0 || destinationIndex >= LearningCatalog.all().size()) return;
        currentDestinationIndex = destinationIndex;
        LearningDestination destination = LearningCatalog.at(destinationIndex);
        preferences.edit()
                .putString(LAST_CHAPTER, destination.getChapterId())
                .putString(LAST_ANCHOR, destination.getAnchorId())
                .apply();
        updateDestinationChrome();

        if (pageReady) {
            String script = String.format(
                    Locale.US,
                    "window.MachineLearnerApp && window.MachineLearnerApp.openChapter(%s,%s);",
                    JSONObject.quote(destination.getChapterId()),
                    JSONObject.quote(destination.getAnchorId())
            );
            binding.learningWebView.evaluateJavascript(script, null);
        } else {
            binding.learningWebView.loadUrl(START_URL + "#" + destination.getAnchorId());
        }
    }

    private void updateDestinationChrome() {
        LearningDestination destination = LearningCatalog.at(currentDestinationIndex);
        binding.currentChapterTitle.setText(destination.getTitle());
        binding.currentChapterSubtitle.setText(destination.getSubtitle());
        binding.previousChapterButton.setEnabled(currentDestinationIndex > 0);
        binding.nextChapterButton.setEnabled(
                currentDestinationIndex < LearningCatalog.all().size() - 1
        );
        binding.chapterPosition.setText(getString(
                R.string.chapter_position,
                currentDestinationIndex + 1,
                LearningCatalog.all().size()
        ));
    }

    @Override
    public void onLocalPageStarted() {
        runOnUiThread(() -> {
            pageReady = false;
            binding.pageLoadingProgress.setVisibility(View.VISIBLE);
            binding.pageLoadingProgress.setProgress(5);
        });
    }

    @Override
    public void onLocalPageVisible() {
        runOnUiThread(() -> {
            binding.errorPanel.setVisibility(View.GONE);
            injectAndroidShell();
        });
    }

    @Override
    public void onMainFrameError(String description) {
        runOnUiThread(() -> {
            binding.pageLoadingProgress.setVisibility(View.GONE);
            binding.errorMessage.setText(getString(R.string.load_error_detail, description));
            binding.errorPanel.setVisibility(View.VISIBLE);
        });
    }

    @Override
    public void openExternal(Uri uri) {
        runOnUiThread(() -> {
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.US);
            if (!(scheme.equals("https") || scheme.equals("http") || scheme.equals("mailto"))) {
                Toast.makeText(this, R.string.unsupported_link, Toast.LENGTH_SHORT).show();
                return;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException error) {
                Toast.makeText(this, R.string.no_link_handler, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void injectAndroidShell() {
        LearningDestination destination = LearningCatalog.at(currentDestinationIndex);
        String script = String.format(
                Locale.US,
                "(function(){"
                        + "var boot=function(){if(window.MachineLearnerApp){window.MachineLearnerApp.boot(%s,%s);}};"
                        + "if(!document.getElementById('machine-learner-android-css')){"
                        + "var l=document.createElement('link');l.id='machine-learner-android-css';l.rel='stylesheet';"
                        + "l.href='https://appassets.androidplatform.net/assets/android/android-shell.css';document.head.appendChild(l);}"
                        + "if(window.MachineLearnerApp){boot();return;}"
                        + "if(document.getElementById('machine-learner-android-js')){setTimeout(boot,50);return;}"
                        + "var s=document.createElement('script');s.id='machine-learner-android-js';"
                        + "s.src='https://appassets.androidplatform.net/assets/android/android-shell.js';s.onload=boot;document.body.appendChild(s);"
                        + "})();",
                JSONObject.quote(destination.getChapterId()),
                JSONObject.quote(safeAnchor(preferences.getString(LAST_ANCHOR, destination.getAnchorId())))
        );
        binding.learningWebView.evaluateJavascript(script, null);
    }

    private void showFullscreenContent(View view, WebChromeClient.CustomViewCallback callback) {
        if (fullscreenView != null) {
            callback.onCustomViewHidden();
            return;
        }
        fullscreenView = view;
        fullscreenCallback = callback;
        binding.fullscreenContainer.addView(
                view,
                new ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                )
        );
        binding.fullscreenContainer.setVisibility(View.VISIBLE);
        binding.appChromeContainer.setVisibility(View.GONE);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        );
    }

    private void hideFullscreenContent() {
        if (fullscreenView == null) return;
        binding.fullscreenContainer.removeView(fullscreenView);
        binding.fullscreenContainer.setVisibility(View.GONE);
        binding.appChromeContainer.setVisibility(View.VISIBLE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        fullscreenCallback.onCustomViewHidden();
        fullscreenView = null;
        fullscreenCallback = null;
    }

    private static String safeAnchor(String candidate) {
        if (candidate == null || !candidate.matches("[A-Za-z0-9_-]+")) return "ai-categories";
        return candidate;
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (binding != null) binding.learningWebView.onResume();
    }

    @Override
    protected void onPause() {
        if (binding != null) binding.learningWebView.onPause();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(@NonNull Bundle outState) {
        binding.learningWebView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        if (binding != null) {
            binding.learningWebView.removeJavascriptInterface("AndroidLearning");
            binding.learningWebView.stopLoading();
            binding.learningWebView.destroy();
        }
        super.onDestroy();
    }

    public final class LearningBridge {
        @JavascriptInterface
        public void onReady(String chapterId, String title) {
            runOnUiThread(() -> {
                pageReady = true;
                currentDestinationIndex = LearningCatalog.indexOfChapter(chapterId);
                updateDestinationChrome();
                binding.pageLoadingProgress.setVisibility(View.GONE);
                preferences.edit().putString(LAST_CHAPTER, chapterId).apply();
            });
        }

        @JavascriptInterface
        public void onProgress(int percent, String chapterId, String anchorId, String heading) {
            runOnUiThread(() -> {
                currentDestinationIndex = LearningCatalog.indexOfChapter(chapterId);
                binding.chapterProgress.setProgress(Math.max(0, Math.min(percent, 100)));
                binding.readingProgressText.setText(getString(
                        R.string.reading_progress,
                        Math.max(0, Math.min(percent, 100))
                ));
                updateDestinationChrome();
                preferences.edit()
                        .putString(LAST_CHAPTER, chapterId)
                        .putString(LAST_ANCHOR, safeAnchor(anchorId))
                        .apply();
            });
        }

        @JavascriptInterface
        public void openExternal(String rawUrl) {
            if (rawUrl == null) return;
            MainActivity.this.openExternal(Uri.parse(rawUrl));
        }
    }

    private final class LearningChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            binding.pageLoadingProgress.setProgress(newProgress);
            if (newProgress >= 100 && pageReady) {
                binding.pageLoadingProgress.setVisibility(View.GONE);
            } else {
                binding.pageLoadingProgress.setVisibility(View.VISIBLE);
            }
        }

        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            showFullscreenContent(view, callback);
        }

        @Override
        public void onHideCustomView() {
            hideFullscreenContent();
        }

        @Override
        public boolean onCreateWindow(
                WebView view,
                boolean isDialog,
                boolean isUserGesture,
                Message resultMsg
        ) {
            WebView popup = new WebView(MainActivity.this);
            popup.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageStarted(WebView temporaryView, String url, android.graphics.Bitmap favicon) {
                    MainActivity.this.openExternal(Uri.parse(url));
                    temporaryView.stopLoading();
                    temporaryView.destroy();
                }
            });
            WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
            transport.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }

        @Override
        public boolean onConsoleMessage(ConsoleMessage message) {
            return BuildConfig.DEBUG && super.onConsoleMessage(message);
        }
    }
}
