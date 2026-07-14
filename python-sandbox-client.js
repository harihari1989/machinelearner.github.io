(() => {
    'use strict';

    class PythonSandboxSession {
        constructor(scope = 'session') {
            this.scope = scope;
            this.worker = null;
            this.pending = new Map();
            this.nextRequestId = 1;
        }

        ensureWorker() {
            if (this.worker) return this.worker;

            const workerUrl = new URL('assets/workers/python-sandbox-worker.mjs?v=20260713-local-runtimes-4', document.baseURI);
            this.worker = new Worker(workerUrl, { type: 'module', name: `python-${this.scope}` });
            this.worker.addEventListener('message', event => {
                const response = event.data || {};
                const request = this.pending.get(response.id);
                if (!request) return;
                this.pending.delete(response.id);
                if (response.error) {
                    request.reject(new Error(response.error));
                } else {
                    request.resolve(response.result);
                }
            });
            this.worker.addEventListener('error', event => {
                const error = new Error(event.message || 'The isolated Python session failed to start.');
                this.pending.forEach(request => request.reject(error));
                this.pending.clear();
                this.worker?.terminate();
                this.worker = null;
            });
            return this.worker;
        }

        send(type, payload = {}) {
            const worker = this.ensureWorker();
            const id = this.nextRequestId;
            this.nextRequestId += 1;

            return new Promise((resolve, reject) => {
                this.pending.set(id, { resolve, reject });
                worker.postMessage({ id, type, scope: this.scope, ...payload });
            });
        }

        run(code, options = {}) {
            return this.send('run', {
                code,
                packages: options.packages || [],
                reset: Boolean(options.reset)
            });
        }

        destroy(reason = 'Python session reset.') {
            const error = new Error(reason);
            this.pending.forEach(request => request.reject(error));
            this.pending.clear();
            this.worker?.terminate();
            this.worker = null;
        }
    }

    window.createMachineLearnerPythonSession = scope => new PythonSandboxSession(scope);
})();
