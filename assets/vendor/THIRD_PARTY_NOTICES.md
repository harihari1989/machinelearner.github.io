# Browser runtime assets

The interactive Python and MNIST lessons keep their execution dependencies in this directory so the labs do not rely on a public CDN at run time.

- **Pyodide 314.0.2** and the bundled NumPy wheel are distributed by the Pyodide project under the Mozilla Public License 2.0. Source: <https://github.com/pyodide/pyodide>
- **ONNX Runtime Web 1.27.0** is distributed by Microsoft under the MIT License. Source: <https://github.com/microsoft/onnxruntime>

Only the runtime files required by these lessons are included. Versioned upstream package locks remain beside the Pyodide runtime so package integrity metadata is preserved.
