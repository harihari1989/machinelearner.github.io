# Browser runtime assets

The interactive Python and MNIST lessons keep their execution dependencies in this directory so the labs do not rely on a public CDN at run time.

- **Pyodide 314.0.2** is distributed by the Pyodide project under the Mozilla Public License 2.0. Source: <https://github.com/pyodide/pyodide>
- **NumPy 2.4.3**, **SciPy 1.18.0**, **pandas 3.0.2**, and **scikit-learn 1.8.0** are distributed under BSD licenses. Sources: <https://github.com/numpy/numpy>, <https://github.com/scipy/scipy>, <https://github.com/pandas-dev/pandas>, and <https://github.com/scikit-learn/scikit-learn>
- **joblib 1.5.3** and **threadpoolctl 3.6.0** use BSD 3-Clause licenses; **python-dateutil 2.9.0.post0** is dual-licensed under Apache 2.0 and BSD 3-Clause; **six 1.17.0** and **pytz 2026.1.post1** use MIT licenses. They are bundled as transitive dependencies, with package integrity metadata and upstream filenames recorded in `pyodide-lock.json`.
- **ONNX Runtime Web 1.27.0** is distributed by Microsoft under the MIT License. Source: <https://github.com/microsoft/onnxruntime>

Only the runtime files required by these lessons are included. Versioned upstream package locks remain beside the Pyodide runtime so package integrity metadata is preserved.
