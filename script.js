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
    operation: 'multiply',
    progress: 1
};

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
    step: {
        formula: 'c_{ij} = \\sum_k a_{ik} b_{kj}',
        note: 'Each entry is a row-by-column dot product.',
        animate: true,
        speed: 0.03
    },
    covariance: {
        formula: '\\Sigma^{-1} = (1/\\det \\Sigma)\\,\\text{adj}(\\Sigma)',
        note: 'Covariance summarizes spread; the inverse (precision) reweights directions.',
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

function drawMatrixArithmetic(ctx, theme) {
    const a = matrixState.a;
    const b = matrixState.b;
    const result = matrixState.operation === 'add' ? addMatrices(a, b) : multiplyMatrices(a, b);

    const startX = 32;
    const startY = 74;
    const gap = 22;
    const boxA = drawMatrixBox(ctx, startX, startY, a, 'A', theme);
    const centerY = startY + boxA.height / 2;
    const opSymbol = matrixState.operation === 'add' ? '+' : '×';

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
    ctx.globalAlpha = Math.min(1, matrixState.progress);
    drawMatrixBox(ctx, eqX + gap, startY, result, 'C', theme);
    ctx.restore();
}

function drawMatrixMultiplicationSteps(ctx, theme) {
    const a = matrixState.a;
    const b = matrixState.b;
    const result = multiplyMatrices(a, b);
    const steps = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 1, col: 0 },
        { row: 1, col: 1 }
    ];
    const stepIndex = Math.min(steps.length - 1, Math.floor(matrixState.progress * steps.length));
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

    const startY = 40;
    const leftX = 40;
    const gap = 28;
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

    const ellipseY = 235;
    const covCenterX = leftX + boxSigma.width / 2;
    const precCenterX = rightX + boxPrecision.width / 2;

    ctx.save();
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(covCenterX, ellipseY, 56, 28, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(precCenterX, ellipseY, 28, 56, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('covariance shape', covCenterX, ellipseY + 55);
    ctx.fillText('precision shape', precCenterX, ellipseY + 55);
}

function drawIdentityMatrix(ctx, theme) {
    const a = matrixState.a;
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

function drawMatrixOperation(ctx, canvas, theme) {
    if (matrixState.operation === 'add' || matrixState.operation === 'multiply') {
        drawMatrixArithmetic(ctx, theme);
        return;
    }

    if (matrixState.operation === 'step') {
        drawMatrixMultiplicationSteps(ctx, theme);
        return;
    }

    if (matrixState.operation === 'covariance') {
        drawCovariancePrecision(ctx, theme);
        return;
    }

    if (matrixState.operation === 'identity') {
        drawIdentityMatrix(ctx, theme);
        return;
    }

    if (matrixState.operation === 'onehot') {
        drawOneHotEncoding(ctx, theme);
        return;
    }

    if (matrixState.operation === 'eigen') {
        drawEigenVisualization(ctx, canvas, theme);
        return;
    }

    drawMatrixArithmetic(ctx, theme);
}

function drawMatrixCanvas() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrixOperation(ctx, canvas, theme);
}

function updateMatrixUI() {
    const config = matrixOperationConfig[matrixState.operation] || matrixOperationConfig.multiply;
    const formula = document.getElementById('matrixOperationFormula');
    const note = document.getElementById('matrixOperationNote');
    const buttons = document.querySelectorAll('[data-matrix-op]');
    const animateButton = document.getElementById('matrixAnimateButton');

    buttons.forEach(button => {
        button.classList.toggle('is-active', button.dataset.matrixOp === matrixState.operation);
    });

    if (formula) {
        formula.innerHTML = `\\[${config.formula}\\]`;
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([formula]);
        }
    }

    if (note) {
        note.textContent = config.note;
    }

    if (animateButton) {
        animateButton.style.display = config.animate ? 'inline-flex' : 'none';
    }
}

function setMatrixOperation(operation) {
    matrixState.operation = operation;
    matrixState.progress = operation === 'step' ? 0 : 1;
    updateMatrixUI();
    drawMatrixCanvas();
}

function animateMatrixOperation() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    const config = matrixOperationConfig[matrixState.operation] || matrixOperationConfig.multiply;
    if (!config.animate) return;
    let progress = 0;
    const speed = config.speed || 0.04;
    const animate = () => {
        progress += speed;
        matrixState.progress = Math.min(1, progress);
        drawMatrixCanvas();
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    matrixState.progress = 0;
    animate();
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
    const badgeEl = document.getElementById('cnnStepBadge');
    const titleEl = document.getElementById('cnnStepTitle');
    const textEl = document.getElementById('cnnStepText');

    if (noteEl) noteEl.textContent = example.note;
    if (patchEl) patchEl.textContent = `(${row + 1}, ${col + 1})`;
    if (valueEl) valueEl.textContent = outputValue.toFixed(2);
    if (badgeEl) badgeEl.textContent = `Step ${cnnState.stepIndex + 1} of ${total}`;
    if (titleEl) titleEl.textContent = `Filter at row ${row + 1}, col ${col + 1}`;
    if (textEl) textEl.textContent = 'Multiply the 3x3 patch by the filter, then sum to get one output cell.';
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
        hidden: [0.22, 0.45, 0.63, 0.58],
        note: 'Each hidden state carries context to the next word.'
    },
    {
        id: 'weather',
        label: 'Forecast',
        tokens: ['Temp', 'rises', 'then', 'drops'],
        outputs: ['rises', 'then', 'drops', 'tomorrow'],
        hidden: [0.31, 0.5, 0.42, 0.6],
        note: 'Sequence trends show up in the hidden state.'
    },
    {
        id: 'music',
        label: 'Music pattern',
        tokens: ['C', 'D', 'E', 'G'],
        outputs: ['D', 'E', 'G', 'A'],
        hidden: [0.18, 0.35, 0.54, 0.7],
        note: 'Rhythm and melody are learned across steps.'
    }
];

const rnnState = {
    exampleId: rnnExamples[0].id,
    stepIndex: 0,
    timer: null
};

function getRnnExample() {
    return rnnExamples.find(example => example.id === rnnState.exampleId) || rnnExamples[0];
}

function updateRnnUI() {
    const example = getRnnExample();
    const step = rnnState.stepIndex;
    const total = example.tokens.length;
    const tokenEl = document.getElementById('rnnToken');
    const hiddenEl = document.getElementById('rnnHidden');
    const outputEl = document.getElementById('rnnOutput');
    const noteEl = document.getElementById('rnnExampleNote');
    const badgeEl = document.getElementById('rnnStepBadge');
    const titleEl = document.getElementById('rnnStepTitle');
    const textEl = document.getElementById('rnnStepText');

    if (tokenEl) tokenEl.textContent = example.tokens[step];
    if (hiddenEl) hiddenEl.textContent = example.hidden[step].toFixed(2);
    if (outputEl) outputEl.textContent = example.outputs[step];
    if (noteEl) noteEl.textContent = example.note;
    if (badgeEl) badgeEl.textContent = `Step ${step + 1} of ${total}`;
    if (titleEl) titleEl.textContent = `Time step ${step + 1}`;
    if (textEl) textEl.textContent = 'Input -> hidden state -> output at this time step.';
}

function drawRnnCanvas() {
    const canvas = document.getElementById('rnnCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const example = getRnnExample();
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

    example.hidden.forEach((value, index) => {
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
        ctx.fillText(value.toFixed(2), x, hiddenY + 4);

        if (index < example.hidden.length - 1) {
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
    const memoryBeforeEl = document.getElementById('lstmMemoryBefore');
    const forgetEl = document.getElementById('lstmForgetGate');
    const inputEl = document.getElementById('lstmInputGate');
    const outputEl = document.getElementById('lstmOutputGate');
    const noteEl = document.getElementById('lstmExampleNote');
    const badgeEl = document.getElementById('lstmStepBadge');
    const titleEl = document.getElementById('lstmStepTitle');
    const textEl = document.getElementById('lstmStepText');

    if (memoryBeforeEl) memoryBeforeEl.textContent = example.memoryBefore.toFixed(2);
    if (forgetEl) forgetEl.textContent = example.forget.toFixed(2);
    if (inputEl) inputEl.textContent = example.input.toFixed(2);
    if (outputEl) outputEl.textContent = example.output.toFixed(2);
    if (noteEl) noteEl.textContent = example.note;
    if (badgeEl) badgeEl.textContent = `Step ${step + 1} of ${total}`;
    if (titleEl) titleEl.textContent = lstmSteps[step].title;
    if (textEl) textEl.textContent = lstmSteps[step].text;
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

const vectorScenes = [
    {
        title: 'Scene 1: Projection is a 1D summary',
        visual: 'Pick a direction \\(u\\) and drop a perpendicular from \\(x\\). The shadow coordinate is \\(x \\cdot u\\).',
        example: 'Let \\(x = [3, 4]\\), \\(u = [1, 0]\\). Projection is \\([3, 0]\\).',
        intuition: 'PCA finds the direction where projections have the most spread.',
        math: '\\(\\mathrm{proj}_u(x) = (x \\cdot u)u\\) for unit \\(u\\).',
        draw: drawProjectionScene
    },
    {
        title: 'Scene 2: Gradients are arrows',
        visual: 'On a loss landscape, the gradient arrow points steepest uphill. Step the opposite way to go downhill.',
        example: 'If \\(\\nabla L = [2, -1]\\) and \\(\\eta = 0.1\\), the step is \\([-0.2, 0.1]\\).',
        intuition: 'Training is repeatedly following these arrows downhill.',
        math: '\\(\\theta \\leftarrow \\theta - \\eta \\nabla_\\theta L\\)',
        draw: drawGradientScene
    },
    {
        title: 'Scene 3: Regularization pulls to zero',
        visual: 'Data-fit pushes weights somewhere. Regularization adds a pull back toward the origin.',
        example: 'L2 has circular contours; L1 has diamond contours that encourage zeros.',
        intuition: 'Where the contour touches the constraint explains sparsity in L1.',
        math: '\\[L + \\lambda\\lVert w \\rVert_2^2\\]\\[L + \\lambda\\lVert w \\rVert_1\\]',
        draw: drawRegularizationScene
    },
    {
        title: 'Scene 4: Attention as a spotlight',
        visual: 'A query arrow compares to key arrows. Softmax turns scores into weights, then you average the value arrows.',
        example: 'If scores are \\(s = [2, 1, 0]\\), the weight on 2 is largest, so output leans toward \\(v_1\\).',
        intuition: 'Attention is a weighted average that points where alignment is strongest.',
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
    const leftOrigin = { x: canvas.width * 0.28, y: canvas.height * 0.48 };
    const rightOrigin = { x: canvas.width * 0.72, y: canvas.height * 0.48 };
    const scale = 16;
    const size = 4;
    const transform = [
        [1.1, 0.4],
        [0.2, 0.9]
    ];

    drawGrid(ctx, leftOrigin, scale, size, [
        [1, 0],
        [0, 1]
    ], theme.grid);
    drawGrid(ctx, rightOrigin, scale, size, transform, theme.primary);

    const vector = { x: 2, y: 1 };
    const vecStart = mapToCanvas({ x: 0, y: 0 }, leftOrigin, scale);
    const vecEnd = mapToCanvas(vector, leftOrigin, scale);
    drawArrow(ctx, vecStart.x, vecStart.y, vecEnd.x, vecEnd.y, theme.primary);

    const transformed = applyMatrix(vector, transform);
    const tStart = mapToCanvas({ x: 0, y: 0 }, rightOrigin, scale);
    const tEnd = mapToCanvas(transformed, rightOrigin, scale);
    drawArrow(ctx, tStart.x, tStart.y, tEnd.x, tEnd.y, theme.secondary);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Before', leftOrigin.x, leftOrigin.y - 90);
    ctx.fillText('After W', rightOrigin.x, rightOrigin.y - 90);

    drawSceneCaption(
        ctx,
        canvas,
        theme.primary,
        'Matrix machines',
        'A grid gets stretched and tilted when you multiply by W.'
    );
}

function drawCalculusScene(ctx, canvas) {
    const theme = getThemeColors();
    const boxY = 34;
    const boxWidth = 90;
    const boxHeight = 36;
    const startX = 40;
    const gap = 30;
    const labels = ['x', 'g(x)', 'f(g(x))'];

    labels.forEach((label, index) => {
        const x = startX + index * (boxWidth + gap);
        drawRoundedRect(ctx, x, boxY, boxWidth, boxHeight, 10);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = theme.secondary;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 12px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x + boxWidth / 2, boxY + boxHeight / 2);
        if (index < labels.length - 1) {
            drawArrow(ctx, x + boxWidth, boxY + boxHeight / 2, x + boxWidth + gap - 8, boxY + boxHeight / 2, theme.secondary);
        }
    });

    const curveBottom = canvas.height - 90;
    const midX = canvas.width / 2;
    const scale = 60;

    const curveY = (x) => {
        const xNorm = (x - midX) / scale;
        const value = 0.6 * xNorm * xNorm + 0.25 * xNorm + 0.4;
        return curveBottom - value * 80;
    };

    ctx.strokeStyle = theme.secondary;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 30; x <= canvas.width - 30; x += 2) {
        const y = curveY(x);
        if (x === 30) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    const x0 = midX + 60;
    const y0 = curveY(x0);
    const y1 = curveY(x0 + 1);
    const slope = y1 - y0;

    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0 - 60, y0 - slope * 60);
    ctx.lineTo(x0 + 60, y0 + slope * 60);
    ctx.stroke();

    ctx.fillStyle = theme.secondary;
    ctx.beginPath();
    ctx.arc(x0, y0, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Tangent = slope', x0 + 10, y0 - 10);

    drawSceneCaption(
        ctx,
        canvas,
        theme.secondary,
        'Chain rule',
        'Slopes multiply as signals move through layers.'
    );
}

function drawOptimizationScene(ctx, canvas) {
    const theme = getThemeColors();
    const curveBottom = canvas.height - 90;
    const midX = canvas.width / 2;
    const hillY = (x) => {
        const xNorm = (x - midX) / 60;
        return curveBottom - (xNorm * xNorm + 0.2) * 70;
    };

    ctx.strokeStyle = theme.success;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 40; x <= canvas.width - 40; x += 2) {
        const y = hillY(x);
        if (x === 40) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    const steps = [70, 120, 170, 210, 240, 260];
    for (let i = 0; i < steps.length; i++) {
        const x = steps[i];
        const y = hillY(x);
        ctx.fillStyle = i === steps.length - 1 ? theme.ink : theme.success;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        if (i > 0) {
            const prevX = steps[i - 1];
            const prevY = hillY(prevX);
            drawArrow(ctx, prevX, prevY, x, y, theme.success);
        }
    }

    drawSceneCaption(
        ctx,
        canvas,
        theme.success,
        'Gradient descent',
        'Small steps head toward the lowest point.'
    );
}

function drawProbabilityScene(ctx, canvas) {
    const theme = getThemeColors();
    const bars = [
        { label: 'Cat', value: 0.58, color: theme.primary },
        { label: 'Dog', value: 0.22, color: theme.secondary },
        { label: 'Fox', value: 0.12, color: theme.warning },
        { label: 'Owl', value: 0.08, color: theme.success }
    ];
    const chartLeft = 60;
    const chartBottom = canvas.height - 110;
    const barWidth = 50;
    const gap = 22;
    const maxHeight = 140;

    ctx.strokeStyle = theme.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft - 20, chartBottom);
    ctx.lineTo(chartLeft + bars.length * (barWidth + gap), chartBottom);
    ctx.stroke();

    bars.forEach((bar, index) => {
        const x = chartLeft + index * (barWidth + gap);
        const height = bar.value * maxHeight;
        ctx.fillStyle = bar.color;
        ctx.fillRect(x, chartBottom - height, barWidth, height);
        ctx.fillStyle = theme.ink;
        ctx.font = 'bold 11px Nunito, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(bar.label, x + barWidth / 2, chartBottom + 18);
        ctx.fillText(`${Math.round(bar.value * 100)}%`, x + barWidth / 2, chartBottom - height - 10);
    });

    drawSceneCaption(
        ctx,
        canvas,
        theme.warning,
        'Softmax confidence',
        'Bigger bars mean higher confidence for that class.'
    );
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
    const blockY = 90;
    drawMatrixBlock(ctx, 40, blockY, 90, 120, 3, 3, '#bae6fd', 'X (batch)');
    drawMatrixBlock(ctx, 170, blockY, 90, 120, 3, 2, '#bbf7d0', 'W (weights)');
    drawMatrixBlock(ctx, 300, blockY, 90, 120, 3, 2, '#fecdd3', 'Y (output)');

    drawArrow(ctx, 130, blockY + 60, 170, blockY + 60, theme.primary);
    drawArrow(ctx, 260, blockY + 60, 300, blockY + 60, theme.primary);

    ctx.fillStyle = theme.ink;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('X · W', 215, blockY + 40);

    drawSceneCaption(
        ctx,
        canvas,
        theme.primary,
        'Batch gradients',
        'Shapes guide the fast gradient rules for backprop.'
    );
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
    drawMatrixCanvas();
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

function setupMatrixControls() {
    const buttons = document.querySelectorAll('[data-matrix-op]');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', () => setMatrixOperation(button.dataset.matrixOp));
    });

    updateMatrixUI();
    drawMatrixCanvas();
}

function setupHolidayParade() {
    const parade = document.querySelector('.holiday-parade');
    if (!parade) return;

    const santa = parade.querySelector('.holiday-character.santa');
    const spidey = parade.querySelector('.holiday-character.spidey');
    const sections = Array.from(document.querySelectorAll('.example-section'));
    if (!sections.length) return;

    const restartAnimation = (el, className) => {
        if (!el) return;
        el.classList.remove('is-active', 'santa-fly', 'spidey-crawl');
        void el.offsetWidth;
        el.classList.add('is-active', className);
    };

    const cleanup = (event) => {
        event.currentTarget.classList.remove('is-active', 'santa-fly', 'spidey-crawl');
    };

    [santa, spidey].forEach(el => {
        if (el) {
            el.addEventListener('animationend', cleanup);
        }
    });

    let lastTriggerAt = 0;
    const triggerParade = () => {
        if (document.body.dataset.theme !== 'holiday') return;
        const now = Date.now();
        if (now - lastTriggerAt < 900) return;
        lastTriggerAt = now;
        restartAnimation(santa, 'santa-fly');
        setTimeout(() => restartAnimation(spidey, 'spidey-crawl'), 320);
    };

    const observerCallback = (entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.45) return;
            if (document.body.dataset.theme !== 'holiday') return;
            const section = entry.target;
            if (section.dataset.holidayComplete === 'true') return;
            section.dataset.holidayComplete = 'true';
            triggerParade();
        });
    };

    let observer;
    const observeSections = () => {
        if (observer) observer.disconnect();
        observer = new IntersectionObserver(observerCallback, { threshold: [0.45] });
        sections.forEach(section => observer.observe(section));
    };

    observeSections();

    document.addEventListener('mlmath:theme-change', (event) => {
        if (event.detail && event.detail.theme === 'holiday') {
            observeSections();
        }
    });
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
    setupMatrixControls();
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
