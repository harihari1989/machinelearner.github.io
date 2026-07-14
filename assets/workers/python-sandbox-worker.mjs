import { loadPyodide } from '../vendor/pyodide/pyodide.mjs';

const PYODIDE_BASE_URL = new URL('../vendor/pyodide/', self.location.href).href;
const SUPPORTED_PACKAGES = new Set(['numpy']);
const runtimeFetch = self.fetch.bind(self);
const blockedFetch = () => Promise.reject(new TypeError('Network access is disabled inside this Python session.'));

let runtimePromise = null;

function allowRuntimeAssetLoading() {
    self.fetch = runtimeFetch;
}

function blockUserNetworkCapabilities() {
    self.fetch = blockedFetch;
    self.WebSocket = undefined;
    self.EventSource = undefined;
    self.WebTransport = undefined;
    self.Worker = undefined;
}

async function getRuntime() {
    if (!runtimePromise) {
        runtimePromise = (async () => {
            allowRuntimeAssetLoading();
            const runtime = await loadPyodide({ indexURL: PYODIDE_BASE_URL });
            await runtime.runPythonAsync(`
import builtins as _ml_builtins

_ml_scopes = {}
_ml_real_import = _ml_builtins.__import__
_ml_blocked_modules = {"js", "pyodide", "pyodide_js", "_pyodide", "micropip"}

def _ml_sandbox_import(name, globals=None, locals=None, fromlist=(), level=0):
    root = name.split(".", 1)[0]
    if root in _ml_blocked_modules:
        raise ImportError(f"{root!r} is unavailable inside this isolated browser session")
    return _ml_real_import(name, globals, locals, fromlist, level)

def _ml_create_scope():
    safe_builtins = dict(vars(_ml_builtins))
    safe_builtins["__import__"] = _ml_sandbox_import
    return {
        "__builtins__": safe_builtins,
        "__name__": "__main__",
        "__doc__": None,
    }
            `);
            blockUserNetworkCapabilities();
            return runtime;
        })().catch(error => {
            runtimePromise = null;
            throw error;
        });
    }
    return runtimePromise;
}

async function loadRequestedPackages(runtime, packages) {
    allowRuntimeAssetLoading();
    try {
        for (const packageName of packages || []) {
            if (!SUPPORTED_PACKAGES.has(packageName)) {
                throw new Error(`Package ${packageName} is not bundled in this browser lab.`);
            }
            await runtime.loadPackage(packageName);
        }
    } finally {
        blockUserNetworkCapabilities();
    }
}

async function runCode(runtime, request) {
    await loadRequestedPackages(runtime, request.packages);
    blockUserNetworkCapabilities();
    runtime.globals.set('_ml_code', request.code || '');
    runtime.globals.set('_ml_scope_id', request.scope || 'session');
    runtime.globals.set('_ml_reset_scope', Boolean(request.reset));

    try {
        const resultJson = await runtime.runPythonAsync(`
import io as _ml_io
import json as _ml_json
import sys as _ml_sys
import traceback as _ml_traceback

if _ml_reset_scope:
    _ml_scopes.pop(_ml_scope_id, None)

_ml_scope = _ml_scopes.setdefault(_ml_scope_id, _ml_create_scope())
_ml_stdout = _ml_io.StringIO()
_ml_stderr = _ml_io.StringIO()
_ml_plot = None
_ml_value = None
_ml_old_stdout = _ml_sys.stdout
_ml_old_stderr = _ml_sys.stderr
_ml_sys.stdout = _ml_stdout
_ml_sys.stderr = _ml_stderr

try:
    _ml_compiled = compile(_ml_code, "<browser-python-sandbox>", "exec")
    _ml_value = exec(_ml_compiled, _ml_scope, _ml_scope)
    _ml_plot = _ml_scope.pop("_lesson_plot", None)
except Exception:
    _ml_traceback.print_exc(file=_ml_stderr)
finally:
    _ml_sys.stdout = _ml_old_stdout
    _ml_sys.stderr = _ml_old_stderr

_ml_json.dumps({
    "stdout": _ml_stdout.getvalue(),
    "stderr": _ml_stderr.getvalue(),
    "plot": _ml_plot,
    "result": None if _ml_value is None else str(_ml_value),
})
        `);
        return JSON.parse(resultJson);
    } finally {
        runtime.globals.delete('_ml_code');
        runtime.globals.delete('_ml_scope_id');
        runtime.globals.delete('_ml_reset_scope');
    }
}

self.addEventListener('message', async event => {
    const request = event.data || {};
    const response = { id: request.id };

    try {
        const runtime = await getRuntime();
        if (request.type === 'reset') {
            runtime.globals.set('_ml_scope_id', request.scope || 'session');
            await runtime.runPythonAsync('_ml_scopes.pop(_ml_scope_id, None)');
            runtime.globals.delete('_ml_scope_id');
            response.result = { reset: true };
        } else if (request.type === 'run') {
            response.result = await runCode(runtime, request);
        } else {
            throw new Error(`Unknown sandbox request: ${request.type}`);
        }
    } catch (error) {
        response.error = error?.message || String(error);
    }

    self.postMessage(response);
});
