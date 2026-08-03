(() => {
    'use strict';

    const root = document.getElementById('and-gate-lab');
    if (!root) return;

    const viewEl = document.getElementById('andGateView');
    const exampleEl = document.getElementById('andGateExample');
    const phaseEl = document.getElementById('andGatePhase');
    const progressEl = document.getElementById('andGateProgress');
    const lossEl = document.getElementById('andGateLoss');
    const detailEl = document.getElementById('andGateStepDetail');
    const nextEl = document.getElementById('andGateNext');
    const trainEl = document.getElementById('andGateTrain');
    const resetEl = document.getElementById('andGateReset');
    const calculationEl = document.getElementById('andGateCalculation');
    const truthEl = document.getElementById('andGateTruthTable');
    const scaleEl = document.getElementById('andGateScale');
    const canvas = document.getElementById('andGateCanvas');
    const a11yEl = document.getElementById('andGateA11yStatus');
    const context = canvas.getContext('2d');

    const rows = [
        { x: [0, 0], y: 0 },
        { x: [0, 1], y: 0 },
        { x: [1, 0], y: 0 },
        { x: [1, 1], y: 1 }
    ];
    const phaseNames = [
        'Inputs',
        'Weighted products',
        'Weighted sum',
        'Activation and loss',
        'Output error',
        'Gradients',
        'Parameter update',
        'Verify'
    ];
    const learningRate = 0.5;
    const initialModel = { w: [0.2, -0.1], b: 0 };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let model = { w: [...initialModel.w], b: initialModel.b };
    let phase = 0;
    let singleUpdate = null;
    let animationStart = performance.now();

    const sigmoid = value => 1 / (1 + Math.exp(-value));
    const selectedRow = () => rows[Number(exampleEl.value)];
    const signed = (value, digits = 5) => value < 0
        ? `−${Math.abs(value).toFixed(digits)}`
        : value.toFixed(digits);

    function forward(row, currentModel = model) {
        const products = [
            currentModel.w[0] * row.x[0],
            currentModel.w[1] * row.x[1]
        ];
        const z = products[0] + products[1] + currentModel.b;
        const prediction = sigmoid(z);
        const safePrediction = Math.max(1e-7, Math.min(1 - 1e-7, prediction));
        const loss = -(row.y * Math.log(safePrediction)
            + (1 - row.y) * Math.log(1 - safePrediction));
        return { products, z, prediction, loss };
    }

    function calculateUpdate(row, currentModel = model) {
        const state = forward(row, currentModel);
        const delta = state.prediction - row.y;
        const gradients = { w: [delta * row.x[0], delta * row.x[1]], b: delta };
        return {
            state,
            delta,
            gradients,
            old: { w: [...currentModel.w], b: currentModel.b },
            next: {
                w: [
                    currentModel.w[0] - learningRate * gradients.w[0],
                    currentModel.w[1] - learningRate * gradients.w[1]
                ],
                b: currentModel.b - learningRate * gradients.b
            }
        };
    }

    function resetModel() {
        model = { w: [...initialModel.w], b: initialModel.b };
        phase = 0;
        singleUpdate = null;
        animationStart = performance.now();
    }

    function addCalculationRow(quantity, calculation, value) {
        const tableRow = document.createElement('tr');
        [quantity, calculation, value].forEach(text => {
            const cell = document.createElement('td');
            cell.textContent = text;
            tableRow.appendChild(cell);
        });
        calculationEl.appendChild(tableRow);
    }

    function renderCalculations(row, update, shownState) {
        calculationEl.replaceChildren();
        if (phase === 0) {
            addCalculationRow('Input', `x = [${row.x.join(', ')}]`, row.x.join(', '));
            addCalculationRow('Target', 'AND(x₁, x₂)', String(row.y));
        } else if (phase === 1) {
            addCalculationRow('First input', `${update.old.w[0].toFixed(3)} × ${row.x[0]}`, signed(update.state.products[0]));
            addCalculationRow('Second input', `${signed(update.old.w[1], 3)} × ${row.x[1]}`, signed(update.state.products[1]));
            addCalculationRow('Bias', `+ ${signed(update.old.b, 3)}`, signed(update.old.b));
        } else if (phase === 2) {
            addCalculationRow('Weighted sum z', `${signed(update.state.products[0])} + ${signed(update.state.products[1])} + ${signed(update.old.b)}`, signed(update.state.z));
        } else if (phase === 3) {
            addCalculationRow('Prediction ŷ', `σ(${signed(update.state.z)})`, update.state.prediction.toFixed(5));
            addCalculationRow('Loss L', row.y === 1 ? `−log(${update.state.prediction.toFixed(5)})` : `−log(1 − ${update.state.prediction.toFixed(5)})`, update.state.loss.toFixed(5));
        } else if (phase === 4) {
            addCalculationRow('Output error δ', `${update.state.prediction.toFixed(5)} − ${row.y}`, signed(update.delta));
        } else if (phase === 5) {
            addCalculationRow('∂L/∂w₁', `${signed(update.delta)} × ${row.x[0]}`, signed(update.gradients.w[0]));
            addCalculationRow('∂L/∂w₂', `${signed(update.delta)} × ${row.x[1]}`, signed(update.gradients.w[1]));
            addCalculationRow('∂L/∂b', `${signed(update.delta)} × 1`, signed(update.gradients.b));
        } else if (phase === 6) {
            addCalculationRow('New w₁', `${update.old.w[0].toFixed(5)} − 0.5 × (${signed(update.gradients.w[0])})`, update.next.w[0].toFixed(5));
            addCalculationRow('New w₂', `${signed(update.old.w[1])} − 0.5 × (${signed(update.gradients.w[1])})`, update.next.w[1].toFixed(5));
            addCalculationRow('New b', `${signed(update.old.b)} − 0.5 × (${signed(update.gradients.b)})`, update.next.b.toFixed(5));
        } else {
            addCalculationRow('New weighted sum', `${shownState.products[0].toFixed(5)} + ${shownState.products[1].toFixed(5)} + ${model.b.toFixed(5)}`, shownState.z.toFixed(5));
            addCalculationRow('New prediction', `σ(${shownState.z.toFixed(5)})`, shownState.prediction.toFixed(5));
            addCalculationRow('New loss', 'binary cross-entropy', shownState.loss.toFixed(5));
        }
    }

    function renderTruthTable() {
        truthEl.replaceChildren();
        rows.forEach((row, index) => {
            const state = forward(row);
            const tableRow = document.createElement('tr');
            if (index === Number(exampleEl.value)) tableRow.classList.add('is-current');
            [row.x[0], row.x[1], row.y, state.prediction.toFixed(3), Number(state.prediction >= 0.5)]
                .forEach(value => {
                    const cell = document.createElement('td');
                    cell.textContent = String(value);
                    tableRow.appendChild(cell);
                });
            truthEl.appendChild(tableRow);
        });
    }

    function themeColor(name, fallback) {
        return getComputedStyle(root).getPropertyValue(name).trim() || fallback;
    }

    function sizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const scale = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(320, Math.round(rect.width));
        const height = Math.max(260, Math.round(rect.height));
        if (canvas.width !== width * scale || canvas.height !== height * scale) {
            canvas.width = width * scale;
            canvas.height = height * scale;
        }
        context.setTransform(scale, 0, 0, scale, 0, 0);
        return { width, height };
    }

    function line(from, to, weight, active, progress, backward = false) {
        const positive = themeColor('--and-positive', '#17835f');
        const negative = themeColor('--and-negative', '#b5473a');
        const muted = themeColor('--grid', '#9aa8b7');
        const signal = themeColor('--and-signal', '#1769aa');
        context.strokeStyle = active ? (weight >= 0 ? positive : negative) : muted;
        context.globalAlpha = active ? 0.95 : 0.35;
        context.lineWidth = active ? 3 + Math.min(Math.abs(weight) * 5, 3) : 1.5;
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        context.globalAlpha = 1;

        if (!active || progress === null) return;
        const t = backward ? 1 - progress : progress;
        context.fillStyle = signal;
        context.beginPath();
        context.arc(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 6, 0, Math.PI * 2);
        context.fill();
    }

    function node(point, label, value, radius = 30) {
        const paper = themeColor('--paper', '#ffffff');
        const ink = themeColor('--ink', '#172033');
        const accent = themeColor('--and-signal', '#1769aa');
        const border = themeColor('--panel-border', '#8092a6');
        context.fillStyle = value > 0.5 ? accent : paper;
        context.strokeStyle = value > 0.5 ? accent : border;
        context.lineWidth = 3;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
        context.stroke();
        context.fillStyle = value > 0.5 ? '#ffffff' : ink;
        context.font = '700 14px system-ui, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        label.split('\n').forEach((text, index, parts) => {
            context.fillText(text, point.x, point.y + (index - (parts.length - 1) / 2) * 17);
        });
    }

    function edgeLabel(from, to, text) {
        const ink = themeColor('--ink', '#172033');
        const paper = themeColor('--paper', '#ffffff');
        const x = from.x + (to.x - from.x) * 0.48;
        const y = from.y + (to.y - from.y) * 0.48;
        context.font = '700 12px ui-monospace, monospace';
        const width = context.measureText(text).width + 12;
        context.fillStyle = paper;
        context.fillRect(x - width / 2, y - 11, width, 22);
        context.fillStyle = ink;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, x, y);
    }

    function drawOneNeuron(width, height, time) {
        const row = selectedRow();
        const state = forward(row);
        const inputs = [
            { x: width * 0.18, y: height * 0.25 },
            { x: width * 0.18, y: height * 0.56 },
            { x: width * 0.18, y: height * 0.82 }
        ];
        const output = { x: width * 0.78, y: height * 0.52 };
        const moving = phase >= 1 && phase <= 6;
        const progress = moving ? (reduceMotion.matches ? 0.5 : ((time - animationStart) / 1800) % 1) : null;
        const backward = phase >= 4;

        line(inputs[0], output, model.w[0], phase >= 1, progress, backward);
        line(inputs[1], output, model.w[1], phase >= 1, progress, backward);
        line(inputs[2], output, model.b, phase >= 1, progress, backward);
        edgeLabel(inputs[0], output, `w1 ${signed(model.w[0], 3)}`);
        edgeLabel(inputs[1], output, `w2 ${signed(model.w[1], 3)}`);
        edgeLabel(inputs[2], output, `b ${signed(model.b, 3)}`);
        node(inputs[0], `x₁\n${row.x[0]}`, row.x[0]);
        node(inputs[1], `x₂\n${row.x[1]}`, row.x[1]);
        node(inputs[2], 'bias\n1', 1, 26);
        node(output, phase >= 3 ? `ŷ\n${state.prediction.toFixed(3)}` : 'ŷ\n?', phase >= 3 ? state.prediction : 0, 38);

        context.fillStyle = themeColor('--ink-soft', '#46546a');
        context.font = '700 12px system-ui, sans-serif';
        context.fillText('INPUTS', inputs[0].x, 24);
        context.fillText('OUTPUT', output.x, 24);
    }

    function drawLargeNetwork(width, height, time) {
        const counts = [4, 5, 3, 1];
        const xPositions = [0.12, 0.37, 0.63, 0.88].map(value => value * width);
        const layers = counts.map((count, layerIndex) => Array.from({ length: count }, (_, index) => ({
            x: xPositions[layerIndex],
            y: height * (0.18 + index * (0.68 / Math.max(1, count - 1)))
        })));
        const moving = phase >= 1 && phase <= 6;
        const progress = moving ? (reduceMotion.matches ? 0.5 : ((time - animationStart) / 1800) % 1) : null;
        const backward = phase >= 4;

        for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
            layers[layerIndex].forEach((from, fromIndex) => {
                layers[layerIndex + 1].forEach((to, toIndex) => {
                    const active = fromIndex === 0 && toIndex === 0;
                    const sign = (fromIndex + toIndex + layerIndex) % 2 === 0 ? 1 : -1;
                    line(from, to, sign * 0.35, active, active ? progress : null, backward);
                });
            });
        }
        layers.forEach((layer, layerIndex) => layer.forEach((point, index) => {
            node(point, layerIndex === 0 ? `x${index + 1}` : (layerIndex === 3 ? 'ŷ' : ''), index === 0 ? 0.85 : 0.2, 19);
        }));
        context.fillStyle = themeColor('--ink-soft', '#46546a');
        context.font = '700 11px system-ui, sans-serif';
        ['4 INPUTS', '5 HIDDEN', '3 HIDDEN', '1 OUTPUT'].forEach((label, index) => context.fillText(label, xPositions[index], 18));
    }

    function draw(time = performance.now()) {
        const { width, height } = sizeCanvas();
        context.clearRect(0, 0, width, height);
        if (viewEl.value === 'one') drawOneNeuron(width, height, time);
        else drawLargeNetwork(width, height, time);
    }

    function renderText() {
        const row = selectedRow();
        const update = singleUpdate || calculateUpdate(row);
        const shownState = forward(row);
        phaseEl.textContent = `${phase + 1} · ${phaseNames[phase]}`;
        progressEl.textContent = `Step ${phase + 1} of ${phaseNames.length}`;
        lossEl.textContent = `Loss ${shownState.loss.toFixed(5)}`;
        nextEl.disabled = phase === phaseNames.length - 1;
        const details = [
            `Training pair: x = [${row.x.join(', ')}], target y = ${row.y}.`,
            'Multiply each input by the weight on its connection.',
            `Add both products and the bias: z = ${update.state.z.toFixed(5)}.`,
            `Sigmoid gives ŷ = ${update.state.prediction.toFixed(5)}; cross-entropy loss is ${update.state.loss.toFixed(5)}.`,
            `Start backward at the output: δ = ŷ − y = ${signed(update.delta)}.`,
            'A weight gradient is the output error multiplied by the value that crossed that connection.',
            'Move each parameter opposite its gradient: new = old − learning rate × gradient.',
            `After the update, ŷ = ${shownState.prediction.toFixed(5)} and loss = ${shownState.loss.toFixed(5)}.`
        ];
        detailEl.textContent = details[phase];
        renderCalculations(row, update, shownState);
        renderTruthTable();
        scaleEl.hidden = viewEl.value !== 'large';
        a11yEl.textContent = `AND example ${row.x.join(', ')}, target ${row.y}. ${phaseNames[phase]}. Weights ${model.w.map(value => value.toFixed(3)).join(', ')}, bias ${model.b.toFixed(3)}, prediction ${shownState.prediction.toFixed(3)}, loss ${shownState.loss.toFixed(3)}.`;
        draw();
    }

    function trainAllRows() {
        resetModel();
        for (let epoch = 0; epoch < 500; epoch += 1) {
            const gradient = { w: [0, 0], b: 0 };
            rows.forEach(row => {
                const delta = forward(row).prediction - row.y;
                gradient.w[0] += delta * row.x[0] / rows.length;
                gradient.w[1] += delta * row.x[1] / rows.length;
                gradient.b += delta / rows.length;
            });
            model.w[0] -= learningRate * gradient.w[0];
            model.w[1] -= learningRate * gradient.w[1];
            model.b -= learningRate * gradient.b;
        }
        phase = phaseNames.length - 1;
        renderText();
    }

    nextEl.addEventListener('click', () => {
        if (phase >= phaseNames.length - 1) return;
        const nextPhase = phase + 1;
        if (nextPhase === 6 && !singleUpdate) {
            singleUpdate = calculateUpdate(selectedRow());
            model = { w: [...singleUpdate.next.w], b: singleUpdate.next.b };
        }
        phase = nextPhase;
        animationStart = performance.now();
        renderText();
    });
    trainEl.addEventListener('click', trainAllRows);
    resetEl.addEventListener('click', () => {
        resetModel();
        renderText();
    });
    exampleEl.addEventListener('change', () => {
        resetModel();
        renderText();
    });
    viewEl.addEventListener('change', () => {
        animationStart = performance.now();
        renderText();
    });
    document.addEventListener('mlmath:theme-change', () => draw());
    new ResizeObserver(() => draw()).observe(canvas);

    function animate(time) {
        if (!root.isConnected) return;
        if (!reduceMotion.matches && phase >= 1 && phase <= 6 && root.offsetParent !== null) draw(time);
        requestAnimationFrame(animate);
    }

    resetModel();
    renderText();
    requestAnimationFrame(animate);
})();
