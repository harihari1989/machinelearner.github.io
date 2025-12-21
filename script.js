// ============================================
// Vector Visualization
// ============================================
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
    ctx.font = 'bold 16px Arial';
    ctx.fillText(label, x + dx + 10, y + dy - 10);
}

function initVectorCanvas() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    
    // Draw vectors
    const scale = 30;
    drawVector(ctx, centerX, centerY, 2*scale, -3*scale, '#667eea', 'A[2,3]');
    drawVector(ctx, centerX, centerY, 1*scale, -4*scale, '#764ba2', 'B[1,4]');
}

function animateVectorAddition() {
    const canvas = document.getElementById('vectorCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 30;
    
    let step = 0;
    const animate = () => {
        if (step > 100) return;
        
        initVectorCanvas();
        
        const progress = step / 100;
        const vecAx = 2 * scale;
        const vecAy = -3 * scale;
        const vecBx = 1 * scale;
        const vecBy = -4 * scale;
        
        // Draw vector A
        drawVector(ctx, centerX, centerY, vecAx, vecAy, '#667eea', 'A[2,3]');
        
        // Draw vector B (moving to end of A)
        if (progress > 0.3) {
            const moveProgress = Math.min((progress - 0.3) / 0.3, 1);
            const startX = centerX + vecAx * moveProgress;
            const startY = centerY + vecAy * moveProgress;
            drawVector(ctx, startX, startY, vecBx, vecBy, '#764ba2', 'B[1,4]');
        }
        
        // Draw result vector
        if (progress > 0.6) {
            const resultProgress = Math.min((progress - 0.6) / 0.4, 1);
            drawVector(ctx, centerX, centerY, 
                (vecAx + vecBx) * resultProgress, 
                (vecAy + vecBy) * resultProgress, 
                '#10b981', 'A+B[3,7]');
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333';
    
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
    
    let step = 0;
    const animate = () => {
        if (step > 100) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#333';
        
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
            ctx.fillStyle = '#667eea';
            ctx.fillRect(18, 55, 120, 25);
            ctx.fillStyle = 'white';
            ctx.fillText('[0.5  0.3]', 20, 70);
            
            ctx.fillStyle = '#333';
            ctx.fillText('0.5×2 + 0.3×3 = 1.9', 20, 150);
        }
        
        // Show first result
        if (progress >= 0.5) {
            ctx.fillStyle = '#10b981';
            ctx.fillText('[1.9]', 280, 70);
        }
        
        // Highlight second row calculation
        if (progress >= 0.5) {
            ctx.fillStyle = '#764ba2';
            ctx.fillRect(18, 85, 120, 25);
            ctx.fillStyle = 'white';
            ctx.fillText('[0.2  0.8]', 20, 100);
            
            ctx.fillStyle = '#333';
            ctx.fillText('0.2×2 + 0.8×3 = 2.8', 20, 180);
        }
        
        // Show second result
        if (progress >= 0.9) {
            ctx.fillStyle = '#10b981';
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw cost function curve (parabola)
    ctx.strokeStyle = '#667eea';
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
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText('Parameter θ', canvas.width / 2 - 40, canvas.height - 5);
    ctx.save();
    ctx.translate(10, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Cost J(θ)', -30, 0);
    ctx.restore();
    
    // Draw path
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#10b981';
    
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
        
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
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
    
    const step = () => {
        if (steps >= maxSteps || Math.abs(gradientState.x - 5) < 0.01) {
            return;
        }
        
        // Compute gradient: derivative of (x-5)^2 is 2(x-5)
        const gradient = 2 * (gradientState.x - 5);
        
        // Update parameter
        gradientState.x = gradientState.x - learningRate * gradient;
        gradientState.path.push(gradientState.x);
        
        drawGradientCanvas();
        
        steps++;
        setTimeout(step, 300);
    };
    
    step();
}

function resetGradientDescent() {
    gradientState = { x: 8, path: [] };
    drawGradientCanvas();
}

// ============================================
// Activation Functions Visualization
// ============================================
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const scale = 40;
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = -5; i <= 5; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(centerX + i * scale, 0);
        ctx.lineTo(centerX + i * scale, canvas.height);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, centerY + i * scale);
        ctx.lineTo(canvas.width, centerY + i * scale);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
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
        ctx.strokeStyle = '#667eea';
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
        ctx.fillStyle = '#667eea';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('Sigmoid', 10, 30);
    }
    
    if (showReLU) {
        ctx.strokeStyle = '#10b981';
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
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('ReLU', 10, 50);
    }
    
    if (showTanh) {
        ctx.strokeStyle = '#f59e0b';
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
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 14px Arial';
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const layers = [2, 3, 2]; // 2 inputs, 3 hidden, 2 outputs
    const neuronRadius = 20;
    const layerSpacing = 150;
    const neuronSpacing = 80;
    
    // Draw connections first
    ctx.strokeStyle = '#ccc';
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
            if (activations && activations[l]) {
                const activation = activations[l][i];
                const intensity = Math.min(255, Math.floor(activation * 255));
                ctx.fillStyle = `rgb(102, 126, ${intensity})`;
            } else {
                ctx.fillStyle = l === 0 ? '#667eea' : l === layers.length - 1 ? '#10b981' : '#764ba2';
            }
            
            ctx.beginPath();
            ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Display activation value
            if (activations && activations[l]) {
                ctx.fillStyle = 'white';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(activations[l][i].toFixed(2), x, y + 4);
            }
        }
        
        // Layer labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
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
                    ctx.strokeStyle = '#667eea'; // Forward pass - blue
                } else if (phase === 2 && l >= 1) {
                    ctx.strokeStyle = '#ef4444'; // Backward pass - red
                } else {
                    ctx.strokeStyle = '#ccc';
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
                ctx.fillStyle = '#667eea';
            } else if (phase === 2) {
                ctx.fillStyle = '#ef4444';
            } else {
                ctx.fillStyle = l === 0 ? '#667eea' : l === layers.length - 1 ? '#10b981' : '#764ba2';
            }
            
            ctx.beginPath();
            ctx.arc(x, y, neuronRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Layer labels
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        const label = l === 0 ? 'Input' : l === layers.length - 1 ? 'Output' : 'Hidden';
        ctx.fillText(label, x, 320);
    }
    
    // Phase label
    ctx.fillStyle = '#333';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    if (phase === 0) {
        ctx.fillText('Ready', 200, 50);
    } else if (phase === 1) {
        ctx.fillStyle = '#667eea';
        ctx.fillText('Forward Pass ➡', 200, 50);
    } else if (phase === 2) {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⬅ Backward Pass (Computing Gradients)', 200, 50);
    } else if (phase === 3) {
        ctx.fillStyle = '#10b981';
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
// Initialize all canvases on page load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initVectorCanvas();
    initMatrixCanvas();
    drawGradientCanvas();
    drawActivationFunctions();
    drawNeuralNetwork();
    drawBackpropNetwork(0);
    
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
