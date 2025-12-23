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
        note: 'Multiplication mixes rows and columns to transform vectors.'
    },
    add: {
        formula: 'C = A + B',
        note: 'Addition combines matching entries in each matrix.'
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

function drawMatrixBox(ctx, x, y, matrix, label, theme) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const cellSize = 32;
    const padding = 12;
    const width = cols * cellSize + padding * 2;
    const height = rows * cellSize + padding * 2;

    drawRoundedRect(ctx, x, y, width, height, 12);
    ctx.fillStyle = theme.panel;
    ctx.strokeStyle = theme.panelBorder;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

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
            ctx.fillText(value, cx, cy);
        });
    });

    ctx.fillStyle = theme.inkSoft;
    ctx.font = 'bold 12px Nunito, Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(label, x, y - 10);

    return { width, height };
}

function drawMatrixOperation(ctx, canvas, theme) {
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
}

function setMatrixOperation(operation) {
    matrixState.operation = operation;
    matrixState.progress = 1;
    updateMatrixUI();
    drawMatrixCanvas();
}

function animateMatrixOperation() {
    const canvas = document.getElementById('matrixCanvas');
    if (!canvas) return;
    let progress = 0;
    const animate = () => {
        progress += 0.04;
        matrixState.progress = Math.min(1, progress);
        drawMatrixCanvas();
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
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
    drawBackpropNetwork(0);
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
    drawBackpropNetwork(0);
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

function initMatrixCanvas() {
    drawMatrixCanvas();
}

// ============================================
// Initialize all canvases on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setupThemeSwitcher();
    initFundamentals();
    setupVectorControls();
    setupVectorScenes();
    setupVectorModes();
    setupMatrixControls();
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
    
    // Smooth scrolling for navigation
    document.querySelectorAll('nav a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
