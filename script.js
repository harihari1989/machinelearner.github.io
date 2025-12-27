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
    const distanceEl = document.getElementById('vectorDistance');

    if (sumEl) sumEl.textContent = `[${formatNumber(ax + bx)}, ${formatNumber(ay + by)}]`;
    if (dotEl) dotEl.textContent = formatNumber(dot);
    if (cosineEl) cosineEl.textContent = formatNumber(cosine);
    if (angleEl) angleEl.textContent = `${formatNumber(angleDeg, 1)}°`;
    if (distanceEl) distanceEl.textContent = formatNumber(distance);
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
        formula: '\\Sigma^{-1} = (1/\\det \\Sigma)\\,\\text{adj}(\\Sigma)',
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
        formula: 'A\\mathbf{v} = \\lambda \\mathbf{v}',
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

    drawGrid(ctx, leftOrigin, scale, size, [
        [1, 0],
        [0, 1]
    ], theme.grid);
    drawAxes(ctx, leftOrigin, scale, size, theme.axis);

    drawGrid(ctx, rightOrigin, scale, size, matrix, theme.primary);
    drawAxes(ctx, rightOrigin, scale, size, theme.axis);

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
        fillSquare: true,
        labelLeft: 'Before',
        labelRight: 'Scaled grid'
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
    if (scaleGroup) scaleGroup.hidden = !showScale;
    if (shearGroup) shearGroup.hidden = !showShear;
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
        note: 'Binary outcomes with parameter p. Use for clicks, coins, yes/no labels.'
    },
    {
        id: 'categorical',
        type: 'bars',
        labels: ['A', 'B', 'C', 'D', 'E'],
        values: [0.35, 0.2, 0.18, 0.17, 0.1],
        annotation: 'sum p_i = 1',
        note: 'Multiple discrete outcomes with probabilities. Use for class labels or choices.'
    },
    {
        id: 'binomial',
        type: 'binomial',
        n: 10,
        p: 0.5,
        annotation: 'n = 10, p = 0.5',
        note: 'Counts successes in n trials with probability p. Use for pass/fail counts in batches.'
    },
    {
        id: 'normal',
        type: 'curve',
        annotation: 'mu = 0, sigma = 1',
        note: 'Continuous bell curve with mean (mu) and standard deviation (sigma). Use for noise, heights, residuals.'
    },
    {
        id: 'bayes',
        type: 'bayes',
        note: 'Bayes update: prior × likelihood → posterior.'
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
            { title: 'Plot data', summary: 'Scatter the training points.', text: 'Plot feature-target pairs in a coordinate plane.' },
            { title: 'Fit the line', summary: 'Minimize squared error.', text: 'Find the line that best fits the data trend.' },
            { title: 'Predict', summary: 'Read the line at a new x.', text: 'Use the fitted line to estimate a new y value.' }
        ]
    },
    logistic: {
        label: 'Logistic Regression',
        steps: [
            { title: 'Plot classes', summary: 'Label the points.', text: 'Visualize class A vs class B data.' },
            { title: 'Find boundary', summary: 'Separate the classes.', text: 'Learn a boundary that splits the classes.' },
            { title: 'Score probability', summary: 'Output a probability.', text: 'Convert the score into a probability with a sigmoid.' }
        ]
    },
    knn: {
        label: 'k-NN',
        steps: [
            { title: 'Store data', summary: 'Keep labeled points.', text: 'k-NN memorizes the training examples.' },
            { title: 'Find neighbors', summary: 'Pick the closest k.', text: 'Measure distances from the query to all points.' },
            { title: 'Vote', summary: 'Majority wins.', text: 'Predict the label from the nearest neighbors.' }
        ]
    },
    tree: {
        label: 'Decision Trees',
        steps: [
            { title: 'Pick a split', summary: 'Choose a feature cut.', text: 'Select the best split to reduce impurity.' },
            { title: 'Split again', summary: 'Refine the regions.', text: 'Keep splitting until regions are pure enough.' },
            { title: 'Assign leaves', summary: 'Label each region.', text: 'Each leaf predicts a class or value.' }
        ]
    },
    forest: {
        label: 'Random Forest',
        steps: [
            { title: 'Bootstrap data', summary: 'Sample data for each tree.', text: 'Each tree sees a different bootstrapped dataset.' },
            { title: 'Grow trees', summary: 'Train many trees.', text: 'Split with random feature subsets.' },
            { title: 'Vote', summary: 'Aggregate the trees.', text: 'Combine tree predictions by voting.' }
        ]
    },
    svm: {
        label: 'Support Vector Machine',
        steps: [
            { title: 'Plot classes', summary: 'Place the data.', text: 'Visualize points from two classes.' },
            { title: 'Maximize margin', summary: 'Find the widest gap.', text: 'Fit the boundary that maximizes the margin.' },
            { title: 'Support vectors', summary: 'Anchor the boundary.', text: 'Only a few points define the solution.' }
        ]
    },
    bayes: {
        label: 'Naive Bayes',
        steps: [
            { title: 'Estimate likelihoods', summary: 'Model each class.', text: 'Estimate distributions for each class.' },
            { title: 'Apply Bayes', summary: 'Combine prior and likelihood.', text: 'Compute posterior probabilities.' },
            { title: 'Pick a class', summary: 'Highest posterior wins.', text: 'Choose the class with larger probability.' }
        ]
    },
    kmeans: {
        label: 'k-Means',
        steps: [
            { title: 'Initialize centers', summary: 'Pick starting centroids.', text: 'Start with initial cluster centers.' },
            { title: 'Assign points', summary: 'Group by nearest center.', text: 'Each point joins its closest centroid.' },
            { title: 'Update centers', summary: 'Move to the mean.', text: 'Recompute centers and repeat.' }
        ]
    },
    pca: {
        label: 'PCA',
        steps: [
            { title: 'Plot data', summary: 'Show the point cloud.', text: 'Display the data in the original space.' },
            { title: 'Find principal axis', summary: 'Max variance direction.', text: 'Compute the direction with the highest variance.' },
            { title: 'Project', summary: 'Drop to a lower dimension.', text: 'Project points onto the principal axis.' }
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
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        ctx.fill();
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
    drawSampleSpaceCanvas();
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

function drawAxes(ctx, origin, scale, size, color) {
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
    ctx.fillText('length = 5', origin.x + 10, origin.y - 5 * scale - 12);
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
        visual: 'Length is distance from the origin. Normalization keeps direction but fixes scale.',
        example: 'If \\(x = [3, 4]\\), then \\(\\lVert x \\rVert = 5\\) and \\(\\hat{x} = [0.6, 0.8]\\).',
        intuition: 'Cosine similarity compares directions after normalization.',
        math: '\\(\\lVert x \\rVert_2 = \\sqrt{x_1^2 + x_2^2}\\), \\(\\hat{x} = x / \\lVert x \\rVert\\)',
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
        visual: 'Gradients point uphill. Jacobians stack partials; Hessians show curvature.',
        example: 'If \\(\\nabla L = [2, -1]\\), the downhill step is \\([-0.2, 0.1]\\) for \\(\\eta=0.1\\).',
        intuition: 'Jacobian shapes vector outputs; Hessian curvature guides second-order updates.',
        math: '\\(\\nabla f\\)<br>\\(J_{ij}=\\partial f_i/\\partial x_j\\)<br>\\(H_{ij}=\\partial^2 f/\\partial x_i\\partial x_j\\)',
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
            title: "d/dx f(g(x)) = f'(g(x)) g'(x)",
            colorKey: 'secondary',
            draw: drawChainRuleMini
        }
    ], theme);
}

function drawOptimizationScene(ctx, canvas) {
    const theme = getThemeColors();
    drawFormulaCards(ctx, canvas, [
        {
            title: 'theta = theta - eta grad L',
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
            title: 'Y = XW',
            colorKey: 'primary',
            draw: drawMatrixForwardMini
        },
        {
            title: 'dL/dX = dL/dY W^T',
            colorKey: 'secondary',
            draw: drawGradXMini
        },
        {
            title: 'dL/dW = X^T dL/dY',
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
    drawSampleSpaceCanvas();
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
// Initialize all canvases on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setupThemeSwitcher();
    setupChapterSwitcher();
    setupChapterNavigation();
    initFundamentals();
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
    setupHolidayParade();
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
