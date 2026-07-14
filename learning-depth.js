(function () {
    'use strict';

    const pythonExamples = {
        core: `temperature = 21.5
is_warm = temperature > 20
label = "warm" if is_warm else "cool"

for hour in range(3):
    adjusted = temperature + 0.5 * hour
    print(f"hour {hour}: {adjusted:.1f}°C → {label}")

print("types:", type(temperature).__name__, type(is_warm).__name__, type(label).__name__)`,
        collections: `records = [
    {"name": "Ada", "score": 0.91},
    {"name": "Lin", "score": 0.74},
    {"name": "Sam", "score": 0.86},
]

def passed(record, threshold=0.8):
    return record["score"] >= threshold

selected = [row["name"] for row in records if passed(row)]
mean_score = sum(row["score"] for row in records) / len(records)

print("selected:", selected)
print("mean score:", round(mean_score, 3))`,
        numpy: `import numpy as np

# 3 examples × 2 features
X = np.array([[1.0, 2.0],
              [2.0, 0.5],
              [-1.0, 3.0]])
w = np.array([0.6, -0.2])
b = 0.4

scores = X @ w + b       # matrix-vector product, then broadcast b
centered = X - X.mean(axis=0)

print("X shape:", X.shape)
print("w shape:", w.shape)
print("scores:", np.round(scores, 3))
print("column means after centering:", np.round(centered.mean(axis=0), 8))`,
        gradient: `# Minimize L(w) = (w - 3)^2 without an ML library.
def loss(w):
    return (w - 3.0) ** 2

def gradient(w):
    return 2.0 * (w - 3.0)

w = -1.0
learning_rate = 0.2

for step in range(8):
    slope = gradient(w)
    print(f"step {step}: w={w: .4f}, loss={loss(w):.4f}, slope={slope: .4f}")
    w = w - learning_rate * slope

print("final w:", round(w, 4))`,
        metrics: `actual    = [1, 0, 1, 1, 0, 0, 1, 0]
predicted = [1, 0, 1, 0, 1, 0, 1, 0]

tp = sum(a == 1 and p == 1 for a, p in zip(actual, predicted))
tn = sum(a == 0 and p == 0 for a, p in zip(actual, predicted))
fp = sum(a == 0 and p == 1 for a, p in zip(actual, predicted))
fn = sum(a == 1 and p == 0 for a, p in zip(actual, predicted))

accuracy = (tp + tn) / len(actual)
precision = tp / (tp + fp)
recall = tp / (tp + fn)

print(f"confusion counts: TP={tp}, TN={tn}, FP={fp}, FN={fn}")
print(f"accuracy={accuracy:.3f}")
print(f"precision={precision:.3f}")
print(f"recall={recall:.3f}")`
    };

    function cssColor(name, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return value || fallback;
    }

    function setupGeneralizationLab() {
        const canvas = document.getElementById('generalizationCanvas');
        const range = document.getElementById('complexityRange');
        const valueEl = document.getElementById('complexityValue');
        const labelEl = document.getElementById('complexityLabel');
        const readoutEl = document.getElementById('generalizationReadout');
        if (!canvas || !range) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const train = [
            [0.06, 0.58], [0.14, 0.73], [0.23, 0.77], [0.34, 0.66],
            [0.45, 0.48], [0.56, 0.31], [0.67, 0.27], [0.79, 0.42], [0.92, 0.61]
        ];
        const test = [
            [0.10, 0.66], [0.28, 0.74], [0.39, 0.58], [0.51, 0.39],
            [0.62, 0.28], [0.73, 0.33], [0.86, 0.53], [0.97, 0.67]
        ];
        const padding = { left: 44, right: 18, top: 30, bottom: 42 };

        const mapX = x => padding.left + x * (canvas.width - padding.left - padding.right);
        const mapY = y => canvas.height - padding.bottom - y * (canvas.height - padding.top - padding.bottom);

        function modelValue(x, complexity) {
            if (complexity <= 3) {
                const slope = 0.10 + complexity * 0.025;
                return 0.5 + slope * (x - 0.5);
            }
            const signal = 0.51 + 0.24 * Math.sin(2.25 * Math.PI * x + 0.15);
            if (complexity <= 6) {
                return signal + (complexity - 4) * 0.008 * Math.sin(4 * Math.PI * x);
            }
            const amplitude = 0.035 + (complexity - 7) * 0.026;
            return signal + amplitude * Math.sin((complexity + 5) * Math.PI * x);
        }

        function drawPoint(x, y, fill, outline, hollow) {
            ctx.beginPath();
            ctx.arc(mapX(x), mapY(y), 5, 0, Math.PI * 2);
            ctx.fillStyle = hollow ? cssColor('--paper', '#ffffff') : fill;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = outline;
            ctx.stroke();
        }

        function draw() {
            const complexity = Number(range.value);
            const ink = cssColor('--ink', '#1f2937');
            const soft = cssColor('--ink-soft', '#475569');
            const grid = cssColor('--grid', '#e2e8f0');
            const paper = cssColor('--canvas-bg', '#f8fafc');
            const trainColor = cssColor('--accent-1', '#38bdf8');
            const testColor = cssColor('--accent-2', '#fb7185');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = paper;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = grid;
            ctx.lineWidth = 1;
            ctx.fillStyle = soft;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 4; i += 1) {
                const y = padding.top + i * (canvas.height - padding.top - padding.bottom) / 4;
                ctx.beginPath();
                ctx.moveTo(padding.left, y);
                ctx.lineTo(canvas.width - padding.right, y);
                ctx.stroke();
                ctx.fillText((1 - i / 4).toFixed(2), padding.left - 8, y + 4);
            }

            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(padding.left, padding.top);
            ctx.lineTo(padding.left, canvas.height - padding.bottom);
            ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.fillStyle = soft;
            ctx.fillText('feature value', (padding.left + canvas.width - padding.right) / 2, canvas.height - 13);
            ctx.save();
            ctx.translate(14, (padding.top + canvas.height - padding.bottom) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText('target', 0, 0);
            ctx.restore();

            ctx.beginPath();
            for (let i = 0; i <= 180; i += 1) {
                const x = i / 180;
                const y = Math.max(0.04, Math.min(0.96, modelValue(x, complexity)));
                if (i === 0) ctx.moveTo(mapX(x), mapY(y));
                else ctx.lineTo(mapX(x), mapY(y));
            }
            ctx.strokeStyle = ink;
            ctx.lineWidth = 3;
            ctx.stroke();

            train.forEach(([x, y]) => drawPoint(x, y, trainColor, trainColor, false));
            test.forEach(([x, y]) => drawPoint(x, y, paper, testColor, true));

            ctx.textAlign = 'left';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = trainColor;
            ctx.fillText('● training', padding.left + 6, 18);
            ctx.fillStyle = testColor;
            ctx.fillText('○ unseen test', padding.left + 94, 18);

            if (valueEl) valueEl.textContent = String(complexity);
            if (complexity <= 3) {
                if (labelEl) labelEl.textContent = 'Underfitting';
                if (readoutEl) readoutEl.textContent = 'The rule is too rigid to capture the broad signal, so both training and unseen cases retain systematic error.';
            } else if (complexity <= 6) {
                if (labelEl) labelEl.textContent = 'Balanced model';
                if (readoutEl) readoutEl.textContent = 'Enough flexibility to follow the stable signal without chasing every noisy training point.';
            } else {
                if (labelEl) labelEl.textContent = 'Overfitting';
                if (readoutEl) readoutEl.textContent = 'Extra wiggles can reduce training error while making predictions between examples unstable; unseen error can rise.';
            }
        }

        range.addEventListener('input', draw);
        const themeObserver = new MutationObserver(draw);
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        draw();
    }

    function setupPythonCourseLab() {
        const select = document.getElementById('pythonCourseExample');
        const editor = document.getElementById('pythonCourseEditor');
        const runButton = document.getElementById('pythonCourseRun');
        const resetButton = document.getElementById('pythonCourseReset');
        const output = document.getElementById('pythonCourseOutput');
        const status = document.getElementById('pythonCourseStatus');
        if (!select || !editor || !runButton || !output) return;

        function loadSelectedExample() {
            editor.value = pythonExamples[select.value] || pythonExamples.core;
            output.textContent = 'Predict the result, then run the code.';
            if (status) status.textContent = 'Ready';
        }

        async function getRuntime() {
            if (window.__machineLearnerPyodidePromise) {
                return window.__machineLearnerPyodidePromise;
            }
            if (typeof window.loadPyodide !== 'function') {
                throw new Error('The browser Python runtime is still loading. Wait a moment and run again.');
            }
            window.__machineLearnerPyodidePromise = window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.2/full/'
            });
            return window.__machineLearnerPyodidePromise;
        }

        async function runCode() {
            runButton.disabled = true;
            if (resetButton) resetButton.disabled = true;
            if (status) status.textContent = 'Loading Python…';
            output.textContent = '';
            const lines = [];

            try {
                const pyodide = await getRuntime();
                pyodide.setStdout({ batched: text => lines.push(text) });
                pyodide.setStderr({ batched: text => lines.push(text) });
                if (status) status.textContent = 'Running…';
                await pyodide.loadPackagesFromImports(editor.value);
                const result = await pyodide.runPythonAsync(editor.value);
                if (result !== undefined && result !== null && lines.length === 0) {
                    lines.push(String(result));
                }
                output.textContent = lines.join('\n') || 'Code completed without printed output.';
                if (status) status.textContent = 'Complete';
            } catch (error) {
                output.textContent = String(error && error.message ? error.message : error);
                if (status) status.textContent = 'Needs attention';
            } finally {
                runButton.disabled = false;
                if (resetButton) resetButton.disabled = false;
            }
        }

        select.addEventListener('change', loadSelectedExample);
        runButton.addEventListener('click', runCode);
        if (resetButton) resetButton.addEventListener('click', loadSelectedExample);
        loadSelectedExample();
    }

    function initialize() {
        setupGeneralizationLab();
        setupPythonCourseLab();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
