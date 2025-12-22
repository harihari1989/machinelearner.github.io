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
        axis: read('--axis', '#94a3b8')
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
    scale: 1
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

function initVectorCanvas() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const unit = 30;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (batched for performance)
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
    
    // Draw axes
    ctx.strokeStyle = theme.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Draw vectors
    const ax = vectorState.ax * vectorState.scale;
    const ay = vectorState.ay * vectorState.scale;
    const bx = vectorState.bx * vectorState.scale;
    const by = vectorState.by * vectorState.scale;

    drawVector(ctx, centerX, centerY, ax * unit, -ay * unit, theme.primary, `A[${ax.toFixed(1)},${ay.toFixed(1)}]`);
    drawVector(ctx, centerX, centerY, bx * unit, -by * unit, theme.secondary, `B[${bx.toFixed(1)},${by.toFixed(1)}]`);
}

function animateVectorAddition() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const theme = getThemeColors();
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const unit = 30;
    
    let step = 0;
    const animate = () => {
        if (step > 100) return;
        
        initVectorCanvas();
        
        const progress = step / 100;
        const vecAx = vectorState.ax * vectorState.scale * unit;
        const vecAy = -vectorState.ay * vectorState.scale * unit;
        const vecBx = vectorState.bx * vectorState.scale * unit;
        const vecBy = -vectorState.by * vectorState.scale * unit;
        
        // Draw vector A
        drawVector(ctx, centerX, centerY, vecAx, vecAy, theme.primary, 'A');
        
        // Draw vector B (moving to end of A)
        if (progress > 0.3) {
            const moveProgress = Math.min((progress - 0.3) / 0.3, 1);
            const startX = centerX + vecAx * moveProgress;
            const startY = centerY + vecAy * moveProgress;
            drawVector(ctx, startX, startY, vecBx, vecBy, theme.secondary, 'B');
        }
        
        // Draw result vector
        if (progress > 0.6) {
            const resultProgress = Math.min((progress - 0.6) / 0.4, 1);
            drawVector(ctx, centerX, centerY, 
                (vecAx + vecBx) * resultProgress, 
                (vecAy + vecBy) * resultProgress,
                theme.success, 'A+B');
        }
        
        step += 2;
        requestAnimationFrame(animate);
    };
    
    animate();
}

// ============================================
// Matrix Multiplication Visualization
// ============================================
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
    initVectorCanvas();
    initMatrixCanvas();
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

        initVectorCanvas();
    };

    Object.values(inputs).forEach(input => {
        if (input) {
            input.addEventListener('input', update);
        }
    });

    update();
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
    };

    const savedTheme = localStorage.getItem('mlmath-theme');
    const initialTheme = savedTheme || document.body.dataset.theme || 'light';
    applyTheme(initialTheme, false);

    buttons.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
}

// ============================================
// Initialize all canvases on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    setupThemeSwitcher();
    initFundamentals();
    setupVectorControls();
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
