// ============================================
// Theme Helpers
// ============================================
function getThemeColors() {
    const styles = getComputedStyle(document.body);
    const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;

    return {
        primary: read('--accent-1', '#38bdf8'),
        secondary: read('--accent-2', '#fb7185'),
        success: read('--accent-3', '#34d399'),
        warning: read('--accent-4', '#f59e0b'),
        danger: read('--accent-danger', '#ef4444'),
        ink: read('--ink', '#1f2937'),
        inkSoft: read('--ink-soft', '#475569'),
        grid: read('--grid', '#e2e8f0'),
        axis: read('--axis', '#94a3b8'),
        panel: read('--panel-bg', '#ffffff'),
        panelBorder: read('--panel-border', '#94a3b8')
    };
}

// ============================================
// Vector Visualization
// ============================================
const vectorState = {
    ax: 2,
    ay: 3,
    bx: 1,
    by: 4,
    scale: 1,
    operation: 'data'
};

function drawVector(ctx, x, y, dx, dy, color, label) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    
    // Draw arrowhead
    const angle = Math.atan2(dy, dx);
    const arrowLength = 15;
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy);
    ctx.lineTo(
        x + dx - arrowLength * Math.cos(angle - Math.PI / 6),
        y + dy - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x + dx - arrowLength * Math.cos(angle + Math.PI / 6),
        y + dy - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Draw label
    ctx.font = 'bold 16px Nunito, Arial';
    ctx.fillText(label, x + dx + 10, y + dy - 10);
}

function drawVectorBase(ctx, canvas, theme) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
    }
    ctx.stroke();

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    return { centerX, centerY };
}

function drawAngleArc(ctx, centerX, centerY, ax, ay, bx, by, radius, color) {
    const normalize = (angle) => (angle + Math.PI * 2) % (Math.PI * 2);
    let start = normalize(Math.atan2(-ay, ax));
    let end = normalize(Math.atan2(-by, bx));
    let diff = end - start;
    if (diff < 0) diff += Math.PI * 2;
    if (diff > Math.PI) {
        const temp = start;
        start = end;
        end = temp;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, start, end);
    ctx.stroke();
}

function drawVectorPlayground(ctx, canvas, theme) {
    const { centerX, centerY } = drawVectorBase(ctx, canvas, theme);
    const unit = 30 * vectorState.scale;
    const ax = vectorState.ax;
    const ay = vectorState.ay;
    const bx = vectorState.bx;
    const by = vectorState.by;

    const originX = centerX;
    const originY = centerY;
    const aEndX = originX + ax * unit;
    const aEndY = originY - ay * unit;
    const bEndX = originX + bx * unit;
    const bEndY = originY - by * unit;

    if (vectorState.operation === 'data') {
        drawVector(ctx, originX, originY, ax * unit, -ay * unit, theme.primary, 'x');
        drawVector(ctx, originX, originY, bx * unit, -by * unit, theme.secondary, 'w');
        drawPoint(ctx, aEndX, aEndY, theme.primary, 5);
        return;
    }

    if (vectorState.operation === 'modulus') {
        drawVector(ctx, originX, originY, ax * unit, -ay * unit, theme.primary, 'x');
        drawPoint(ctx, aEndX, aEndY, theme.primary, 5);
        const normA = Math.hypot(ax, ay);
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = theme.success;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(originX, originY, normA * unit, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('||x||', originX + normA * unit + 6, originY - 6);
        return;
    }

    if (vectorState.operation === 'addition') {
        drawVector(ctx, originX, originY, ax * unit, -ay * unit, theme.primary, 'x');
        drawVector(ctx, originX, originY, bx * unit, -by * unit, theme.secondary, 'w');
        drawVector(ctx, originX, originY, (ax + bx) * unit, -(ay + by) * unit, theme.success, 'x+w');
        drawVector(ctx, aEndX, aEndY, bx * unit, -by * unit, theme.warning, '');
        return;
    }

    if (vectorState.operation === 'dot') {
        drawVector(ctx, originX, originY, bx * unit, -by * unit, theme.secondary, 'w');
        drawVector(ctx, originX, originY, ax * unit, -ay * unit, theme.primary, 'x');
        const bNormSq = bx * bx + by * by;
        if (bNormSq > 0) {
            const dot = ax * bx + ay * by;
            const projScale = dot / bNormSq;
            const projX = bx * projScale;
            const projY = by * projScale;
            const projEndX = originX + projX * unit;
            const projEndY = originY - projY * unit;
            drawDashedLine(ctx, aEndX, aEndY, projEndX, projEndY, theme.warning);
            drawVector(ctx, originX, originY, projX * unit, -projY * unit, theme.success, '');
            drawPoint(ctx, projEndX, projEndY, theme.success, 4);
        }
        return;
    }

    if (vectorState.operation === 'cosine') {
        drawVector(ctx, originX, originY, ax * unit, -ay * unit, theme.primary, 'x');
        drawVector(ctx, originX, originY, bx * unit, -by * unit, theme.secondary, 'w');
        drawAngleArc(ctx, originX, originY, ax, ay, bx, by, 40, theme.warning);
        return;
    }

    if (vectorState.operation === 'distance') {
        drawPoint(ctx, aEndX, aEndY, theme.primary, 6);
        drawPoint(ctx, bEndX, bEndY, theme.secondary, 6);
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(aEndX, aEndY);
        ctx.lineTo(bEndX, bEndY);
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('x', aEndX + 6, aEndY - 6);
        ctx.fillText('w', bEndX + 6, bEndY - 6);
    }
}

function initVectorCanvas() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    drawVectorPlayground(ctx, canvas, theme);
}

function animateVectorAddition() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;

    setVectorOperation('addition');

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    const unit = 30 * vectorState.scale;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const ax = vectorState.ax;
    const ay = vectorState.ay;
    const bx = vectorState.bx;
    const by = vectorState.by;

    let step = 0;
    const animate = () => {
        if (step > 100) return;

        drawVectorBase(ctx, canvas, theme);

        const progress = step / 100;
        const vecAx = ax * unit;
        const vecAy = -ay * unit;
        const vecBx = bx * unit;
        const vecBy = -by * unit;

        drawVector(ctx, centerX, centerY, vecAx, vecAy, theme.primary, 'A');

        if (progress > 0.3) {
            const moveProgress = Math.min((progress - 0.3) / 0.3, 1);
            const startX = centerX + vecAx * moveProgress;
            const startY = centerY + vecAy * moveProgress;
            drawVector(ctx, startX, startY, vecBx, vecBy, theme.secondary, 'B');
        }

        if (progress > 0.6) {
            const resultProgress = Math.min((progress - 0.6) / 0.4, 1);
            drawVector(
                ctx,
                centerX,
                centerY,
                (vecAx + vecBx) * resultProgress,
                (vecAy + vecBy) * resultProgress,
                theme.success,
                'A+B'
            );
        }

        step += 2;
        requestAnimationFrame(animate);
    };

    animate();
}

const vectorOperationConfig = {
    data: {
        formula: 'x = [x_1, x_2],\\; w = [w_1, w_2]',
        metrics: []
    },
    modulus: {
        formula: '\\lVert x \\rVert = \\sqrt{x_1^2 + x_2^2}',
        metrics: ['modulus']
    },
    addition: {
        formula: 'x + w = [x_1 + w_1,\\; x_2 + w_2]',
        metrics: ['sum']
    },
    dot: {
        formula: 'x \\cdot w = \\sum_i x_i w_i',
        metrics: ['dot', 'angle']
    },
    cosine: {
        formula: '\\cos\\theta = \\frac{x \\cdot w}{\\lVert x \\rVert \\lVert w \\rVert}',
        metrics: ['cosine', 'angle']
    },
    distance: {
        formula: '\\lVert x - w \\rVert_2',
        metrics: ['distance']
    }
};

function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '0';
    return Number(value).toFixed(digits);
}

function formatStepNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '0';
    return Number(value.toFixed(digits)).toString();
}

function updateVectorMetrics() {
    const ax = vectorState.ax;
    const ay = vectorState.ay;
    const bx = vectorState.bx;
    const by = vectorState.by;

    const dot = ax * bx + ay * by;
    const normA = Math.hypot(ax, ay);
    const normB = Math.hypot(bx, by);
    const cosine = normA && normB ? dot / (normA * normB) : 0;
    const clampedCosine = Math.max(-1, Math.min(1, cosine));
    const angleRad = normA && normB ? Math.acos(clampedCosine) : 0;
    const angleDeg = angleRad * (180 / Math.PI);
    const distance = Math.hypot(ax - bx, ay - by);

    const sumEl = document.getElementById('vectorSum');
    const dotEl = document.getElementById('vectorDot');
    const cosineEl = document.getElementById('vectorCosine');
    const angleEl = document.getElementById('vectorAngle');
    const modulusEl = document.getElementById('vectorModulus');
    const distanceEl = document.getElementById('vectorDistance');

    if (sumEl) sumEl.textContent = `[${formatNumber(ax + bx)}, ${formatNumber(ay + by)}]`;
    if (dotEl) dotEl.textContent = formatNumber(dot);
    if (cosineEl) cosineEl.textContent = formatNumber(cosine);
    if (angleEl) angleEl.textContent = `${formatNumber(angleDeg, 1)}°`;
    if (modulusEl) modulusEl.textContent = formatNumber(normA);
    if (distanceEl) distanceEl.textContent = formatNumber(distance);
}

function updateVectorStepExamples() {
    const sumStepEl = document.getElementById('vectorSumStep');
    const dotStepEl = document.getElementById('vectorDotStep');
    const normStepEl = document.getElementById('vectorNormStep');
    const cosineStepEl = document.getElementById('vectorCosineStep');
    const angleStepEl = document.getElementById('vectorAngleStep');
    const distanceStepEl = document.getElementById('vectorDistanceStep');

    const stepEls = [sumStepEl, dotStepEl, normStepEl, cosineStepEl, angleStepEl, distanceStepEl].filter(Boolean);
    if (!stepEls.length) return;

    const ax = vectorState.ax;
    const ay = vectorState.ay;
    const bx = vectorState.bx;
    const by = vectorState.by;

    const dot = ax * bx + ay * by;
    const normA = Math.hypot(ax, ay);
    const normB = Math.hypot(bx, by);
    const cosine = normA && normB ? dot / (normA * normB) : 0;
    const clampedCosine = Math.max(-1, Math.min(1, cosine));
    const angleRad = normA && normB ? Math.acos(clampedCosine) : 0;
    const angleDeg = angleRad * (180 / Math.PI);
    const distance = Math.hypot(ax - bx, ay - by);

    const axStr = formatStepNumber(ax);
    const ayStr = formatStepNumber(ay);
    const bxStr = formatStepNumber(bx);
    const byStr = formatStepNumber(by);
    const sumXStr = formatStepNumber(ax + bx);
    const sumYStr = formatStepNumber(ay + by);
    const dotStr = formatStepNumber(dot);
    const normAStr = formatStepNumber(normA);
    const normBStr = formatStepNumber(normB);
    const cosineStr = formatStepNumber(clampedCosine);
    const angleStr = formatStepNumber(angleDeg, 1);
    const distanceStr = formatStepNumber(distance);
    const normASquaredStr = formatStepNumber(ax * ax + ay * ay);
    const diffXStr = formatStepNumber(ax - bx);
    const diffYStr = formatStepNumber(ay - by);

    if (sumStepEl) {
        sumStepEl.innerHTML = `\\[
        \\begin{aligned}
        x + w &= [${axStr} + ${bxStr}, ${ayStr} + ${byStr}] \\\\
        &= [${sumXStr}, ${sumYStr}]
        \\end{aligned}
        \\]`;
    }
    if (dotStepEl) {
        dotStepEl.innerHTML = `\\[
        \\begin{aligned}
        x \\cdot w &= (${axStr})(${bxStr}) + (${ayStr})(${byStr}) \\\\
        &= ${dotStr}
        \\end{aligned}
        \\]`;
    }
    if (normStepEl) {
        normStepEl.innerHTML = `\\[
        \\begin{aligned}
        \\lVert x \\rVert &= \\sqrt{(${axStr})^2 + (${ayStr})^2} \\\\
        &= \\sqrt{${normASquaredStr}} = ${normAStr}
        \\end{aligned}
        \\]`;
    }
    if (cosineStepEl) {
        cosineStepEl.innerHTML = `\\[
        \\begin{aligned}
        \\cos\\theta &= \\frac{x \\cdot w}{\\lVert x \\rVert \\lVert w \\rVert} \\\\
        &= \\frac{${dotStr}}{${normAStr} \\cdot ${normBStr}} = ${cosineStr}
        \\end{aligned}
        \\]`;
    }
    if (angleStepEl) {
        angleStepEl.innerHTML = `\\[
        \\begin{aligned}
        \\theta &= \\cos^{-1}(${cosineStr}) \\\\
        &= ${angleStr}^{\\circ}
        \\end{aligned}
        \\]`;
    }
    if (distanceStepEl) {
        distanceStepEl.innerHTML = `\\[
        \\begin{aligned}
        \\lVert x - w \\rVert &= \\sqrt{(${axStr} - ${bxStr})^2 + (${ayStr} - ${byStr})^2} \\\\
        &= \\sqrt{(${diffXStr})^2 + (${diffYStr})^2} = ${distanceStr}
        \\end{aligned}
        \\]`;
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise(stepEls);
    }
}

function updateVectorOperationUI() {
    const config = vectorOperationConfig[vectorState.operation] || vectorOperationConfig.data;
    const formula = document.getElementById('vectorOperationFormula');
    const animateButton = document.getElementById('vectorAnimateButton');
    const opButtons = document.querySelectorAll('[data-vector-op]');
    const metricEls = document.querySelectorAll('[data-vector-metric]');

    opButtons.forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.vectorOp === vectorState.operation);
    });

    if (formula) {
        formula.innerHTML = `\\[${config.formula}\\]`;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([formula]);
        }
    }

    metricEls.forEach(metric => {
        const isActive = config.metrics.includes(metric.dataset.vectorMetric);
        metric.classList.toggle('is-active', isActive);
    });

    if (animateButton) {
        animateButton.style.display = vectorState.operation === 'addition' ? 'inline-flex' : 'none';
    }
}

function updateVectorPlayground() {
    initVectorCanvas();
    updateVectorMetrics();
    updateVectorStepExamples();
    updateVectorOperationUI();
}

function setVectorOperation(operation) {
    vectorState.operation = operation;
    updateVectorPlayground();
}

// ============================================
// Matrix Operations Visualization
// ============================================
const matrixState = {
    a: [
        [1, 2],
        [3, 4]
    ],
    b: [
        [2, 1],
        [0, 1]
    ],
    operation: 'add',
    progress: 1,
    scaleX: 1.5,
    scaleY: 0.7,
    shearX: 0.8
};

const matrixModeState = {
    mode: 'basic'
};

const matrixDeepState = {
    a: [
        [1, 2],
        [3, 4]
    ],
    b: [
        [2, 1],
        [0, 1]
    ],
    operation: 'determinant',
    progress: 1
};

const matrixDetExample = [
    [1.2, 0.6],
    [0.2, 1.1]
];

const matrixInverseExample = [
    [1, 2],
    [3, 4]
];

const matrixOperationConfig = {
    multiply: {
        formula: 'C = AB',
        note: 'Multiplication mixes rows and columns to transform vectors.',
        animate: true
    },
    add: {
        formula: 'C = A + B',
        note: 'Addition combines matching entries in each matrix.',
        animate: true
    },
    scale: {
        formula: 'A = \\begin{bmatrix} s_x & 0 \\\\ 0 & s_y \\end{bmatrix}',
        note: 'Scaling stretches or compresses the axes by s_x and s_y.',
        animate: false
    },
    shear: {
        formula: 'A = \\begin{bmatrix} 1 & k \\\\ 0 & 1 \\end{bmatrix}',
        note: 'Shear slides one axis, slanting the grid while keeping lines parallel.',
        animate: false
    },
    step: {
        formula: 'c_{ij} = \\sum_k a_{ik} b_{kj}',
        note: 'Each entry is a row-by-column dot product.',
        animate: true,
        speed: 0.03
    },
    determinant: {
        formula: '\\det(A) = ad - bc',
        note: 'Determinant is the area scale factor; sign indicates a flip.',
        animate: false
    },
    inverse: {
        formula: 'A^{-1} = \\frac{1}{\\det(A)}\\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}',
        note: 'The inverse undoes the transform: A^{-1}(Ax) = x.',
        animate: false
    },
    covariance: {
        formula: '\\begin{aligned} \\Sigma &= \\frac{1}{n-1}X_c^T X_c \\\\ X_c &= X - \\mathbf{1}\\mu^T \\end{aligned}',
        note: 'Step 1: center data. Step 2: covariance ellipse shows spread. Step 3: precision (inverse) reweights directions.',
        animate: false
    },
    identity: {
        formula: 'AI = IA = A',
        note: 'The identity matrix leaves vectors unchanged.',
        animate: false
    },
    onehot: {
        formula: '\\text{class}=k \\Rightarrow \\mathbf{e}_k',
        note: 'One-hot encoding turns categories into indicator vectors.',
        animate: false
    },
    eigen: {
        formula: 'A\\mathbf{v} = \\lambda \\mathbf{v},\\; \\det(A-\\lambda I)=0',
        note: 'Eigenvectors keep direction; eigenvalues scale them.',
        animate: false
    }
};

function addMatrices(a, b) {
    return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

function multiplyMatrices(a, b) {
    const result = [
        [0, 0],
        [0, 0]
    ];
    for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
            result[i][j] = a[i][0] * b[0][j] + a[i][1] * b[1][j];
        }
    }
    return result;
}

function determinant2x2(matrix) {
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
}

function invert2x2(matrix) {
    const det = determinant2x2(matrix);
    if (Math.abs(det) < 1e-6) return null;
    return [
        [matrix[1][1] / det, -matrix[0][1] / det],
        [-matrix[1][0] / det, matrix[0][0] / det]
    ];
}

function formatNumber(value, digits = 2) {
    if (typeof value !== 'number') return String(value);
    const fixed = value.toFixed(digits);
    return fixed.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
}

function formatMatrix(matrix, digits = 2) {
    return matrix.map(row => row.map(value => formatNumber(value, digits)));
}

function fillRectWithAlpha(ctx, color, alpha, x, y, width, height) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
}

function drawMatrixBox(ctx, x, y, matrix, label, theme, options = {}) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = options.cellSize || 32;
    const padding = options.padding || 12;
    const width = cols * cellSize + padding * 2;
    const height = rows * cellSize + padding * 2;

    drawRoundedRect(ctx, x, y, width, height, 12);
    ctx.fillStyle = theme.panel;
    ctx.strokeStyle = theme.panelBorder;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    const highlightRows = options.highlightRows || [];
    const highlightCols = options.highlightCols || [];
    const highlightCells = options.highlightCells || [];
    const rowColor = options.rowColor || theme.primary;
    const colColor = options.colColor || theme.secondary;
    const cellColor = options.cellColor || theme.success;
    const interiorX = x + padding;
    const interiorY = y + padding;
    const interiorW = cols * cellSize;
    const interiorH = rows * cellSize;

    if (highlightRows.length || highlightCols.length || highlightCells.length) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(interiorX, interiorY, interiorW, interiorH);
        ctx.clip();

        highlightRows.forEach(row => {
            fillRectWithAlpha(ctx, rowColor, 0.2, interiorX, interiorY + row * cellSize, interiorW, cellSize);
        });

        highlightCols.forEach(col => {
            fillRectWithAlpha(ctx, colColor, 0.2, interiorX + col * cellSize, interiorY, cellSize, interiorH);
        });

        highlightCells.forEach(cell => {
            const fill = cell.color || cellColor;
            const alpha = cell.alpha ?? 0.35;
            fillRectWithAlpha(ctx, fill, alpha, interiorX + cell.col * cellSize, interiorY + cell.row * cellSize, cellSize, cellSize);
        });

        ctx.restore();
    }

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1.5;
    for (let r = 1; r < rows; r++) {
        const rowY = y + padding + r * cellSize;
        ctx.beginPath();
        ctx.moveTo(x + padding, rowY);
        ctx.lineTo(x + width - padding, rowY);
        ctx.stroke();
    }
    for (let c = 1; c < cols; c++) {
        const colX = x + padding + c * cellSize;
        ctx.beginPath();
        ctx.moveTo(colX, y + padding);
        ctx.lineTo(colX, y + height - padding);
        ctx.stroke();
    }

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 14px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    matrix.forEach((row, r) => {
        row.forEach((value, c) => {
            const cx = x + padding + c * cellSize + cellSize / 2;
            const cy = y + padding + r * cellSize + cellSize / 2;
            ctx.fillText(String(value), cx, cy);
        });
    });

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y - 10);

    return { width, height };
}

function drawMatrixTransformComparison(ctx, canvas, matrix, theme, options = {}) {
    const leftOrigin = { x: canvas.width * 0.28, y: canvas.height * 0.62 };
    const rightOrigin = { x: canvas.width * 0.72, y: canvas.height * 0.62 };
    const scale = options.scale || 22;
    const size = options.size || 4;
    const vector = options.vector || { x: 1.6, y: 1 };
    const axisOptions = options.showTicks
        ? {
            showTicks: true,
            tickStep: options.tickStep || 1,
            tickColor: theme.inkSoft,
            labelColor: theme.inkSoft
        }
        : null;

    if (options.showPanels) {
        const panelPadding = options.panelPadding ?? 10;
        const panelWidth = size * scale * 2 + panelPadding * 2;
        const panelHeight = size * scale * 2 + panelPadding * 2;
        [leftOrigin, rightOrigin].forEach(origin => {
            const panelX = origin.x - panelWidth / 2;
            const panelY = origin.y - panelHeight / 2;
            drawRoundedRect(ctx, panelX, panelY, panelWidth, panelHeight, 14);
            ctx.fillStyle = theme.panel;
            ctx.strokeStyle = theme.panelBorder;
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
        });
    }

    ctx.save();
    ctx.globalAlpha = options.leftGridAlpha ?? 1;
    drawGrid(ctx, leftOrigin, scale, size, [
        [1, 0],
        [0, 1]
    ], theme.grid);
    ctx.restore();
    drawAxes(ctx, leftOrigin, scale, size, theme.axis, axisOptions || undefined);

    ctx.save();
    ctx.globalAlpha = options.rightGridAlpha ?? 1;
    drawGrid(ctx, rightOrigin, scale, size, matrix, theme.primary);
    ctx.restore();
    drawAxes(ctx, rightOrigin, scale, size, theme.axis, axisOptions || undefined);

    const leftStart = mapToCanvas({ x: 0, y: 0 }, leftOrigin, scale);
    const leftEnd = mapToCanvas(vector, leftOrigin, scale);
    drawArrow(ctx, leftStart.x, leftStart.y, leftEnd.x, leftEnd.y, theme.secondary);

    const transformed = applyMatrix(vector, matrix);
    const rightStart = mapToCanvas({ x: 0, y: 0 }, rightOrigin, scale);
    const rightEnd = mapToCanvas(transformed, rightOrigin, scale);
    drawArrow(ctx, rightStart.x, rightStart.y, rightEnd.x, rightEnd.y, theme.success);

    if (options.fillSquare) {
        const square = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 1, y: 1 },
            { x: 0, y: 1 }
        ];
        const transformedSquare = square.map(point => applyMatrix(point, matrix));
        const squareCanvas = transformedSquare.map(point => mapToCanvas(point, rightOrigin, scale));

        ctx.save();
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        squareCanvas.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    if (options.labelLeft || options.labelRight) {
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        if (options.labelLeft) ctx.fillText(options.labelLeft, leftOrigin.x, leftOrigin.y - 96);
        if (options.labelRight) ctx.fillText(options.labelRight, rightOrigin.x, rightOrigin.y - 96);
    }
}

function drawMatrixScalingVisualization(ctx, canvas, theme, state) {
    const matrix = [
        [state.scaleX, 0],
        [0, state.scaleY]
    ];

    drawMatrixTransformComparison(ctx, canvas, matrix, theme, {
        scale: 20,
        fillSquare: true,
        labelLeft: 'Before',
        labelRight: 'Scaled grid',
        showTicks: true,
        tickStep: 1,
        showPanels: true,
        leftGridAlpha: 0.55,
        rightGridAlpha: 0.9,
        panelPadding: 10
    });

    drawMatrixBox(ctx, 18, 24, formatMatrix(matrix, 2), 'Scale A', theme);
}

function drawMatrixShearVisualization(ctx, canvas, theme, state) {
    const matrix = [
        [1, state.shearX],
        [0, 1]
    ];

    drawMatrixTransformComparison(ctx, canvas, matrix, theme, {
        fillSquare: true,
        labelLeft: 'Before',
        labelRight: 'Sheared grid',
        vector: { x: 1.4, y: 1.2 }
    });

    drawMatrixBox(ctx, 18, 24, formatMatrix(matrix, 2), 'Shear A', theme);
}

function drawMatrixArithmetic(ctx, theme, state) {
    const a = state.a;
    const b = state.b;
    const result = state.operation === 'add' ? addMatrices(a, b) : multiplyMatrices(a, b);

    const startX = 32;
    const startY = 74;
    const gap = 22;
    const boxA = drawMatrixBox(ctx, startX, startY, a, 'A', theme);
    const centerY = startY + boxA.height / 2;
    const opSymbol = state.operation === 'add' ? '+' : '×';

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 22px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const opX = startX + boxA.width + gap;
    ctx.fillText(opSymbol, opX, centerY);

    const boxB = drawMatrixBox(ctx, opX + gap, startY, b, 'B', theme);
    const eqX = opX + gap + boxB.width + gap;
    ctx.fillText('=', eqX, centerY);

    ctx.save();
    ctx.globalAlpha = Math.min(1, state.progress);
    drawMatrixBox(ctx, eqX + gap, startY, result, 'C', theme);
    ctx.restore();
}

function drawMatrixMultiplicationSteps(ctx, theme, state) {
    const a = state.a;
    const b = state.b;
    const result = multiplyMatrices(a, b);
    const steps = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 }
    ];
    const stepIndex = Math.min(steps.length - 1, Math.floor(state.progress * steps.length));
    const activeStep = steps[stepIndex];
    const display = result.map(row => row.map(() => '?'));
    const highlightCells = [];

    steps.forEach((step, index) => {
        if (index <= stepIndex) {
            display[step.row][step.col] = result[step.row][step.col];
            highlightCells.push({
                row: step.row,
                col: step.col,
                color: theme.success,
                alpha: index === stepIndex ? 0.35 : 0.18
            });
        }
    });

    const startX = 32;
    const startY = 54;
    const gap = 22;
    const boxA = drawMatrixBox(ctx, startX, startY, a, 'A', theme, {
        highlightRows: [activeStep.row],
        rowColor: theme.primary
    });
    const centerY = startY + boxA.height / 2;

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 22px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const opX = startX + boxA.width + gap;
    ctx.fillText('×', opX, centerY);

    const boxB = drawMatrixBox(ctx, opX + gap, startY, b, 'B', theme, {
        highlightCols: [activeStep.col],
        colColor: theme.secondary
    });
    const eqX = opX + gap + boxB.width + gap;
    ctx.fillText('=', eqX, centerY);

    drawMatrixBox(ctx, eqX + gap, startY, display, 'C', theme, {
        highlightCells
    });

    const formulaText = `c${activeStep.row + 1}${activeStep.col + 1} = ${a[activeStep.row][0]}×${b[0][activeStep.col]} + ${a[activeStep.row][1]}×${b[1][activeStep.col]} = ${result[activeStep.row][activeStep.col]}`;
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 13px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formulaText, ctx.canvas.width / 2, startY + boxA.height + 60);
}

function drawCovariancePrecision(ctx, theme) {
    const covariance = [
        [2, 1],
        [1, 1.5]
    ];
    const precision = [
        ['0.75', '-0.50'],
        ['-0.50', '1.00']
    ];

    const startY = 28;
    const leftX = 32;
    const gap = 26;
    const boxSigma = drawMatrixBox(ctx, leftX, startY, covariance, 'Sigma', theme);
    const centerY = startY + boxSigma.height / 2;
    const arrowX = leftX + boxSigma.width + gap;

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 18px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('->', arrowX, centerY);

    const rightX = arrowX + gap;
    const boxPrecision = drawMatrixBox(ctx, rightX, startY, precision, 'Sigma^-1', theme);

    const panelTop = startY + Math.max(boxSigma.height, boxPrecision.height) + 70;
    const panelHeight = Math.max(110, ctx.canvas.height - panelTop - 18);
    const panelGap = 12;
    const panelWidth = (ctx.canvas.width - 40 - panelGap * 2) / 3;
    const points = [
        { x: -0.8, y: -0.2 },
        { x: -0.6, y: -0.1 },
        { x: -0.3, y: 0.05 },
        { x: 0.05, y: 0.2 },
        { x: 0.35, y: 0.35 },
        { x: 0.6, y: 0.55 },
        { x: 0.2, y: -0.1 },
        { x: -0.1, y: 0.0 }
    ];
    const mean = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
    mean.x /= points.length;
    mean.y /= points.length;

    const panels = [
        { label: '1. Center', type: 'mean' },
        { label: '2. Covariance', type: 'cov' },
        { label: '3. Precision', type: 'prec' }
    ];

    panels.forEach((panel, index) => {
        const rect = {
            x: 20 + index * (panelWidth + panelGap),
            y: panelTop,
            width: panelWidth,
            height: panelHeight
        };
        const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme);
        drawMiniScatter(ctx, origin, scale, points, theme.primary, 3);

        if (panel.type === 'mean') {
            drawMiniVector(ctx, origin, scale, mean, theme.secondary);
            const meanPoint = mapToCanvas(mean, origin, scale);
            drawPoint(ctx, meanPoint.x, meanPoint.y, theme.secondary, 4);
        }

        if (panel.type === 'cov') {
            ctx.save();
            ctx.strokeStyle = theme.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(origin.x, origin.y, scale * 0.75, scale * 0.35, Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (panel.type === 'prec') {
            ctx.save();
            ctx.strokeStyle = theme.secondary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(origin.x, origin.y, scale * 0.35, scale * 0.75, -Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        drawMiniLabel(ctx, rect, panel.label, theme);
    });

    const arrowY = panelTop + panelHeight / 2;
    for (let i = 0; i < 2; i++) {
        const startX = 20 + (i + 1) * panelWidth + i * panelGap + 6;
        const endX = startX + panelGap - 12;
        drawArrow(ctx, startX, arrowY, endX, arrowY, theme.axis);
    }
}

function drawIdentityMatrix(ctx, theme, state) {
    const a = state.a;
    const identity = [
        [1, 0],
        [0, 1]
    ];

    const startX = 28;
    const startY = 74;
    const gap = 20;
    const boxA = drawMatrixBox(ctx, startX, startY, a, 'A', theme);
    const centerY = startY + boxA.height / 2;
    const opX = startX + boxA.width + gap;

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 22px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', opX, centerY);

    const boxI = drawMatrixBox(ctx, opX + gap, startY, identity, 'I', theme, {
        highlightCells: [
            { row: 0, col: 0, color: theme.success, alpha: 0.3 },
            { row: 1, col: 1, color: theme.success, alpha: 0.3 }
        ]
    });
    const eqX = opX + gap + boxI.width + gap;
    ctx.fillText('=', eqX, centerY);
    drawMatrixBox(ctx, eqX + gap, startY, a, 'A', theme);
}

function drawOneHotEncoding(ctx, theme) {
    const labels = ['cat', 'dog', 'bird', 'fish'];
    const hotIndex = 1;
    const startX = 40;
    const startY = 70;
    const rowGap = 28;

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 14px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Classes', startX, startY - 30);

    labels.forEach((label, index) => {
        const y = startY + index * rowGap;
        if (index === hotIndex) {
            drawRoundedRect(ctx, startX - 10, y - 14, 90, 24, 10);
            ctx.fillStyle = theme.primary;
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, startX, y);
        } else {
            ctx.fillStyle = theme.inkSoft;
            ctx.fillText(label, startX, y);
        }
    });

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 16px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('->', 200, startY + rowGap * 1.5);

    const oneHot = labels.map((_, index) => [index === hotIndex ? 1 : 0]);
    drawMatrixBox(ctx, 240, 60, oneHot, 'one-hot y', theme, {
        cellSize: 28,
        padding: 10,
        highlightCells: [{ row: hotIndex, col: 0, color: theme.primary, alpha: 0.35 }]
    });

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('dog -> [0 1 0 0]', ctx.canvas.width / 2, 260);
}

function drawEigenVisualization(ctx, canvas, theme) {
    const matrixA = [
        [2, 0],
        [0, 0.6]
    ];
    const centerX = Math.round(canvas.width * 0.64);
    const centerY = Math.round(canvas.height * 0.56);
    const size = Math.min(canvas.width * 0.23, canvas.height * 0.32);
    const step = Math.max(18, Math.round(size / 4.5));

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -size; i <= size; i += step) {
        ctx.moveTo(centerX + i, centerY - size);
        ctx.lineTo(centerX + i, centerY + size);
        ctx.moveTo(centerX - size, centerY + i);
        ctx.lineTo(centerX + size, centerY + i);
    }
    ctx.stroke();

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - size, centerY);
    ctx.lineTo(centerX + size, centerY);
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX, centerY + size);
    ctx.stroke();

    drawMatrixBox(ctx, 20, 30, matrixA, 'A', theme);

    const v1 = { x: size * 0.5, y: 0 };
    const v2 = { x: 0, y: -size * 0.5 };
    const lambda1 = 2;
    const lambda2 = 0.6;

    drawVector(ctx, centerX, centerY, v1.x, v1.y, theme.primary, 'v1');
    drawVector(ctx, centerX, centerY, v2.x, v2.y, theme.secondary, 'v2');

    ctx.save();
    ctx.setLineDash([6, 4]);
    drawVector(ctx, centerX, centerY, v1.x * lambda1, v1.y * lambda1, theme.success, '');
    drawVector(ctx, centerX, centerY, v2.x * lambda2, v2.y * lambda2, theme.success, '');
    ctx.restore();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('lambda1 = 2', centerX - 90, centerY + size + 24);
    ctx.fillText('lambda2 = 0.6', centerX - 90, centerY + size + 40);
}

function drawDeterminantVisualization(ctx, canvas, theme) {
    const matrix = matrixDetExample;
    const det = determinant2x2(matrix);
    const origin = { x: canvas.width * 0.45, y: canvas.height * 0.68 };
    const scale = 60;
    const size = 3;

    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const square = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 }
    ];
    const squareCanvas = square.map(point => mapToCanvas(point, origin, scale));

    ctx.save();
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    squareCanvas.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    const transformed = square.map(point => applyMatrix(point, matrix));
    const transformedCanvas = transformed.map(point => mapToCanvas(point, origin, scale));

    ctx.save();
    ctx.fillStyle = theme.primary;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    transformedCanvas.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    const originCanvas = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const e1End = mapToCanvas(applyMatrix({ x: 1, y: 0 }, matrix), origin, scale);
    const e2End = mapToCanvas(applyMatrix({ x: 0, y: 1 }, matrix), origin, scale);
    drawArrow(ctx, originCanvas.x, originCanvas.y, e1End.x, e1End.y, theme.secondary);
    drawArrow(ctx, originCanvas.x, originCanvas.y, e2End.x, e2End.y, theme.warning);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('Ae1', e1End.x + 6, e1End.y - 6);
    ctx.fillText('Ae2', e2End.x + 6, e2End.y - 6);

    drawMatrixBox(ctx, 20, 24, formatMatrix(matrix, 2), 'A', theme);

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`det(A) = ${formatNumber(det, 2)} (area scale)`, 20, canvas.height - 18);
}

function drawInverseVisualization(ctx, canvas, theme) {
    const matrix = matrixInverseExample;
    const det = determinant2x2(matrix);
    const inverse = invert2x2(matrix);

    if (!inverse) {
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('det(A) = 0, no inverse exists.', canvas.width / 2, canvas.height / 2);
        return;
    }

    const leftOrigin = { x: canvas.width * 0.28, y: canvas.height * 0.62 };
    const rightOrigin = { x: canvas.width * 0.72, y: canvas.height * 0.62 };
    const scale = 22;
    const size = 4;

    drawGrid(ctx, leftOrigin, scale, size, [
        [1, 0],
        [0, 1]
    ], theme.grid);
    drawAxes(ctx, leftOrigin, scale, size, theme.axis);

    drawGrid(ctx, rightOrigin, scale, size, matrix, theme.primary);
    drawAxes(ctx, rightOrigin, scale, size, theme.axis);

    const vector = { x: 1.5, y: 1 };
    const leftStart = mapToCanvas({ x: 0, y: 0 }, leftOrigin, scale);
    const leftEnd = mapToCanvas(vector, leftOrigin, scale);
    drawArrow(ctx, leftStart.x, leftStart.y, leftEnd.x, leftEnd.y, theme.secondary);

    const transformed = applyMatrix(vector, matrix);
    const rightStart = mapToCanvas({ x: 0, y: 0 }, rightOrigin, scale);
    const rightEnd = mapToCanvas(transformed, rightOrigin, scale);
    drawArrow(ctx, rightStart.x, rightStart.y, rightEnd.x, rightEnd.y, theme.success);

    drawMatrixBox(ctx, 20, 24, formatMatrix(matrix, 2), 'A', theme);
    drawMatrixBox(ctx, canvas.width - 120, 24, formatMatrix(inverse, 2), 'A^-1', theme);

    const arrowStartX = leftOrigin.x + 50;
    const arrowEndX = rightOrigin.x - 50;
    const topY = 108;
    const bottomY = 130;
    drawArrow(ctx, arrowStartX, topY, arrowEndX, topY, theme.primary);
    drawArrow(ctx, arrowEndX, bottomY, arrowStartX, bottomY, theme.secondary);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A', (arrowStartX + arrowEndX) / 2, topY - 8);
    ctx.fillText('A^-1', (arrowStartX + arrowEndX) / 2, bottomY - 8);

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`det(A) = ${formatNumber(det, 2)}`, 20, canvas.height - 18);
}

function drawMatrixOperation(ctx, canvas, theme, state = matrixState) {
    if (state.operation === 'add' || state.operation === 'multiply') {
        drawMatrixArithmetic(ctx, theme, state);
        return;
    }

    if (state.operation === 'scale') {
        drawMatrixScalingVisualization(ctx, canvas, theme, state);
        return;
    }

    if (state.operation === 'shear') {
        drawMatrixShearVisualization(ctx, canvas, theme, state);
        return;
    }

    if (state.operation === 'step') {
        drawMatrixMultiplicationSteps(ctx, theme, state);
        return;
    }

    if (state.operation === 'determinant') {
        drawDeterminantVisualization(ctx, canvas, theme);
        return;
    }

    if (state.operation === 'inverse') {
        drawInverseVisualization(ctx, canvas, theme);
        return;
    }

    if (state.operation === 'covariance') {
        drawCovariancePrecision(ctx, theme);
        return;
    }

    if (state.operation === 'identity') {
        drawIdentityMatrix(ctx, theme, state);
        return;
    }

    if (state.operation === 'onehot') {
        drawOneHotEncoding(ctx, theme);
        return;
    }

    if (state.operation === 'eigen') {
        drawEigenVisualization(ctx, canvas, theme);
        return;
    }

    drawMatrixArithmetic(ctx, theme, state);
}

function drawMatrixCanvas() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrixOperation(ctx, canvas, theme, matrixState);
}

function drawMatrixDeepCanvas() {
    const canvas = document.getElementById('matrixDeepCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrixOperation(ctx, canvas, theme, matrixDeepState);
}

function updateMatrixUIForState(state, elements) {
    const config = matrixOperationConfig[state.operation] || matrixOperationConfig.multiply;
    const { formulaEl, noteEl, buttons, animateButton } = elements;

    if (buttons && buttons.length) {
        buttons.forEach(button => {
            const key = button.dataset.matrixOp || button.dataset.matrixDeepOp;
            button.classList.toggle('is-active', key === state.operation);
        });
    }

    if (formulaEl) {
        formulaEl.innerHTML = `\\[${config.formula}\\]`;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([formulaEl]);
        }
    }

    if (noteEl) {
        noteEl.textContent = config.note;
    }

    if (animateButton) {
        animateButton.style.display = config.animate ? 'inline-flex' : 'none';
    }
}

function updateMatrixTransformLabels() {
    const scaleXLabel = document.getElementById('matrixScaleXVal');
    const scaleYLabel = document.getElementById('matrixScaleYVal');
    const shearLabel = document.getElementById('matrixShearVal');

    if (scaleXLabel) scaleXLabel.textContent = formatNumber(matrixState.scaleX, 2);
    if (scaleYLabel) scaleYLabel.textContent = formatNumber(matrixState.scaleY, 2);
    if (shearLabel) shearLabel.textContent = formatNumber(matrixState.shearX, 2);
}

function updateMatrixTransformControls() {
    const controls = document.getElementById('matrixTransformControls');
    if (!controls) return;

    const scaleGroup = controls.querySelector('[data-matrix-control="scale"]');
    const shearGroup = controls.querySelector('[data-matrix-control="shear"]');
    const hint = document.getElementById('matrixTransformHint');

    const showScale = matrixState.operation === 'scale';
    const showShear = matrixState.operation === 'shear';
    const showControls = showScale || showShear;

    controls.hidden = !showControls;
    if (scaleGroup) {
        scaleGroup.hidden = !showScale;
        scaleGroup.style.display = showScale ? 'grid' : 'none';
    }
    if (shearGroup) {
        shearGroup.hidden = !showShear;
        shearGroup.style.display = showShear ? 'grid' : 'none';
    }
    if (hint) hint.hidden = !showControls;

    updateMatrixTransformLabels();
}

function updateMatrixBasicUI() {
    updateMatrixUIForState(matrixState, {
        formulaEl: document.getElementById('matrixOperationFormula'),
        noteEl: document.getElementById('matrixOperationNote'),
        buttons: document.querySelectorAll('[data-matrix-op]'),
        animateButton: document.getElementById('matrixAnimateButton')
    });
    updateMatrixTransformControls();
}

function updateMatrixDeepUI() {
    updateMatrixUIForState(matrixDeepState, {
        formulaEl: document.getElementById('matrixDeepFormula'),
        noteEl: document.getElementById('matrixDeepNote'),
        buttons: document.querySelectorAll('[data-matrix-deep-op]'),
        animateButton: document.getElementById('matrixDeepAnimateButton')
    });
}

function setMatrixMode(mode) {
    matrixModeState.mode = mode;
    const buttons = document.querySelectorAll('[data-matrix-mode]');
    const panels = document.querySelectorAll('.matrix-mode-panel');

    buttons.forEach(button => {
        const isActive = button.dataset.matrixMode === mode;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    panels.forEach(panel => {
        const isActive = panel.dataset.matrixMode === mode;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    updateMatrixBasicUI();
    updateMatrixDeepUI();
    drawMatrixCanvas();
    drawMatrixDeepCanvas();
}

function setupMatrixModes() {
    const buttons = document.querySelectorAll('[data-matrix-mode]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setMatrixMode(button.dataset.matrixMode));
    });

    setMatrixMode(matrixModeState.mode);
}

// ============================================
// Probability Section Visualization
// ============================================
const probabilityModes = [
    {
        id: 'bernoulli',
        type: 'bars',
        labels: ['0', '1'],
        values: [0.35, 0.65],
        annotation: 'p = 0.65',
        note: 'Bars show P(X=0) and P(X=1). Y-axis is probability; x-axis is the outcome.'
    },
    {
        id: 'categorical',
        type: 'bars',
        labels: ['A', 'B', 'C', 'D', 'E'],
        values: [0.35, 0.2, 0.18, 0.17, 0.1],
        annotation: 'sum p_i = 1',
        note: 'Bars show P(X=i) across categories. Y-axis is probability; x-axis lists classes.'
    },
    {
        id: 'binomial',
        type: 'binomial',
        n: 10,
        p: 0.5,
        annotation: 'n = 10, p = 0.5',
        note: 'Bars show P(X=k) for k successes. Y-axis is probability; x-axis is k.'
    },
    {
        id: 'normal',
        type: 'curve',
        annotation: 'mu = 0, sigma = 1',
        note: 'Curve shows probability density; area under the curve between two x-values equals probability.'
    },
    {
        id: 'bayes',
        type: 'bayes',
        note: 'Bars show hypotheses H1/H2. Compare prior, likelihood, and posterior after Bayes update.'
    }
];

const probabilityState = {
    modeId: probabilityModes[0].id
};

const probabilityDepthState = {
    mode: 'basic'
};

const probabilityVennNotes = {
    event: 'Highlight A: \\(P(A)\\).',
    complement: 'Outside A: \\(P(\\overline{A}) = 1 - P(A)\\).',
    union: 'Union: \\(P(A \\cup B)\\) covers A or B.',
    intersection: 'Intersection: \\(P(A \\cap B)\\) shows both events.',
    conditional: 'Within B, the overlap gives \\(P(A \\mid B)\\).',
    bayes: 'Bayes swaps the condition: \\(P(A \\mid B) = \\frac{P(B \\mid A)P(A)}{P(B)}\\).'
};

const probabilityVennState = {
    mode: 'event'
};

const spamWordData = {
    free: { spam: 0.65, ham: 0.1 },
    win: { spam: 0.6, ham: 0.08 },
    meeting: { spam: 0.05, ham: 0.3 },
    project: { spam: 0.07, ham: 0.25 },
    offer: { spam: 0.45, ham: 0.15 }
};

const spamFilterState = {
    prior: 0.3,
    words: new Set(['free', 'win'])
};

const probabilitySampleState = {
    a: 0.6,
    b: 0.5,
    points: 220,
    samples: []
};

const likelihoodPresets = [
    {
        id: 'balanced',
        label: 'Balanced',
        n: 10,
        k: 5,
        note: 'Balanced data: the curve peaks around 0.5.'
    },
    {
        id: 'rare',
        label: 'Rare event',
        n: 12,
        k: 2,
        note: 'Rare successes pull the estimate toward 0.'
    },
    {
        id: 'skewed',
        label: 'Skewed',
        n: 12,
        k: 9,
        note: 'Many successes push the estimate higher.'
    }
];

const likelihoodPlaygroundState = {
    n: likelihoodPresets[0].n,
    k: likelihoodPresets[0].k,
    pGuess: likelihoodPresets[0].k / likelihoodPresets[0].n,
    presetId: likelihoodPresets[0].id
};

const likelihoodSteps = [
    {
        title: 'Define the data',
        text: 'Each outcome y_i is 1 (success) or 0 (failure).',
        formula: '\\[ y_i \\sim \\text{Bernoulli}(p), \\quad P(y_i=1)=p, \\; P(y_i=0)=1-p \\]'
    },
    {
        title: 'Write the likelihood',
        text: 'Multiply the probability of every outcome. With k successes in N trials:',
        formula: '\\[ L(p)=\\prod_{i=1}^N p^{y_i}(1-p)^{1-y_i} = p^k(1-p)^{N-k} \\]'
    },
    {
        title: 'Take the log',
        text: 'Log turns the product into a sum and stabilizes computation.',
        formula: '\\[ \\log L(p)=k\\log p+(N-k)\\log(1-p) \\]'
    },
    {
        title: 'Estimate p (MLE)',
        text: 'Differentiate and set to zero to find the peak of the curve.',
        formula: '\\[ \\frac{d}{dp}\\log L(p)=\\frac{k}{p}-\\frac{N-k}{1-p}=0 \\Rightarrow \\hat{p}=\\frac{k}{N} \\]'
    },
    {
        title: 'Convert to loss',
        text: 'Minimizing negative log-likelihood equals maximizing likelihood.',
        formula: '\\[ \\mathcal{L}(p)=-\\log L(p) \\]'
    }
];

const likelihoodStepState = {
    step: 0
};

const mlLifecycleSteps = {
    training: [
        {
            title: 'Load data batch',
            summary: 'Sample a mini-batch of examples.',
            text: 'Pull a batch of inputs and labels from the dataset.'
        },
        {
            title: 'Forward pass',
            summary: 'Run data through the model.',
            text: 'Compute predictions using the current weights.'
        },
        {
            title: 'Loss',
            summary: 'Measure prediction error.',
            text: 'Compare predictions to targets to get a loss value.'
        },
        {
            title: 'Backpropagate',
            summary: 'Send gradients backward.',
            text: 'Use the chain rule to compute gradients for each weight.'
        },
        {
            title: 'Update weights',
            summary: 'Step the weights and repeat.',
            text: 'Apply the learning rate to update weights before the next batch.'
        }
    ],
    inference: [
        {
            title: 'Input features',
            summary: 'Receive a new example.',
            text: 'Collect the features you want the model to score.'
        },
        {
            title: 'Forward pass',
            summary: 'Apply the trained model.',
            text: 'Run the features through the learned weights.'
        },
        {
            title: 'Prediction',
            summary: 'Get a score or probability.',
            text: 'Read the model output as a class, score, or probability.'
        },
        {
            title: 'Decision',
            summary: 'Act on the output.',
            text: 'Trigger the action: display, alert, or recommendation.'
        }
    ]
};

const mlLifecycleState = {
    phase: 'training',
    stepIndex: 0,
    timer: null
};

const mlAlgorithmSteps = {
    linear: {
        label: 'Linear Regression',
        steps: [
            { title: 'Prepare data', summary: 'Clean, scale, and add a bias term.', text: 'Normalize features, handle missing values, and append a column of ones for the intercept.' },
            { title: 'Define the model', summary: 'Linear score plus bias.', text: 'Model the target as \( \\hat{y} = \\mathbf{w}^T\\mathbf{x} + b \\).' },
            { title: 'Choose the loss', summary: 'Mean squared error (MSE).', text: 'Measure average squared residuals to penalize large errors.' },
            { title: 'Optimize weights', summary: 'Solve closed-form or use gradient descent.', text: 'Use the normal equation for small data or iterative updates for large data.' },
            { title: 'Validate fit', summary: 'Check residuals and metrics.', text: 'Evaluate on a holdout set with RMSE and inspect bias/variance.' },
            { title: 'Predict new data', summary: 'Apply the learned line.', text: 'Use the fitted parameters to estimate continuous targets.' }
        ]
    },
    logistic: {
        label: 'Logistic Regression',
        steps: [
            { title: 'Prepare data', summary: 'Scale features and encode labels.', text: 'Standardize inputs and map labels to 0/1.' },
            { title: 'Compute scores', summary: 'Linear combination of features.', text: 'Calculate \( z = \\mathbf{w}^T\\mathbf{x} + b \\).' },
            { title: 'Apply sigmoid', summary: 'Convert score to probability.', text: 'Use \( \\sigma(z) \\) to get \( P(y=1 \\mid x) \\).' },
            { title: 'Define log-loss', summary: 'Penalize confident wrong predictions.', text: 'Use cross-entropy to shape the boundary.' },
            { title: 'Optimize parameters', summary: 'Gradient descent or LBFGS.', text: 'Update weights to reduce log-loss.' },
            { title: 'Decide class', summary: 'Threshold the probability.', text: 'Predict class 1 if \( P(y=1 \\mid x) \\geq \\tau \\).' },
            { title: 'Evaluate', summary: 'Measure accuracy and calibration.', text: 'Check confusion matrix, ROC-AUC, and probability calibration.' }
        ]
    },
    knn: {
        label: 'k-NN',
        steps: [
            { title: 'Choose k + distance', summary: 'Set k and a metric.', text: 'Pick k and a distance function (Euclidean, cosine, etc.).' },
            { title: 'Scale features', summary: 'Make distances meaningful.', text: 'Normalize features so one dimension does not dominate.' },
            { title: 'Compute distances', summary: 'Compare query to all points.', text: 'Measure distance from the query to every labeled example.' },
            { title: 'Select k nearest', summary: 'Keep the closest points.', text: 'Sort by distance and retain the top k neighbors.' },
            { title: 'Aggregate labels', summary: 'Vote or average.', text: 'Use majority vote for classification or mean for regression.' },
            { title: 'Predict + explain', summary: 'Return label and neighbors.', text: 'Provide the prediction with neighbor influence for interpretability.' }
        ]
    },
    tree: {
        label: 'Decision Trees',
        steps: [
            { title: 'Pick a criterion', summary: 'Gini, entropy, or MSE.', text: 'Choose how to measure impurity or error.' },
            { title: 'Search splits', summary: 'Evaluate candidate thresholds.', text: 'Try each feature and threshold to find the best gain.' },
            { title: 'Split the data', summary: 'Partition into child nodes.', text: 'Send samples left or right based on the split rule.' },
            { title: 'Recurse', summary: 'Grow deeper branches.', text: 'Repeat splitting for each child node.' },
            { title: 'Stop growth', summary: 'Limit depth or samples.', text: 'Stop when purity is high or data is too sparse.' },
            { title: 'Assign leaves', summary: 'Output a prediction.', text: 'Use the majority class or mean target in each leaf.' }
        ]
    },
    forest: {
        label: 'Random Forest',
        steps: [
            { title: 'Set hyperparameters', summary: 'Trees, depth, features.', text: 'Choose number of trees, max depth, and features per split.' },
            { title: 'Bootstrap samples', summary: 'Resample with replacement.', text: 'Create a unique dataset for each tree.' },
            { title: 'Grow each tree', summary: 'Random feature splits.', text: 'At each node, consider only a subset of features.' },
            { title: 'Repeat for all trees', summary: 'Build an ensemble.', text: 'Train many diverse trees in parallel.' },
            { title: 'Aggregate outputs', summary: 'Vote or average.', text: 'Use majority vote for classification or mean for regression.' },
            { title: 'Estimate error', summary: 'Use out-of-bag samples.', text: 'Check OOB error without a full validation split.' }
        ]
    },
    svm: {
        label: 'Support Vector Machine',
        steps: [
            { title: 'Scale features', summary: 'Normalize inputs.', text: 'SVM is sensitive to feature scale, so standardize.' },
            { title: 'Choose kernel + C', summary: 'Linear or nonlinear.', text: 'Pick kernel type and regularization strength.' },
            { title: 'Optimize margin', summary: 'Solve the max-margin problem.', text: 'Find the hyperplane that separates classes with the widest margin.' },
            { title: 'Identify support vectors', summary: 'Boundary-defining points.', text: 'Only a subset of points determine the decision boundary.' },
            { title: 'Compute decision function', summary: 'Score new points.', text: 'Use support vectors to compute the signed distance.' },
            { title: 'Predict label', summary: 'Use sign or calibrated probability.', text: 'Assign class based on the decision score.' }
        ]
    },
    bayes: {
        label: 'Naive Bayes',
        steps: [
            { title: 'Compute priors', summary: 'Class frequencies.', text: 'Estimate \( P(y) \\) from class counts.' },
            { title: 'Estimate likelihoods', summary: 'Feature distributions per class.', text: 'Use Gaussian, Bernoulli, or multinomial likelihoods.' },
            { title: 'Assume independence', summary: 'Multiply feature likelihoods.', text: 'Use \( P(x\\mid y) = \\prod_i P(x_i \\mid y) \\).' },
            { title: 'Apply Bayes rule', summary: 'Compute posteriors.', text: 'Calculate \( P(y \\mid x) \\propto P(y)P(x\\mid y) \\).' },
            { title: 'Use log-probabilities', summary: 'Prevent underflow.', text: 'Sum log-likelihoods instead of multiplying small values.' },
            { title: 'Pick the class', summary: 'Largest posterior wins.', text: 'Choose the class with the highest posterior probability.' }
        ]
    },
    kmeans: {
        label: 'k-Means',
        steps: [
            { title: 'Choose k', summary: 'Decide number of clusters.', text: 'Pick k using domain knowledge or elbow method.' },
            { title: 'Initialize centroids', summary: 'Start positions.', text: 'Use random seeds or k-means++ for better starts.' },
            { title: 'Assign points', summary: 'Nearest centroid.', text: 'Label each point by its closest centroid.' },
            { title: 'Update centroids', summary: 'Mean of each cluster.', text: 'Move centroids to the average of assigned points.' },
            { title: 'Repeat until stable', summary: 'Converge assignments.', text: 'Stop when centroids change little or max iterations reached.' },
            { title: 'Evaluate clustering', summary: 'Check inertia or silhouette.', text: 'Measure compactness and separation.' }
        ]
    },
    pca: {
        label: 'PCA',
        steps: [
            { title: 'Center data', summary: 'Zero-mean features.', text: 'Subtract the mean from each feature (and scale if needed).' },
            { title: 'Compute covariance', summary: 'Feature correlations.', text: 'Build the covariance matrix (or use SVD).' },
            { title: 'Find eigenvectors', summary: 'Principal components.', text: 'Compute eigenvectors and eigenvalues.' },
            { title: 'Rank components', summary: 'Sort by variance.', text: 'Order by eigenvalues to keep the most informative axes.' },
            { title: 'Select k components', summary: 'Dimensionality choice.', text: 'Pick the top k components to retain variance.' },
            { title: 'Project data', summary: 'Lower-dimensional embedding.', text: 'Multiply by the selected component matrix.' }
        ]
    }
};

const mlAlgorithmState = {
    algoId: 'linear',
    stepIndex: 0,
    timer: null
};

const mlAlgoData = {
    regression: [
        { x: -1.6, y: -0.9 },
        { x: -1.2, y: -0.6 },
        { x: -0.8, y: -0.3 },
        { x: -0.4, y: 0.1 },
        { x: 0.0, y: 0.2 },
        { x: 0.4, y: 0.5 },
        { x: 0.8, y: 0.7 },
        { x: 1.2, y: 1.0 }
    ],
    classA: [
        { x: -1.2, y: -0.8 },
        { x: -0.9, y: -1.1 },
        { x: -0.6, y: -0.4 },
        { x: -0.3, y: -0.7 },
        { x: -0.1, y: -0.2 }
    ],
    classB: [
        { x: 0.6, y: 0.8 },
        { x: 0.9, y: 0.4 },
        { x: 0.8, y: 0.1 },
        { x: 1.1, y: 0.7 },
        { x: 0.3, y: 0.5 }
    ],
    knnQuery: { x: 0.15, y: 0.05 },
    nbQuery: { x: 0.2, y: 0.1 },
    svmBoundary: { m: 0.35, b: 0.1 },
    kmeansPoints: [
        { x: -1.1, y: 0.8 },
        { x: -0.8, y: 0.6 },
        { x: -1.2, y: 0.3 },
        { x: 0.9, y: 0.7 },
        { x: 0.6, y: 0.4 },
        { x: 1.1, y: 0.2 },
        { x: -0.1, y: -0.9 },
        { x: 0.2, y: -1.1 },
        { x: 0.4, y: -0.6 }
    ],
    kmeansCentroidsA: [
        { x: -0.9, y: 0.7 },
        { x: 0.9, y: 0.5 },
        { x: 0.1, y: -0.9 }
    ],
    kmeansCentroidsB: [
        { x: -1.0, y: 0.6 },
        { x: 0.85, y: 0.45 },
        { x: 0.2, y: -0.85 }
    ],
    pcaPoints: [
        { x: -1.2, y: -0.8 },
        { x: -0.9, y: -0.4 },
        { x: -0.6, y: -0.1 },
        { x: -0.2, y: 0.2 },
        { x: 0.2, y: 0.5 },
        { x: 0.6, y: 0.8 },
        { x: 1.0, y: 1.1 }
    ],
    pcaAxis: { m: 0.8, b: -0.1 }
};

function combination(n, k) {
    if (k < 0 || k > n) return 0;
    const m = Math.min(k, n - k);
    let result = 1;
    for (let i = 1; i <= m; i++) {
        result *= (n - m + i) / i;
    }
    return result;
}

function binomialPmf(n, p) {
    const values = [];
    for (let k = 0; k <= n; k++) {
        const coeff = combination(n, k);
        values.push(coeff * Math.pow(p, k) * Math.pow(1 - p, n - k));
    }
    return values;
}

function getProbabilityMode() {
    return probabilityModes.find(mode => mode.id === probabilityState.modeId) || probabilityModes[0];
}

function drawProbabilityBars(ctx, canvas, mode, theme) {
    const chartLeft = 60;
    const chartBottom = canvas.height - 70;
    const maxHeight = 150;
    const barCount = mode.values.length;
    const totalWidth = canvas.width - chartLeft - 40;
    const gap = Math.min(14, totalWidth / (barCount * 5));
    const barWidth = Math.max(14, (totalWidth - gap * (barCount - 1)) / barCount);
    const colors = [theme.primary, theme.secondary, theme.warning, theme.success, theme.danger, theme.primary];

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft - 20, chartBottom);
    ctx.lineTo(chartLeft + totalWidth + 10, chartBottom);
    ctx.stroke();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Outcome', chartLeft + totalWidth / 2, chartBottom + 44);
    ctx.save();
    ctx.translate(chartLeft - 45, chartBottom - maxHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Probability', 0, 0);
    ctx.restore();

    mode.values.forEach((value, index) => {
        const x = chartLeft + index * (barWidth + gap);
        const height = value * maxHeight;
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(x, chartBottom - height, barWidth, height);
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        const showLabel = barCount <= 7 || index % 2 === 0;
        if (showLabel) {
            ctx.fillText(mode.labels[index], x + barWidth / 2, chartBottom + 18);
        }
        if (barCount <= 7) {
            ctx.fillText(`${Math.round(value * 100)}%`, x + barWidth / 2, chartBottom - height - 10);
        }
    });
}

function drawProbabilityCurve(ctx, canvas, theme) {
    const chartLeft = 50;
    const chartRight = canvas.width - 30;
    const chartTop = 40;
    const chartBottom = canvas.height - 70;
    const centerY = chartBottom;
    const scaleX = (chartRight - chartLeft) / 6;
    const scaleY = 140;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft, centerY);
    ctx.lineTo(chartRight, centerY);
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = theme.primary;
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    for (let x = -3; x <= 3; x += 0.05) {
        const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        const canvasX = chartLeft + (x + 3) * scaleX;
        const canvasY = centerY - y * scaleY;
        if (x === -3) ctx.moveTo(canvasX, canvasY);
        else ctx.lineTo(canvasX, canvasY);
    }
    ctx.lineTo(chartRight, centerY);
    ctx.lineTo(chartLeft, centerY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = -3; x <= 3; x += 0.05) {
        const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        const canvasX = chartLeft + (x + 3) * scaleX;
        const canvasY = centerY - y * scaleY;
        if (x === -3) ctx.moveTo(canvasX, canvasY);
        else ctx.lineTo(canvasX, canvasY);
    }
    ctx.stroke();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Value (x)', (chartLeft + chartRight) / 2, chartBottom + 34);
    ctx.save();
    ctx.translate(chartLeft - 35, centerY - scaleY / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Density', 0, 0);
    ctx.restore();
}

function drawProbabilityBayes(ctx, canvas, theme) {
    const chartLeft = 50;
    const chartBottom = canvas.height - 70;
    const groupGap = 60;
    const barGap = 12;
    const barWidth = 26;
    const maxHeight = 150;

    const prior = [0.6, 0.4];
    const likelihood = [0.2, 0.7];
    const norm = prior[0] * likelihood[0] + prior[1] * likelihood[1];
    const posterior = [prior[0] * likelihood[0] / norm, prior[1] * likelihood[1] / norm];

    const groups = [
        { label: 'Prior', values: prior },
        { label: 'Likelihood', values: likelihood },
        { label: 'Posterior', values: posterior }
    ];

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft - 20, chartBottom);
    ctx.lineTo(canvas.width - 30, chartBottom);
    ctx.stroke();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Hypotheses (H1, H2)', canvas.width / 2, chartBottom + 52);
    ctx.save();
    ctx.translate(chartLeft - 40, chartBottom - maxHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Probability', 0, 0);
    ctx.restore();

    groups.forEach((group, groupIndex) => {
        const groupX = chartLeft + groupIndex * (barWidth * 2 + barGap + groupGap);
        group.values.forEach((value, index) => {
            const x = groupX + index * (barWidth + barGap);
            const height = value * maxHeight;
            ctx.fillStyle = index === 0 ? theme.primary : theme.secondary;
            ctx.fillRect(x, chartBottom - height, barWidth, height);
            ctx.fillStyle = theme.ink;
            ctx.font = 'bold 10px Nunito, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(index === 0 ? 'H1' : 'H2', x + barWidth / 2, chartBottom + 14);
        });

        ctx.fillStyle = theme.inkSoft;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(group.label, groupX + barWidth + barGap / 2, chartBottom + 34);
    });
}

function drawProbabilityAnnotation(ctx, canvas, text, theme) {
    if (!text) return;

    ctx.save();
    ctx.font = 'bold 11px Nunito, Arial';
    const paddingX = 10;
    const paddingY = 6;
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 24;
    const x = 16;
    const y = 14;

    drawRoundedRect(ctx, x, y, boxWidth, boxHeight, 10);
    ctx.fillStyle = theme.panel;
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + paddingX, y + boxHeight / 2 + 1);
    ctx.restore();
}

function drawProbabilityCardBernoulli(ctx, canvas, theme) {
    const rect = {
        x: 26,
        y: 16,
        width: canvas.width - 52,
        height: canvas.height - 40
    };
    drawMiniBars(ctx, rect, [0.35, 0.65], [theme.grid, theme.primary], theme, { gap: 12 });

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('0', rect.x + rect.width * 0.25, rect.y + rect.height + 14);
    ctx.fillText('1', rect.x + rect.width * 0.75, rect.y + rect.height + 14);
}

function drawProbabilityCardBinomial(ctx, canvas, theme) {
    const rect = {
        x: 18,
        y: 16,
        width: canvas.width - 36,
        height: canvas.height - 40
    };
    const values = binomialPmf(6, 0.5);
    drawMiniBars(ctx, rect, values, [theme.primary, theme.secondary, theme.warning, theme.success], theme, { gap: 4 });
}

function drawProbabilityCardCategorical(ctx, canvas, theme) {
    const rect = {
        x: 24,
        y: 16,
        width: canvas.width - 48,
        height: canvas.height - 40
    };
    drawMiniBars(ctx, rect, [0.4, 0.25, 0.2, 0.15], [theme.primary, theme.secondary, theme.warning, theme.success], theme, { gap: 8 });
}

function drawProbabilityCardNormal(ctx, canvas, theme) {
    const left = 16;
    const right = canvas.width - 16;
    const top = 16;
    const bottom = canvas.height - 24;
    const scaleX = (right - left) / 6;
    const scaleY = (bottom - top) * 0.9;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(right, bottom);
    ctx.stroke();

    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = -3; x <= 3; x += 0.05) {
        const y = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
        const canvasX = left + (x + 3) * scaleX;
        const canvasY = bottom - y * scaleY;
        if (x === -3) ctx.moveTo(canvasX, canvasY);
        else ctx.lineTo(canvasX, canvasY);
    }
    ctx.stroke();

    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = 1;
    const meanX = left + 3 * scaleX;
    ctx.beginPath();
    ctx.moveTo(meanX, bottom);
    ctx.lineTo(meanX, top + 6);
    ctx.stroke();
}

function drawProbabilityCardVisuals() {
    const canvases = document.querySelectorAll('.probability-card-canvas');
    if (!canvases.length) return;
    const theme = getThemeColors();
    const drawers = {
        bernoulli: drawProbabilityCardBernoulli,
        binomial: drawProbabilityCardBinomial,
        categorical: drawProbabilityCardCategorical,
        normal: drawProbabilityCardNormal
    };

    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const draw = drawers[canvas.dataset.probabilityCard];
        if (draw) {
            draw(ctx, canvas, theme);
        }
    });
}

function drawProbabilityCanvas() {
    const canvas = document.getElementById('probabilityCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const mode = getProbabilityMode();
    if (mode.type === 'curve') {
        drawProbabilityCurve(ctx, canvas, theme);
    } else if (mode.type === 'bayes') {
        drawProbabilityBayes(ctx, canvas, theme);
    } else {
        let labels = mode.labels;
        let values = mode.values;
        if (mode.type === 'binomial') {
            labels = Array.from({ length: mode.n + 1 }, (_, i) => String(i));
            values = binomialPmf(mode.n, mode.p);
        }
        drawProbabilityBars(ctx, canvas, { labels, values }, theme);
    }
    drawProbabilityAnnotation(ctx, canvas, mode.annotation, theme);
}

function formatProbabilityValue(value) {
    if (!Number.isFinite(value)) return '-';
    if (value === 0) return '0';
    if (value < 0.001) return value.toExponential(2);
    return value.toFixed(3);
}

function formatLogValue(value) {
    if (!Number.isFinite(value)) return '-';
    return value.toFixed(3);
}

function clampProbability(value) {
    return Math.min(0.99, Math.max(0.01, value));
}

function drawProbabilityVennCanvas() {
    const canvas = document.getElementById('probabilityVennCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rect = {
        x: 35,
        y: 25,
        w: canvas.width - 70,
        h: canvas.height - 60
    };

    const radius = Math.min(rect.w, rect.h) * 0.28;
    const centerY = rect.y + rect.h * 0.52;
    const circleA = { x: rect.x + rect.w * 0.42, y: centerY, r: radius };
    const circleB = { x: rect.x + rect.w * 0.62, y: centerY, r: radius };

    const fillCircle = (circle, color, alpha) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const fillIntersection = (circle1, circle2, color, alpha) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(circle1.x, circle1.y, circle1.r, 0, Math.PI * 2);
        ctx.clip();
        ctx.beginPath();
        ctx.arc(circle2.x, circle2.y, circle2.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    const fillComplement = (circle, color, alpha) => {
        ctx.save();
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.rect(rect.x, rect.y, rect.w, rect.h);
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2, true);
        ctx.fill('evenodd');
        ctx.restore();
    };

    ctx.fillStyle = theme.panel;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    const mode = probabilityVennState.mode;
    if (mode === 'event') {
        fillCircle(circleA, theme.primary, 0.24);
    } else if (mode === 'complement') {
        fillComplement(circleA, theme.secondary, 0.18);
    } else if (mode === 'union') {
        fillCircle(circleA, theme.primary, 0.22);
        fillCircle(circleB, theme.secondary, 0.22);
    } else if (mode === 'intersection') {
        fillIntersection(circleA, circleB, theme.primary, 0.32);
    } else if (mode === 'conditional') {
        fillCircle(circleB, theme.secondary, 0.18);
        fillIntersection(circleA, circleB, theme.primary, 0.36);
    } else if (mode === 'bayes') {
        fillCircle(circleA, theme.primary, 0.18);
        fillCircle(circleB, theme.secondary, 0.18);
        fillIntersection(circleA, circleB, theme.warning, 0.4);
    }

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(circleA.x, circleA.y, circleA.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(circleB.x, circleB.y, circleB.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('S', rect.x + 8, rect.y + 18);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 14px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('A', circleA.x - circleA.r * 0.3, circleA.y - circleA.r * 0.4);
    ctx.fillText('B', circleB.x + circleB.r * 0.3, circleB.y - circleB.r * 0.4);
}

function drawHmmCanvas() {
    const canvas = document.getElementById('probabilityHmmCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const steps = 4;
    const paddingX = 45;
    const hiddenY = 70;
    const obsY = 160;
    const stepX = (canvas.width - paddingX * 2) / (steps - 1);
    const radius = 18;
    const obsSize = 26;

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('P(X_t | X_{t-1})', paddingX, 20);
    ctx.fillText('P(E_t | X_t)', paddingX, canvas.height - 12);

    for (let i = 0; i < steps; i += 1) {
        const x = paddingX + i * stepX;
        if (i > 0) {
            drawArrow(ctx, x - stepX + radius, hiddenY, x - radius, hiddenY, theme.axis);
        }
    }

    for (let i = 0; i < steps; i += 1) {
        const x = paddingX + i * stepX;

        ctx.fillStyle = theme.panel;
        ctx.strokeStyle = theme.primary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, hiddenY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`X${i + 1}`, x, hiddenY + 4);

        drawArrow(ctx, x, hiddenY + radius + 2, x, obsY - obsSize / 2 - 2, theme.grid);

        ctx.save();
        ctx.fillStyle = theme.secondary;
        ctx.globalAlpha = 0.18;
        ctx.fillRect(x - obsSize / 2, obsY - obsSize / 2, obsSize, obsSize);
        ctx.restore();

        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - obsSize / 2, obsY - obsSize / 2, obsSize, obsSize);

        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`E${i + 1}`, x, obsY + 4);
    }
}

function drawKalmanCanvas() {
    const canvas = document.getElementById('probabilityKalmanCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const truePath = [1.0, 1.4, 2.0, 2.5, 2.2, 2.8, 3.3, 3.1];
    const measurements = [1.2, 0.9, 2.4, 2.9, 1.9, 3.0, 3.5, 2.8];
    const estimates = [];
    let estimate = measurements[0];
    measurements.forEach((value, index) => {
        estimate = index === 0 ? value : estimate * 0.65 + value * 0.35;
        estimates.push(estimate);
    });

    const allValues = truePath.concat(measurements, estimates);
    const minVal = Math.min(...allValues) - 0.4;
    const maxVal = Math.max(...allValues) + 0.4;

    const padding = { left: 40, right: 20, top: 24, bottom: 30 };
    const width = canvas.width - padding.left - padding.right;
    const height = canvas.height - padding.top - padding.bottom;

    const mapX = index => padding.left + (index / (truePath.length - 1)) * width;
    const mapY = value => padding.top + (maxVal - value) / (maxVal - minVal) * height;

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();

    const drawLine = (values, color, dashed) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.setLineDash(dashed ? [6, 4] : []);
        ctx.beginPath();
        values.forEach((value, index) => {
            const x = mapX(index);
            const y = mapY(value);
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.restore();
    };

    drawLine(truePath, theme.inkSoft, true);
    drawLine(estimates, theme.primary, false);

    ctx.fillStyle = theme.warning;
    measurements.forEach((value, index) => {
        const x = mapX(index);
        const y = mapY(value);
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('state', padding.left - 30, padding.top + 4);
    ctx.textAlign = 'right';
    ctx.fillText('time', canvas.width - padding.right, canvas.height - 8);

    const legendX = padding.left + 10;
    const legendY = padding.top + 6;
    ctx.save();
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillStyle = theme.ink;

    ctx.strokeStyle = theme.inkSoft;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 26, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('true state', legendX + 34, legendY + 4);

    ctx.strokeStyle = theme.primary;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 16);
    ctx.lineTo(legendX + 26, legendY + 16);
    ctx.stroke();
    ctx.fillText('estimate', legendX + 34, legendY + 20);

    ctx.fillStyle = theme.warning;
    ctx.beginPath();
    ctx.arc(legendX + 13, legendY + 32, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = theme.ink;
    ctx.fillText('measurement', legendX + 34, legendY + 36);
    ctx.restore();
}

function setProbabilityVennMode(mode) {
    if (!probabilityVennNotes[mode]) return;
    probabilityVennState.mode = mode;

    const buttons = document.querySelectorAll('[data-venn-mode]');
    buttons.forEach(button => {
        const isActive = button.dataset.vennMode === mode;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const noteEl = document.getElementById('probabilityVennNote');
    if (noteEl) {
        noteEl.innerHTML = probabilityVennNotes[mode];
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([noteEl]);
        }
    }

    drawProbabilityVennCanvas();
}

function setupProbabilityVenn() {
    const buttons = document.querySelectorAll('[data-venn-mode]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setProbabilityVennMode(button.dataset.vennMode));
    });

    setProbabilityVennMode(probabilityVennState.mode);
}

function computeSpamFilter() {
    const words = Array.from(spamFilterState.words);
    let pSpam = 1;
    let pHam = 1;

    words.forEach(word => {
        const data = spamWordData[word];
        if (!data) return;
        pSpam *= data.spam;
        pHam *= data.ham;
    });

    const prior = spamFilterState.prior;
    const spamScore = prior * pSpam;
    const hamScore = (1 - prior) * pHam;
    const denom = spamScore + hamScore || 1;
    const posteriorSpam = spamScore / denom;

    return {
        prior,
        pSpam,
        pHam,
        posteriorSpam
    };
}

function drawSpamFilterCanvas() {
    const canvas = document.getElementById('spamFilterCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const data = computeSpamFilter();
    const groups = [
        { label: 'Prior', values: [data.prior, 1 - data.prior] },
        { label: 'Likelihood', values: [data.pSpam, data.pHam] },
        { label: 'Posterior', values: [data.posteriorSpam, 1 - data.posteriorSpam] }
    ];

    const chartLeft = 50;
    const chartBottom = canvas.height - 70;
    const groupGap = 55;
    const barGap = 12;
    const barWidth = 26;
    const maxHeight = 150;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft - 20, chartBottom);
    ctx.lineTo(canvas.width - 30, chartBottom);
    ctx.stroke();

    groups.forEach((group, groupIndex) => {
        const groupX = chartLeft + groupIndex * (barWidth * 2 + barGap + groupGap);
        const scaled = group.values.map(value => Math.sqrt(Math.max(value, 0)));
        const maxScaled = Math.max(...scaled, 0.0001);

        group.values.forEach((value, index) => {
            const x = groupX + index * (barWidth + barGap);
            const height = (scaled[index] / maxScaled) * maxHeight;
            ctx.fillStyle = index === 0 ? theme.primary : theme.secondary;
            ctx.fillRect(x, chartBottom - height, barWidth, height);

            const label = index === 0 ? 'spam' : 'ham';
            ctx.fillStyle = theme.ink;
            ctx.font = 'bold 10px Nunito, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + barWidth / 2, chartBottom + 14);

            const valueText = group.label === 'Likelihood'
                ? formatProbabilityValue(value)
                : `${Math.round(value * 100)}%`;
            ctx.fillStyle = theme.inkSoft;
            ctx.font = 'bold 10px Nunito, Arial';
            ctx.fillText(valueText, x + barWidth / 2, chartBottom - height - 8);
        });

        ctx.fillStyle = theme.inkSoft;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(group.label, groupX + barWidth + barGap / 2, chartBottom + 34);
    });
}

function updateSpamFilterUI() {
    const data = computeSpamFilter();
    const priorEl = document.getElementById('spamPriorVal');
    const spamLikeEl = document.getElementById('spamLikelihood');
    const hamLikeEl = document.getElementById('hamLikelihood');
    const posteriorEl = document.getElementById('spamPosterior');
    const noteEl = document.getElementById('spamFilterNote');

    if (priorEl) priorEl.textContent = data.prior.toFixed(2);
    if (spamLikeEl) spamLikeEl.textContent = formatProbabilityValue(data.pSpam);
    if (hamLikeEl) hamLikeEl.textContent = formatProbabilityValue(data.pHam);
    if (posteriorEl) posteriorEl.textContent = `${(data.posteriorSpam * 100).toFixed(1)}%`;

    const label = data.posteriorSpam >= 0.5 ? 'spam' : 'ham';
    if (noteEl) {
        noteEl.textContent = `Posterior leans ${label}. Bag-of-words multiplies word likelihoods.`;
    }

    document.querySelectorAll('[data-spam-word]').forEach(button => {
        const word = button.dataset.spamWord;
        const isActive = spamFilterState.words.has(word);
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    drawSpamFilterCanvas();
}

function setupSpamFilter() {
    const priorInput = document.getElementById('spamPrior');
    const buttons = document.querySelectorAll('[data-spam-word]');
    if (!priorInput && !buttons.length) return;

    if (priorInput) {
        priorInput.addEventListener('input', event => {
            spamFilterState.prior = parseFloat(event.target.value);
            updateSpamFilterUI();
        });
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const word = button.dataset.spamWord;
            if (!word) return;
            if (spamFilterState.words.has(word)) {
                spamFilterState.words.delete(word);
            } else {
                spamFilterState.words.add(word);
            }
            updateSpamFilterUI();
        });
    });

    updateSpamFilterUI();
}

function generateSamplePoints() {
    const samples = [];
    for (let i = 0; i < probabilitySampleState.points; i++) {
        samples.push({ x: Math.random(), y: Math.random() });
    }
    probabilitySampleState.samples = samples;
}

function ensureSamplePoints() {
    if (probabilitySampleState.samples.length !== probabilitySampleState.points) {
        generateSamplePoints();
    }
}

function computeSampleSpaceStats() {
    ensureSamplePoints();
    const { a, b, samples } = probabilitySampleState;
    let countA = 0;
    let countB = 0;
    let countAB = 0;

    samples.forEach(sample => {
        const inA = sample.x <= a;
        const inB = sample.y <= b;
        if (inA) countA += 1;
        if (inB) countB += 1;
        if (inA && inB) countAB += 1;
    });

    const total = samples.length || 1;
    const pA = countA / total;
    const pB = countB / total;
    const pAB = countAB / total;
    const pAgivenB = countB ? countAB / countB : 0;

    return { total, countA, countB, countAB, pA, pB, pAB, pAgivenB };
}

function drawSampleSpaceCanvas() {
    const canvas = document.getElementById('sampleSpaceCanvas');
    if (!canvas) return;

    ensureSamplePoints();
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rect = {
        x: 40,
        y: 25,
        w: canvas.width - 70,
        h: canvas.height - 60
    };
    const boundaryX = rect.x + rect.w * probabilitySampleState.a;
    const boundaryY = rect.y + rect.h * probabilitySampleState.b;

    ctx.fillStyle = theme.panel;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = theme.primary;
    ctx.fillRect(rect.x, rect.y, rect.w * probabilitySampleState.a, rect.h);
    ctx.fillStyle = theme.secondary;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h * probabilitySampleState.b);
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = theme.warning;
    ctx.fillRect(rect.x, rect.y, rect.w * probabilitySampleState.a, rect.h * probabilitySampleState.b);
    ctx.restore();

    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(boundaryX, rect.y);
    ctx.lineTo(boundaryX, rect.y + rect.h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rect.x, boundaryY);
    ctx.lineTo(rect.x + rect.w, boundaryY);
    ctx.stroke();

    probabilitySampleState.samples.forEach(sample => {
        const px = rect.x + sample.x * rect.w;
        const py = rect.y + sample.y * rect.h;
        const inA = sample.x <= probabilitySampleState.a;
        const inB = sample.y <= probabilitySampleState.b;

        if (inA && inB) {
            ctx.fillStyle = theme.warning;
        } else if (inA) {
            ctx.fillStyle = theme.primary;
        } else if (inB) {
            ctx.fillStyle = theme.secondary;
        } else {
            ctx.fillStyle = theme.axis;
        }
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('A', rect.x + 8, rect.y + rect.h / 2);
    ctx.textAlign = 'right';
    ctx.fillText('B', rect.x + rect.w - 8, rect.y + 16);
}

function updateSampleSpaceUI() {
    const stats = computeSampleSpaceStats();
    const aLabel = document.getElementById('sampleAVal');
    const bLabel = document.getElementById('sampleBVal');
    const pAEl = document.getElementById('samplePA');
    const pBEl = document.getElementById('samplePB');
    const pABEl = document.getElementById('samplePAB');
    const pAgivenBEl = document.getElementById('samplePAgivenB');
    const noteEl = document.getElementById('sampleSpaceNote');

    if (aLabel) aLabel.textContent = probabilitySampleState.a.toFixed(2);
    if (bLabel) bLabel.textContent = probabilitySampleState.b.toFixed(2);
    if (pAEl) pAEl.textContent = stats.pA.toFixed(2);
    if (pBEl) pBEl.textContent = stats.pB.toFixed(2);
    if (pABEl) pABEl.textContent = stats.pAB.toFixed(2);
    if (pAgivenBEl) pAgivenBEl.textContent = stats.pAgivenB.toFixed(2);
    if (noteEl) {
        noteEl.textContent = `Overlap count: ${stats.countAB} of ${stats.total} points.`;
    }

    drawSampleSpaceCanvas();
}

function setupSampleSpace() {
    const inputA = document.getElementById('sampleA');
    const inputB = document.getElementById('sampleB');
    const reseedButton = document.getElementById('sampleReseed');
    if (!inputA && !inputB && !reseedButton) return;

    if (inputA) {
        inputA.addEventListener('input', event => {
            probabilitySampleState.a = parseFloat(event.target.value);
            updateSampleSpaceUI();
        });
    }
    if (inputB) {
        inputB.addEventListener('input', event => {
            probabilitySampleState.b = parseFloat(event.target.value);
            updateSampleSpaceUI();
        });
    }
    if (reseedButton) {
        reseedButton.addEventListener('click', () => {
            generateSamplePoints();
            updateSampleSpaceUI();
        });
    }

    updateSampleSpaceUI();
}

function getLikelihoodPreset(presetId) {
    return likelihoodPresets.find(preset => preset.id === presetId);
}

function updateLikelihoodPresetButtons(activeId) {
    document.querySelectorAll('[data-ll-preset]').forEach(button => {
        const isActive = button.dataset.llPreset === activeId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function setLikelihoodPreset(presetId) {
    const preset = getLikelihoodPreset(presetId) || likelihoodPresets[0];
    likelihoodPlaygroundState.presetId = preset.id;
    likelihoodPlaygroundState.n = preset.n;
    likelihoodPlaygroundState.k = preset.k;
    likelihoodPlaygroundState.pGuess = clampProbability(preset.k / preset.n);
    updateLikelihoodPlaygroundUI();
}

function computeLogLikelihood(n, k, p) {
    const safeN = Math.max(1, n);
    const safeK = Math.min(Math.max(0, k), safeN);
    const safeP = clampProbability(p);
    return safeK * Math.log(safeP) + (safeN - safeK) * Math.log(1 - safeP);
}

function computeLikelihood(n, k, p) {
    return Math.exp(computeLogLikelihood(n, k, p));
}

function updateLikelihoodTokens() {
    const tokenRow = document.getElementById('llTokens');
    if (!tokenRow) return;

    tokenRow.innerHTML = '';
    const total = likelihoodPlaygroundState.n;
    const successes = likelihoodPlaygroundState.k;
    const failures = total - successes;

    tokenRow.setAttribute('aria-label', `${successes} successes, ${failures} failures`);

    for (let i = 0; i < total; i += 1) {
        const token = document.createElement('span');
        token.className = `ll-token ${i < successes ? 'is-success' : 'is-failure'}`;
        token.textContent = i < successes ? '1' : '0';
        tokenRow.appendChild(token);
    }
}

function drawLikelihoodCanvas() {
    const canvas = document.getElementById('likelihoodCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { n, k, pGuess } = likelihoodPlaygroundState;
    const padding = { left: 44, right: 20, top: 20, bottom: 36 };
    const width = canvas.width - padding.left - padding.right;
    const height = canvas.height - padding.top - padding.bottom;
    if (width <= 0 || height <= 0) return;

    const samples = [];
    for (let i = 1; i < 100; i += 1) {
        const p = i / 100;
        samples.push({ p, logL: computeLogLikelihood(n, k, p) });
    }

    const logValues = samples.map(sample => sample.logL);
    let minLog = Math.min(...logValues);
    let maxLog = Math.max(...logValues);
    const paddingLog = (maxLog - minLog) * 0.08 || 1;
    minLog -= paddingLog;
    maxLog += paddingLog;

    const mapX = p => padding.left + p * width;
    const mapY = logL => padding.top + (maxLog - logL) / (maxLog - minLog) * height;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = theme.grid;
    [0, 0.5, 1].forEach(tick => {
        const x = padding.left + tick * width;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + height);
        ctx.stroke();
    });
    ctx.restore();

    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    samples.forEach((sample, index) => {
        const x = mapX(sample.p);
        const y = mapY(sample.logL);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const pHat = n ? k / n : 0;
    const pHatClamped = clampProbability(pHat);
    const pHatX = mapX(pHatClamped);
    const pHatY = mapY(computeLogLikelihood(n, k, pHatClamped));

    ctx.save();
    ctx.strokeStyle = theme.warning;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pHatX, padding.top);
    ctx.lineTo(pHatX, padding.top + height);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = theme.warning;
    ctx.beginPath();
    ctx.arc(pHatX, pHatY, 4.5, 0, Math.PI * 2);
    ctx.fill();

    const guessX = mapX(pGuess);
    const guessY = mapY(computeLogLikelihood(n, k, pGuess));
    ctx.save();
    ctx.strokeStyle = theme.success;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(guessX, padding.top);
    ctx.lineTo(guessX, padding.top + height);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = theme.success;
    ctx.beginPath();
    ctx.arc(guessX, guessY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'center';
    [0, 0.5, 1].forEach(tick => {
        const x = padding.left + tick * width;
        ctx.fillText(tick.toFixed(1).replace('.0', ''), x, padding.top + height + 18);
    });

    ctx.save();
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.translate(14, padding.top + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('log L(p)', 0, 0);
    ctx.restore();

    ctx.fillStyle = theme.warning;
    ctx.textAlign = 'left';
    ctx.fillText('p_hat', pHatX + 6, padding.top + 12);

    ctx.fillStyle = theme.success;
    ctx.fillText('p guess', guessX + 6, padding.top + 26);
}

function updateLikelihoodPlaygroundUI() {
    likelihoodPlaygroundState.pGuess = clampProbability(likelihoodPlaygroundState.pGuess);
    const trialsInput = document.getElementById('llTrials');
    const successesInput = document.getElementById('llSuccesses');
    const guessInput = document.getElementById('llGuess');

    if (trialsInput) trialsInput.value = likelihoodPlaygroundState.n;
    if (successesInput) {
        successesInput.max = likelihoodPlaygroundState.n;
        successesInput.value = likelihoodPlaygroundState.k;
    }
    if (guessInput) guessInput.value = likelihoodPlaygroundState.pGuess;

    const trialsVal = document.getElementById('llTrialsVal');
    const successesVal = document.getElementById('llSuccessesVal');
    const guessVal = document.getElementById('llGuessVal');
    if (trialsVal) trialsVal.textContent = likelihoodPlaygroundState.n.toString();
    if (successesVal) successesVal.textContent = likelihoodPlaygroundState.k.toString();
    if (guessVal) guessVal.textContent = likelihoodPlaygroundState.pGuess.toFixed(2);

    const observedEl = document.getElementById('llObserved');
    const pHatEl = document.getElementById('llPhat');
    const likelihoodEl = document.getElementById('llLikelihood');
    const logLikelihoodEl = document.getElementById('llLogLikelihood');
    const nllEl = document.getElementById('llNll');

    const pHat = likelihoodPlaygroundState.n
        ? likelihoodPlaygroundState.k / likelihoodPlaygroundState.n
        : 0;
    const logL = computeLogLikelihood(likelihoodPlaygroundState.n, likelihoodPlaygroundState.k, likelihoodPlaygroundState.pGuess);
    const likelihood = computeLikelihood(likelihoodPlaygroundState.n, likelihoodPlaygroundState.k, likelihoodPlaygroundState.pGuess);
    const nll = -logL;

    if (observedEl) observedEl.textContent = `${likelihoodPlaygroundState.k} / ${likelihoodPlaygroundState.n}`;
    if (pHatEl) pHatEl.textContent = pHat.toFixed(2);
    if (likelihoodEl) likelihoodEl.textContent = formatProbabilityValue(likelihood);
    if (logLikelihoodEl) logLikelihoodEl.textContent = formatLogValue(logL);
    if (nllEl) nllEl.textContent = formatLogValue(nll);

    const preset = getLikelihoodPreset(likelihoodPlaygroundState.presetId);
    updateLikelihoodPresetButtons(preset ? preset.id : null);
    const noteEl = document.getElementById('llPresetNote');
    if (noteEl) {
        noteEl.textContent = preset ? preset.note : 'Custom data: adjust the sliders.';
    }

    updateLikelihoodTokens();
    drawLikelihoodCanvas();
}

function setupLikelihoodPlayground() {
    const trialsInput = document.getElementById('llTrials');
    const successesInput = document.getElementById('llSuccesses');
    const guessInput = document.getElementById('llGuess');
    const nextPresetBtn = document.getElementById('llNextPreset');
    const presetButtons = document.querySelectorAll('[data-ll-preset]');

    if (!trialsInput && !successesInput && !guessInput && !presetButtons.length) return;

    if (trialsInput) {
        trialsInput.addEventListener('input', event => {
            likelihoodPlaygroundState.n = Math.max(1, parseInt(event.target.value, 10));
            if (likelihoodPlaygroundState.k > likelihoodPlaygroundState.n) {
                likelihoodPlaygroundState.k = likelihoodPlaygroundState.n;
            }
            likelihoodPlaygroundState.presetId = null;
            updateLikelihoodPlaygroundUI();
        });
    }
    if (successesInput) {
        successesInput.addEventListener('input', event => {
            likelihoodPlaygroundState.k = Math.max(0, parseInt(event.target.value, 10));
            likelihoodPlaygroundState.presetId = null;
            updateLikelihoodPlaygroundUI();
        });
    }
    if (guessInput) {
        guessInput.addEventListener('input', event => {
            likelihoodPlaygroundState.pGuess = clampProbability(parseFloat(event.target.value));
            updateLikelihoodPlaygroundUI();
        });
    }

    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLikelihoodPreset(button.dataset.llPreset);
        });
    });

    if (nextPresetBtn) {
        nextPresetBtn.addEventListener('click', () => {
            const currentIndex = likelihoodPresets.findIndex(preset => preset.id === likelihoodPlaygroundState.presetId);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % likelihoodPresets.length : 0;
            setLikelihoodPreset(likelihoodPresets[nextIndex].id);
        });
    }

    setLikelihoodPreset(likelihoodPlaygroundState.presetId);
}

function setLikelihoodStep(step) {
    const total = likelihoodSteps.length;
    likelihoodStepState.step = ((step % total) + total) % total;
    const stepInfo = likelihoodSteps[likelihoodStepState.step];

    const buttons = document.querySelectorAll('[data-ll-step]');
    buttons.forEach(button => {
        const isActive = parseInt(button.dataset.llStep, 10) === likelihoodStepState.step;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const badgeEl = document.getElementById('llStepBadge');
    const titleEl = document.getElementById('llStepTitle');
    const textEl = document.getElementById('llStepText');
    const formulaEl = document.getElementById('llStepFormula');

    if (badgeEl) {
        badgeEl.textContent = `Step ${likelihoodStepState.step + 1} of ${total}`;
    }
    if (titleEl) titleEl.textContent = stepInfo.title;
    if (textEl) textEl.textContent = stepInfo.text;
    if (formulaEl) {
        formulaEl.innerHTML = stepInfo.formula;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([formulaEl]);
        }
    }
}

function setupLikelihoodStepper() {
    const stepButtons = document.querySelectorAll('[data-ll-step]');
    const prevBtn = document.getElementById('llPrevStep');
    const nextBtn = document.getElementById('llNextStep');
    if (!stepButtons.length && !prevBtn && !nextBtn) return;

    stepButtons.forEach(button => {
        button.addEventListener('click', () => {
            setLikelihoodStep(parseInt(button.dataset.llStep, 10));
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => setLikelihoodStep(likelihoodStepState.step - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => setLikelihoodStep(likelihoodStepState.step + 1));
    }

    setLikelihoodStep(likelihoodStepState.step);
}

function getMlLifecycleSteps() {
    return mlLifecycleSteps[mlLifecycleState.phase] || mlLifecycleSteps.training;
}

function renderMlStepList() {
    const list = document.getElementById('mlStepList');
    if (!list) return;

    const steps = getMlLifecycleSteps();
    list.innerHTML = '';

    steps.forEach((step, index) => {
        const item = document.createElement('li');
        item.classList.add('ml-step-item');
        item.dataset.mlStep = index.toString();
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.innerHTML = `<strong>${step.title}</strong>: ${step.summary}`;
        item.addEventListener('click', () => setMlLifecycleStep(index));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setMlLifecycleStep(index);
            }
        });
        list.appendChild(item);
    });
}

function updateMlLifecycleUI() {
    const steps = getMlLifecycleSteps();
    const step = steps[mlLifecycleState.stepIndex] || steps[0];
    const badgeEl = document.getElementById('mlStepBadge');
    const titleEl = document.getElementById('mlStepTitle');
    const textEl = document.getElementById('mlStepText');

    if (badgeEl) {
        badgeEl.textContent = `Step ${mlLifecycleState.stepIndex + 1} of ${steps.length}`;
    }
    if (titleEl) {
        titleEl.textContent = step.title;
    }
    if (textEl) {
        textEl.textContent = step.text;
    }

    document.querySelectorAll('[data-ml-phase]').forEach(button => {
        const isActive = button.dataset.mlPhase === mlLifecycleState.phase;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const listItems = document.querySelectorAll('.ml-step-list [data-ml-step]');
    listItems.forEach(item => {
        const index = parseInt(item.dataset.mlStep, 10);
        const isActive = index === mlLifecycleState.stepIndex;
        item.classList.toggle('is-active', isActive);
        if (isActive) {
            item.setAttribute('aria-current', 'step');
        } else {
            item.removeAttribute('aria-current');
        }
    });
}

function drawMlLifecycleCanvas() {
    const canvas = document.getElementById('mlLifecycleCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const boxW = 110;
    const boxH = 44;

    const drawBox = (node, isActive) => {
        ctx.fillStyle = isActive ? theme.primary : theme.panel;
        ctx.strokeStyle = isActive ? theme.primary : theme.grid;
        ctx.lineWidth = isActive ? 2.5 : 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(node.x, node.y, boxW, boxH, 10);
        } else {
            ctx.rect(node.x, node.y, boxW, boxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActive ? '#ffffff' : theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = node.label.split(' ');
        if (words.length > 1) {
            const mid = Math.ceil(words.length / 2);
            const line1 = words.slice(0, mid).join(' ');
            const line2 = words.slice(mid).join(' ');
            ctx.fillText(line1, node.x + boxW / 2, node.y + boxH / 2 - 7);
            ctx.fillText(line2, node.x + boxW / 2, node.y + boxH / 2 + 7);
        } else {
            ctx.fillText(node.label, node.x + boxW / 2, node.y + boxH / 2);
        }
    };

    if (mlLifecycleState.phase === 'training') {
        const gapX = 24;
        const gapY = 36;
        const totalWidth = boxW * 3 + gapX * 2;
        const startX = (canvas.width - totalWidth) / 2;
        const startY = 50;

        const nodes = [
            { label: 'Data batch', x: startX, y: startY },
            { label: 'Forward', x: startX + boxW + gapX, y: startY },
            { label: 'Prediction', x: startX + 2 * (boxW + gapX), y: startY },
            { label: 'Loss', x: startX + 2 * (boxW + gapX), y: startY + boxH + gapY },
            { label: 'Backprop', x: startX + boxW + gapX, y: startY + boxH + gapY },
            { label: 'Update', x: startX, y: startY + boxH + gapY }
        ];

        const activeIndex = Math.min(mlLifecycleState.stepIndex, nodes.length - 1);
        const arrowColor = (index) => (index <= activeIndex ? theme.primary : theme.grid);

        drawArrow(ctx, nodes[0].x + boxW, nodes[0].y + boxH / 2, nodes[1].x, nodes[1].y + boxH / 2, arrowColor(0));
        drawArrow(ctx, nodes[1].x + boxW, nodes[1].y + boxH / 2, nodes[2].x, nodes[2].y + boxH / 2, arrowColor(1));
        drawArrow(ctx, nodes[2].x + boxW / 2, nodes[2].y + boxH, nodes[3].x + boxW / 2, nodes[3].y, arrowColor(2));
        drawArrow(ctx, nodes[3].x, nodes[3].y + boxH / 2, nodes[4].x + boxW, nodes[4].y + boxH / 2, arrowColor(3));
        drawArrow(ctx, nodes[4].x, nodes[4].y + boxH / 2, nodes[5].x + boxW, nodes[5].y + boxH / 2, arrowColor(4));
        drawArrow(ctx, nodes[5].x + boxW / 2, nodes[5].y, nodes[0].x + boxW / 2, nodes[0].y + boxH, arrowColor(5));

        nodes.forEach((node, index) => drawBox(node, index === activeIndex));
    } else {
        const gapX = 24;
        const totalWidth = boxW * 4 + gapX * 3;
        const startX = (canvas.width - totalWidth) / 2;
        const startY = 90;

        const nodes = [
            { label: 'Input', x: startX, y: startY },
            { label: 'Model', x: startX + boxW + gapX, y: startY },
            { label: 'Prediction', x: startX + 2 * (boxW + gapX), y: startY },
            { label: 'Decision', x: startX + 3 * (boxW + gapX), y: startY }
        ];

        const activeIndex = Math.min(mlLifecycleState.stepIndex, nodes.length - 1);
        const arrowColor = (index) => (index <= activeIndex ? theme.primary : theme.grid);

        drawArrow(ctx, nodes[0].x + boxW, nodes[0].y + boxH / 2, nodes[1].x, nodes[1].y + boxH / 2, arrowColor(0));
        drawArrow(ctx, nodes[1].x + boxW, nodes[1].y + boxH / 2, nodes[2].x, nodes[2].y + boxH / 2, arrowColor(1));
        drawArrow(ctx, nodes[2].x + boxW, nodes[2].y + boxH / 2, nodes[3].x, nodes[3].y + boxH / 2, arrowColor(2));

        nodes.forEach((node, index) => drawBox(node, index === activeIndex));
    }
}

function setMlLifecyclePhase(phase) {
    if (!mlLifecycleSteps[phase]) return;
    mlLifecycleState.phase = phase;
    mlLifecycleState.stepIndex = 0;
    renderMlStepList();
    updateMlLifecycleUI();
    drawMlLifecycleCanvas();
}

function setMlLifecycleStep(stepIndex) {
    const steps = getMlLifecycleSteps();
    const total = steps.length;
    mlLifecycleState.stepIndex = ((stepIndex % total) + total) % total;
    updateMlLifecycleUI();
    drawMlLifecycleCanvas();
}

function advanceMlLifecycleStep(direction = 1) {
    setMlLifecycleStep(mlLifecycleState.stepIndex + direction);
}

function toggleMlLifecyclePlay() {
    const button = document.getElementById('mlPlaySteps');
    toggleAutoPlay(mlLifecycleState, button, 'Play steps', 'Pause', () => advanceMlLifecycleStep(1), 1400);
}

function setupMlLifecycleStepper() {
    const phaseButtons = document.querySelectorAll('[data-ml-phase]');
    const prevButton = document.getElementById('mlPrevStep');
    const nextButton = document.getElementById('mlNextStep');
    const playButton = document.getElementById('mlPlaySteps');
    const resetButton = document.getElementById('mlReset');

    if (!phaseButtons.length && !prevButton && !nextButton && !playButton && !resetButton) return;

    phaseButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(mlLifecycleState, playButton, 'Play steps');
            setMlLifecyclePhase(button.dataset.mlPhase);
        });
    });

    if (prevButton) prevButton.addEventListener('click', () => advanceMlLifecycleStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceMlLifecycleStep(1));
    if (playButton) playButton.addEventListener('click', toggleMlLifecyclePlay);
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            stopAutoPlay(mlLifecycleState, playButton, 'Play steps');
            setMlLifecycleStep(0);
        });
    }

    renderMlStepList();
    updateMlLifecycleUI();
    drawMlLifecycleCanvas();
}

function getMlAlgorithmConfig() {
    return mlAlgorithmSteps[mlAlgorithmState.algoId] || mlAlgorithmSteps.linear;
}

function renderMlAlgorithmStepList() {
    const list = document.getElementById('mlAlgoStepList');
    if (!list) return;

    const steps = getMlAlgorithmConfig().steps;
    list.innerHTML = '';

    steps.forEach((step, index) => {
        const item = document.createElement('li');
        item.dataset.mlAlgoStep = index.toString();
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.innerHTML = `<strong>${step.title}</strong>: ${step.summary}`;
        item.addEventListener('click', () => setMlAlgorithmStep(index));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setMlAlgorithmStep(index);
            }
        });
        list.appendChild(item);
    });
}

function updateMlAlgorithmUI() {
    const config = getMlAlgorithmConfig();
    const step = config.steps[mlAlgorithmState.stepIndex] || config.steps[0];
    const badgeEl = document.getElementById('mlAlgoStepBadge');
    const titleEl = document.getElementById('mlAlgoStepTitle');
    const textEl = document.getElementById('mlAlgoStepText');

    if (badgeEl) {
        badgeEl.textContent = `Step ${mlAlgorithmState.stepIndex + 1} of ${config.steps.length}`;
    }
    if (titleEl) {
        titleEl.textContent = step.title;
    }
    if (textEl) {
        textEl.textContent = step.text;
    }

    document.querySelectorAll('[data-ml-algo]').forEach(button => {
        const isActive = button.dataset.mlAlgo === mlAlgorithmState.algoId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.ml-step-list [data-ml-algo-step]').forEach(item => {
        const index = parseInt(item.dataset.mlAlgoStep, 10);
        const isActive = index === mlAlgorithmState.stepIndex;
        item.classList.toggle('is-active', isActive);
        if (isActive) {
            item.setAttribute('aria-current', 'step');
        } else {
            item.removeAttribute('aria-current');
        }
    });
}

function drawMlAlgoCanvas() {
    const canvas = document.getElementById('mlAlgoCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const origin = { x: canvas.width / 2, y: canvas.height / 2 + 20 };
    const scale = 80;
    const size = 2;

    const drawPointSet = (points, color, radius = 4, strokeColor = null) => {
        points.forEach(point => {
            const mapped = mapToCanvas(point, origin, scale);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(mapped.x, mapped.y, radius, 0, Math.PI * 2);
            ctx.fill();
            if (strokeColor) {
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        });
    };

    const drawLine = (p1, p2, color, width = 2, dash = []) => {
        const a = mapToCanvas(p1, origin, scale);
        const b = mapToCanvas(p2, origin, scale);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
    };

    const drawBoundary = (m, b, color, width = 2, dash = []) => {
        const x1 = -2.2;
        const x2 = 2.2;
        drawLine({ x: x1, y: m * x1 + b }, { x: x2, y: m * x2 + b }, color, width, dash);
    };

    const drawEllipse = (center, rx, ry, rotation, color, alpha) => {
        const mapped = mapToCanvas(center, origin, scale);
        ctx.save();
        ctx.translate(mapped.x, mapped.y);
        ctx.rotate(-rotation);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * scale, ry * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
    };

    const algoId = mlAlgorithmState.algoId;
    const stepIndex = mlAlgorithmState.stepIndex;

    drawCoordinatePlane(ctx, origin, scale, size, theme);

    if (algoId === 'linear') {
        drawPointSet(mlAlgoData.regression, theme.secondary);
        if (stepIndex >= 1) {
            drawBoundary(0.6, 0.1, theme.primary, 3);
        }
        if (stepIndex >= 2) {
            const x = 1.4;
            const y = 0.6 * x + 0.1;
            drawLine({ x, y: -2 }, { x, y }, theme.inkSoft, 1.5, [6, 6]);
            drawPointSet([{ x, y }], theme.warning, 6);
        }
    } else if (algoId === 'logistic') {
        drawPointSet(mlAlgoData.classA, theme.secondary);
        drawPointSet(mlAlgoData.classB, theme.primary);
        if (stepIndex >= 1) {
            drawBoundary(0.7, 0.0, theme.warning, 3);
        }
        if (stepIndex >= 2) {
            const query = { x: 0.2, y: 0.1 };
            drawPointSet([query], theme.warning, 6);
            const barX = canvas.width - 70;
            const barY = 70;
            const barH = 140;
            const prob = 0.7;
            ctx.fillStyle = theme.grid;
            ctx.fillRect(barX, barY, 20, barH);
            ctx.fillStyle = theme.primary;
            ctx.fillRect(barX, barY + (1 - prob) * barH, 20, prob * barH);
            ctx.fillStyle = theme.inkSoft;
            ctx.font = 'bold 11px Nunito, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('P(B)', barX + 10, barY + barH + 16);
        }
    } else if (algoId === 'knn') {
        drawPointSet(mlAlgoData.classA, theme.secondary);
        drawPointSet(mlAlgoData.classB, theme.primary);
        const query = mlAlgoData.knnQuery;
        const neighbors = [...mlAlgoData.classA, ...mlAlgoData.classB].map(point => ({
            point,
            dist: Math.hypot(point.x - query.x, point.y - query.y)
        })).sort((a, b) => a.dist - b.dist).slice(0, 3);

        if (stepIndex >= 1) {
            ctx.save();
            ctx.strokeStyle = theme.warning;
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            const radius = neighbors[2].dist;
            const mapped = mapToCanvas(query, origin, scale);
            ctx.beginPath();
            ctx.arc(mapped.x, mapped.y, radius * scale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            drawPointSet(neighbors.map(n => n.point), theme.warning, 6, theme.warning);
        }
        const majority = neighbors.filter(n => mlAlgoData.classB.includes(n.point)).length >= 2;
        const queryColor = stepIndex >= 2 ? (majority ? theme.primary : theme.secondary) : theme.ink;
        drawPointSet([query], queryColor, 6);
    } else if (algoId === 'tree') {
        drawPointSet(mlAlgoData.classA, theme.secondary);
        drawPointSet(mlAlgoData.classB, theme.primary);
        if (stepIndex >= 0) {
            drawLine({ x: 0, y: -2 }, { x: 0, y: 2 }, theme.warning, 2);
        }
        if (stepIndex >= 1) {
            drawLine({ x: -2, y: -0.2 }, { x: 0, y: -0.2 }, theme.warning, 2);
        }
        if (stepIndex >= 2) {
            ctx.save();
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = theme.secondary;
            const leftBottom = mapToCanvas({ x: -2, y: -2 }, origin, scale);
            const leftTop = mapToCanvas({ x: 0, y: -0.2 }, origin, scale);
            ctx.fillRect(leftBottom.x, leftTop.y, leftTop.x - leftBottom.x, leftBottom.y - leftTop.y);
            ctx.fillStyle = theme.primary;
            const rightBottom = mapToCanvas({ x: 0, y: -2 }, origin, scale);
            const rightTop = mapToCanvas({ x: 2, y: 2 }, origin, scale);
            ctx.fillRect(rightBottom.x, rightTop.y, rightTop.x - rightBottom.x, rightBottom.y - rightTop.y);
            ctx.restore();
        }
    } else if (algoId === 'forest') {
        drawPointSet(mlAlgoData.classA, theme.secondary);
        drawPointSet(mlAlgoData.classB, theme.primary);
        if (stepIndex >= 1) {
            drawBoundary(0.5, -0.2, theme.inkSoft, 1.5, [4, 4]);
            drawBoundary(0.3, 0.3, theme.inkSoft, 1.5, [4, 4]);
            drawLine({ x: -0.2, y: -2 }, { x: -0.2, y: 2 }, theme.inkSoft, 1.5, [4, 4]);
        }
        if (stepIndex >= 2) {
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = theme.primary;
            const topLeft = mapToCanvas({ x: -2, y: 2 }, origin, scale);
            const bottomRight = mapToCanvas({ x: 2, y: -2 }, origin, scale);
            ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            ctx.restore();
        }
    } else if (algoId === 'svm') {
        drawPointSet(mlAlgoData.classA, theme.secondary);
        drawPointSet(mlAlgoData.classB, theme.primary);
        if (stepIndex >= 1) {
            const { m, b } = mlAlgoData.svmBoundary;
            drawBoundary(m, b, theme.warning, 3);
            drawBoundary(m, b + 0.4, theme.warning, 1.5, [6, 6]);
            drawBoundary(m, b - 0.4, theme.warning, 1.5, [6, 6]);
        }
        if (stepIndex >= 2) {
            const support = [mlAlgoData.classA[2], mlAlgoData.classB[2]];
            drawPointSet(support, 'transparent', 7, theme.warning);
        }
    } else if (algoId === 'bayes') {
        drawPointSet(mlAlgoData.classA, theme.secondary);
        drawPointSet(mlAlgoData.classB, theme.primary);
        if (stepIndex >= 1) {
            drawEllipse({ x: -0.7, y: -0.6 }, 0.7, 0.45, 0.3, theme.secondary, 0.18);
            drawEllipse({ x: 0.7, y: 0.5 }, 0.6, 0.4, -0.3, theme.primary, 0.18);
        }
        if (stepIndex >= 2) {
            drawPointSet([mlAlgoData.nbQuery], theme.warning, 6);
            const barX = canvas.width - 70;
            const barY = 70;
            const barH = 140;
            ctx.fillStyle = theme.grid;
            ctx.fillRect(barX, barY, 20, barH);
            ctx.fillStyle = theme.secondary;
            ctx.fillRect(barX, barY + barH * 0.3, 20, barH * 0.7);
            ctx.fillStyle = theme.primary;
            ctx.fillRect(barX + 24, barY + barH * 0.5, 20, barH * 0.5);
            ctx.fillStyle = theme.inkSoft;
            ctx.font = 'bold 11px Nunito, Arial';
            ctx.textAlign = 'center';
            ctx.fillText('A', barX + 10, barY + barH + 16);
            ctx.fillText('B', barX + 34, barY + barH + 16);
        }
    } else if (algoId === 'kmeans') {
        drawPointSet(mlAlgoData.kmeansPoints, theme.inkSoft, 3);
        if (stepIndex >= 0) {
            drawPointSet(mlAlgoData.kmeansCentroidsA, theme.warning, 7, theme.warning);
        }
        if (stepIndex >= 1) {
            const centroids = mlAlgoData.kmeansCentroidsA;
            const colors = [theme.secondary, theme.primary, theme.warning];
            mlAlgoData.kmeansPoints.forEach(point => {
                const nearestIndex = centroids
                    .map(center => Math.hypot(point.x - center.x, point.y - center.y))
                    .reduce((best, dist, idx, arr) => (dist < arr[best] ? idx : best), 0);
                drawPointSet([point], colors[nearestIndex], 4);
            });
        }
        if (stepIndex >= 2) {
            drawPointSet(mlAlgoData.kmeansCentroidsB, theme.warning, 7, theme.warning);
            mlAlgoData.kmeansCentroidsA.forEach((center, index) => {
                drawLine(center, mlAlgoData.kmeansCentroidsB[index], theme.warning, 1.5, [4, 4]);
            });
        }
    } else if (algoId === 'pca') {
        drawPointSet(mlAlgoData.pcaPoints, theme.secondary);
        if (stepIndex >= 1) {
            drawBoundary(mlAlgoData.pcaAxis.m, mlAlgoData.pcaAxis.b, theme.warning, 3);
        }
        if (stepIndex >= 2) {
            mlAlgoData.pcaPoints.forEach(point => {
                const m = mlAlgoData.pcaAxis.m;
                const b = mlAlgoData.pcaAxis.b;
                const projX = (point.x + m * (point.y - b)) / (1 + m * m);
                const projY = m * projX + b;
                drawLine(point, { x: projX, y: projY }, theme.inkSoft, 1, [4, 4]);
                drawPointSet([{ x: projX, y: projY }], theme.warning, 4);
            });
        }
    }
}

function setMlAlgorithm(algoId) {
    if (!mlAlgorithmSteps[algoId]) return;
    mlAlgorithmState.algoId = algoId;
    mlAlgorithmState.stepIndex = 0;
    renderMlAlgorithmStepList();
    updateMlAlgorithmUI();
    drawMlAlgoCanvas();
}

function setMlAlgorithmStep(stepIndex) {
    const steps = getMlAlgorithmConfig().steps;
    const total = steps.length;
    mlAlgorithmState.stepIndex = ((stepIndex % total) + total) % total;
    updateMlAlgorithmUI();
    drawMlAlgoCanvas();
}

function advanceMlAlgorithmStep(direction = 1) {
    setMlAlgorithmStep(mlAlgorithmState.stepIndex + direction);
}

function toggleMlAlgorithmPlay() {
    const button = document.getElementById('mlAlgoPlay');
    toggleAutoPlay(mlAlgorithmState, button, 'Play steps', 'Pause', () => advanceMlAlgorithmStep(1), 1400);
}

function setupMlAlgorithmStepper() {
    const algoButtons = document.querySelectorAll('[data-ml-algo]');
    const prevButton = document.getElementById('mlAlgoPrev');
    const nextButton = document.getElementById('mlAlgoNext');
    const playButton = document.getElementById('mlAlgoPlay');
    const resetButton = document.getElementById('mlAlgoReset');

    if (!algoButtons.length && !prevButton && !nextButton && !playButton && !resetButton) return;

    algoButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(mlAlgorithmState, playButton, 'Play steps');
            setMlAlgorithm(button.dataset.mlAlgo);
        });
    });

    if (prevButton) prevButton.addEventListener('click', () => advanceMlAlgorithmStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceMlAlgorithmStep(1));
    if (playButton) playButton.addEventListener('click', toggleMlAlgorithmPlay);
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            stopAutoPlay(mlAlgorithmState, playButton, 'Play steps');
            setMlAlgorithmStep(0);
        });
    }

    renderMlAlgorithmStepList();
    updateMlAlgorithmUI();
    drawMlAlgoCanvas();
}

function setupMlMiniVisuals() {
    const visuals = document.querySelectorAll('.ml-mini-vis');
    if (!visuals.length) return;

    visuals.forEach(visual => {
        const card = visual.closest('.ml-card');
        const caption = card ? card.querySelector('.ml-caption') : null;
        const baseText = visual.dataset.mlCaption || (caption ? caption.textContent.trim() : '');
        const altText = visual.dataset.mlCaptionAlt || baseText;
        const hoverText = visual.dataset.mlCaptionHover || baseText;

        if (caption && !caption.textContent.trim() && baseText) {
            caption.textContent = baseText;
        }

        const updateCaption = () => {
            if (!caption) return;
            caption.textContent = visual.classList.contains('is-alt') ? altText : baseText;
        };

        const showHover = () => {
            if (caption && hoverText) {
                caption.textContent = hoverText;
            }
            visual.classList.add('is-hover');
        };

        const hideHover = () => {
            visual.classList.remove('is-hover');
            updateCaption();
        };

        const toggleState = () => {
            if (visual.dataset.mlToggle !== 'true') return;
            visual.classList.toggle('is-alt');
            visual.setAttribute('aria-pressed', visual.classList.contains('is-alt') ? 'true' : 'false');
            updateCaption();
        };

        visual.addEventListener('mouseenter', showHover);
        visual.addEventListener('mouseleave', hideHover);
        visual.addEventListener('focus', showHover);
        visual.addEventListener('blur', hideHover);

        if (visual.dataset.mlToggle === 'true') {
            visual.addEventListener('click', toggleState);
            visual.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleState();
                }
            });
        }

        updateCaption();
    });
}

function setProbabilityMode(modeId) {
    if (!probabilityModes.some(mode => mode.id === modeId)) return;
    probabilityState.modeId = modeId;

    const buttons = document.querySelectorAll('[data-probability-mode]');
    buttons.forEach(button => {
        const isActive = button.dataset.probabilityMode === modeId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    const noteEl = document.getElementById('probabilityNote');
    if (noteEl) {
        noteEl.textContent = getProbabilityMode().note;
    }

    drawProbabilityCanvas();
}

function setupProbabilitySection() {
    const buttons = document.querySelectorAll('[data-probability-mode]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setProbabilityMode(button.dataset.probabilityMode));
    });

    setProbabilityMode(probabilityState.modeId);
}

function setProbabilityDepth(mode) {
    probabilityDepthState.mode = mode;
    const buttons = document.querySelectorAll('[data-probability-depth]');
    const panels = document.querySelectorAll('.probability-mode-panel');

    buttons.forEach(button => {
        const isActive = button.dataset.probabilityDepth === mode;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    panels.forEach(panel => {
        const isActive = panel.dataset.probabilityDepth === mode;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    drawProbabilityCanvas();
    drawProbabilityVennCanvas();
    drawSpamFilterCanvas();
    drawLikelihoodCanvas();
    drawSampleSpaceCanvas();
    drawHmmCanvas();
    drawKalmanCanvas();
}

function setupProbabilityDepth() {
    const buttons = document.querySelectorAll('[data-probability-depth]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setProbabilityDepth(button.dataset.probabilityDepth));
    });

    setProbabilityDepth(probabilityDepthState.mode);
}

function setMatrixBasicOperation(operation) {
    matrixState.operation = operation;
    matrixState.progress = operation === 'step' ? 0 : 1;
    updateMatrixBasicUI();
    drawMatrixCanvas();
}

function setMatrixDeepOperation(operation) {
    matrixDeepState.operation = operation;
    matrixDeepState.progress = operation === 'step' ? 0 : 1;
    updateMatrixDeepUI();
    drawMatrixDeepCanvas();
}

function animateMatrixOperationForState(state, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const config = matrixOperationConfig[state.operation] || matrixOperationConfig.multiply;
    if (!config.animate) return;
    let progress = 0;
    const speed = config.speed || 0.04;
    const animate = () => {
        progress += speed;
        state.progress = Math.min(1, progress);
        if (canvasId === 'matrixDeepCanvas') {
            drawMatrixDeepCanvas();
        } else {
            drawMatrixCanvas();
        }
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    state.progress = 0;
    animate();
}

function animateMatrixBasicOperation() {
    animateMatrixOperationForState(matrixState, 'matrixCanvas');
}

function animateMatrixDeepOperation() {
    animateMatrixOperationForState(matrixDeepState, 'matrixDeepCanvas');
}
function initMatrixCanvas() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '18px Nunito, Arial';
    ctx.fillStyle = theme.ink;
    
    // Draw matrix
    ctx.fillText('Matrix W:', 20, 40);
    ctx.fillText('[0.5  0.3]', 20, 70);
    ctx.fillText('[0.2  0.8]', 20, 100);
    
    ctx.fillText('×', 150, 80);
    
    // Draw vector
    ctx.fillText('Vector x:', 180, 40);
    ctx.fillText('[2]', 180, 70);
    ctx.fillText('[3]', 180, 100);
    
    ctx.fillText('=', 250, 80);
    
    // Draw result
    ctx.fillText('Result:', 280, 40);
    ctx.fillText('[?]', 280, 70);
    ctx.fillText('[?]', 280, 100);
}

function animateMatrixMultiplication() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    
    let step = 0;
    const animate = () => {
        if (step > 100) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '18px Nunito, Arial';
        ctx.fillStyle = theme.ink;
        
        // Draw matrix and vector
        ctx.fillText('Matrix W:', 20, 40);
        ctx.fillText('[0.5  0.3]', 20, 70);
        ctx.fillText('[0.2  0.8]', 20, 100);
        ctx.fillText('×', 150, 80);
        ctx.fillText('Vector x:', 180, 40);
        ctx.fillText('[2]', 180, 70);
        ctx.fillText('[3]', 180, 100);
        ctx.fillText('=', 250, 80);
        ctx.fillText('Result:', 280, 40);
        
        const progress = step / 100;
        
        // Highlight first row calculation
        if (progress < 0.5) {
            ctx.fillStyle = theme.primary;
            ctx.fillRect(18, 55, 120, 25);
            ctx.fillStyle = 'white';
            ctx.fillText('[0.5  0.3]', 20, 70);
            
            ctx.fillStyle = theme.ink;
            ctx.fillText('0.5×2 + 0.3×3 = 1.9', 20, 150);
        }
        
        // Show first result
        if (progress >= 0.5) {
            ctx.fillStyle = theme.success;
            ctx.fillText('[1.9]', 280, 70);
        }
        
        // Highlight second row calculation
        if (progress >= 0.5) {
            ctx.fillStyle = theme.secondary;
            ctx.fillRect(18, 85, 120, 25);
            ctx.fillStyle = 'white';
            ctx.fillText('[0.2  0.8]', 20, 100);
            
            ctx.fillStyle = theme.ink;
            ctx.fillText('0.2×2 + 0.8×3 = 2.8', 20, 180);
        }
        
        // Show second result
        if (progress >= 0.9) {
            ctx.fillStyle = theme.success;
            ctx.fillText('[2.8]', 280, 100);
        }
        
        step += 1;
        requestAnimationFrame(animate);
    };
    
    animate();
}

// ============================================
// Gradient Descent Visualization
// ============================================
let gradientState = { x: 8, path: [] };

function drawGradientCanvas() {
    const canvas = document.getElementById('gradientCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw cost function curve (parabola)
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    const minX = 0, maxX = 10;
    for (let x = minX; x <= maxX; x += 0.1) {
        const canvasX = (x / maxX) * (canvas.width - 40) + 20;
        const cost = Math.pow(x - 5, 2); // Parabola with minimum at x=5
        const canvasY = canvas.height - 20 - (cost / 25) * (canvas.height - 100);
        
        if (x === minX) {
            ctx.moveTo(canvasX, canvasY);
        } else {
            ctx.lineTo(canvasX, canvasY);
        }
    }
    ctx.stroke();
    
    // Draw axes labels
    ctx.fillStyle = theme.ink;
    ctx.font = '14px Nunito, Arial';
    ctx.fillText('Parameter θ', canvas.width / 2 - 40, canvas.height - 5);
    ctx.save();
    ctx.translate(10, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Cost J(θ)', -30, 0);
    ctx.restore();
    
    // Draw path
    ctx.strokeStyle = theme.success;
    ctx.lineWidth = 2;
    ctx.fillStyle = theme.success;
    
    for (let i = 0; i < gradientState.path.length; i++) {
        const x = gradientState.path[i];
        const canvasX = (x / maxX) * (canvas.width - 40) + 20;
        const cost = Math.pow(x - 5, 2);
        const canvasY = canvas.height - 20 - (cost / 25) * (canvas.height - 100);
        
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        if (i > 0) {
            const prevX = gradientState.path[i - 1];
            const prevCanvasX = (prevX / maxX) * (canvas.width - 40) + 20;
            const prevCost = Math.pow(prevX - 5, 2);
            const prevCanvasY = canvas.height - 20 - (prevCost / 25) * (canvas.height - 100);
            
            ctx.beginPath();
            ctx.moveTo(prevCanvasX, prevCanvasY);
            ctx.lineTo(canvasX, canvasY);
            ctx.stroke();
        }
    }
    
    // Draw current position
    if (gradientState.path.length > 0) {
        const x = gradientState.path[gradientState.path.length - 1];
        const canvasX = (x / 10) * (canvas.width - 40) + 20;
        const cost = Math.pow(x - 5, 2);
        const canvasY = canvas.height - 20 - (cost / 25) * (canvas.height - 100);
        
        ctx.fillStyle = theme.danger;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.fillText(`θ = ${x.toFixed(2)}`, canvasX - 30, canvasY - 15);
        ctx.fillText(`Cost = ${cost.toFixed(2)}`, canvasX - 35, canvasY - 30);
    }
}

function runGradientDescent() {
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    
    if (gradientState.path.length === 0) {
        gradientState.path = [gradientState.x];
    }
    
    let steps = 0;
    const maxSteps = 20;
    let lastTime = 0;
    const stepDelay = 300; // ms between steps
    
    const step = (currentTime) => {
        if (steps >= maxSteps || Math.abs(gradientState.x - 5) < 0.01) {
            return;
        }
        
        if (currentTime - lastTime < stepDelay) {
            requestAnimationFrame(step);
            return;
        }
        
        lastTime = currentTime;
        
        // Compute gradient: derivative of (x-5)^2 is 2(x-5)
        const gradient = 2 * (gradientState.x - 5);
        
        // Update parameter
        gradientState.x = gradientState.x - learningRate * gradient;
        gradientState.path.push(gradientState.x);
        
        drawGradientCanvas();
        
        steps++;
        requestAnimationFrame(step);
    };
    
    requestAnimationFrame(step);
}

function resetGradientDescent() {
    gradientState = { x: 8, path: [] };
    drawGradientCanvas();
}

// ============================================
// Activation Functions Visualization
// ============================================
function sigmoid(x) {
    // Numerically stable sigmoid to prevent overflow
    return x > 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x));
}

function relu(x) {
    return Math.max(0, x);
}

function tanh(x) {
    return Math.tanh(x);
}

function drawActivationFunctions() {
    const canvas = document.getElementById('activationCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 40;
    
    // Draw grid (batched for performance)
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -5; i <= 5; i++) {
        // Vertical lines
        ctx.moveTo(centerX + i * scale, 0);
        ctx.lineTo(centerX + i * scale, canvas.height);
        
        // Horizontal lines
        ctx.moveTo(0, centerY + i * scale);
        ctx.lineTo(canvas.width, centerY + i * scale);
    }
    ctx.stroke();
    
    // Draw axes
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = theme.ink;
    ctx.font = '12px Nunito, Arial';
    ctx.fillText('x', canvas.width - 15, centerY - 5);
    ctx.fillText('y', centerX + 5, 15);
    
    const showSigmoid = document.getElementById('showSigmoid').checked;
    const showReLU = document.getElementById('showReLU').checked;
    const showTanh = document.getElementById('showTanh').checked;
    
    ctx.lineWidth = 3;
    
    // Draw functions
    const minX = -5;
    const maxX = 5;
    const step = 0.1;
    
    if (showSigmoid) {
        ctx.strokeStyle = theme.primary;
        ctx.beginPath();
        for (let x = minX; x <= maxX; x += step) {
            const y = sigmoid(x);
            const canvasX = centerX + x * scale;
            const canvasY = centerY - y * scale * 2;
            
            if (x === minX) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        ctx.stroke();
        
        // Label
        ctx.fillStyle = theme.primary;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.fillText('Sigmoid', 10, 30);
    }
    
    if (showReLU) {
        ctx.strokeStyle = theme.success;
        ctx.beginPath();
        for (let x = minX; x <= maxX; x += step) {
            const y = relu(x);
            const canvasX = centerX + x * scale;
            const canvasY = centerY - y * scale;
            
            if (x === minX) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        ctx.stroke();
        
        // Label
        ctx.fillStyle = theme.success;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.fillText('ReLU', 10, 50);
    }
    
    if (showTanh) {
        ctx.strokeStyle = theme.warning;
        ctx.beginPath();
        for (let x = minX; x <= maxX; x += step) {
            const y = tanh(x);
            const canvasX = centerX + x * scale;
            const canvasY = centerY - y * scale * 2;
            
            if (x === minX) {
                ctx.moveTo(canvasX, canvasY);
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        }
        ctx.stroke();
        
        // Label
        ctx.fillStyle = theme.warning;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.fillText('Tanh', 10, 70);
    }
}

// ============================================
// Neural Network Visualization
// ============================================
function drawNeuralNetwork(activations = null) {
    const canvas = document.getElementById('neuralNetCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const layers = [2, 3, 2]; // 2 inputs, 3 hidden, 2 outputs
    const neuronRadius = 20;
    const layerSpacing = 150;
    const neuronSpacing = 80;
    
    // Draw connections first
    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    
    for (let l = 0; l < layers.length - 1; l++) {
        const x1 = 80 + l * layerSpacing;
        const x2 = 80 + (l + 1) * layerSpacing;
        
        for (let i = 0; i < layers[l]; i++) {
            const y1 = 200 - (layers[l] - 1) * neuronSpacing / 2 + i * neuronSpacing;
            
            for (let j = 0; j < layers[l + 1]; j++) {
                const y2 = 200 - (layers[l + 1] - 1) * neuronSpacing / 2 + j * neuronSpacing;
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }
    
    // Draw neurons
    for (let l = 0; l < layers.length; l++) {
        const x = 80 + l * layerSpacing;
        
        for (let i = 0; i < layers[l]; i++) {
            const y = 200 - (layers[l] - 1) * neuronSpacing / 2 + i * neuronSpacing;
            
            // Color based on activation
            const baseColor = l === 0 ? theme.primary : l === layers.length - 1 ? theme.success : theme.secondary;
            if (activations && activations[l]) {
                const activation = activations[l][i];
                ctx.save();
                ctx.globalAlpha = 0.35 + activation * 0.65;
                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
                ctx.fill();
                ctx.restore();
            } else {
                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
            
            ctx.strokeStyle = theme.axis;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Display activation value
            if (activations && activations[l]) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Nunito, Arial';
                ctx.textAlign = 'center';
                ctx.fillText(activations[l][i].toFixed(2), x, y + 4);
            }
        }
        
        // Layer labels
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.textAlign = 'center';
        const label = l === 0 ? 'Input' : l === layers.length - 1 ? 'Output' : 'Hidden';
        ctx.fillText(label, x, 320);
    }
}

function runForwardProp() {
    // Simulate forward propagation
    const input = [0.5, 0.8];
    const weights1 = [[0.2, 0.5, 0.3], [0.4, 0.1, 0.6]];
    const weights2 = [[0.7, 0.3], [0.2, 0.8], [0.5, 0.4]];
    
    let layer = 0;
    const activations = [input, null, null];
    
    const animate = () => {
        if (layer === 0) {
            drawNeuralNetwork(activations);
            layer++;
            setTimeout(animate, 500);
        } else if (layer === 1) {
            // Compute hidden layer
            const hidden = [];
            for (let j = 0; j < 3; j++) {
                let sum = 0;
                for (let i = 0; i < 2; i++) {
                    sum += input[i] * weights1[i][j];
                }
                hidden.push(sigmoid(sum));
            }
            activations[1] = hidden;
            drawNeuralNetwork(activations);
            layer++;
            setTimeout(animate, 500);
        } else if (layer === 2) {
            // Compute output layer
            const output = [];
            for (let j = 0; j < 2; j++) {
                let sum = 0;
                for (let i = 0; i < 3; i++) {
                    sum += activations[1][i] * weights2[i][j];
                }
                output.push(sigmoid(sum));
            }
            activations[2] = output;
            drawNeuralNetwork(activations);
        }
    };
    
    animate();
}

function resetNetwork() {
    drawNeuralNetwork();
}

// ============================================
// Backpropagation Visualization
// ============================================
function drawBackpropNetwork(phase = 0) {
    const canvas = document.getElementById('backpropCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const layers = [2, 2, 1];
    const neuronRadius = 20;
    const layerSpacing = 150;
    const neuronSpacing = 80;
    
    // Draw connections
    ctx.lineWidth = 2;
    
    for (let l = 0; l < layers.length - 1; l++) {
        const x1 = 80 + l * layerSpacing;
        const x2 = 80 + (l + 1) * layerSpacing;
        
        for (let i = 0; i < layers[l]; i++) {
            const y1 = 200 - (layers[l] - 1) * neuronSpacing / 2 + i * neuronSpacing;
            
            for (let j = 0; j < layers[l + 1]; j++) {
                const y2 = 200 - (layers[l + 1] - 1) * neuronSpacing / 2 + j * neuronSpacing;
                
                // Color based on phase
                if (phase === 1) {
                    ctx.strokeStyle = theme.primary; // Forward pass
                } else if (phase === 2 && l >= 1) {
                    ctx.strokeStyle = theme.danger; // Backward pass
                } else {
                    ctx.strokeStyle = theme.grid;
                }
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }
    
    // Draw neurons
    for (let l = 0; l < layers.length; l++) {
        const x = 80 + l * layerSpacing;
        
        for (let i = 0; i < layers[l]; i++) {
            const y = 200 - (layers[l] - 1) * neuronSpacing / 2 + i * neuronSpacing;
            
            if (phase === 1) {
                ctx.fillStyle = theme.primary;
            } else if (phase === 2) {
                ctx.fillStyle = theme.danger;
            } else {
                ctx.fillStyle = l === 0 ? theme.primary : l === layers.length - 1 ? theme.success : theme.secondary;
            }
            
            ctx.beginPath();
            ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = theme.axis;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Layer labels
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 14px Nunito, Arial';
        ctx.textAlign = 'center';
        const label = l === 0 ? 'Input' : l === layers.length - 1 ? 'Output' : 'Hidden';
        ctx.fillText(label, x, 320);
    }
    
    // Phase label
    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 18px Nunito, Arial';
    ctx.textAlign = 'center';
    if (phase === 0) {
        ctx.fillText('Ready', 200, 50);
    } else if (phase === 1) {
        ctx.fillStyle = theme.primary;
        ctx.fillText('Forward Pass ➡', 200, 50);
    } else if (phase === 2) {
        ctx.fillStyle = theme.danger;
        ctx.fillText('⬅ Backward Pass (Computing Gradients)', 200, 50);
    } else if (phase === 3) {
        ctx.fillStyle = theme.success;
        ctx.fillText('✓ Weights Updated', 200, 50);
    }
}

function runBackprop() {
    let phase = 0;
    
    const animate = () => {
        if (phase > 3) return;
        
        drawBackpropNetwork(phase);
        phase++;
        
        if (phase <= 3) {
            setTimeout(animate, 1000);
        }
    };
    
    animate();
}

function resetBackprop() {
    if (typeof setBackpropStep === 'function') {
        setBackpropStep(0);
    } else {
        drawBackpropNetwork(0);
    }
}

const backpropSteps = [
    {
        title: 'Forward pass',
        text: 'Compute predictions from inputs and current weights.'
    },
    {
        title: 'Loss',
        text: 'Compare predictions to targets to measure the error.'
    },
    {
        title: 'Backward pass',
        text: 'Send gradients backward through the network with the chain rule.'
    },
    {
        title: 'Weight update',
        text: 'Apply the learning rate to update weights and reduce loss.'
    }
];

const backpropPhaseMap = [1, 1, 2, 3];

const backpropState = {
    stepIndex: 0,
    timer: null
};

function getBackpropPhase() {
    return backpropPhaseMap[backpropState.stepIndex] ?? 1;
}

function updateBackpropUI() {
    const step = backpropSteps[backpropState.stepIndex];
    const badgeEl = document.getElementById('backpropStepBadge');
    const titleEl = document.getElementById('backpropStepTitle');
    const textEl = document.getElementById('backpropStepText');

    if (badgeEl) {
        badgeEl.textContent = `Step ${backpropState.stepIndex + 1} of ${backpropSteps.length}`;
    }
    if (titleEl) {
        titleEl.textContent = step.title;
    }
    if (textEl) {
        textEl.textContent = step.text;
    }
}

function drawBackpropStep() {
    drawBackpropNetwork(getBackpropPhase());
}

function setBackpropStep(stepIndex) {
    const total = backpropSteps.length;
    backpropState.stepIndex = ((stepIndex % total) + total) % total;
    updateBackpropUI();
    drawBackpropStep();
}

function advanceBackpropStep(direction = 1) {
    setBackpropStep(backpropState.stepIndex + direction);
}

function toggleBackpropPlay() {
    const button = document.getElementById('backpropPlay');
    toggleAutoPlay(backpropState, button, 'Play steps', 'Pause', () => advanceBackpropStep(1), 1200);
}

function setupBackpropStepper() {
    const prevButton = document.getElementById('backpropPrevStep');
    const nextButton = document.getElementById('backpropNextStep');
    const playButton = document.getElementById('backpropPlay');
    const resetButton = document.getElementById('backpropReset');

    if (prevButton) prevButton.addEventListener('click', () => advanceBackpropStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceBackpropStep(1));
    if (playButton) playButton.addEventListener('click', toggleBackpropPlay);
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            stopAutoPlay(backpropState, playButton, 'Play steps');
            setBackpropStep(0);
        });
    }

    setBackpropStep(backpropState.stepIndex);
}

// ============================================
// Neural Network Studio Extensions
// ============================================
function setActiveToggleButtons(buttons, dataKey, activeValue) {
    buttons.forEach(button => {
        const isActive = button.dataset[dataKey] === activeValue;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function stopAutoPlay(state, button, playLabel) {
    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
        if (button) {
            button.textContent = playLabel;
        }
    }
}

function toggleAutoPlay(state, button, playLabel, pauseLabel, stepFn, intervalMs = 1200) {
    if (!button) return;
    if (state.timer) {
        stopAutoPlay(state, button, playLabel);
        return;
    }
    button.textContent = pauseLabel;
    state.timer = setInterval(stepFn, intervalMs);
}

const neuronExamples = [
    {
        id: 'stroke',
        label: 'Stroke detector',
        inputs: [0.9, 0.2, 0.8],
        weights: [0.7, -0.4, 0.6],
        bias: -0.1,
        activation: 'relu',
        note: 'Strong vertical pixels light this neuron up.'
    },
    {
        id: 'curve',
        label: 'Curve detector',
        inputs: [0.4, 0.9, 0.3],
        weights: [0.2, 0.8, -0.3],
        bias: 0.05,
        activation: 'sigmoid',
        note: 'Curvy strokes produce a smooth, moderate output.'
    },
    {
        id: 'noise',
        label: 'Noise filter',
        inputs: [0.1, 0.05, 0.2],
        weights: [0.6, -0.2, 0.4],
        bias: -0.05,
        activation: 'relu',
        note: 'Mostly noise means the neuron stays quiet.'
    }
];

const neuronSteps = [
    {
        title: 'Inputs arrive',
        text: 'Each input feature sends a value into the neuron.'
    },
    {
        title: 'Weighted connections',
        text: 'Weights scale how much each input matters.'
    },
    {
        title: 'Add bias',
        text: 'Sum the weighted inputs, then shift with bias b.'
    },
    {
        title: 'Activation fires',
        text: 'The activation decides how strong the output is.'
    }
];

const neuronState = {
    step: 0,
    exampleId: neuronExamples[0].id,
    timer: null
};

function getNeuronExample() {
    return neuronExamples.find(example => example.id === neuronState.exampleId) || neuronExamples[0];
}

function computeNeuron(example) {
    const weightedSum = example.inputs.reduce((sum, value, index) => {
        return sum + value * example.weights[index];
    }, 0) + example.bias;
    const activationValue = example.activation === 'relu' ? relu(weightedSum) : sigmoid(weightedSum);
    return { weightedSum, activationValue };
}

function updateNeuronUI() {
    const example = getNeuronExample();
    const { weightedSum, activationValue } = computeNeuron(example);
    const stepInfo = neuronSteps[neuronState.step];

    const inputsEl = document.getElementById('neuronInputs');
    const weightsEl = document.getElementById('neuronWeights');
    const weightedSumEl = document.getElementById('neuronWeightedSum');
    const biasEl = document.getElementById('neuronBias');
    const activationEl = document.getElementById('neuronActivation');
    const noteEl = document.getElementById('neuronExampleNote');
    const badgeEl = document.getElementById('neuronStepBadge');
    const titleEl = document.getElementById('neuronStepTitle');
    const textEl = document.getElementById('neuronStepText');

    if (inputsEl) {
        inputsEl.textContent = `[${example.inputs.map(value => value.toFixed(2)).join(', ')}]`;
    }
    if (weightsEl) {
        weightsEl.textContent = `[${example.weights.map(value => value.toFixed(2)).join(', ')}]`;
    }
    if (weightedSumEl) {
        weightedSumEl.textContent = weightedSum.toFixed(2);
    }
    if (biasEl) {
        biasEl.textContent = example.bias.toFixed(2);
    }
    if (activationEl) {
        activationEl.textContent = `${activationValue.toFixed(2)} (${example.activation})`;
    }
    if (noteEl) {
        noteEl.textContent = example.note;
    }
    if (badgeEl) {
        badgeEl.textContent = `Step ${neuronState.step + 1} of ${neuronSteps.length}`;
    }
    if (titleEl) {
        titleEl.textContent = stepInfo.title;
    }
    if (textEl) {
        textEl.textContent = stepInfo.text;
    }
}

function drawNeuronCanvas() {
    const canvas = document.getElementById('neuronCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getNeuronExample();
    const { weightedSum, activationValue } = computeNeuron(example);
    const step = neuronState.step;
    const inputX = 70;
    const neuronX = 210;
    const outputX = 340;
    const neuronY = 160;
    const inputYs = [90, 160, 230];

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 14px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Neuron', canvas.width / 2, 28);

    inputYs.forEach((y, index) => {
        ctx.fillStyle = theme.primary;
        ctx.beginPath();
        ctx.arc(inputX, y, 18, 0, 2 * Math.PI);
        ctx.fill();

        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.fillText(example.inputs[index].toFixed(2), inputX, y + 4);
    });

    inputYs.forEach((y, index) => {
        const color = step >= 1 ? theme.secondary : theme.grid;
        drawArrow(ctx, inputX + 20, y, neuronX - 24, neuronY, color);
        if (step >= 1) {
            const midX = (inputX + neuronX) / 2;
            const midY = (y + neuronY) / 2;
            ctx.fillStyle = theme.ink;
            ctx.font = '12px Nunito, Arial';
            ctx.fillText(`w${index + 1}=${example.weights[index].toFixed(2)}`, midX - 10, midY - 6);
        }
    });

    ctx.save();
    ctx.globalAlpha = step >= 2 ? 1 : 0.7;
    ctx.fillStyle = theme.secondary;
    ctx.beginPath();
    ctx.arc(neuronX, neuronY, 28, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Nunito, Arial';
    ctx.fillText('Σ', neuronX, neuronY + 5);

    if (step >= 2) {
        ctx.fillStyle = theme.ink;
        ctx.font = '12px Nunito, Arial';
        ctx.fillText(`+ b=${example.bias.toFixed(2)}`, neuronX + 48, neuronY - 8);

        const box = { x: neuronX - 34, y: neuronY - 70, width: 68, height: 26 };
        drawRoundedRect(ctx, box.x, box.y, box.width, box.height, 8);
        ctx.fillStyle = theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText(`z=${weightedSum.toFixed(2)}`, neuronX, neuronY - 52);
    }

    if (step >= 3) {
        drawArrow(ctx, neuronX + 30, neuronY, outputX - 20, neuronY, theme.success);
        ctx.fillStyle = theme.success;
        ctx.beginPath();
        ctx.arc(outputX, neuronY, 20, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.fillText(activationValue.toFixed(2), outputX, neuronY + 4);
        ctx.fillStyle = theme.ink;
        ctx.font = '12px Nunito, Arial';
        ctx.fillText('Output a', outputX, neuronY + 34);
    }
}

function setNeuronExample(exampleId) {
    neuronState.exampleId = exampleId;
    neuronState.step = 0;
    updateNeuronUI();
    drawNeuronCanvas();
}

function setNeuronStep(step) {
    const total = neuronSteps.length;
    neuronState.step = ((step % total) + total) % total;
    updateNeuronUI();
    drawNeuronCanvas();
}

function advanceNeuronStep(direction = 1) {
    setNeuronStep(neuronState.step + direction);
}

function toggleNeuronPlay() {
    const button = document.getElementById('neuronPlay');
    toggleAutoPlay(neuronState, button, 'Play loop', 'Pause', () => advanceNeuronStep(1), 1100);
}

function setupNeuronLab() {
    const exampleButtons = document.querySelectorAll('[data-neuron-example]');
    if (!exampleButtons.length) return;

    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(neuronState, document.getElementById('neuronPlay'), 'Play loop');
            setActiveToggleButtons(exampleButtons, 'neuronExample', button.dataset.neuronExample);
            setNeuronExample(button.dataset.neuronExample);
        });
    });

    const prevButton = document.getElementById('neuronPrevStep');
    const nextButton = document.getElementById('neuronNextStep');
    const playButton = document.getElementById('neuronPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceNeuronStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceNeuronStep(1));
    if (playButton) playButton.addEventListener('click', toggleNeuronPlay);

    setActiveToggleButtons(exampleButtons, 'neuronExample', neuronState.exampleId);
    updateNeuronUI();
    drawNeuronCanvas();
}

const digitExamples = [
    {
        id: 'zero',
        label: 0,
        name: 'Digit 0',
        grid: [
            [0, 1, 1, 1, 1, 1, 0],
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
            [1, 1, 0, 0, 0, 1, 1],
            [0, 1, 1, 1, 1, 1, 0]
        ],
        scores: [2.8, -0.3, -1.1, -0.9, -0.7, -0.6, -1.0, -0.8, -0.4, -0.2],
        note: 'A round loop with a hollow center.'
    },
    {
        id: 'three',
        label: 3,
        name: 'Digit 3',
        grid: [
            [0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 0],
            [0, 0, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0]
        ],
        scores: [-0.7, -0.4, -0.3, 2.4, -0.2, -0.5, -0.6, -0.4, 0.9, -0.1],
        note: 'Two curves stacked on the right side.'
    },
    {
        id: 'seven',
        label: 7,
        name: 'Digit 7',
        grid: [
            [1, 1, 1, 1, 1, 1, 1],
            [0, 0, 0, 0, 1, 1, 0],
            [0, 0, 0, 1, 1, 0, 0],
            [0, 0, 1, 1, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0]
        ],
        scores: [-0.8, -0.2, -0.4, -0.5, -0.3, -0.6, -0.7, 2.5, -0.1, 0.4],
        note: 'A strong top bar and diagonal stroke.'
    }
];

const digitSteps = {
    inference: [
        { title: 'Image input', text: 'Pixels arrive as a small grid.' },
        { title: 'Flatten + normalize', text: 'Turn the grid into a vector of numbers.' },
        { title: 'Hidden activations', text: 'Features combine into hidden neurons.' },
        { title: 'Output probabilities', text: 'Scores turn into probabilities for digits 0-9.' }
    ],
    training: [
        { title: 'Image input', text: 'Pixels arrive as a small grid.' },
        { title: 'Flatten + normalize', text: 'Turn the grid into a vector of numbers.' },
        { title: 'Hidden activations', text: 'Features combine into hidden neurons.' },
        { title: 'Output probabilities', text: 'Scores turn into probabilities for digits 0-9.' },
        { title: 'Loss', text: 'Compare the prediction to the true label.' },
        { title: 'Backpropagate', text: 'Send gradients backward through the layers.' },
        { title: 'Update weights', text: 'Adjust weights to reduce the loss next time.' }
    ]
};

const digitLabState = {
    step: 0,
    mode: 'inference',
    exampleId: digitExamples[0].id,
    timer: null
};

function softmax(scores) {
    const max = Math.max(...scores);
    const expScores = scores.map(score => Math.exp(score - max));
    const sum = expScores.reduce((total, value) => total + value, 0);
    return expScores.map(value => value / sum);
}

function getDigitExample() {
    return digitExamples.find(example => example.id === digitLabState.exampleId) || digitExamples[0];
}

function getDigitSteps() {
    return digitSteps[digitLabState.mode] || digitSteps.inference;
}

function updateDigitUI() {
    const example = getDigitExample();
    const probs = softmax(example.scores);
    const maxIndex = probs.indexOf(Math.max(...probs));
    const loss = -Math.log(Math.max(probs[example.label], 1e-6));
    const steps = getDigitSteps();
    const stepInfo = steps[digitLabState.step];

    const targetEl = document.getElementById('digitTarget');
    const predEl = document.getElementById('digitPrediction');
    const lossEl = document.getElementById('digitLoss');
    const noteEl = document.getElementById('digitExampleNote');
    const badgeEl = document.getElementById('digitStepBadge');
    const titleEl = document.getElementById('digitStepTitle');
    const textEl = document.getElementById('digitStepText');

    if (targetEl) {
        targetEl.textContent = example.label.toString();
    }
    if (predEl) {
        predEl.textContent = `${maxIndex} (${probs[maxIndex].toFixed(2)})`;
    }
    if (lossEl) {
        lossEl.textContent = digitLabState.mode === 'training' ? loss.toFixed(2) : 'n/a';
    }
    if (noteEl) {
        noteEl.textContent = example.note;
    }
    if (badgeEl) {
        badgeEl.textContent = `Step ${digitLabState.step + 1} of ${steps.length}`;
    }
    if (titleEl && stepInfo) {
        titleEl.textContent = stepInfo.title;
    }
    if (textEl && stepInfo) {
        textEl.textContent = stepInfo.text;
    }
}

function drawDigitGrid(ctx, grid, startX, startY, cellSize, theme) {
    grid.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
            const x = startX + colIndex * cellSize;
            const y = startY + rowIndex * cellSize;
            ctx.fillStyle = value ? theme.primary : theme.panel;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = theme.grid;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, cellSize, cellSize);
        });
    });
}

function drawOutputBars(ctx, probs, startX, startY, maxWidth, barHeight, gap, theme, highlightIndex, isActive) {
    ctx.font = '11px Nunito, Arial';
    ctx.textAlign = 'left';
    probs.forEach((value, index) => {
        const y = startY + index * (barHeight + gap);
        const barWidth = maxWidth * value;
        const color = index === highlightIndex ? theme.success : theme.secondary;
        ctx.fillStyle = isActive ? color : theme.grid;
        ctx.globalAlpha = isActive ? 0.85 : 0.4;
        ctx.fillRect(startX, y, barWidth, barHeight);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.axis;
        ctx.strokeRect(startX, y, maxWidth, barHeight);
        ctx.fillStyle = theme.ink;
        ctx.fillText(index.toString(), startX - 16, y + barHeight - 2);
    });
}

function drawDigitLab() {
    const canvas = document.getElementById('digitLabCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getDigitExample();
    const probs = softmax(example.scores);
    const maxIndex = probs.indexOf(Math.max(...probs));
    const step = digitLabState.step;
    const mode = digitLabState.mode;

    const gridX = 24;
    const gridY = 70;
    const cellSize = 16;
    const gridWidth = example.grid.length * cellSize;
    const gridHeight = example.grid.length * cellSize;

    drawDigitGrid(ctx, example.grid, gridX, gridY, cellSize, theme);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Input pixels', gridX + gridWidth / 2, gridY - 12);

    const flattenX = gridX + gridWidth + 30;
    const flattenY = 60;
    const flattenWidth = 60;
    const flattenHeight = 200;

    drawArrow(ctx, gridX + gridWidth + 6, gridY + gridHeight / 2, flattenX - 6, flattenY + flattenHeight / 2, step >= 1 ? theme.primary : theme.grid);

    drawRoundedRect(ctx, flattenX, flattenY, flattenWidth, flattenHeight, 10);
    ctx.fillStyle = step >= 1 ? theme.primary : theme.panel;
    ctx.globalAlpha = step >= 1 ? 0.9 : 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('64', flattenX + flattenWidth / 2, flattenY + flattenHeight / 2 - 6);
    ctx.font = '11px Nunito, Arial';
    ctx.fillText('inputs', flattenX + flattenWidth / 2, flattenY + flattenHeight / 2 + 10);

    const hiddenX = flattenX + flattenWidth + 40;
    const hiddenYs = [90, 150, 210];
    hiddenYs.forEach((y, index) => {
        ctx.fillStyle = step >= 2 ? theme.secondary : theme.grid;
        ctx.beginPath();
        ctx.arc(hiddenX, y, 14, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (step >= 2) {
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Nunito, Arial';
            ctx.fillText(`h${index + 1}`, hiddenX, y + 4);
        }
    });

    hiddenYs.forEach(y => {
        drawArrow(ctx, flattenX + flattenWidth + 6, flattenY + flattenHeight / 2, hiddenX - 16, y, step >= 2 ? theme.secondary : theme.grid);
    });

    const barsX = hiddenX + 40;
    const barsY = 70;
    drawOutputBars(ctx, probs, barsX, barsY, 70, 10, 4, theme, maxIndex, step >= 3);

    if (step >= 3) {
        hiddenYs.forEach(y => {
            drawArrow(ctx, hiddenX + 16, y, barsX - 6, barsY + 46, theme.success);
        });
    }

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Output', barsX + 35, barsY - 12);

    if (mode === 'training' && step >= 4) {
        ctx.fillStyle = theme.danger;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText(`Loss: ${(-Math.log(Math.max(probs[example.label], 1e-6))).toFixed(2)}`, barsX + 35, barsY + 130);
    }

    if (mode === 'training' && step >= 5) {
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = theme.danger;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(barsX - 10, barsY + 50);
        ctx.lineTo(hiddenX + 20, hiddenYs[1]);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(hiddenX - 20, hiddenYs[1]);
        ctx.lineTo(flattenX + flattenWidth + 8, flattenY + flattenHeight / 2);
        ctx.stroke();
        ctx.restore();
    }

    if (mode === 'training' && step >= 6) {
        ctx.fillStyle = theme.warning;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Update weights', hiddenX, 270);
    }
}

function setDigitExample(exampleId) {
    digitLabState.exampleId = exampleId;
    digitLabState.step = 0;
    updateDigitUI();
    drawDigitLab();
}

function setDigitMode(mode) {
    digitLabState.mode = mode;
    digitLabState.step = 0;
    updateDigitUI();
    drawDigitLab();
}

function setDigitStep(step) {
    const steps = getDigitSteps();
    const total = steps.length;
    digitLabState.step = ((step % total) + total) % total;
    updateDigitUI();
    drawDigitLab();
}

function advanceDigitStep(direction = 1) {
    setDigitStep(digitLabState.step + direction);
}

function toggleDigitPlay() {
    const button = document.getElementById('digitPlay');
    toggleAutoPlay(digitLabState, button, 'Play loop', 'Pause', () => advanceDigitStep(1), 1200);
}

function setupDigitLab() {
    const exampleButtons = document.querySelectorAll('[data-digit-example]');
    const modeButtons = document.querySelectorAll('[data-digit-mode]');
    if (!exampleButtons.length) return;

    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(digitLabState, document.getElementById('digitPlay'), 'Play loop');
            setActiveToggleButtons(exampleButtons, 'digitExample', button.dataset.digitExample);
            setDigitExample(button.dataset.digitExample);
        });
    });

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(digitLabState, document.getElementById('digitPlay'), 'Play loop');
            setActiveToggleButtons(modeButtons, 'digitMode', button.dataset.digitMode);
            setDigitMode(button.dataset.digitMode);
        });
    });

    const prevButton = document.getElementById('digitPrevStep');
    const nextButton = document.getElementById('digitNextStep');
    const playButton = document.getElementById('digitPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceDigitStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceDigitStep(1));
    if (playButton) playButton.addEventListener('click', toggleDigitPlay);

    setActiveToggleButtons(exampleButtons, 'digitExample', digitLabState.exampleId);
    setActiveToggleButtons(modeButtons, 'digitMode', digitLabState.mode);
    updateDigitUI();
    drawDigitLab();
}

const deepNetState = {
    depth: 5,
    progress: 0,
    animating: false,
    rafId: null
};

function drawDeepNetwork(progress = deepNetState.progress) {
    const canvas = document.getElementById('deepNetCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const depth = deepNetState.depth;
    const layerCount = Math.max(depth, 3);
    const layerSpacing = (canvas.width - 120) / (layerCount - 1);
    const xStart = 60;
    const nodeYs = [90, 160, 230];
    const activeFloat = progress * (layerCount - 1);
    const activeLayer = Math.floor(activeFloat);

    for (let layer = 0; layer < layerCount - 1; layer++) {
        const x1 = xStart + layer * layerSpacing;
        const x2 = xStart + (layer + 1) * layerSpacing;
        nodeYs.forEach((y1) => {
            nodeYs.forEach((y2) => {
                if (layer < activeLayer) {
                    ctx.strokeStyle = theme.primary;
                } else if (layer === activeLayer) {
                    ctx.strokeStyle = theme.warning;
                } else {
                    ctx.strokeStyle = theme.grid;
                }
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            });
        });
    }

    for (let layer = 0; layer < layerCount; layer++) {
        const x = xStart + layer * layerSpacing;
        const isActive = layer <= activeLayer;
        nodeYs.forEach((y) => {
            ctx.fillStyle = isActive ? theme.secondary : theme.grid;
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = theme.axis;
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        let label = 'Hidden';
        if (layer === 0) label = 'Input';
        if (layer === layerCount - 1) label = 'Output';
        ctx.fillText(label, x, 270);
    }

    const signalX = xStart + progress * (layerCount - 1) * layerSpacing;
    ctx.fillStyle = theme.success;
    ctx.beginPath();
    ctx.arc(signalX, 160, 10, 0, 2 * Math.PI);
    ctx.fill();
}

function setDeepDepth(depth) {
    deepNetState.depth = depth;
    const labelEl = document.getElementById('deepDepthVal');
    if (labelEl) {
        labelEl.textContent = depth.toString();
    }
    drawDeepNetwork();
}

function runDeepNetwork() {
    if (deepNetState.animating) return;
    deepNetState.animating = true;
    const start = performance.now();
    const duration = 1600;

    const animate = (time) => {
        const progress = Math.min((time - start) / duration, 1);
        deepNetState.progress = progress;
        drawDeepNetwork(progress);
        if (progress < 1) {
            deepNetState.rafId = requestAnimationFrame(animate);
        } else {
            deepNetState.animating = false;
            deepNetState.progress = 0;
            drawDeepNetwork();
        }
    };
    deepNetState.rafId = requestAnimationFrame(animate);
}

function setupDeepNetwork() {
    const slider = document.getElementById('deepDepth');
    const runButton = document.getElementById('deepRun');
    if (!slider) return;

    slider.addEventListener('input', () => setDeepDepth(parseInt(slider.value, 10)));
    if (runButton) runButton.addEventListener('click', runDeepNetwork);
    setDeepDepth(parseInt(slider.value, 10));
}

const cnnExamples = [
    {
        id: 'edge',
        label: 'Edge detector',
        grid: [
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1],
            [0, 0, 0, 1, 1, 1]
        ],
        kernel: [
            [1, 0, -1],
            [1, 0, -1],
            [1, 0, -1]
        ],
        note: 'Detects vertical edges across the image.'
    },
    {
        id: 'corner',
        label: 'Corner detector',
        grid: [
            [1, 1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0]
        ],
        kernel: [
            [1, 1, 0],
            [1, 0, -1],
            [0, -1, -1]
        ],
        note: 'Highlights corners where two edges meet.'
    },
    {
        id: 'diagonal',
        label: 'Diagonal stroke',
        grid: [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0],
            [0, 0, 1, 0, 0, 0],
            [0, 0, 0, 1, 0, 0],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ],
        kernel: [
            [1, 0, -1],
            [0, 1, 0],
            [-1, 0, 1]
        ],
        note: 'Responds to diagonal strokes and slants.'
    }
];

function convolve2d(grid, kernel) {
    const output = [];
    const rows = grid.length - kernel.length + 1;
    const cols = grid[0].length - kernel[0].length + 1;
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            let sum = 0;
            for (let kr = 0; kr < kernel.length; kr++) {
                for (let kc = 0; kc < kernel[0].length; kc++) {
                    sum += grid[r + kr][c + kc] * kernel[kr][kc];
                }
            }
            row.push(sum);
        }
        output.push(row);
    }
    return output;
}

cnnExamples.forEach(example => {
    example.output = convolve2d(example.grid, example.kernel);
});

const cnnState = {
    exampleId: cnnExamples[0].id,
    stepIndex: 0,
    timer: null
};

function getCnnExample() {
    return cnnExamples.find(example => example.id === cnnState.exampleId) || cnnExamples[0];
}

function getCnnPosition(example) {
    const cols = example.output[0].length;
    const row = Math.floor(cnnState.stepIndex / cols);
    const col = cnnState.stepIndex % cols;
    return { row, col };
}

function updateCnnUI() {
    const example = getCnnExample();
    const { row, col } = getCnnPosition(example);
    const total = example.output.length * example.output[0].length;
    const outputValue = example.output[row][col];

    const noteEl = document.getElementById('cnnExampleNote');
    const patchEl = document.getElementById('cnnPatch');
    const valueEl = document.getElementById('cnnOutputValue');
    const mathNoteEl = document.getElementById('cnnMathNote');
    const badgeEl = document.getElementById('cnnStepBadge');
    const titleEl = document.getElementById('cnnStepTitle');
    const textEl = document.getElementById('cnnStepText');

    if (noteEl) noteEl.textContent = example.note;
    if (patchEl) patchEl.textContent = `(${row + 1}, ${col + 1})`;
    if (valueEl) valueEl.textContent = outputValue.toFixed(2);
    if (badgeEl) badgeEl.textContent = `Step ${cnnState.stepIndex + 1} of ${total}`;
    if (titleEl) titleEl.textContent = `Filter at row ${row + 1}, col ${col + 1}`;
    if (textEl) textEl.textContent = 'Multiply the 3x3 patch by the filter, then sum to get one output cell.';
    if (mathNoteEl) {
        const kernel = example.kernel;
        const terms = [];
        let sum = 0;
        for (let r = 0; r < kernel.length; r++) {
            for (let c = 0; c < kernel[0].length; c++) {
                const value = example.grid[row + r][col + c];
                const weight = kernel[r][c];
                sum += value * weight;
                terms.push(`${value}*${weight}`);
            }
        }
        mathNoteEl.textContent = `Dot product: ${terms.join(' + ')} = ${sum.toFixed(2)}`;
    }
}

function drawCnnGrid(ctx, grid, startX, startY, cellSize, theme, highlight) {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            const value = grid[r][c];
            const x = startX + c * cellSize;
            const y = startY + r * cellSize;
            ctx.fillStyle = value ? theme.primary : theme.panel;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = theme.grid;
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    }

    if (highlight) {
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 3;
        ctx.strokeRect(highlight.x, highlight.y, highlight.size, highlight.size);
    }
}

function drawCnnOutput(ctx, output, startX, startY, cellSize, theme, highlightCell) {
    const maxAbs = Math.max(...output.flat().map(value => Math.abs(value))) || 1;
    for (let r = 0; r < output.length; r++) {
        for (let c = 0; c < output[0].length; c++) {
            const value = output[r][c];
            const x = startX + c * cellSize;
            const y = startY + r * cellSize;
            const intensity = Math.min(Math.abs(value) / maxAbs, 1);
            ctx.fillStyle = value >= 0 ? theme.success : theme.danger;
            ctx.globalAlpha = 0.2 + intensity * 0.7;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = theme.axis;
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    }

    if (highlightCell) {
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 3;
        ctx.strokeRect(highlightCell.x, highlightCell.y, cellSize, cellSize);
    }
}

function drawKernel(ctx, kernel, startX, startY, cellSize, theme) {
    ctx.font = '11px Nunito, Arial';
    ctx.textAlign = 'center';
    for (let r = 0; r < kernel.length; r++) {
        for (let c = 0; c < kernel[0].length; c++) {
            const value = kernel[r][c];
            const x = startX + c * cellSize;
            const y = startY + r * cellSize;
            ctx.fillStyle = theme.panel;
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = theme.axis;
            ctx.strokeRect(x, y, cellSize, cellSize);
            ctx.fillStyle = theme.ink;
            ctx.fillText(value.toFixed(0), x + cellSize / 2, y + cellSize / 2 + 4);
        }
    }
}

function drawCnnCanvas() {
    const canvas = document.getElementById('cnnCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getCnnExample();
    const { row, col } = getCnnPosition(example);
    const cellSize = 20;
    const inputX = 20;
    const inputY = 70;
    const kernelSize = example.kernel.length * cellSize;

    const highlight = {
        x: inputX + col * cellSize,
        y: inputY + row * cellSize,
        size: kernelSize
    };

    drawCnnGrid(ctx, example.grid, inputX, inputY, cellSize, theme, highlight);

    const kernelX = inputX + example.grid[0].length * cellSize + 18;
    const kernelY = inputY;
    drawKernel(ctx, example.kernel, kernelX, kernelY, cellSize - 2, theme);

    const outputX = kernelX + kernelSize + 24;
    const outputY = inputY;
    const outputHighlight = {
        x: outputX + col * cellSize,
        y: outputY + row * cellSize
    };
    drawCnnOutput(ctx, example.output, outputX, outputY, cellSize, theme, outputHighlight);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Input', inputX + (example.grid[0].length * cellSize) / 2, inputY - 10);
    ctx.fillText('Kernel', kernelX + kernelSize / 2, kernelY - 10);
    ctx.fillText('Output', outputX + (example.output[0].length * cellSize) / 2, outputY - 10);
}

function setCnnExample(exampleId) {
    cnnState.exampleId = exampleId;
    cnnState.stepIndex = 0;
    updateCnnUI();
    drawCnnCanvas();
}

function setCnnStep(stepIndex) {
    const example = getCnnExample();
    const total = example.output.length * example.output[0].length;
    cnnState.stepIndex = ((stepIndex % total) + total) % total;
    updateCnnUI();
    drawCnnCanvas();
}

function advanceCnnStep(direction = 1) {
    setCnnStep(cnnState.stepIndex + direction);
}

function toggleCnnPlay() {
    const button = document.getElementById('cnnPlay');
    toggleAutoPlay(cnnState, button, 'Play sweep', 'Pause', () => advanceCnnStep(1), 900);
}

function setupCnnLab() {
    const exampleButtons = document.querySelectorAll('[data-cnn-example]');
    if (!exampleButtons.length) return;

    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(cnnState, document.getElementById('cnnPlay'), 'Play sweep');
            setActiveToggleButtons(exampleButtons, 'cnnExample', button.dataset.cnnExample);
            setCnnExample(button.dataset.cnnExample);
        });
    });

    const prevButton = document.getElementById('cnnPrevStep');
    const nextButton = document.getElementById('cnnNextStep');
    const playButton = document.getElementById('cnnPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceCnnStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceCnnStep(1));
    if (playButton) playButton.addEventListener('click', toggleCnnPlay);

    setActiveToggleButtons(exampleButtons, 'cnnExample', cnnState.exampleId);
    updateCnnUI();
    drawCnnCanvas();
}

const rnnExamples = [
    {
        id: 'sentence',
        label: 'Next word prediction',
        tokens: ['The', 'cat', 'sat', 'down'],
        outputs: ['cat', 'sat', 'down', '.'],
        inputs: [0.4, 0.9, 0.3, 0.7],
        note: 'Each hidden state carries context to the next word.'
    },
    {
        id: 'weather',
        label: 'Forecast',
        tokens: ['Temp', 'rises', 'then', 'drops'],
        outputs: ['rises', 'then', 'drops', 'tomorrow'],
        inputs: [0.6, 0.7, 0.4, 0.8],
        note: 'Sequence trends show up in the hidden state.'
    },
    {
        id: 'music',
        label: 'Music pattern',
        tokens: ['C', 'D', 'E', 'G'],
        outputs: ['D', 'E', 'G', 'A'],
        inputs: [0.2, 0.4, 0.6, 0.8],
        note: 'Rhythm and melody are learned across steps.'
    }
];

const rnnMathConfig = {
    wX: 0.8,
    wH: 0.9,
    b: -0.1
};

function computeRnnTrace(inputs, config) {
    const pre = [];
    const hidden = [];
    let hPrev = 0;
    inputs.forEach(value => {
        const z = config.wX * value + config.wH * hPrev + config.b;
        const h = Math.tanh(z);
        pre.push(z);
        hidden.push(h);
        hPrev = h;
    });
    return { pre, hidden };
}

rnnExamples.forEach(example => {
    example.math = computeRnnTrace(example.inputs, rnnMathConfig);
});

const rnnState = {
    exampleId: rnnExamples[0].id,
    stepIndex: 0,
    timer: null
};

function getRnnExample() {
    return rnnExamples.find(example => example.id === rnnState.exampleId) || rnnExamples[0];
}

function getRnnHiddenValues(example) {
    return example.math?.hidden || example.hidden || [];
}

function updateRnnUI() {
    const example = getRnnExample();
    const step = rnnState.stepIndex;
    const total = example.tokens.length;
    const inputValues = example.inputs || [];
    const hiddenValues = getRnnHiddenValues(example);
    const inputValue = inputValues[step] ?? 0;
    const prevHidden = step === 0 ? 0 : hiddenValues[step - 1] ?? 0;
    const hiddenValue = hiddenValues[step] ?? 0;
    const tokenEl = document.getElementById('rnnToken');
    const hiddenEl = document.getElementById('rnnHidden');
    const inputEl = document.getElementById('rnnInputValue');
    const prevHiddenEl = document.getElementById('rnnPrevHidden');
    const outputEl = document.getElementById('rnnOutput');
    const noteEl = document.getElementById('rnnExampleNote');
    const mathNoteEl = document.getElementById('rnnMathNote');
    const badgeEl = document.getElementById('rnnStepBadge');
    const titleEl = document.getElementById('rnnStepTitle');
    const textEl = document.getElementById('rnnStepText');

    if (tokenEl) tokenEl.textContent = example.tokens[step];
    if (inputEl) inputEl.textContent = formatNumber(inputValue, 2);
    if (prevHiddenEl) prevHiddenEl.textContent = formatNumber(prevHidden, 2);
    if (hiddenEl) hiddenEl.textContent = formatNumber(hiddenValue, 2);
    if (outputEl) outputEl.textContent = example.outputs[step];
    if (noteEl) noteEl.textContent = example.note;
    if (badgeEl) badgeEl.textContent = `Step ${step + 1} of ${total}`;
    if (titleEl) titleEl.textContent = `Time step ${step + 1}`;
    if (textEl) textEl.textContent = 'Input -> hidden state -> output at this time step.';
    if (mathNoteEl) {
        const bias = rnnMathConfig.b;
        const biasTerm = bias >= 0 ? `+ ${formatNumber(bias, 2)}` : `- ${formatNumber(Math.abs(bias), 2)}`;
        mathNoteEl.textContent = `Scalar demo: tanh(${formatNumber(rnnMathConfig.wX, 2)}*${formatNumber(inputValue, 2)} + ${formatNumber(rnnMathConfig.wH, 2)}*${formatNumber(prevHidden, 2)} ${biasTerm}) = ${formatNumber(hiddenValue, 2)}`;
    }
}

function drawRnnCanvas() {
    const canvas = document.getElementById('rnnCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getRnnExample();
    const hiddenValues = getRnnHiddenValues(example);
    const count = example.tokens.length;
    const gap = 12;
    const maxWidth = canvas.width - 40;
    const tokenWidth = Math.min(70, (maxWidth - gap * (count - 1)) / count);
    const tokenHeight = 30;
    const totalWidth = tokenWidth * count + gap * (count - 1);
    const startX = (canvas.width - totalWidth) / 2;
    const tokenY = 70;
    const hiddenY = 190;

    example.tokens.forEach((token, index) => {
        const x = startX + index * (tokenWidth + gap);
        const isActive = index === rnnState.stepIndex;
        drawRoundedRect(ctx, x, tokenY, tokenWidth, tokenHeight, 8);
        ctx.fillStyle = isActive ? theme.primary : theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = isActive ? 'white' : theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(token, x + tokenWidth / 2, tokenY + 20);

        drawArrow(ctx, x + tokenWidth / 2, tokenY + tokenHeight, x + tokenWidth / 2, hiddenY - 16, index <= rnnState.stepIndex ? theme.primary : theme.grid);
    });

    hiddenValues.forEach((value, index) => {
        const x = startX + index * (tokenWidth + gap) + tokenWidth / 2;
        const isActive = index === rnnState.stepIndex;
        ctx.fillStyle = isActive ? theme.secondary : theme.grid;
        ctx.beginPath();
        ctx.arc(x, hiddenY, 16, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = isActive ? 'white' : theme.ink;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.fillText(formatNumber(hiddenValues[index] ?? 0, 2), x, hiddenY + 4);

        if (index < hiddenValues.length - 1) {
            const nextX = startX + (index + 1) * (tokenWidth + gap) + tokenWidth / 2;
            drawArrow(ctx, x + 16, hiddenY, nextX - 16, hiddenY, index < rnnState.stepIndex ? theme.secondary : theme.grid);
        }
    });
}

function setRnnExample(exampleId) {
    rnnState.exampleId = exampleId;
    rnnState.stepIndex = 0;
    updateRnnUI();
    drawRnnCanvas();
}

function setRnnStep(stepIndex) {
    const example = getRnnExample();
    const total = example.tokens.length;
    rnnState.stepIndex = ((stepIndex % total) + total) % total;
    updateRnnUI();
    drawRnnCanvas();
}

function advanceRnnStep(direction = 1) {
    setRnnStep(rnnState.stepIndex + direction);
}

function toggleRnnPlay() {
    const button = document.getElementById('rnnPlay');
    toggleAutoPlay(rnnState, button, 'Play sequence', 'Pause', () => advanceRnnStep(1), 1100);
}

function setupRnnLab() {
    const exampleButtons = document.querySelectorAll('[data-rnn-example]');
    if (!exampleButtons.length) return;

    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(rnnState, document.getElementById('rnnPlay'), 'Play sequence');
            setActiveToggleButtons(exampleButtons, 'rnnExample', button.dataset.rnnExample);
            setRnnExample(button.dataset.rnnExample);
        });
    });

    const prevButton = document.getElementById('rnnPrevStep');
    const nextButton = document.getElementById('rnnNextStep');
    const playButton = document.getElementById('rnnPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceRnnStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceRnnStep(1));
    if (playButton) playButton.addEventListener('click', toggleRnnPlay);

    setActiveToggleButtons(exampleButtons, 'rnnExample', rnnState.exampleId);
    updateRnnUI();
    drawRnnCanvas();
}

const lstmExamples = [
    {
        id: 'story',
        label: 'Story clue',
        token: 'was',
        memoryBefore: 0.8,
        forget: 0.3,
        input: 0.7,
        candidate: 0.9,
        output: 0.6,
        note: 'Keep the subject while reading a long clause.'
    },
    {
        id: 'quotes',
        label: 'Quote tracking',
        token: '"',
        memoryBefore: 0.4,
        forget: 0.1,
        input: 0.9,
        candidate: 0.8,
        output: 0.5,
        note: 'Remember the open quote until it closes.'
    },
    {
        id: 'sensor',
        label: 'Sensor drift',
        token: 'pulse',
        memoryBefore: 0.6,
        forget: 0.6,
        input: 0.4,
        candidate: 0.5,
        output: 0.4,
        note: 'Blend slow trends with new readings.'
    }
];

const lstmSteps = [
    { title: 'Forget gate', text: 'Decide what memory to keep or erase.' },
    { title: 'Input gate', text: 'Choose what new info to write.' },
    { title: 'Cell update', text: 'Combine old memory and new candidate.' },
    { title: 'Output gate', text: 'Expose the right part as output.' }
];

const lstmState = {
    exampleId: lstmExamples[0].id,
    stepIndex: 0,
    timer: null
};

function getLstmExample() {
    return lstmExamples.find(example => example.id === lstmState.exampleId) || lstmExamples[0];
}

function getLstmMemoryAfter(example) {
    return example.memoryBefore * example.forget + example.input * example.candidate;
}

function updateLstmUI() {
    const example = getLstmExample();
    const step = lstmState.stepIndex;
    const total = lstmSteps.length;
    const memoryAfter = getLstmMemoryAfter(example);
    const hiddenOutput = example.output * Math.tanh(memoryAfter);
    const memoryBeforeEl = document.getElementById('lstmMemoryBefore');
    const forgetEl = document.getElementById('lstmForgetGate');
    const inputEl = document.getElementById('lstmInputGate');
    const outputEl = document.getElementById('lstmOutputGate');
    const candidateEl = document.getElementById('lstmCandidate');
    const memoryAfterEl = document.getElementById('lstmMemoryAfter');
    const hiddenEl = document.getElementById('lstmHiddenOutput');
    const noteEl = document.getElementById('lstmExampleNote');
    const mathNoteEl = document.getElementById('lstmMathNote');
    const badgeEl = document.getElementById('lstmStepBadge');
    const titleEl = document.getElementById('lstmStepTitle');
    const textEl = document.getElementById('lstmStepText');

    if (memoryBeforeEl) memoryBeforeEl.textContent = formatNumber(example.memoryBefore, 2);
    if (forgetEl) forgetEl.textContent = formatNumber(example.forget, 2);
    if (inputEl) inputEl.textContent = formatNumber(example.input, 2);
    if (outputEl) outputEl.textContent = formatNumber(example.output, 2);
    if (candidateEl) candidateEl.textContent = formatNumber(example.candidate, 2);
    if (memoryAfterEl) memoryAfterEl.textContent = formatNumber(memoryAfter, 2);
    if (hiddenEl) hiddenEl.textContent = formatNumber(hiddenOutput, 2);
    if (noteEl) noteEl.textContent = example.note;
    if (badgeEl) badgeEl.textContent = `Step ${step + 1} of ${total}`;
    if (titleEl) titleEl.textContent = lstmSteps[step].title;
    if (textEl) textEl.textContent = lstmSteps[step].text;
    if (mathNoteEl) {
        mathNoteEl.textContent = `Scalar demo: c_t = f_t * c_{t-1} + i_t * c~_t = ${formatNumber(example.forget, 2)}*${formatNumber(example.memoryBefore, 2)} + ${formatNumber(example.input, 2)}*${formatNumber(example.candidate, 2)} = ${formatNumber(memoryAfter, 2)}; h_t = o_t * tanh(c_t) = ${formatNumber(example.output, 2)}*tanh(${formatNumber(memoryAfter, 2)}) = ${formatNumber(hiddenOutput, 2)}`;
    }
}

function drawLstmCanvas() {
    const canvas = document.getElementById('lstmCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getLstmExample();
    const step = lstmState.stepIndex;
    const memoryAfter = getLstmMemoryAfter(example);

    const lineStart = 60;
    const lineEnd = 360;
    const lineY = 190;
    const lineWidth = lineEnd - lineStart;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(lineStart, lineY);
    ctx.lineTo(lineEnd, lineY);
    ctx.stroke();

    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(lineStart, lineY);
    ctx.lineTo(lineStart + lineWidth * example.memoryBefore, lineY);
    ctx.stroke();

    if (step >= 2) {
        ctx.strokeStyle = theme.success;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(lineStart, lineY);
        ctx.lineTo(lineStart + lineWidth * memoryAfter, lineY);
        ctx.stroke();
    }

    const gates = [
        { label: 'Forget', value: example.forget, x: 90 },
        { label: 'Input', value: example.input, x: 190 },
        { label: 'Output', value: example.output, x: 290 }
    ];

    gates.forEach((gate, index) => {
        const isActive = step === index || (step === 2 && gate.label === 'Input');
        drawRoundedRect(ctx, gate.x, 70, 80, 36, 10);
        ctx.fillStyle = isActive ? theme.warning : theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = isActive ? theme.ink : theme.inkSoft;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${gate.label}`, gate.x + 40, 92);
        ctx.fillText(gate.value.toFixed(2), gate.x + 40, 110);
    });

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Token: ${example.token}`, lineStart, 235);
}

function setLstmExample(exampleId) {
    lstmState.exampleId = exampleId;
    lstmState.stepIndex = 0;
    updateLstmUI();
    drawLstmCanvas();
}

function setLstmStep(stepIndex) {
    const total = lstmSteps.length;
    lstmState.stepIndex = ((stepIndex % total) + total) % total;
    updateLstmUI();
    drawLstmCanvas();
}

function advanceLstmStep(direction = 1) {
    setLstmStep(lstmState.stepIndex + direction);
}

function toggleLstmPlay() {
    const button = document.getElementById('lstmPlay');
    toggleAutoPlay(lstmState, button, 'Play gates', 'Pause', () => advanceLstmStep(1), 1200);
}

function setupLstmLab() {
    const exampleButtons = document.querySelectorAll('[data-lstm-example]');
    if (!exampleButtons.length) return;

    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(lstmState, document.getElementById('lstmPlay'), 'Play gates');
            setActiveToggleButtons(exampleButtons, 'lstmExample', button.dataset.lstmExample);
            setLstmExample(button.dataset.lstmExample);
        });
    });

    const prevButton = document.getElementById('lstmPrevStep');
    const nextButton = document.getElementById('lstmNextStep');
    const playButton = document.getElementById('lstmPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceLstmStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceLstmStep(1));
    if (playButton) playButton.addEventListener('click', toggleLstmPlay);

    setActiveToggleButtons(exampleButtons, 'lstmExample', lstmState.exampleId);
    updateLstmUI();
    drawLstmCanvas();
}

const transformerStages = [
    {
        title: 'Tokenize + embed',
        text: 'Convert text into token embeddings.'
    },
    {
        title: 'Add positions',
        text: 'Add positional signals so order matters.'
    },
    {
        title: 'Self-attention',
        text: 'Mix tokens by weighted attention scores.'
    },
    {
        title: 'Feedforward + residual',
        text: 'Transform each token and add the residual path.'
    },
    {
        title: 'Output probabilities',
        text: 'Project to logits and choose the next token.'
    }
];

const transformerExamples = [
    {
        id: 'translate',
        tokens: ['The', 'cat', 'sat', '.'],
        focusIndex: 1,
        attention: [0.1, 0.4, 0.3, 0.2],
        candidates: ['gato', 'se', 'sento', '.'],
        scores: [2.2, 1.1, 0.4, -0.2],
        note: 'Translation aligns words across languages.'
    },
    {
        id: 'summary',
        tokens: ['Report', 'shows', 'sales', 'drop'],
        focusIndex: 3,
        attention: [0.15, 0.2, 0.25, 0.4],
        candidates: ['summary', 'shows', 'drop', 'today'],
        scores: [1.8, 1.1, 0.6, 0.2],
        note: 'Summaries focus attention on key facts.'
    },
    {
        id: 'code',
        tokens: ['def', 'area', '(', 'r', ')'],
        focusIndex: 1,
        attention: [0.2, 0.3, 0.15, 0.25, 0.1],
        candidates: ['return', 'r', '*', 'r**2'],
        scores: [2.0, 1.5, 0.7, 0.5],
        note: 'Code models attend to symbols and syntax.'
    }
];

const transformerState = {
    exampleId: transformerExamples[0].id,
    stageIndex: 0,
    timer: null
};

function getTransformerExample() {
    return transformerExamples.find(example => example.id === transformerState.exampleId) || transformerExamples[0];
}

function updateTransformerUI() {
    const example = getTransformerExample();
    const stage = transformerState.stageIndex;
    const badgeEl = document.getElementById('transformerStageBadge');
    const titleEl = document.getElementById('transformerStageTitle');
    const textEl = document.getElementById('transformerStageText');
    const tokenCountEl = document.getElementById('transformerTokenCount');
    const focusEl = document.getElementById('transformerFocusToken');
    const stageEl = document.getElementById('transformerStageLabel');
    const noteEl = document.getElementById('transformerExampleNote');

    if (badgeEl) badgeEl.textContent = `Stage ${stage + 1} of ${transformerStages.length}`;
    if (titleEl) titleEl.textContent = transformerStages[stage].title;
    if (textEl) textEl.textContent = transformerStages[stage].text;
    if (tokenCountEl) tokenCountEl.textContent = example.tokens.length.toString();
    if (focusEl) focusEl.textContent = example.tokens[example.focusIndex];
    if (stageEl) stageEl.textContent = transformerStages[stage].title;
    if (noteEl) noteEl.textContent = example.note;
}

function drawTransformerCanvas() {
    const canvas = document.getElementById('transformerCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getTransformerExample();
    const stage = transformerState.stageIndex;
    const tokenCount = example.tokens.length;
    const gap = 10;
    const maxWidth = canvas.width - 40;
    const tokenWidth = Math.min(80, (maxWidth - gap * (tokenCount - 1)) / tokenCount);
    const tokenHeight = 30;
    const totalWidth = tokenWidth * tokenCount + gap * (tokenCount - 1);
    const startX = (canvas.width - totalWidth) / 2;
    const tokenY = 70;

    example.tokens.forEach((token, index) => {
        const x = startX + index * (tokenWidth + gap);
        const isFocus = index === example.focusIndex;
        drawRoundedRect(ctx, x, tokenY, tokenWidth, tokenHeight, 8);
        ctx.fillStyle = isFocus ? theme.primary : theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = isFocus ? 'white' : theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(token, x + tokenWidth / 2, tokenY + 20);

        if (stage === 1) {
            ctx.fillStyle = theme.warning;
            ctx.font = '11px Nunito, Arial';
            ctx.fillText(index.toString(), x + tokenWidth / 2, tokenY - 10);
        }

        if (stage === 0) {
            const barX = x + 8;
            const barY = tokenY + tokenHeight + 10;
            const barWidth = 6;
            const barGap = 6;
            for (let i = 0; i < 3; i++) {
                const height = 10 + ((token.length + i) % 5) * 4;
                ctx.fillStyle = theme.secondary;
                ctx.fillRect(barX + i * (barWidth + barGap), barY, barWidth, height);
            }
        }
    });

    if (stage === 2) {
        const focusX = startX + example.focusIndex * (tokenWidth + gap) + tokenWidth / 2;
        const focusY = tokenY + tokenHeight + 8;
        example.attention.forEach((weight, index) => {
            const x = startX + index * (tokenWidth + gap) + tokenWidth / 2;
            const y = tokenY + tokenHeight + 8;
            ctx.strokeStyle = theme.success;
            ctx.globalAlpha = 0.2 + weight * 0.8;
            ctx.lineWidth = 1 + weight * 4;
            ctx.beginPath();
            ctx.moveTo(focusX, focusY);
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });
    }

    if (stage === 3) {
        const boxX = canvas.width / 2 - 70;
        const boxY = 150;
        drawRoundedRect(ctx, boxX, boxY, 140, 50, 12);
        ctx.fillStyle = theme.secondary;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Feedforward', canvas.width / 2, boxY + 30);

        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 18px Nunito, Arial';
        ctx.fillText('+', canvas.width / 2, boxY + 80);
    }

    if (stage === 4) {
        const probs = softmax(example.scores);
        const maxIndex = probs.indexOf(Math.max(...probs));
        const barsX = canvas.width / 2 + 40;
        const barsY = 160;
        const barHeight = 10;
        const gapY = 6;
        probs.forEach((value, index) => {
            const y = barsY + index * (barHeight + gapY);
            ctx.fillStyle = index === maxIndex ? theme.success : theme.primary;
            ctx.globalAlpha = 0.6 + value * 0.4;
            ctx.fillRect(barsX, y, 80 * value, barHeight);
            ctx.globalAlpha = 1;
            ctx.fillStyle = theme.ink;
            ctx.font = '11px Nunito, Arial';
            ctx.fillText(example.candidates[index], barsX - 6, y + barHeight - 1);
        });
    }
}

function setTransformerExample(exampleId) {
    transformerState.exampleId = exampleId;
    transformerState.stageIndex = 0;
    updateTransformerUI();
    drawTransformerCanvas();
}

function setTransformerStage(stageIndex) {
    const total = transformerStages.length;
    transformerState.stageIndex = ((stageIndex % total) + total) % total;
    const stageButtons = document.querySelectorAll('[data-transformer-stage]');
    if (stageButtons.length) {
        setActiveToggleButtons(stageButtons, 'transformerStage', transformerState.stageIndex.toString());
    }
    updateTransformerUI();
    drawTransformerCanvas();
}

function advanceTransformerStage(direction = 1) {
    setTransformerStage(transformerState.stageIndex + direction);
}

function toggleTransformerPlay() {
    const button = document.getElementById('transformerPlay');
    toggleAutoPlay(transformerState, button, 'Play stages', 'Pause', () => advanceTransformerStage(1), 1300);
}

function setupTransformerLab() {
    const exampleButtons = document.querySelectorAll('[data-transformer-example]');
    const stageButtons = document.querySelectorAll('[data-transformer-stage]');
    if (!exampleButtons.length) return;

    exampleButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(transformerState, document.getElementById('transformerPlay'), 'Play stages');
            setActiveToggleButtons(exampleButtons, 'transformerExample', button.dataset.transformerExample);
            setTransformerExample(button.dataset.transformerExample);
        });
    });

    stageButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(transformerState, document.getElementById('transformerPlay'), 'Play stages');
            setActiveToggleButtons(stageButtons, 'transformerStage', button.dataset.transformerStage);
            setTransformerStage(parseInt(button.dataset.transformerStage, 10));
        });
    });

    const prevButton = document.getElementById('transformerPrevStage');
    const nextButton = document.getElementById('transformerNextStage');
    const playButton = document.getElementById('transformerPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceTransformerStage(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceTransformerStage(1));
    if (playButton) playButton.addEventListener('click', toggleTransformerPlay);

    setActiveToggleButtons(exampleButtons, 'transformerExample', transformerState.exampleId);
    setActiveToggleButtons(stageButtons, 'transformerStage', transformerState.stageIndex.toString());
    updateTransformerUI();
    drawTransformerCanvas();
}

const transformerPrompt = 'Data visualization empowers users to';
const transformerTokens = ['Data', 'visualization', 'empower', 's', 'users', 'to'];
const transformerTokenIds = [1262, 9931, 1844, 78, 527, 284];

const transformerAdvancedSteps = [
    {
        id: 'tokenize',
        label: 'Tokenization',
        stage: 'tokenize',
        text: 'Split the prompt into tokens. "empowers" becomes "empower" + "s".',
        math: '\\[\\text{Prompt} \\rightarrow [\\text{tokens}]\\]',
        points: ['Break text into token IDs.', 'Subwords keep vocabulary manageable.', 'Sequence length sets context.']
    },
    {
        id: 'token-embed',
        label: 'Token embedding',
        stage: 'embed',
        text: 'Each token maps to a 768-dimensional embedding from a (50,257 x 768) matrix.',
        math: '\\[E \\in \\mathbb{R}^{50257 \\times 768}\\]',
        points: ['Lookup vectors from the embedding table.', 'Similar tokens cluster in vector space.', 'All tokens become same-length vectors.']
    },
    {
        id: 'pos-encode',
        label: 'Positional encoding',
        stage: 'embed',
        text: 'Add positional signals so the model knows token order.',
        math: '\\[E_{final} = E_{token} + E_{position}\\]',
        points: ['GPT-2 learns position embeddings.', 'Without positions, order is lost.', 'Positions align tokens in sequence.']
    },
    {
        id: 'final-embed',
        label: 'Final embedding',
        stage: 'embed',
        text: 'Token and positional vectors sum into a single embedding per token.',
        math: '\\[X_0 = E_{token} + E_{position}\\]',
        points: ['Final embeddings feed the first block.', 'Shape: tokens x 768.', 'This is the model input.']
    },
    {
        id: 'qkv',
        label: 'Q, K, V',
        stage: 'attention',
        text: 'Project embeddings into Query, Key, and Value matrices with learned weights.',
        math: '\\[Q = XW_Q,\\; K = XW_K,\\; V = XW_V\\]',
        points: ['Each token gets a query, key, and value.', 'Three linear layers share the input.', 'QKV enable attention routing.']
    },
    {
        id: 'split-heads',
        label: 'Split heads',
        stage: 'attention',
        text: 'Split Q, K, V into 12 heads so each head can learn a different relationship.',
        math: '\\[\\text{heads} = 12\\]',
        points: ['Each head sees a slice of the embedding.', 'Heads learn different patterns.', 'Computation stays parallel.']
    },
    {
        id: 'attention-dot',
        label: 'QK^T',
        stage: 'attention',
        text: 'Compute attention scores with the dot product QK^T.',
        math: '\\[\\text{scores} = QK^T\\]',
        points: ['Scores measure token similarity.', 'Produces a square attention matrix.', 'Each row is one token’s view.']
    },
    {
        id: 'attention-mask',
        label: 'Scale + mask',
        stage: 'attention',
        text: 'Scale by sqrt(d) and mask future positions so tokens cannot peek ahead.',
        math: '\\[\\text{scores} = \\frac{QK^T}{\\sqrt{d}} + \\text{mask}\\]',
        points: ['Scaling stabilizes gradients.', 'Mask sets future tokens to -inf.', 'Enforces autoregressive prediction.']
    },
    {
        id: 'attention-softmax',
        label: 'Softmax',
        stage: 'attention',
        text: 'Softmax turns scores into probabilities; dropout can be applied during training.',
        math: '\\[\\text{weights} = \\text{softmax}(\\text{scores})\\]',
        points: ['Rows sum to 1.', 'Dropout regularizes attention.', 'Weights highlight relevant tokens.']
    },
    {
        id: 'attention-concat',
        label: 'Concat',
        stage: 'attention',
        text: 'Multiply weights by V, then concatenate all heads and project back.',
        math: '\\[\\text{Attention}(Q,K,V) = \\text{softmax}(QK^T)V\\]',
        points: ['Weighted sums produce new token vectors.', 'Heads concatenate then project.', 'Output returns to 768 dims.']
    },
    {
        id: 'mlp-expand',
        label: 'MLP expand',
        stage: 'mlp',
        text: 'The MLP expands each token from 768 to 3072 with GELU.',
        math: '\\[768 \\rightarrow 3072\\]',
        points: ['Per-token feedforward layer.', 'GELU adds nonlinearity.', 'Expands capacity.']
    },
    {
        id: 'mlp-project',
        label: 'MLP project',
        stage: 'mlp',
        text: 'The MLP projects back to 768 dimensions.',
        math: '\\[3072 \\rightarrow 768\\]',
        points: ['Compresses to original width.', 'Refined token representation.', 'Feeds into next block.']
    },
    {
        id: 'logits',
        label: 'Output logits',
        stage: 'output',
        text: 'Project to 50,257 logits and apply softmax for next-token probabilities.',
        math: '\\[p = \\text{softmax}(XW_{out})\\]',
        points: ['One score per vocab token.', 'Softmax gives probabilities.', 'Top token is the model guess.']
    },
    {
        id: 'sampling',
        label: 'Sampling',
        stage: 'sampling',
        text: 'Temperature, top-k, and top-p tune the randomness of the next token.',
        math: '\\[\\text{logits} / T\\]',
        points: ['Lower T sharpens output.', 'Top-k limits to k best tokens.', 'Top-p keeps cumulative mass.']
    },
    {
        id: 'aux',
        label: 'Aux features',
        stage: 'aux',
        text: 'LayerNorm, dropout, and residual connections stabilize training and gradients.',
        math: '',
        points: ['LayerNorm before attention and MLP.', 'Residual adds skip connections.', 'Dropout runs only in training.']
    }
];

const transformerAdvancedState = {
    stepIndex: 0,
    timer: null
};

function getTransformerAdvancedStep() {
    return transformerAdvancedSteps[transformerAdvancedState.stepIndex] || transformerAdvancedSteps[0];
}

function updateTransformerAdvancedUI() {
    const step = getTransformerAdvancedStep();
    const badgeEl = document.getElementById('transformerAdvancedBadge');
    const titleEl = document.getElementById('transformerAdvancedTitle');
    const textEl = document.getElementById('transformerAdvancedText');
    const mathEl = document.getElementById('transformerAdvancedMath');
    const pointsEl = document.getElementById('transformerAdvancedPoints');
    const stepButtons = document.querySelectorAll('[data-transformer-advanced-step]');

    if (badgeEl) {
        badgeEl.textContent = `Step ${transformerAdvancedState.stepIndex + 1} of ${transformerAdvancedSteps.length}`;
    }
    if (titleEl) {
        titleEl.textContent = step.label;
    }
    if (textEl) {
        textEl.textContent = step.text;
    }
    if (pointsEl) {
        pointsEl.innerHTML = '';
        if (step.points && step.points.length) {
            pointsEl.style.display = 'block';
            step.points.forEach(point => {
                const item = document.createElement('li');
                item.textContent = point;
                pointsEl.appendChild(item);
            });
        } else {
            pointsEl.style.display = 'none';
        }
    }
    if (mathEl) {
        if (step.math) {
            mathEl.style.display = 'block';
            mathEl.innerHTML = step.math;
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([mathEl]);
            }
        } else {
            mathEl.style.display = 'none';
            mathEl.textContent = '';
        }
    }
    if (stepButtons.length) {
        setActiveToggleButtons(stepButtons, 'transformerAdvancedStep', transformerAdvancedState.stepIndex.toString());
    }
}

function drawTokenRow(ctx, tokens, startX, startY, tokenWidth, tokenHeight, theme, options = {}) {
    const gap = options.gap ?? 6;
    tokens.forEach((token, index) => {
        const x = startX + index * (tokenWidth + gap);
        const isHighlight = options.highlightIndex === index;
        drawRoundedRect(ctx, x, startY, tokenWidth, tokenHeight, 8);
        ctx.fillStyle = isHighlight ? theme.primary : theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = isHighlight ? 'white' : theme.ink;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(token, x + tokenWidth / 2, startY + tokenHeight / 2 + 4);

        if (options.showIds) {
            ctx.fillStyle = theme.inkSoft;
            ctx.font = '10px Nunito, Arial';
            ctx.fillText(options.ids?.[index] ?? index, x + tokenWidth / 2, startY + tokenHeight + 12);
        }
    });
}

function drawEmbeddingBars(ctx, x, y, width, height, theme, color) {
    const bars = 8;
    const gap = 4;
    const barWidth = (width - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
        const barHeight = height * (0.3 + (i % 4) * 0.15);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4 + (i / bars) * 0.5;
        ctx.fillRect(x + i * (barWidth + gap), y + height - barHeight, barWidth, barHeight);
    }
    ctx.globalAlpha = 1;
}

function drawMatrix(ctx, x, y, rows, cols, cellSize, theme, options = {}) {
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cellX = x + c * cellSize;
            const cellY = y + r * cellSize;
            let fill = theme.panel;
            if (options.maskUpper && c > r) {
                fill = theme.grid;
            }
            ctx.fillStyle = fill;
            ctx.fillRect(cellX, cellY, cellSize, cellSize);
            ctx.strokeStyle = theme.axis;
            ctx.strokeRect(cellX, cellY, cellSize, cellSize);
        }
    }

    if (options.highlight) {
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + options.highlight.c * cellSize, y + options.highlight.r * cellSize, cellSize, cellSize);
        ctx.lineWidth = 1;
    }
}

function drawAttentionHeads(ctx, x, y, count, width, height, theme) {
    const gap = 4;
    const headWidth = (width - gap * (count - 1)) / count;
    for (let i = 0; i < count; i++) {
        const headX = x + i * (headWidth + gap);
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = 0.3 + (i / count) * 0.6;
        ctx.fillRect(headX, y, headWidth, height);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = theme.axis;
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
}

function drawTransformerAdvancedCanvas() {
    const canvas = document.getElementById('transformerAdvancedCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const step = getTransformerAdvancedStep();
    const tokenCount = transformerTokens.length;
    const gap = 6;
    const tokenWidth = Math.min(70, (canvas.width - 40 - gap * (tokenCount - 1)) / tokenCount);
    const tokenHeight = 26;
    const startX = (canvas.width - (tokenWidth * tokenCount + gap * (tokenCount - 1))) / 2;
    const startY = 40;

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Prompt: "${transformerPrompt}"`, canvas.width / 2, 20);

    if (step.id === 'tokenize') {
        drawTokenRow(ctx, transformerTokens, startX, startY, tokenWidth, tokenHeight, theme, {
            showIds: true,
            ids: transformerTokenIds
        });
        ctx.fillStyle = theme.inkSoft;
        ctx.font = '11px Nunito, Arial';
        ctx.fillText('Token IDs', canvas.width / 2, startY + tokenHeight + 24);
        return;
    }

    if (step.id === 'token-embed') {
        drawTokenRow(ctx, transformerTokens, startX, startY, tokenWidth, tokenHeight, theme, {
            highlightIndex: 2
        });
        const boxX = canvas.width / 2 - 80;
        const boxY = 120;
        drawRoundedRect(ctx, boxX, boxY, 160, 80, 12);
        ctx.fillStyle = theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Embedding (768-d)', canvas.width / 2, boxY + 18);
        drawEmbeddingBars(ctx, boxX + 16, boxY + 30, 128, 40, theme, theme.secondary);
        return;
    }

    if (step.id === 'pos-encode') {
        drawTokenRow(ctx, transformerTokens, startX, startY, tokenWidth, tokenHeight, theme);
        ctx.fillStyle = theme.warning;
        ctx.font = 'bold 11px Nunito, Arial';
        transformerTokens.forEach((token, index) => {
            const x = startX + index * (tokenWidth + gap) + tokenWidth / 2;
            ctx.fillText(index.toString(), x, startY - 10);
        });
        ctx.fillStyle = theme.inkSoft;
        ctx.fillText('Positions', canvas.width / 2, startY - 24);
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= canvas.width; i += 6) {
            const waveY = startY + tokenHeight + 18 + Math.sin(i / 20) * 6;
            if (i === 0) {
                ctx.moveTo(i, waveY);
            } else {
                ctx.lineTo(i, waveY);
            }
        }
        ctx.stroke();
        return;
    }

    if (step.id === 'final-embed') {
        drawTokenRow(ctx, transformerTokens, startX, startY, tokenWidth, tokenHeight, theme, {
            highlightIndex: 1
        });
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 18px Nunito, Arial';
        ctx.fillText('+', canvas.width / 2, 120);
        drawRoundedRect(ctx, canvas.width / 2 - 70, 140, 140, 60, 12);
        ctx.fillStyle = theme.success;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Final embedding', canvas.width / 2, 174);
        return;
    }

    if (step.id === 'qkv') {
        drawTokenRow(ctx, transformerTokens, startX, startY, tokenWidth, tokenHeight, theme);
        drawArrow(ctx, canvas.width / 2, 80, canvas.width / 2, 120, theme.primary);
        const boxY = 130;
        const labels = ['Q', 'K', 'V'];
        labels.forEach((label, index) => {
            const boxX = 80 + index * 100;
            drawRoundedRect(ctx, boxX, boxY, 70, 60, 12);
            ctx.fillStyle = theme.secondary;
            ctx.fill();
            ctx.strokeStyle = theme.axis;
            ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px Nunito, Arial';
            ctx.fillText(label, boxX + 35, boxY + 35);
        });
        return;
    }

    if (step.id === 'split-heads') {
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('12 heads', canvas.width / 2, 40);
        for (let i = 0; i < 4; i++) {
            const boxX = 70 + i * 80;
            drawRoundedRect(ctx, boxX, 80, 60, 80, 12);
            ctx.fillStyle = theme.primary;
            ctx.globalAlpha = 0.25 + i * 0.15;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = theme.axis;
            ctx.stroke();
            ctx.fillStyle = theme.ink;
            ctx.font = 'bold 11px Nunito, Arial';
            ctx.fillText(`Head ${i + 1}`, boxX + 30, 130);
        }
        return;
    }

    if (step.id === 'attention-dot' || step.id === 'attention-mask' || step.id === 'attention-softmax') {
        drawTokenRow(ctx, transformerTokens, startX, 30, tokenWidth, tokenHeight, theme);
        const matrixX = canvas.width / 2 - 70;
        const matrixY = 90;
        drawMatrix(ctx, matrixX, matrixY, 5, 5, 24, theme, {
            maskUpper: step.id === 'attention-mask',
            highlight: { r: 2, c: 1 }
        });
        ctx.fillStyle = theme.inkSoft;
        ctx.font = '11px Nunito, Arial';
        const label = step.id === 'attention-dot' ? 'QK^T scores' : step.id === 'attention-mask' ? 'Masked scores' : 'Attention weights';
        ctx.fillText(label, canvas.width / 2, 80);
        drawAttentionHeads(ctx, canvas.width / 2 - 110, 230, 6, 220, 18, theme);
        return;
    }

    if (step.id === 'attention-concat') {
        const boxY = 90;
        for (let i = 0; i < 3; i++) {
            const x = 70 + i * 100;
            drawRoundedRect(ctx, x, boxY, 70, 50, 10);
            ctx.fillStyle = theme.secondary;
            ctx.globalAlpha = 0.3 + i * 0.2;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = theme.axis;
            ctx.stroke();
            ctx.fillStyle = theme.ink;
            ctx.font = 'bold 11px Nunito, Arial';
            ctx.fillText(`Head ${i + 1}`, x + 35, boxY + 30);
        }
        drawArrow(ctx, canvas.width / 2, 150, canvas.width / 2, 190, theme.success);
        drawRoundedRect(ctx, canvas.width / 2 - 80, 200, 160, 50, 12);
        ctx.fillStyle = theme.success;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Concat + linear', canvas.width / 2, 230);
        return;
    }

    if (step.id === 'mlp-expand' || step.id === 'mlp-project') {
        drawRoundedRect(ctx, canvas.width / 2 - 90, 120, 180, 80, 16);
        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Nunito, Arial';
        const label = step.id === 'mlp-expand' ? 'MLP: 768 -> 3072' : 'MLP: 3072 -> 768';
        ctx.fillText(label, canvas.width / 2, 160);
        ctx.fillStyle = theme.inkSoft;
        ctx.font = '11px Nunito, Arial';
        ctx.fillText('GELU activation', canvas.width / 2, 190);
        return;
    }

    if (step.id === 'logits') {
        const barsX = canvas.width / 2 - 90;
        const barsY = 90;
        const barHeight = 12;
        const barGap = 6;
        const labels = ['token A', 'token B', 'token C', 'token D', 'token E'];
        labels.forEach((label, index) => {
            const y = barsY + index * (barHeight + barGap);
            ctx.fillStyle = index === 1 ? theme.success : theme.secondary;
            ctx.globalAlpha = 0.5 + index * 0.1;
            ctx.fillRect(barsX + 40, y, 120 - index * 12, barHeight);
            ctx.globalAlpha = 1;
            ctx.fillStyle = theme.ink;
            ctx.font = '11px Nunito, Arial';
            ctx.fillText(label, barsX, y + barHeight - 2);
        });
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Logits -> softmax', canvas.width / 2, 70);
        return;
    }

    if (step.id === 'sampling') {
        const sliderX = 80;
        const sliderY = 120;
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Temperature', sliderX, sliderY - 10);
        ctx.strokeStyle = theme.axis;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sliderX, sliderY);
        ctx.lineTo(sliderX + 200, sliderY);
        ctx.stroke();
        ctx.fillStyle = theme.warning;
        ctx.beginPath();
        ctx.arc(sliderX + 120, sliderY, 8, 0, 2 * Math.PI);
        ctx.fill();

        const topBoxY = 170;
        drawRoundedRect(ctx, sliderX, topBoxY, 90, 36, 10);
        ctx.fillStyle = theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.fillText('top-k = 40', sliderX + 45, topBoxY + 22);

        drawRoundedRect(ctx, sliderX + 110, topBoxY, 90, 36, 10);
        ctx.fillStyle = theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.fillText('top-p = 0.9', sliderX + 155, topBoxY + 22);
        return;
    }

    if (step.id === 'aux') {
        drawRoundedRect(ctx, canvas.width / 2 - 100, 120, 200, 80, 16);
        ctx.fillStyle = theme.panel;
        ctx.fill();
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.fillText('Transformer block', canvas.width / 2, 150);
        ctx.fillText('LayerNorm + Dropout', canvas.width / 2, 170);

        ctx.strokeStyle = theme.success;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 120, 160);
        ctx.lineTo(canvas.width / 2 - 120, 100);
        ctx.lineTo(canvas.width / 2 + 120, 100);
        ctx.lineTo(canvas.width / 2 + 120, 160);
        ctx.stroke();
        ctx.fillStyle = theme.success;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.fillText('Residual', canvas.width / 2, 95);
        return;
    }
}

function drawTransformerAdvancedOverviewCanvas() {
    const canvas = document.getElementById('transformerAdvancedOverviewCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const step = getTransformerAdvancedStep();
    const stage = step.stage;
    const stages = [
        { id: 'tokenize', label: 'Tokenize' },
        { id: 'embed', label: 'Embed' },
        { id: 'attention', label: 'Attention' },
        { id: 'mlp', label: 'MLP' },
        { id: 'output', label: 'Output' },
        { id: 'sampling', label: 'Sample' }
    ];

    const pipelineWidth = canvas.width - 90;
    const boxGap = 8;
    const boxWidth = (pipelineWidth - boxGap * (stages.length - 1)) / stages.length;
    const boxHeight = 32;
    const startX = 20;
    const startY = 90;

    const tokenWidth = Math.min(58, (pipelineWidth - boxGap * (transformerTokens.length - 1)) / transformerTokens.length);
    const tokenHeight = 18;
    const tokenStartX = startX + (pipelineWidth - (tokenWidth * transformerTokens.length + boxGap * (transformerTokens.length - 1))) / 2;

    drawTokenRow(ctx, transformerTokens, tokenStartX, 20, tokenWidth, tokenHeight, theme, {
        highlightIndex: 2
    });

    stages.forEach((item, index) => {
        const x = startX + index * (boxWidth + boxGap);
        const isActive = stage === item.id || (stage === 'aux' && (item.id === 'attention' || item.id === 'mlp'));
        drawRoundedRect(ctx, x, startY, boxWidth, boxHeight, 10);
        ctx.fillStyle = isActive ? theme.primary : theme.panel;
        ctx.globalAlpha = isActive ? 0.9 : 0.6;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme.axis;
        ctx.stroke();
        ctx.fillStyle = isActive ? 'white' : theme.ink;
        ctx.font = 'bold 10px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.label, x + boxWidth / 2, startY + 20);

        if (index < stages.length - 1) {
            drawArrow(ctx, x + boxWidth + 2, startY + boxHeight / 2, x + boxWidth + boxGap - 2, startY + boxHeight / 2, theme.axis);
        }
    });

    if (stage === 'aux') {
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = theme.warning;
        ctx.lineWidth = 2;
        const auxX = startX + 2 * (boxWidth + boxGap) - 6;
        const auxWidth = (boxWidth + boxGap) * 2 + 12;
        ctx.strokeRect(auxX, startY - 6, auxWidth, boxHeight + 12);
        ctx.restore();
    }

    const stackX = canvas.width - 52;
    const stackY = 40;
    const blockHeight = 10;
    for (let i = 0; i < 12; i++) {
        const y = stackY + i * (blockHeight + 2);
        ctx.fillStyle = stage === 'attention' || stage === 'mlp' ? theme.secondary : theme.grid;
        ctx.globalAlpha = 0.2 + (i / 12) * 0.7;
        ctx.fillRect(stackX, y, 24, blockHeight);
        ctx.globalAlpha = 1;
    }
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('12 blocks', stackX + 12, stackY + 12 * (blockHeight + 2) + 12);
}

function setTransformerAdvancedStep(stepIndex) {
    const total = transformerAdvancedSteps.length;
    transformerAdvancedState.stepIndex = ((stepIndex % total) + total) % total;
    updateTransformerAdvancedUI();
    drawTransformerAdvancedCanvas();
    drawTransformerAdvancedOverviewCanvas();
}

function advanceTransformerAdvancedStep(direction = 1) {
    setTransformerAdvancedStep(transformerAdvancedState.stepIndex + direction);
}

function toggleTransformerAdvancedPlay() {
    const button = document.getElementById('transformerAdvancedPlay');
    toggleAutoPlay(transformerAdvancedState, button, 'Play steps', 'Pause', () => advanceTransformerAdvancedStep(1), 1400);
}

function setupTransformerAdvanced() {
    const stepButtons = document.querySelectorAll('[data-transformer-advanced-step]');
    if (!stepButtons.length) return;

    stepButtons.forEach(button => {
        button.addEventListener('click', () => {
            stopAutoPlay(transformerAdvancedState, document.getElementById('transformerAdvancedPlay'), 'Play steps');
            const stepIndex = parseInt(button.dataset.transformerAdvancedStep, 10);
            setTransformerAdvancedStep(stepIndex);
        });
    });

    const prevButton = document.getElementById('transformerAdvancedPrev');
    const nextButton = document.getElementById('transformerAdvancedNext');
    const playButton = document.getElementById('transformerAdvancedPlay');

    if (prevButton) prevButton.addEventListener('click', () => advanceTransformerAdvancedStep(-1));
    if (nextButton) nextButton.addEventListener('click', () => advanceTransformerAdvancedStep(1));
    if (playButton) playButton.addEventListener('click', toggleTransformerAdvancedPlay);

    setTransformerAdvancedStep(transformerAdvancedState.stepIndex);
}

// ============================================
// Foundations Visualization
// ============================================
const fundamentalsTopics = [
    {
        id: 'linear',
        label: 'Linear Algebra',
        colorKey: 'primary',
        detail: 'Matrices bend space: stretch, rotate, and shift vectors.'
    },
    {
        id: 'calculus',
        label: 'Calculus',
        colorKey: 'secondary',
        detail: 'Derivatives tell slope; chain rule links the slopes.'
    },
    {
        id: 'optimization',
        label: 'Optimization',
        colorKey: 'success',
        detail: 'Follow the slope downhill with a careful step size.'
    },
    {
        id: 'probability',
        label: 'Probability',
        colorKey: 'warning',
        detail: 'Softmax turns scores into confidence bars.'
    },
    {
        id: 'matrix',
        label: 'Matrix Calc',
        colorKey: 'primary',
        detail: 'Batch gradients use shapes to stay fast and correct.'
    }
];

let fundamentalsIndex = 0;
let activeFundamentalId = fundamentalsTopics[0].id;

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    words.forEach((word, index) => {
        const testLine = line ? `${line} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
            ctx.fillText(line, x, lineY);
            line = word;
            lineY += lineHeight;
        } else {
            line = testLine;
        }

        if (index === words.length - 1) {
            ctx.fillText(line, x, lineY);
        }
    });
}

function getTopicColor(topicId, theme) {
    const topic = fundamentalsTopics.find(item => item.id === topicId);
    const key = topic ? topic.colorKey : 'primary';
    return theme[key] || theme.primary;
}

function drawArrow(ctx, x1, y1, x2, y2, color) {
    const headLength = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
}

function drawPoint(ctx, x, y, color, radius = 5) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();
}

function drawAxes(ctx, origin, scale, size, color, options = {}) {
    const left = mapToCanvas({ x: -size, y: 0 }, origin, scale);
    const right = mapToCanvas({ x: size, y: 0 }, origin, scale);
    const bottom = mapToCanvas({ x: 0, y: -size }, origin, scale);
    const top = mapToCanvas({ x: 0, y: size }, origin, scale);

    drawArrow(ctx, left.x, left.y, right.x, right.y, color);
    drawArrow(ctx, bottom.x, bottom.y, top.x, top.y, color);

    ctx.fillStyle = color;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('x', right.x - 12, right.y - 14);
    ctx.fillText('y', top.x + 6, top.y + 8);

    if (!options.showTicks) return;

    const tickStep = options.tickStep || 1;
    const tickSize = options.tickSize || 4;
    const tickColor = options.tickColor || color;
    const labelColor = options.labelColor || tickColor;

    ctx.save();
    ctx.strokeStyle = tickColor;
    ctx.fillStyle = labelColor;
    ctx.font = options.tickFont || 'bold 10px Nunito, Arial';

    for (let i = -size; i <= size; i += tickStep) {
        if (i === 0 || Math.abs(i) >= size) continue;
        const tick = mapToCanvas({ x: i, y: 0 }, origin, scale);
        ctx.beginPath();
        ctx.moveTo(tick.x, tick.y - tickSize);
        ctx.lineTo(tick.x, tick.y + tickSize);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(i.toString(), tick.x, tick.y + tickSize + 4);
    }

    for (let i = -size; i <= size; i += tickStep) {
        if (i === 0 || Math.abs(i) >= size) continue;
        const tick = mapToCanvas({ x: 0, y: i }, origin, scale);
        ctx.beginPath();
        ctx.moveTo(tick.x - tickSize, tick.y);
        ctx.lineTo(tick.x + tickSize, tick.y);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), tick.x - tickSize - 4, tick.y + 1);
    }

    ctx.restore();
}

function drawDashedLine(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
}

function drawCoordinatePlane(ctx, origin, scale, size, theme) {
    drawGrid(ctx, origin, scale, size, [
        [1, 0],
        [0, 1]
    ], theme.grid);
    drawAxes(ctx, origin, scale, size, theme.axis);
}

function applyMatrix(point, matrix) {
    return {
        x: point.x * matrix[0][0] + point.y * matrix[0][1],
        y: point.x * matrix[1][0] + point.y * matrix[1][1]
    };
}

function mapToCanvas(point, origin, scale) {
    return {
        x: origin.x + point.x * scale,
        y: origin.y - point.y * scale
    };
}

function drawGrid(ctx, origin, scale, size, matrix, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    for (let i = -size; i <= size; i++) {
        const startH = applyMatrix({ x: -size, y: i }, matrix);
        const endH = applyMatrix({ x: size, y: i }, matrix);
        const startV = applyMatrix({ x: i, y: -size }, matrix);
        const endV = applyMatrix({ x: i, y: size }, matrix);

        const h1 = mapToCanvas(startH, origin, scale);
        const h2 = mapToCanvas(endH, origin, scale);
        const v1 = mapToCanvas(startV, origin, scale);
        const v2 = mapToCanvas(endV, origin, scale);

        ctx.beginPath();
        ctx.moveTo(h1.x, h1.y);
        ctx.lineTo(h2.x, h2.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(v1.x, v1.y);
        ctx.lineTo(v2.x, v2.y);
        ctx.stroke();
    }
}

function drawSceneCaption(ctx, canvas, color, title, detail) {
    const theme = getThemeColors();
    const callout = {
        x: 18,
        y: canvas.height - 68,
        width: canvas.width - 36,
        height: 50
    };

    ctx.save();
    drawRoundedRect(ctx, callout.x, callout.y, callout.width, callout.height, 10);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12.5px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(title, callout.x + 12, callout.y + 6);
    ctx.font = '12px Nunito, Arial';
    wrapCanvasText(ctx, detail, callout.x + 12, callout.y + 24, callout.width - 24, 16);
    ctx.restore();
}

function drawMiniNode(ctx, x, y, width, height, label, theme, options = {}) {
    const fill = options.fill || theme.panel;
    const stroke = options.stroke || theme.axis;
    const textColor = options.textColor || theme.ink;
    const radius = options.radius ?? 8;
    const fontSize = options.fontSize || 11;

    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px Nunito, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2);
}

function drawMiniMatrixBlock(ctx, x, y, width, height, rows, cols, label, theme, options = {}) {
    const fill = options.fill || theme.panel;
    const stroke = options.stroke || theme.axis;

    drawRoundedRect(ctx, x, y, width, height, 10);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1;
    for (let r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(x, y + (height / rows) * r);
        ctx.lineTo(x + width, y + (height / rows) * r);
        ctx.stroke();
    }
    for (let c = 1; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(x + (width / cols) * c, y);
        ctx.lineTo(x + (width / cols) * c, y + height);
        ctx.stroke();
    }

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2);
}

function drawMiniBars(ctx, rect, values, colors, theme, options = {}) {
    const count = values.length;
    const gap = options.gap ?? 6;
    const barWidth = (rect.width - gap * (count - 1)) / count;
    const baseY = rect.y + rect.height;

    values.forEach((value, index) => {
        const height = Math.max(2, value * rect.height);
        const x = rect.x + index * (barWidth + gap);
        const y = baseY - height;
        ctx.fillStyle = colors[index] || theme.primary;
        ctx.fillRect(x, y, barWidth, height);
    });
}

function drawMiniAxisPanel(ctx, rect, theme, options = {}) {
    const padding = options.padding ?? 8;

    if (options.background !== false) {
        drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 10);
        ctx.fillStyle = theme.panel;
        ctx.strokeStyle = theme.panelBorder;
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
    }

    const origin = {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2
    };
    const scale = Math.min(rect.width, rect.height) / 2 - padding;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rect.x + padding, origin.y);
    ctx.lineTo(rect.x + rect.width - padding, origin.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(origin.x, rect.y + padding);
    ctx.lineTo(origin.x, rect.y + rect.height - padding);
    ctx.stroke();

    return { origin, scale };
}

function drawMiniVector(ctx, origin, scale, vector, color) {
    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const end = mapToCanvas(vector, origin, scale);
    drawArrow(ctx, start.x, start.y, end.x, end.y, color);
    return { start, end };
}

function drawMiniScatter(ctx, origin, scale, points, color, radius = 3) {
    points.forEach(point => {
        const mapped = mapToCanvas(point, origin, scale);
        drawPoint(ctx, mapped.x, mapped.y, color, radius);
    });
}

function drawMiniLabel(ctx, rect, text, theme) {
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(text, rect.x + 4, rect.y - 4);
}

function drawFormulaCard(ctx, rect, card, theme) {
    const accent = theme[card.colorKey] || theme.primary;

    ctx.save();
    drawRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
    ctx.fillStyle = theme.panel;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(card.title, rect.x + 10, rect.y + 8);

    const content = {
        x: rect.x + 10,
        y: rect.y + 26,
        width: rect.width - 20,
        height: rect.height - 36
    };
    card.draw(ctx, content, theme, accent);
    ctx.restore();
}

function drawFormulaCards(ctx, canvas, cards, theme) {
    const padding = 16;
    const gap = 14;
    const columns = cards.length === 1 ? 1 : 2;
    const rows = Math.ceil(cards.length / columns);
    const cardWidth = (canvas.width - padding * 2 - gap * (columns - 1)) / columns;
    const cardHeight = (canvas.height - padding * 2 - gap * (rows - 1)) / rows;

    cards.forEach((card, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        let x = padding + col * (cardWidth + gap);
        const y = padding + row * (cardHeight + gap);

        if (columns === 2 && cards.length % 2 === 1 && row === rows - 1 && col === 0) {
            x = padding + (canvas.width - padding * 2 - cardWidth) / 2;
        }

        drawFormulaCard(ctx, { x, y, width: cardWidth, height: cardHeight }, card, theme);
    });
}

function drawAffineMini(ctx, rect, theme, accent) {
    const boxW = Math.min(36, rect.width * 0.22);
    const boxH = Math.min(26, rect.height * 0.4);
    const gap = (rect.width - boxW * 3) / 4;
    const y = rect.y + rect.height / 2 - boxH / 2;
    const x1 = rect.x + gap;
    const x2 = x1 + boxW + gap;
    const x3 = x2 + boxW + gap;

    drawMiniNode(ctx, x1, y, boxW, boxH, 'x', theme);
    drawMiniNode(ctx, x2, y, boxW, boxH, 'W', theme, { stroke: accent });
    drawMiniNode(ctx, x3, y, boxW, boxH, 'h', theme, { stroke: theme.success });

    drawArrow(ctx, x1 + boxW, y + boxH / 2, x2, y + boxH / 2, theme.axis);
    drawArrow(ctx, x2 + boxW, y + boxH / 2, x3, y + boxH / 2, theme.axis);

    const biasX = x3 + boxW / 2;
    const biasTop = y - 18;
    drawArrow(ctx, biasX, biasTop, biasX, y + 6, theme.warning);
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('b', biasX, biasTop - 2);
}

function drawReluMini(ctx, rect, theme, accent) {
    const origin = {
        x: rect.x + rect.width * 0.32,
        y: rect.y + rect.height * 0.72
    };
    const xLeft = origin.x - rect.width * 0.2;
    const xRight = origin.x + rect.width * 0.55;
    const yTop = origin.y - rect.height * 0.55;
    const yBottom = origin.y + rect.height * 0.18;
    const diag = Math.min(xRight - origin.x, origin.y - yTop);

    drawArrow(ctx, xLeft, origin.y, xRight, origin.y, theme.axis);
    drawArrow(ctx, origin.x, yBottom, origin.x, yTop, theme.axis);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xLeft, origin.y);
    ctx.lineTo(origin.x, origin.y);
    ctx.lineTo(origin.x + diag, origin.y - diag);
    ctx.stroke();

    drawPoint(ctx, origin.x + diag * 0.7, origin.y - diag * 0.7, theme.success, 4);
}

function drawChainRuleMini(ctx, rect, theme, accent) {
    const boxW = Math.min(40, rect.width * 0.26);
    const boxH = Math.min(26, rect.height * 0.4);
    const gap = (rect.width - boxW * 3) / 4;
    const y = rect.y + rect.height / 2 - boxH / 2;
    const x1 = rect.x + gap;
    const x2 = x1 + boxW + gap;
    const x3 = x2 + boxW + gap;

    drawMiniNode(ctx, x1, y, boxW, boxH, 'x', theme);
    drawMiniNode(ctx, x2, y, boxW, boxH, 'g(x)', theme, { stroke: accent });
    drawMiniNode(ctx, x3, y, boxW, boxH, 'f(g)', theme, { stroke: theme.secondary });

    drawArrow(ctx, x1 + boxW, y + boxH / 2, x2, y + boxH / 2, accent);
    drawArrow(ctx, x2 + boxW, y + boxH / 2, x3, y + boxH / 2, accent);

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText("g'", x1 + boxW + gap / 2, y - 2);
    ctx.fillText("f'", x2 + boxW + gap / 2, y - 2);
}

function drawChainFlowMini(ctx, rect, theme, accent) {
    const boxW = Math.min(40, rect.width * 0.26);
    const boxH = Math.min(26, rect.height * 0.4);
    const gap = (rect.width - boxW * 3) / 4;
    const y = rect.y + rect.height / 2 - boxH / 2;
    const x1 = rect.x + gap;
    const x2 = x1 + boxW + gap;
    const x3 = x2 + boxW + gap;

    drawMiniNode(ctx, x1, y, boxW, boxH, 'x', theme);
    drawMiniNode(ctx, x2, y, boxW, boxH, 'y', theme, { stroke: accent });
    drawMiniNode(ctx, x3, y, boxW, boxH, 'L', theme, { stroke: theme.secondary });

    drawArrow(ctx, x1 + boxW, y + boxH / 2, x2, y + boxH / 2, accent);
    drawArrow(ctx, x2 + boxW, y + boxH / 2, x3, y + boxH / 2, accent);
}

function drawGradientStepMini(ctx, rect, theme) {
    const left = rect.x + 8;
    const right = rect.x + rect.width - 8;
    const bottom = rect.y + rect.height - 18;
    const midX = (left + right) / 2;
    const height = rect.height * 0.55;
    const curveY = (x) => {
        const t = (x - midX) / (rect.width * 0.5);
        return bottom - (t * t + 0.2) * height;
    };

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = left; x <= right; x += 2) {
        const y = curveY(x);
        if (x === left) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const pointX = rect.x + rect.width * 0.68;
    const pointY = curveY(pointX);
    drawPoint(ctx, pointX, pointY, theme.success, 5);
    drawArrow(ctx, pointX, pointY, pointX + 24, pointY - 20, theme.danger);
    drawArrow(ctx, pointX, pointY, pointX - 24, pointY + 20, theme.success);
}

function drawScoresMini(ctx, rect, theme, accent) {
    const centerY = rect.y + rect.height / 2;
    const dotGap = 10;
    const dotX = rect.x + 10;
    [-1, 0, 1].forEach((offset) => {
        drawPoint(ctx, dotX, centerY + offset * dotGap, theme.primary, 3.5);
    });
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('x', dotX, centerY + 22);

    const blockW = rect.width * 0.22;
    const blockH = rect.height * 0.5;
    const blockX = rect.x + rect.width * 0.33;
    const blockY = rect.y + rect.height * 0.25;
    drawMiniMatrixBlock(ctx, blockX, blockY, blockW, blockH, 3, 2, 'W', theme, { fill: '#e0f2fe' });

    drawArrow(ctx, dotX + 6, centerY, blockX - 6, centerY, theme.axis);

    const barsRect = {
        x: rect.x + rect.width * 0.68,
        y: rect.y + rect.height * 0.25,
        width: rect.width * 0.24,
        height: rect.height * 0.5
    };
    drawMiniBars(ctx, barsRect, [0.7, 0.45, 0.2], [accent, theme.secondary, theme.warning], theme);
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('z', barsRect.x + barsRect.width / 2, barsRect.y + barsRect.height + 14);
}

function drawSoftmaxMini(ctx, rect, theme) {
    const leftRect = {
        x: rect.x + 6,
        y: rect.y + 12,
        width: rect.width * 0.34,
        height: rect.height - 24
    };
    const rightRect = {
        x: rect.x + rect.width * 0.6,
        y: rect.y + 12,
        width: rect.width * 0.34,
        height: rect.height - 24
    };

    drawMiniBars(ctx, leftRect, [0.8, 0.45, 0.3, 0.2], [theme.grid, theme.grid, theme.grid, theme.grid], theme);
    drawMiniBars(ctx, rightRect, [0.55, 0.2, 0.15, 0.1], [theme.primary, theme.secondary, theme.warning, theme.success], theme);

    drawArrow(ctx, leftRect.x + leftRect.width + 6, rect.y + rect.height / 2, rightRect.x - 6, rect.y + rect.height / 2, theme.axis);
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('softmax', rect.x + rect.width * 0.5, rect.y + rect.height / 2 - 10);
}

function drawCrossEntropyMini(ctx, rect, theme, accent) {
    const barsRect = {
        x: rect.x + 8,
        y: rect.y + 12,
        width: rect.width * 0.6,
        height: rect.height - 24
    };
    const values = [0.6, 0.2, 0.12, 0.08];
    const colors = [accent, theme.grid, theme.grid, theme.grid];
    drawMiniBars(ctx, barsRect, values, colors, theme);

    const lossX = barsRect.x + barsRect.width + 16;
    const lossTop = barsRect.y;
    const lossBottom = barsRect.y + barsRect.height;
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lossX, lossBottom);
    ctx.lineTo(lossX, lossTop);
    ctx.stroke();

    const loss = Math.min(1, Math.max(0, -Math.log(values[0]) / 3));
    const lossY = lossBottom - loss * (lossBottom - lossTop);
    ctx.fillStyle = theme.danger;
    ctx.beginPath();
    ctx.arc(lossX, lossY, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('loss', lossX, lossBottom + 12);
}

function drawMatrixForwardMini(ctx, rect, theme) {
    const blockW = rect.width * 0.22;
    const blockH = rect.height * 0.6;
    const gap = rect.width * 0.08;
    const y = rect.y + rect.height * 0.2;
    const x1 = rect.x + gap;
    const x2 = x1 + blockW + gap;
    const x3 = x2 + blockW + gap;

    drawMiniMatrixBlock(ctx, x1, y, blockW, blockH, 3, 3, 'X', theme, { fill: '#e0f2fe' });
    drawMiniMatrixBlock(ctx, x2, y, blockW, blockH, 3, 2, 'W', theme, { fill: '#bbf7d0' });
    drawMiniMatrixBlock(ctx, x3, y, blockW, blockH, 3, 2, 'Y', theme, { fill: '#fecdd3' });

    drawArrow(ctx, x1 + blockW, y + blockH / 2, x2, y + blockH / 2, theme.axis);
    drawArrow(ctx, x2 + blockW, y + blockH / 2, x3, y + blockH / 2, theme.axis);
}

function drawGradXMini(ctx, rect, theme) {
    const blockW = rect.width * 0.25;
    const blockH = rect.height * 0.5;
    const gap = rect.width * 0.08;
    const y = rect.y + rect.height * 0.25;
    const x1 = rect.x + gap;
    const x2 = x1 + blockW + gap;
    const x3 = x2 + blockW + gap;

    drawMiniMatrixBlock(ctx, x1, y, blockW, blockH, 3, 2, 'dY', theme, { fill: '#fde68a' });
    drawMiniMatrixBlock(ctx, x2, y, blockW, blockH, 2, 3, 'W^T', theme, { fill: '#bbf7d0' });
    drawMiniMatrixBlock(ctx, x3, y, blockW, blockH, 3, 3, 'dX', theme, { fill: '#e0f2fe' });

    drawArrow(ctx, x1 + blockW, y + blockH / 2, x2, y + blockH / 2, theme.axis);
    drawArrow(ctx, x2 + blockW, y + blockH / 2, x3, y + blockH / 2, theme.axis);
}

function drawGradWMini(ctx, rect, theme) {
    const blockW = rect.width * 0.26;
    const blockH = rect.height * 0.45;
    const xLeft = rect.x + rect.width * 0.1;
    const xRight = rect.x + rect.width * 0.6;
    const yTop = rect.y + rect.height * 0.18;
    const yBottom = rect.y + rect.height * 0.55;

    drawMiniMatrixBlock(ctx, xLeft, yBottom, blockW, blockH, 3, 3, 'X^T', theme, { fill: '#e0f2fe' });
    drawMiniMatrixBlock(ctx, xLeft, yTop, blockW, blockH, 3, 2, 'dY', theme, { fill: '#fde68a' });
    drawMiniMatrixBlock(ctx, xRight, rect.y + rect.height * 0.35, blockW, blockH, 2, 2, 'dW', theme, { fill: '#bbf7d0' });

    drawArrow(ctx, xLeft + blockW, yTop + blockH / 2, xRight, rect.y + rect.height * 0.45, theme.axis);
    drawArrow(ctx, xLeft + blockW, yBottom + blockH / 2, xRight, rect.y + rect.height * 0.55, theme.axis);
}

// ============================================
// Vector Storyboard Scenes
// ============================================
function drawVectorArrowScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.62 };
    const scale = 38;
    const size = 5;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const point = { x: 2, y: 1 };
    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const end = mapToCanvas(point, origin, scale);
    drawArrow(ctx, start.x, start.y, end.x, end.y, theme.primary);
    drawPoint(ctx, end.x, end.y, theme.secondary, 5);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('(2,1)', end.x + 6, end.y - 8);
}

function drawDotProductScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.62 };
    const scale = 38;
    const size = 5;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const xVec = { x: 2, y: 1 };
    const wVec = { x: 3.2, y: 0 };
    const projection = { x: 2, y: 0 };

    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const xEnd = mapToCanvas(xVec, origin, scale);
    const wEnd = mapToCanvas(wVec, origin, scale);
    const projEnd = mapToCanvas(projection, origin, scale);

    drawArrow(ctx, start.x, start.y, wEnd.x, wEnd.y, theme.secondary);
    drawArrow(ctx, start.x, start.y, xEnd.x, xEnd.y, theme.primary);
    drawDashedLine(ctx, xEnd.x, xEnd.y, projEnd.x, projEnd.y, theme.warning);
    drawArrow(ctx, start.x, start.y, projEnd.x, projEnd.y, theme.success);
    drawPoint(ctx, projEnd.x, projEnd.y, theme.success, 4);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('shadow', projEnd.x + 6, projEnd.y + 12);
    ctx.fillText('w', wEnd.x - 12, wEnd.y - 10);
    ctx.fillText('x', xEnd.x + 6, xEnd.y - 8);
}

function drawNormScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.6 };
    const scale = 30;
    const size = 7;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const xVec = { x: 3, y: 4 };
    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const end = mapToCanvas(xVec, origin, scale);

    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = theme.success;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 5 * scale, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    drawArrow(ctx, start.x, start.y, end.x, end.y, theme.primary);
    drawPoint(ctx, end.x, end.y, theme.secondary, 5);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('||x|| = 5', origin.x + 10, origin.y - 5 * scale - 12);
}

function drawCosineScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.62 };
    const scale = 45;
    const size = 4;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const shortVec = { x: 1, y: 1 };
    const longVec = { x: 2, y: 2 };
    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const shortEnd = mapToCanvas(shortVec, origin, scale);
    const longEnd = mapToCanvas(longVec, origin, scale);

    drawArrow(ctx, start.x, start.y, longEnd.x, longEnd.y, theme.primary);
    drawArrow(ctx, start.x, start.y, shortEnd.x, shortEnd.y, theme.secondary);
    drawPoint(ctx, longEnd.x, longEnd.y, theme.primary, 4);
    drawPoint(ctx, shortEnd.x, shortEnd.y, theme.secondary, 4);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('same direction', origin.x + 10, origin.y - 20);
}

function drawDistanceScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.45, y: canvas.height * 0.68 };
    const scale = 28;
    const size = 8;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const pointA = { x: 1, y: 2 };
    const pointB = { x: 4, y: 6 };
    const a = mapToCanvas(pointA, origin, scale);
    const b = mapToCanvas(pointB, origin, scale);

    ctx.strokeStyle = theme.warning;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    drawPoint(ctx, a.x, a.y, theme.primary, 5);
    drawPoint(ctx, b.x, b.y, theme.secondary, 5);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('x', a.x - 12, a.y + 14);
    ctx.fillText('y', b.x + 6, b.y - 6);
}

function drawBasisScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.62 };
    const scale = 34;
    const size = 5;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const e1 = { x: 1, y: 0 };
    const e2 = { x: 0, y: 1 };
    const vector = { x: 2, y: 1.5 };

    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const e1End = mapToCanvas(e1, origin, scale);
    const e2End = mapToCanvas(e2, origin, scale);
    const vEnd = mapToCanvas(vector, origin, scale);
    const xComp = mapToCanvas({ x: vector.x, y: 0 }, origin, scale);
    const yComp = mapToCanvas({ x: 0, y: vector.y }, origin, scale);

    drawArrow(ctx, start.x, start.y, e1End.x, e1End.y, theme.secondary);
    drawArrow(ctx, start.x, start.y, e2End.x, e2End.y, theme.warning);
    drawArrow(ctx, start.x, start.y, vEnd.x, vEnd.y, theme.primary);

    drawDashedLine(ctx, vEnd.x, vEnd.y, xComp.x, xComp.y, theme.grid);
    drawDashedLine(ctx, vEnd.x, vEnd.y, yComp.x, yComp.y, theme.grid);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('e1', e1End.x + 6, e1End.y - 6);
    ctx.fillText('e2', e2End.x + 6, e2End.y - 6);
    ctx.fillText('x', vEnd.x + 6, vEnd.y - 6);
    ctx.fillText('x = 2e1 + 1.5e2', origin.x - 70, origin.y - 120);
}

function drawProjectionScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.62 };
    const scale = 32;
    const size = 7;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const xVec = { x: 3, y: 4 };
    const uVec = { x: 4, y: 0 };
    const projection = { x: 3, y: 0 };
    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const xEnd = mapToCanvas(xVec, origin, scale);
    const uEnd = mapToCanvas(uVec, origin, scale);
    const projEnd = mapToCanvas(projection, origin, scale);

    drawArrow(ctx, start.x, start.y, uEnd.x, uEnd.y, theme.secondary);
    drawArrow(ctx, start.x, start.y, xEnd.x, xEnd.y, theme.primary);
    drawDashedLine(ctx, xEnd.x, xEnd.y, projEnd.x, projEnd.y, theme.warning);
    drawArrow(ctx, start.x, start.y, projEnd.x, projEnd.y, theme.success);
    drawPoint(ctx, projEnd.x, projEnd.y, theme.success, 4);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('proj', projEnd.x + 6, projEnd.y + 12);
}

function drawGradientScene(ctx, canvas) {
    const theme = getThemeColors();
    const center = { x: canvas.width * 0.5, y: canvas.height * 0.56 };
    const rings = [
        { rx: 150, ry: 95 },
        { rx: 110, ry: 70 },
        { rx: 75, ry: 45 },
        { rx: 40, ry: 25 }
    ];

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    rings.forEach(ring => {
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, ring.rx, ring.ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
    });

    const point = { x: center.x + 95, y: center.y - 45 };
    const grad = { x: point.x - center.x, y: point.y - center.y };
    const length = Math.hypot(grad.x, grad.y) || 1;
    const unit = { x: grad.x / length, y: grad.y / length };
    const gradEnd = { x: point.x + unit.x * 50, y: point.y + unit.y * 50 };
    const stepEnd = { x: point.x - unit.x * 50, y: point.y - unit.y * 50 };

    drawPoint(ctx, point.x, point.y, theme.primary, 6);
    drawArrow(ctx, point.x, point.y, gradEnd.x, gradEnd.y, theme.danger);
    drawArrow(ctx, point.x, point.y, stepEnd.x, stepEnd.y, theme.success);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('grad', gradEnd.x + 6, gradEnd.y);
    ctx.fillText('step', stepEnd.x + 6, stepEnd.y);
}

function drawRegularizationScene(ctx, canvas) {
    const theme = getThemeColors();
    const center = { x: canvas.width * 0.5, y: canvas.height * 0.6 };
    const radius = 90;

    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.strokeStyle = theme.warning;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center.x + radius, center.y);
    ctx.lineTo(center.x, center.y - radius);
    ctx.lineTo(center.x - radius, center.y);
    ctx.lineTo(center.x, center.y + radius);
    ctx.closePath();
    ctx.stroke();

    const target = { x: center.x + 120, y: center.y - 70 };
    drawPoint(ctx, target.x, target.y, theme.primary, 6);
    drawArrow(ctx, target.x, target.y, center.x, center.y, theme.success);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('L2', center.x + radius + 8, center.y - 4);
    ctx.fillText('L1', center.x + 8, center.y - radius - 6);
}

function drawAttentionScene(ctx, canvas) {
    const theme = getThemeColors();
    const origin = { x: canvas.width * 0.5, y: canvas.height * 0.6 };
    const scale = 38;
    const size = 4.5;
    drawCoordinatePlane(ctx, origin, scale, size, theme);

    const q = { x: 2, y: 1 };
    const k1 = { x: 1.8, y: 0.9 };
    const k2 = { x: -1.2, y: 1.6 };
    const k3 = { x: -1.6, y: -0.6 };
    const out = { x: 1.6, y: 0.85 };

    const start = mapToCanvas({ x: 0, y: 0 }, origin, scale);
    const qEnd = mapToCanvas(q, origin, scale);
    const k1End = mapToCanvas(k1, origin, scale);
    const k2End = mapToCanvas(k2, origin, scale);
    const k3End = mapToCanvas(k3, origin, scale);
    const outEnd = mapToCanvas(out, origin, scale);

    drawArrow(ctx, start.x, start.y, k2End.x, k2End.y, theme.secondary);
    drawArrow(ctx, start.x, start.y, k3End.x, k3End.y, theme.secondary);
    drawArrow(ctx, start.x, start.y, k1End.x, k1End.y, theme.warning);
    drawArrow(ctx, start.x, start.y, qEnd.x, qEnd.y, theme.primary);
    drawArrow(ctx, start.x, start.y, outEnd.x, outEnd.y, theme.success);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.fillText('q', qEnd.x + 6, qEnd.y - 6);
    ctx.fillText('out', outEnd.x + 6, outEnd.y + 8);
}

function drawVectorStatsScene(ctx, canvas) {
    const theme = getThemeColors();
    const padding = 18;
    const gap = 14;
    const panelWidth = (canvas.width - padding * 2 - gap * 2) / 3;
    const panelHeight = 170;
    const panelY = 82;

    const points = [
        { x: -0.8, y: -0.2 },
        { x: -0.6, y: -0.1 },
        { x: -0.3, y: 0.05 },
        { x: 0.05, y: 0.2 },
        { x: 0.35, y: 0.35 },
        { x: 0.6, y: 0.55 },
        { x: 0.2, y: -0.1 },
        { x: -0.1, y: 0.0 }
    ];
    const mean = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
    mean.x /= points.length;
    mean.y /= points.length;

    const panels = [
        { label: '1. Center data', type: 'mean' },
        { label: '2. Covariance', type: 'cov' },
        { label: '3. Precision', type: 'prec' }
    ];

    panels.forEach((panel, index) => {
        const rect = {
            x: padding + index * (panelWidth + gap),
            y: panelY,
            width: panelWidth,
            height: panelHeight
        };
        const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme);
        drawMiniScatter(ctx, origin, scale, points, theme.primary, 3);

        if (panel.type === 'mean') {
            drawMiniVector(ctx, origin, scale, mean, theme.secondary);
            const meanPoint = mapToCanvas(mean, origin, scale);
            drawPoint(ctx, meanPoint.x, meanPoint.y, theme.secondary, 4);
        }

        if (panel.type === 'cov') {
            ctx.save();
            ctx.strokeStyle = theme.primary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(origin.x, origin.y, scale * 0.75, scale * 0.35, Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (panel.type === 'prec') {
            ctx.save();
            ctx.strokeStyle = theme.secondary;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(origin.x, origin.y, scale * 0.35, scale * 0.75, -Math.PI / 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        drawMiniLabel(ctx, rect, panel.label, theme);
    });

    const arrowY = panelY + panelHeight / 2;
    for (let i = 0; i < 2; i++) {
        const startX = padding + (i + 1) * panelWidth + i * gap + 6;
        const endX = startX + gap - 12;
        drawArrow(ctx, startX, arrowY, endX, arrowY, theme.axis);
    }
}

function drawVectorCardProjection(ctx, canvas, theme) {
    const rect = { x: 12, y: 12, width: canvas.width - 24, height: canvas.height - 24 };
    const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme, { background: false });
    const uVec = { x: 1, y: 0 };
    const xVec = { x: 0.8, y: 0.6 };
    const proj = { x: xVec.x, y: 0 };

    drawMiniVector(ctx, origin, scale, uVec, theme.secondary);
    drawMiniVector(ctx, origin, scale, xVec, theme.primary);
    drawMiniVector(ctx, origin, scale, proj, theme.success);

    const xEnd = mapToCanvas(xVec, origin, scale);
    const projEnd = mapToCanvas(proj, origin, scale);
    drawDashedLine(ctx, xEnd.x, xEnd.y, projEnd.x, projEnd.y, theme.warning);
}

function drawVectorCardNorm(ctx, canvas, theme) {
    const rect = { x: 12, y: 12, width: canvas.width - 24, height: canvas.height - 24 };
    const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme, { background: false });
    const vec = { x: 0.6, y: 0.8 };
    drawMiniVector(ctx, origin, scale, vec, theme.primary);
    ctx.save();
    ctx.strokeStyle = theme.success;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, scale * 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawVectorCardSubspace(ctx, canvas, theme) {
    const rect = { x: 12, y: 12, width: canvas.width - 24, height: canvas.height - 24 };
    const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme, { background: false });
    const b1 = { x: 0.9, y: 0.2 };
    const b2 = { x: 0.2, y: 0.9 };
    const corner = [
        { x: 0, y: 0 },
        b1,
        { x: b1.x + b2.x, y: b1.y + b2.y },
        b2
    ].map(point => mapToCanvas(point, origin, scale));

    ctx.save();
    ctx.fillStyle = theme.primary;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    corner.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    drawMiniVector(ctx, origin, scale, b1, theme.secondary);
    drawMiniVector(ctx, origin, scale, b2, theme.warning);
}

function drawVectorCardGradient(ctx, canvas, theme) {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const rings = [
        { rx: canvas.width * 0.32, ry: canvas.height * 0.2 },
        { rx: canvas.width * 0.22, ry: canvas.height * 0.14 },
        { rx: canvas.width * 0.14, ry: canvas.height * 0.09 }
    ];

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 1.5;
    rings.forEach(ring => {
        ctx.beginPath();
        ctx.ellipse(center.x, center.y, ring.rx, ring.ry, 0, 0, Math.PI * 2);
        ctx.stroke();
    });

    const point = { x: center.x + rings[0].rx * 0.55, y: center.y - rings[0].ry * 0.55 };
    drawPoint(ctx, point.x, point.y, theme.primary, 4);
    drawArrow(ctx, point.x, point.y, point.x + 26, point.y - 18, theme.danger);
}

function drawVectorCardStats(ctx, canvas, theme) {
    const rect = { x: 12, y: 12, width: canvas.width - 24, height: canvas.height - 24 };
    const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme, { background: false });
    const points = [
        { x: -0.7, y: -0.2 },
        { x: -0.4, y: 0.0 },
        { x: -0.1, y: 0.15 },
        { x: 0.2, y: 0.25 },
        { x: 0.5, y: 0.4 },
        { x: 0.3, y: -0.05 }
    ];
    const mean = points.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 });
    mean.x /= points.length;
    mean.y /= points.length;

    drawMiniScatter(ctx, origin, scale, points, theme.primary, 3);
    drawMiniVector(ctx, origin, scale, mean, theme.secondary);
    const meanPoint = mapToCanvas(mean, origin, scale);
    drawPoint(ctx, meanPoint.x, meanPoint.y, theme.secondary, 4);
    ctx.save();
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(origin.x, origin.y, scale * 0.7, scale * 0.35, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

function drawVectorCardRegularization(ctx, canvas, theme) {
    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const radius = Math.min(canvas.width, canvas.height) * 0.3;

    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = theme.warning;
    ctx.beginPath();
    ctx.moveTo(center.x + radius, center.y);
    ctx.lineTo(center.x, center.y - radius);
    ctx.lineTo(center.x - radius, center.y);
    ctx.lineTo(center.x, center.y + radius);
    ctx.closePath();
    ctx.stroke();
}

function drawVectorCardAttention(ctx, canvas, theme) {
    const rect = { x: 12, y: 12, width: canvas.width - 24, height: canvas.height - 24 };
    const { origin, scale } = drawMiniAxisPanel(ctx, rect, theme, { background: false });
    const q = { x: 0.8, y: 0.6 };
    const k1 = { x: 0.7, y: 0.4 };
    const k2 = { x: -0.6, y: 0.7 };
    const k3 = { x: -0.4, y: -0.5 };
    const out = { x: 0.55, y: 0.35 };

    drawMiniVector(ctx, origin, scale, k2, theme.secondary);
    drawMiniVector(ctx, origin, scale, k3, theme.secondary);
    drawMiniVector(ctx, origin, scale, k1, theme.warning);
    drawMiniVector(ctx, origin, scale, q, theme.primary);
    drawMiniVector(ctx, origin, scale, out, theme.success);
}

function drawVectorCardVisuals() {
    const canvases = document.querySelectorAll('.vector-card-canvas');
    if (!canvases.length) return;
    const theme = getThemeColors();
    const drawers = {
        projection: drawVectorCardProjection,
        norm: drawVectorCardNorm,
        subspace: drawVectorCardSubspace,
        gradient: drawVectorCardGradient,
        stats: drawVectorCardStats,
        regularization: drawVectorCardRegularization,
        attention: drawVectorCardAttention
    };

    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const draw = drawers[canvas.dataset.vectorCard];
        if (draw) {
            draw(ctx, canvas, theme);
        }
    });
}

const vectorScenes = [
    {
        title: 'Scene 1: Projections and orthogonality',
        visual: 'Drop a perpendicular from x to the line spanned by u. The shadow is the projection.',
        example: 'If \\(x = [3, 4]\\), \\(u = [4, 0]\\), then \\(\\mathrm{proj}_u(x) = [3, 0]\\).',
        intuition: 'Orthogonal axes separate coordinates cleanly for PCA/SVD.',
        math: '\\(\\mathrm{proj}_u(x) = \\frac{x \\cdot u}{u \\cdot u}u\\)',
        draw: drawProjectionScene
    },
    {
        title: 'Scene 2: Norms and normalization',
        visual: 'Modulus (length) is the distance from the origin. Normalization keeps direction but fixes scale.',
        example: 'If \\(x = [3, 4]\\), then modulus \\(\\lVert x \\rVert = 5\\) and \\(\\hat{x} = [0.6, 0.8]\\).',
        intuition: 'Cosine similarity compares directions after normalization.',
        math: '\\(\\lVert x \\rVert_2 = \\sqrt{x_1^2 + x_2^2}\\) (modulus), \\(\\hat{x} = x / \\lVert x \\rVert\\)',
        draw: drawNormScene
    },
    {
        title: 'Scene 3: Subspaces, basis, rank',
        visual: 'Two independent basis vectors span a plane; their combinations fill the subspace.',
        example: '\\(x = 2e_1 + 1.5e_2\\) in 2D.',
        intuition: 'Rank counts how many independent directions a matrix can reach.',
        math: '\\(x = \\sum_i \\alpha_i b_i\\), \\(\\mathrm{rank}(A) = \\dim(\\mathrm{span})\\)',
        draw: drawBasisScene
    },
    {
        title: 'Scene 4: Gradients, Jacobians, Hessians',
        visual: 'Gradients point uphill. The Jacobian maps tiny input nudges to output nudges; the Hessian captures curvature.',
        example: 'If \\(f: \\mathbb{R}^2 \\to \\mathbb{R}^2\\), then \\(J\\) is a 2x2 matrix. For a loss \\(L\\), \\(H\\) is also 2x2.',
        intuition: 'J is the best local linear map; H eigenvalues show bowl (+), peak (-), or saddle (mixed) curvature.',
        math: '\\(df \\approx J\\,dx\\)<br>\\(J_{ij}=\\partial f_i/\\partial x_j\\)<br>\\(H = \\nabla^2 L\\)<br>\\(\\Delta x = -H^{-1}\\nabla L\\)',
        draw: drawGradientScene
    },
    {
        title: 'Scene 5: Vector statistics',
        visual: 'Step 1: center the cloud. Step 2: fit the covariance ellipse. Step 3: invert to get precision.',
        example: 'Mean \\(\\mu\\) anchors the cloud; covariance \\(\\Sigma\\) sets its stretch.',
        intuition: 'Precision shrinks wide directions and highlights tight ones.',
        math: '\\(\\mu = \\frac{1}{n}\\sum x_i\\)<br>\\(\\Sigma = \\frac{1}{n}\\sum (x_i-\\mu)(x_i-\\mu)^T\\)<br>\\(\\Sigma^{-1}\\)',
        draw: drawVectorStatsScene
    },
    {
        title: 'Scene 6: Regularization geometry',
        visual: 'Data-fit pushes weights somewhere. Regularization adds a pull back toward the origin.',
        example: 'L2 has circular contours; L1 has diamond contours that encourage zeros.',
        intuition: 'Where the contour touches the constraint explains sparsity in L1.',
        math: '\\(L + \\lambda\\lVert w \\rVert_2^2\\)<br>\\(L + \\lambda\\lVert w \\rVert_1\\)',
        draw: drawRegularizationScene
    },
    {
        title: 'Scene 7: Attention via dot products',
        visual: 'A query arrow compares to key arrows. Softmax turns scores into weights, then you average the value arrows.',
        example: 'If scores are \\(s = [2, 1, 0]\\), the largest weight leans output toward \\(v_1\\).',
        intuition: 'Attention is a weighted sum that points where alignment is strongest.',
        math: '\\(s_i = \\frac{q \\cdot k_i}{\\sqrt{d}}\\), \\(\\alpha = \\mathrm{softmax}(s)\\), \\(\\mathrm{out} = \\sum_i \\alpha_i v_i\\)',
        draw: drawAttentionScene
    }
];

let vectorSceneIndex = 0;

function drawVectorSceneCanvas() {
    const canvas = document.getElementById('vectorSceneCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scene = vectorScenes[vectorSceneIndex];
    if (scene && scene.draw) {
        scene.draw(ctx, canvas);
    }
}

function updateVectorScenePanel() {
    const panel = document.getElementById('vectorScenePanel');
    if (!panel) return;
    const scene = vectorScenes[vectorSceneIndex];
    if (!scene) return;

    const badge = document.getElementById('vectorSceneBadge');
    const title = document.getElementById('vectorSceneTitle');
    const visual = document.getElementById('vectorSceneVisual');
    const example = document.getElementById('vectorSceneExample');
    const intuition = document.getElementById('vectorSceneIntuition');
    const math = document.getElementById('vectorSceneMath');

    if (badge) badge.textContent = `Scene ${vectorSceneIndex + 1} of ${vectorScenes.length}`;
    if (title) title.textContent = scene.title;
    if (math) math.innerHTML = scene.math;
    if (visual) visual.innerHTML = scene.visual;
    if (example) example.innerHTML = scene.example;
    if (intuition) intuition.innerHTML = scene.intuition;

    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([panel]);
    }

    drawVectorSceneCanvas();
}

function setupVectorScenes() {
    const prevBtn = document.getElementById('vectorPrevScene');
    const nextBtn = document.getElementById('vectorNextScene');
    if (!prevBtn || !nextBtn) return;

    const updateScene = (direction) => {
        const total = vectorScenes.length;
        vectorSceneIndex = (vectorSceneIndex + direction + total) % total;
        updateVectorScenePanel();
    };

    prevBtn.addEventListener('click', () => updateScene(-1));
    nextBtn.addEventListener('click', () => updateScene(1));

    updateVectorScenePanel();
}

function drawLinearAlgebraScene(ctx, canvas) {
    const theme = getThemeColors();
    drawFormulaCards(ctx, canvas, [
        {
            title: 'h = Wx + b',
            colorKey: 'primary',
            draw: drawAffineMini
        },
        {
            title: 'a = ReLU(h)',
            colorKey: 'secondary',
            draw: drawReluMini
        }
    ], theme);
}

function drawCalculusScene(ctx, canvas) {
    const theme = getThemeColors();
    drawFormulaCards(ctx, canvas, [
        {
            title: 'y = g(x) -> L = f(y)',
            colorKey: 'secondary',
            draw: drawChainFlowMini
        },
        {
            title: 'dL/dx = dL/dy * dy/dx',
            colorKey: 'secondary',
            draw: drawChainRuleMini
        }
    ], theme);
}

function drawOptimizationScene(ctx, canvas) {
    const theme = getThemeColors();
    drawFormulaCards(ctx, canvas, [
        {
            title: 'W = W - eta (yhat - y) x^T',
            colorKey: 'success',
            draw: drawGradientStepMini
        }
    ], theme);
}

function drawProbabilityScene(ctx, canvas) {
    const theme = getThemeColors();
    drawFormulaCards(ctx, canvas, [
        {
            title: 'z = Wx + b',
            colorKey: 'primary',
            draw: drawScoresMini
        },
        {
            title: 'yhat = softmax(z)',
            colorKey: 'warning',
            draw: drawSoftmaxMini
        },
        {
            title: 'L = -sum y log yhat',
            colorKey: 'danger',
            draw: drawCrossEntropyMini
        }
    ], theme);
}

function drawMatrixBlock(ctx, x, y, width, height, rows, cols, color, label) {
    const theme = getThemeColors();
    drawRoundedRect(ctx, x, y, width, height, 12);
    ctx.fillStyle = color;
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = theme.grid;
    for (let r = 1; r < rows; r++) {
        ctx.beginPath();
        ctx.moveTo(x, y + (height / rows) * r);
        ctx.lineTo(x + width, y + (height / rows) * r);
        ctx.stroke();
    }
    for (let c = 1; c < cols; c++) {
        ctx.beginPath();
        ctx.moveTo(x + (width / cols) * c, y);
        ctx.lineTo(x + (width / cols) * c, y + height);
        ctx.stroke();
    }

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height + 16);
}

function drawMatrixCalcScene(ctx, canvas) {
    const theme = getThemeColors();
    drawFormulaCards(ctx, canvas, [
        {
            title: '1) Y = XW',
            colorKey: 'primary',
            draw: drawMatrixForwardMini
        },
        {
            title: '2) dL/dX = dL/dY W^T',
            colorKey: 'secondary',
            draw: drawGradXMini
        },
        {
            title: '3) dL/dW = X^T dL/dY',
            colorKey: 'success',
            draw: drawGradWMini
        }
    ], theme);
}

function drawFundamentalsCanvas(topicId) {
    const canvas = document.getElementById('fundamentalsCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (topicId === 'linear') {
        drawLinearAlgebraScene(ctx, canvas);
    } else if (topicId === 'calculus') {
        drawCalculusScene(ctx, canvas);
    } else if (topicId === 'optimization') {
        drawOptimizationScene(ctx, canvas);
    } else if (topicId === 'probability') {
        drawProbabilityScene(ctx, canvas);
    } else if (topicId === 'matrix') {
        drawMatrixCalcScene(ctx, canvas);
    }
}

function setActiveFundamental(topicId) {
    const index = fundamentalsTopics.findIndex(topic => topic.id === topicId);
    if (index === -1) return;

    fundamentalsIndex = index;
    activeFundamentalId = topicId;

    document.querySelectorAll('.concept-tab').forEach(tab => {
        const isActive = tab.dataset.topic === topicId;
        tab.classList.toggle('is-active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.concept-panel').forEach(panel => {
        const isActive = panel.dataset.topic === topicId;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    drawFundamentalsCanvas(topicId);
}

function cycleFundamentals() {
    const nextIndex = (fundamentalsIndex + 1) % fundamentalsTopics.length;
    setActiveFundamental(fundamentalsTopics[nextIndex].id);
}

function initFundamentals() {
    const canvas = document.getElementById('fundamentalsCanvas');
    if (!canvas) return;

    document.querySelectorAll('.concept-tab').forEach(tab => {
        tab.addEventListener('click', () => setActiveFundamental(tab.dataset.topic));
    });

    setActiveFundamental(fundamentalsTopics[0].id);
}

function refreshAllVisuals() {
    updateVectorPlayground();
    drawVectorSceneCanvas();
    drawVectorCardVisuals();
    drawVectorDbCanvas();
    drawMatrixCanvas();
    drawMatrixDeepCanvas();
    drawProbabilityCanvas();
    drawProbabilityCardVisuals();
    drawProbabilityVennCanvas();
    drawSpamFilterCanvas();
    drawLikelihoodCanvas();
    drawSampleSpaceCanvas();
    drawHmmCanvas();
    drawKalmanCanvas();
    drawMlLifecycleCanvas();
    drawMlAlgoCanvas();
    drawGradientCanvas();
    drawActivationFunctions();
    drawNeuralNetwork();
    drawNeuronCanvas();
    drawDigitLab();
    drawDeepNetwork();
    drawCnnCanvas();
    drawRnnCanvas();
    drawLstmCanvas();
    drawTransformerCanvas();
    drawTransformerAdvancedCanvas();
    drawTransformerAdvancedOverviewCanvas();
    drawBackpropStep();
    drawFundamentalsCanvas(activeFundamentalId || fundamentalsTopics[0].id);
    drawBanditCharts();
    drawGridworld();
    drawGridworldChart();
    drawMonteCarlo();
    drawTdCharts();
    drawControlCharts();
}

function setupVectorControls() {
    const inputs = {
        ax: document.getElementById('vecAx'),
        ay: document.getElementById('vecAy'),
        bx: document.getElementById('vecBx'),
        by: document.getElementById('vecBy'),
        scale: document.getElementById('vecScale')
    };

    if (!inputs.ax) return;

    const operationButtons = document.querySelectorAll('[data-vector-op]');
    operationButtons.forEach(button => {
        button.addEventListener('click', () => {
            setVectorOperation(button.dataset.vectorOp);
        });
    });

    const labels = {
        ax: document.getElementById('vecAxVal'),
        ay: document.getElementById('vecAyVal'),
        bx: document.getElementById('vecBxVal'),
        by: document.getElementById('vecByVal'),
        scale: document.getElementById('vecScaleVal')
    };

    const update = () => {
        vectorState.ax = parseFloat(inputs.ax.value);
        vectorState.ay = parseFloat(inputs.ay.value);
        vectorState.bx = parseFloat(inputs.bx.value);
        vectorState.by = parseFloat(inputs.by.value);
        vectorState.scale = parseFloat(inputs.scale.value);

        if (labels.ax) labels.ax.textContent = vectorState.ax.toFixed(1);
        if (labels.ay) labels.ay.textContent = vectorState.ay.toFixed(1);
        if (labels.bx) labels.bx.textContent = vectorState.bx.toFixed(1);
        if (labels.by) labels.by.textContent = vectorState.by.toFixed(1);
        if (labels.scale) labels.scale.textContent = vectorState.scale.toFixed(1);

        updateVectorPlayground();
    };

    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', update);
        }
    });

    update();
    setVectorOperation(vectorState.operation);
}

function setupVectorModes() {
    const modeButtons = document.querySelectorAll('[data-vector-mode]');
    const panels = document.querySelectorAll('.vector-mode-panel');
    if (!modeButtons.length || !panels.length) return;

    const setMode = (mode) => {
        panels.forEach(panel => {
            panel.classList.toggle('is-active', panel.dataset.vectorMode === mode);
        });
        modeButtons.forEach(button => {
            button.classList.toggle('is-active', button.dataset.vectorMode === mode);
        });
        if (mode === 'deep') {
            updateVectorScenePanel();
        } else {
            updateVectorPlayground();
        }
    };

    modeButtons.forEach(button => {
        button.addEventListener('click', () => setMode(button.dataset.vectorMode));
    });

    setMode('basic');
}

const vectorDbModes = [
    { id: 'pipeline', label: 'Indexing pipeline' },
    { id: 'hnsw', label: 'HNSW graph' },
    { id: 'ivf-pq', label: 'IVF + PQ' },
    { id: 'retrieval', label: 'Search + retrieval' }
];

let activeVectorDbMode = vectorDbModes[0].id;

function drawVectorDbBox(ctx, x, y, width, height, label, fill, theme) {
    drawRoundedRect(ctx, x, y, width, height, 10);
    ctx.fillStyle = fill;
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    const lines = label.split('\n');
    const lineHeight = 12;
    const startY = y + height / 2 - (lines.length - 1) * lineHeight / 2;
    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((line, index) => {
        ctx.fillText(line, x + width / 2, startY + index * lineHeight);
    });
}

function drawVectorDbNode(ctx, x, y, radius, fill, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawVectorDbDiamond(ctx, x, y, size, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

function drawVectorDbPipeline(ctx, canvas, theme) {
    const boxWidth = 88;
    const boxHeight = 38;
    const gap = 14;
    const totalWidth = boxWidth * 4 + gap * 3;
    const startX = (canvas.width - totalWidth) / 2;
    const startY = 70;

    const steps = [
        { label: 'Docs', color: theme.primary },
        { label: 'Chunker', color: theme.secondary },
        { label: 'Embed\nvectors', color: theme.success },
        { label: 'Vector\nindex', color: theme.warning }
    ];

    steps.forEach((step, index) => {
        const x = startX + index * (boxWidth + gap);
        drawVectorDbBox(ctx, x, startY, boxWidth, boxHeight, step.label, step.color, theme);
        if (index < steps.length - 1) {
            drawArrow(
                ctx,
                x + boxWidth + 2,
                startY + boxHeight / 2,
                x + boxWidth + gap - 2,
                startY + boxHeight / 2,
                theme.axis
            );
        }
    });

    const lastX = startX + (boxWidth + gap) * (steps.length - 1);
    const metaWidth = 78;
    const metaHeight = 22;
    const metaX = lastX + boxWidth / 2 - metaWidth / 2;
    const metaY = startY + boxHeight + 18;
    drawRoundedRect(ctx, metaX, metaY, metaWidth, metaHeight, 8);
    ctx.fillStyle = theme.panel;
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 1.2;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('metadata', metaX + metaWidth / 2, metaY + metaHeight / 2);

    drawArrow(
        ctx,
        lastX + boxWidth / 2,
        startY + boxHeight,
        lastX + boxWidth / 2,
        metaY,
        theme.axis
    );
}

function drawVectorDbHnsw(ctx, canvas, theme) {
    const upperNodes = [
        { x: 110, y: 60 },
        { x: 210, y: 40 },
        { x: 320, y: 70 },
        { x: 260, y: 110 }
    ];
    const lowerNodes = [
        { x: 70, y: 200 },
        { x: 140, y: 170 },
        { x: 210, y: 190 },
        { x: 280, y: 170 },
        { x: 350, y: 210 },
        { x: 120, y: 240 },
        { x: 230, y: 240 },
        { x: 310, y: 250 }
    ];

    const drawEdges = (nodes, edges, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        edges.forEach(([a, b]) => {
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.stroke();
        });
    };

    drawEdges(upperNodes, [[0, 1], [1, 2], [1, 3], [0, 3], [2, 3]], theme.grid);
    drawEdges(lowerNodes, [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [2, 6], [3, 7], [5, 6], [6, 7]], theme.grid);

    upperNodes.forEach((node, index) => {
        const isHighlight = index === 0;
        drawVectorDbNode(ctx, node.x, node.y, 9, isHighlight ? theme.primary : theme.panel, theme.axis);
    });

    lowerNodes.forEach((node, index) => {
        const isHighlight = index === 1 || index === 2;
        drawVectorDbNode(ctx, node.x, node.y, 8, isHighlight ? theme.success : theme.panel, theme.axis);
    });

    const query = { x: 45, y: 120 };
    drawVectorDbDiamond(ctx, query.x, query.y, 8, theme.secondary, theme.axis);
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('query', query.x + 12, query.y);

    drawArrow(ctx, query.x + 6, query.y - 8, upperNodes[0].x - 8, upperNodes[0].y + 8, theme.secondary);
    drawArrow(ctx, upperNodes[0].x + 6, upperNodes[0].y + 6, lowerNodes[1].x - 6, lowerNodes[1].y - 6, theme.success);
    drawArrow(ctx, lowerNodes[1].x + 8, lowerNodes[1].y + 4, lowerNodes[2].x - 8, lowerNodes[2].y + 2, theme.success);

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Layer 1', 20, 30);
    ctx.fillText('Layer 0', 20, 160);
}

function drawVectorDbIvfPq(ctx, canvas, theme) {
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 11px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('IVF coarse centroids', 16, 22);
    ctx.fillText('PQ compression', 240, 22);

    const centroids = [
        { x: 90, y: 70 },
        { x: 160, y: 130 },
        { x: 80, y: 200 }
    ];
    const offsets = [
        { x: -18, y: -10 },
        { x: -6, y: 16 },
        { x: 14, y: -6 },
        { x: 20, y: 14 }
    ];

    centroids.forEach((center, index) => {
        offsets.forEach(offset => {
            drawVectorDbNode(ctx, center.x + offset.x, center.y + offset.y, 4.5, theme.panel, theme.axis);
        });
        const fill = index === 1 ? theme.secondary : theme.primary;
        drawVectorDbNode(ctx, center.x, center.y, 12, fill, theme.axis);
    });

    const query = { x: 30, y: 130 };
    drawVectorDbDiamond(ctx, query.x, query.y, 7, theme.warning, theme.axis);
    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('query', query.x + 10, query.y);
    drawArrow(ctx, query.x + 6, query.y, centroids[1].x - 12, centroids[1].y, theme.warning);

    const listsBox = { x: 40, y: 238, width: 150, height: 34 };
    drawVectorDbBox(ctx, listsBox.x, listsBox.y, listsBox.width, listsBox.height, 'Nearest\nlists', theme.panel, theme);
    drawArrow(ctx, centroids[1].x, centroids[1].y + 12, listsBox.x + listsBox.width / 2, listsBox.y, theme.axis);

    const vectorBox = { x: 240, y: 46, width: 150, height: 32 };
    drawVectorDbBox(ctx, vectorBox.x, vectorBox.y, vectorBox.width, vectorBox.height, 'Input\nvector', theme.primary, theme);

    const subBoxWidth = 28;
    const subBoxHeight = 24;
    const subGap = 8;
    const subStartX = 240;
    const subY = 94;

    for (let i = 0; i < 4; i++) {
        const x = subStartX + i * (subBoxWidth + subGap);
        drawVectorDbBox(ctx, x, subY, subBoxWidth, subBoxHeight, `v${i + 1}`, theme.panel, theme);
    }

    drawArrow(
        ctx,
        vectorBox.x + vectorBox.width / 2,
        vectorBox.y + vectorBox.height,
        subStartX + (subBoxWidth + subGap) * 1.5,
        subY,
        theme.axis
    );

    const codebookBox = { x: 240, y: 142, width: 150, height: 32 };
    drawVectorDbBox(ctx, codebookBox.x, codebookBox.y, codebookBox.width, codebookBox.height, 'PQ\ncodebooks', theme.success, theme);
    drawArrow(
        ctx,
        subStartX + (subBoxWidth + subGap) * 1.5,
        subY + subBoxHeight,
        codebookBox.x + codebookBox.width / 2,
        codebookBox.y,
        theme.axis
    );

    const codeBox = { x: 240, y: 198, width: 150, height: 32 };
    drawVectorDbBox(ctx, codeBox.x, codeBox.y, codeBox.width, codeBox.height, '8-bit\ncodes', theme.panel, theme);
    drawArrow(
        ctx,
        codebookBox.x + codebookBox.width / 2,
        codebookBox.y + codebookBox.height,
        codeBox.x + codeBox.width / 2,
        codeBox.y,
        theme.axis
    );
}

function drawVectorDbRetrieval(ctx, canvas, theme) {
    const queryBox = { x: canvas.width / 2 - 60, y: 20, width: 120, height: 32 };
    const lexicalBox = { x: 50, y: 80, width: 130, height: 36 };
    const vectorBox = { x: 240, y: 80, width: 130, height: 36 };
    const rerankBox = { x: canvas.width / 2 - 70, y: 140, width: 140, height: 36 };
    const contextBox = { x: canvas.width / 2 - 70, y: 200, width: 140, height: 36 };
    const llmBox = { x: canvas.width / 2 - 55, y: 255, width: 110, height: 32 };

    drawVectorDbBox(ctx, queryBox.x, queryBox.y, queryBox.width, queryBox.height, 'User\nquery', theme.primary, theme);
    drawVectorDbBox(ctx, lexicalBox.x, lexicalBox.y, lexicalBox.width, lexicalBox.height, 'Lexical\nsearch', theme.warning, theme);
    drawVectorDbBox(ctx, vectorBox.x, vectorBox.y, vectorBox.width, vectorBox.height, 'Vector\nsearch', theme.secondary, theme);
    drawVectorDbBox(ctx, rerankBox.x, rerankBox.y, rerankBox.width, rerankBox.height, 'Merge\n+ rerank', theme.success, theme);
    drawVectorDbBox(ctx, contextBox.x, contextBox.y, contextBox.width, contextBox.height, 'Top-k\nchunks', theme.panel, theme);
    drawVectorDbBox(ctx, llmBox.x, llmBox.y, llmBox.width, llmBox.height, 'LLM', theme.primary, theme);

    drawArrow(ctx, queryBox.x + queryBox.width / 2, queryBox.y + queryBox.height, lexicalBox.x + lexicalBox.width / 2, lexicalBox.y, theme.axis);
    drawArrow(ctx, queryBox.x + queryBox.width / 2, queryBox.y + queryBox.height, vectorBox.x + vectorBox.width / 2, vectorBox.y, theme.axis);
    drawArrow(ctx, lexicalBox.x + lexicalBox.width / 2, lexicalBox.y + lexicalBox.height, rerankBox.x + rerankBox.width / 2 - 30, rerankBox.y, theme.axis);
    drawArrow(ctx, vectorBox.x + vectorBox.width / 2, vectorBox.y + vectorBox.height, rerankBox.x + rerankBox.width / 2 + 30, rerankBox.y, theme.axis);
    drawArrow(ctx, rerankBox.x + rerankBox.width / 2, rerankBox.y + rerankBox.height, contextBox.x + contextBox.width / 2, contextBox.y, theme.axis);
    drawArrow(ctx, contextBox.x + contextBox.width / 2, contextBox.y + contextBox.height, llmBox.x + llmBox.width / 2, llmBox.y, theme.axis);

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 10px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BM25', lexicalBox.x + lexicalBox.width / 2, lexicalBox.y + lexicalBox.height + 14);
    ctx.fillText('ANN', vectorBox.x + vectorBox.width / 2, vectorBox.y + vectorBox.height + 14);
}

function drawVectorDbCanvas() {
    const canvas = document.getElementById('vectorDbCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeVectorDbMode === 'pipeline') {
        drawVectorDbPipeline(ctx, canvas, theme);
    } else if (activeVectorDbMode === 'hnsw') {
        drawVectorDbHnsw(ctx, canvas, theme);
    } else if (activeVectorDbMode === 'ivf-pq') {
        drawVectorDbIvfPq(ctx, canvas, theme);
    } else {
        drawVectorDbRetrieval(ctx, canvas, theme);
    }
}

function setVectorDbMode(modeId) {
    if (!vectorDbModes.some(mode => mode.id === modeId)) return;
    activeVectorDbMode = modeId;

    const buttons = document.querySelectorAll('button[data-vector-db-mode]');
    const panels = document.querySelectorAll('.vector-db-panel');

    buttons.forEach(button => {
        const isActive = button.dataset.vectorDbMode === modeId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach(panel => {
        const isActive = panel.dataset.vectorDbMode === modeId;
        panel.classList.toggle('is-active', isActive);
        panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });

    drawVectorDbCanvas();
}

function cycleVectorDbMode() {
    const currentIndex = vectorDbModes.findIndex(mode => mode.id === activeVectorDbMode);
    const nextIndex = (currentIndex + 1) % vectorDbModes.length;
    setVectorDbMode(vectorDbModes[nextIndex].id);
}

function setupVectorDbSection() {
    const buttons = document.querySelectorAll('button[data-vector-db-mode]');
    const panels = document.querySelectorAll('.vector-db-panel');
    if (!buttons.length || !panels.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setVectorDbMode(button.dataset.vectorDbMode));
    });

    const nextButton = document.getElementById('vectorDbNext');
    if (nextButton) {
        nextButton.addEventListener('click', cycleVectorDbMode);
    }

    setVectorDbMode(activeVectorDbMode);
}

function setupMatrixControls() {
    const buttons = document.querySelectorAll('[data-matrix-op]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setMatrixBasicOperation(button.dataset.matrixOp));
    });

    setupMatrixTransformControls();
    updateMatrixBasicUI();
    drawMatrixCanvas();
}

function setupMatrixTransformControls() {
    const scaleXInput = document.getElementById('matrixScaleX');
    const scaleYInput = document.getElementById('matrixScaleY');
    const shearInput = document.getElementById('matrixShear');

    if (!scaleXInput || !scaleYInput || !shearInput) return;

    scaleXInput.value = matrixState.scaleX;
    scaleYInput.value = matrixState.scaleY;
    shearInput.value = matrixState.shearX;

    const update = () => {
        matrixState.scaleX = parseFloat(scaleXInput.value);
        matrixState.scaleY = parseFloat(scaleYInput.value);
        matrixState.shearX = parseFloat(shearInput.value);
        updateMatrixTransformLabels();
        drawMatrixCanvas();
    };

    [scaleXInput, scaleYInput, shearInput].forEach(input => {
        input.addEventListener('input', update);
    });

    update();
}

function setupMatrixDeepControls() {
    const buttons = document.querySelectorAll('[data-matrix-deep-op]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setMatrixDeepOperation(button.dataset.matrixDeepOp));
    });

    updateMatrixDeepUI();
    drawMatrixDeepCanvas();
}

function setupHolidayParade() {
    const parade = document.querySelector('.holiday-parade');
    if (!parade) return;

    const santaRide = parade.querySelector('.santa-ride');
    if (!santaRide) return;

    let hasPlayed = false;

    const playRideOnce = () => {
        if (document.body.dataset.theme !== 'holiday') return;
        if (hasPlayed) return;
        hasPlayed = true;
        santaRide.classList.remove('is-active');
        void santaRide.offsetWidth;
        santaRide.classList.add('is-active');
    };

    const resetRide = () => {
        hasPlayed = false;
        santaRide.classList.remove('is-active');
    };

    santaRide.addEventListener('animationend', () => {
        santaRide.classList.remove('is-active');
    });

    document.addEventListener('mlmath:theme-change', (event) => {
        const theme = event.detail?.theme;
        if (theme === 'holiday') {
            resetRide();
            playRideOnce();
        } else {
            resetRide();
        }
    });

    if (document.body.dataset.theme === 'holiday') {
        playRideOnce();
    }
}

function setupThemeSwitcher() {
    const buttons = document.querySelectorAll('.mode-btn');
    if (!buttons.length) return;

    const applyTheme = (theme, shouldRedraw = true) => {
        document.body.dataset.theme = theme;
        localStorage.setItem('mlmath-theme', theme);
        buttons.forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.theme === theme);
            btn.setAttribute('aria-pressed', btn.dataset.theme === theme ? 'true' : 'false');
        });
        if (shouldRedraw) {
            refreshAllVisuals();
        }
        document.dispatchEvent(new CustomEvent('mlmath:theme-change', { detail: { theme } }));
    };

    const savedTheme = localStorage.getItem('mlmath-theme');
    const initialTheme = savedTheme || document.body.dataset.theme || 'light';
    applyTheme(initialTheme, false);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
}

function setActiveChapter(chapterId) {
    const chapters = document.querySelectorAll('.chapter');
    const buttons = document.querySelectorAll('.chapter-btn');
    if (!chapters.length || !buttons.length) return;

    chapters.forEach(chapter => {
        chapter.classList.toggle('is-active', chapter.dataset.chapter === chapterId);
    });

    buttons.forEach(button => {
        const isActive = button.dataset.chapter === chapterId;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

function setupChapterSwitcher() {
    const buttons = document.querySelectorAll('.chapter-btn');
    if (!buttons.length) return;

    document.body.dataset.chapterMode = 'on';

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            setActiveChapter(button.dataset.chapter);
            refreshAllVisuals();
        });
    });

    const hash = window.location.hash.substring(1);
    if (hash) {
        const target = document.getElementById(hash);
        const chapter = target?.closest('.chapter');
        if (chapter) {
            setActiveChapter(chapter.dataset.chapter);
            setTimeout(() => {
                target.scrollIntoView({ behavior: 'smooth' });
            }, 0);
            return;
        }
    }
    setActiveChapter('foundations');
}

function setupChapterNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(event) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (!targetElement) return;

            event.preventDefault();
            const chapter = targetElement.closest('.chapter');
            if (chapter) {
                setActiveChapter(chapter.dataset.chapter);
                refreshAllVisuals();
            }
            targetElement.scrollIntoView({ behavior: 'smooth' });
            if (history.replaceState) {
                history.replaceState(null, '', `#${targetId}`);
            } else {
                window.location.hash = targetId;
            }
        });
    });
}

function initMatrixCanvas() {
    drawMatrixCanvas();
}

// ============================================
// Reinforcement Learning modules
// ============================================
const visualizationMeta = {
    fundamentalsCanvas: {
        goal: 'Visualize the selected foundations concept',
        input: 'Active tab (linear, calculus, optimization, probability, matrix)',
        variables: 'Vectors, gradients, probabilities, matrices'
    },
    vectorCanvas: {
        goal: 'Show vector operations and results',
        input: 'Vector components, scale, operation',
        variables: 'ax, ay, bx, by, scale'
    },
    vectorSceneCanvas: {
        goal: 'Illustrate the selected vector deep-dive scene',
        input: 'Scene selection',
        variables: 'Projection, norms, basis, gradients'
    },
    vectorProjectionCanvas: {
        goal: 'Show projection of one vector onto another',
        input: 'Example vectors',
        variables: 'x, u, proj_u(x)'
    },
    vectorNormCanvas: {
        goal: 'Show vector length and normalization',
        input: 'Example vector',
        variables: 'norm, unit vector'
    },
    vectorSubspaceCanvas: {
        goal: 'Show span and rank intuition',
        input: 'Basis vectors',
        variables: 'basis, subspace'
    },
    vectorGradientCanvas: {
        goal: 'Show gradient, Jacobian, and Hessian intuition',
        input: 'Example function',
        variables: 'grad, J, H'
    },
    vectorStatsCanvas: {
        goal: 'Show mean and covariance geometry',
        input: 'Sample points',
        variables: 'mu, Sigma'
    },
    vectorRegularizationCanvas: {
        goal: 'Show L1 vs L2 geometry',
        input: 'Penalty choice',
        variables: 'norm, constraint shape'
    },
    vectorAttentionCanvas: {
        goal: 'Show dot-product attention flow',
        input: 'Query, keys, values',
        variables: 'scores, weights, output'
    },
    matrixCanvas: {
        goal: 'Show matrix operations visually',
        input: 'Operation toggle',
        variables: 'Matrix entries, transform'
    },
    matrixDeepCanvas: {
        goal: 'Show deeper matrix concepts',
        input: 'Selected concept',
        variables: 'determinant, inverse, eigen, covariance'
    },
    probabilityCanvas: {
        goal: 'Show the selected distribution or Bayes update',
        input: 'Distribution mode',
        variables: 'p, n, mu, sigma, priors'
    },
    probabilityVennCanvas: {
        goal: 'Highlight event relationships',
        input: 'Venn mode',
        variables: 'A, B, union, intersection'
    },
    probabilityHmmCanvas: {
        goal: 'Show hidden states transitioning and emitting observations',
        input: 'Observation sequence over time',
        variables: 'P(X_t|X_{t-1}), P(E_t|X_t)'
    },
    probabilityKalmanCanvas: {
        goal: 'Show a recursive estimate tracking noisy measurements',
        input: 'Noisy observations over time',
        variables: 'prediction, update, estimate'
    },
    spamFilterCanvas: {
        goal: 'Visualize Bayesian spam filtering',
        input: 'Prior and word toggles',
        variables: 'P(spam), likelihoods, posterior'
    },
    sampleSpaceCanvas: {
        goal: 'Simulate sample space counts',
        input: 'A width, B height, resample',
        variables: 'counts, probabilities'
    },
    probabilityBernoulliCanvas: {
        goal: 'Show Bernoulli PMF',
        input: 'p',
        variables: 'P(X=0/1)'
    },
    probabilityBinomialCanvas: {
        goal: 'Show Binomial PMF',
        input: 'n, p',
        variables: 'P(X=k)'
    },
    probabilityCategoricalCanvas: {
        goal: 'Show Categorical PMF',
        input: 'p_i',
        variables: 'class probabilities'
    },
    probabilityNormalCanvas: {
        goal: 'Show Normal density',
        input: 'mu, sigma',
        variables: 'density curve'
    },
    gradientCanvas: {
        goal: 'Show gradient descent path',
        input: 'Learning rate, run/reset',
        variables: 'theta, gradient, loss surface'
    },
    activationCanvas: {
        goal: 'Compare activation functions',
        input: 'Curve toggles',
        variables: 'sigmoid, relu, tanh'
    },
    mlAlgoCanvas: {
        goal: 'Show algorithm step visualization',
        input: 'Selected algorithm and step',
        variables: 'data points, boundary, centroids'
    },
    mlLifecycleCanvas: {
        goal: 'Show training vs inference steps',
        input: 'Phase and step',
        variables: 'weights, loss, predictions'
    },
    neuralNetCanvas: {
        goal: 'Show forward propagation flow',
        input: 'Run/reset',
        variables: 'weights, activations'
    },
    neuronCanvas: {
        goal: 'Show single neuron steps',
        input: 'Step controls',
        variables: 'weights, bias, activation'
    },
    digitLabCanvas: {
        goal: 'Show digit inference/training',
        input: 'Digit, mode, step',
        variables: 'logits, probabilities, loss'
    },
    backpropCanvas: {
        goal: 'Show gradient flow in backprop',
        input: 'Step controls',
        variables: 'gradients, weights'
    },
    deepNetCanvas: {
        goal: 'Show deep network flow',
        input: 'Step controls',
        variables: 'layers, activations'
    },
    cnnCanvas: {
        goal: 'Show convolution feature extraction',
        input: 'Step controls',
        variables: 'filters, feature maps'
    },
    rnnCanvas: {
        goal: 'Show recurrent unrolling',
        input: 'Step controls',
        variables: 'hidden state, sequence'
    },
    lstmCanvas: {
        goal: 'Show LSTM gate dynamics',
        input: 'Step controls',
        variables: 'cell state, gates'
    },
    transformerCanvas: {
        goal: 'Show transformer block flow',
        input: 'Step controls',
        variables: 'attention weights, tokens'
    },
    transformerAdvancedOverviewCanvas: {
        goal: 'Show transformer stage overview',
        input: 'Step controls',
        variables: 'block stages'
    },
    transformerAdvancedCanvas: {
        goal: 'Show detailed transformer math',
        input: 'Step controls',
        variables: 'Q, K, V, attention, MLP'
    },
    vectorDbCanvas: {
        goal: 'Show vector DB pipeline views',
        input: 'Selected view',
        variables: 'embeddings, neighbors'
    },
    rlPolicyCanvas: {
        goal: 'Show policy vs value chain',
        input: 'Policy bias slider',
        variables: 'V(s), Q(s,a)'
    },
    banditMeansCanvas: {
        goal: 'Compare true vs estimated means',
        input: 'Bandit settings',
        variables: 'arm means, estimates'
    },
    banditRegretCanvas: {
        goal: 'Show cumulative regret',
        input: 'Bandit steps',
        variables: 'regret over time'
    },
    banditActionsCanvas: {
        goal: 'Show action frequencies',
        input: 'Bandit steps',
        variables: 'selection counts'
    },
    gridworldCanvas: {
        goal: 'Show grid values and policy',
        input: 'Algorithm, gamma, step cost, slip, overlays',
        variables: 'V(s), policy'
    },
    gridworldChart: {
        goal: 'Track value convergence',
        input: 'Iterations',
        variables: 'max delta V, avg V'
    },
    mcGridCanvas: {
        goal: 'Show episode rollouts and values',
        input: 'Episodes, epsilon',
        variables: 'trajectory, V(s)'
    },
    mcReturnsCanvas: {
        goal: 'Show recent returns',
        input: 'Episodes',
        variables: 'G per episode'
    },
    mcValueCanvas: {
        goal: 'Show value estimate over time',
        input: 'Episodes',
        variables: 'V(start)'
    },
    tdValueCanvas: {
        goal: 'Show value estimates per state',
        input: 'Alpha, episodes',
        variables: 'V(s)'
    },
    tdErrorCanvas: {
        goal: 'Show TD error',
        input: 'Episode',
        variables: 'delta_t'
    },
    tdEpisodeCanvas: {
        goal: 'Show V over episodes',
        input: 'Episodes',
        variables: 'V(s) history'
    },
    controlGridCanvas: {
        goal: 'Show greedy policy',
        input: 'Algorithm, epsilon, alpha',
        variables: 'Q, policy'
    },
    controlQCanvas: {
        goal: 'Show Q heatmaps per action',
        input: 'Algorithm',
        variables: 'Q(s,a)'
    },
    controlEpsCanvas: {
        goal: 'Show exploration schedule',
        input: 'Epsilon slider',
        variables: 'epsilon over time'
    },
    controlReturnCanvas: {
        goal: 'Show return per episode',
        input: 'Training steps',
        variables: 'episode return'
    }
};

function buildVizDescription(meta) {
    const verbPrefix = /^(Show|Visualize|Illustrate|Compare|Track|Highlight|Simulate)\s+/i;
    const goal = meta.goal ? meta.goal.replace(verbPrefix, '').trim() : '';
    const input = meta.input ? meta.input.replace(/\.$/, '').trim() : '';
    const variables = meta.variables ? meta.variables.replace(/\.$/, '').trim() : '';
    const base = goal ? `Shows ${goal}` : 'Shows the visualization';
    const inputPart = input ? ` using ${input}` : '';
    const variablesPart = variables ? `, highlighting ${variables}` : '';
    return `${base}${inputPart}${variablesPart}.`;
}

function setupVisualizationMeta() {
    Object.entries(visualizationMeta).forEach(([id, meta]) => {
        const canvas = document.getElementById(id);
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;
        if (parent.querySelector(`.viz-meta[data-for="${id}"]`)) return;
        const metaEl = document.createElement('div');
        metaEl.className = 'viz-meta';
        metaEl.dataset.for = id;
        metaEl.textContent = buildVizDescription(meta);
        canvas.insertAdjacentElement('afterend', metaEl);
    });
}
function createSeededRng(seed) {
    let t = seed >>> 0;
    return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ t >>> 15, 1 | t);
        r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
        return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
}

function randNormal(rng) {
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function sampleGamma(shape, rng) {
    if (shape < 1) {
        const u = rng();
        return sampleGamma(1 + shape, rng) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
        let x = randNormal(rng);
        let v = 1 + c * x;
        if (v <= 0) continue;
        v = v * v * v;
        const u = rng();
        if (u < 1 - 0.0331 * x * x * x * x) return d * v;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
}

function sampleBeta(alpha, beta, rng) {
    const x = sampleGamma(alpha, rng);
    const y = sampleGamma(beta, rng);
    return x / (x + y);
}

function drawLineChart(ctx, seriesList, options = {}) {
    const series = Array.isArray(seriesList[0]) ? seriesList : [seriesList];
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 30;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = options.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const maxLen = Math.max(...series.map(s => s.length));
    const maxY = options.maxY ?? Math.max(1, ...series.flat());
    const minY = options.minY ?? 0;
    const colors = options.colors || ['#0ea5e9', '#f97316', '#10b981', '#ef4444'];

    ctx.strokeStyle = '#cbd5f5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    series.forEach((data, idx) => {
        if (data.length < 2) return;
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        data.forEach((value, i) => {
            const x = padding + (width - 2 * padding) * (i / Math.max(1, maxLen - 1));
            const y = height - padding - (height - 2 * padding) * ((value - minY) / (maxY - minY));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });
}

function drawBarChart(ctx, values, options = {}) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 24;
    const max = options.max ?? Math.max(1, ...values);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = options.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    const barWidth = (width - 2 * padding) / values.length;
    values.forEach((value, i) => {
        const x = padding + i * barWidth;
        const h = (height - 2 * padding) * (value / max);
        ctx.fillStyle = options.colors ? options.colors[i % options.colors.length] : '#38bdf8';
        ctx.fillRect(x + 4, height - padding - h, barWidth - 8, h);
    });
}

class BanditEnv {
    constructor({ arms = 5, noise = 0.2, seed = 1, rewardMode = 'gaussian' } = {}) {
        this.arms = arms;
        this.noise = noise;
        this.rewardMode = rewardMode;
        this.rng = createSeededRng(seed);
        this.armMeans = [];
        this.reset(seed);
    }

    reset(seed) {
        if (seed !== undefined) {
            this.rng = createSeededRng(seed);
        }
        this.armMeans = Array.from({ length: this.arms }, () => 0.1 + 0.8 * this.rng());
        return 0;
    }

    actions() {
        return Array.from({ length: this.arms }, (_, i) => i);
    }

    step(action) {
        const mean = this.armMeans[action];
        let reward = mean + this.noise * randNormal(this.rng);
        if (this.rewardMode === 'bernoulli') {
            reward = this.rng() < mean ? 1 : 0;
        }
        return { nextState: 0, reward, done: false, info: { mean } };
    }
}

class GridworldEnv {
    constructor({ rows = 5, cols = 5, walls = [], terminals = [], start = 0, stepCost = 0, slip = 0, seed = 1 } = {}) {
        this.rows = rows;
        this.cols = cols;
        this.walls = new Set(walls);
        this.terminalRewards = new Map(terminals);
        this.stepCost = stepCost;
        this.slip = slip;
        this.start = start;
        this.state = start;
        this.rng = createSeededRng(seed);
    }

    toIndex(row, col) {
        return row * this.cols + col;
    }

    fromIndex(index) {
        return { row: Math.floor(index / this.cols), col: index % this.cols };
    }

    isWall(index) {
        return this.walls.has(index);
    }

    isTerminal(index) {
        return this.terminalRewards.has(index);
    }

    reset(seed) {
        if (seed !== undefined) {
            this.rng = createSeededRng(seed);
        }
        this.state = this.start;
        return this.state;
    }

    actions(state = this.state) {
        if (this.isWall(state) || this.isTerminal(state)) return [];
        return [0, 1, 2, 3];
    }

    deterministicTransition(state, action) {
        if (this.isTerminal(state)) {
            return { nextState: state, reward: 0, done: true, info: { terminal: true } };
        }
        if (this.isWall(state)) {
            return { nextState: state, reward: 0, done: false, info: { wall: true } };
        }
        const { row, col } = this.fromIndex(state);
        const deltas = [
            { row: -1, col: 0 },
            { row: 0, col: 1 },
            { row: 1, col: 0 },
            { row: 0, col: -1 }
        ];
        const move = deltas[action] || deltas[0];
        const nextRow = clamp(row + move.row, 0, this.rows - 1);
        const nextCol = clamp(col + move.col, 0, this.cols - 1);
        let nextState = this.toIndex(nextRow, nextCol);
        if (this.isWall(nextState)) {
            nextState = state;
        }
        let reward = this.stepCost;
        let done = false;
        if (this.isTerminal(nextState)) {
            reward += this.terminalRewards.get(nextState);
            done = true;
        }
        return { nextState, reward, done, info: {} };
    }

    expectedTransitions(state, action) {
        const slip = clamp(this.slip || 0, 0, 1);
        if (slip === 0) {
            return [{ prob: 1, ...this.deterministicTransition(state, action) }];
        }
        const left = (action + 3) % 4;
        const right = (action + 1) % 4;
        const mainProb = 1 - slip;
        const sideProb = slip / 2;
        const choices = [
            { action, prob: mainProb },
            { action: left, prob: sideProb },
            { action: right, prob: sideProb }
        ];
        return choices.map(choice => ({
            prob: choice.prob,
            ...this.deterministicTransition(state, choice.action)
        }));
    }

    sampleAction(action) {
        const slip = clamp(this.slip || 0, 0, 1);
        if (slip === 0) return action;
        const roll = this.rng();
        if (roll > slip) return action;
        const left = (action + 3) % 4;
        const right = (action + 1) % 4;
        return roll < slip / 2 ? left : right;
    }

    sampleTransition(state, action) {
        const actual = this.sampleAction(action);
        return this.deterministicTransition(state, actual);
    }

    step(action) {
        const actual = this.sampleAction(action);
        const result = this.deterministicTransition(this.state, actual);
        this.state = result.nextState;
        return result;
    }
}

function setupRlFundamentals() {
    const gammaInput = document.getElementById('rlGamma');
    const policyInput = document.getElementById('rlPolicyBias');
    if (!gammaInput || !policyInput) return;
    const rewardInputs = document.querySelectorAll('.rl-reward-input');
    const gammaLabel = document.getElementById('rlGammaVal');
    const policyLabel = document.getElementById('rlPolicyBiasVal');
    const returnValue = document.getElementById('rlReturnValue');
    const policyTable = document.getElementById('rlPolicyTable');

    const updateReturn = () => {
        const gamma = parseFloat(gammaInput.value);
        let total = 0;
        rewardInputs.forEach((input, idx) => {
            const r = parseFloat(input.value || '0');
            total += Math.pow(gamma, idx) * r;
        });
        if (gammaLabel) gammaLabel.textContent = gamma.toFixed(2);
        if (returnValue) returnValue.textContent = total.toFixed(2);
    };

    const updatePolicy = () => {
        const gamma = parseFloat(gammaInput.value);
        const pRight = parseFloat(policyInput.value);
        const qRight = gamma * 1;
        const qLeft = gamma * -1;
        const vMid = pRight * qRight + (1 - pRight) * qLeft;
        if (policyLabel) policyLabel.textContent = pRight.toFixed(2);
        if (policyTable) {
            policyTable.innerHTML = `
                <table>
                    <thead>
                        <tr><th>State</th><th>V(s)</th><th>Q(s,left)</th><th>Q(s,right)</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>s0 (terminal)</td><td>-1.00</td><td>-</td><td>-</td></tr>
                        <tr><td>s1</td><td>${vMid.toFixed(2)}</td><td>${qLeft.toFixed(2)}</td><td>${qRight.toFixed(2)}</td></tr>
                        <tr><td>s2 (terminal)</td><td>1.00</td><td>-</td><td>-</td></tr>
                    </tbody>
                </table>
            `;
        }
        drawRlPolicyCanvas(pRight, vMid);
    };

    const updateAll = () => {
        updateReturn();
        updatePolicy();
    };

    gammaInput.addEventListener('input', updateAll);
    policyInput.addEventListener('input', updateAll);
    rewardInputs.forEach(input => input.addEventListener('input', updateReturn));
    updateAll();
}

function drawRlPolicyCanvas(pRight, vMid) {
    const canvas = document.getElementById('rlPolicyCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const nodes = [
        { x: 60, y: 70, label: 's0\n-1' },
        { x: 180, y: 70, label: `s1\n${vMid.toFixed(2)}` },
        { x: 300, y: 70, label: 's2\n+1' }
    ];
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nodes[1].x - 40, nodes[1].y);
    ctx.lineTo(nodes[0].x + 40, nodes[0].y);
    ctx.moveTo(nodes[1].x + 40, nodes[1].y);
    ctx.lineTo(nodes[2].x - 40, nodes[2].y);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1 + 4 * (1 - pRight);
    ctx.beginPath();
    ctx.moveTo(nodes[1].x - 40, nodes[1].y - 10);
    ctx.lineTo(nodes[0].x + 40, nodes[0].y - 10);
    ctx.stroke();

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1 + 4 * pRight;
    ctx.beginPath();
    ctx.moveTo(nodes[1].x + 40, nodes[1].y + 10);
    ctx.lineTo(nodes[2].x - 40, nodes[2].y + 10);
    ctx.stroke();

    nodes.forEach(node => {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px "Nunito", sans-serif';
        const lines = node.label.split('\n');
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lines[0], node.x, node.y - 6);
        ctx.fillText(lines[1], node.x, node.y + 10);
    });
}

const banditState = {
    env: null,
    rng: createSeededRng(7),
    t: 0,
    horizon: 200,
    counts: [],
    estimates: [],
    regrets: [],
    actionCounts: [],
    betaA: [],
    betaB: [],
    playing: false,
    timer: null,
    bestMean: 0,
    epsilon: 0.2
};

function setupBandits() {
    const meansCanvas = document.getElementById('banditMeansCanvas');
    if (!meansCanvas) return;
    const dom = {
        seed: document.getElementById('banditSeed'),
        arms: document.getElementById('banditArms'),
        armsVal: document.getElementById('banditArmsVal'),
        horizon: document.getElementById('banditHorizon'),
        horizonVal: document.getElementById('banditHorizonVal'),
        noise: document.getElementById('banditNoise'),
        noiseVal: document.getElementById('banditNoiseVal'),
        alg: document.getElementById('banditAlg'),
        epsilon: document.getElementById('banditEpsilon'),
        epsilonVal: document.getElementById('banditEpsilonVal'),
        decay: document.getElementById('banditDecay'),
        decayVal: document.getElementById('banditDecayVal'),
        ucbC: document.getElementById('banditUcbC'),
        ucbCVal: document.getElementById('banditUcbCVal'),
        prior: document.getElementById('banditPrior'),
        step: document.getElementById('banditStep'),
        play: document.getElementById('banditPlay'),
        reset: document.getElementById('banditReset')
    };

    const syncLabels = () => {
        if (dom.armsVal) dom.armsVal.textContent = dom.arms.value;
        if (dom.horizonVal) dom.horizonVal.textContent = dom.horizon.value;
        if (dom.noiseVal) dom.noiseVal.textContent = parseFloat(dom.noise.value).toFixed(2);
        if (dom.epsilonVal) dom.epsilonVal.textContent = parseFloat(dom.epsilon.value).toFixed(2);
        if (dom.decayVal) dom.decayVal.textContent = parseFloat(dom.decay.value).toFixed(3);
        if (dom.ucbCVal) dom.ucbCVal.textContent = parseFloat(dom.ucbC.value).toFixed(1);
    };

    const reset = () => {
        syncLabels();
        if (banditState.timer) {
            clearInterval(banditState.timer);
            banditState.timer = null;
        }
        banditState.playing = false;
        if (dom.play) dom.play.textContent = 'Play';
        const seed = parseInt(dom.seed.value, 10) || 1;
        banditState.rng = createSeededRng(seed);
        const arms = parseInt(dom.arms.value, 10);
        const noise = parseFloat(dom.noise.value);
        banditState.horizon = parseInt(dom.horizon.value, 10);
        const rewardMode = dom.alg.value === 'thompson' ? 'bernoulli' : 'gaussian';
        banditState.env = new BanditEnv({ arms, noise, seed, rewardMode });
        banditState.t = 0;
        banditState.counts = Array(arms).fill(0);
        banditState.estimates = Array(arms).fill(0);
        banditState.actionCounts = Array(arms).fill(0);
        banditState.regrets = [0];
        banditState.bestMean = Math.max(...banditState.env.armMeans);
        const prior = parseFloat(dom.prior.value) || 1;
        banditState.betaA = Array(arms).fill(prior);
        banditState.betaB = Array(arms).fill(prior);
        banditState.epsilon = parseFloat(dom.epsilon.value);
        drawBanditCharts();
    };

    const selectAction = () => {
        const alg = dom.alg.value;
        const arms = banditState.env.armMeans.length;
        if (alg === 'epsilon') {
            const epsilon = banditState.epsilon;
            if (banditState.rng() < epsilon) {
                return Math.floor(banditState.rng() * arms);
            }
            return banditState.estimates.indexOf(Math.max(...banditState.estimates));
        }
        if (alg === 'ucb1') {
            const c = parseFloat(dom.ucbC.value);
            for (let i = 0; i < arms; i++) {
                if (banditState.counts[i] === 0) return i;
            }
            const total = Math.max(1, banditState.t);
            let best = 0;
            let bestScore = -Infinity;
            for (let i = 0; i < arms; i++) {
                const bonus = c * Math.sqrt(Math.log(total + 1) / banditState.counts[i]);
                const score = banditState.estimates[i] + bonus;
                if (score > bestScore) {
                    bestScore = score;
                    best = i;
                }
            }
            return best;
        }
        let best = 0;
        let bestSample = -Infinity;
        for (let i = 0; i < arms; i++) {
            const sample = sampleBeta(banditState.betaA[i], banditState.betaB[i], banditState.rng);
            if (sample > bestSample) {
                bestSample = sample;
                best = i;
            }
        }
        return best;
    };

    const step = () => {
        if (!banditState.env || banditState.t >= banditState.horizon) {
            banditState.playing = false;
            if (dom.play) dom.play.textContent = 'Play';
            if (banditState.timer) {
                clearInterval(banditState.timer);
                banditState.timer = null;
            }
            return;
        }
        const action = selectAction();
        const result = banditState.env.step(action);
        banditState.t += 1;
        banditState.counts[action] += 1;
        banditState.actionCounts[action] += 1;
        banditState.estimates[action] += (result.reward - banditState.estimates[action]) / banditState.counts[action];
        const lastRegret = banditState.regrets[banditState.regrets.length - 1];
        const regret = lastRegret + (banditState.bestMean - banditState.env.armMeans[action]);
        banditState.regrets.push(regret);
        if (dom.alg.value === 'thompson') {
            if (result.reward > 0) banditState.betaA[action] += 1;
            else banditState.betaB[action] += 1;
        }
        if (dom.alg.value === 'epsilon') {
            const decay = parseFloat(dom.decay.value);
            banditState.epsilon = Math.max(0, banditState.epsilon - decay);
        }
        drawBanditCharts();
    };

    const togglePlay = () => {
        banditState.playing = !banditState.playing;
        if (dom.play) dom.play.textContent = banditState.playing ? 'Pause' : 'Play';
        if (banditState.playing) {
            banditState.timer = setInterval(step, 250);
        } else if (banditState.timer) {
            clearInterval(banditState.timer);
        }
    };

    dom.arms.addEventListener('input', reset);
    dom.horizon.addEventListener('input', reset);
    dom.noise.addEventListener('input', reset);
    dom.alg.addEventListener('change', reset);
    dom.seed.addEventListener('change', reset);
    dom.prior.addEventListener('change', reset);
    dom.epsilon.addEventListener('input', () => {
        syncLabels();
        banditState.epsilon = parseFloat(dom.epsilon.value);
    });
    dom.decay.addEventListener('input', syncLabels);
    dom.ucbC.addEventListener('input', syncLabels);
    if (dom.step) dom.step.addEventListener('click', step);
    if (dom.play) dom.play.addEventListener('click', togglePlay);
    if (dom.reset) dom.reset.addEventListener('click', reset);
    reset();
}

function drawBanditCharts() {
    const meansCanvas = document.getElementById('banditMeansCanvas');
    const regretCanvas = document.getElementById('banditRegretCanvas');
    const actionCanvas = document.getElementById('banditActionsCanvas');
    if (!meansCanvas || !banditState.env) return;
    const meansCtx = meansCanvas.getContext('2d');
    const arms = banditState.env.armMeans.length;
    const width = meansCanvas.width;
    const height = meansCanvas.height;
    meansCtx.clearRect(0, 0, width, height);
    meansCtx.fillStyle = '#ffffff';
    meansCtx.fillRect(0, 0, width, height);
    const padding = 30;
    const barWidth = (width - 2 * padding) / arms;
    for (let i = 0; i < arms; i++) {
        const trueMean = banditState.env.armMeans[i];
        const est = banditState.estimates[i];
        const x = padding + i * barWidth;
        const trueH = (height - 2 * padding) * trueMean;
        const estH = (height - 2 * padding) * clamp(est, 0, 1);
        meansCtx.fillStyle = '#bae6fd';
        meansCtx.fillRect(x + 6, height - padding - trueH, barWidth - 12, trueH);
        meansCtx.fillStyle = '#0ea5e9';
        meansCtx.fillRect(x + 14, height - padding - estH, barWidth - 28, estH);
        meansCtx.fillStyle = '#1f2937';
        meansCtx.font = '12px "Nunito", sans-serif';
        meansCtx.textAlign = 'center';
        meansCtx.fillText(`A${i + 1}`, x + barWidth / 2, height - 10);
    }

    if (regretCanvas) {
        const regretCtx = regretCanvas.getContext('2d');
        drawLineChart(regretCtx, banditState.regrets, { colors: ['#ef4444'] });
    }
    if (actionCanvas) {
        const actionCtx = actionCanvas.getContext('2d');
        const total = Math.max(1, banditState.t);
        const freqs = banditState.actionCounts.map(count => count / total);
        drawBarChart(actionCtx, freqs, { colors: ['#38bdf8', '#f97316', '#10b981', '#facc15', '#f472b6', '#a78bfa'] });
    }
}

const gridState = {
    env: null,
    V: [],
    policy: [],
    history: [],
    deltaHistory: [],
    avgHistory: [],
    viewIndex: 0,
    anim: null,
    selectedState: null,
    playing: false,
    timer: null
};

function createPresetGridworld(presetId = 'classic-5', seed = 5) {
    if (presetId === 'open-7') {
        const rows = 7;
        const cols = 7;
        const terminals = [
            [0 * cols + 6, 1],
            [6 * cols + 0, -1]
        ];
        return new GridworldEnv({
            rows,
            cols,
            walls: [],
            terminals,
            start: 3 * cols + 3,
            seed
        });
    }
    if (presetId === 'maze-8') {
        const rows = 8;
        const cols = 8;
        const walls = [];
        for (let r = 1; r < 7; r++) {
            if (r !== 4) walls.push(r * cols + 3);
        }
        for (let c = 1; c < 7; c++) {
            if (c !== 5) walls.push(4 * cols + c);
        }
        const terminals = [
            [0 * cols + 7, 1],
            [7 * cols + 0, -1]
        ];
        return new GridworldEnv({
            rows,
            cols,
            walls,
            terminals,
            start: 7 * cols + 3,
            seed
        });
    }
    const rows = 5;
    const cols = 5;
    const walls = [
        1 * cols + 1,
        2 * cols + 2,
        3 * cols + 1
    ];
    const terminals = [
        [0 * cols + 4, 1],
        [4 * cols + 0, -1]
    ];
    return new GridworldEnv({
        rows,
        cols,
        walls,
        terminals,
        start: 4 * cols + 2,
        seed
    });
}

function createRandomGridworld(rows, cols, seed = 1) {
    const rng = createSeededRng(seed);
    const total = rows * cols;
    const start = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
    const candidates = Array.from({ length: total }, (_, i) => i).filter(i => i !== start);
    const pick = () => candidates.splice(Math.floor(rng() * candidates.length), 1)[0];
    const terminalA = pick();
    const terminalB = pick();
    const terminalRewards = [
        [terminalA, 1],
        [terminalB, -1]
    ];
    const wallCount = Math.floor(total * 0.15);
    const walls = [];
    for (let i = 0; i < wallCount && candidates.length; i++) {
        walls.push(pick());
    }
    return new GridworldEnv({
        rows,
        cols,
        walls,
        terminals: terminalRewards,
        start,
        seed
    });
}

function setupGridworld() {
    const canvas = document.getElementById('gridworldCanvas');
    if (!canvas) return;
    const dom = {
        gamma: document.getElementById('gridGamma'),
        gammaVal: document.getElementById('gridGammaVal'),
        stepCost: document.getElementById('gridStepCost'),
        stepCostVal: document.getElementById('gridStepCostVal'),
        slip: document.getElementById('gridSlip'),
        slipVal: document.getElementById('gridSlipVal'),
        preset: document.getElementById('gridPreset'),
        algo: document.getElementById('gridAlgo'),
        iter: document.getElementById('gridIter'),
        iterVal: document.getElementById('gridIterVal'),
        showValues: document.getElementById('gridShowValues'),
        showHeat: document.getElementById('gridShowHeat'),
        showPolicy: document.getElementById('gridShowPolicy'),
        iterate: document.getElementById('gridIterate'),
        play: document.getElementById('gridPlay'),
        randomize: document.getElementById('gridRandomize'),
        inspectValues: document.getElementById('gridInspectValues')
    };

    const updateLabels = () => {
        if (dom.gammaVal) dom.gammaVal.textContent = parseFloat(dom.gamma.value).toFixed(2);
        if (dom.stepCostVal) dom.stepCostVal.textContent = parseFloat(dom.stepCost.value).toFixed(2);
        if (dom.slipVal) dom.slipVal.textContent = parseFloat(dom.slip.value).toFixed(2);
    };

    const buildEnv = (seed) => {
        const presetId = dom.preset?.value || 'classic-5';
        return createPresetGridworld(presetId, seed);
    };

    const applyEnvParams = (env) => {
        env.stepCost = parseFloat(dom.stepCost.value);
        env.slip = parseFloat(dom.slip.value);
        return env;
    };

    const resetGrid = (seed, envOverride) => {
        if (gridState.timer) {
            clearInterval(gridState.timer);
            gridState.timer = null;
        }
        gridState.playing = false;
        if (dom.play) dom.play.textContent = 'Play';
        updateLabels();
        const env = envOverride || buildEnv(seed);
        gridState.env = applyEnvParams(env);
        const n = gridState.env.rows * gridState.env.cols;
        gridState.V = Array(n).fill(0);
        gridState.policy = Array.from({ length: n }, () => Math.floor(Math.random() * 4));
        gridState.history = [{ V: gridState.V.slice(), policy: gridState.policy.slice() }];
        gridState.deltaHistory = [0];
        gridState.avgHistory = [0];
        gridState.viewIndex = 0;
        gridState.anim = null;
        if (dom.iter) {
            dom.iter.max = 0;
            dom.iter.value = 0;
        }
        if (dom.iterVal) dom.iterVal.textContent = '0';
        drawGridworld();
        drawGridworldChart();
    };

    const computeQ = (state, action, values, gamma) => {
        const transitions = gridState.env.expectedTransitions(state, action);
        return transitions.reduce((sum, result) => {
            const next = result.done ? 0 : gamma * values[result.nextState];
            return sum + result.prob * (result.reward + next);
        }, 0);
    };

    const improvePolicy = (values) => {
        const policy = gridState.policy.slice();
        for (let i = 0; i < policy.length; i++) {
            if (gridState.env.isWall(i) || gridState.env.isTerminal(i)) {
                continue;
            }
            let best = 0;
            let bestQ = -Infinity;
            for (let a = 0; a < 4; a++) {
                const q = computeQ(i, a, values, parseFloat(dom.gamma.value));
                if (q > bestQ) {
                    bestQ = q;
                    best = a;
                }
            }
            policy[i] = best;
        }
        return policy;
    };

    const iterate = () => {
        const gamma = parseFloat(dom.gamma.value);
        if (dom.gammaVal) dom.gammaVal.textContent = gamma.toFixed(2);
        const algo = dom.algo.value;
        if (algo === 'policy-improve') {
            gridState.policy = improvePolicy(gridState.V);
            const n = gridState.V.length;
            const avgV = gridState.V.reduce((sum, v) => sum + v, 0) / n;
            gridState.history.push({ V: gridState.V.slice(), policy: gridState.policy.slice() });
            gridState.deltaHistory.push(0);
            gridState.avgHistory.push(avgV);
            gridState.viewIndex = gridState.history.length - 1;
            if (dom.iter) {
                dom.iter.max = gridState.history.length - 1;
                dom.iter.value = gridState.viewIndex;
            }
            if (dom.iterVal) dom.iterVal.textContent = gridState.viewIndex.toString();
            startGridAnimation(gridState.history[gridState.viewIndex].V);
            drawGridworldChart();
            return;
        }
        const n = gridState.V.length;
        const nextV = gridState.V.slice();
        let maxDelta = 0;
        for (let i = 0; i < n; i++) {
            if (gridState.env.isWall(i) || gridState.env.isTerminal(i)) {
                nextV[i] = 0;
                continue;
            }
            if (algo === 'policy-eval') {
                const action = gridState.policy[i];
                nextV[i] = computeQ(i, action, gridState.V, gamma);
            } else {
                let bestQ = -Infinity;
                for (let a = 0; a < 4; a++) {
                    const q = computeQ(i, a, gridState.V, gamma);
                    if (q > bestQ) bestQ = q;
                }
                nextV[i] = bestQ;
            }
            maxDelta = Math.max(maxDelta, Math.abs(nextV[i] - gridState.V[i]));
        }
        gridState.V = nextV;
        if (algo === 'policy-iteration') {
            gridState.policy = improvePolicy(gridState.V);
        } else if (algo === 'value-iteration') {
            gridState.policy = improvePolicy(gridState.V);
        }
        gridState.history.push({ V: gridState.V.slice(), policy: gridState.policy.slice() });
        const avgV = gridState.V.reduce((sum, v) => sum + v, 0) / n;
        gridState.deltaHistory.push(maxDelta);
        gridState.avgHistory.push(avgV);
        gridState.viewIndex = gridState.history.length - 1;
        if (dom.iter) {
            dom.iter.max = gridState.history.length - 1;
            dom.iter.value = gridState.viewIndex;
        }
        if (dom.iterVal) dom.iterVal.textContent = gridState.viewIndex.toString();
        startGridAnimation(gridState.history[gridState.viewIndex].V);
        drawGridworldChart();
    };

    const togglePlay = () => {
        gridState.playing = !gridState.playing;
        if (dom.play) dom.play.textContent = gridState.playing ? 'Pause' : 'Play';
        if (gridState.playing) {
            gridState.timer = setInterval(iterate, 300);
        } else if (gridState.timer) {
            clearInterval(gridState.timer);
        }
    };

    const onSlider = () => {
        const idx = parseInt(dom.iter.value, 10);
        gridState.viewIndex = idx;
        if (dom.iterVal) dom.iterVal.textContent = idx.toString();
        const snapshot = gridState.history[idx];
        if (snapshot) {
            gridState.policy = snapshot.policy.slice();
            startGridAnimation(snapshot.V);
        }
    };

    const onCanvasClick = (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const cellSize = Math.min(canvas.width / gridState.env.cols, canvas.height / gridState.env.rows);
        const offsetX = (canvas.width - cellSize * gridState.env.cols) / 2;
        const offsetY = (canvas.height - cellSize * gridState.env.rows) / 2;
        const col = Math.floor((x - offsetX) / cellSize);
        const row = Math.floor((y - offsetY) / cellSize);
        if (row < 0 || col < 0 || row >= gridState.env.rows || col >= gridState.env.cols) {
            return;
        }
        const idx = gridState.env.toIndex(row, col);
        gridState.selectedState = idx;
        if (!dom.inspectValues) return;
        if (gridState.env.isWall(idx)) {
            dom.inspectValues.textContent = 'Wall cell.';
            return;
        }
        if (gridState.env.isTerminal(idx)) {
            dom.inspectValues.textContent = 'Terminal state.';
            return;
        }
        const gamma = parseFloat(dom.gamma.value);
        const values = gridState.history[gridState.viewIndex].V;
        const actions = ['Up', 'Right', 'Down', 'Left'];
        dom.inspectValues.innerHTML = actions.map((label, a) => {
            const q = computeQ(idx, a, values, gamma);
            return `<div>${label}: ${q.toFixed(2)}</div>`;
        }).join('');
    };

    if (dom.iterate) dom.iterate.addEventListener('click', iterate);
    if (dom.play) dom.play.addEventListener('click', togglePlay);
    if (dom.randomize) {
        dom.randomize.addEventListener('click', () => {
            const seed = Math.floor(Math.random() * 1000);
            const baseEnv = buildEnv(seed);
            const randomEnv = createRandomGridworld(baseEnv.rows, baseEnv.cols, seed);
            resetGrid(seed, randomEnv);
        });
    }
    if (dom.iter) dom.iter.addEventListener('input', onSlider);
    if (dom.gamma) dom.gamma.addEventListener('input', updateLabels);
    if (dom.stepCost) dom.stepCost.addEventListener('input', () => resetGrid(5, gridState.env));
    if (dom.slip) dom.slip.addEventListener('input', () => resetGrid(5, gridState.env));
    if (dom.preset) dom.preset.addEventListener('change', () => resetGrid(5));
    if (canvas) canvas.addEventListener('click', onCanvasClick);
    resetGrid(5);
}

function startGridAnimation(targetValues) {
    if (!targetValues) return;
    const fromValues = gridState.anim?.currentValues || gridState.history[gridState.viewIndex]?.V || targetValues;
    gridState.anim = {
        start: performance.now(),
        duration: 300,
        from: fromValues.slice(),
        to: targetValues.slice(),
        currentValues: fromValues.slice()
    };
    requestAnimationFrame(drawGridworld);
}

function drawGridworld() {
    const canvas = document.getElementById('gridworldCanvas');
    if (!canvas || !gridState.env) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dom = {
        showValues: document.getElementById('gridShowValues'),
        showHeat: document.getElementById('gridShowHeat'),
        showPolicy: document.getElementById('gridShowPolicy')
    };
    const width = canvas.width;
    const height = canvas.height;
    const cellSize = Math.min(width / gridState.env.cols, height / gridState.env.rows);
    const offsetX = (width - cellSize * gridState.env.cols) / 2;
    const offsetY = (height - cellSize * gridState.env.rows) / 2;
    ctx.clearRect(0, 0, width, height);

    let displayValues = gridState.history[gridState.viewIndex]?.V || gridState.V;
    if (gridState.anim) {
        const now = performance.now();
        const t = clamp((now - gridState.anim.start) / gridState.anim.duration, 0, 1);
        displayValues = gridState.anim.from.map((v, i) => lerp(v, gridState.anim.to[i], t));
        if (t < 1) {
            gridState.anim.currentValues = displayValues;
            requestAnimationFrame(drawGridworld);
        } else {
            gridState.anim = null;
        }
    }
    const values = displayValues || [];
    const valueMin = Math.min(...values);
    const valueMax = Math.max(...values);

    for (let r = 0; r < gridState.env.rows; r++) {
        for (let c = 0; c < gridState.env.cols; c++) {
            const idx = gridState.env.toIndex(r, c);
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            if (gridState.env.isWall(idx)) {
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(x, y, cellSize, cellSize);
            } else if (gridState.env.isTerminal(idx)) {
                const reward = gridState.env.terminalRewards.get(idx);
                ctx.fillStyle = reward > 0 ? '#bbf7d0' : '#fecaca';
                ctx.fillRect(x, y, cellSize, cellSize);
            } else if (dom.showHeat?.checked) {
                const normalized = (values[idx] - valueMin) / Math.max(0.0001, valueMax - valueMin);
                const color = `rgba(56, 189, 248, ${0.15 + normalized * 0.6})`;
                ctx.fillStyle = color;
                ctx.fillRect(x, y, cellSize, cellSize);
            } else {
                ctx.fillStyle = '#f8fafc';
                ctx.fillRect(x, y, cellSize, cellSize);
            }
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(x, y, cellSize, cellSize);
            if (dom.showValues?.checked && !gridState.env.isWall(idx)) {
                ctx.fillStyle = '#1f2937';
                ctx.font = '12px "Nunito", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(values[idx].toFixed(2), x + cellSize / 2, y + cellSize / 2 + 4);
            }
        }
    }

    if (dom.showPolicy?.checked) {
        const policy = gridState.history[gridState.viewIndex]?.policy || gridState.policy;
        const arrows = [
            { dx: 0, dy: -12 },
            { dx: 12, dy: 0 },
            { dx: 0, dy: 12 },
            { dx: -12, dy: 0 }
        ];
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        for (let r = 0; r < gridState.env.rows; r++) {
            for (let c = 0; c < gridState.env.cols; c++) {
                const idx = gridState.env.toIndex(r, c);
                if (gridState.env.isWall(idx) || gridState.env.isTerminal(idx)) continue;
                const action = policy[idx] ?? 0;
                const centerX = offsetX + c * cellSize + cellSize / 2;
                const centerY = offsetY + r * cellSize + cellSize / 2;
                const arrow = arrows[action];
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + arrow.dx, centerY + arrow.dy);
                ctx.stroke();
            }
        }
    }
}

function drawGridworldChart() {
    const chart = document.getElementById('gridworldChart');
    if (!chart) return;
    const ctx = chart.getContext('2d');
    drawLineChart(ctx, [gridState.deltaHistory, gridState.avgHistory], {
        colors: ['#ef4444', '#0ea5e9'],
        maxY: Math.max(1, ...gridState.deltaHistory, ...gridState.avgHistory)
    });
}

const mcState = {
    env: null,
    values: [],
    Q: [],
    saCounts: [],
    policy: [],
    counts: [],
    returnHistory: [],
    valueHistory: [],
    path: [],
    pathIndex: 0,
    playing: false,
    timer: null
};

function setupMonteCarlo() {
    const canvas = document.getElementById('mcGridCanvas');
    if (!canvas) return;
    const dom = {
        episodes: document.getElementById('mcEpisodes'),
        epsilon: document.getElementById('mcEpsilon'),
        epsilonVal: document.getElementById('mcEpsilonVal'),
        run: document.getElementById('mcRun'),
        play: document.getElementById('mcPlay'),
        reset: document.getElementById('mcReset')
    };

    const reset = () => {
        if (mcState.timer) {
            clearInterval(mcState.timer);
            mcState.timer = null;
        }
        mcState.playing = false;
        if (dom.play) dom.play.textContent = 'Play';
        mcState.env = createPresetGridworld('classic-5', 12);
        mcState.env.stepCost = -0.04;
        mcState.env.slip = 0;
        const n = mcState.env.rows * mcState.env.cols;
        mcState.values = Array(n).fill(0);
        mcState.Q = Array.from({ length: n }, () => Array(4).fill(0));
        mcState.saCounts = Array.from({ length: n }, () => Array(4).fill(0));
        mcState.policy = Array.from({ length: n }, () => 0);
        mcState.counts = Array(n).fill(0);
        mcState.returnHistory = [];
        mcState.valueHistory = [];
        mcState.path = [];
        mcState.pathIndex = 0;
        drawMonteCarlo();
    };

    const runEpisode = () => {
        const gamma = 0.9;
        const epsilon = parseFloat(dom.epsilon.value);
        if (dom.epsilonVal) dom.epsilonVal.textContent = epsilon.toFixed(2);
        let state = mcState.env.reset();
        const episode = [];
        for (let step = 0; step < 40; step++) {
            const actions = mcState.env.actions(state);
            if (!actions.length) break;
            let action = mcState.policy[state] ?? actions[0];
            if (Math.random() < epsilon) {
                action = actions[Math.floor(Math.random() * actions.length)];
            }
            const result = mcState.env.sampleTransition(state, action);
            episode.push({ state, action, reward: result.reward });
            state = result.nextState;
            if (result.done) break;
        }
        let G = 0;
        const visited = new Set();
        for (let t = episode.length - 1; t >= 0; t--) {
            const step = episode[t];
            G = step.reward + gamma * G;
            const key = `${step.state}-${step.action}`;
            if (!visited.has(key)) {
                visited.add(key);
                mcState.saCounts[step.state][step.action] += 1;
                const count = mcState.saCounts[step.state][step.action];
                const oldQ = mcState.Q[step.state][step.action];
                mcState.Q[step.state][step.action] = oldQ + (G - oldQ) / count;
                mcState.counts[step.state] += 1;
            }
        }
        mcState.values = mcState.Q.map(qValues => Math.max(...qValues));
        mcState.policy = mcState.Q.map(qValues => qValues.indexOf(Math.max(...qValues)));
        mcState.returnHistory.push(G);
        const startValue = mcState.values[mcState.env.start] || 0;
        mcState.valueHistory.push(startValue);
        mcState.path = episode.map(step => step.state);
        mcState.pathIndex = 0;
        drawMonteCarlo();
    };

    const play = () => {
        mcState.playing = !mcState.playing;
        if (dom.play) dom.play.textContent = mcState.playing ? 'Pause' : 'Play';
        if (mcState.playing) {
            mcState.timer = setInterval(() => {
                runEpisode();
            }, 400);
        } else if (mcState.timer) {
            clearInterval(mcState.timer);
        }
    };

    if (dom.epsilon) dom.epsilon.addEventListener('input', () => {
        if (dom.epsilonVal) dom.epsilonVal.textContent = parseFloat(dom.epsilon.value).toFixed(2);
    });
    if (dom.run) dom.run.addEventListener('click', runEpisode);
    if (dom.play) dom.play.addEventListener('click', play);
    if (dom.reset) dom.reset.addEventListener('click', reset);
    reset();
}

function drawMonteCarlo() {
    const gridCanvas = document.getElementById('mcGridCanvas');
    if (!gridCanvas || !mcState.env) return;
    const ctx = gridCanvas.getContext('2d');
    const width = gridCanvas.width;
    const height = gridCanvas.height;
    const cellSize = Math.min(width / mcState.env.cols, height / mcState.env.rows);
    const offsetX = (width - cellSize * mcState.env.cols) / 2;
    const offsetY = (height - cellSize * mcState.env.rows) / 2;
    ctx.clearRect(0, 0, width, height);
    for (let r = 0; r < mcState.env.rows; r++) {
        for (let c = 0; c < mcState.env.cols; c++) {
            const idx = mcState.env.toIndex(r, c);
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;
            if (mcState.env.isWall(idx)) {
                ctx.fillStyle = '#94a3b8';
            } else if (mcState.env.isTerminal(idx)) {
                const reward = mcState.env.terminalRewards.get(idx);
                ctx.fillStyle = reward > 0 ? '#bbf7d0' : '#fecaca';
            } else {
                const value = mcState.values[idx] || 0;
                const intensity = clamp((value + 1) / 2, 0, 1);
                ctx.fillStyle = `rgba(56, 189, 248, ${0.1 + intensity * 0.6})`;
            }
            ctx.fillRect(x, y, cellSize, cellSize);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(x, y, cellSize, cellSize);
        }
    }
    if (mcState.path.length) {
        const idx = mcState.path[Math.min(mcState.pathIndex, mcState.path.length - 1)];
        const { row, col } = mcState.env.fromIndex(idx);
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(offsetX + col * cellSize + cellSize / 2, offsetY + row * cellSize + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
        ctx.fill();
        mcState.pathIndex = (mcState.pathIndex + 1) % mcState.path.length;
    }

    const returnsCanvas = document.getElementById('mcReturnsCanvas');
    if (returnsCanvas) {
        const rctx = returnsCanvas.getContext('2d');
        const values = mcState.returnHistory.slice(-20);
        drawBarChart(rctx, values.map(v => v + 2), { max: 4, colors: ['#38bdf8'] });
    }
    const valueCanvas = document.getElementById('mcValueCanvas');
    if (valueCanvas) {
        const vctx = valueCanvas.getContext('2d');
        drawLineChart(vctx, mcState.valueHistory, { colors: ['#10b981'] });
    }
}

const tdState = {
    values: Array(5).fill(0.5),
    history: [],
    lastDeltas: [],
    playing: false,
    timer: null
};

function setupTd() {
    const canvas = document.getElementById('tdValueCanvas');
    if (!canvas) return;
    const dom = {
        alpha: document.getElementById('tdAlpha'),
        alphaVal: document.getElementById('tdAlphaVal'),
        run: document.getElementById('tdRun'),
        play: document.getElementById('tdPlay'),
        reset: document.getElementById('tdReset')
    };

    const reset = () => {
        if (tdState.timer) {
            clearInterval(tdState.timer);
            tdState.timer = null;
        }
        tdState.playing = false;
        if (dom.play) dom.play.textContent = 'Play';
        tdState.values = Array(5).fill(0.5);
        tdState.history = [];
        tdState.lastDeltas = [];
        drawTdCharts();
    };

    const runEpisode = () => {
        const alpha = parseFloat(dom.alpha.value);
        if (dom.alphaVal) dom.alphaVal.textContent = alpha.toFixed(2);
        let state = 2;
        const gamma = 1;
        const deltas = [];
        for (let step = 0; step < 50; step++) {
            const action = Math.random() < 0.5 ? -1 : 1;
            const next = state + action;
            let reward = 0;
            let done = false;
            if (next < 0) {
                reward = 0;
                done = true;
            } else if (next > 4) {
                reward = 1;
                done = true;
            }
            const nextValue = done ? 0 : tdState.values[next];
            const delta = reward + gamma * nextValue - tdState.values[state];
            tdState.values[state] += alpha * delta;
            deltas.push(delta);
            if (done) break;
            state = next;
        }
        tdState.lastDeltas = deltas;
        tdState.history.push(tdState.values.slice());
        drawTdCharts();
    };

    const play = () => {
        tdState.playing = !tdState.playing;
        if (dom.play) dom.play.textContent = tdState.playing ? 'Pause' : 'Play';
        if (tdState.playing) {
            tdState.timer = setInterval(runEpisode, 350);
        } else if (tdState.timer) {
            clearInterval(tdState.timer);
        }
    };

    if (dom.alpha) dom.alpha.addEventListener('input', () => {
        if (dom.alphaVal) dom.alphaVal.textContent = parseFloat(dom.alpha.value).toFixed(2);
    });
    if (dom.run) dom.run.addEventListener('click', runEpisode);
    if (dom.play) dom.play.addEventListener('click', play);
    if (dom.reset) dom.reset.addEventListener('click', reset);
    reset();
}

function drawTdCharts() {
    const valueCanvas = document.getElementById('tdValueCanvas');
    if (valueCanvas) {
        const ctx = valueCanvas.getContext('2d');
        drawBarChart(ctx, tdState.values, { colors: ['#0ea5e9', '#38bdf8', '#60a5fa', '#a78bfa', '#f472b6'] });
    }
    const errorCanvas = document.getElementById('tdErrorCanvas');
    if (errorCanvas) {
        const ctx = errorCanvas.getContext('2d');
        drawLineChart(ctx, tdState.lastDeltas, { colors: ['#ef4444'] });
    }
    const episodeCanvas = document.getElementById('tdEpisodeCanvas');
    if (episodeCanvas) {
        const ctx = episodeCanvas.getContext('2d');
        const series = [];
        for (let i = 0; i < 5; i++) {
            series.push(tdState.history.map(values => values[i]));
        }
        drawLineChart(ctx, series, {
            colors: ['#0ea5e9', '#38bdf8', '#60a5fa', '#a78bfa', '#f472b6'],
            maxY: 1
        });
    }
}

const controlState = {
    env: null,
    Q: [],
    returns: [],
    epsilonHistory: [],
    playing: false,
    timer: null
};

function setupControl() {
    const canvas = document.getElementById('controlGridCanvas');
    if (!canvas) return;
    const dom = {
        algo: document.getElementById('controlAlgo'),
        epsilon: document.getElementById('controlEpsilon'),
        epsilonVal: document.getElementById('controlEpsilonVal'),
        alpha: document.getElementById('controlAlpha'),
        alphaVal: document.getElementById('controlAlphaVal'),
        run: document.getElementById('controlRun'),
        play: document.getElementById('controlPlay'),
        reset: document.getElementById('controlReset')
    };

    const reset = () => {
        if (controlState.timer) {
            clearInterval(controlState.timer);
            controlState.timer = null;
        }
        controlState.playing = false;
        if (dom.play) dom.play.textContent = 'Play';
        controlState.env = createPresetGridworld('classic-5', 22);
        controlState.env.stepCost = -0.04;
        controlState.env.slip = 0;
        const n = controlState.env.rows * controlState.env.cols;
        controlState.Q = Array.from({ length: n }, () => Array(4).fill(0));
        controlState.returns = [];
        controlState.epsilonHistory = [];
        drawControlCharts();
    };

    const chooseAction = (state, epsilon) => {
        const actions = controlState.env.actions(state);
        if (!actions.length) return null;
        if (Math.random() < epsilon) {
            return actions[Math.floor(Math.random() * actions.length)];
        }
        const qValues = controlState.Q[state];
        let best = actions[0];
        let bestQ = -Infinity;
        actions.forEach(action => {
            const q = qValues[action];
            if (q > bestQ) {
                bestQ = q;
                best = action;
            }
        });
        return best;
    };

    const expectedQ = (state, epsilon) => {
        const actions = controlState.env.actions(state);
        if (!actions.length) return 0;
        const qValues = controlState.Q[state];
        const best = Math.max(...actions.map(a => qValues[a]));
        const uniform = actions.length;
        return actions.reduce((sum, action) => {
            const prob = action === qValues.indexOf(best) ? (1 - epsilon) + epsilon / uniform : epsilon / uniform;
            return sum + prob * qValues[action];
        }, 0);
    };

    const runEpisode = () => {
        const epsilon = parseFloat(dom.epsilon.value);
        const alpha = parseFloat(dom.alpha.value);
        const gamma = 0.9;
        if (dom.epsilonVal) dom.epsilonVal.textContent = epsilon.toFixed(2);
        if (dom.alphaVal) dom.alphaVal.textContent = alpha.toFixed(2);
        let state = controlState.env.reset();
        let action = chooseAction(state, epsilon);
        let totalReward = 0;
        for (let step = 0; step < 60; step++) {
            if (action === null) break;
            const result = controlState.env.step(action);
            totalReward += result.reward;
            const nextAction = chooseAction(result.nextState, epsilon);
            let target = result.reward;
            if (!result.done) {
                if (dom.algo.value === 'sarsa') {
                    target += gamma * controlState.Q[result.nextState][nextAction ?? 0];
                } else if (dom.algo.value === 'expected') {
                    target += gamma * expectedQ(result.nextState, epsilon);
                } else {
                    const nextQs = controlState.Q[result.nextState];
                    target += gamma * Math.max(...nextQs);
                }
            }
            controlState.Q[state][action] += alpha * (target - controlState.Q[state][action]);
            if (result.done) break;
            state = result.nextState;
            action = dom.algo.value === 'sarsa' ? nextAction : chooseAction(state, epsilon);
        }
        controlState.returns.push(totalReward);
        controlState.epsilonHistory.push(epsilon);
        drawControlCharts();
    };

    const play = () => {
        controlState.playing = !controlState.playing;
        if (dom.play) dom.play.textContent = controlState.playing ? 'Pause' : 'Play';
        if (controlState.playing) {
            controlState.timer = setInterval(runEpisode, 350);
        } else if (controlState.timer) {
            clearInterval(controlState.timer);
        }
    };

    if (dom.epsilon) dom.epsilon.addEventListener('input', () => {
        if (dom.epsilonVal) dom.epsilonVal.textContent = parseFloat(dom.epsilon.value).toFixed(2);
    });
    if (dom.alpha) dom.alpha.addEventListener('input', () => {
        if (dom.alphaVal) dom.alphaVal.textContent = parseFloat(dom.alpha.value).toFixed(2);
    });
    if (dom.run) dom.run.addEventListener('click', runEpisode);
    if (dom.play) dom.play.addEventListener('click', play);
    if (dom.reset) dom.reset.addEventListener('click', reset);
    reset();
}

function drawControlCharts() {
    const gridCanvas = document.getElementById('controlGridCanvas');
    if (gridCanvas && controlState.env) {
        const ctx = gridCanvas.getContext('2d');
        const width = gridCanvas.width;
        const height = gridCanvas.height;
        const cellSize = Math.min(width / controlState.env.cols, height / controlState.env.rows);
        const offsetX = (width - cellSize * controlState.env.cols) / 2;
        const offsetY = (height - cellSize * controlState.env.rows) / 2;
        ctx.clearRect(0, 0, width, height);
        for (let r = 0; r < controlState.env.rows; r++) {
            for (let c = 0; c < controlState.env.cols; c++) {
                const idx = controlState.env.toIndex(r, c);
                const x = offsetX + c * cellSize;
                const y = offsetY + r * cellSize;
                if (controlState.env.isWall(idx)) {
                    ctx.fillStyle = '#94a3b8';
                } else if (controlState.env.isTerminal(idx)) {
                    const reward = controlState.env.terminalRewards.get(idx);
                    ctx.fillStyle = reward > 0 ? '#bbf7d0' : '#fecaca';
                } else {
                    ctx.fillStyle = '#f8fafc';
                }
                ctx.fillRect(x, y, cellSize, cellSize);
                ctx.strokeStyle = '#e2e8f0';
                ctx.strokeRect(x, y, cellSize, cellSize);
                if (!controlState.env.isWall(idx) && !controlState.env.isTerminal(idx)) {
                    const qValues = controlState.Q[idx];
                    const bestAction = qValues.indexOf(Math.max(...qValues));
                    const arrows = [
                        { dx: 0, dy: -12 },
                        { dx: 12, dy: 0 },
                        { dx: 0, dy: 12 },
                        { dx: -12, dy: 0 }
                    ];
                    const arrow = arrows[bestAction];
                    ctx.strokeStyle = '#0f172a';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(x + cellSize / 2, y + cellSize / 2);
                    ctx.lineTo(x + cellSize / 2 + arrow.dx, y + cellSize / 2 + arrow.dy);
                    ctx.stroke();
                }
            }
        }
    }
    const qCanvas = document.getElementById('controlQCanvas');
    if (qCanvas && controlState.env) {
        const ctx = qCanvas.getContext('2d');
        const width = qCanvas.width;
        const height = qCanvas.height;
        ctx.clearRect(0, 0, width, height);
        const miniWidth = width / 2;
        const miniHeight = height / 2;
        const actions = ['Up', 'Right', 'Down', 'Left'];
        for (let i = 0; i < 4; i++) {
            const offsetX = (i % 2) * miniWidth;
            const offsetY = Math.floor(i / 2) * miniHeight;
            const cellSize = Math.min(miniWidth / controlState.env.cols, miniHeight / controlState.env.rows);
            const gridWidth = cellSize * controlState.env.cols;
            const gridHeight = cellSize * controlState.env.rows;
            const originX = offsetX + (miniWidth - gridWidth) / 2;
            const originY = offsetY + (miniHeight - gridHeight) / 2;
            for (let r = 0; r < controlState.env.rows; r++) {
                for (let c = 0; c < controlState.env.cols; c++) {
                    const idx = controlState.env.toIndex(r, c);
                    const q = controlState.Q[idx][i] || 0;
                    const intensity = clamp((q + 1) / 2, 0, 1);
                    ctx.fillStyle = `rgba(14, 165, 233, ${0.15 + intensity * 0.6})`;
                    ctx.fillRect(originX + c * cellSize, originY + r * cellSize, cellSize, cellSize);
                    ctx.strokeStyle = '#e2e8f0';
                    ctx.strokeRect(originX + c * cellSize, originY + r * cellSize, cellSize, cellSize);
                }
            }
            ctx.fillStyle = '#1f2937';
            ctx.font = '12px "Nunito", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(actions[i], offsetX + miniWidth / 2, offsetY + miniHeight - 8);
        }
    }
    const epsCanvas = document.getElementById('controlEpsCanvas');
    if (epsCanvas) {
        const ctx = epsCanvas.getContext('2d');
        drawLineChart(ctx, controlState.epsilonHistory, { colors: ['#f97316'], maxY: 1 });
    }
    const returnCanvas = document.getElementById('controlReturnCanvas');
    if (returnCanvas) {
        const ctx = returnCanvas.getContext('2d');
        drawLineChart(ctx, controlState.returns, { colors: ['#10b981'] });
    }
}

const notebookCompilerState = {
    pyodidePromise: null
};

function loadPyodideScript() {
    if (window.loadPyodide) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load the Python runtime.'));
        document.head.appendChild(script);
    });
}

async function ensureNotebookPyodide(statusEl) {
    if (!notebookCompilerState.pyodidePromise) {
        if (statusEl) statusEl.textContent = 'Loading Python runtime...';
        notebookCompilerState.pyodidePromise = (async () => {
            await loadPyodideScript();
            const pyodide = await window.loadPyodide({
                indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'
            });
            await pyodide.runPythonAsync('notebook_globals = {}');
            return pyodide;
        })().catch(err => {
            notebookCompilerState.pyodidePromise = null;
            throw err;
        });
    }
    return notebookCompilerState.pyodidePromise;
}

async function runNotebookCode(code, outputEl, statusEl) {
    if (!outputEl) return;
    const trimmed = code.trim();
    if (!trimmed) {
        if (statusEl) statusEl.textContent = 'Add some code to run.';
        outputEl.textContent = '';
        outputEl.classList.remove('has-error');
        return;
    }

    outputEl.textContent = '';
    outputEl.classList.remove('has-error');
    if (statusEl) statusEl.textContent = 'Loading Python runtime...';

    let pyodide;
    try {
        pyodide = await ensureNotebookPyodide(statusEl);
        const wantsPlot = /matplotlib|plt\./.test(code);
        if (wantsPlot && pyodide.loadPackage) {
            if (statusEl) statusEl.textContent = 'Loading matplotlib...';
            await pyodide.loadPackage('matplotlib');
        }
        if (statusEl) statusEl.textContent = 'Running...';
        pyodide.globals.set('code', code);
        const resultJson = await pyodide.runPythonAsync(`
import sys, io, traceback, json
_stdout = io.StringIO()
_stderr = io.StringIO()
_svg = ""
sys.stdout = _stdout
sys.stderr = _stderr
try:
    exec(code, notebook_globals)
    try:
        import matplotlib.pyplot as plt
        if plt.get_fignums():
            _buf = io.StringIO()
            plt.savefig(_buf, format="svg")
            _svg = _buf.getvalue()
            plt.close("all")
    except Exception:
        pass
except Exception:
    traceback.print_exc()
finally:
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
json.dumps({"stdout": _stdout.getvalue(), "stderr": _stderr.getvalue(), "svg": _svg})
        `);
        const result = JSON.parse(resultJson);
        if (result.stderr) {
            outputEl.textContent = result.stderr;
            outputEl.classList.add('has-error');
        } else {
            outputEl.classList.remove('has-error');
            outputEl.innerHTML = '';
            const hasText = result.stdout && result.stdout.trim();
            const hasSvg = result.svg && result.svg.trim();
            if (hasText) {
                const textBlock = document.createElement('pre');
                textBlock.className = 'cell-output-text';
                textBlock.textContent = result.stdout;
                outputEl.appendChild(textBlock);
            }
            if (hasSvg) {
                const figure = document.createElement('div');
                figure.className = 'cell-output-figure';
                figure.innerHTML = result.svg;
                outputEl.appendChild(figure);
            }
            if (!hasText && !hasSvg) {
                outputEl.textContent = 'No output.';
            }
        }
        if (statusEl) statusEl.textContent = 'Done.';
    } catch (err) {
        outputEl.textContent = err?.message || String(err);
        outputEl.classList.add('has-error');
        if (statusEl) statusEl.textContent = 'Error.';
    } finally {
        if (pyodide) {
            pyodide.globals.delete('code');
        }
    }
}

async function resetNotebookKernel(statusEl, outputEls = []) {
    if (!statusEl) return;
    if (!notebookCompilerState.pyodidePromise) {
        statusEl.textContent = 'Kernel will reset after first run.';
        outputEls.forEach(outputEl => {
            outputEl.textContent = '';
            outputEl.classList.remove('has-error');
        });
        return;
    }

    try {
        const pyodide = await notebookCompilerState.pyodidePromise;
        await pyodide.runPythonAsync('notebook_globals = {}');
        statusEl.textContent = 'Kernel reset.';
        outputEls.forEach(outputEl => {
            outputEl.textContent = '';
            outputEl.classList.remove('has-error');
        });
    } catch (err) {
        statusEl.textContent = err?.message || 'Failed to reset.';
        outputEls.forEach(outputEl => {
            outputEl.classList.add('has-error');
        });
    }
}

const fundamentalsPlaygroundSnippets = {
    default: [
        '# Example: vector dot + softmax',
        'import math',
        '',
        'x = [2, -1, 3]',
        'w = [0.5, 1.2, -0.7]',
        '',
        'dot = sum(a * b for a, b in zip(x, w))',
        'scores = [dot, dot - 1.5, dot + 0.4]',
        'exp_scores = [math.exp(s) for s in scores]',
        'softmax = [s / sum(exp_scores) for s in exp_scores]',
        '',
        'print("dot:", round(dot, 3))',
        'print("softmax:", [round(p, 3) for p in softmax])'
    ].join('\n'),
    vector: [
        '# Vector basics: dot, norm, cosine similarity',
        'import math',
        '',
        'x = [2.0, -1.0, 3.0]',
        'w = [1.5, 0.5, -2.0]',
        '',
        'dot = sum(a * b for a, b in zip(x, w))',
        'norm_x = math.sqrt(sum(v * v for v in x))',
        'norm_w = math.sqrt(sum(v * v for v in w))',
        'cosine = dot / (norm_x * norm_w)',
        '',
        'print("x:", x)',
        'print("w:", w)',
        'print("dot:", round(dot, 3))',
        'print("||x||:", round(norm_x, 3))',
        'print("||w||:", round(norm_w, 3))',
        'print("cosine:", round(cosine, 3))'
    ].join('\n'),
    vector_projection: [
        '# Vector projection of x onto w',
        'import math',
        '',
        'x = [3.0, 1.0]',
        'w = [1.0, 2.0]',
        '',
        'dot = sum(a * b for a, b in zip(x, w))',
        'w_norm_sq = sum(v * v for v in w)',
        'scale = dot / w_norm_sq',
        'proj = [scale * v for v in w]',
        '',
        'print("proj:", [round(v, 3) for v in proj])'
    ].join('\n'),
    vector_distance: [
        '# Vector distance: L2 and L1',
        'x = [1.0, -2.0, 0.5]',
        'y = [-1.0, 0.0, 2.5]',
        '',
        'diff = [a - b for a, b in zip(x, y)]',
        'l2 = sum(d * d for d in diff) ** 0.5',
        'l1 = sum(abs(d) for d in diff)',
        '',
        'print("diff:", [round(d, 2) for d in diff])',
        'print("L2:", round(l2, 3))',
        'print("L1:", round(l1, 3))'
    ].join('\n'),
    vector_unit: [
        '# Unit vector and scaling',
        'import math',
        '',
        'v = [3.0, 4.0]',
        'norm = math.sqrt(sum(x * x for x in v))',
        'unit = [x / norm for x in v]',
        'scaled = [2.5 * x for x in unit]',
        '',
        'print("unit:", [round(x, 3) for x in unit])',
        'print("scaled:", [round(x, 3) for x in scaled])'
    ].join('\n'),
    vector_basis: [
        '# Basis change (2D)',
        'basis = [',
        '    [1.0, 1.0],',
        '    [1.0, -1.0]',
        ']',
        'coords = [2.0, -1.0]',
        '',
        'x = [',
        '    basis[0][0] * coords[0] + basis[0][1] * coords[1],',
        '    basis[1][0] * coords[0] + basis[1][1] * coords[1]',
        ']',
        '',
        'print("coords:", coords)',
        'print("x:", [round(v, 3) for v in x])'
    ].join('\n'),
    linear: [
        '# Linear algebra: matrix * vector',
        'W = [[1.2, -0.4],',
        '     [0.3, 0.9]]',
        'x = [2.0, -1.5]',
        '',
        'y = [',
        '    W[0][0] * x[0] + W[0][1] * x[1],',
        '    W[1][0] * x[0] + W[1][1] * x[1],',
        ']',
        '',
        'print("y:", [round(v, 3) for v in y])'
    ].join('\n'),
    calculus: [
        '# Chain rule via numeric gradient',
        'import math',
        '',
        'def f(x):',
        '    return math.sin(x ** 2)',
        '',
        'x = 1.3',
        'eps = 1e-4',
        'grad = (f(x + eps) - f(x - eps)) / (2 * eps)',
        '',
        'print("f(x):", round(f(x), 5))',
        'print("df/dx approx:", round(grad, 5))'
    ].join('\n'),
    optimization: [
        '# Gradient descent on a quadratic',
        'def loss(w):',
        '    return (w - 3) ** 2 + 1',
        '',
        'w = -4.0',
        'lr = 0.2',
        '',
        'for step in range(6):',
        '    grad = 2 * (w - 3)',
        '    w = w - lr * grad',
        '    print(f"step {step}: w={w:.3f} loss={loss(w):.3f}")'
    ].join('\n'),
    opt_lr: [
        '# Learning rate sweep',
        'def step(w, lr):',
        '    grad = 2 * (w - 3)',
        '    return w - lr * grad',
        '',
        'w0 = -4.0',
        'for lr in [0.05, 0.2, 0.8]:',
        '    w = w0',
        '    for _ in range(3):',
        '        w = step(w, lr)',
        '    print("lr:", lr, "w:", round(w, 3))'
    ].join('\n'),
    opt_momentum: [
        '# Momentum update',
        'w = -2.0',
        'v = 0.0',
        'lr = 0.2',
        'beta = 0.8',
        '',
        'for step in range(5):',
        '    grad = 2 * (w - 3)',
        '    v = beta * v + grad',
        '    w = w - lr * v',
        '    print(f"step {step}: w={w:.3f}")'
    ].join('\n'),
    opt_two_d: [
        '# 2D gradient descent',
        'x, y = 2.0, -1.5',
        'lr = 0.2',
        '',
        'for step in range(5):',
        '    gx = 2 * x',
        '    gy = 4 * y',
        '    x -= lr * gx',
        '    y -= lr * gy',
        '    print(f"step {step}: x={x:.3f} y={y:.3f}")'
    ].join('\n'),
    opt_gradcheck: [
        '# Gradient check (finite difference)',
        'def f(w):',
        '    return (w - 1.5) ** 2 + 0.5',
        '',
        'w = 0.7',
        'eps = 1e-4',
        'grad_num = (f(w + eps) - f(w - eps)) / (2 * eps)',
        'grad_ana = 2 * (w - 1.5)',
        '',
        'print("grad_num:", round(grad_num, 5))',
        'print("grad_ana:", round(grad_ana, 5))'
    ].join('\n'),
    probability: [
        '# Softmax and cross-entropy',
        'import math',
        '',
        'logits = [2.2, 1.1, -0.7]',
        'y_true = [1, 0, 0]',
        '',
        'exp_vals = [math.exp(z) for z in logits]',
        'probs = [v / sum(exp_vals) for v in exp_vals]',
        'loss = -sum(y * math.log(p) for y, p in zip(y_true, probs))',
        '',
        'print("probs:", [round(p, 3) for p in probs])',
        'print("loss:", round(loss, 4))'
    ].join('\n'),
    prob_bernoulli: [
        '# Bernoulli simulation',
        'import random',
        '',
        'p = 0.65',
        'trials = 20',
        'samples = [1 if random.random() < p else 0 for _ in range(trials)]',
        'mean = sum(samples) / trials',
        '',
        'print("samples:", samples)',
        'print("mean:", round(mean, 3))'
    ].join('\n'),
    prob_binomial: [
        '# Binomial pmf',
        'def comb(n, k):',
        '    k = min(k, n - k)',
        '    num = 1',
        '    den = 1',
        '    for i in range(1, k + 1):',
        '        num *= n - (k - i)',
        '        den *= i',
        '    return num // den',
        '',
        'n = 6',
        'p = 0.4',
        'pmf = [comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n + 1)]',
        '',
        'print("pmf:", [round(v, 3) for v in pmf])'
    ].join('\n'),
    prob_bayes: [
        '# Bayes update',
        'prior = 0.3',
        'likelihood = 0.7',
        'false_pos = 0.1',
        '',
        'posterior = (likelihood * prior) / (likelihood * prior + false_pos * (1 - prior))',
        'print("posterior:", round(posterior, 3))'
    ].join('\n'),
    prob_expectation: [
        '# Expectation of discrete variable',
        'values = [0, 1, 2, 3]',
        'probs = [0.1, 0.2, 0.3, 0.4]',
        'expectation = sum(v * p for v, p in zip(values, probs))',
        '',
        'print("E[X]:", round(expectation, 3))'
    ].join('\n'),
    matrix: [
        '# Batch gradient for a linear model',
        'X = [',
        '    [1.0, 2.0],',
        '    [0.0, -1.0],',
        '    [3.0, 1.0],',
        ']',
        'W = [0.5, -0.2]',
        'y = [1.0, 0.0, 1.0]',
        '',
        'y_hat = [W[0] * row[0] + W[1] * row[1] for row in X]',
        'errors = [yh - yt for yh, yt in zip(y_hat, y)]',
        '',
        'grad_w0 = sum(row[0] * err for row, err in zip(X, errors))',
        'grad_w1 = sum(row[1] * err for row, err in zip(X, errors))',
        '',
        'print("grad:", [round(grad_w0, 3), round(grad_w1, 3)])'
    ].join('\n'),
    matrix_vector: [
        '# Matrix * vector',
        'A = [',
        '    [1.0, -2.0],',
        '    [0.5, 3.0]',
        ']',
        'x = [2.0, -1.0]',
        '',
        'y = [',
        '    A[0][0] * x[0] + A[0][1] * x[1],',
        '    A[1][0] * x[0] + A[1][1] * x[1]',
        ']',
        '',
        'print("y:", [round(v, 3) for v in y])'
    ].join('\n'),
    matrix_multiply: [
        '# Matrix multiply (2x2)',
        'A = [',
        '    [1, 2],',
        '    [3, 4]',
        ']',
        'B = [',
        '    [2, 0],',
        '    [1, 2]',
        ']',
        '',
        'C = [',
        '    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],',
        '    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]',
        ']',
        '',
        'print("C:", C)'
    ].join('\n'),
    matrix_det: [
        '# Determinant (2x2)',
        'A = [',
        '    [1.2, 0.4],',
        '    [0.3, 0.9]',
        ']',
        'det = A[0][0] * A[1][1] - A[0][1] * A[1][0]',
        '',
        'print("det:", round(det, 3))'
    ].join('\n'),
    matrix_inverse: [
        '# Inverse (2x2)',
        'A = [',
        '    [1, 2],',
        '    [3, 5]',
        ']',
        'det = A[0][0] * A[1][1] - A[0][1] * A[1][0]',
        'inv = [',
        '    [A[1][1] / det, -A[0][1] / det],',
        '    [-A[1][0] / det, A[0][0] / det]',
        ']',
        '',
        'print("inv:", [[round(v, 3) for v in row] for row in inv])'
    ].join('\n')
};

const playgroundSnippetGroups = {
    foundations: [
        { id: 'linear', label: 'Linear transform' },
        { id: 'calculus', label: 'Chain rule' },
        { id: 'optimization', label: 'Gradient step' },
        { id: 'probability', label: 'Softmax' },
        { id: 'matrix', label: 'Batch update' }
    ],
    vector: [
        { id: 'vector', label: 'Dot + cosine' },
        { id: 'vector_projection', label: 'Projection' },
        { id: 'vector_distance', label: 'Distance' },
        { id: 'vector_unit', label: 'Unit + scale' },
        { id: 'vector_basis', label: 'Basis change' }
    ],
    matrix: [
        { id: 'matrix_vector', label: 'Matrix * vector' },
        { id: 'matrix_multiply', label: 'Matrix multiply' },
        { id: 'matrix_det', label: 'Determinant' },
        { id: 'matrix_inverse', label: 'Inverse' },
        { id: 'matrix', label: 'Batch gradient' }
    ],
    probability: [
        { id: 'prob_bernoulli', label: 'Bernoulli sim' },
        { id: 'prob_binomial', label: 'Binomial pmf' },
        { id: 'probability', label: 'Logits to probs' },
        { id: 'prob_bayes', label: 'Bayes update' },
        { id: 'prob_expectation', label: 'Expectation' }
    ],
    optimization: [
        { id: 'optimization', label: 'GD step' },
        { id: 'opt_lr', label: 'Learning rate' },
        { id: 'opt_momentum', label: 'Momentum' },
        { id: 'opt_two_d', label: '2D descent' },
        { id: 'opt_gradcheck', label: 'Grad check' }
    ]
};

function setupFundamentalsPlayground() {
    const openBtn = document.getElementById('fundamentalsPlaygroundToggle');
    const loadBtn = document.getElementById('fundamentalsPlaygroundLoadExample');
    const panel = document.getElementById('fundamentalsPlaygroundPanel');
    const closeBtn = document.getElementById('fundamentalsPlaygroundClose');
    const backdrop = document.getElementById('fundamentalsPlaygroundBackdrop');
    const editor = document.getElementById('fundamentalsPythonEditor');
    const runBtn = document.getElementById('fundamentalsPythonRun');
    const resetCodeBtn = document.getElementById('fundamentalsPythonResetCode');
    const clearBtn = document.getElementById('fundamentalsPythonClear');
    const resetBtn = document.getElementById('fundamentalsPythonReset');
    const output = document.getElementById('fundamentalsPythonOutput');
    const status = document.getElementById('fundamentalsPythonStatus');
    const snippetButtons = Array.from(document.querySelectorAll('[data-fundamentals-snippet]'));
    const openButtons = Array.from(document.querySelectorAll('[data-playground-open]'));

    if (!panel || !openBtn || !editor || !output) return;

    const snippetGroupButtons = Array.from(panel.querySelectorAll('.python-snippets [data-fundamentals-snippet]'));
    const setPlaygroundSnippetGroup = (contextId) => {
        const group = playgroundSnippetGroups[contextId] || playgroundSnippetGroups.foundations;

        if (!snippetGroupButtons.length) return;
        snippetGroupButtons.forEach((button, index) => {
            const item = group[index];
            if (!item) {
                button.hidden = true;
                return;
            }
            button.hidden = false;
            button.textContent = item.label;
            button.dataset.fundamentalsSnippet = item.id;
        });
    };

    if (!editor.value.trim()) {
        editor.value = fundamentalsPlaygroundSnippets.default;
    }
    editor.dataset.defaultCode = editor.value;
    setPlaygroundSnippetGroup('foundations');

    const setStatus = (text) => {
        if (status) status.textContent = text;
    };

    const openPanel = () => {
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        openBtn.setAttribute('aria-expanded', 'true');
        if (backdrop) {
            backdrop.classList.add('is-visible');
            backdrop.setAttribute('aria-hidden', 'false');
        }
        editor.focus();
    };

    const closePanel = () => {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        openBtn.setAttribute('aria-expanded', 'false');
        if (backdrop) {
            backdrop.classList.remove('is-visible');
            backdrop.setAttribute('aria-hidden', 'true');
        }
    };

    const applySnippet = (snippetId) => {
        const snippet = fundamentalsPlaygroundSnippets[snippetId];
        if (!snippet) return;
        editor.value = snippet;
        editor.dataset.defaultCode = snippet;
        openPanel();
    };

    openBtn.addEventListener('click', () => {
        setPlaygroundSnippetGroup('foundations');
        const topicId = activeFundamentalId || 'linear';
        applySnippet(topicId);
    });
    openButtons.forEach(button => {
        button.addEventListener('click', () => {
            const snippetId = button.dataset.playgroundOpen;
            const contextId = button.dataset.playgroundContext || snippetId;
            if (contextId) {
                setPlaygroundSnippetGroup(contextId);
            }
            if (snippetId) {
                applySnippet(snippetId);
                return;
            }
            openPanel();
        });
    });
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);

    if (loadBtn) {
        loadBtn.addEventListener('click', () => {
            setPlaygroundSnippetGroup('foundations');
            const topicId = activeFundamentalId || 'linear';
            applySnippet(topicId);
        });
    }

    snippetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const contextId = button.dataset.playgroundContext;
            if (contextId) {
                setPlaygroundSnippetGroup(contextId);
            }
            applySnippet(button.dataset.fundamentalsSnippet);
        });
    });

    if (runBtn) {
        runBtn.addEventListener('click', () => {
            runNotebookCode(editor.value, output, status);
        });
    }

    if (resetCodeBtn) {
        resetCodeBtn.addEventListener('click', () => {
            editor.value = editor.dataset.defaultCode || fundamentalsPlaygroundSnippets.default;
            editor.focus();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            output.textContent = '';
            output.classList.remove('has-error');
            setStatus('Output cleared.');
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetNotebookKernel(status, [output]);
        });
    }

    editor.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            runNotebookCode(editor.value, output, status);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel.classList.contains('is-open')) {
            closePanel();
        }
    });
}

function setupNotebookLab() {
    const lab = document.querySelector('.notebook-section');
    if (!lab) return;

    const status = document.getElementById('notebookStatus');
    const runAllBtn = document.getElementById('notebookRunAll');
    const clearAllBtn = document.getElementById('notebookClearAll');
    const resetBtn = document.getElementById('notebookReset');

    const cells = Array.from(lab.querySelectorAll('.code-cell'));
    const runButtons = Array.from(lab.querySelectorAll('.cell-run'));
    const outputs = cells.map(cell => cell.querySelector('.cell-output')).filter(Boolean);

    const runCell = async (cell) => {
        const editor = cell.querySelector('.cell-editor');
        const output = cell.querySelector('.cell-output');
        if (!editor || !output) return;
        await runNotebookCode(editor.value, output, status);
    };

    const setControlsDisabled = (disabled) => {
        runButtons.forEach(btn => {
            btn.disabled = disabled;
        });
        [runAllBtn, clearAllBtn, resetBtn].forEach(btn => {
            if (btn) btn.disabled = disabled;
        });
    };

    runButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cell = button.closest('.code-cell');
            if (!cell) return;
            runCell(cell);
        });
    });

    if (runAllBtn) {
        runAllBtn.addEventListener('click', async () => {
            setControlsDisabled(true);
            for (let i = 0; i < cells.length; i++) {
                if (status) status.textContent = `Running cell ${i + 1} of ${cells.length}...`;
                await runCell(cells[i]);
            }
            if (status) status.textContent = 'Done.';
            setControlsDisabled(false);
        });
    }

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            outputs.forEach(output => {
                output.textContent = '';
                output.classList.remove('has-error');
            });
            if (status) status.textContent = 'Outputs cleared.';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetNotebookKernel(status, outputs);
        });
    }
}

function setupConceptTerminalLab() {
    const terminal = document.getElementById('conceptTerminal');
    const screen = document.getElementById('terminalScreen');
    const inputForm = document.getElementById('terminalInputForm');
    const input = document.getElementById('terminalInput');
    const stage = document.getElementById('terminalStage');
    const rainCanvas = document.getElementById('matrixRainCanvas');
    const shortcutButtons = Array.from(document.querySelectorAll('[data-terminal-command]'));

    if (!terminal || !screen || !inputForm || !input) return;

    const topics = [
        {
            id: 'foundations',
            aliases: ['roadmap', 'math-foundations'],
            title: 'Foundations Roadmap',
            chapter: 'Foundations',
            summary: 'AI systems stack linear algebra, calculus, optimization, probability, and matrix calculus.',
            buildsOn: 'Signals become vectors, then losses become gradients.',
            formula: 'theta <- theta - eta * grad(L)',
            mathDepth: 5,
            intuitionDepth: 9,
            bullets: [
                'Represent the world with vectors and matrices.',
                'Measure error with a loss function.',
                'Update parameters with gradient-based optimization.'
            ],
            visual: [
                'input x -> linear map -> activation -> prediction',
                'prediction + target -> loss L -> gradient -> update',
                'repeat over data until error stabilizes'
            ],
            quiz: {
                question: 'Why is optimization needed after defining a model?',
                keywords: ['loss', 'error', 'update', 'parameters'],
                hint: 'Focus on how weights improve.'
            }
        },
        {
            id: 'linear-algebra',
            aliases: ['linear', 'vectors', 'matrices'],
            title: 'Linear Algebra',
            chapter: 'Foundations',
            summary: 'Vectors encode features; matrices transform those features between representation spaces.',
            buildsOn: 'Coordinates and geometric transformations.',
            formula: 'h = W x + b',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Dot product measures alignment and computes weighted sums.',
                'Matrix multiplication composes transformations.',
                'Batch operations let one expression process many examples.'
            ],
            visual: [
                '[x1 x2 x3]^T  --W-->  [h1 h2 ... hk]^T',
                'rows(W) = output neurons, cols(W) = input features',
                'same rule, repeated per layer'
            ],
            quiz: {
                question: 'What does each row of W represent in h = W x + b?',
                keywords: ['neuron', 'output', 'weights', 'features'],
                hint: 'Think one output unit at a time.'
            }
        },
        {
            id: 'calculus',
            aliases: ['derivatives', 'chain-rule'],
            title: 'Calculus + Chain Rule',
            chapter: 'Foundations',
            summary: 'Derivatives quantify sensitivity; the chain rule links local slopes through deep compositions.',
            buildsOn: 'Slope as local rate of change.',
            formula: 'dL/dx = (dL/dy) * (dy/dx)',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'A derivative says how much output changes for a small input change.',
                'Backprop multiplies local derivatives layer by layer.',
                'Large gradients can destabilize training; tiny ones can stall it.'
            ],
            visual: [
                'x -> y = g(x) -> L = f(y)',
                'upstream gradient: dL/dy',
                'local slope: dy/dx  => combine to get dL/dx'
            ],
            quiz: {
                question: 'In backprop, why multiply upstream gradient by local derivative?',
                keywords: ['chain', 'rule', 'compose', 'local'],
                hint: 'The network is a composition of functions.'
            }
        },
        {
            id: 'optimization',
            aliases: ['gradient-descent', 'learning-rate'],
            title: 'Optimization',
            chapter: 'Foundations',
            summary: 'Optimization tunes parameters to reduce loss over data.',
            buildsOn: 'Gradient direction points steepest increase.',
            formula: 'w <- w - eta * dL/dw',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Move opposite the gradient to descend the loss surface.',
                'Learning rate controls step size and stability.',
                'Momentum/Adam smooth noisy updates.'
            ],
            visual: [
                'high loss',
                '   \\',
                '    \\__ step by step downhill __ minimum'
            ],
            quiz: {
                question: 'What usually happens if the learning rate is too high?',
                keywords: ['oscillate', 'diverge', 'unstable', 'overshoot'],
                hint: 'The updates move too far each step.'
            }
        },
        {
            id: 'probability',
            aliases: ['softmax', 'cross-entropy', 'likelihood'],
            title: 'Probability + Losses',
            chapter: 'Foundations',
            summary: 'Probabilistic outputs express confidence; losses compare predicted distributions to truth.',
            buildsOn: 'Scores become probabilities through normalization.',
            formula: 'p_i = exp(z_i) / sum_j exp(z_j)',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'Softmax converts logits into a normalized distribution.',
                'Cross-entropy penalizes confident wrong predictions.',
                'Likelihood links model assumptions with observed data.'
            ],
            visual: [
                'logits: [2.1, 0.4, -1.2]',
                'softmax -> [0.81, 0.16, 0.03]',
                'target class probability drives loss'
            ],
            quiz: {
                question: 'Why use cross-entropy with softmax in classification?',
                keywords: ['probability', 'distribution', 'target', 'penalize'],
                hint: 'It compares predicted and true distributions.'
            }
        },
        {
            id: 'matrix-calculus',
            aliases: ['batch-gradients', 'jacobian', 'hessian'],
            title: 'Matrix Calculus',
            chapter: 'Foundations',
            summary: 'Matrix calculus makes gradient computation vectorized and efficient for full batches.',
            buildsOn: 'Shapes and transposes must align in derivatives.',
            formula: 'dL/dW = X^T (Yhat - Y)',
            mathDepth: 8,
            intuitionDepth: 6,
            bullets: [
                'Jacobians map small input changes to output changes.',
                'Hessians capture curvature and conditioning.',
                'Vectorization replaces loops with linear algebra kernels.'
            ],
            visual: [
                'batch X: (n x d)',
                'weights W: (d x k)',
                'gradient dL/dW: (d x k)'
            ],
            quiz: {
                question: 'Why is shape tracking critical in matrix calculus?',
                keywords: ['dimension', 'shape', 'valid', 'multiply'],
                hint: 'Most bugs are dimension mismatches.'
            }
        },
        {
            id: 'ml-lifecycle',
            aliases: ['pipeline', 'workflow'],
            title: 'ML Lifecycle',
            chapter: 'Machine Learning',
            summary: 'ML is a loop: define objective, collect data, train, evaluate, deploy, monitor, improve.',
            buildsOn: 'Model quality depends as much on data and evaluation as on architecture.',
            formula: 'data -> train -> eval -> deploy -> monitor -> retrain',
            mathDepth: 4,
            intuitionDepth: 9,
            bullets: [
                'Data quality and labels often dominate model outcomes.',
                'Offline metrics do not guarantee production success.',
                'Monitoring catches drift and regression.'
            ],
            visual: [
                '[Problem] -> [Data] -> [Model] -> [Eval]',
                '      ^                           |',
                '      +------[Feedback loop]-----+'
            ],
            quiz: {
                question: 'Which stage catches distribution drift after launch?',
                keywords: ['monitor', 'monitoring', 'production', 'drift'],
                hint: 'It happens after deployment.'
            }
        },
        {
            id: 'supervised-learning',
            aliases: ['classification', 'regression'],
            title: 'Supervised Learning',
            chapter: 'Machine Learning',
            summary: 'Learn a mapping from labeled examples so predictions generalize to unseen inputs.',
            buildsOn: 'Train/validation/test split separates fitting from evaluation.',
            formula: 'min_theta E_(x,y)[L(f_theta(x), y)]',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Regression predicts continuous values.',
                'Classification predicts discrete classes.',
                'Generalization matters more than training-set performance.'
            ],
            visual: [
                'train: fit parameters',
                'valid: tune hyperparameters',
                'test : estimate final generalization'
            ],
            quiz: {
                question: 'Why keep a validation set separate from training data?',
                keywords: ['tune', 'hyperparameter', 'overfit', 'selection'],
                hint: 'It prevents selecting settings on the training metric alone.'
            }
        },
        {
            id: 'unsupervised-learning',
            aliases: ['clustering', 'dimensionality-reduction', 'pca'],
            title: 'Unsupervised Learning',
            chapter: 'Machine Learning',
            summary: 'Find structure in unlabeled data through grouping, compression, and latent factors.',
            buildsOn: 'Similarity metrics define neighborhood structure.',
            formula: 'x -> z (latent representation)',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'Clustering groups similar points.',
                'PCA projects data into maximal-variance directions.',
                'Embeddings turn sparse signals into dense geometry.'
            ],
            visual: [
                'high-dimensional cloud',
                '   -> compress -> latent plane',
                '   -> clusters emerge'
            ],
            quiz: {
                question: 'What is the main output of PCA?',
                keywords: ['components', 'variance', 'projection', 'directions'],
                hint: 'It finds orthogonal directions of maximum variance.'
            }
        },
        {
            id: 'neural-networks',
            aliases: ['mlp', 'deep-learning', 'backprop'],
            title: 'Neural Networks',
            chapter: 'Neural Networks',
            summary: 'Deep networks stack nonlinear layers to model complex functions.',
            buildsOn: 'Depth gives compositional feature hierarchy.',
            formula: 'a^(l+1) = sigma(W^(l) a^(l) + b^(l))',
            mathDepth: 7,
            intuitionDepth: 8,
            bullets: [
                'Forward pass computes predictions.',
                'Backward pass computes gradients.',
                'Regularization controls overfitting.'
            ],
            visual: [
                'input -> hidden1 -> hidden2 -> output',
                '         ^ grad <- grad <- grad',
                'learn by repeating forward/backward passes'
            ],
            quiz: {
                question: 'What role does nonlinearity play between layers?',
                keywords: ['nonlinear', 'expressive', 'linear', 'composition'],
                hint: 'Without it, stacked layers collapse to a single linear map.'
            }
        },
        {
            id: 'cnn',
            aliases: ['convolution', 'vision'],
            title: 'Convolutional Networks',
            chapter: 'Neural Networks',
            summary: 'CNNs share local filters across space to detect patterns like edges and textures efficiently.',
            buildsOn: 'Translation-aware feature extraction.',
            formula: 'feature = conv(input, kernel)',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Filters slide over pixels and reuse parameters.',
                'Pooling reduces spatial size and adds invariance.',
                'Deeper layers capture higher-level visual motifs.'
            ],
            visual: [
                '[image] --conv--> [feature maps] --pool--> [compact features]',
                'shared kernels lower parameter count',
                'local receptive fields detect local structure'
            ],
            quiz: {
                question: 'Why is weight sharing useful in CNNs?',
                keywords: ['fewer', 'parameters', 'translation', 'reuse'],
                hint: 'The same pattern can appear anywhere in an image.'
            }
        },
        {
            id: 'sequence-models',
            aliases: ['rnn', 'lstm', 'gru'],
            title: 'RNN and LSTM',
            chapter: 'Neural Networks',
            summary: 'Sequence models carry state across time steps to model ordered data like text and signals.',
            buildsOn: 'Hidden state summarizes past context.',
            formula: 'h_t = f(x_t, h_(t-1))',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'RNNs process tokens one step at a time.',
                'LSTMs add gates to preserve long-range information.',
                'Vanishing gradients make long dependencies difficult.'
            ],
            visual: [
                'x1 -> [cell] -> h1',
                'x2 -> [cell] -> h2',
                'x3 -> [cell] -> h3   (shared params over time)'
            ],
            quiz: {
                question: 'What problem do LSTM gates primarily address?',
                keywords: ['long', 'memory', 'vanishing', 'dependencies'],
                hint: 'Standard RNNs forget too quickly.'
            }
        },
        {
            id: 'transformers',
            aliases: ['attention', 'self-attention'],
            title: 'Transformers',
            chapter: 'Large Language Models',
            summary: 'Transformers model token relationships with attention, enabling parallel sequence processing.',
            buildsOn: 'Each token attends to relevant tokens.',
            formula: 'Attention(Q,K,V) = softmax(QK^T / sqrt(d_k)) V',
            mathDepth: 8,
            intuitionDepth: 8,
            bullets: [
                'Self-attention computes context-dependent token mixing.',
                'Multi-head attention learns complementary relations.',
                'Positional encodings inject token order.'
            ],
            visual: [
                'tokens -> embeddings + positions',
                '      -> attention blocks -> feed-forward',
                '      -> next-token distribution'
            ],
            quiz: {
                question: 'What is the practical benefit of multi-head attention?',
                keywords: ['different', 'relations', 'subspaces', 'parallel'],
                hint: 'Each head can focus on a different pattern.'
            }
        },
        {
            id: 'prompting',
            aliases: ['prompt-engineering', 'instruction-design'],
            title: 'Prompt Engineering',
            chapter: 'Large Language Models',
            summary: 'Prompt design reduces ambiguity and steers model behavior toward measurable outcomes.',
            buildsOn: 'Specify role, context, constraints, and output format.',
            formula: 'quality ~= clarity + context + constraints',
            mathDepth: 3,
            intuitionDepth: 9,
            bullets: [
                'Define objective and acceptance criteria clearly.',
                'Use examples for pattern anchoring.',
                'Iterate prompts with real evaluation inputs.'
            ],
            visual: [
                'vague prompt -> unstable outputs',
                'structured prompt -> consistent outputs',
                'eval loop closes quality gap'
            ],
            quiz: {
                question: 'What usually improves consistency most in prompts?',
                keywords: ['constraints', 'format', 'examples', 'specific'],
                hint: 'Ambiguity is the enemy.'
            }
        },
        {
            id: 'rag',
            aliases: ['retrieval', 'retrieval-augmented-generation'],
            title: 'RAG',
            chapter: 'Large Language Models',
            summary: 'RAG retrieves external context at query time to ground generation in relevant documents.',
            buildsOn: 'Embed -> search -> rerank -> inject context.',
            formula: 'answer = LLM(query + retrieved_context)',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Chunking quality controls retrieval recall.',
                'Embedding similarity finds candidate passages.',
                'Grounded prompts reduce hallucination risk.'
            ],
            visual: [
                'question -> embed -> vector search',
                'top-k chunks -> prompt context',
                'model response cites retrieved evidence'
            ],
            quiz: {
                question: 'Why does retrieval help reduce hallucinations?',
                keywords: ['context', 'ground', 'evidence', 'documents'],
                hint: 'The model is conditioned on relevant facts.'
            }
        },
        {
            id: 'agents',
            aliases: ['tool-use', 'agentic-workflows'],
            title: 'AI Agents',
            chapter: 'Large Language Models',
            summary: 'Agents combine reasoning, tools, memory, and control flow to execute multi-step tasks.',
            buildsOn: 'Planner + tool calls + verification loop.',
            formula: 'observe -> plan -> act(tool) -> reflect -> repeat',
            mathDepth: 4,
            intuitionDepth: 8,
            bullets: [
                'Tool integration expands capability beyond pure text generation.',
                'State tracking keeps multi-step tasks coherent.',
                'Evals and guardrails are required for reliability.'
            ],
            visual: [
                '[goal] -> planner',
                'planner -> tool call -> observation',
                'observation -> planner (loop until done)'
            ],
            quiz: {
                question: 'What makes an agent different from a single LLM call?',
                keywords: ['loop', 'tools', 'state', 'multi-step'],
                hint: 'Think iterative execution, not one-shot completion.'
            }
        },
        {
            id: 'reinforcement-learning',
            aliases: ['rl', 'mdp'],
            title: 'Reinforcement Learning',
            chapter: 'Reinforcement Learning',
            summary: 'An agent learns by interacting with an environment to maximize long-term reward.',
            buildsOn: 'States, actions, rewards, and delayed consequences.',
            formula: 'G_t = sum_k gamma^k r_(t+k+1)',
            mathDepth: 7,
            intuitionDepth: 8,
            bullets: [
                'Policy selects actions from states.',
                'Value function estimates expected return.',
                'Exploration balances learning vs exploiting known rewards.'
            ],
            visual: [
                'state s_t --policy--> action a_t',
                'environment -> reward r_t+1, next state s_t+1',
                'update value/policy from trajectories'
            ],
            quiz: {
                question: 'Why is discount factor gamma used in return?',
                keywords: ['future', 'tradeoff', 'stability', 'long-term'],
                hint: 'It weights immediate vs distant rewards.'
            }
        },
        {
            id: 'bandits-and-control',
            aliases: ['bandits', 'q-learning', 'td-learning'],
            title: 'Bandits, TD, and Control',
            chapter: 'Reinforcement Learning',
            summary: 'Bandits handle action selection without state transitions; TD/Q-learning solve sequential control.',
            buildsOn: 'Bootstrap updates learn from estimates of future value.',
            formula: 'Q(s,a) <- Q(s,a) + alpha [r + gamma max_a\' Q(s\',a\') - Q(s,a)]',
            mathDepth: 8,
            intuitionDepth: 7,
            bullets: [
                'Bandits focus on exploration-exploitation in one-step rewards.',
                'TD updates learn online from partial returns.',
                'Q-learning finds greedy control policies off-policy.'
            ],
            visual: [
                'bandit: choose arm -> observe reward -> update estimate',
                'control: state -> action -> next state + reward',
                'bootstrap target uses current value estimates'
            ],
            quiz: {
                question: 'What does the max term represent in Q-learning?',
                keywords: ['best', 'future', 'action', 'value'],
                hint: 'It is the estimated best possible future value at next state.'
            }
        }
    ];

    const algorithmTopics = [
        {
            id: 'algorithmic-complexity',
            aliases: ['big-o', 'complexity', 'asymptotics'],
            title: 'Algorithmic Complexity',
            chapter: 'Algorithms',
            summary: 'Complexity analysis compares growth rates of runtime and memory as input scales.',
            buildsOn: 'Asymptotic notation ignores constants and lower-order terms.',
            formula: 'T(n) in O(f(n))',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Big-O gives upper bound, Omega lower bound, Theta tight bound.',
                'Logarithmic and linear-time algorithms scale very differently.',
                'Space complexity matters for large datasets.'
            ],
            visual: [
                'n ->   10   100   1000',
                'n^2 -> 100  10k   1M',
                'nlogn grows slower than n^2'
            ],
            quiz: {
                question: 'Why can O(n log n) beat O(n^2) dramatically for large n?',
                keywords: ['growth', 'scale', 'faster', 'large'],
                hint: 'Compare how terms grow with n.'
            }
        },
        {
            id: 'divide-and-conquer',
            aliases: ['recursion', 'master-theorem'],
            title: 'Divide and Conquer',
            chapter: 'Algorithms',
            summary: 'Break a problem into smaller subproblems, solve recursively, and combine results.',
            buildsOn: 'Recurrence relations model recursive cost.',
            formula: 'T(n) = aT(n/b) + f(n)',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'Merge sort and quicksort are classic divide-and-conquer examples.',
                'Balanced splitting often leads to efficient runtimes.',
                'Combine step quality determines overall performance.'
            ],
            visual: [
                'problem n',
                ' -> n/2 + n/2',
                ' -> base cases -> combine'
            ],
            quiz: {
                question: 'What does the combine step do in divide-and-conquer?',
                keywords: ['merge', 'combine', 'subproblem', 'results'],
                hint: 'After recursion, you must integrate results.'
            }
        },
        {
            id: 'sorting-algorithms',
            aliases: ['sorting', 'quicksort', 'mergesort', 'heapsort'],
            title: 'Sorting Algorithms',
            chapter: 'Algorithms',
            summary: 'Sorting organizes data and is foundational for searching, joins, and scheduling.',
            buildsOn: 'Comparison sort lower bound is Omega(n log n).',
            formula: 'best-known comparison sorts: O(n log n)',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Merge sort is stable and predictable.',
                'Quicksort is fast in practice with good pivoting.',
                'Heapsort guarantees O(n log n) with constant extra space.'
            ],
            visual: [
                '[7,2,5,1] -> partition/merge -> [1,2,5,7]',
                'comparison count drives cost',
                'stability matters for multi-key sorts'
            ],
            quiz: {
                question: 'Why is stability useful in sorting?',
                keywords: ['relative', 'order', 'equal', 'keys'],
                hint: 'Think records with repeated keys.'
            }
        },
        {
            id: 'searching-and-binary-search',
            aliases: ['binary-search', 'search'],
            title: 'Searching and Binary Search',
            chapter: 'Algorithms',
            summary: 'Binary search cuts the search range in half on sorted data.',
            buildsOn: 'Sorted order enables logarithmic elimination.',
            formula: 'O(log n)',
            mathDepth: 5,
            intuitionDepth: 9,
            bullets: [
                'Check midpoint then discard half the range.',
                'Boundary conditions are common bug sources.',
                'Works for monotonic predicates beyond arrays.'
            ],
            visual: [
                'lo .... mid .... hi',
                'target < a[mid] -> move hi',
                'target > a[mid] -> move lo'
            ],
            quiz: {
                question: 'What prerequisite must hold for binary search to work?',
                keywords: ['sorted', 'ordered', 'monotonic'],
                hint: 'The data property is critical.'
            }
        },
        {
            id: 'hashing-and-hash-tables',
            aliases: ['hashing', 'hash-table', 'maps'],
            title: 'Hashing and Hash Tables',
            chapter: 'Algorithms',
            summary: 'Hash tables map keys to buckets for near-constant expected lookups.',
            buildsOn: 'Good hash functions spread keys uniformly.',
            formula: 'expected O(1) insert/lookup',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Collisions are handled with chaining or open addressing.',
                'Load factor influences performance.',
                'Resizing avoids bucket overload.'
            ],
            visual: [
                'key -> hash(key) -> bucket index',
                'bucket -> entries',
                'rehash when load factor rises'
            ],
            quiz: {
                question: 'Why does high load factor hurt hash table performance?',
                keywords: ['collision', 'bucket', 'chains', 'probe'],
                hint: 'More keys compete for same slots.'
            }
        },
        {
            id: 'heaps-and-priority-queues',
            aliases: ['heap', 'priority-queue'],
            title: 'Heaps and Priority Queues',
            chapter: 'Algorithms',
            summary: 'Heaps maintain quick access to min or max elements.',
            buildsOn: 'Heap property organizes parent-child values.',
            formula: 'insert/extract: O(log n), peek: O(1)',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Binary heap stored compactly in arrays.',
                'Essential for Dijkstra and scheduling.',
                'Sift-up/sift-down maintain invariants.'
            ],
            visual: [
                'array index i',
                'parent=(i-1)/2, children=2i+1,2i+2',
                'root is min or max'
            ],
            quiz: {
                question: 'Why use a heap for repeated min extraction?',
                keywords: ['log', 'efficient', 'extract', 'priority'],
                hint: 'Compare with linear scanning each time.'
            }
        },
        {
            id: 'trees-and-balanced-indexes',
            aliases: ['trees', 'avl', 'red-black', 'b-tree'],
            title: 'Trees and Balanced Indexes',
            chapter: 'Algorithms',
            summary: 'Balanced trees provide ordered operations with logarithmic complexity.',
            buildsOn: 'Height balance keeps path lengths short.',
            formula: 'search/insert/delete O(log n)',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'BST order supports range queries.',
                'Rotations rebalance trees.',
                'B-trees optimize disk/page locality.'
            ],
            visual: [
                'left < node < right',
                'rebalancing rotations preserve order',
                'shallow tree => fast operations'
            ],
            quiz: {
                question: 'What does balancing prevent in BSTs?',
                keywords: ['degenerate', 'linked-list', 'height', 'worst'],
                hint: 'Think worst-case insertion order.'
            }
        },
        {
            id: 'union-find-disjoint-set',
            aliases: ['union-find', 'disjoint-set', 'dsu'],
            title: 'Union-Find (Disjoint Set)',
            chapter: 'Algorithms',
            summary: 'Union-Find tracks connected components efficiently with path compression.',
            buildsOn: 'Parent pointers represent component roots.',
            formula: 'amortized near O(alpha(n))',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'find returns representative root.',
                'union merges two components.',
                'Used in Kruskal and connectivity queries.'
            ],
            visual: [
                'find(x) -> root',
                'union(a,b) -> merge roots',
                'path compression flattens chains'
            ],
            quiz: {
                question: 'Why is path compression effective?',
                keywords: ['flatten', 'shorter', 'future', 'find'],
                hint: 'It reduces future traversal depth.'
            }
        },
        {
            id: 'graph-traversal',
            aliases: ['bfs', 'dfs', 'graph-search'],
            title: 'Graph Traversal (BFS/DFS)',
            chapter: 'Algorithms',
            summary: 'BFS and DFS explore graph structure for reachability, levels, and components.',
            buildsOn: 'Graphs model pairwise relationships.',
            formula: 'O(V + E)',
            mathDepth: 5,
            intuitionDepth: 9,
            bullets: [
                'BFS explores level-by-level using queues.',
                'DFS explores deeply using stack/recursion.',
                'Traversal order supports many derived algorithms.'
            ],
            visual: [
                'BFS: queue frontier expands rings',
                'DFS: dive then backtrack',
                'visited set prevents cycles'
            ],
            quiz: {
                question: 'Which traversal naturally gives shortest path in unweighted graphs?',
                keywords: ['bfs', 'level', 'shortest'],
                hint: 'Think first time a node is reached.'
            }
        },
        {
            id: 'shortest-paths',
            aliases: ['dijkstra', 'bellman-ford', 'floyd-warshall'],
            title: 'Shortest Paths',
            chapter: 'Algorithms',
            summary: 'Shortest-path algorithms compute minimum-cost routes in weighted graphs.',
            buildsOn: 'Edge weights define path cost.',
            formula: 'dist[v] = min(dist[v], dist[u] + w(u,v))',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'Dijkstra assumes non-negative weights.',
                'Bellman-Ford handles negative edges.',
                'All-pairs methods compute global distances.'
            ],
            visual: [
                'relax edges repeatedly',
                'priority queue picks nearest frontier',
                'distances converge to optimum'
            ],
            quiz: {
                question: 'Why does Dijkstra fail with negative-weight edges?',
                keywords: ['negative', 'greedy', 'assumption', 'relax'],
                hint: 'Greedy settled nodes may later improve.'
            }
        },
        {
            id: 'minimum-spanning-tree',
            aliases: ['mst', 'kruskal', 'prim'],
            title: 'Minimum Spanning Trees',
            chapter: 'Algorithms',
            summary: 'MST connects all vertices with minimum total edge weight and no cycles.',
            buildsOn: 'Cut and cycle properties justify greedy choices.',
            formula: 'argmin sum edge weights over spanning trees',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'Kruskal sorts edges and unions components.',
                'Prim grows one tree frontier.',
                'Useful for network design and clustering.'
            ],
            visual: [
                'sort edges low->high',
                'pick edge if it does not create cycle',
                'stop when V-1 edges selected'
            ],
            quiz: {
                question: 'What role does Union-Find play in Kruskal?',
                keywords: ['cycle', 'component', 'check', 'merge'],
                hint: 'It quickly detects cycle creation.'
            }
        },
        {
            id: 'dynamic-programming',
            aliases: ['dp', 'memoization', 'tabulation'],
            title: 'Dynamic Programming',
            chapter: 'Algorithms',
            summary: 'DP solves overlapping subproblems and reuses cached optimal substructure.',
            buildsOn: 'State design and transition equations.',
            formula: 'dp[state] = best over transitions',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'Memoization caches recursive calls.',
                'Tabulation fills states bottom-up.',
                'State compression can reduce memory.'
            ],
            visual: [
                'define state',
                'write recurrence',
                'set base cases -> fill table'
            ],
            quiz: {
                question: 'What two properties typically make DP applicable?',
                keywords: ['overlapping', 'optimal', 'substructure'],
                hint: 'Think repeated subproblems + optimal composition.'
            }
        },
        {
            id: 'greedy-algorithms',
            aliases: ['greedy', 'interval-scheduling'],
            title: 'Greedy Algorithms',
            chapter: 'Algorithms',
            summary: 'Greedy methods choose locally optimal actions hoping for global optimum.',
            buildsOn: 'Exchange arguments prove correctness.',
            formula: 'choose best local option each step',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Very fast when structure permits.',
                'Not every problem has greedy-choice property.',
                'Proofs are essential, not intuition alone.'
            ],
            visual: [
                'candidate set -> choose best local',
                'commit and continue',
                'verify global optimality by proof'
            ],
            quiz: {
                question: 'What must be shown to trust a greedy solution?',
                keywords: ['proof', 'optimal', 'exchange', 'property'],
                hint: 'Local choice must imply global optimum.'
            }
        },
        {
            id: 'backtracking-and-branch-bound',
            aliases: ['backtracking', 'branch-and-bound'],
            title: 'Backtracking and Branch & Bound',
            chapter: 'Algorithms',
            summary: 'Systematically search possibilities with pruning based on constraints or bounds.',
            buildsOn: 'Decision trees represent candidate solutions.',
            formula: 'search tree + prune invalid/unpromising branches',
            mathDepth: 6,
            intuitionDepth: 8,
            bullets: [
                'Backtracking prunes on constraint violations.',
                'Branch-and-bound prunes on objective bounds.',
                'Useful for combinatorial optimization.'
            ],
            visual: [
                'root -> choices -> deeper choices',
                'invalid branch => cut',
                'best-so-far bound => cut more branches'
            ],
            quiz: {
                question: 'Why is pruning critical in backtracking?',
                keywords: ['reduce', 'search', 'state-space', 'efficiency'],
                hint: 'The raw search tree can be exponential.'
            }
        },
        {
            id: 'string-matching-and-indexing',
            aliases: ['kmp', 'rabin-karp', 'trie', 'suffix-array'],
            title: 'String Matching and Indexing',
            chapter: 'Algorithms',
            summary: 'Efficient text algorithms speed search, parsing, and indexing tasks.',
            buildsOn: 'Preprocessing pattern/text reduces repeated work.',
            formula: 'preprocess + linear scan',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'KMP avoids rechecking matched prefixes.',
                'Tries support prefix lookup.',
                'Suffix structures accelerate substring queries.'
            ],
            visual: [
                'pattern automaton guides scan',
                'trie edges by character',
                'suffix index enables fast lookup'
            ],
            quiz: {
                question: 'What does a trie optimize in text workloads?',
                keywords: ['prefix', 'lookup', 'dictionary', 'search'],
                hint: 'Think shared prefixes across words.'
            }
        },
        {
            id: 'randomized-and-approximation-algorithms',
            aliases: ['randomized', 'approximation'],
            title: 'Randomized and Approximation Algorithms',
            chapter: 'Algorithms',
            summary: 'Randomization and approximation make hard problems tractable in practice.',
            buildsOn: 'Trade exactness for speed or probabilistic guarantees.',
            formula: 'P(success) or approximation ratio',
            mathDepth: 7,
            intuitionDepth: 6,
            bullets: [
                'Randomized quicksort has strong expected performance.',
                'Approximation algorithms bound distance from optimal.',
                'Useful for NP-hard optimization tasks.'
            ],
            visual: [
                'exact optimum often expensive',
                'approx solution: faster + bounded quality',
                'randomization avoids worst-case structures'
            ],
            quiz: {
                question: 'Why accept approximation in NP-hard problems?',
                keywords: ['tradeoff', 'time', 'quality', 'tractable'],
                hint: 'Exact methods may be too slow at scale.'
            }
        }
    ];

    const distributedSystemsTopics = [
        {
            id: 'distributed-systems-basics',
            aliases: ['distributed-basics', 'nodes-networks-failures'],
            title: 'Distributed Systems Basics',
            chapter: 'Distributed Systems',
            summary: 'Distributed systems coordinate multiple machines under latency, failures, and partial information.',
            buildsOn: 'No global clock and unreliable networks.',
            formula: 'latency + faults + coordination complexity',
            mathDepth: 4,
            intuitionDepth: 9,
            bullets: [
                'Nodes fail independently.',
                'Network delay and packet loss are normal.',
                'State coordination is the central challenge.'
            ],
            visual: [
                'node A <--> node B <--> node C',
                'messages can delay, drop, reorder',
                'design assumes failures by default'
            ],
            quiz: {
                question: 'Why is distributed coordination harder than single-node programming?',
                keywords: ['latency', 'failure', 'network', 'partial'],
                hint: 'State is split across unreliable links.'
            }
        },
        {
            id: 'cap-and-pacelc',
            aliases: ['cap', 'pacelc'],
            title: 'CAP and PACELC',
            chapter: 'Distributed Systems',
            summary: 'CAP and PACELC describe consistency/availability tradeoffs under partitions and normal operation.',
            buildsOn: 'Partitions are unavoidable in large systems.',
            formula: 'CAP: C vs A under P',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Under partition, choose consistency or availability.',
                'PACELC extends tradeoff to normal latency vs consistency.',
                'System design chooses defaults per workload.'
            ],
            visual: [
                'Partition? yes -> choose C or A',
                'Else -> choose latency or consistency',
                'tradeoffs depend on product needs'
            ],
            quiz: {
                question: 'What does PACELC add beyond CAP?',
                keywords: ['latency', 'else', 'normal', 'operation'],
                hint: 'It covers the no-partition case.'
            }
        },
        {
            id: 'time-lamport-vector-clocks',
            aliases: ['lamport-clock', 'vector-clock', 'time-ordering'],
            title: 'Time, Lamport Clocks, and Vector Clocks',
            chapter: 'Distributed Systems',
            summary: 'Logical clocks reason about event ordering without synchronized physical clocks.',
            buildsOn: 'Happens-before relation.',
            formula: 'a -> b implies clock(a) < clock(b)',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'Lamport clocks provide partial ordering hints.',
                'Vector clocks detect concurrency/conflicts.',
                'Useful for conflict resolution in replicated systems.'
            ],
            visual: [
                'process A: e1 --- e2',
                'process B: f1 --- f2',
                'messages induce happens-before edges'
            ],
            quiz: {
                question: 'What extra information do vector clocks provide over Lamport clocks?',
                keywords: ['concurrent', 'causal', 'conflict', 'compare'],
                hint: 'They can distinguish concurrency.'
            }
        },
        {
            id: 'replication-strategies',
            aliases: ['replication', 'leader-follower', 'multi-leader'],
            title: 'Replication Strategies',
            chapter: 'Distributed Systems',
            summary: 'Replication improves availability and read throughput while introducing consistency challenges.',
            buildsOn: 'Data copied across replicas.',
            formula: 'write -> replicate -> converge',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Leader-follower centralizes writes.',
                'Multi-leader enables regional writes but may conflict.',
                'Leaderless designs use quorum logic.'
            ],
            visual: [
                'client -> leader -> followers',
                'read from replicas',
                'replication lag impacts freshness'
            ],
            quiz: {
                question: 'What is replication lag and why does it matter?',
                keywords: ['stale', 'delay', 'replica', 'consistency'],
                hint: 'Followers may be behind latest writes.'
            }
        },
        {
            id: 'partitioning-and-sharding',
            aliases: ['sharding', 'partitioning'],
            title: 'Partitioning and Sharding',
            chapter: 'Distributed Systems',
            summary: 'Partitioning spreads data and load across nodes for horizontal scale.',
            buildsOn: 'Key space can be split by range or hash.',
            formula: 'key -> partition -> replica set',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Range sharding helps scans, hash sharding balances load.',
                'Rebalancing is needed when cluster topology changes.',
                'Hot partitions can dominate latency.'
            ],
            visual: [
                'partition 0: keys 0-999',
                'partition 1: keys 1000-1999',
                'route by key to correct shard'
            ],
            quiz: {
                question: 'What creates a hot shard?',
                keywords: ['skew', 'traffic', 'uneven', 'key'],
                hint: 'Some keys receive disproportionate load.'
            }
        },
        {
            id: 'consensus-raft-paxos',
            aliases: ['consensus', 'raft', 'paxos'],
            title: 'Consensus (Raft/Paxos)',
            chapter: 'Distributed Systems',
            summary: 'Consensus lets nodes agree on a sequence of decisions despite failures.',
            buildsOn: 'Majority quorums and leader terms.',
            formula: 'commit if replicated to majority',
            mathDepth: 8,
            intuitionDepth: 6,
            bullets: [
                'Raft emphasizes understandable leader-based flow.',
                'Paxos offers equivalent safety guarantees with different mechanics.',
                'Consensus underpins metadata and coordination services.'
            ],
            visual: [
                'client cmd -> leader append',
                'replicate log to followers',
                'majority ack => committed'
            ],
            quiz: {
                question: 'Why is majority quorum central to consensus safety?',
                keywords: ['overlap', 'majority', 'safety', 'committed'],
                hint: 'Majorities intersect across terms.'
            }
        },
        {
            id: 'leader-election',
            aliases: ['election', 'leader'],
            title: 'Leader Election',
            chapter: 'Distributed Systems',
            summary: 'Leader election chooses a coordinator for ordered writes and failover handling.',
            buildsOn: 'Timeouts and terms/epochs.',
            formula: 'candidate wins with majority votes',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'Election timeouts reduce split vote collisions.',
                'Terms prevent stale leaders from serving writes.',
                'Fast failover balances safety and availability.'
            ],
            visual: [
                'no heartbeat -> election',
                'vote requests -> majority',
                'new leader starts term'
            ],
            quiz: {
                question: 'Why use randomized election timeouts?',
                keywords: ['split-vote', 'collision', 'stagger', 'timeout'],
                hint: 'It reduces simultaneous candidacy.'
            }
        },
        {
            id: 'quorums-and-consistency-levels',
            aliases: ['quorum', 'consistency-levels'],
            title: 'Quorums and Consistency Levels',
            chapter: 'Distributed Systems',
            summary: 'Read/write quorums tune latency and consistency by selecting replica acknowledgments.',
            buildsOn: 'N replicas, W write acks, R read acks.',
            formula: 'if R + W > N, reads intersect writes',
            mathDepth: 7,
            intuitionDepth: 7,
            bullets: [
                'Strong reads often require quorum overlap.',
                'Lower consistency levels reduce latency.',
                'Tunable per operation in some databases.'
            ],
            visual: [
                'N=3, W=2, R=2 -> overlap guaranteed',
                'N=3, W=1, R=1 -> faster, weaker',
                'choose by product requirement'
            ],
            quiz: {
                question: 'What does R+W>N guarantee?',
                keywords: ['overlap', 'latest', 'intersection', 'read'],
                hint: 'Read touches at least one up-to-date write replica.'
            }
        },
        {
            id: 'transactions-2pc-and-saga',
            aliases: ['2pc', 'transactions', 'saga'],
            title: 'Transactions, 2PC, and Sagas',
            chapter: 'Distributed Systems',
            summary: 'Distributed transactions coordinate atomic updates, often trading latency and availability.',
            buildsOn: 'Commit protocols coordinate participants.',
            formula: 'prepare -> commit/abort',
            mathDepth: 7,
            intuitionDepth: 6,
            bullets: [
                '2PC provides atomic commit but can block on coordinator failure.',
                'Sagas split workflow into compensatable steps.',
                'Choice depends on consistency needs and failure model.'
            ],
            visual: [
                '2PC: PREPARE all -> COMMIT all',
                'Saga: step1 -> step2 -> step3',
                'failure -> compensate previous steps'
            ],
            quiz: {
                question: 'Why might teams prefer sagas over 2PC?',
                keywords: ['availability', 'decoupled', 'compensation', 'latency'],
                hint: 'Sagas reduce coupling/blocking at cost of complexity.'
            }
        },
        {
            id: 'isolation-levels-and-anomalies',
            aliases: ['isolation', 'serializable', 'snapshot'],
            title: 'Isolation Levels and Anomalies',
            chapter: 'Distributed Systems',
            summary: 'Isolation levels trade performance against anomalies like dirty reads and write skew.',
            buildsOn: 'Concurrent transactions can interfere.',
            formula: 'Serializable => equivalent to some serial order',
            mathDepth: 7,
            intuitionDepth: 6,
            bullets: [
                'Read committed and repeatable read allow different anomalies.',
                'Snapshot isolation avoids some but not all anomalies.',
                'Serializable is strongest but costlier.'
            ],
            visual: [
                'Tx A reads X, Tx B writes X',
                'ordering + locks/versioning define behavior',
                'anomaly avoidance costs coordination'
            ],
            quiz: {
                question: 'What is the goal of serializable isolation?',
                keywords: ['serial', 'equivalent', 'correctness', 'order'],
                hint: 'Concurrent execution should match a serial schedule.'
            }
        },
        {
            id: 'messaging-delivery-semantics',
            aliases: ['at-least-once', 'exactly-once', 'idempotency'],
            title: 'Messaging Delivery Semantics',
            chapter: 'Distributed Systems',
            summary: 'Message systems define delivery guarantees with tradeoffs in complexity and latency.',
            buildsOn: 'Retries can duplicate messages.',
            formula: 'at-most-once | at-least-once | effectively-once',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'At-least-once requires idempotent consumers.',
                'Exactly-once usually means coordinated state + deduplication.',
                'Failures happen between processing and acknowledgement.'
            ],
            visual: [
                'produce -> broker -> consume',
                'failure before ack => retry duplicate',
                'idempotency key avoids double effects'
            ],
            quiz: {
                question: 'Why is idempotency critical with retries?',
                keywords: ['duplicate', 'safe', 'repeat', 'effects'],
                hint: 'The same message may be processed more than once.'
            }
        },
        {
            id: 'stream-processing',
            aliases: ['streaming', 'event-time', 'watermarks'],
            title: 'Stream Processing and Event Time',
            chapter: 'Distributed Systems',
            summary: 'Streaming systems compute incrementally on ordered events with late/out-of-order handling.',
            buildsOn: 'Processing time differs from event time.',
            formula: 'window(event_time) + watermark',
            mathDepth: 6,
            intuitionDepth: 7,
            bullets: [
                'Windowing groups events for aggregate computation.',
                'Watermarks decide when results are final enough.',
                'Late events require update/retraction policies.'
            ],
            visual: [
                'event stream -> window -> aggregate',
                'watermark advances completeness',
                'late events may revise output'
            ],
            quiz: {
                question: 'Why are watermarks needed in stream processing?',
                keywords: ['late', 'out-of-order', 'event-time', 'finalize'],
                hint: 'They estimate completeness of event-time data.'
            }
        },
        {
            id: 'crdt-and-eventual-consistency',
            aliases: ['crdt', 'eventual-consistency'],
            title: 'CRDTs and Eventual Consistency',
            chapter: 'Distributed Systems',
            summary: 'CRDTs allow conflict-free merges so replicas converge without central coordination.',
            buildsOn: 'Commutative/associative merge rules.',
            formula: 'merge(a,b) deterministic and monotonic',
            mathDepth: 7,
            intuitionDepth: 6,
            bullets: [
                'Useful for offline-first and multi-region collaborative data.',
                'Designing correct merge semantics is the hard part.',
                'Convergence does not imply immediate consistency.'
            ],
            visual: [
                'replica A updates',
                'replica B updates',
                'exchange + merge => same final state'
            ],
            quiz: {
                question: 'What property must CRDT merge functions satisfy?',
                keywords: ['deterministic', 'converge', 'commutative', 'associative'],
                hint: 'Replicas must reach same state regardless of order.'
            }
        },
        {
            id: 'caching-and-invalidation',
            aliases: ['cache', 'invalidations'],
            title: 'Caching and Invalidation',
            chapter: 'Distributed Systems',
            summary: 'Caching reduces latency but introduces staleness and invalidation complexity.',
            buildsOn: 'Cached copies diverge from source of truth over time.',
            formula: 'freshness vs latency',
            mathDepth: 4,
            intuitionDepth: 9,
            bullets: [
                'TTL-based invalidation is simple but approximate.',
                'Write-through and write-back have different durability tradeoffs.',
                'Hot keys and stampedes need protection.'
            ],
            visual: [
                'request -> cache hit? return',
                'miss -> source -> fill cache',
                'invalidate/update on writes'
            ],
            quiz: {
                question: 'Why is cache invalidation considered difficult?',
                keywords: ['stale', 'synchronization', 'timing', 'consistency'],
                hint: 'Keeping copies fresh under writes is tricky.'
            }
        },
        {
            id: 'failure-detection-and-recovery',
            aliases: ['failure-detection', 'recovery'],
            title: 'Failure Detection and Recovery',
            chapter: 'Distributed Systems',
            summary: 'Systems detect failures probabilistically and recover through retries, failover, and repair.',
            buildsOn: 'Timeouts cannot perfectly distinguish slow from failed nodes.',
            formula: 'suspect != proven failed',
            mathDepth: 5,
            intuitionDepth: 8,
            bullets: [
                'Heartbeats and gossip spread liveness information.',
                'Automatic failover needs split-brain protection.',
                'Repair/reconciliation heals divergent replicas.'
            ],
            visual: [
                'heartbeat missed -> suspect',
                'quorum/consensus confirms role change',
                'recovery replays logs or snapshots'
            ],
            quiz: {
                question: 'Why are false failure suspicions unavoidable?',
                keywords: ['timeout', 'network', 'slow', 'uncertain'],
                hint: 'Network delays can mimic failure.'
            }
        },
        {
            id: 'observability-and-sre',
            aliases: ['observability', 'sre', 'monitoring'],
            title: 'Observability and SRE Foundations',
            chapter: 'Distributed Systems',
            summary: 'Metrics, logs, traces, and SLOs help teams detect, diagnose, and prevent outages.',
            buildsOn: 'Complex systems need multi-signal telemetry.',
            formula: 'SLO + error budget -> reliability decisions',
            mathDepth: 4,
            intuitionDepth: 9,
            bullets: [
                'High-cardinality tracing identifies cross-service latency.',
                'SLOs align reliability with user impact.',
                'Runbooks and incident reviews drive learning.'
            ],
            visual: [
                'metrics: what',
                'logs: why',
                'traces: where latency happened'
            ],
            quiz: {
                question: 'What does an error budget represent?',
                keywords: ['allowed', 'downtime', 'slo', 'reliability'],
                hint: 'It is the tolerated unreliability window.'
            }
        },
        {
            id: 'ddia-core-principles',
            aliases: ['ddia', 'designing-data-intensive-applications'],
            title: 'DDIA Core Principles',
            chapter: 'Distributed Systems',
            summary: 'DDIA emphasizes reliability, scalability, and maintainability as primary architecture goals.',
            buildsOn: 'Data models, storage engines, and distributed tradeoffs are deeply linked.',
            formula: 'reliability + scalability + maintainability',
            mathDepth: 4,
            intuitionDepth: 9,
            bullets: [
                'Choose data models based on access patterns.',
                'Understand consistency and replication semantics explicitly.',
                'Design for operability and failure from day one.'
            ],
            visual: [
                'workload -> data model -> storage/index',
                'replication/partitioning -> consistency tradeoffs',
                'operations + evolution keep system healthy'
            ],
            quiz: {
                question: 'Which three qualities are central in DDIA architecture framing?',
                keywords: ['reliability', 'scalability', 'maintainability'],
                hint: 'They are the core quality pillars.'
            }
        }
    ];

    topics.push(...algorithmTopics, ...distributedSystemsTopics);

    const pythonLessons = [
        {
            id: 'python-basics',
            title: 'Variables and Types',
            goal: 'Store values and understand core Python data types.',
            concepts: [
                'Variables bind names to objects.',
                'Core types: int, float, str, bool.',
                'Use type() and f-strings for debugging.'
            ],
            code: [
                'name = "Ava"',
                'age = 14',
                'height = 1.61',
                'is_student = True',
                'print(f"{name} | age={age} | student={is_student}")',
                'print(type(height))'
            ],
            quiz: {
                question: 'Why does Python not require declaring variable types upfront?',
                keywords: ['dynamic', 'runtime', 'inferred', 'duck'],
                hint: 'Think dynamic typing.'
            }
        },
        {
            id: 'conditionals',
            title: 'Conditionals and Logic',
            goal: 'Control decisions with if/elif/else and boolean logic.',
            concepts: [
                'if/elif/else chooses a branch.',
                'Comparison operators return booleans.',
                'and/or/not combine conditions.'
            ],
            code: [
                'score = 82',
                'if score >= 90:',
                '    grade = "A"',
                'elif score >= 80:',
                '    grade = "B"',
                'else:',
                '    grade = "C"',
                'print("grade:", grade)'
            ],
            quiz: {
                question: 'When does the elif branch execute?',
                keywords: ['if false', 'elif true', 'first false', 'condition'],
                hint: 'It depends on earlier branch checks.'
            }
        },
        {
            id: 'loops',
            title: 'Loops and Iteration',
            goal: 'Repeat work with for and while loops.',
            concepts: [
                'for loops iterate over collections.',
                'range(start, stop, step) generates integer sequences.',
                'break exits early; continue skips one step.'
            ],
            code: [
                'total = 0',
                'for n in range(1, 6):',
                '    total += n',
                'print("sum 1..5 =", total)',
                '',
                'count = 3',
                'while count > 0:',
                '    print("count", count)',
                '    count -= 1'
            ],
            quiz: {
                question: 'What is the main difference between for and while loops?',
                keywords: ['iterable', 'condition', 'known', 'unknown'],
                hint: 'One loops over items, the other over a condition.'
            }
        },
        {
            id: 'functions',
            title: 'Functions and Scope',
            goal: 'Write reusable logic with parameters and return values.',
            concepts: [
                'def defines reusable behavior.',
                'return sends results back to caller.',
                'Local variables live inside the function scope.'
            ],
            code: [
                'def area(width, height):',
                '    return width * height',
                '',
                'a = area(4, 3)',
                'print("area =", a)',
                '',
                'def greet(name="friend"):',
                '    print(f"Hello, {name}")',
                'greet("Kai")'
            ],
            quiz: {
                question: 'Why are functions important in larger programs?',
                keywords: ['reuse', 'modular', 'test', 'readable'],
                hint: 'Think maintainability and reuse.'
            }
        },
        {
            id: 'lists-dicts',
            title: 'Lists, Dicts, and Comprehensions',
            goal: 'Organize data and transform it compactly.',
            concepts: [
                'Lists keep ordered items.',
                'Dictionaries map keys to values.',
                'Comprehensions build collections in one expression.'
            ],
            code: [
                'temps = [22, 25, 19, 27]',
                'warm = [t for t in temps if t >= 24]',
                'print("warm days:", warm)',
                '',
                'profile = {"name": "Mina", "level": "beginner"}',
                'profile["level"] = "intermediate"',
                'print(profile)'
            ],
            quiz: {
                question: 'When should you use a dictionary instead of a list?',
                keywords: ['key', 'lookup', 'mapping', 'named'],
                hint: 'Use dicts for key-based access.'
            }
        },
        {
            id: 'modules-debugging',
            title: 'Modules, Errors, and Debugging',
            goal: 'Use imports and debug code confidently.',
            concepts: [
                'import pulls functions from modules.',
                'Tracebacks show where failures happen.',
                'Small print checks speed up debugging.'
            ],
            code: [
                'import math',
                '',
                'def safe_divide(a, b):',
                '    if b == 0:',
                '        return "cannot divide by zero"',
                '    return a / b',
                '',
                'print(math.sqrt(49))',
                'print(safe_divide(12, 0))'
            ],
            quiz: {
                question: 'What does a traceback help you identify?',
                keywords: ['error', 'line', 'stack', 'where'],
                hint: 'It points to where the exception occurred.'
            }
        }
    ];

    const questChallenges = [
        {
            id: 'py-even-squares',
            title: 'Python Quest: Even Squares',
            track: 'Python',
            xp: 20,
            prompt: 'Return squares of only even numbers from nums.',
            variables: 'nums: list[int]',
            example: '[n * n for n in nums if n % 2 == 0]',
            hints: [
                'Filter even numbers with n % 2 == 0.',
                'Square each kept value with n * n.',
                'A list comprehension is the shortest expression.'
            ],
            tests: [
                { ctx: { nums: [1, 2, 3, 4, 5] }, expect: [4, 16] },
                { ctx: { nums: [2, 8, 9] }, expect: [4, 64] }
            ],
            sourceTitle: 'Python Tutorial: Data Structures',
            sourceUrl: 'https://docs.python.org/3/tutorial/datastructures.html'
        },
        {
            id: 'py-word-count',
            title: 'Python Quest: Word Counter',
            track: 'Python',
            xp: 20,
            prompt: 'Build a frequency map for words in text.',
            variables: 'text: str',
            example: '{w: text.split().count(w) for w in set(text.split())}',
            hints: [
                'Split using text.split().',
                'Iterate through unique words with set(...).',
                'count(word) gives frequency.'
            ],
            tests: [
                { ctx: { text: 'to be or not to be' }, expect: { to: 2, be: 2, or: 1, not: 1 } },
                { ctx: { text: 'a a b' }, expect: { a: 2, b: 1 } }
            ],
            sourceTitle: 'Python Built-in Types',
            sourceUrl: 'https://docs.python.org/3/library/stdtypes.html#dict'
        },
        {
            id: 'ml-gradient-step',
            title: 'ML Quest: Gradient Update',
            track: 'Machine Learning',
            xp: 25,
            prompt: 'Compute one gradient-descent update for squared error.',
            variables: 'w, x, y, lr: floats',
            example: 'w - lr * (2 * ((w * x) - y) * x)',
            hints: [
                'Prediction is y_hat = w * x.',
                'Gradient is 2 * (y_hat - y) * x.',
                'Updated weight is w - lr * grad.'
            ],
            tests: [
                { ctx: { w: 0.0, x: 2.0, y: 10.0, lr: 0.1 }, expect: 4.0, tol: 1e-9 },
                { ctx: { w: 4.0, x: 2.0, y: 10.0, lr: 0.1 }, expect: 4.8, tol: 1e-9 }
            ],
            sourceTitle: 'Gradient Descent Fundamentals',
            sourceUrl: 'https://www.deeplearningbook.org/'
        },
        {
            id: 'ml-sigmoid',
            title: 'ML Quest: Sigmoid Probability',
            track: 'Machine Learning',
            xp: 25,
            prompt: 'Compute sigmoid probability from z.',
            variables: 'z: float',
            example: '1 / (1 + math.exp(-z))',
            hints: [
                'Sigmoid formula is 1/(1+exp(-z)).',
                'Use math.exp for exponent.',
                'At z=0 output should be 0.5.'
            ],
            tests: [
                { ctx: { z: 0.0 }, expect: 0.5, tol: 1e-9 },
                { ctx: { z: 2.0 }, expect: 0.8807970779778823, tol: 1e-9 }
            ],
            sourceTitle: 'Scikit-learn Logistic Regression',
            sourceUrl: 'https://scikit-learn.org/stable/modules/linear_model.html#logistic-regression'
        },
        {
            id: 'tr-scaled-dot',
            title: 'Transformer Quest: Scaled Dot-Product',
            track: 'Transformer',
            xp: 30,
            prompt: 'Compute scaled dot-product attention score from q and k.',
            variables: 'q, k: equal-length list[float]',
            example: 'sum(qi * ki for qi, ki in zip(q, k)) / math.sqrt(len(k))',
            hints: [
                'Compute dot product first.',
                'Scale by sqrt(len(k)).',
                'Use zip(q, k) for paired multiply.'
            ],
            tests: [
                { ctx: { q: [1.0, 0.0, 1.0], k: [1.0, 1.0, 0.0] }, expect: 0.5773502691896258, tol: 1e-9 },
                { ctx: { q: [2.0, 1.0], k: [3.0, 4.0] }, expect: 7.071067811865475, tol: 1e-9 }
            ],
            sourceTitle: 'Attention Is All You Need (arXiv:1706.03762)',
            sourceUrl: 'https://arxiv.org/abs/1706.03762'
        },
        {
            id: 'tr-pytorch-shapes',
            title: 'Internet Quest: PyTorch Transformer Shapes',
            track: 'Transformer',
            xp: 35,
            prompt: 'Return the (src_shape, tgt_shape) pair from official nn.Transformer example.',
            variables: 'none',
            example: '((10, 32, 512), (20, 32, 512))',
            hints: [
                'src shape starts with 10 tokens.',
                'tgt shape starts with 20 tokens.',
                'Batch is 32 and model dim is 512 in both.'
            ],
            tests: [
                { ctx: {}, expect: [[10, 32, 512], [20, 32, 512]] }
            ],
            sourceTitle: 'PyTorch: torch.nn.Transformer docs',
            sourceUrl: 'https://docs.pytorch.org/docs/stable/generated/torch.nn.Transformer.html'
        },
        {
            id: 'tr-hf-pipeline',
            title: 'Internet Quest: Hugging Face Pipeline Config',
            track: 'Transformer',
            xp: 35,
            prompt: 'Return (task, model) from the text-generation pipeline tutorial example.',
            variables: 'none',
            example: '("text-generation", "google/gemma-2-2b")',
            hints: [
                'Task is text-generation.',
                'Model starts with google/...',
                'Exact model is google/gemma-2-2b.'
            ],
            tests: [
                { ctx: {}, expect: ['text-generation', 'google/gemma-2-2b'] }
            ],
            sourceTitle: 'Hugging Face Transformers Pipeline Tutorial',
            sourceUrl: 'https://huggingface.co/docs/transformers/en/pipeline_tutorial'
        }
    ];

    const animationFrames = {
        gradient: [
            'Loss hill simulation\n\n      *\n     / \\\n    /   \\\n   /  o  \\\n  /       \\\n /_________\\',
            'Loss hill simulation\n\n      *\n     / \\\n    / o \\\n   /     \\\n  /       \\\n /_________\\',
            'Loss hill simulation\n\n      *\n     /o\\\n    /   \\\n   /     \\\n  /       \\\n /_________\\',
            'Loss hill simulation\n\n      *\n     / \\\n    /   \\\n   /     \\\n  /  o    \\\n /_________\\',
            'Loss hill simulation\n\n      *\n     / \\\n    /   \\\n   /     \\\n  /     o \\\n /_________\\\n\nminimum reached'
        ],
        attention: [
            'Attention weights\n\nToken A -> [0.7 to C]\nToken B -> [0.2 to C]\nToken C -> [0.1 to C]',
            'Attention weights\n\nToken A -> [0.3 to C]\nToken B -> [0.5 to C]\nToken C -> [0.2 to C]',
            'Attention weights\n\nToken A -> [0.1 to C]\nToken B -> [0.2 to C]\nToken C -> [0.7 to C]'
        ],
        rl: [
            'Gridworld agent\n\nS . .\n# # .\n. . G\n\npolicy: exploring...',
            'Gridworld agent\n\nS > .\n# # .\n. . G\n\npolicy: epsilon-greedy',
            'Gridworld agent\n\nS > v\n# # v\n. . G\n\npolicy: value improving',
            'Gridworld agent\n\nS > v\n# # v\n. . G*\n\npolicy: goal reached'
        ],
        python: [
            'Python execution flow\n\nsource -> parser -> bytecode -> VM -> output',
            'Python execution flow\n\nsource -> parser -> bytecode -> VM -> output\n                        ^\n                  dynamic runtime',
            'Python execution flow\n\nsource -> parser -> bytecode -> VM -> output\n                 modules + objects + exceptions'
        ]
    };

    const tuiGraphics = {
        network: [
            '+-------------------+    +-------------------+    +-------------------+',
            '| Input Layer       |--->| Hidden Layer      |--->| Output Layer      |',
            '| x1 x2 x3 x4       |    | h1 h2 h3 h4 h5    |    | y1 y2 y3          |',
            '+-------------------+    +-------------------+    +-------------------+'
        ],
        matrix: [
            'W (3x3) * x (3x1) = h (3x1)',
            '',
            '|w11 w12 w13|   |x1|   |h1|',
            '|w21 w22 w23| * |x2| = |h2|',
            '|w31 w32 w33|   |x3|   |h3|'
        ],
        attention: [
            'Query/Key Score Grid',
            '',
            '      K1   K2   K3',
            'Q1   0.8  0.1  0.1',
            'Q2   0.2  0.7  0.1',
            'Q3   0.1  0.2  0.7',
            '',
            'softmax rows -> weighted value mix'
        ],
        gradient: [
            'Loss Surface Slice',
            '',
            'high                 *',
            '                   / |',
            '                 /   |  <- gradient',
            '               o     |',
            '            minimum (move opposite gradient)'
        ],
        rl: [
            'Gridworld Policy Sketch',
            '',
            '+---+---+---+---+',
            '| S | > | > | v |',
            '+---+---+---+---+',
            '| ^ | # | # | v |',
            '+---+---+---+---+',
            '| ^ | < | < | G |',
            '+---+---+---+---+'
        ]
    };

    const explainFlows = {
        'linear-algebra': {
            title: 'Linear Algebra Interactive Walk',
            steps: [
                {
                    title: 'Step 1: Represent data as vectors',
                    text: 'Features become coordinates in vector space so models can compute on them.',
                    art: ['x = [size, rooms, age]^T', 'space -> numeric representation']
                },
                {
                    title: 'Step 2: Transform with matrices',
                    text: 'A weight matrix rotates/stretches the vector to produce hidden features.',
                    art: ['h = W x + b', 'rows(W) map to output features']
                },
                {
                    title: 'Step 3: Compose transformations',
                    text: 'Layered matrix operations build complex representations.',
                    art: ['x -> W1 -> h1 -> W2 -> h2 -> ...']
                }
            ]
        },
        transformers: {
            title: 'Transformer Interactive Walk',
            steps: [
                {
                    title: 'Step 1: Token + position',
                    text: 'Each token embedding is combined with position info before attention.',
                    art: ['token_emb + pos_emb -> model_input']
                },
                {
                    title: 'Step 2: Self-attention mixing',
                    text: 'Tokens exchange information weighted by similarity scores.',
                    art: ['Attention(Q,K,V) = softmax(QK^T/sqrt(d))V', '[context-aware token vectors]']
                },
                {
                    title: 'Step 3: Feed-forward refinement',
                    text: 'Per-token MLP transforms each contextual representation.',
                    art: ['token_i -> Linear -> GELU -> Linear -> token_i*']
                },
                {
                    title: 'Step 4: Repeat stack',
                    text: 'Stacked blocks progressively improve representations for prediction.',
                    art: ['block x N -> logits -> next-token distribution']
                }
            ]
        },
        'reinforcement-learning': {
            title: 'Reinforcement Learning Interactive Walk',
            steps: [
                {
                    title: 'Step 1: Observe state',
                    text: 'Agent reads current state and selects an action via policy.',
                    art: ['s_t --policy--> a_t']
                },
                {
                    title: 'Step 2: Transition and reward',
                    text: 'Environment returns next state and scalar reward.',
                    art: ['(s_t, a_t) -> r_(t+1), s_(t+1)']
                },
                {
                    title: 'Step 3: Update value/policy',
                    text: 'Agent updates estimates to increase long-term reward.',
                    art: ['TD target: r + gamma * V(s\')']
                }
            ]
        },
        'gradient-descent': {
            title: 'Gradient Descent Interactive Walk',
            steps: [
                {
                    title: 'Step 1: Compute loss',
                    text: 'Measure prediction error with a differentiable objective.',
                    art: ['L(y_hat, y)']
                },
                {
                    title: 'Step 2: Backprop gradients',
                    text: 'Use chain rule to compute parameter derivatives.',
                    art: ['dL/dtheta']
                },
                {
                    title: 'Step 3: Update parameters',
                    text: 'Move opposite gradient direction to reduce loss.',
                    art: ['theta <- theta - eta * dL/dtheta']
                }
            ]
        },
        'python-basics': {
            title: 'Python Basics Interactive Walk',
            steps: [
                {
                    title: 'Step 1: Variables',
                    text: 'Create named values and inspect types dynamically.',
                    art: ['name = "Ava"', 'age = 14', 'type(age) -> int']
                },
                {
                    title: 'Step 2: Control flow',
                    text: 'Use if/elif/else and loops to run conditional logic.',
                    art: ['if score >= 80: print("B+")', 'for i in range(3): ...']
                },
                {
                    title: 'Step 3: Functions',
                    text: 'Wrap reusable logic with parameters and return values.',
                    art: ['def area(w, h):', '    return w * h']
                }
            ]
        }
    };

    const state = {
        currentIndex: 0,
        visited: new Set(),
        pythonIndex: 0,
        visitedPython: new Set(),
        history: [],
        historyCursor: 0,
        activeQuiz: null,
        activeQuizScope: '',
        exploration: null,
        topicView: [],
        pythonRepl: {
            active: false,
            initialized: false
        },
        questIndex: 0,
        questCompleted: new Set(),
        questHintsUsed: {},
        questStreak: 0,
        questBadges: new Set(),
        introDone: false,
        introTimer: null,
        xp: 0,
        animationTimer: null,
        animationBlock: null
    };

    const machineLearnerFrames = [
        [
            ' __  __    _    ____ _   _ ___ _   _ _____',
            '|  \\/  |  / \\  / ___| | | |_ _| \\ | | ____|',
            '| |\\/| | / _ \\| |   | |_| || ||  \\| |  _|',
            '| |  | |/ ___ \\ |___|  _  || || |\\  | |___',
            '|_|  |_/_/   \\_\\____|_| |_|___|_| \\_|_____|',
            '',
            ' _     _____    _    ____  _   _ _____ ____',
            '| |   | ____|  / \\  |  _ \\| \\ | | ____|  _ \\',
            '| |   |  _|   / _ \\ | |_) |  \\| |  _| | |_) |',
            '| |___| |___ / ___ \\|  _ <| |\\  | |___|  _ <',
            '|_____|_____/_/   \\_\\_| \\_\\_| \\_|_____|_| \\_\\',
            '',
            'FOLLOW THE WHITE RABBIT'
        ].join('\n'),
        [
            ' __  __    _    ____ _   _ ___ _   _ _____',
            '|  \\/  |  / \\  / ___| | | |_ _| \\ | | ____|',
            '| |\\/| | / _ \\| |   | |_| || ||  \\| |  _|',
            '| |  | |/ ___ \\ |___|  _  || || |\\  | |___',
            '|_|  |_/_/   \\_\\____|_| |_|___|_| \\_|_____|',
            '',
            ' _     _____    _    ____  _   _ _____ ____',
            '| |   | ____|  / \\  |  _ \\| \\ | | ____|  _ \\',
            '| |   |  _|   / _ \\ | |_) |  \\| |  _| | |_) |',
            '| |___| |___ / ___ \\|  _ <| |\\  | |___|  _ <',
            '|_____|_____/_/   \\_\\_| \\_\\_| \\_|_____|_| \\_\\',
            '',
            '... algorithms.github.io ...'
        ].join('\n'),
        [
            ' __  __    _    ____ _   _ ___ _   _ _____',
            '|  \\/  |  / \\  / ___| | | |_ _| \\ | | ____|',
            '| |\\/| | / _ \\| |   | |_| || ||  \\| |  _|',
            '| |  | |/ ___ \\ |___|  _  || || |\\  | |___',
            '|_|  |_/_/   \\_\\____|_| |_|___|_| \\_|_____|',
            '',
            ' _     _____    _    ____  _   _ _____ ____',
            '| |   | ____|  / \\  |  _ \\| \\ | | ____|  _ \\',
            '| |   |  _|   / _ \\ | |_) |  \\| |  _| | |_) |',
            '| |___| |___ / ___ \\|  _ <| |\\  | |___|  _ <',
            '|_____|_____/_/   \\_\\_| \\_\\_| \\_|_____|_| \\_\\',
            '',
            ':: DDIA LEARNING APP ::'
        ].join('\n')
    ];

    animationFrames.machine = machineLearnerFrames;
    animationFrames.banner = machineLearnerFrames;
    animationFrames.rabbit = [
        'FOLLOW THE WHITE RABBIT\n\n[  rabbit  ]----> [  algorithms  ]----> [  insight  ]',
        'FOLLOW THE WHITE RABBIT\n\n[ rabbit ] => [ algorithms.github.io ] => [ deep dive ]',
        'FOLLOW THE WHITE RABBIT\n\n[ rabbit ] >>> [ ddia learning app ] >>> [ distributed systems ]'
    ];
    animationFrames.algorithms = [
        'algorithms.github.io\n\nBFS -> DFS -> Dijkstra -> DP -> Greedy',
        'algorithms.github.io\n\nSort -> Search -> Graph -> Dynamic Programming',
        'algorithms.github.io\n\nComplexity first. Correctness always.'
    ];
    animationFrames.ddia = [
        'DDIA LEARNING APP\n\nreplication -> partitioning -> consistency',
        'DDIA LEARNING APP\n\nlogs -> consensus -> transactions',
        'DDIA LEARNING APP\n\nreliability + scalability + maintainability'
    ];
    animationFrames.binary = [
        [
            'MACHINE LEARNER :: BINARY VISUAL',
            '',
            '01001101 01000001 01000011 01001000 01001001 01001110 01000101',
            '00100000',
            '01001100 01000101 01000001 01010010 01001110 01000101 01010010',
            '',
            '[ 0 1 0 1 ]  [ 1 0 1 0 ]  [ 0 0 1 1 ]'
        ].join('\n'),
        [
            'MACHINE LEARNER :: BINARY VISUAL',
            '',
            '01001101 01000001 01000011 01001000 01001001 01001110 01000101',
            '00100000',
            '01001100 01000101 01000001 01010010 01001110 01000101 01010010',
            '',
            '[ 1 0 1 0 ]  [ 0 1 0 1 ]  [ 1 1 0 0 ]'
        ].join('\n'),
        [
            'MACHINE LEARNER :: BINARY VISUAL',
            '',
            '01001101 01000001 01000011 01001000 01001001 01001110 01000101',
            '00100000',
            '01001100 01000101 01000001 01010010 01001110 01000101 01010010',
            '',
            '0 1 0 1 0 1 0 1   1 0 1 0 1 0 1 0'
        ].join('\n')
    ];

    const rainThemeConfig = {
        rabbit: {
            color: 'rgba(74, 222, 128, 0.9)',
            glow: 'rgba(134, 239, 172, 0.9)',
            charset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]{}()',
            phrases: ['FOLLOW THE WHITE RABBIT', 'WAKE UP NEO', 'THERE IS NO SPOON']
        },
        algorithms: {
            color: 'rgba(56, 189, 248, 0.9)',
            glow: 'rgba(125, 211, 252, 0.95)',
            charset: 'BFSDFSGRAPHDPHEAPSORT0123456789',
            phrases: ['algorithms.github.io', 'BFS DFS DIJKSTRA', 'BIG-O MATTERS']
        },
        ddia: {
            color: 'rgba(250, 204, 21, 0.92)',
            glow: 'rgba(253, 224, 71, 0.95)',
            charset: 'RAFTPAXOSREPLICAQUORUM0123456789',
            phrases: ['DDIA LEARNING APP', 'RELIABILITY SCALABILITY', 'CONSENSUS REPLICATION']
        },
        binary: {
            color: 'rgba(34, 197, 94, 0.9)',
            glow: 'rgba(134, 239, 172, 0.95)',
            charset: '01010101010101010101',
            phrases: [
                '01001101 01000001 01000011 01001000 01001001 01001110 01000101',
                '01001100 01000101 01000001 01010010 01001110 01000101 01010010',
                'MACHINE LEARNER'
            ]
        }
    };

    const rain = {
        enabled: false,
        theme: 'rabbit',
        frameId: null,
        cols: [],
        phraseDrops: [],
        width: 0,
        height: 0,
        font: 14
    };

    state.topicView = topics;

    const normalize = (value) => value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const clampScore = (value) => Math.max(0, Math.min(10, Math.round(value)));

    const scrollToBottom = () => {
        screen.scrollTop = screen.scrollHeight;
    };

    const printLine = (text, tone = '') => {
        const line = document.createElement('div');
        line.className = `terminal-line${tone ? ` is-${tone}` : ''}`;
        line.textContent = text;
        screen.appendChild(line);
        scrollToBottom();
    };

    const printBlock = (text, extraClass = '') => {
        const block = document.createElement('pre');
        block.className = `terminal-block${extraClass ? ` ${extraClass}` : ''}`;
        block.textContent = text;
        screen.appendChild(block);
        scrollToBottom();
        return block;
    };

    const printDivider = () => {
        printLine('------------------------------------------------------------------', 'muted');
    };

    const stopAnimation = () => {
        if (state.animationTimer) {
            clearInterval(state.animationTimer);
            state.animationTimer = null;
        }
        state.animationBlock = null;
    };

    const getRainContext = () => {
        if (!rainCanvas) return null;
        return rainCanvas.getContext('2d');
    };

    const resizeRain = () => {
        if (!rainCanvas || !stage) return;
        const ctx = getRainContext();
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = stage.getBoundingClientRect();
        rain.width = Math.max(320, Math.floor(rect.width));
        rain.height = Math.max(360, Math.floor(rect.height));

        rainCanvas.width = Math.floor(rain.width * dpr);
        rainCanvas.height = Math.floor(rain.height * dpr);
        rainCanvas.style.width = `${rain.width}px`;
        rainCanvas.style.height = `${rain.height}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rain.font = Math.max(12, Math.floor(rain.width / 46));
        const colCount = Math.max(10, Math.floor(rain.width / rain.font));
        rain.cols = Array.from({ length: colCount }, () => Math.random() * (rain.height / rain.font));
        rain.phraseDrops = [];
    };

    const stopRain = () => {
        rain.enabled = false;
        if (rain.frameId) {
            cancelAnimationFrame(rain.frameId);
            rain.frameId = null;
        }
    };

    const drawRain = () => {
        if (!rain.enabled || !rainCanvas) {
            stopRain();
            return;
        }

        const theme = rainThemeConfig[rain.theme] || rainThemeConfig.rabbit;
        const ctx = getRainContext();
        if (!ctx) return;

        ctx.fillStyle = 'rgba(2, 6, 23, 0.14)';
        ctx.fillRect(0, 0, rain.width, rain.height);
        ctx.font = `${rain.font}px "Courier New", monospace`;

        for (let i = 0; i < rain.cols.length; i += 1) {
            const x = i * rain.font;
            const y = rain.cols[i] * rain.font;
            const chars = theme.charset;
            const char = chars[Math.floor(Math.random() * chars.length)];
            const alpha = 0.35 + Math.random() * 0.6;
            ctx.fillStyle = theme.color.replace(/0\.9[0-9]?/g, alpha.toFixed(2));
            ctx.fillText(char, x, y);

            if (y > rain.height && Math.random() > 0.97) {
                rain.cols[i] = 0;
            } else {
                rain.cols[i] += 1;
            }
        }

        if (Math.random() < 0.035) {
            const phrase = theme.phrases[Math.floor(Math.random() * theme.phrases.length)];
            const x = Math.max(8, Math.random() * (rain.width - phrase.length * 8));
            rain.phraseDrops.push({
                text: phrase,
                x,
                y: -10,
                speed: 1.1 + Math.random() * 1.7
            });
        }

        rain.phraseDrops = rain.phraseDrops.filter(drop => drop.y < rain.height + 30);
        rain.phraseDrops.forEach(drop => {
            drop.y += drop.speed;
            ctx.fillStyle = theme.glow;
            ctx.font = `bold ${Math.max(11, rain.font - 2)}px "Courier New", monospace`;
            ctx.fillText(drop.text, drop.x, drop.y);
        });

        rain.frameId = requestAnimationFrame(drawRain);
    };

    const startRain = () => {
        rain.enabled = false;
    };

    const setRainTheme = () => {
        printLine('Matrix rain has been removed for accessibility.', 'system');
    };

    const printRainStatus = () => {
        printDivider();
        printLine('Matrix rain status: disabled for accessibility.', 'system');
    };

    const runRainCommand = () => {
        printLine('Matrix rain has been removed for accessibility.', 'system');
    };

    const runArtCommand = (args) => {
        const [subRaw, ...rest] = args;
        const sub = (subRaw || '').toLowerCase();
        if (!sub || sub === 'show' || sub === 'static') {
            printMachineLearnerAscii();
            return;
        }
        if (sub === 'animate' || sub === 'anim') {
            const target = rest[0] || 'machine';
            playAnimation(target);
            return;
        }
        if (sub === 'theme') {
            printLine('Rain themes are disabled. Playing ASCII animation only.', 'muted');
            playAnimation(rest[0] || 'machine');
            return;
        }
        printLine('Unknown art command. Use `art`, `art animate`, or `art theme <name>`.', 'error');
    };

    const celebrate = (label = 'Checkpoint cleared') => {
        printBlock([
            '        *       *',
            '   *         *       *',
            `          ${label}`,
            '   *        LEVEL UP      *',
            '        *       *'
        ].join('\n'));
    };

    const scoreBar = (value) => {
        const score = clampScore(value);
        return `[${'#'.repeat(score)}${'.'.repeat(10 - score)}] ${score}/10`;
    };

    const resolveTopic = (rawToken) => {
        if (!rawToken) return null;
        const token = rawToken.trim();
        if (!token) return null;
        if (/^\d+$/.test(token)) {
            const idx = Number(token) - 1;
            if (Array.isArray(state.topicView) && state.topicView.length) {
                return state.topicView[idx] || null;
            }
            return topics[idx] || null;
        }

        const normalized = normalize(token);
        return topics.find(topic => {
            if (topic.id === normalized) return true;
            if (normalize(topic.title) === normalized) return true;
            return Array.isArray(topic.aliases) && topic.aliases.some(alias => normalize(alias) === normalized);
        }) || null;
    };

    const resolvePythonLesson = (rawToken) => {
        if (!rawToken) return null;
        const token = rawToken.trim();
        if (!token) return null;
        if (/^\d+$/.test(token)) {
            const idx = Number(token) - 1;
            return pythonLessons[idx] || null;
        }

        const normalized = normalize(token);
        return pythonLessons.find(lesson => {
            if (lesson.id === normalized) return true;
            return normalize(lesson.title) === normalized;
        }) || null;
    };

    const resolveQuest = (rawToken) => {
        if (!rawToken) return null;
        const token = rawToken.trim();
        if (!token) return null;
        if (/^\d+$/.test(token)) {
            return questChallenges[Number(token) - 1] || null;
        }
        const normalized = normalize(token);
        return questChallenges.find(challenge => {
            if (challenge.id === normalized) return true;
            return normalize(challenge.title) === normalized;
        }) || null;
    };

    const formatValue = (value) => {
        try {
            return JSON.stringify(value);
        } catch (err) {
            return String(value);
        }
    };

    const printQuestList = () => {
        printDivider();
        printLine('Gamified quest board (browser terminal)', 'system');
        questChallenges.forEach((challenge, index) => {
            const done = state.questCompleted.has(challenge.id) ? 'yes' : 'no';
            const active = index === state.questIndex ? '*' : ' ';
            printLine(`${active}${String(index + 1).padStart(2, '0')}  ${challenge.id.padEnd(24, ' ')} ${challenge.track.padEnd(16, ' ')} xp:${String(challenge.xp).padEnd(3, ' ')} done:${done}`);
        });
        printLine('Run `quest open <id|number>` and submit with `quest submit <python-expression>`.', 'muted');
    };

    const showQuest = (challenge) => {
        if (!challenge) return;
        state.questIndex = questChallenges.indexOf(challenge);
        printDivider();
        printLine(`Quest ${state.questIndex + 1}: ${challenge.title} [${challenge.id}]`, 'system');
        printLine(`Track      : ${challenge.track}`);
        printLine(`Reward XP  : ${challenge.xp}`);
        printLine(`Prompt     : ${challenge.prompt}`);
        printLine(`Variables  : ${challenge.variables}`);
        printLine(`Expression : ${challenge.example}`, 'muted');
        printLine(`Source     : ${challenge.sourceTitle}`);
        printLine(`URL        : ${challenge.sourceUrl}`, 'muted');
        printLine('Use `quest hint` or `quest submit <python-expression>`.', 'muted');
    };

    const printQuestStatus = () => {
        const completed = state.questCompleted.size;
        const total = questChallenges.length;
        const transformerTotal = questChallenges.filter(ch => ch.track === 'Transformer').length;
        const transformerDone = questChallenges.filter(ch => ch.track === 'Transformer' && state.questCompleted.has(ch.id)).length;
        printDivider();
        printLine('Quest status', 'system');
        printLine(`Completed   : ${completed}/${total}`);
        printLine(`Streak      : ${state.questStreak}`);
        printLine(`Transformer : ${transformerDone}/${transformerTotal}`);
        printLine(`Badges      : ${state.questBadges.size ? Array.from(state.questBadges).join(', ') : 'none yet'}`);
    };

    const unlockQuestBadges = () => {
        const unlocked = [];
        const addBadge = (name, condition) => {
            if (!condition || state.questBadges.has(name)) return;
            state.questBadges.add(name);
            unlocked.push(name);
        };

        addBadge('Boot Sequence', state.questCompleted.size >= 1);
        addBadge('Hot Streak x3', state.questStreak >= 3);
        const transformerIds = questChallenges.filter(ch => ch.track === 'Transformer').map(ch => ch.id);
        addBadge('Transformer Pilot', transformerIds.every(id => state.questCompleted.has(id)));
        addBadge('Quest Master', state.questCompleted.size === questChallenges.length);
        return unlocked;
    };

    const showQuestHint = () => {
        const challenge = questChallenges[state.questIndex];
        if (!challenge) {
            printLine('No active quest. Run `quest start` or `quest open <id>`.', 'error');
            return;
        }
        const used = Number(state.questHintsUsed[challenge.id] || 0);
        if (used >= challenge.hints.length) {
            printLine('No more hints for this quest.', 'muted');
            return;
        }
        state.questHintsUsed[challenge.id] = used + 1;
        printLine(`Hint ${used + 1}: ${challenge.hints[used]}`, 'system');
    };

    const evaluateQuestExpression = async (expression, challenge) => {
        const pyodide = await ensureNotebookPyodide();
        pyodide.globals.set('quest_expr', expression);
        pyodide.globals.set('quest_tests_json', JSON.stringify(challenge.tests || []));
        const resultJson = await pyodide.runPythonAsync(`
import json, math
tests = json.loads(quest_tests_json)
safe_builtins = {
    "len": len, "sum": sum, "min": min, "max": max, "abs": abs,
    "round": round, "sorted": sorted, "list": list, "dict": dict,
    "set": set, "tuple": tuple, "range": range, "zip": zip,
    "enumerate": enumerate, "float": float, "int": int, "str": str
}

def _norm(value):
    if isinstance(value, tuple):
        return [_norm(v) for v in value]
    if isinstance(value, list):
        return [_norm(v) for v in value]
    if isinstance(value, dict):
        return {str(k): _norm(v) for k, v in sorted(value.items(), key=lambda item: str(item[0]))}
    return value

results = []
for idx, test in enumerate(tests):
    ctx = test.get("ctx", {})
    expected = test.get("expect")
    tol = test.get("tol")
    try:
        value = eval(quest_expr, {"__builtins__": safe_builtins, "math": math}, dict(ctx))
        if isinstance(tol, (int, float)) and isinstance(value, (int, float)) and isinstance(expected, (int, float)):
            ok = abs(value - expected) <= tol
        else:
            ok = _norm(value) == _norm(expected)
        results.append({
            "index": idx,
            "ok": ok,
            "got": _norm(value),
            "expected": _norm(expected)
        })
    except Exception as exc:
        results.append({
            "index": idx,
            "ok": False,
            "error": f"{type(exc).__name__}: {exc}"
        })

json.dumps(results)
        `);
        return JSON.parse(resultJson || '[]');
    };

    const submitQuestExpression = async (expression) => {
        const challenge = questChallenges[state.questIndex];
        if (!challenge) {
            printLine('No active quest. Run `quest start` first.', 'error');
            return;
        }
        const expr = expression.trim();
        if (!expr) {
            printLine('Provide a Python expression after `quest submit`.', 'error');
            return;
        }

        printLine('Evaluating quest expression...', 'muted');
        try {
            const results = await evaluateQuestExpression(expr, challenge);
            const failed = results.find(item => !item.ok);
            if (failed) {
                state.questStreak = 0;
                if (failed.error) {
                    printLine(`Quest failed on test ${failed.index + 1}: ${failed.error}`, 'error');
                } else {
                    printLine(`Quest failed on test ${failed.index + 1}`, 'error');
                    printLine(`expected: ${formatValue(failed.expected)}`, 'muted');
                    printLine(`got     : ${formatValue(failed.got)}`, 'muted');
                }
                return;
            }

            const alreadyDone = state.questCompleted.has(challenge.id);
            if (alreadyDone) {
                printLine('Quest already completed. Result still correct.', 'success');
                return;
            }

            const hintsUsed = Number(state.questHintsUsed[challenge.id] || 0);
            const hintPenalty = hintsUsed * 2;
            const gained = Math.max(5, challenge.xp - hintPenalty);
            state.questCompleted.add(challenge.id);
            state.questStreak += 1;
            state.xp += gained;
            printLine(`Quest passed: ${challenge.title}`, 'success');
            printLine(`XP gained: ${gained} (base ${challenge.xp}, hints penalty ${hintPenalty})`, 'success');
            celebrate(`+${gained} XP`);
            const unlocked = unlockQuestBadges();
            unlocked.forEach(badge => {
                printLine(`Badge unlocked: ${badge}`, 'system');
            });
        } catch (err) {
            state.questStreak = 0;
            printLine(`Quest evaluation error: ${err?.message || err}`, 'error');
        }
    };

    const runQuestCommand = async (args) => {
        const [subRaw, ...rest] = args;
        const sub = (subRaw || 'list').toLowerCase();
        const payload = rest.join(' ');

        if (sub === 'list' || sub === 'ls') {
            printQuestList();
            return;
        }
        if (sub === 'start') {
            showQuest(questChallenges[0]);
            return;
        }
        if (sub === 'open' || sub === 'show') {
            const challenge = resolveQuest(payload);
            if (!challenge) {
                printLine('Quest not found. Run `quest` to list quest ids.', 'error');
                return;
            }
            showQuest(challenge);
            return;
        }
        if (sub === 'next') {
            const nextIndex = (state.questIndex + 1) % questChallenges.length;
            showQuest(questChallenges[nextIndex]);
            return;
        }
        if (sub === 'prev') {
            const prevIndex = (state.questIndex - 1 + questChallenges.length) % questChallenges.length;
            showQuest(questChallenges[prevIndex]);
            return;
        }
        if (sub === 'hint') {
            showQuestHint();
            return;
        }
        if (sub === 'status') {
            printQuestStatus();
            return;
        }
        if (sub === 'source' || sub === 'sources') {
            const challenge = questChallenges[state.questIndex];
            if (!challenge) {
                printLine('No active quest. Run `quest open <id>` first.', 'error');
                return;
            }
            printLine(`Source: ${challenge.sourceTitle}`, 'system');
            printLine(challenge.sourceUrl, 'muted');
            return;
        }
        if (sub === 'submit' || sub === 'answer' || sub === 'check') {
            await submitQuestExpression(payload);
            return;
        }

        printLine('Unknown quest command. Use: quest list|open|next|prev|hint|submit|status', 'error');
    };

    const printHelp = () => {
        printDivider();
        printLine('Available commands', 'system');
        printLine('help                     Show command list');
        printLine('dashboard | tui          Open full TUI dashboard');
        printLine('art | banner             Show MACHINE LEARNER ASCII art');
        printLine('shortcut                 Open URL shortcut #MachineLearnerTUI');
        printLine('rabbit                   White-rabbit ASCII animation');
        printLine('algorithms               Algorithms concept catalog');
        printLine('ddia                     Distributed systems concept catalog');
        printLine('topics [scope|query]     List/filter concepts (algorithms/distributed/...)');
        printLine('catalog [scope]          Alias for filtered topic list');
        printLine('open <id|number>         Open one concept card');
        printLine('next / prev              Move through the concept sequence');
        printLine('explore <concept>        Start interactive explanation flow');
        printLine('step / back / endexplore Walk the active explanation flow');
        printLine('graph <name>             Print TUI graphic (network/matrix/...)');
        printLine('map                      Show concept roadmap');
        printLine('quest ...                Gamified Python/ML/Transformer quests');
        printLine('quest submit <expr>      Submit Python expression to active quest');
        printLine('quest status             Show quest progress + badges');
        printLine('pyrepl                   Interactive Python REPL mode');
        printLine('quiz                     Ask checkpoint question for active topic');
        printLine('answer <text>            Submit quiz response');
        printLine('animate <name>           Play an ASCII animation (gradient|attention|rl|python)');
        printLine('mission                  Get a random mini challenge');
        printLine('python ...               Python crash course command group');
        printLine('python run <code>        Execute one Python snippet');
        printLine('xp                       Show earned XP');
        printLine('status                   Show progress stats');
        printLine('clear                    Clear terminal output');
        printLine('reset                    Reset terminal state');
        printLine('python help              Show Python command options', 'muted');
    };

    const printBanner = () => {
        printBlock([
            '+--------------------------------------------------------------+',
            '|                INTERACTIVE MACHINELEARNER TUI               |',
            '|      command-driven explanations, graphics, and quizzes      |',
            '+--------------------------------------------------------------+'
        ].join('\n'));
        printMachineLearnerAscii();
        printLine('Type `help` to see commands. Type `topics` to start exploring.', 'system');
        printLine('Try `dashboard`, `quest start`, `explore transformers`, and `art animate`.', 'system');
    };

    const startGuidedLearningSequence = () => {
        printDivider();
        printLine('Guided sequence started: Python basics -> Machine Learning algorithms.', 'system');
        showPythonLesson(pythonLessons[0], { markVisited: false });

        const mlAlgorithms = topics.filter(topic =>
            topic.chapter === 'Machine Learning' ||
            (topic.chapter === 'Algorithms' && /learning|regression|classification|optimization/.test(topic.summary.toLowerCase() + topic.title.toLowerCase()))
        );
        if (mlAlgorithms.length) {
            state.topicView = mlAlgorithms;
            printDivider();
            printLine('Machine learning algorithm concepts', 'system');
            mlAlgorithms.slice(0, 8).forEach((topic, index) => {
                printLine(`${String(index + 1).padStart(2, '0')}  ${topic.id}  [${topic.chapter}]`);
            });
            const firstMlTopic = mlAlgorithms[0];
            if (firstMlTopic) {
                showTopic(firstMlTopic, { markVisited: false });
            }
        } else {
            printLine('No ML algorithm list found; use `topics machine-learning` manually.', 'error');
        }

        printLine('Next steps: `quest start` for gamified exercises, `python repl` to run code, and `open supervised-learning` for theory.', 'muted');
    };

    const startIntroSequence = () => {
        if (state.introDone) {
            return;
        }
        state.introDone = true;
        if (state.introTimer) {
            clearTimeout(state.introTimer);
            state.introTimer = null;
        }
        printDivider();
        printLine('Visual rain effects are disabled for accessibility.', 'system');
        startGuidedLearningSequence();
    };

    const showTopic = (topic, options = {}) => {
        if (!topic) return;

        const markVisited = options.markVisited !== false;
        state.currentIndex = topics.indexOf(topic);
        if (markVisited) state.visited.add(topic.id);
        state.activeQuiz = null;
        state.activeQuizScope = '';
        state.exploration = null;

        printDivider();
        printLine(`${state.currentIndex + 1}. ${topic.title} [${topic.id}]`, 'system');
        printLine(`Track       : ${topic.chapter}`);
        printLine(`Summary     : ${topic.summary}`);
        printLine(`Builds on   : ${topic.buildsOn}`);
        printLine(`Math depth  : ${scoreBar(topic.mathDepth)}`);
        printLine(`Intuition   : ${scoreBar(topic.intuitionDepth)}`);
        printLine('Key ideas   :', 'success');
        topic.bullets.forEach((bullet, index) => {
            printLine(`  ${index + 1}. ${bullet}`);
        });
        printLine(`Formula     : ${topic.formula}`, 'muted');
        if (Array.isArray(topic.visual) && topic.visual.length) {
            printBlock(topic.visual.join('\n'));
        }
        printLine('Try: quiz  |  next  |  prev  |  open <id>  |  animate gradient', 'muted');
    };

    const filterTopics = (scopeRaw = '') => {
        const scope = normalize(scopeRaw || '');
        if (!scope) return topics;

        const chapterAliases = {
            foundations: 'Foundations',
            ml: 'Machine Learning',
            'machine-learning': 'Machine Learning',
            neural: 'Neural Networks',
            'neural-networks': 'Neural Networks',
            llm: 'Large Language Models',
            'large-language-models': 'Large Language Models',
            rl: 'Reinforcement Learning',
            'reinforcement-learning': 'Reinforcement Learning',
            algorithms: 'Algorithms',
            algorithm: 'Algorithms',
            distributed: 'Distributed Systems',
            'distributed-systems': 'Distributed Systems',
            ddia: 'Distributed Systems'
        };

        const chapter = chapterAliases[scope];
        if (chapter) {
            return topics.filter(topic => topic.chapter === chapter);
        }

        return topics.filter(topic => {
            const haystack = `${topic.id} ${topic.title} ${topic.chapter} ${topic.summary}`.toLowerCase();
            return haystack.includes(scopeRaw.toLowerCase());
        });
    };

    const printTopics = (scope = '') => {
        const filtered = filterTopics(scope);
        state.topicView = filtered;
        printDivider();
        if (scope) {
            printLine(`Concept index (${scope})`, 'system');
        } else {
            printLine('Concept index', 'system');
        }

        if (!filtered.length) {
            printLine('No matching topics. Try `topics algorithms` or `topics distributed`.', 'error');
            return;
        }

        filtered.forEach((topic, index) => {
            const seen = state.visited.has(topic.id) ? 'yes' : 'no';
            const number = String(index + 1).padStart(2, '0');
            const id = topic.id.padEnd(24, ' ');
            const chapter = topic.chapter.padEnd(22, ' ');
            printLine(`${number}  ${id} ${chapter} seen:${seen}`);
        });
        printLine(`Showing ${filtered.length}/${topics.length} topics`, 'muted');
    };

    const printMap = () => {
        printDivider();
        printLine('Roadmap', 'system');
        printBlock([
            '[Foundations] -> [Machine Learning] -> [Neural Nets] -> [LLM] -> [RL]',
            '      |                |                 |             |        |',
            '      +-- matrix        +-- supervised    +-- cnn/rnn   +-- rag  +-- control',
            '      +-- calc          +-- lifecycle     +-- backprop  +-- agents',
            '',
            '[Algorithms] -> [Distributed Systems]',
            '      |                |',
            '      +-- complexity    +-- replication',
            '      +-- sorting       +-- consensus',
            '      +-- graphs/dp     +-- transactions',
            '      +-- string/index  +-- stream + observability + DDIA'
        ].join('\n'));
        printLine('Use `topics algorithms`, `topics distributed`, or `open <id>` to jump.', 'muted');
    };

    const resolveFlowKey = (rawToken = '') => {
        const token = normalize(rawToken || '');
        const aliasMap = {
            linear: 'linear-algebra',
            matrix: 'linear-algebra',
            matrices: 'linear-algebra',
            transformer: 'transformers',
            attention: 'transformers',
            rl: 'reinforcement-learning',
            qlearning: 'reinforcement-learning',
            gradient: 'gradient-descent',
            optimization: 'gradient-descent',
            python: 'python-basics',
            algorithms: 'algorithmic-complexity',
            algorithm: 'algorithmic-complexity',
            distributed: 'distributed-systems-basics',
            ddia: 'ddia-core-principles',
            consensus: 'consensus-raft-paxos'
        };

        if (token && explainFlows[token]) return token;
        if (token && aliasMap[token] && explainFlows[aliasMap[token]]) return aliasMap[token];

        const activeTopic = topics[state.currentIndex]?.id;
        if (activeTopic && explainFlows[activeTopic]) return activeTopic;

        return 'gradient-descent';
    };

    const printMachineLearnerAscii = () => {
        printDivider();
        printLine('MACHINE LEARNER', 'system');
        printBlock(machineLearnerFrames[0]);
        printLine('Run `art animate` or `animate machine` for dynamic ASCII mode.', 'muted');
        printLine('Shortcut URL hash: #MachineLearnerTUI', 'muted');
    };

    const printDashboard = () => {
        const activeTopic = topics[state.currentIndex]?.id || 'none';
        const activePython = pythonLessons[state.pythonIndex]?.id || 'none';
        const activeQuest = questChallenges[state.questIndex]?.id || 'none';
        const lines = [
            '+----------------------------------------------------------------+',
            '|                     MACHINELEARNER TUI DASHBOARD              |',
            '+----------------------------------------------------------------+',
            `| Active topic   : ${activeTopic.padEnd(46, ' ')}|`,
            `| Python lesson  : ${activePython.padEnd(46, ' ')}|`,
            `| Active quest   : ${activeQuest.padEnd(46, ' ')}|`,
            `| Topic progress : ${(state.visited.size + '/' + topics.length).padEnd(46, ' ')}|`,
            `| Python progress: ${(state.visitedPython.size + '/' + pythonLessons.length).padEnd(46, ' ')}|`,
            `| Quest progress : ${(state.questCompleted.size + '/' + questChallenges.length).padEnd(46, ' ')}|`,
            `| Quest streak   : ${String(state.questStreak).padEnd(46, ' ')}|`,
            `| XP             : ${String(state.xp).padEnd(46, ' ')}|`,
            `| Visual effects : ${'rain disabled'.padEnd(46, ' ')}|`,
            `| Python REPL    : ${(state.pythonRepl.active ? 'active' : 'inactive').padEnd(46, ' ')}|`,
            `| Exploration    : ${(state.exploration ? state.exploration.key : 'none').padEnd(46, ' ')}|`,
            '+----------------------------------------------------------------+'
        ];

        printDivider();
        printLine('TUI dashboard', 'system');
        printBlock(lines.join('\n'));
        printLine('Try: quest start | quest hint | explore transformers | graph attention', 'muted');
    };

    const printTuiGraphic = (rawName) => {
        const token = normalize(rawName || 'network');
        const aliases = {
            nn: 'network',
            neural: 'network',
            matmul: 'matrix',
            vectors: 'matrix',
            attn: 'attention',
            gd: 'gradient',
            policy: 'rl'
        };
        const key = tuiGraphics[token] ? token : aliases[token];
        if (!key || !tuiGraphics[key]) {
            printLine('Unknown graphic. Try: network, matrix, attention, gradient, rl', 'error');
            return;
        }
        printDivider();
        printLine(`TUI graphic: ${key}`, 'system');
        printBlock(tuiGraphics[key].join('\n'), 'terminal-animation');
    };

    const showExploreStep = () => {
        if (!state.exploration) {
            printLine('No active exploration. Use `explore <concept>`.', 'error');
            return;
        }

        const flow = state.exploration.flow || explainFlows[state.exploration.key];
        if (!flow) {
            printLine('Exploration flow is unavailable.', 'error');
            state.exploration = null;
            return;
        }
        const stepCount = flow.steps.length;
        const index = Math.max(0, Math.min(stepCount - 1, state.exploration.step));
        state.exploration.step = index;
        const step = flow.steps[index];

        printDivider();
        printLine(`${flow.title} (${index + 1}/${stepCount})`, 'system');
        printLine(step.title, 'success');
        printLine(step.text);
        if (Array.isArray(step.art) && step.art.length) {
            printBlock(step.art.join('\n'), 'terminal-animation');
        }
        printLine('Commands: step | back | endexplore', 'muted');
    };

    const buildTopicFlow = (topic) => {
        if (!topic) return null;
        const keyIdeas = Array.isArray(topic.bullets) ? topic.bullets.slice(0, 3) : [];
        const visualHints = Array.isArray(topic.visual) ? topic.visual.slice(0, 3) : [];

        return {
            title: `${topic.title} Interactive Walk`,
            steps: [
                {
                    title: 'Step 1: What this concept solves',
                    text: topic.summary,
                    art: visualHints.length ? visualHints : ['No visual hints available yet.']
                },
                {
                    title: 'Step 2: Key mechanics',
                    text: topic.buildsOn,
                    art: keyIdeas.length ? keyIdeas : ['Key ideas will appear here once configured.']
                },
                {
                    title: 'Step 3: Math/operational core',
                    text: `Core relation: ${topic.formula}`,
                    art: [
                        `Formula: ${topic.formula}`,
                        `Depth: math ${topic.mathDepth}/10 | intuition ${topic.intuitionDepth}/10`
                    ]
                }
            ]
        };
    };

    const startExplore = (rawName) => {
        const key = resolveFlowKey(rawName);
        if (explainFlows[key]) {
            state.exploration = { key, step: 0 };
            showExploreStep();
            return;
        }

        const resolvedTopic = resolveTopic(rawName) || topics[state.currentIndex];
        const builtFlow = buildTopicFlow(resolvedTopic);
        if (!builtFlow) {
            printLine('Could not resolve exploration flow. Try `explore transformers`.', 'error');
            return;
        }

        state.exploration = { key: resolvedTopic.id, step: 0, flow: builtFlow };
        showExploreStep();
    };

    const moveExplore = (delta) => {
        if (!state.exploration) {
            printLine('No active exploration. Use `explore <concept>` first.', 'error');
            return;
        }

        const flow = state.exploration.flow || explainFlows[state.exploration.key];
        if (!flow) {
            state.exploration = null;
            printLine('Exploration ended because the flow is missing.', 'error');
            return;
        }

        const next = state.exploration.step + delta;
        if (next < 0) {
            printLine('Already at the first step.', 'muted');
            return;
        }
        if (next >= flow.steps.length) {
            printLine('You reached the final step. Use `endexplore` to exit.', 'success');
            return;
        }
        state.exploration.step = next;
        showExploreStep();
    };

    const endExplore = () => {
        if (!state.exploration) {
            printLine('No active exploration session.', 'muted');
            return;
        }
        const ended = state.exploration.key;
        state.exploration = null;
        printLine(`Ended exploration: ${ended}`, 'system');
    };

    const openMachineLearnerShortcut = () => {
        const target = document.getElementById('MachineLearnerTUI');
        if (!target) {
            printLine('Shortcut anchor #MachineLearnerTUI is missing in the page.', 'error');
            return;
        }

        setActiveChapter('terminal-tui');
        refreshAllVisuals();
        target.scrollIntoView({ behavior: 'smooth' });
        if (history.replaceState) {
            history.replaceState(null, '', '#MachineLearnerTUI');
        } else {
            window.location.hash = 'MachineLearnerTUI';
        }
        printLine('Opened #MachineLearnerTUI.', 'success');
    };

    const printPythonHelp = () => {
        printDivider();
        printLine('Python crash course commands', 'system');
        printLine('python                   List lessons');
        printLine('python start             Open first lesson');
        printLine('python open <id|number>  Open one lesson');
        printLine('python next / prev       Move lesson sequence');
        printLine('python quiz              Run checkpoint for current lesson');
        printLine('python answer <text>     Submit lesson answer');
        printLine('python repl              Start interactive Python REPL');
        printLine('python run <code>        Run one Python snippet');
        printLine('pyrepl                   REPL shortcut command');
    };

    const initPythonReplGlobals = async () => {
        const pyodide = await ensureNotebookPyodide();
        if (!state.pythonRepl.initialized) {
            await pyodide.runPythonAsync('tui_globals = {}');
            state.pythonRepl.initialized = true;
        }
        return pyodide;
    };

    const runPythonSnippetInTerminal = async (code) => {
        const snippet = code.trim();
        if (!snippet) {
            printLine('Provide Python code to run.', 'error');
            return;
        }

        try {
            printLine('Running Python...', 'muted');
            const pyodide = await initPythonReplGlobals();
            pyodide.globals.set('tui_code', snippet);
            const resultJson = await pyodide.runPythonAsync(`
import sys, io, traceback, json
_stdout = io.StringIO()
_stderr = io.StringIO()
sys.stdout = _stdout
sys.stderr = _stderr
try:
    try:
        _compiled = compile(tui_code, "<tui>", "eval")
        _value = eval(_compiled, tui_globals)
        if _value is not None:
            print(repr(_value))
    except SyntaxError:
        exec(tui_code, tui_globals)
except Exception:
    traceback.print_exc()
finally:
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
json.dumps({"stdout": _stdout.getvalue(), "stderr": _stderr.getvalue()})
            `);
            const result = JSON.parse(resultJson || '{}');
            if (result.stderr && result.stderr.trim()) {
                printBlock(result.stderr.trim(), 'terminal-animation');
                return;
            }
            if (result.stdout && result.stdout.trim()) {
                printBlock(result.stdout.trim(), 'terminal-animation');
                return;
            }
            printLine('Python executed with no output.', 'muted');
        } catch (err) {
            printLine(`Python error: ${err?.message || err}`, 'error');
        }
    };

    const startPythonRepl = () => {
        state.pythonRepl.active = true;
        printDivider();
        printLine('Python REPL mode enabled.', 'system');
        printLine('Type Python code directly. Use `.exit` to return to normal commands.', 'muted');
        printLine('Use `.reset` to clear REPL globals.', 'muted');
    };

    const stopPythonRepl = () => {
        state.pythonRepl.active = false;
        printLine('Python REPL mode disabled.', 'system');
    };

    const resetPythonRepl = async () => {
        try {
            const pyodide = await ensureNotebookPyodide();
            await pyodide.runPythonAsync('tui_globals = {}');
            state.pythonRepl.initialized = true;
            printLine('Python REPL globals reset.', 'success');
        } catch (err) {
            printLine(`Failed to reset REPL: ${err?.message || err}`, 'error');
        }
    };

    const printPythonLessons = () => {
        printDivider();
        printLine('Python crash course index', 'system');
        pythonLessons.forEach((lesson, index) => {
            const number = String(index + 1).padStart(2, '0');
            const seen = state.visitedPython.has(lesson.id) ? 'yes' : 'no';
            printLine(`${number}  ${lesson.id.padEnd(22, ' ')} seen:${seen}`);
        });
    };

    const showPythonLesson = (lesson, options = {}) => {
        if (!lesson) return;
        const markVisited = options.markVisited !== false;
        state.pythonIndex = pythonLessons.indexOf(lesson);
        if (markVisited) state.visitedPython.add(lesson.id);
        state.activeQuiz = null;
        state.activeQuizScope = '';
        state.exploration = null;

        printDivider();
        printLine(`Python lesson ${state.pythonIndex + 1}: ${lesson.title} [${lesson.id}]`, 'system');
        printLine(`Goal        : ${lesson.goal}`);
        printLine('Core ideas  :', 'success');
        lesson.concepts.forEach((concept, index) => {
            printLine(`  ${index + 1}. ${concept}`);
        });
        printLine('Example code:', 'muted');
        printBlock(lesson.code.join('\n'));
        printLine('Try: python quiz  |  python next  |  python open <id>', 'muted');
    };

    const runPythonCommand = async (args) => {
        const [subRaw, ...rest] = args;
        const sub = (subRaw || '').toLowerCase();
        const payload = rest.join(' ');

        if (!sub || sub === 'list') {
            printPythonLessons();
            return;
        }
        if (sub === 'help') {
            printPythonHelp();
            return;
        }
        if (sub === 'start') {
            showPythonLesson(pythonLessons[0]);
            return;
        }
        if (sub === 'open' || sub === 'show') {
            const lesson = resolvePythonLesson(payload);
            if (!lesson) {
                printLine('Python lesson not found. Use `python` to list IDs.', 'error');
                return;
            }
            showPythonLesson(lesson);
            return;
        }
        if (sub === 'next') {
            const nextIndex = (state.pythonIndex + 1) % pythonLessons.length;
            showPythonLesson(pythonLessons[nextIndex]);
            return;
        }
        if (sub === 'prev') {
            const prevIndex = (state.pythonIndex - 1 + pythonLessons.length) % pythonLessons.length;
            showPythonLesson(pythonLessons[prevIndex]);
            return;
        }
        if (sub === 'quiz') {
            const lesson = pythonLessons[state.pythonIndex];
            if (!lesson?.quiz) {
                printLine('No quiz is defined for this lesson.', 'error');
                return;
            }
            state.activeQuiz = lesson.quiz;
            state.activeQuizScope = `python:${lesson.id}`;
            printDivider();
            printLine(`Python quiz: ${lesson.title}`, 'system');
            printLine(lesson.quiz.question);
            printLine('Reply with: python answer <your response> or answer <your response>', 'muted');
            return;
        }
        if (sub === 'answer') {
            submitAnswer(payload);
            return;
        }
        if (sub === 'repl') {
            startPythonRepl();
            return;
        }
        if (sub === 'run') {
            await runPythonSnippetInTerminal(payload);
            return;
        }

        printLine(`Unknown python subcommand: ${sub}. Use \`python help\`.`, 'error');
    };

    const playAnimation = (nameRaw) => {
        const normalized = normalize(nameRaw || 'gradient');
        const aliases = {
            art: 'machine',
            banner: 'machine',
            'machine-learner': 'machine',
            machine: 'machine',
            'white-rabbit': 'rabbit',
            'follow-the-white-rabbit': 'rabbit',
            algorithm: 'algorithms',
            distributed: 'ddia',
            'distributed-systems': 'ddia'
        };
        const key = animationFrames[normalized] ? normalized : (aliases[normalized] || normalized);
        const frames = animationFrames[key];
        if (!frames || !frames.length) {
            printLine('Animation not found. Try: machine, rabbit, algorithms, ddia, gradient, attention, rl, python', 'error');
            return;
        }

        stopAnimation();
        printDivider();
        printLine(`Animation: ${key}`, 'system');
        const block = printBlock(frames[0], 'terminal-animation');
        state.animationBlock = block;
        let frame = 0;
        let cycles = 0;
        const maxCycles = 2;

        state.animationTimer = setInterval(() => {
            if (!state.animationBlock) {
                stopAnimation();
                return;
            }
            frame = (frame + 1) % frames.length;
            if (frame === 0) {
                cycles += 1;
                if (cycles >= maxCycles) {
                    stopAnimation();
                    printLine('Animation complete.', 'success');
                    return;
                }
            }
            state.animationBlock.textContent = frames[frame];
            scrollToBottom();
        }, 360);
    };

    const startMission = () => {
        const missions = [
            'Mission: explain `h = Wx + b` in one sentence, then run `answer ...`.',
            'Mission: run `open transformers` and identify where positional info enters.',
            'Mission: run `python open functions` and write why return values matter.',
            'Mission: run `quest start`, solve one quest with `quest submit <expr>`, then check `quest status`.',
            'Mission: run `animate rl` and describe exploration vs exploitation.',
            'Mission: run `quiz`, answer it, then check `xp`.'
        ];
        const selected = missions[Math.floor(Math.random() * missions.length)];
        printDivider();
        printLine(selected, 'system');
    };

    const printStatus = () => {
        const activeTopic = topics[state.currentIndex];
        const activeLesson = pythonLessons[state.pythonIndex];
        const total = topics.length;
        const seen = state.visited.size;
        const completion = total ? Math.round((seen / total) * 100) : 0;
        const pythonTotal = pythonLessons.length;
        const pythonSeen = state.visitedPython.size;
        const pythonCompletion = pythonTotal ? Math.round((pythonSeen / pythonTotal) * 100) : 0;
        const questTotal = questChallenges.length;
        const questDone = state.questCompleted.size;
        const questCompletion = questTotal ? Math.round((questDone / questTotal) * 100) : 0;
        printDivider();
        printLine('Session status', 'system');
        printLine(`Active topic : ${activeTopic ? activeTopic.id : 'none'}`);
        printLine(`Visited      : ${seen}/${total} (${completion}%)`);
        printLine(`Python lesson: ${activeLesson ? activeLesson.id : 'none'}`);
        printLine(`Python done  : ${pythonSeen}/${pythonTotal} (${pythonCompletion}%)`);
        printLine(`Quest done   : ${questDone}/${questTotal} (${questCompletion}%)`);
        printLine(`Quest streak : ${state.questStreak}`);
        printLine(`XP           : ${state.xp}`);
        printLine('Visuals      : rain disabled');
        printLine(`Python REPL  : ${state.pythonRepl.active ? 'active' : 'inactive'}`);
        printLine(`Explore flow : ${state.exploration ? `${state.exploration.key} [step ${state.exploration.step + 1}]` : 'none'}`);
        printLine(`History size : ${state.history.length} commands`);
        printLine(`Animation    : ${state.animationTimer ? 'running' : 'idle'}`);
    };

    const startQuiz = () => {
        const topic = topics[state.currentIndex];
        if (!topic || !topic.quiz) {
            printLine('No quiz is defined for this topic.', 'error');
            return;
        }
        state.activeQuiz = topic.quiz;
        state.activeQuizScope = `topic:${topic.id}`;
        printDivider();
        printLine(`Quiz: ${topic.title}`, 'system');
        printLine(topic.quiz.question);
        printLine('Reply with: answer <your response>', 'muted');
    };

    const submitAnswer = (answerText) => {
        if (!state.activeQuiz) {
            printLine('No active quiz. Run `quiz` first.', 'error');
            return;
        }
        const cleaned = answerText.trim().toLowerCase();
        if (!cleaned) {
            printLine('Provide an answer text after `answer`.', 'error');
            return;
        }

        const quiz = state.activeQuiz;
        const hits = quiz.keywords.filter(keyword => cleaned.includes(keyword.toLowerCase())).length;
        const required = Math.max(1, Math.ceil(quiz.keywords.length / 2));
        if (hits >= required) {
            printLine('Checkpoint passed. Your answer captures the core idea.', 'success');
            state.xp += 10;
            celebrate('+10 XP');
            state.activeQuiz = null;
            state.activeQuizScope = '';
            return;
        }

        printLine(`Not quite yet. Hint: ${quiz.hint}`, 'error');
        printLine('Try again with: answer <your response>', 'muted');
    };

    const resetSession = () => {
        stopAnimation();
        if (state.introTimer) {
            clearTimeout(state.introTimer);
            state.introTimer = null;
        }
        state.currentIndex = 0;
        state.visited.clear();
        state.pythonIndex = 0;
        state.visitedPython.clear();
        state.history = [];
        state.historyCursor = 0;
        state.activeQuiz = null;
        state.activeQuizScope = '';
        state.exploration = null;
        state.pythonRepl.active = false;
        state.questIndex = 0;
        state.questCompleted.clear();
        state.questHintsUsed = {};
        state.questStreak = 0;
        state.questBadges.clear();
        state.topicView = topics;
        state.xp = 0;
        screen.innerHTML = '';
        printBanner();
        printHelp();
        startGuidedLearningSequence();
    };

    const runCommand = async (rawCommand) => {
        const command = rawCommand.trim();
        if (!command) return;

        printLine(`ml@browser:~$ ${command}`, 'command');

        if (state.pythonRepl.active) {
            if (command === '.exit') {
                stopPythonRepl();
                return;
            }
            if (command === '.reset') {
                await resetPythonRepl();
                return;
            }
            if (command === '.help') {
                printLine('REPL commands: .help | .reset | .exit', 'system');
                return;
            }
            await runPythonSnippetInTerminal(command);
            return;
        }

        const [verbRaw, ...rest] = command.split(/\s+/);
        const verb = verbRaw.toLowerCase();
        const payload = rest.join(' ');

        if (verb === 'help') {
            printHelp();
            return;
        }
        if (verb === 'dashboard' || verb === 'tui') {
            printDashboard();
            return;
        }
        if (verb === 'art' || verb === 'banner') {
            runArtCommand(rest);
            return;
        }
        if (verb === 'shortcut') {
            openMachineLearnerShortcut();
            return;
        }
        if (verb === 'rabbit') {
            playAnimation('rabbit');
            return;
        }
        if (verb === 'algorithms') {
            printTopics('algorithms');
            return;
        }
        if (verb === 'ddia') {
            printTopics('distributed');
            return;
        }
        if (verb === 'rain' || verb === 'matrix') {
            runRainCommand(rest);
            return;
        }
        if (verb === 'pyrepl') {
            startPythonRepl();
            return;
        }
        if (verb === 'python' || verb === 'py') {
            await runPythonCommand(rest);
            return;
        }
        if (verb === 'quest' || verb === 'quests') {
            await runQuestCommand(rest);
            return;
        }
        if (verb === 'catalog') {
            printTopics(payload || 'algorithms');
            return;
        }
        if (verb === 'topics' || verb === 'ls') {
            printTopics(payload);
            return;
        }
        if (verb === 'open' || verb === 'show') {
            const topic = resolveTopic(payload);
            if (!topic) {
                printLine('Topic not found. Use `topics` to list valid IDs.', 'error');
                return;
            }
            showTopic(topic);
            return;
        }
        if (verb === 'next') {
            const nextIndex = (state.currentIndex + 1) % topics.length;
            showTopic(topics[nextIndex]);
            return;
        }
        if (verb === 'prev') {
            const prevIndex = (state.currentIndex - 1 + topics.length) % topics.length;
            showTopic(topics[prevIndex]);
            return;
        }
        if (verb === 'map') {
            printMap();
            return;
        }
        if (verb === 'explore') {
            startExplore(payload);
            return;
        }
        if (verb === 'step' || verb === 'forward') {
            moveExplore(1);
            return;
        }
        if (verb === 'back' || verb === 'prevstep') {
            moveExplore(-1);
            return;
        }
        if (verb === 'endexplore' || verb === 'stopexplore') {
            endExplore();
            return;
        }
        if (verb === 'graph') {
            printTuiGraphic(payload || 'network');
            return;
        }
        if (verb === 'animate') {
            const animationName = payload || 'gradient';
            if (animationName.toLowerCase() === 'stop') {
                stopAnimation();
                printLine('Animation stopped.', 'system');
                return;
            }
            playAnimation(animationName);
            return;
        }
        if (verb === 'mission') {
            startMission();
            return;
        }
        if (verb === 'quiz') {
            startQuiz();
            return;
        }
        if (verb === 'answer') {
            submitAnswer(payload);
            return;
        }
        if (verb === 'xp') {
            printLine(`XP total: ${state.xp}`, 'system');
            return;
        }
        if (verb === 'status') {
            printStatus();
            return;
        }
        if (verb === 'clear') {
            stopAnimation();
            screen.innerHTML = '';
            return;
        }
        if (verb === 'reset') {
            resetSession();
            return;
        }

        printLine(`Unknown command: ${verb}. Run \`help\` for available commands.`, 'error');
    };

    const pushHistory = (command) => {
        const value = command.trim();
        if (!value) return;
        state.history.push(value);
        if (state.history.length > 200) {
            state.history.shift();
        }
        state.historyCursor = state.history.length;
    };

    inputForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const command = input.value;
        if (!command.trim()) return;
        pushHistory(command);
        runCommand(command).catch(err => {
            printLine(`Command error: ${err?.message || err}`, 'error');
        });
        input.value = '';
        input.focus();
    });

    input.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp') {
            if (!state.history.length) return;
            event.preventDefault();
            state.historyCursor = Math.max(0, state.historyCursor - 1);
            input.value = state.history[state.historyCursor] || '';
            return;
        }

        if (event.key === 'ArrowDown') {
            if (!state.history.length) return;
            event.preventDefault();
            state.historyCursor = Math.min(state.history.length, state.historyCursor + 1);
            if (state.historyCursor === state.history.length) {
                input.value = '';
            } else {
                input.value = state.history[state.historyCursor] || '';
            }
        }
    });

    terminal.addEventListener('click', () => {
        input.focus();
    });

    shortcutButtons.forEach(button => {
        button.addEventListener('click', () => {
            const command = button.dataset.terminalCommand;
            if (!command) return;
            pushHistory(command);
            runCommand(command).catch(err => {
                printLine(`Command error: ${err?.message || err}`, 'error');
            });
            input.focus();
        });
    });

    printBanner();
    printHelp();
    startIntroSequence();
    input.focus();
}

function setupOnnxDemo() {
    const runBtn = document.getElementById('onnxDemoRun');
    const resetBtn = document.getElementById('onnxDemoReset');
    const outputEl = document.getElementById('onnxDemoOutput');
    const statusEl = document.getElementById('onnxDemoStatus');
    const canvas = document.getElementById('onnxInputCanvas');
    const urlInput = document.getElementById('onnxModelUrl');
    const patternButtons = Array.from(document.querySelectorAll('[data-onnx-pattern]'));

    if (!runBtn || !outputEl || !canvas || !urlInput) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 28;
    const scale = canvas.width / size;
    let session = null;
    let sessionUrl = '';
    let currentPattern = 'center';
    let currentData = null;

    const setStatus = (text) => {
        if (statusEl) statusEl.textContent = text;
    };

    const setOutput = (text, isError = false) => {
        outputEl.classList.toggle('has-error', isError);
        let textEl = outputEl.querySelector('.cell-output-text');
        if (!textEl) {
            textEl = document.createElement('p');
            textEl.className = 'cell-output-text';
            outputEl.innerHTML = '';
            outputEl.appendChild(textEl);
        }
        textEl.textContent = text;
    };

    const buildPattern = (name) => {
        const data = new Float32Array(size * size);
        if (name === 'center') {
            for (let r = 12; r <= 15; r += 1) {
                for (let c = 12; c <= 15; c += 1) {
                    data[r * size + c] = 1;
                }
            }
        } else if (name === 'diagonal') {
            for (let i = 0; i < size; i += 1) {
                data[i * size + i] = 1;
                if (i + 1 < size) data[i * size + i + 1] = 0.6;
            }
        } else if (name === 'box') {
            for (let i = 7; i <= 20; i += 1) {
                data[7 * size + i] = 1;
                data[20 * size + i] = 1;
                data[i * size + 7] = 1;
                data[i * size + 20] = 1;
            }
        } else if (name === 'noise') {
            for (let i = 0; i < data.length; i += 1) {
                data[i] = Math.random();
            }
        }
        return data;
    };

    const renderPattern = (data) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        for (let r = 0; r < size; r += 1) {
            for (let c = 0; c < size; c += 1) {
                const value = data[r * size + c];
                const shade = Math.max(30, Math.round(255 - value * 220));
                ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
                ctx.fillRect(c * scale, r * scale, scale, scale);
            }
        }
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= size; i += 1) {
            const pos = i * scale;
            ctx.beginPath();
            ctx.moveTo(pos, 0);
            ctx.lineTo(pos, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, pos);
            ctx.lineTo(canvas.width, pos);
            ctx.stroke();
        }
    };

    const setPattern = (name) => {
        currentPattern = name;
        currentData = buildPattern(name);
        renderPattern(currentData);
        patternButtons.forEach(button => {
            button.classList.toggle('is-active', button.dataset.onnxPattern === name);
            button.setAttribute('aria-pressed', button.dataset.onnxPattern === name ? 'true' : 'false');
        });
    };

    const ensureOrtEnv = () => {
        if (!window.ort || !window.ort.env || !window.ort.env.wasm) return;
        window.ort.env.wasm.numThreads = 1;
        if (!window.ort.env.wasm.wasmPaths) {
            window.ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
        }
    };

    const runInference = async () => {
        if (!window.ort) {
            setOutput('ONNX Runtime Web is not loaded. Check your network connection.', true);
            setStatus('Missing runtime.');
            return;
        }

        runBtn.disabled = true;
        if (resetBtn) resetBtn.disabled = true;
        setStatus('Loading model...');
        setOutput('Loading model...');

        try {
            ensureOrtEnv();
            const modelUrl = urlInput.value.trim();
            if (!modelUrl) {
                throw new Error('Model URL is empty.');
            }
            if (!session || sessionUrl !== modelUrl) {
                session = await window.ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] });
                sessionUrl = modelUrl;
            }

            if (!currentData) {
                currentData = buildPattern(currentPattern);
            }

            const inputName = session.inputNames[0];
            const inputTensor = new window.ort.Tensor('float32', currentData, [1, 1, size, size]);
            const results = await session.run({ [inputName]: inputTensor });
            const outputName = session.outputNames[0];
            const rawScores = results[outputName].data;

            const scores = Array.from(rawScores);
            const maxScore = Math.max(...scores);
            const expScores = scores.map(value => Math.exp(value - maxScore));
            const expSum = expScores.reduce((acc, value) => acc + value, 0) || 1;
            const probs = expScores.map(value => value / expSum);

            const ranked = probs
                .map((value, index) => ({ index, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 3)
                .map(item => `${item.index} (${(item.value * 100).toFixed(1)}%)`);

            setOutput(`Top predictions: ${ranked.join(', ')}`);
            setStatus('Done.');
        } catch (err) {
            setOutput(`Error: ${err?.message || err}`, true);
            setStatus('Error.');
        } finally {
            runBtn.disabled = false;
            if (resetBtn) resetBtn.disabled = false;
        }
    };

    patternButtons.forEach(button => {
        button.addEventListener('click', () => {
            setPattern(button.dataset.onnxPattern);
            setOutput('Output will appear here.');
            setStatus('Ready.');
        });
    });

    if (resetBtn) {
        const defaultUrl = urlInput.value;
        resetBtn.addEventListener('click', () => {
            urlInput.value = defaultUrl;
            setPattern('center');
            setOutput('Output will appear here.');
            setStatus('Reset.');
        });
    }

    runBtn.addEventListener('click', runInference);
    setPattern(currentPattern);
    setStatus('Ready.');
}

// ============================================
// Initialize all canvases on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setupThemeSwitcher();
    setupChapterSwitcher();
    setupChapterNavigation();
    initFundamentals();
    setupFundamentalsPlayground();
    setupVectorControls();
    setupVectorScenes();
    setupVectorModes();
    setupVectorDbSection();
    setupMatrixModes();
    setupMatrixControls();
    setupMatrixDeepControls();
    setupProbabilitySection();
    setupProbabilityDepth();
    setupProbabilityVenn();
    setupSpamFilter();
    setupLikelihoodStepper();
    setupLikelihoodPlayground();
    setupSampleSpace();
    setupMlLifecycleStepper();
    setupMlAlgorithmStepper();
    setupMlMiniVisuals();
    setupBackpropStepper();
    setupNeuronLab();
    setupDigitLab();
    setupDeepNetwork();
    setupCnnLab();
    setupRnnLab();
    setupLstmLab();
    setupTransformerLab();
    setupTransformerAdvanced();
    setupRlFundamentals();
    setupBandits();
    setupGridworld();
    setupMonteCarlo();
    setupTd();
    setupControl();
    setupNotebookLab();
    setupConceptTerminalLab();
    setupOnnxDemo();
    setupHolidayParade();
    setupVisualizationMeta();
    refreshAllVisuals();
    
    // Add event listeners for activation function checkboxes
    const checkboxes = ['showSigmoid', 'showReLU', 'showTanh'];
    checkboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', drawActivationFunctions);
        }
    });
});
