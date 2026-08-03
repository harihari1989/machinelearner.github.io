#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadPyodide } from '../assets/vendor/pyodide/pyodide.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
const html = read('index.html');
const css = read('kaggle-ml-course.css');
const javascript = read('kaggle-ml-course.js');
const worker = read('assets/workers/python-sandbox-worker.js');
const packageLock = JSON.parse(read('assets/vendor/pyodide/pyodide-lock.json'));
let failures = 0;

function check(condition, message) {
    if (condition) {
        console.log(`PASS ${message}`);
    } else {
        failures += 1;
        console.error(`FAIL ${message}`);
    }
}

const context = {
    window: {},
    document: {
        readyState: 'loading',
        addEventListener() {},
    },
    getComputedStyle() {
        return { getPropertyValue() { return ''; } };
    },
    history: {},
    console,
};
vm.createContext(context);
vm.runInContext(javascript, context, { filename: 'kaggle-ml-course.js' });
const labs = context.window.KaggleMLCourseData?.labs;
const labContexts = context.window.KaggleMLCourseData?.contexts;

check(
    html.includes('data-chapter="kaggle-ml"') &&
    html.includes('>Practice</button>'),
    'separate practical machine-learning chapter tab'
);

const lessonIds = [
    'kaggle-how-models-work',
    'kaggle-data-exploration',
    'kaggle-first-model',
    'kaggle-model-validation',
    'kaggle-under-overfit',
    'kaggle-random-forests',
    'kaggle-capstone',
    'kaggle-ml-lab',
];
lessonIds.forEach(id => check(html.includes(`id="${id}"`), `lesson section ${id}`));

for (const marker of [
    'DecisionTreeRegressor(max_leaf_nodes=',
    'pd.read_csv(path)',
    'train_test_split(X, y',
    'mean_absolute_error(val_y, val_predictions)',
    'RandomForestRegressor(n_estimators=100',
    'MODEL EXPLANATION',
    'Explain-it-back checklist',
    'The estimator and dataframe APIs are genuine pandas/scikit-learn calls',
]) {
    check(`${html}\n${javascript}`.includes(marker), `tutorial marker ${marker}`);
}

check(css.includes('.kaggle-lesson-layout'), 'course layout styling');
check(css.includes('.kaggle-lab-sidecar'), 'side-by-side dataset and formula styling');
check(css.includes('@media (max-width: 680px)'), 'mobile course styling');
check(css.includes('prefers-reduced-motion'), 'reduced-motion styling');
check(
    worker.includes("'numpy', 'pandas', 'scikit-learn'"),
    'sandbox package allowlist'
);

const idMatches = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
const duplicateIds = [...new Set(idMatches.filter((id, index) => idMatches.indexOf(id) !== index))];
check(duplicateIds.length === 0, `${idMatches.length} unique document IDs`);
if (duplicateIds.length) console.error(`Duplicate IDs: ${duplicateIds.join(', ')}`);

const localTargets = [...html.matchAll(/href="#([^"]+)"/g)].map(match => match[1]);
const idSet = new Set(idMatches);
const missingTargets = [...new Set(localTargets.filter(target => !idSet.has(target)))];
check(missingTargets.length === 0, `${localTargets.length} local references resolve`);
if (missingTargets.length) console.error(`Missing targets: ${missingTargets.join(', ')}`);

const expectedLabs = [
    'models',
    'explore',
    'first-model',
    'validation',
    'capacity',
    'forest',
    'capstone',
];
check(labs && Object.keys(labs).length === expectedLabs.length, 'seven runnable lesson labs');
const kaggleChapter = html.slice(
    html.indexOf('<section class="chapter kaggle-ml-course"'),
    html.indexOf('<section class="chapter" data-chapter="neural">')
);
check(!/\bcompetition(s)?\b/i.test(kaggleChapter), 'no competitive framing in the learning chapter');
check(!/\bsubmission\b/i.test(kaggleChapter), 'no submission workflow in the learning chapter');
for (const id of expectedLabs) {
    const lab = labs?.[id];
    const labContext = labContexts?.[id];
    check(
        Boolean(lab?.goal && lab?.apis && lab?.challenge && lab?.code),
        `complete practical brief for ${id}`
    );
    check(
        html.includes(`value="${id}"`) && html.includes(`data-kaggle-lab="${id}"`),
        `selector and lesson launch for ${id}`
    );
    check(
        Boolean(
            labContext?.dataset?.name &&
            labContext.dataset.headers?.length >= 4 &&
            labContext.dataset.rows?.length >= 5 &&
            labContext.dataset.roles?.length >= 2
        ),
        `loaded side-panel dataset for ${id}`
    );
    check(
        Boolean(
            labContext?.formula?.expression &&
            labContext.formula.terms?.length >= 4 &&
            labContext.formula.derivation?.length >= 4 &&
            labContext.formula.type
        ),
        `visual formula derivation for ${id}`
    );
}

const wheels = [
    'numpy-2.4.3-cp314-cp314-pyemscripten_2026_0_wasm32.whl',
    'pandas-3.0.2-cp314-cp314-pyemscripten_2026_0_wasm32.whl',
    'scipy-1.18.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl',
    'scikit_learn-1.8.0-cp314-cp314-pyemscripten_2026_0_wasm32.whl',
    'joblib-1.5.3-py3-none-any.whl',
    'threadpoolctl-3.6.0-py3-none-any.whl',
    'python_dateutil-2.9.0.post0-py2.py3-none-any.whl',
    'six-1.17.0-py2.py3-none-any.whl',
    'pytz-2026.1.post1-py2.py3-none-any.whl',
];
wheels.forEach(file => {
    const wheelPath = path.join(repositoryRoot, 'assets/vendor/pyodide', file);
    const lockEntry = Object.values(packageLock.packages).find(entry => entry.file_name === file);
    check(existsSync(wheelPath), `bundled wheel ${file}`);
    if (existsSync(wheelPath) && lockEntry?.sha256) {
        const digest = createHash('sha256').update(readFileSync(wheelPath)).digest('hex');
        check(digest === lockEntry.sha256, `integrity ${file}`);
    } else {
        check(false, `lock metadata ${file}`);
    }
});

if (!failures) {
    const runtimePath = path.join(repositoryRoot, 'assets/vendor/pyodide') + path.sep;
    const pyodide = await loadPyodide({ indexURL: runtimePath });
    await pyodide.loadPackage(['pandas', 'scikit-learn']);
    for (const id of expectedLabs) {
        pyodide.globals.set('_course_code', labs[id].code);
        try {
            pyodide.runPython(`
import contextlib as _course_contextlib
import io as _course_io

_course_namespace = {}
with _course_contextlib.redirect_stdout(_course_io.StringIO()):
    exec(compile(_course_code, "<${id}>", "exec"), _course_namespace, _course_namespace)
            `);
            console.log(`PASS executable Python lab ${id}`);
        } catch (error) {
            failures += 1;
            console.error(`FAIL executable Python lab ${id}\n${error}`);
        } finally {
            pyodide.globals.delete('_course_code');
        }
    }
}

if (failures) {
    console.error(`Kaggle ML course validation failed with ${failures} issue(s).`);
    process.exit(1);
}

console.log('Kaggle ML course validation passed.');
