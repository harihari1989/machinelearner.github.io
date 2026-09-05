package io.github.machinelearner;

import android.graphics.Bitmap;
import android.net.Uri;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import androidx.webkit.WebResourceErrorCompat;
import androidx.webkit.WebViewFeature;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

final class LocalContentWebViewClient extends WebViewClientCompat {
    interface Listener {
        void onLocalPageStarted();

        void onLocalPageVisible();

        void onMainFrameError(String description);

        void openExternal(Uri uri);
    }

    static final String APP_HOST = "appassets.androidplatform.net";
    private final WebViewAssetLoader assetLoader;
    private final Listener listener;

    LocalContentWebViewClient(WebViewAssetLoader assetLoader, Listener listener) {
        this.assetLoader = assetLoader;
        this.listener = listener;
    }

    @Override
    public void onPageStarted(WebView view, String url, Bitmap favicon) {
        if (isLocal(Uri.parse(url))) listener.onLocalPageStarted();
    }

    @Override
    public void onPageCommitVisible(WebView view, String url) {
        if (isLocal(Uri.parse(url))) listener.onLocalPageVisible();
    }

    @Override
    public boolean shouldOverrideUrlLoading(@NonNull WebView view, @NonNull WebResourceRequest request) {
        return route(request.getUrl());
    }

    @Override
    @SuppressWarnings("deprecation")
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        return route(Uri.parse(url));
    }

    private boolean route(Uri uri) {
        if (isLocal(uri)) return false;
        listener.openExternal(uri);
        return true;
    }

    @Override
    @Nullable
    public WebResourceResponse shouldInterceptRequest(@NonNull WebView view, @NonNull WebResourceRequest request) {
        return normalizeResponse(request.getUrl(), assetLoader.shouldInterceptRequest(request.getUrl()));
    }

    @Override
    @Nullable
    @SuppressWarnings("deprecation")
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        Uri uri = Uri.parse(url);
        return normalizeResponse(uri, assetLoader.shouldInterceptRequest(uri));
    }

    @Override
    public void onReceivedError(
            @NonNull WebView view,
            @NonNull WebResourceRequest request,
            @NonNull WebResourceErrorCompat error
    ) {
        if (request.isForMainFrame()) {
            String description = WebViewFeature.isFeatureSupported(WebViewFeature.WEB_RESOURCE_ERROR_GET_DESCRIPTION)
                    ? error.getDescription().toString()
                    : "The local learning page could not be loaded.";
            listener.onMainFrameError(description);
        }
    }

    private static boolean isLocal(Uri uri) {
        return "https".equalsIgnoreCase(uri.getScheme()) && APP_HOST.equalsIgnoreCase(uri.getHost());
    }

    @Nullable
    private static WebResourceResponse normalizeResponse(Uri uri, @Nullable WebResourceResponse response) {
        if (response == null) return null;
        String path = uri.getPath() == null ? "" : uri.getPath().toLowerCase(Locale.US);
        String mimeType = mimeTypeFor(path);
        if (mimeType != null) response.setMimeType(mimeType);

        Map<String, String> headers = response.getResponseHeaders() == null
                ? new HashMap<>()
                : new HashMap<>(response.getResponseHeaders());
        headers.put("Cross-Origin-Resource-Policy", "same-origin");
        headers.put("X-Content-Type-Options", "nosniff");
        response.setResponseHeaders(headers);
        return response;
    }

    @Nullable
    private static String mimeTypeFor(String path) {
        if (path.endsWith(".mjs") || path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".wasm")) return "application/wasm";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".webm")) return "video/webm";
        if (path.endsWith(".mp4")) return "video/mp4";
        if (path.endsWith(".onnx") || path.endsWith(".whl") || path.endsWith(".zip")) {
            return "application/octet-stream";
        }
        return null;
    }
}
