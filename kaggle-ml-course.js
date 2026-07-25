(() => {
    'use strict';

    const LABS = {
        models: {
            goal: 'Train a small regression tree and inspect the exact rules used for prediction.',
            apis: 'DataFrame · DecisionTreeRegressor · fit · predict · tree_',
            challenge: 'Change max_leaf_nodes from 4 to 2 and explain which houses are forced to share an estimate.',
            code: `import pandas as pd
from sklearn.tree import DecisionTreeRegressor, export_text

homes = pd.DataFrame({
    "LivingArea": [820, 960, 1100, 1280, 1450, 1680, 1850, 2050, 2320, 2600, 2950, 3300],
    "Quality":    [4,   5,   5,    6,    6,    7,    7,    8,    8,    9,    9,    10],
    "Age":        [72,  65,  48,   42,   34,   30,   24,   18,   14,   9,    6,    2],
    "SalePrice":  [118, 132, 148,  166,  188,  222,  248,  286,  322,  375,  428,  510]
})

features = ["LivingArea", "Quality", "Age"]
X = homes[features]
y = homes["SalePrice"]

model = DecisionTreeRegressor(max_leaf_nodes=4, random_state=1)
model.fit(X, y)

new_house = pd.DataFrame(
    [[1850, 7, 24]],
    columns=features
)
prediction = model.predict(new_house)[0]

print("Learned rules (prices are in $1,000s)")
print(export_text(model, feature_names=features))
print(f"New house prediction: \${prediction:,.1f}k")
print("Reached leaf:", int(model.apply(new_house)[0]))
print("Tree depth:", model.get_depth())
print("Leaf count:", model.get_n_leaves())

assert model.get_n_leaves() <= 4
assert prediction > 0`,
        },
        explore: {
            goal: 'Audit a messy CSV before choosing a target or feature set.',
            apis: 'read_csv · shape · head · dtypes · describe · isna · nunique',
            challenge: 'Find the leaking column and create a clean list of features that would exist before the sale.',
            code: `from io import StringIO
import pandas as pd

csv = """Id,Neighborhood,LotArea,YearBuilt,LivingArea,GarageCars,PostSaleTax,SalePrice
101,North,8450,2003,1710,2,12400,208500
102,West,9600,1976,1262,2,10950,181500
103,North,11250,2001,1786,2,13100,223500
104,East,9550,1915,1717,3,9200,140000
105,East,14260,2000,2198,,15700,250000
106,South,14115,1993,1362,2,10100,143000
107,West,10084,2004,1694,2,13400,307000
108,North,10382,1973,2090,2,11850,200000
"""

homes = pd.read_csv(StringIO(csv))

print("Shape:", homes.shape)
print("\\nColumns:", homes.columns.tolist())
print("\\nFirst three rows")
print(homes.head(3).to_string(index=False))
print("\\nDtypes")
print(homes.dtypes.to_string())
print("\\nNumeric summary")
print(homes.describe().round(1).to_string())
print("\\nMissing values")
print(homes.isna().sum().to_string())
print("\\nUnique values")
print(homes.nunique().to_string())

target = "SalePrice"
identifier = "Id"
leakage = "PostSaleTax"  # measured after the sale: invalid at prediction time
features = ["LotArea", "YearBuilt", "LivingArea", "GarageCars"]

assert target not in features
assert identifier not in features
assert leakage not in features
print("\\nCandidate pre-sale features:", features)`,
        },
        'first-model': {
            goal: 'Build a reproducible baseline using an explicit feature contract.',
            apis: 'DataFrame selection · DecisionTreeRegressor · random_state · fit · predict',
            challenge: 'Remove Quality, refit, and compare residuals. Does a changed training fit prove better generalization?',
            code: `import pandas as pd
from sklearn.tree import DecisionTreeRegressor

homes = pd.DataFrame({
    "LotArea":      [8450, 9600, 11250, 9550, 14260, 14115, 10084, 10382, 6120, 7420, 11820, 9300],
    "YearBuilt":    [2003, 1976, 2001, 1915, 2000, 1993, 2004, 1973, 1931, 1958, 2010, 1987],
    "LivingArea":   [1710, 1262, 1786, 1717, 2198, 1362, 1694, 2090, 1077, 1250, 2440, 1560],
    "FullBath":     [2, 2, 2, 1, 2, 1, 2, 2, 1, 1, 3, 2],
    "Quality":      [7, 6, 7, 7, 8, 5, 8, 7, 5, 6, 9, 7],
    "SalePrice":    [208500, 181500, 223500, 140000, 250000, 143000, 307000, 200000, 129900, 154000, 385000, 214000]
})

features = ["LotArea", "YearBuilt", "LivingArea", "FullBath", "Quality"]
y = homes["SalePrice"]
X = homes[features]

model = DecisionTreeRegressor(max_leaf_nodes=6, random_state=1)
model.fit(X, y)
predictions = model.predict(X)

comparison = pd.DataFrame({
    "actual": y,
    "prediction": predictions,
    "absolute_error": (y - predictions).abs()
})

print("X shape:", X.shape)
print("y shape:", y.shape)
print("\\nFirst five fitted predictions")
print(comparison.head().round(0).to_string(index=False))
print("\\nTraining MAE:", round(comparison["absolute_error"].mean(), 2))
print("Feature order:", model.feature_names_in_.tolist())

assert len(predictions) == len(homes)
assert model.feature_names_in_.tolist() == features
print("\\nBaseline trained. Next step: evaluate unseen rows.")`,
        },
        validation: {
            goal: 'Create a holdout set and measure generalization in the target’s units.',
            apis: 'train_test_split · fit · predict · mean_absolute_error',
            challenge: 'Try test_size=0.4 and three random_state values. Report the mean and range of validation MAE.',
            code: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error

rng = np.random.default_rng(7)
n = 180
area = rng.integers(700, 3400, n)
quality = rng.integers(3, 11, n)
age = rng.integers(0, 95, n)
noise = rng.normal(0, 18000, n)
price = 35000 + 92 * area + 21000 * quality - 720 * age + noise

homes = pd.DataFrame({
    "LivingArea": area,
    "Quality": quality,
    "Age": age,
    "SalePrice": price
})
features = ["LivingArea", "Quality", "Age"]
X = homes[features]
y = homes["SalePrice"]

train_X, val_X, train_y, val_y = train_test_split(
    X, y, test_size=0.25, random_state=1
)
model = DecisionTreeRegressor(max_leaf_nodes=16, random_state=1)
model.fit(train_X, train_y)

train_predictions = model.predict(train_X)
val_predictions = model.predict(val_X)
train_mae = mean_absolute_error(train_y, train_predictions)
val_mae = mean_absolute_error(val_y, val_predictions)

print("Training rows:", len(train_X))
print("Validation rows:", len(val_X))
print(f"Training MAE:   \${train_mae:,.0f}")
print(f"Validation MAE: \${val_mae:,.0f}")
print(f"Generalization gap: \${val_mae - train_mae:,.0f}")

sample = pd.DataFrame({
    "actual": val_y.to_numpy()[:12],
    "predicted": val_predictions[:12]
})
print("\\nHeld-out examples")
print(sample.round(0).to_string(index=False))

_lesson_plot = {
    "type": "residuals",
    "title": "Held-out predictions",
    "actual": [float(value) for value in val_y.to_numpy()[:24]],
    "predicted": [float(value) for value in val_predictions[:24]]
}

assert set(train_X.index).isdisjoint(set(val_X.index))
assert val_mae >= 0`,
        },
        capacity: {
            goal: 'Select tree capacity from a validation curve instead of training error.',
            apis: 'max_leaf_nodes · looped model comparison · mean_absolute_error',
            challenge: 'Choose the smallest leaf count within 2% of the best MAE, then justify the simpler model.',
            code: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error

rng = np.random.default_rng(11)
n = 320
area = rng.uniform(650, 3600, n)
quality = rng.integers(3, 11, n)
age = rng.uniform(0, 100, n)
price = (
    48000
    + 70 * area
    + 18500 * quality
    - 530 * age
    + 0.018 * np.maximum(area - 1900, 0) ** 2
    + rng.normal(0, 21000, n)
)

X = pd.DataFrame({"LivingArea": area, "Quality": quality, "Age": age})
y = pd.Series(price, name="SalePrice")
train_X, val_X, train_y, val_y = train_test_split(
    X, y, test_size=0.25, random_state=3
)

leaf_options = [2, 4, 8, 16, 32, 64, 128]
train_scores = []
validation_scores = []

for leaves in leaf_options:
    model = DecisionTreeRegressor(max_leaf_nodes=leaves, random_state=1)
    model.fit(train_X, train_y)
    train_scores.append(mean_absolute_error(train_y, model.predict(train_X)))
    validation_scores.append(mean_absolute_error(val_y, model.predict(val_X)))

results = pd.DataFrame({
    "max_leaf_nodes": leaf_options,
    "train_mae": train_scores,
    "validation_mae": validation_scores
})
best_row = results.loc[results["validation_mae"].idxmin()]

print(results.round(0).to_string(index=False))
print(
    f"\\nBest validation choice: {int(best_row['max_leaf_nodes'])} leaves "
    f"with MAE \${best_row['validation_mae']:,.0f}"
)

_lesson_plot = {
    "type": "lines",
    "title": "Capacity sweep",
    "x": leaf_options,
    "x_label": "Maximum leaves",
    "series": [
        {"label": "Training MAE", "values": [float(v) for v in train_scores]},
        {"label": "Validation MAE", "values": [float(v) for v in validation_scores]}
    ]
}

assert best_row["validation_mae"] == min(validation_scores)`,
        },
        forest: {
            goal: 'Compare one unstable tree with averaged ensembles on the same holdout rows.',
            apis: 'RandomForestRegressor · n_estimators · feature_importances_ · MAE',
            challenge: 'Try 5, 25, and 100 trees. Keep the smallest forest within 1% of the best validation MAE.',
            code: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

rng = np.random.default_rng(19)
n = 360
X = pd.DataFrame({
    "LivingArea": rng.uniform(700, 3500, n),
    "Quality": rng.integers(3, 11, n),
    "Age": rng.uniform(0, 100, n),
    "GarageCars": rng.integers(0, 4, n)
})
y = (
    42000
    + 78 * X["LivingArea"]
    + 19500 * X["Quality"]
    - 610 * X["Age"]
    + 14500 * X["GarageCars"]
    + rng.normal(0, 24000, n)
)
train_X, val_X, train_y, val_y = train_test_split(
    X, y, test_size=0.25, random_state=4
)

models = {
    "Single tree": DecisionTreeRegressor(random_state=1),
    "Forest · 5 trees": RandomForestRegressor(n_estimators=5, random_state=1),
    "Forest · 25 trees": RandomForestRegressor(n_estimators=25, random_state=1),
    "Forest · 100 trees": RandomForestRegressor(n_estimators=100, random_state=1)
}
scores = {}
for name, model in models.items():
    model.fit(train_X, train_y)
    scores[name] = mean_absolute_error(val_y, model.predict(val_X))

for name, score in scores.items():
    print(f"{name:20s} validation MAE = \${score:,.0f}")

final_forest = models["Forest · 100 trees"]
importance = pd.Series(
    final_forest.feature_importances_,
    index=train_X.columns
).sort_values(ascending=False)
print("\\nImpurity-based feature importance")
print(importance.round(3).to_string())

_lesson_plot = {
    "type": "bars",
    "title": "Validation MAE by model",
    "labels": list(scores.keys()),
    "values": [float(value) for value in scores.values()],
    "unit": "$"
}

assert len(final_forest.estimators_) == 100`,
        },
        competition: {
            goal: 'Train on all labeled rows and generate a schema-safe submission for unseen test rows.',
            apis: 'RandomForestRegressor · DataFrame · predict · to_csv · assert',
            challenge: 'Break one contract assertion deliberately, read the failure, then repair the submission.',
            code: `from io import StringIO
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor

rng = np.random.default_rng(23)
train_rows = 140
test_rows = 8

train = pd.DataFrame({
    "Id": np.arange(1001, 1001 + train_rows),
    "LivingArea": rng.uniform(700, 3500, train_rows),
    "Quality": rng.integers(3, 11, train_rows),
    "Age": rng.uniform(0, 100, train_rows)
})
train["SalePrice"] = (
    45000
    + 82 * train["LivingArea"]
    + 20500 * train["Quality"]
    - 640 * train["Age"]
    + rng.normal(0, 20000, train_rows)
)

test = pd.DataFrame({
    "Id": np.arange(9001, 9001 + test_rows),
    "LivingArea": rng.uniform(700, 3500, test_rows),
    "Quality": rng.integers(3, 11, test_rows),
    "Age": rng.uniform(0, 100, test_rows)
})

features = ["LivingArea", "Quality", "Age"]
final_model = RandomForestRegressor(
    n_estimators=80,
    min_samples_leaf=2,
    random_state=1
)
final_model.fit(train[features], train["SalePrice"])
test_predictions = final_model.predict(test[features])

submission = pd.DataFrame({
    "Id": test["Id"],
    "SalePrice": test_predictions
})

# Submission contract tests
assert submission.columns.tolist() == ["Id", "SalePrice"]
assert len(submission) == len(test)
assert submission["Id"].equals(test["Id"])
assert submission["SalePrice"].notna().all()
assert submission["Id"].is_unique

csv_text = submission.to_csv(index=False)
round_trip = pd.read_csv(StringIO(csv_text))
assert round_trip.columns.tolist() == ["Id", "SalePrice"]
assert len(round_trip) == test_rows

print("Submission preview")
print(submission.round({"SalePrice": 0}).to_string(index=False))
print("\\nCSV contract passed:", submission.shape)
print("\\nFirst four CSV lines")
print("\\n".join(csv_text.splitlines()[:4]))`,
        },
    };

    const byId = id => document.getElementById(id);
    const css = name => getComputedStyle(document.body).getPropertyValue(name).trim();

    function roundedRect(context, x, y, width, height, radius) {
        const safeRadius = Math.min(radius, width / 2, height / 2);
        context.beginPath();
        context.roundRect(x, y, width, height, safeRadius);
    }

    function canvasTheme() {
        return {
            ink: css('--ink') || '#1f2937',
            soft: css('--ink-soft') || '#475569',
            grid: css('--grid') || '#e2e8f0',
            surface: css('--canvas-bg') || '#f8fafc',
            accent: css('--accent-1') || '#0f766e',
            second: css('--accent-2') || '#fb7185',
            third: css('--accent-3') || '#34d399',
            fourth: css('--accent-4') || '#d97706',
        };
    }

    function clearCanvas(canvas) {
        if (!canvas) return null;
        const context = canvas.getContext('2d');
        const theme = canvasTheme();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = theme.surface;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        return { context, theme };
    }

    function drawTree() {
        const canvas = byId('kaggleTreeCanvas');
        const state = clearCanvas(canvas);
        if (!state) return;
        const { context, theme } = state;
        const area = Number(byId('kaggleArea')?.value || 1850);
        const quality = Number(byId('kaggleQuality')?.value || 7);
        const age = Number(byId('kaggleAge')?.value || 24);
        const highQuality = quality >= 7;
        const secondTest = highQuality ? area >= 2000 : age <= 30;
        const leaf = highQuality ? (secondTest ? 0 : 1) : (secondTest ? 2 : 3);
        const predictions = [345, 285, 238, 175];
        const labels = ['$345k', '$285k', '$238k', '$175k'];
        const nodePositions = [
            { x: 290, y: 30, w: 140, h: 54, text: 'Quality ≥ 7?' },
            { x: 130, y: 145, w: 150, h: 54, text: 'Area ≥ 2,000?' },
            { x: 440, y: 145, w: 150, h: 54, text: 'Age ≤ 30?' },
        ];
        const leafPositions = [
            { x: 35, y: 290, w: 120, h: 52 },
            { x: 190, y: 290, w: 120, h: 52 },
            { x: 410, y: 290, w: 120, h: 52 },
            { x: 565, y: 290, w: 120, h: 52 },
        ];
        const activeNodes = highQuality ? [0, 1] : [0, 2];
        const edges = [
            [360, 84, 205, 145, highQuality],
            [360, 84, 515, 145, !highQuality],
            [205, 199, 95, 290, highQuality && secondTest],
            [205, 199, 250, 290, highQuality && !secondTest],
            [515, 199, 470, 290, !highQuality && secondTest],
            [515, 199, 625, 290, !highQuality && !secondTest],
        ];
        edges.forEach(([x1, y1, x2, y2, active]) => {
            context.strokeStyle = active ? theme.accent : theme.grid;
            context.lineWidth = active ? 5 : 2;
            context.beginPath();
            context.moveTo(x1, y1);
            context.lineTo(x2, y2);
            context.stroke();
        });
        context.font = '700 15px Nunito, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        nodePositions.forEach((node, index) => {
            const active = activeNodes.includes(index);
            roundedRect(context, node.x, node.y, node.w, node.h, 12);
            context.fillStyle = active ? theme.accent : theme.surface;
            context.fill();
            context.strokeStyle = active ? theme.accent : theme.grid;
            context.lineWidth = 2;
            context.stroke();
            context.fillStyle = active ? '#ffffff' : theme.ink;
            context.fillText(node.text, node.x + node.w / 2, node.y + node.h / 2);
        });
        leafPositions.forEach((node, index) => {
            const active = leaf === index;
            roundedRect(context, node.x, node.y, node.w, node.h, 12);
            context.fillStyle = active ? theme.fourth : theme.surface;
            context.fill();
            context.strokeStyle = active ? theme.fourth : theme.grid;
            context.lineWidth = active ? 3 : 2;
            context.stroke();
            context.fillStyle = active ? '#ffffff' : theme.ink;
            context.font = '800 17px Nunito, sans-serif';
            context.fillText(labels[index], node.x + node.w / 2, node.y + 20);
            context.font = '600 11px Nunito, sans-serif';
            context.fillText('leaf estimate', node.x + node.w / 2, node.y + 38);
        });
        context.fillStyle = theme.soft;
        context.font = '700 12px Nunito, sans-serif';
        context.fillText('YES', 270, 112);
        context.fillText('NO', 450, 112);
        byId('kaggleAreaValue').textContent = `${area.toLocaleString()} ft²`;
        byId('kaggleQualityValue').textContent = `${quality} / 10`;
        byId('kaggleAgeValue').textContent = `${age} yr`;
        const route = highQuality
            ? `Quality ${quality} passes the root; area ${area.toLocaleString()} ${secondTest ? 'passes' : 'fails'} 2,000 ft².`
            : `Quality ${quality} fails the root; age ${age} ${secondTest ? 'passes' : 'fails'} 30 years.`;
        byId('kaggleTreeReadout').textContent = `${route} Predicted sale price: $${predictions[leaf]},000.`;
    }

    const DATA_ROWS = [
        ['101', 'North', '8,450', '2003', '1,710', '2', '$208,500'],
        ['102', 'West', '9,600', '1976', '1,262', '2', '$181,500'],
        ['103', 'North', '11,250', '2001', '1,786', '2', '$223,500'],
        ['104', 'East', '9,550', '1915', '1,717', '3', '$140,000'],
        ['105', 'East', '14,260', '2000', '2,198', '—', '$250,000'],
    ];

    const DATA_VIEWS = {
        head: {
            headers: ['Id', 'Area', 'Lot', 'Built', 'Living', 'Garage', 'SalePrice'],
            rows: DATA_ROWS,
            chart: [208.5, 181.5, 223.5, 140, 250],
            labels: ['101', '102', '103', '104', '105'],
            caption: 'Sale price ($1,000s) for the first five rows',
        },
        describe: {
            headers: ['Statistic', 'LotArea', 'YearBuilt', 'LivingArea', 'SalePrice'],
            rows: [
                ['count', '8', '8', '8', '8'],
                ['mean', '10,699', '1982', '1,704', '206,688'],
                ['std', '2,164', '31', '330', '57,392'],
                ['min', '8,450', '1,915', '1,262', '140,000'],
                ['50%', '10,234', '1,997', '1,714', '204,250'],
                ['max', '14,260', '2,004', '2,198', '307,000'],
            ],
            chart: [57.4, 33, 19.4, 27.8],
            labels: ['Price', 'Lot', 'Living', 'Built'],
            caption: 'Relative coefficient of variation (%)',
        },
        missing: {
            headers: ['Column', 'Missing', 'Rate', 'Decision'],
            rows: [
                ['Id', '0', '0%', 'exclude identifier'],
                ['LotArea', '0', '0%', 'candidate feature'],
                ['YearBuilt', '0', '0%', 'candidate feature'],
                ['LivingArea', '0', '0%', 'candidate feature'],
                ['GarageCars', '1', '12.5%', 'impute inside training pipeline'],
                ['SalePrice', '0', '0%', 'target'],
            ],
            chart: [0, 0, 0, 0, 1, 0],
            labels: ['Id', 'Lot', 'Built', 'Living', 'Garage', 'Target'],
            caption: 'Missing cells per column',
        },
    };

    function renderDataView(viewName = 'head') {
        const view = DATA_VIEWS[viewName];
        const container = byId('kaggleDataView');
        if (!container || !view) return;
        const header = `<thead><tr>${view.headers.map(label => `<th>${label}</th>`).join('')}</tr></thead>`;
        const body = `<tbody>${view.rows.map(row => `<tr>${row.map(value => `<td>${value}</td>`).join('')}</tr>`).join('')}</tbody>`;
        container.innerHTML = `<table>${header}${body}</table>`;
        document.querySelectorAll('[data-kaggle-data-view]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.kaggleDataView === viewName);
        });
        drawDataChart(view);
    }

    function drawDataChart(view) {
        const canvas = byId('kaggleDataCanvas');
        const state = clearCanvas(canvas);
        if (!state) return;
        const { context, theme } = state;
        const left = 58;
        const top = 35;
        const width = canvas.width - 90;
        const height = canvas.height - 90;
        const max = Math.max(...view.chart, 1);
        const barSpace = width / view.chart.length;
        context.strokeStyle = theme.grid;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(left, top);
        context.lineTo(left, top + height);
        context.lineTo(left + width, top + height);
        context.stroke();
        view.chart.forEach((value, index) => {
            const barWidth = Math.min(60, barSpace * 0.6);
            const barHeight = (value / max) * (height - 15);
            const x = left + barSpace * index + (barSpace - barWidth) / 2;
            const y = top + height - barHeight;
            context.fillStyle = index === view.chart.length - 1 ? theme.fourth : theme.accent;
            roundedRect(context, x, y, barWidth, barHeight, 6);
            context.fill();
            context.fillStyle = theme.ink;
            context.font = '700 12px Nunito, sans-serif';
            context.textAlign = 'center';
            context.fillText(String(value), x + barWidth / 2, Math.max(18, y - 7));
            context.fillStyle = theme.soft;
            context.fillText(view.labels[index], x + barWidth / 2, top + height + 20);
        });
        context.fillStyle = theme.soft;
        context.font = '700 12px Nunito, sans-serif';
        context.textAlign = 'left';
        context.fillText(view.caption, left, canvas.height - 16);
    }

    const PIPELINE_STEPS = [
        ['Target contract', 'Choose one outcome and its unit. SalePrice becomes a one-dimensional Series; never leave it inside X, where it would leak the answer.'],
        ['Feature contract', 'Use an explicit column list. This preserves names and order, excludes identifiers, and makes train/test schema checks possible.'],
        ['Unfitted estimator', 'The constructor records hyperparameters such as max_leaf_nodes and random_state. No splits exist yet.'],
        ['Learn parameters', 'fit reads aligned training rows and targets, then mutates model by storing split features, thresholds, and leaf estimates.'],
        ['Run inference', 'predict accepts rows with the fitted feature schema and returns one estimate per row. It does not retrain the model.'],
    ];

    function setPipelineStep(index) {
        document.querySelectorAll('[data-kaggle-pipeline-step]').forEach(button => {
            button.classList.toggle('is-active', Number(button.dataset.kagglePipelineStep) === index);
        });
        const [title, text] = PIPELINE_STEPS[index] || PIPELINE_STEPS[0];
        const readout = byId('kagglePipelineReadout');
        if (readout) readout.innerHTML = `<strong>${title}</strong>${text}`;
    }

    function drawValidation() {
        const canvas = byId('kaggleValidationCanvas');
        const state = clearCanvas(canvas);
        if (!state) return;
        const { context, theme } = state;
        const fraction = Number(byId('kaggleValidationSize')?.value || 20);
        const total = 40;
        const validationCount = Math.round(total * fraction / 100);
        const trainCount = total - validationCount;
        const columns = 10;
        const size = 36;
        const gap = 11;
        const left = 110;
        const top = 45;
        context.font = '700 12px Nunito, sans-serif';
        context.textAlign = 'center';
        for (let index = 0; index < total; index += 1) {
            const row = Math.floor(index / columns);
            const column = index % columns;
            const isValidation = index >= trainCount;
            const x = left + column * (size + gap);
            const y = top + row * (size + gap);
            roundedRect(context, x, y, size, size, 7);
            context.fillStyle = isValidation ? theme.second : theme.accent;
            context.fill();
            context.fillStyle = '#ffffff';
            context.fillText(String(index + 1), x + size / 2, y + size / 2);
        }
        context.textAlign = 'left';
        context.fillStyle = theme.accent;
        context.fillRect(90, 253, 18, 12);
        context.fillStyle = theme.ink;
        context.fillText(`Training · ${trainCount} rows enter fit()`, 116, 264);
        context.fillStyle = theme.second;
        context.fillRect(390, 253, 18, 12);
        context.fillStyle = theme.ink;
        context.fillText(`Validation · ${validationCount} rows stay hidden`, 416, 264);
        const noiseEstimate = Math.round(2800 / Math.sqrt(validationCount));
        byId('kaggleValidationValue').textContent = `${fraction}%`;
        byId('kaggleValidationReadout').textContent = `${trainCount} rows teach the model; ${validationCount} rows estimate generalization. A holdout this size has illustrative score uncertainty of roughly ±$${noiseEstimate.toLocaleString()} in this simulation.`;
    }

    function capacityScores(leaves) {
        const train = 44 * Math.pow(leaves, -0.45) + 1.5;
        const validation = 15 + 55 / leaves + 0.035 * Math.pow(leaves - 10, 2);
        return { train, validation };
    }

    function drawCapacity() {
        const canvas = byId('kaggleCapacityCanvas');
        const state = clearCanvas(canvas);
        if (!state) return;
        const { context, theme } = state;
        const selected = Number(byId('kaggleLeafCount')?.value || 8);
        const leaves = Array.from({ length: 16 }, (_, index) => (index + 1) * 2);
        const plot = { left: 65, top: 35, width: 610, height: 285 };
        const yMax = 48;
        context.strokeStyle = theme.grid;
        context.lineWidth = 1;
        context.font = '700 11px Nunito, sans-serif';
        context.textAlign = 'right';
        context.fillStyle = theme.soft;
        for (let tick = 0; tick <= 4; tick += 1) {
            const value = tick * 12;
            const y = plot.top + plot.height - (value / yMax) * plot.height;
            context.beginPath();
            context.moveTo(plot.left, y);
            context.lineTo(plot.left + plot.width, y);
            context.stroke();
            context.fillText(`$${value}k`, plot.left - 8, y + 4);
        }
        const xFor = value => plot.left + ((value - 2) / 30) * plot.width;
        const yFor = value => plot.top + plot.height - (value / yMax) * plot.height;
        const series = [
            { key: 'train', color: theme.accent, label: 'Training MAE' },
            { key: 'validation', color: theme.second, label: 'Validation MAE' },
        ];
        series.forEach(item => {
            context.strokeStyle = item.color;
            context.lineWidth = 4;
            context.beginPath();
            leaves.forEach((value, index) => {
                const point = capacityScores(value)[item.key];
                if (index === 0) context.moveTo(xFor(value), yFor(point));
                else context.lineTo(xFor(value), yFor(point));
            });
            context.stroke();
        });
        const selectedScores = capacityScores(selected);
        context.strokeStyle = theme.fourth;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(xFor(selected), plot.top);
        context.lineTo(xFor(selected), plot.top + plot.height);
        context.stroke();
        series.forEach(item => {
            context.fillStyle = item.color;
            context.beginPath();
            context.arc(xFor(selected), yFor(selectedScores[item.key]), 6, 0, Math.PI * 2);
            context.fill();
        });
        context.fillStyle = theme.accent;
        context.fillRect(95, 350, 20, 4);
        context.fillStyle = theme.ink;
        context.textAlign = 'left';
        context.fillText('Training MAE', 122, 355);
        context.fillStyle = theme.second;
        context.fillRect(255, 350, 20, 4);
        context.fillStyle = theme.ink;
        context.fillText('Validation MAE', 282, 355);
        context.fillStyle = theme.fourth;
        context.fillRect(440, 347, 3, 10);
        context.fillStyle = theme.ink;
        context.fillText('Selected capacity', 452, 355);
        byId('kaggleLeafValue').textContent = String(selected);
        const zone = selected < 6 ? 'underfitting' : selected > 16 ? 'overfitting risk' : 'useful capacity';
        byId('kaggleCapacityReadout').textContent = `${selected} leaves · training MAE ≈ $${selectedScores.train.toFixed(1)}k · validation MAE ≈ $${selectedScores.validation.toFixed(1)}k · ${zone}.`;
    }

    function seededUnit(index) {
        const value = Math.sin(index * 91.731 + 1.17) * 43758.5453;
        return value - Math.floor(value);
    }

    function forestPredictions(count) {
        return Array.from({ length: count }, (_, index) => {
            const broad = (seededUnit(index) - 0.5) * 125;
            const clustered = (seededUnit(index + 100) - 0.5) * 25;
            return 285 + broad + clustered;
        });
    }

    function drawForest() {
        const canvas = byId('kaggleForestCanvas');
        const state = clearCanvas(canvas);
        if (!state) return;
        const { context, theme } = state;
        const count = Number(byId('kaggleTreeCount')?.value || 12);
        const predictions = forestPredictions(count);
        const mean = predictions.reduce((sum, value) => sum + value, 0) / count;
        const standardDeviation = Math.sqrt(predictions.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / count);
        const plot = { left: 70, top: 45, width: 610, height: 245 };
        const xFor = index => plot.left + (index / Math.max(1, count - 1)) * plot.width;
        const yFor = value => plot.top + plot.height - ((value - 210) / 150) * plot.height;
        context.strokeStyle = theme.grid;
        context.fillStyle = theme.soft;
        context.font = '700 11px Nunito, sans-serif';
        context.textAlign = 'right';
        [220, 260, 300, 340].forEach(value => {
            const y = yFor(value);
            context.beginPath();
            context.moveTo(plot.left, y);
            context.lineTo(plot.left + plot.width, y);
            context.stroke();
            context.fillText(`$${value}k`, plot.left - 8, y + 4);
        });
        predictions.forEach((value, index) => {
            context.fillStyle = theme.accent;
            context.beginPath();
            context.arc(xFor(index), yFor(value), Math.max(3, 7 - count / 13), 0, Math.PI * 2);
            context.fill();
        });
        context.strokeStyle = theme.fourth;
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(plot.left, yFor(mean));
        context.lineTo(plot.left + plot.width, yFor(mean));
        context.stroke();
        context.fillStyle = theme.fourth;
        context.textAlign = 'left';
        context.font = '800 13px Nunito, sans-serif';
        context.fillText(`forest average $${mean.toFixed(1)}k`, plot.left + 8, yFor(mean) - 9);
        context.fillStyle = theme.soft;
        context.font = '700 12px Nunito, sans-serif';
        context.fillText('Each dot is one tree prediction for the same house', plot.left, 325);
        byId('kaggleTreeCountValue').textContent = String(count);
        const standardError = standardDeviation / Math.sqrt(count);
        byId('kaggleForestReadout').textContent = `${count} tree${count === 1 ? '' : 's'} · average $${mean.toFixed(1)}k · individual-tree spread $${standardDeviation.toFixed(1)}k · averaging uncertainty ≈ $${standardError.toFixed(1)}k.`;
    }

    function setupSubmissionChecks() {
        const buttons = [...document.querySelectorAll('[data-kaggle-check]')];
        const update = () => {
            const complete = buttons.filter(button => button.getAttribute('aria-pressed') === 'true').length;
            const readout = byId('kaggleSubmissionReadout');
            if (readout) {
                readout.textContent = complete === buttons.length
                    ? 'All five contracts checked. The file is ready for a dry-run export.'
                    : `${complete} of ${buttons.length} contracts checked.`;
            }
        };
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const next = button.getAttribute('aria-pressed') !== 'true';
                button.setAttribute('aria-pressed', String(next));
                const icon = button.querySelector('span');
                if (icon) icon.textContent = next ? '✓' : '○';
                update();
            });
        });
    }

    let sandboxSession = null;
    let activePlot = null;

    function loadLab(id) {
        const lab = LABS[id] || LABS.models;
        const selector = byId('kaggleLabSelect');
        if (selector) selector.value = id in LABS ? id : 'models';
        byId('kaggleLabGoal').textContent = lab.goal;
        byId('kaggleLabApis').textContent = lab.apis;
        byId('kaggleLabChallenge').textContent = lab.challenge;
        byId('kaggleLabEditor').value = lab.code;
        byId('kaggleLabOutput').textContent = 'Edit the code or run the provided experiment.';
        byId('kaggleLabOutput').classList.remove('has-error');
        byId('kaggleLabStatus').textContent = 'Ready';
        activePlot = null;
        byId('kaggleLabPlot').hidden = true;
        byId('kaggleLabPlot').replaceChildren();
    }

    function niceRange(values) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = Math.max((max - min) * 0.12, 1);
        return [min - padding, max + padding];
    }

    function drawLabPlot(plot) {
        const host = byId('kaggleLabPlot');
        if (!host || !plot) return;
        host.hidden = false;
        host.replaceChildren();
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 360;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', plot.title || 'Python lab result plot');
        host.appendChild(canvas);
        const state = clearCanvas(canvas);
        if (!state) return;
        const { context, theme } = state;
        const frame = { left: 75, top: 42, width: 600, height: 245 };
        context.fillStyle = theme.ink;
        context.font = '800 16px Nunito, sans-serif';
        context.textAlign = 'left';
        context.fillText(plot.title || 'Lab result', frame.left, 24);
        context.strokeStyle = theme.grid;
        context.lineWidth = 1;
        context.strokeRect(frame.left, frame.top, frame.width, frame.height);
        if (plot.type === 'bars') {
            const values = plot.values || [];
            const max = Math.max(...values, 1);
            const space = frame.width / Math.max(1, values.length);
            values.forEach((value, index) => {
                const barWidth = Math.min(86, space * 0.62);
                const height = (value / max) * (frame.height - 25);
                const x = frame.left + index * space + (space - barWidth) / 2;
                const y = frame.top + frame.height - height;
                context.fillStyle = index === 0 ? theme.second : theme.accent;
                roundedRect(context, x, y, barWidth, height, 6);
                context.fill();
                context.fillStyle = theme.ink;
                context.textAlign = 'center';
                context.font = '700 11px Nunito, sans-serif';
                context.fillText(`${plot.unit || ''}${Math.round(value).toLocaleString()}`, x + barWidth / 2, y - 8);
                const words = String(plot.labels[index]).split(' ');
                context.fillStyle = theme.soft;
                context.fillText(words.slice(0, 2).join(' '), x + barWidth / 2, frame.top + frame.height + 18);
                if (words.length > 2) context.fillText(words.slice(2).join(' '), x + barWidth / 2, frame.top + frame.height + 32);
            });
            return;
        }
        if (plot.type === 'residuals') {
            const actual = plot.actual || [];
            const predicted = plot.predicted || [];
            const [min, max] = niceRange([...actual, ...predicted]);
            const xFor = index => frame.left + 15 + (index / Math.max(1, actual.length - 1)) * (frame.width - 30);
            const yFor = value => frame.top + frame.height - ((value - min) / (max - min)) * frame.height;
            actual.forEach((value, index) => {
                const x = xFor(index);
                context.strokeStyle = theme.grid;
                context.lineWidth = 2;
                context.beginPath();
                context.moveTo(x, yFor(value));
                context.lineTo(x, yFor(predicted[index]));
                context.stroke();
                context.fillStyle = theme.ink;
                context.beginPath();
                context.arc(x, yFor(value), 3.5, 0, Math.PI * 2);
                context.fill();
                context.fillStyle = theme.second;
                context.beginPath();
                context.arc(x, yFor(predicted[index]), 3.5, 0, Math.PI * 2);
                context.fill();
            });
            context.fillStyle = theme.ink;
            context.fillRect(frame.left, 316, 14, 4);
            context.fillStyle = theme.soft;
            context.fillText('actual', frame.left + 22, 321);
            context.fillStyle = theme.second;
            context.fillRect(frame.left + 92, 316, 14, 4);
            context.fillStyle = theme.soft;
            context.fillText('prediction', frame.left + 114, 321);
            return;
        }
        if (plot.type === 'lines') {
            const allValues = (plot.series || []).flatMap(series => series.values || []);
            const [min, max] = niceRange(allValues);
            const x = plot.x || [];
            const xFor = index => frame.left + (index / Math.max(1, x.length - 1)) * frame.width;
            const yFor = value => frame.top + frame.height - ((value - min) / (max - min)) * frame.height;
            (plot.series || []).forEach((series, seriesIndex) => {
                const color = seriesIndex === 0 ? theme.accent : theme.second;
                context.strokeStyle = color;
                context.lineWidth = 4;
                context.beginPath();
                series.values.forEach((value, index) => {
                    if (index === 0) context.moveTo(xFor(index), yFor(value));
                    else context.lineTo(xFor(index), yFor(value));
                });
                context.stroke();
                series.values.forEach((value, index) => {
                    context.fillStyle = color;
                    context.beginPath();
                    context.arc(xFor(index), yFor(value), 4, 0, Math.PI * 2);
                    context.fill();
                });
                context.fillStyle = color;
                context.fillRect(frame.left + seriesIndex * 180, 316, 18, 4);
                context.fillStyle = theme.soft;
                context.textAlign = 'left';
                context.fillText(series.label, frame.left + 25 + seriesIndex * 180, 321);
            });
            context.fillStyle = theme.soft;
            context.textAlign = 'center';
            x.forEach((value, index) => {
                context.fillText(String(value), xFor(index), frame.top + frame.height + 18);
            });
        }
    }

    async function runLab() {
        const editor = byId('kaggleLabEditor');
        const output = byId('kaggleLabOutput');
        const status = byId('kaggleLabStatus');
        const runButton = byId('kaggleLabRun');
        if (!editor || !output || typeof window.createMachineLearnerPythonSession !== 'function') return;
        if (!sandboxSession) sandboxSession = window.createMachineLearnerPythonSession('kaggle-intro-ml');
        runButton.disabled = true;
        status.textContent = 'Loading pandas + scikit-learn…';
        output.classList.remove('has-error');
        output.textContent = 'Starting the isolated Python worker. The first scientific-package load may take a few seconds.';
        try {
            const result = await sandboxSession.run(editor.value, {
                packages: ['pandas', 'scikit-learn'],
            });
            const text = [result.stdout, result.stderr, result.result].filter(Boolean).join('\n').trim();
            const failed = Boolean(result.stderr);
            output.textContent = text || 'Cell completed without printed output.';
            output.classList.toggle('has-error', failed);
            status.textContent = failed ? 'Python error' : 'Completed';
            activePlot = result.plot || null;
            if (activePlot) drawLabPlot(activePlot);
            else {
                byId('kaggleLabPlot').hidden = true;
                byId('kaggleLabPlot').replaceChildren();
            }
        } catch (error) {
            output.textContent = error?.message || String(error);
            output.classList.add('has-error');
            status.textContent = 'Runtime error';
        } finally {
            runButton.disabled = false;
        }
    }

    function setupLab() {
        const selector = byId('kaggleLabSelect');
        if (!selector) return;
        loadLab(selector.value);
        selector.addEventListener('change', () => loadLab(selector.value));
        byId('kaggleLabRun')?.addEventListener('click', runLab);
        byId('kaggleLabReset')?.addEventListener('click', () => loadLab(selector.value));
        document.querySelectorAll('[data-kaggle-lab]').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.dataset.kaggleLab;
                loadLab(id);
                byId('kaggle-ml-lab')?.scrollIntoView({ behavior: 'smooth' });
                if (history.replaceState) history.replaceState(null, '', '#kaggle-ml-lab');
            });
        });
    }

    function redrawAll() {
        drawTree();
        const activeDataView = document.querySelector('[data-kaggle-data-view].is-active')?.dataset.kaggleDataView || 'head';
        renderDataView(activeDataView);
        drawValidation();
        drawCapacity();
        drawForest();
        if (activePlot) drawLabPlot(activePlot);
    }

    function setup() {
        ['kaggleArea', 'kaggleQuality', 'kaggleAge'].forEach(id => {
            byId(id)?.addEventListener('input', drawTree);
        });
        document.querySelectorAll('[data-kaggle-data-view]').forEach(button => {
            button.addEventListener('click', () => renderDataView(button.dataset.kaggleDataView));
        });
        document.querySelectorAll('[data-kaggle-pipeline-step]').forEach(button => {
            button.addEventListener('click', () => setPipelineStep(Number(button.dataset.kagglePipelineStep)));
        });
        byId('kaggleValidationSize')?.addEventListener('input', drawValidation);
        byId('kaggleLeafCount')?.addEventListener('input', drawCapacity);
        byId('kaggleTreeCount')?.addEventListener('input', drawForest);
        setupSubmissionChecks();
        setupLab();
        setPipelineStep(0);
        redrawAll();
        document.addEventListener('mlmath:theme-change', redrawAll);
    }

    window.KaggleMLCourseData = { labs: LABS };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setup, { once: true });
    } else {
        setup();
    }
})();
