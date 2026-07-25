(() => {
    'use strict';

    const RUNTIME_CACHE_KEY = '20260725-kaggle-ml-1';
    let activeSession = null;

    class PythonSandboxSession {
        constructor(scope = 'session') {
            this.scope = scope;
            this.worker = null;
            this.workerUrl = null;
            this.workerReady = null;
            this.resolveWorkerReady = null;
            this.rejectWorkerReady = null;
            this.isWorkerReady = false;
            this.pending = new Map();
            this.nextRequestId = 1;
        }

        activate() {
            if (activeSession && activeSession !== this) {
                activeSession.destroy('A different isolated Python workspace was opened. Run this cell again to restart its private session.');
            }
            activeSession = this;
        }

        startupError(event = null) {
            const detail = event?.message && event.message !== 'Script error.' ? ` ${event.message}` : '';
            const location = event?.filename
                ? ` (${event.filename}${event.lineno ? `:${event.lineno}` : ''}${event.colno ? `:${event.colno}` : ''})`
                : '';
            const phase = this.isWorkerReady
                ? 'The isolated Python worker stopped unexpectedly.'
                : 'The bundled Python worker could not load.';
            return new Error(`${phase}${detail}${location} Reload the page once to clear stale files, then run the cell again.`);
        }

        failWorker(error) {
            this.rejectWorkerReady?.(error);
            this.pending.forEach(request => {
                clearTimeout(request.timeoutId);
                request.reject(error);
            });
            this.pending.clear();
            this.worker?.terminate();
            this.worker = null;
            this.workerReady = null;
            this.resolveWorkerReady = null;
            this.rejectWorkerReady = null;
            this.isWorkerReady = false;
        }

        ensureWorker() {
            if (this.worker) return this.worker;

            if (window.location.protocol === 'file:') {
                throw new Error('The isolated Python lab requires an http:// or https:// page. Start this repository with `python3 -m http.server 4173 --bind 127.0.0.1`, then open http://127.0.0.1:4173/.');
            }

            if (typeof Worker === 'undefined' || typeof WebAssembly === 'undefined') {
                throw new Error('This browser does not provide the Web Worker and WebAssembly features required by the isolated Python lab.');
            }

            this.workerUrl = new URL(`assets/workers/python-sandbox-worker.js?v=${RUNTIME_CACHE_KEY}`, document.baseURI);
            this.workerReady = new Promise((resolve, reject) => {
                this.resolveWorkerReady = resolve;
                this.rejectWorkerReady = reject;
            });
            // Worker failures are also delivered to every pending cell. Keep the
            // readiness promise from becoming an unrelated unhandled rejection.
            this.workerReady.catch(() => {});

            try {
                this.worker = new Worker(this.workerUrl, { type: 'module', name: `python-${this.scope}` });
            } catch (error) {
                const startupError = new Error(`The bundled Python worker could not be created. ${error?.message || error}`);
                this.failWorker(startupError);
                throw startupError;
            }
            this.worker.addEventListener('message', event => {
                const response = event.data || {};
                if (response.type === 'sandbox-worker-ready') {
                    this.isWorkerReady = true;
                    this.resolveWorkerReady?.();
                    return;
                }
                const request = this.pending.get(response.id);
                if (!request) return;
                this.pending.delete(response.id);
                clearTimeout(request.timeoutId);
                if (response.error) {
                    request.reject(new Error(response.error));
                } else {
                    request.resolve(response.result);
                }
            });
            this.worker.addEventListener('error', event => {
                event.preventDefault?.();
                this.failWorker(this.startupError(event));
            });
            return this.worker;
        }

        send(type, payload = {}) {
            this.activate();

            let worker;
            try {
                worker = this.ensureWorker();
            } catch (error) {
                return Promise.reject(error);
            }
            const id = this.nextRequestId;
            this.nextRequestId += 1;

            return new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    if (!this.pending.has(id)) return;
                    this.destroy('The Python cell exceeded 45 seconds. Its sandbox was stopped; run the cell again to start fresh.');
                }, 45000);
                this.pending.set(id, { resolve, reject, timeoutId });
                this.workerReady.then(() => {
                    if (!this.pending.has(id) || worker !== this.worker) return;
                    try {
                        worker.postMessage({ id, type, scope: this.scope, ...payload });
                    } catch (error) {
                        this.failWorker(new Error(`The isolated Python request could not be sent. ${error?.message || error}`));
                    }
                }).catch(error => {
                    const request = this.pending.get(id);
                    if (!request) return;
                    this.pending.delete(id);
                    clearTimeout(request.timeoutId);
                    request.reject(error);
                });
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
            this.failWorker(error);
            if (activeSession === this) activeSession = null;
        }
    }

    window.createMachineLearnerPythonSession = scope => new PythonSandboxSession(scope);
})();
