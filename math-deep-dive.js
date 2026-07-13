(() => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    const sigmoid = value => 1 / (1 + Math.exp(-clamp(value, -30, 30)));
    const palette = {
        bg: '#f8fbff', grid: 'rgba(71,85,105,.11)', axis: 'rgba(51,65,85,.36)',
        text: '#1f2937', muted: '#64748b', cyan: '#0284c7', blue: '#2563eb', violet: '#7c3aed',
        coral: '#e11d48', gold: '#c27a00', mint: '#059669', white: '#ffffff'
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clearCanvas(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = palette.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function roundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
    }

    function drawArrow(ctx, x1, y1, x2, y2, color, width = 2, head = 8) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }

    function canvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height
        };
    }

    function setMath(element, markup) {
        if (!element) return;
        element.innerHTML = markup;
        if (window.MathJax?.typesetPromise) {
            window.MathJax.typesetPromise([element]).catch(() => {});
        }
    }

    function setActiveButtons(buttons, active, dataKey) {
        buttons.forEach(button => {
            const selected = button.dataset[dataKey] === active;
            button.classList.toggle('is-active', selected);
            if (button.hasAttribute('role')) button.setAttribute('aria-selected', selected ? 'true' : 'false');
        });
    }

    function setupAtlas() {
        const nodes = $$('[data-math-target]');
        const tourButton = $('#mathTourToggle');
        if (!nodes.length) return;

        nodes.forEach(node => node.addEventListener('click', () => {
            document.getElementById(node.dataset.mathTarget)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
        }));

        let timer = null;
        let index = 0;
        const stop = () => {
            window.clearInterval(timer);
            timer = null;
            nodes.forEach(node => node.classList.remove('is-touring'));
            if (tourButton) {
                tourButton.textContent = 'Play guided tour';
                tourButton.setAttribute('aria-pressed', 'false');
            }
        };
        const tick = () => {
            nodes.forEach((node, nodeIndex) => node.classList.toggle('is-touring', nodeIndex === index));
            index = (index + 1) % nodes.length;
        };

        tourButton?.addEventListener('click', () => {
            if (timer) {
                stop();
                return;
            }
            tourButton.textContent = 'Pause guided tour';
            tourButton.setAttribute('aria-pressed', 'true');
            tick();
            timer = window.setInterval(tick, reducedMotion ? 1800 : 1300);
        });
    }

    // ---------------------------------------------------------------------
    // Calculus lab
    // ---------------------------------------------------------------------
    function setupCalculusLab() {
        const canvas = $('#calculusDeepCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const modeButtons = $$('[data-calc-mode]');
        const functionSelect = $('#calcFunction');
        const xInput = $('#calcX');
        const dxInput = $('#calcDx');
        const animateButton = $('#calcAnimate');
        const resolutionLabel = $('#calcResolutionLabel');
        const insightTitle = $('#calcInsightTitle');
        const insightText = $('#calcInsightText');
        const equation = $('#calcEquation');
        const bridge = $('#calcBridge');
        const stageLabel = $('#calcStageLabel');
        const metricLabels = [$('#calcMetricALabel'), $('#calcMetricBLabel'), $('#calcMetricCLabel')];
        const metricValues = [$('#calcMetricA'), $('#calcMetricB'), $('#calcMetricC')];

        const functions = {
            quadratic: { name: 'x²', f: x => x * x, df: x => 2 * x, integral: (a, b) => (b ** 3 - a ** 3) / 3 },
            sine: { name: 'sin(x)', f: Math.sin, df: Math.cos, integral: (a, b) => -Math.cos(b) + Math.cos(a) },
            sigmoid: { name: 'σ(x)', f: sigmoid, df: x => sigmoid(x) * (1 - sigmoid(x)), integral: (a, b) => Math.log1p(Math.exp(b)) - Math.log1p(Math.exp(a)) },
            exponential: { name: 'eˣ', f: x => Math.exp(x), df: x => Math.exp(x), integral: (a, b) => Math.exp(b) - Math.exp(a) }
        };
        const state = { mode: 'derivative', functionName: 'quadratic', x: 1, dx: 1, animation: null };

        const plot = { left: 66, right: 866, top: 32, bottom: 490, xMin: -3.2, xMax: 3.2, yMin: -3.2, yMax: 6.4 };
        const toScreen = (x, y) => ({
            x: plot.left + (x - plot.xMin) / (plot.xMax - plot.xMin) * (plot.right - plot.left),
            y: plot.bottom - (y - plot.yMin) / (plot.yMax - plot.yMin) * (plot.bottom - plot.top)
        });

        function drawAxes() {
            ctx.strokeStyle = palette.grid;
            ctx.lineWidth = 1;
            for (let x = Math.ceil(plot.xMin); x <= plot.xMax; x += 1) {
                const px = toScreen(x, 0).x;
                ctx.beginPath(); ctx.moveTo(px, plot.top); ctx.lineTo(px, plot.bottom); ctx.stroke();
            }
            for (let y = Math.ceil(plot.yMin); y <= plot.yMax; y += 1) {
                const py = toScreen(0, y).y;
                ctx.beginPath(); ctx.moveTo(plot.left, py); ctx.lineTo(plot.right, py); ctx.stroke();
            }
            const origin = toScreen(0, 0);
            ctx.strokeStyle = palette.axis;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(plot.left, origin.y); ctx.lineTo(plot.right, origin.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(origin.x, plot.top); ctx.lineTo(origin.x, plot.bottom); ctx.stroke();
            ctx.fillStyle = palette.muted;
            ctx.font = '12px ui-monospace, monospace';
            ctx.fillText('x', plot.right - 8, origin.y - 10);
            ctx.fillText('f(x)', origin.x + 10, plot.top + 12);
        }

        function drawFunction(fn, color = palette.cyan, lineWidth = 3, dash = []) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.setLineDash(dash);
            ctx.beginPath();
            let started = false;
            for (let pixel = plot.left; pixel <= plot.right; pixel += 2) {
                const x = plot.xMin + (pixel - plot.left) / (plot.right - plot.left) * (plot.xMax - plot.xMin);
                const y = fn(x);
                if (!Number.isFinite(y) || y < plot.yMin - 4 || y > plot.yMax + 4) {
                    started = false;
                    continue;
                }
                const point = toScreen(x, y);
                if (!started) { ctx.moveTo(point.x, point.y); started = true; } else ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
            ctx.restore();
        }

        function drawPoint(x, y, color, radius = 6) {
            const point = toScreen(x, y);
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 14;
            ctx.beginPath(); ctx.arc(point.x, point.y, radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        function setMetrics(labels, values) {
            labels.forEach((label, index) => { metricLabels[index].textContent = label; metricValues[index].textContent = values[index]; });
        }

        function taylorValue(name, x, order) {
            if (name === 'quadratic') return order < 2 ? 0 : x * x;
            if (name === 'sine') {
                let sum = 0;
                for (let n = 0; 2 * n + 1 <= order; n += 1) sum += (n % 2 ? -1 : 1) * x ** (2 * n + 1) / factorial(2 * n + 1);
                return sum;
            }
            if (name === 'exponential') {
                let sum = 0;
                for (let n = 0; n <= order; n += 1) sum += x ** n / factorial(n);
                return sum;
            }
            const coefficients = [0.5, 0.25, 0, -1 / 48, 0, 1 / 480, 0, -17 / 80640];
            return coefficients.slice(0, order + 1).reduce((sum, coefficient, n) => sum + coefficient * x ** n, 0);
        }
        function factorial(n) { let result = 1; for (let i = 2; i <= n; i += 1) result *= i; return result; }

        function drawDerivative(definition) {
            const x = state.x;
            const dx = state.dx;
            const y = definition.f(x);
            const y2 = definition.f(x + dx);
            const secant = (y2 - y) / dx;
            const derivative = definition.df(x);
            drawFunction(definition.f);
            const a = toScreen(x - 2.5, y - secant * 2.5);
            const b = toScreen(x + 2.5, y + secant * 2.5);
            ctx.strokeStyle = palette.gold; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            const ta = toScreen(x - 1.8, y - derivative * 1.8);
            const tb = toScreen(x + 1.8, y + derivative * 1.8);
            ctx.strokeStyle = palette.coral; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(ta.x, ta.y); ctx.lineTo(tb.x, tb.y); ctx.stroke(); ctx.setLineDash([]);
            drawPoint(x, y, palette.coral);
            drawPoint(x + dx, y2, palette.gold, 5);
            const p1 = toScreen(x, y); const p2 = toScreen(x + dx, y2);
            ctx.strokeStyle = 'rgba(255,209,102,.55)'; ctx.setLineDash([4, 5]);
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.setLineDash([]);
            setMetrics(['Secant slope', 'True derivative', 'Approximation error'], [secant.toFixed(4), derivative.toFixed(4), Math.abs(secant - derivative).toExponential(2)]);
        }

        function drawIntegral(definition) {
            const a = -2;
            const b = Math.max(a + .05, state.x);
            const rectangles = Math.round(4 + (1.5 - state.dx) / 1.48 * 76);
            const width = (b - a) / rectangles;
            let sum = 0;
            for (let i = 0; i < rectangles; i += 1) {
                const sample = a + (i + .5) * width;
                const value = definition.f(sample);
                sum += value * width;
                const left = toScreen(a + i * width, 0);
                const top = toScreen(a + (i + 1) * width, value);
                const zero = toScreen(0, 0).y;
                ctx.fillStyle = value >= 0 ? 'rgba(88,230,176,.22)' : 'rgba(255,122,144,.22)';
                ctx.strokeStyle = value >= 0 ? 'rgba(88,230,176,.58)' : 'rgba(255,122,144,.58)';
                ctx.fillRect(left.x, Math.min(top.y, zero), Math.max(1, top.x - left.x), Math.abs(zero - top.y));
                ctx.strokeRect(left.x, Math.min(top.y, zero), Math.max(1, top.x - left.x), Math.abs(zero - top.y));
            }
            drawFunction(definition.f);
            const exact = definition.integral(a, b);
            drawPoint(b, definition.f(b), palette.gold, 5);
            setMetrics(['Riemann sum', 'Exact signed area', 'Absolute error'], [sum.toFixed(4), exact.toFixed(4), Math.abs(sum - exact).toExponential(2)]);
        }

        function drawChain(definition) {
            const inner = definition.f(state.x);
            const innerSlope = definition.df(state.x);
            const outer = sigmoid(2 * inner);
            const outerSlope = 2 * outer * (1 - outer);
            const product = innerSlope * outerSlope;
            const composite = x => sigmoid(2 * definition.f(x));
            drawFunction(definition.f, 'rgba(97,218,251,.34)', 2, [6, 6]);
            drawFunction(composite, palette.violet, 3);
            drawPoint(state.x, composite(state.x), palette.violet);
            const point = toScreen(state.x, composite(state.x));
            const left = toScreen(state.x - 1.8, composite(state.x) - product * 1.8);
            const right = toScreen(state.x + 1.8, composite(state.x) + product * 1.8);
            ctx.strokeStyle = palette.coral; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
            ctx.fillStyle = palette.text; ctx.font = '700 13px Nunito, sans-serif';
            ctx.fillText(`x = ${state.x.toFixed(2)}  →  u = ${inner.toFixed(2)}  →  y = ${outer.toFixed(2)}`, clamp(point.x - 150, plot.left, plot.right - 300), plot.top + 22);
            setMetrics(['Inner sensitivity du/dx', 'Outer sensitivity dy/du', 'Product dy/dx'], [innerSlope.toFixed(4), outerSlope.toFixed(4), product.toFixed(4)]);
        }

        function drawTaylor(definition) {
            const order = clamp(Math.round(1 + (1.5 - state.dx) / 1.48 * 6), 1, 7);
            const approximate = x => taylorValue(state.functionName, x, order);
            drawFunction(definition.f, palette.cyan, 3);
            drawFunction(approximate, palette.gold, 2.5, [8, 6]);
            drawPoint(state.x, definition.f(state.x), palette.cyan, 5);
            drawPoint(state.x, approximate(state.x), palette.gold, 4);
            ctx.fillStyle = palette.text; ctx.font = '700 13px Nunito, sans-serif';
            ctx.fillText('true function', plot.left + 16, plot.top + 22);
            ctx.fillStyle = palette.gold; ctx.fillText(`Taylor polynomial, order ${order}`, plot.left + 16, plot.top + 44);
            const error = Math.abs(definition.f(state.x) - approximate(state.x));
            setMetrics(['Polynomial order', 'Matched derivatives', 'Error at selected x'], [String(order), `0 through ${order}`, error.toExponential(2)]);
        }

        function draw() {
            const definition = functions[state.functionName];
            clearCanvas(ctx, canvas);
            drawAxes();
            if (state.mode === 'derivative') drawDerivative(definition);
            if (state.mode === 'integral') drawIntegral(definition);
            if (state.mode === 'chain') drawChain(definition);
            if (state.mode === 'taylor') drawTaylor(definition);
        }

        const copy = {
            derivative: {
                stage: 'Secant → tangent', title: 'A derivative is local sensitivity',
                text: 'The secant slope compares two finite points. As Δx shrinks, it converges to the tangent slope: the best local linear prediction.',
                equation: '\\(\\displaystyle f\'(x)=\\lim_{\\Delta x\\to0}\\frac{f(x+\\Delta x)-f(x)}{\\Delta x}\\)',
                bridge: 'A gradient is a list of these sensitivities—one derivative for every parameter.', control: 'Δx', action: 'Animate Δx → 0'
            },
            integral: {
                stage: 'Sums → signed area', title: 'An integral accumulates tiny contributions',
                text: 'Rectangles turn a continuous area into a finite sum. Thinner rectangles reduce approximation error and reveal the limiting integral.',
                equation: '\\(\\displaystyle \\int_a^b f(x)\\,dx=\\lim_{n\\to\\infty}\\sum_{i=1}^{n}f(x_i^*)\\Delta x\\)',
                bridge: 'Expected loss is an integral (or sample average) over data. Training estimates it with mini-batches.', control: 'Resolution', action: 'Refine rectangles'
            },
            chain: {
                stage: 'Compose local sensitivities', title: 'The chain rule routes influence',
                text: 'A change in x first changes the inner function u, then u changes the output. Multiplying the local rates gives the total rate.',
                equation: '\\(\\displaystyle \\frac{dy}{dx}=\\frac{dy}{du}\\frac{du}{dx}\\)',
                bridge: 'Backpropagation is the chain rule organized to reuse intermediate sensitivities across a computation graph.', control: 'Probe scale', action: 'Pulse dependency path'
            },
            taylor: {
                stage: 'Local derivatives → nearby shape', title: 'Derivatives build a local model',
                text: 'A Taylor polynomial matches more derivatives at the expansion point as its order grows, turning local measurements into a neighborhood approximation.',
                equation: '\\(\\displaystyle f(x)\\approx\\sum_{n=0}^{N}\\frac{f^{(n)}(0)}{n!}x^n\\)',
                bridge: 'Linearization explains gradient methods; second-order Taylor terms lead to curvature, Hessians, and Newton-like optimization.', control: 'Order', action: 'Increase polynomial order'
            }
        };

        function applyMode(mode) {
            state.mode = mode;
            setActiveButtons(modeButtons, mode, 'calcMode');
            const content = copy[mode];
            stageLabel.textContent = content.stage;
            insightTitle.textContent = content.title;
            insightText.textContent = content.text;
            bridge.textContent = content.bridge;
            resolutionLabel.childNodes[0].textContent = `${content.control} `;
            animateButton.textContent = content.action;
            setMath(equation, content.equation);
            draw();
        }

        modeButtons.forEach(button => button.addEventListener('click', () => applyMode(button.dataset.calcMode)));
        functionSelect.addEventListener('change', () => { state.functionName = functionSelect.value; draw(); });
        xInput.addEventListener('input', () => { state.x = Number(xInput.value); draw(); });
        dxInput.addEventListener('input', () => { state.dx = Number(dxInput.value); draw(); });
        animateButton.addEventListener('click', () => {
            const start = performance.now();
            const initial = state.dx;
            const duration = reducedMotion ? 10 : 1400;
            const animate = now => {
                const progress = clamp((now - start) / duration, 0, 1);
                state.dx = lerp(initial, .02, ease(progress));
                dxInput.value = String(state.dx);
                draw();
                if (progress < 1) state.animation = requestAnimationFrame(animate);
            };
            cancelAnimationFrame(state.animation);
            state.animation = requestAnimationFrame(animate);
        });
        draw();
    }

    // ---------------------------------------------------------------------
    // Linear algebra lab
    // ---------------------------------------------------------------------
    function setupLinearLab() {
        const canvas = $('#linearDeepCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const presetButtons = $$('[data-matrix-preset]');
        const inputs = [$('#matrixA'), $('#matrixB'), $('#matrixC'), $('#matrixD')];
        const replay = $('#matrixReplay');
        const metrics = { det: $('#matrixDet'), orientation: $('#matrixOrientation'), rank: $('#matrixRank') };
        const presets = {
            identity: [1, 0, 0, 1], rotate: [0, -1, 1, 0], shear: [1, 1, 0, 1],
            squash: [1, .7, .02, .08], eigen: [1.5, .5, .5, 1]
        };
        const state = { current: presets.identity.slice(), from: presets.identity.slice(), target: presets.identity.slice(), start: 0, duration: 900, preset: 'identity', frame: null };
        const center = { x: 450, y: 270 }; const scale = 66;
        const transform = (x, y, matrix) => ({ x: matrix[0] * x + matrix[1] * y, y: matrix[2] * x + matrix[3] * y });
        const screen = point => ({ x: center.x + point.x * scale, y: center.y - point.y * scale });

        function drawLine(p1, p2, color, width = 1) {
            const a = screen(p1); const b = screen(p2);
            ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }

        function draw(matrix) {
            clearCanvas(ctx, canvas);
            ctx.save();
            ctx.beginPath(); ctx.rect(0, 0, canvas.width, canvas.height); ctx.clip();
            for (let x = -7; x <= 7; x += .5) {
                const major = Math.abs(x - Math.round(x)) < .01;
                drawLine(transform(x, -6, matrix), transform(x, 6, matrix), major ? 'rgba(158,178,201,.16)' : 'rgba(158,178,201,.065)', major ? 1.1 : .7);
            }
            for (let y = -6; y <= 6; y += .5) {
                const major = Math.abs(y - Math.round(y)) < .01;
                drawLine(transform(-7, y, matrix), transform(7, y, matrix), major ? 'rgba(158,178,201,.16)' : 'rgba(158,178,201,.065)', major ? 1.1 : .7);
            }
            const i = transform(1, 0, matrix); const j = transform(0, 1, matrix); const vector = transform(1.5, 1, matrix);
            const origin = screen({ x: 0, y: 0 }); const pi = screen(i); const pj = screen(j); const pv = screen(vector);
            const corner = screen({ x: i.x + j.x, y: i.y + j.y });
            ctx.fillStyle = 'rgba(97,218,251,.09)'; ctx.strokeStyle = 'rgba(97,218,251,.35)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(pi.x, pi.y); ctx.lineTo(corner.x, corner.y); ctx.lineTo(pj.x, pj.y); ctx.closePath(); ctx.fill(); ctx.stroke();
            drawArrow(ctx, origin.x, origin.y, pi.x, pi.y, palette.cyan, 4, 12);
            drawArrow(ctx, origin.x, origin.y, pj.x, pj.y, palette.coral, 4, 12);
            drawArrow(ctx, origin.x, origin.y, pv.x, pv.y, palette.gold, 4, 12);
            ctx.fillStyle = palette.cyan; ctx.font = '800 14px Nunito, sans-serif'; ctx.fillText('Aî', pi.x + 10, pi.y - 8);
            ctx.fillStyle = palette.coral; ctx.fillText('Aĵ', pj.x + 10, pj.y - 8);
            ctx.fillStyle = palette.gold; ctx.fillText('Ax', pv.x + 10, pv.y - 8);
            if (state.preset === 'eigen') {
                ctx.setLineDash([10, 8]);
                drawLine({ x: -6, y: -3.708 }, { x: 6, y: 3.708 }, 'rgba(167,139,250,.7)', 2);
                drawLine({ x: -4, y: 6.472 }, { x: 4, y: -6.472 }, 'rgba(88,230,176,.55)', 2);
                ctx.setLineDash([]);
                ctx.fillStyle = palette.violet; ctx.fillText('eigen-direction', 650, 82);
            }
            ctx.restore();

            const det = matrix[0] * matrix[3] - matrix[1] * matrix[2];
            metrics.det.textContent = det.toFixed(3);
            metrics.orientation.textContent = Math.abs(det) < .025 ? 'collapsed' : det < 0 ? 'flipped' : 'preserved';
            metrics.rank.textContent = Math.abs(det) < .025 ? 'line / point' : Math.abs(det) < .12 ? 'almost collapsed' : 'full plane';
        }

        function animateTo(target, fromIdentity = false) {
            cancelAnimationFrame(state.frame);
            state.from = (fromIdentity ? presets.identity : state.current).slice();
            state.target = target.slice();
            state.start = performance.now();
            const step = now => {
                const progress = reducedMotion ? 1 : clamp((now - state.start) / state.duration, 0, 1);
                const amount = ease(progress);
                state.current = state.from.map((value, index) => lerp(value, state.target[index], amount));
                draw(state.current);
                if (progress < 1) state.frame = requestAnimationFrame(step);
            };
            state.frame = requestAnimationFrame(step);
        }

        function updateInputs(matrix) { inputs.forEach((input, index) => { input.value = matrix[index].toFixed(2).replace(/\.00$/, ''); }); }
        presetButtons.forEach(button => button.addEventListener('click', () => {
            state.preset = button.dataset.matrixPreset;
            setActiveButtons(presetButtons, state.preset, 'matrixPreset');
            updateInputs(presets[state.preset]);
            animateTo(presets[state.preset]);
        }));
        inputs.forEach(input => input.addEventListener('input', () => {
            const target = inputs.map(item => Number(item.value) || 0);
            state.preset = 'custom';
            presetButtons.forEach(button => button.classList.remove('is-active'));
            animateTo(target);
        }));
        replay.addEventListener('click', () => animateTo(state.target, true));
        draw(state.current);
    }

    // ---------------------------------------------------------------------
    // Differential equations lab
    // ---------------------------------------------------------------------
    function setupOdeLab() {
        const canvas = $('#odeDeepCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const systemButtons = $$('[data-ode-system]');
        const solverSelect = $('#odeSolver');
        const dtInput = $('#odeDt');
        const pauseButton = $('#odePause');
        const resetButton = $('#odeReset');
        const title = $('#odeTitle'); const description = $('#odeDescription'); const equation = $('#odeEquation');
        const timeMetric = $('#odeTime'); const particleMetric = $('#odeParticles'); const behaviorMetric = $('#odeBehavior');
        const systems = {
            sink: { fn: (x, y) => [-x, -y], title: 'Stable systems forget perturbations', description: 'Every arrow points toward the fixed point. Nearby trajectories contract, so small errors fade over time.', equation: '\\(\\dot{x}=-x,\\quad \\dot{y}=-y\\)', behavior: 'contracting' },
            saddle: { fn: (x, y) => [x, -y], title: 'A saddle mixes stability and instability', description: 'The y direction contracts while the x direction expands. One small component along the unstable direction eventually dominates.', equation: '\\(\\dot{x}=x,\\quad \\dot{y}=-y\\)', behavior: 'mixed stability' },
            oscillator: { fn: (x, y) => [y, -x - .15 * y], title: 'State can trade between position and velocity', description: 'The system rotates through phase space while damping slowly removes energy, producing an inward spiral.', equation: '\\(\\dot{x}=y,\\quad \\dot{y}=-x-0.15y\\)', behavior: 'damped rotation' },
            nonlinear: { fn: (x, y) => [y, (1 - x * x) * y - x], title: 'Nonlinearity can create a limit cycle', description: 'Small oscillations are amplified while large ones are damped, attracting many initial states toward one repeating orbit.', equation: '\\(\\dot{x}=y,\\quad \\dot{y}=(1-x^2)y-x\\)', behavior: 'limit cycle' }
        };
        const state = { system: 'sink', solver: 'rk4', dt: .025, paused: false, time: 0, particles: [], dragging: false, lastFrame: performance.now(), frame: null };
        const bounds = { xMin: -4.5, xMax: 4.5, yMin: -2.7, yMax: 2.7 };
        const toScreen = (x, y) => ({ x: (x - bounds.xMin) / (bounds.xMax - bounds.xMin) * canvas.width, y: canvas.height - (y - bounds.yMin) / (bounds.yMax - bounds.yMin) * canvas.height });
        const fromScreen = (x, y) => ({ x: bounds.xMin + x / canvas.width * (bounds.xMax - bounds.xMin), y: bounds.yMin + (canvas.height - y) / canvas.height * (bounds.yMax - bounds.yMin) });

        function seed(x, y) {
            state.particles.push({ x, y, trail: [{ x, y }], color: [palette.cyan, palette.gold, palette.coral, palette.violet, palette.mint][state.particles.length % 5] });
            if (state.particles.length > 28) state.particles.shift();
        }
        function resetSeeds() {
            state.particles = [];
            [[3, 1.5], [3, -1.3], [-3, 1.4], [-3, -1.2], [1.4, 2], [-1.5, -2]].forEach(point => seed(point[0], point[1]));
            state.time = 0;
        }

        function integrate(particle, h) {
            const fn = systems[state.system].fn;
            if (state.solver === 'euler') {
                const [dx, dy] = fn(particle.x, particle.y);
                return { x: particle.x + h * dx, y: particle.y + h * dy };
            }
            const k1 = fn(particle.x, particle.y);
            const k2 = fn(particle.x + h * k1[0] / 2, particle.y + h * k1[1] / 2);
            const k3 = fn(particle.x + h * k2[0] / 2, particle.y + h * k2[1] / 2);
            const k4 = fn(particle.x + h * k3[0], particle.y + h * k3[1]);
            return {
                x: particle.x + h * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6,
                y: particle.y + h * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6
            };
        }

        function drawField() {
            const fn = systems[state.system].fn;
            for (let x = -4; x <= 4; x += .5) {
                for (let y = -2.5; y <= 2.5; y += .5) {
                    const [dx, dy] = fn(x, y);
                    const magnitude = Math.hypot(dx, dy) || 1;
                    const length = 14 + 8 * Math.tanh(magnitude);
                    const point = toScreen(x, y);
                    const alpha = .18 + .28 * Math.min(magnitude / 4, 1);
                    drawArrow(ctx, point.x - dx / magnitude * length / 2, point.y + dy / magnitude * length / 2, point.x + dx / magnitude * length / 2, point.y - dy / magnitude * length / 2, `rgba(97,218,251,${alpha})`, 1, 4);
                }
            }
            const origin = toScreen(0, 0);
            ctx.strokeStyle = 'rgba(220,236,255,.25)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, origin.y); ctx.lineTo(canvas.width, origin.y); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(origin.x, 0); ctx.lineTo(origin.x, canvas.height); ctx.stroke();
        }

        function draw() {
            clearCanvas(ctx, canvas);
            drawField();
            state.particles.forEach(particle => {
                if (particle.trail.length > 1) {
                    ctx.strokeStyle = particle.color; ctx.lineWidth = 2; ctx.beginPath();
                    particle.trail.forEach((point, index) => {
                        const screenPoint = toScreen(point.x, point.y);
                        if (index === 0) ctx.moveTo(screenPoint.x, screenPoint.y); else ctx.lineTo(screenPoint.x, screenPoint.y);
                    });
                    ctx.stroke();
                }
                const point = toScreen(particle.x, particle.y);
                ctx.fillStyle = particle.color; ctx.shadowColor = particle.color; ctx.shadowBlur = 12;
                ctx.beginPath(); ctx.arc(point.x, point.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            });
            timeMetric.textContent = state.time.toFixed(2);
            particleMetric.textContent = String(state.particles.length);
        }

        function update() {
            state.particles.forEach(particle => {
                const next = integrate(particle, state.dt);
                particle.x = next.x; particle.y = next.y;
                if (Number.isFinite(next.x) && Number.isFinite(next.y)) {
                    particle.trail.push({ x: next.x, y: next.y });
                    if (particle.trail.length > 220) particle.trail.shift();
                }
            });
            state.particles = state.particles.filter(particle => Math.abs(particle.x) < 12 && Math.abs(particle.y) < 10);
            state.time += state.dt;
        }

        function loop(now) {
            const active = canvas.closest('.chapter')?.classList.contains('is-active');
            if (!state.paused && active && (!reducedMotion || state.time === 0)) {
                const steps = clamp(Math.round((now - state.lastFrame) / 16), 1, 3);
                for (let i = 0; i < steps; i += 1) update();
            }
            state.lastFrame = now;
            draw();
            state.frame = requestAnimationFrame(loop);
        }

        function applySystem(name) {
            state.system = name;
            setActiveButtons(systemButtons, name, 'odeSystem');
            const content = systems[name];
            title.textContent = content.title;
            description.textContent = content.description;
            behaviorMetric.textContent = content.behavior;
            setMath(equation, content.equation);
            resetSeeds();
            draw();
        }

        systemButtons.forEach(button => button.addEventListener('click', () => applySystem(button.dataset.odeSystem)));
        solverSelect.addEventListener('change', () => { state.solver = solverSelect.value; });
        dtInput.addEventListener('input', () => { state.dt = Number(dtInput.value); });
        pauseButton.addEventListener('click', () => {
            state.paused = !state.paused;
            pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
            pauseButton.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
        });
        resetButton.addEventListener('click', resetSeeds);
        const addFromEvent = event => { const point = canvasPoint(event, canvas); const math = fromScreen(point.x, point.y); seed(math.x, math.y); };
        canvas.addEventListener('pointerdown', event => { state.dragging = true; canvas.setPointerCapture(event.pointerId); addFromEvent(event); });
        canvas.addEventListener('pointermove', event => { if (state.dragging && Math.random() > .72) addFromEvent(event); });
        canvas.addEventListener('pointerup', () => { state.dragging = false; });
        resetSeeds();
        draw();
        state.frame = requestAnimationFrame(loop);
    }

    // ---------------------------------------------------------------------
    // Neural network lab
    // ---------------------------------------------------------------------
    function setupNetworkLab() {
        const canvas = $('#networkDeepCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const viewButtons = $$('[data-network-view]');
        const inputs = { x1: $('#networkX1'), x2: $('#networkX2'), target: $('#networkTarget'), lr: $('#networkLr') };
        const outputs = { x1: $('#networkX1Value'), x2: $('#networkX2Value'), target: $('#networkTargetValue'), lr: $('#networkLrValue') };
        const action = $('#networkAction'); const stageLabel = $('#networkStageLabel');
        const title = $('#networkTitle'); const description = $('#networkDescription'); const equation = $('#networkEquation'); const bridge = $('#networkBridge');
        const predictionMetric = $('#networkPrediction'); const lossMetric = $('#networkLoss'); const epochMetric = $('#networkEpoch');
        const state = {
            view: 'forward', epoch: 0, training: false, animationStart: 0, animationDirection: 1,
            weights: {
                w1: [[2.8, 2.4], [-2.2, -2.7], [1.6, -1.5]], b1: [-1.1, 3.6, .2],
                w2: [2.4, 2.2, -1.1], b2: -2.4
            }
        };
        const data = [[[0, 0], 0], [[0, 1], 1], [[1, 0], 1], [[1, 1], 0]];

        function forward(x) {
            const z1 = state.weights.w1.map((row, j) => row[0] * x[0] + row[1] * x[1] + state.weights.b1[j]);
            const h = z1.map(sigmoid);
            const z2 = state.weights.w2.reduce((sum, weight, index) => sum + weight * h[index], state.weights.b2);
            return { x, z1, h, z2, output: sigmoid(z2) };
        }
        function bce(output, target) {
            const safe = clamp(output, 1e-7, 1 - 1e-7);
            return -(target * Math.log(safe) + (1 - target) * Math.log(1 - safe));
        }
        function trainExample(x, target, learningRate) {
            const cache = forward(x);
            const delta2 = cache.output - target;
            const oldW2 = state.weights.w2.slice();
            const gradW2 = cache.h.map(value => delta2 * value);
            const gradB2 = delta2;
            const delta1 = cache.h.map((value, j) => oldW2[j] * delta2 * value * (1 - value));
            for (let j = 0; j < 3; j += 1) {
                state.weights.w2[j] -= learningRate * gradW2[j];
                state.weights.b1[j] -= learningRate * delta1[j];
                for (let i = 0; i < 2; i += 1) state.weights.w1[j][i] -= learningRate * delta1[j] * x[i];
            }
            state.weights.b2 -= learningRate * gradB2;
            return { cache, delta2, gradW2, delta1 };
        }
        function trainEpoch() {
            data.forEach(([x, target]) => trainExample(x, target, Number(inputs.lr.value)));
            state.epoch += 1;
        }
        function averageLoss() { return data.reduce((sum, [x, target]) => sum + bce(forward(x).output, target), 0) / data.length; }

        const positions = { input: [{ x: 115, y: 180 }, { x: 115, y: 360 }], hidden: [{ x: 440, y: 125 }, { x: 440, y: 270 }, { x: 440, y: 415 }], output: [{ x: 775, y: 270 }] };

        function weightColor(weight, alpha = .8) { return weight >= 0 ? `rgba(97,218,251,${alpha})` : `rgba(255,122,144,${alpha})`; }
        function drawConnection(from, to, weight, pulseProgress, reverse = false) {
            ctx.strokeStyle = weightColor(weight, .28 + Math.min(Math.abs(weight) / 5, .5));
            ctx.lineWidth = 1 + Math.min(Math.abs(weight), 4) * .75;
            ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
            if (pulseProgress !== null) {
                const t = reverse ? 1 - pulseProgress : pulseProgress;
                const x = lerp(from.x, to.x, t); const y = lerp(from.y, to.y, t);
                ctx.fillStyle = reverse ? palette.coral : palette.gold; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15;
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            }
        }
        function drawNeuron(position, value, label, color) {
            const radius = 31;
            ctx.fillStyle = `rgba(255,255,255,${.06 + value * .34})`;
            ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.shadowColor = color; ctx.shadowBlur = value * 18;
            ctx.beginPath(); ctx.arc(position.x, position.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
            ctx.fillStyle = palette.white; ctx.font = '800 14px Nunito, sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(value.toFixed(2), position.x, position.y + 5);
            ctx.fillStyle = palette.muted; ctx.font = '700 11px Nunito, sans-serif'; ctx.fillText(label, position.x, position.y - 43);
            ctx.textAlign = 'start';
        }

        function drawNetwork(now) {
            clearCanvas(ctx, canvas);
            const x = [Number(inputs.x1.value), Number(inputs.x2.value)]; const target = Number(inputs.target.value);
            const cache = forward(x);
            const elapsed = now - state.animationStart;
            const activeAnimation = elapsed < 1450;
            const pulse = activeAnimation ? (elapsed % 900) / 900 : null;
            const reverse = state.view === 'backprop';
            for (let i = 0; i < 2; i += 1) {
                for (let j = 0; j < 3; j += 1) drawConnection(positions.input[i], positions.hidden[j], state.weights.w1[j][i], activeAnimation && (reverse ? pulse > .45 : pulse < .55) ? clamp(reverse ? (pulse - .45) / .55 : pulse / .55, 0, 1) : null, reverse);
            }
            for (let j = 0; j < 3; j += 1) drawConnection(positions.hidden[j], positions.output[0], state.weights.w2[j], activeAnimation && (reverse ? pulse < .58 : pulse > .38) ? clamp(reverse ? pulse / .58 : (pulse - .38) / .62, 0, 1) : null, reverse);
            positions.input.forEach((position, index) => drawNeuron(position, x[index], `input x${index + 1}`, palette.cyan));
            positions.hidden.forEach((position, index) => drawNeuron(position, cache.h[index], `hidden h${index + 1}`, palette.violet));
            drawNeuron(positions.output[0], cache.output, 'prediction ŷ', palette.gold);
            ctx.fillStyle = target === 1 ? palette.mint : palette.coral;
            ctx.font = '800 15px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`target y = ${target}`, positions.output[0].x, 350); ctx.textAlign = 'start';
            ctx.fillStyle = palette.muted; ctx.font = '12px ui-monospace, monospace';
            ctx.fillText('thickness = |weight|', 24, 32); ctx.fillStyle = palette.cyan; ctx.fillText('cyan = positive', 24, 52); ctx.fillStyle = palette.coral; ctx.fillText('coral = negative', 24, 72);
            updateMetrics(cache.output, target);
        }

        function lossWithOutputWeights(w0, w1, cache, target) {
            const logit = w0 * cache.h[0] + w1 * cache.h[1] + state.weights.w2[2] * cache.h[2] + state.weights.b2;
            return bce(sigmoid(logit), target);
        }
        function drawLossSurface() {
            clearCanvas(ctx, canvas);
            const x = [Number(inputs.x1.value), Number(inputs.x2.value)]; const target = Number(inputs.target.value); const cache = forward(x);
            const bounds = { left: 75, right: 825, top: 35, bottom: 475, min: -4, max: 4 };
            const cols = 64; const rows = 40; const cellW = (bounds.right - bounds.left) / cols; const cellH = (bounds.bottom - bounds.top) / rows;
            for (let col = 0; col < cols; col += 1) {
                for (let row = 0; row < rows; row += 1) {
                    const w0 = lerp(bounds.min, bounds.max, col / (cols - 1)); const w1 = lerp(bounds.max, bounds.min, row / (rows - 1));
                    const loss = Math.min(lossWithOutputWeights(w0, w1, cache, target), 4);
                    const t = loss / 4;
                    const red = Math.round(20 + 220 * t); const green = Math.round(205 - 140 * t); const blue = Math.round(230 - 80 * t);
                    ctx.fillStyle = `rgba(${red},${green},${blue},.72)`; ctx.fillRect(bounds.left + col * cellW, bounds.top + row * cellH, cellW + 1, cellH + 1);
                }
            }
            ctx.strokeStyle = palette.axis; ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
            const px = bounds.left + (state.weights.w2[0] - bounds.min) / (bounds.max - bounds.min) * (bounds.right - bounds.left);
            const py = bounds.bottom - (state.weights.w2[1] - bounds.min) / (bounds.max - bounds.min) * (bounds.bottom - bounds.top);
            ctx.fillStyle = palette.white; ctx.shadowColor = palette.white; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            ctx.fillStyle = palette.text; ctx.font = '800 13px Nunito, sans-serif'; ctx.fillText('current output weights', clamp(px + 14, bounds.left, bounds.right - 150), clamp(py - 12, bounds.top + 15, bounds.bottom));
            ctx.fillStyle = palette.muted; ctx.font = '12px ui-monospace, monospace'; ctx.fillText('output weight w₁ →', bounds.right - 145, bounds.bottom + 32);
            ctx.save(); ctx.translate(30, bounds.top + 160); ctx.rotate(-Math.PI / 2); ctx.fillText('output weight w₂ →', 0, 0); ctx.restore();
            updateMetrics(cache.output, target);
        }

        function updateMetrics(prediction, target) {
            predictionMetric.textContent = prediction.toFixed(4);
            lossMetric.textContent = bce(prediction, target).toFixed(4);
            epochMetric.textContent = String(state.epoch);
        }

        function render(now = performance.now()) {
            if (state.view === 'loss') drawLossSurface(); else drawNetwork(now);
            if (now - state.animationStart < 1500) requestAnimationFrame(render);
        }

        const viewCopy = {
            forward: { stage: 'Signal flows left → right', title: 'Prediction is function composition', description: 'Each edge scales a signal. Each neuron adds incoming evidence, shifts it with a bias, then gates it through sigmoid.', equation: '\\(\\mathbf{h}=\\sigma(W_1\\mathbf{x}+\\mathbf{b}_1),\\quad \\hat y=\\sigma(W_2\\mathbf{h}+b_2)\\)', bridge: 'A forward pass is a sequence of matrix transformations and nonlinear gates.', action: 'Run forward pass' },
            loss: { stage: 'Parameters become a landscape', title: 'Loss turns behavior into an objective', description: 'Holding the hidden representation fixed, the colors show loss as two output weights vary. The white point is the current model.', equation: '\\(L(y,\\hat y)=-y\\log\\hat y-(1-y)\\log(1-\\hat y)\\)', bridge: 'Changing the data or target reshapes the slice. Full training navigates a landscape with one axis per parameter.', action: 'Take gradient step' },
            backprop: { stage: 'Credit flows right → left', title: 'Backprop multiplies local derivatives', description: 'Start with prediction error, pass it through each local derivative, and accumulate a gradient for every edge that influenced the result.', equation: '\\(\\delta^{(l)}=(W^{(l+1)T}\\delta^{(l+1)})\\odot\\sigma\'(z^{(l)})\\)', bridge: 'For an output weight w, ∂L/∂w = (ŷ − y)h: error times the activation that carried responsibility.', action: 'Backprop + update' },
            train: { stage: 'Repeated updates reshape the function', title: 'Learning is many small corrections', description: 'The XOR task is not linearly separable. Hidden neurons learn intermediate boundaries whose nonlinear combination solves it.', equation: '\\(\\theta_{k+1}=\\theta_k-\\eta\\nabla_\\theta L_{\\text{XOR}}\\)', bridge: 'Watch average loss fall across all four XOR examples; training changes representations, not just the final answer.', action: 'Train 300 epochs' }
        };

        function applyView(view) {
            state.view = view;
            setActiveButtons(viewButtons, view, 'networkView');
            const copy = viewCopy[view];
            stageLabel.textContent = copy.stage; title.textContent = copy.title; description.textContent = copy.description; bridge.textContent = copy.bridge; action.textContent = copy.action;
            setMath(equation, copy.equation);
            state.animationStart = performance.now() - 1500;
            render();
        }

        function updateOutputs() {
            outputs.x1.textContent = inputs.x1.value; outputs.x2.textContent = inputs.x2.value; outputs.target.textContent = inputs.target.value; outputs.lr.textContent = Number(inputs.lr.value).toFixed(2); render();
        }
        Object.values(inputs).forEach(input => input.addEventListener('input', updateOutputs));
        viewButtons.forEach(button => button.addEventListener('click', () => applyView(button.dataset.networkView)));
        action.addEventListener('click', () => {
            const x = [Number(inputs.x1.value), Number(inputs.x2.value)]; const target = Number(inputs.target.value); const lr = Number(inputs.lr.value);
            if (state.view === 'forward') {
                state.animationStart = performance.now(); state.animationDirection = 1; render();
            } else if (state.view === 'loss' || state.view === 'backprop') {
                trainExample(x, target, lr); state.animationStart = performance.now(); state.animationDirection = -1; render();
            } else if (!state.training) {
                state.training = true; action.disabled = true; let remaining = 300;
                const batch = () => {
                    const chunk = reducedMotion ? remaining : Math.min(6, remaining);
                    for (let i = 0; i < chunk; i += 1) trainEpoch();
                    remaining -= chunk; render();
                    if (remaining > 0) requestAnimationFrame(batch);
                    else { state.training = false; action.disabled = false; predictionMetric.textContent = `${forward(x).output.toFixed(4)} · avg ${averageLoss().toFixed(4)}`; }
                };
                requestAnimationFrame(batch);
            }
        });
        updateOutputs();
    }

    // ---------------------------------------------------------------------
    // Complete playlist lecture explorer
    // ---------------------------------------------------------------------
    function setupLectureExplorer() {
        const catalog = window.MathLectureCatalog;
        const guides = window.MathLectureGuides || {};
        const canvas = $("#lectureConceptCanvas");
        if (!catalog || !canvas) return;
        const ctx = canvas.getContext("2d");
        const courseButtons = $$("[data-lecture-course]");
        const search = $("#lectureSearch");
        const index = $("#lectureIndex");
        const courseCount = $("#lectureCourseCount");
        const playlistLink = $("#lecturePlaylistLink");
        const sceneLabel = $("#lectureSceneLabel");
        const sceneCaption = $("#lectureSceneCaption");
        const number = $("#lectureNumber");
        const title = $("#lectureTitle");
        const duration = $("#lectureDuration");
        const summary = $("#lectureSummary");
        const equation = $("#lectureEquation");
        const concepts = $("#lectureConcepts");
        const mlBridge = $("#lectureMlBridge");
        const watchLink = $("#lectureWatchLink");
        const library = $("#lecture-library");
        const mediaStage = $("#lectureMediaStage");
        const manimVideo = $("#lectureManimVideo");
        const mediaToggle = $("#lectureMediaToggle");
        const mediaStatus = $("#lectureMediaStatus");
        const mediaHint = $("#lectureMediaHint");
        const videoPlay = $("#lectureVideoPlay");
        const carousel = $("#lectureCarousel");
        const carouselViewport = $(".lecture-carousel-viewport", carousel);
        const carouselTrack = $("#lectureCarouselTrack");
        const carouselTitle = $("#lectureCarouselTitle");
        const slideCounter = $("#lectureSlideCounter");
        const slideDots = $("#lectureSlideDots");
        const slidePrev = $("#lectureSlidePrev");
        const slideNext = $("#lectureSlideNext");
        const autoplay = $("#lectureAutoplay");
        const slideNames = ["Mental picture", "Core ideas", "Mechanism", "Read the formula", "Visual experiment", "ML connection"];
        const state = { course: "calculus", lectureIndex: 0, frame: null, slideIndex: 0, slideCount: slideNames.length, autoplay: null, pointerStart: null, sceneStart: performance.now(), manimCatalog: null, mediaMode: "canvas", mediaAsset: null, mediaToken: 0 };
        const lectureFactorial = function(n) { let result = 1; for (let i = 2; i <= n; i += 1) result *= i; return result; };

        const sceneCopy = {
            accumulation: "Finite pieces accumulate into a smooth whole as the partition becomes finer.",
            tangent: "A secant line pivots toward the local tangent as the input nudge contracts.",
            geometry: "First-order boundary pieces explain the derivative; higher-order corners disappear faster.",
            chain: "A pulse moves through local dependencies; each link scales the change it receives.",
            growth: "Height and slope grow together, creating the self-reproducing exponential curve.",
            constraint: "The moving point stays on a constraint, forcing x and y changes to balance.",
            limit: "Input tolerance narrows until every allowed output lies inside the requested band.",
            curvature: "Slope changes along the curve; the second derivative records that bending.",
            series: "Successive polynomial terms match more local derivative information.",
            "local-map": "A nonlinear transformation looks like a simple stretch under enough magnification.",
            vectors: "Coordinates scale basis directions; vector addition completes a parallelogram.",
            span: "All linear combinations sweep a line or plane depending on independence.",
            transform: "The matrix moves the basis vectors, and the entire grid follows.",
            composition: "Two transformations flow in sequence; reversing the order changes the result.",
            transform3d: "Three transformed basis directions determine a full volume deformation.",
            area: "The unit square becomes a parallelogram whose signed area is the determinant.",
            subspaces: "The column space shows reachable outputs; the null space shows lost directions.",
            dimensions: "A nonsquare map moves between input and output spaces of different dimension.",
            projection: "The dot product measures how much one direction survives projection onto another.",
            cross: "Two directions define an oriented area and a perpendicular normal.",
            duality3d: "A signed-volume measurement is represented by its dual cross-product vector.",
            cramer: "Replacing a basis column turns solution coordinates into ratios of signed areas.",
            basis: "The vector stays fixed while its coordinate grid changes around it.",
            eigen: "Eigen-directions remain on their own lines while all other directions turn.",
            abstract: "Different-looking objects share the same add-and-scale structure.",
            field: "A state follows the arrow at its current location, one numerical step at a time.",
            pde: "Each spatial point exchanges information with its neighbors as the whole function evolves.",
            heat: "High-frequency modes decay faster, leaving a smooth low-frequency temperature profile.",
            fourier: "Rotating frequency vectors add tip-to-tail to reconstruct a signal.",
            complex: "Multiplication by i continuously turns velocity, generating circular motion.",
            laplace: "Exponential probes test how strongly a signal contains each decay and oscillation mode.",
            "matrix-exp": "Infinitely many tiny linear steps accumulate into the matrix exponential flow.",
            network: "Activations move forward through weighted edges and nonlinear gates.",
            landscape: "The parameter point follows the negative gradient across a loss landscape.",
            backprop: "Prediction error moves backward, splitting into responsibility signals for every edge.",
            tokens: "A token becomes a vector, gathers context, and produces a next-token distribution.",
            transformer: "The residual stream is repeatedly read and edited by attention and MLP blocks.",
            attention: "Query-key scores become a probability distribution that blends value vectors.",
            memory: "Feature detectors open nonlinear gates and write associated directions into the residual stream.",
            diffusion: "Noise is removed in many conditioned steps until coherent structure emerges."
        };

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, function(character) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character];
            });
        }

        function sourceUrl(course, lecture) {
            return "https://www.youtube.com/watch?v=" + lecture.video + "&list=" + new URL(course.playlist).searchParams.get("list");
        }

        function setVideoButton() {
            const paused = manimVideo.paused;
            videoPlay.textContent = paused ? "Play" : "Pause";
            videoPlay.setAttribute("aria-pressed", paused ? "true" : "false");
            videoPlay.setAttribute("aria-label", (paused ? "Play" : "Pause") + " the Manim lecture animation");
        }

        function playManim(userInitiated) {
            const chapterActive = library.closest(".chapter")?.classList.contains("is-active");
            if ((reducedMotion && !userInitiated) || (!chapterActive && !userInitiated) || state.mediaMode !== "manim") { setVideoButton(); return; }
            const playRequest = manimVideo.play();
            if (playRequest?.catch) playRequest.catch(function() { setVideoButton(); });
        }

        function setMediaMode(mode) {
            const manimReady = mediaStage.classList.contains("is-manim-ready");
            state.mediaMode = mode === "manim" && manimReady ? "manim" : "canvas";
            const showingManim = state.mediaMode === "manim";
            mediaStage.classList.toggle("is-manim-mode", showingManim);
            mediaToggle.setAttribute("aria-pressed", showingManim ? "true" : "false");
            mediaToggle.textContent = showingManim ? "Interactive canvas" : "Manim render";
            if (showingManim) {
                cancelAnimationFrame(state.frame);
                mediaStatus.textContent = "ManimGL browser render";
                mediaHint.textContent = "Rendered with 3b1b/manim, played in your browser.";
                playManim(false);
            } else {
                manimVideo.pause();
                mediaStatus.textContent = manimReady ? "interactive JavaScript" : "JavaScript fallback";
                mediaHint.textContent = manimReady ? "Switch back to the Manim render at any time." : "The browser canvas remains fully animated.";
                state.sceneStart = performance.now();
                cancelAnimationFrame(state.frame);
                drawScene(performance.now());
            }
            setVideoButton();
        }

        function fallbackToCanvas(message) {
            mediaStage.classList.remove("is-manim-ready", "is-manim-mode");
            state.mediaAsset = null;
            setMediaMode("canvas");
            mediaStatus.textContent = "JavaScript fallback";
            mediaHint.textContent = message || "The Manim render is unavailable; the interactive canvas is active.";
        }

        function updateManimMedia() {
            const course = catalog[state.course], lecture = course.lectures[state.lectureIndex];
            const manimCatalog = state.manimCatalog;
            if (!manimCatalog) return;
            const slug = manimCatalog.scenes?.[lecture.scene];
            const asset = slug ? manimCatalog.assets?.[slug] : null;
            if (!slug || !asset) { fallbackToCanvas("No Manim scene is mapped for this lecture; the interactive canvas is active."); return; }

            state.mediaToken += 1;
            const token = state.mediaToken;
            state.mediaAsset = slug;
            state.mediaMode = "canvas";
            mediaStage.classList.remove("is-manim-ready", "is-manim-mode");
            mediaToggle.setAttribute("aria-pressed", "false");
            mediaToggle.textContent = "Manim render";
            manimVideo.pause();
            manimVideo.replaceChildren();
            manimVideo.poster = manimCatalog.assetBase + "/" + slug + ".jpg";
            manimVideo.setAttribute("aria-label", asset.title + " — ManimGL animation for " + lecture.title);
            let failures = 0;
            [["webm", "video/webm"], ["mp4", "video/mp4"]].forEach(function(format) {
                const source = document.createElement("source");
                source.src = manimCatalog.assetBase + "/" + slug + "." + format[0];
                source.type = format[1];
                source.addEventListener("error", function() {
                    if (token !== state.mediaToken) return;
                    failures += 1;
                    if (failures === 2) fallbackToCanvas("This Manim asset has not been rendered yet; the interactive canvas is active.");
                });
                manimVideo.appendChild(source);
            });
            mediaStatus.textContent = "loading ManimGL";
            mediaHint.textContent = "Loading the matching Manim lecture scene…";
            manimVideo.load();
        }

        function loadManimCatalog() {
            fetch("manim/scene-manifest.json", { cache: "no-cache" })
                .then(function(response) { if (!response.ok) throw new Error("Manifest unavailable"); return response.json(); })
                .then(function(manimCatalog) {
                    state.manimCatalog = manimCatalog;
                    updateManimMedia();
                })
                .catch(function() { fallbackToCanvas("Manim metadata is unavailable; the interactive canvas is active."); });
        }

        function focusList(items, startIndex) {
            return '<ul class="lecture-slide-focus-list">' + items.map(function(item, itemIndex) {
                return "<li><span>" + String(startIndex + itemIndex).padStart(2, "0") + "</span>" + escapeHtml(item) + "</li>";
            }).join("") + "</ul>";
        }

        function stopAutoplay() {
            if (state.autoplay) window.clearInterval(state.autoplay);
            state.autoplay = null;
            autoplay.setAttribute("aria-pressed", "false");
            autoplay.textContent = reducedMotion ? "Auto-play off" : "Auto-play";
        }

        function restartScene() {
            if (state.mediaMode === "manim" && mediaStage.classList.contains("is-manim-ready")) {
                manimVideo.currentTime = 0;
                playManim(true);
                return;
            }
            state.sceneStart = performance.now();
            cancelAnimationFrame(state.frame);
            drawScene(performance.now());
        }

        function showSlide(nextIndex, userInitiated) {
            if (userInitiated) stopAutoplay();
            state.slideIndex = (nextIndex + state.slideCount) % state.slideCount;
            carouselTrack.style.transform = "translateX(-" + (state.slideIndex * 100) + "%)";
            $$(".lecture-carousel-slide", carouselTrack).forEach(function(slide, slideIndex) {
                const hidden = slideIndex !== state.slideIndex;
                slide.setAttribute("aria-hidden", hidden ? "true" : "false");
                slide.inert = hidden;
            });
            $$(".lecture-slide-dot", slideDots).forEach(function(dot, dotIndex) {
                dot.setAttribute("aria-current", dotIndex === state.slideIndex ? "true" : "false");
            });
            const activeSlide = $$(".lecture-carousel-slide", carouselTrack)[state.slideIndex];
            carouselTitle.textContent = activeSlide?.dataset.slideTitle || slideNames[state.slideIndex];
            slideCounter.textContent = (state.slideIndex + 1) + " / " + state.slideCount;
            if (state.slideIndex === 4) restartScene();
        }

        function buildCarousel(course, lecture, lectureIndex) {
            stopAutoplay();
            const guide = guides[lecture.scene] || {
                formula: "Read every symbol as a relationship between quantities, then ask which quantities are inputs, outputs, and rates of change.",
                observe: sceneCopy[lecture.scene] || lecture.summary,
                check: "Can you explain what changes, what remains invariant, and how the formula predicts the animation?"
            };
            const split = Math.ceil(lecture.concepts.length / 2);
            const firstConcepts = lecture.concepts.slice(0, split);
            const laterConcepts = lecture.concepts.slice(split);
            const url = sourceUrl(course, lecture);
            const sceneDescription = sceneCopy[lecture.scene] || lecture.summary;
            const slides = [
                {
                    title: "Build the mental picture",
                    body: '<div class="lecture-slide-copy"><span class="lecture-slide-index">01</span><span class="lecture-slide-kicker">Start with intuition</span><h4>' + escapeHtml(lecture.title) + '</h4><p>' + escapeHtml(lecture.summary) + '</p></div><div class="lecture-slide-visual"><strong>Orient the picture</strong><p>' + escapeHtml(sceneDescription) + '</p><div class="lecture-slide-mini-meta"><span>Course<b>' + escapeHtml(course.label) + '</b></span><span>Source chapter<b>' + String(lectureIndex + 1).padStart(2, "0") + ' · ' + escapeHtml(lecture.duration) + '</b></span><span>Concept checkpoints<b>' + lecture.concepts.length + '</b></span><span>Animated scene<b>' + escapeHtml(lecture.scene.replaceAll("-", " ")) + '</b></span></div></div>'
                },
                {
                    title: "Establish the core ideas",
                    body: '<div class="lecture-slide-copy"><span class="lecture-slide-index">02</span><span class="lecture-slide-kicker">Foundation</span><h4>Name the mathematical objects</h4><p>Build the vocabulary before compressing the idea into notation. These are the first dependencies the lecture establishes.</p>' + focusList(firstConcepts, 1) + '</div><div class="lecture-slide-visual"><strong>Connect the ideas</strong><p class="lecture-slide-callout">Start with <b>' + escapeHtml(firstConcepts[0]) + '</b>. Then ask how each following idea changes or measures the object introduced before it.</p></div>'
                },
                {
                    title: "Trace the mechanism",
                    body: '<div class="lecture-slide-copy"><span class="lecture-slide-index">03</span><span class="lecture-slide-kicker">Cause and effect</span><h4>Follow what the operation does</h4><p>Move from definitions to the chain of consequences. These checkpoints complete the lecture’s conceptual argument.</p>' + focusList(laterConcepts, split + 1) + '</div><div class="lecture-slide-visual"><strong>Reason in sequence</strong><p class="lecture-slide-callout">Use the animation as a causal diagram: identify the input, predict the local change, and then explain the visible output. End by connecting the mechanism to <b>' + escapeHtml(laterConcepts[laterConcepts.length - 1]) + '</b>.</p></div>'
                },
                {
                    title: "Read the formula",
                    body: '<div class="lecture-slide-copy"><span class="lecture-slide-index">04</span><span class="lecture-slide-kicker">Notation with meaning</span><h4>Translate symbols into motion</h4><div class="lecture-slide-formula">' + escapeHtml(lecture.math) + '</div><p>' + escapeHtml(guide.formula) + '</p></div><div class="lecture-slide-visual"><strong>Three-pass reading</strong><ul class="lecture-slide-focus-list"><li><span>1</span>Name every quantity and its units or dimensions.</li><li><span>2</span>Read the equality as a claim about a process, not just a rearrangement.</li><li><span>3</span>Test an edge case: zero, alignment, tiny change, or very long time.</li></ul></div>'
                },
                {
                    title: "Run the visual experiment",
                    body: '<div class="lecture-slide-copy"><span class="lecture-slide-index">05</span><span class="lecture-slide-kicker">Observe and predict</span><h4>Use motion as a proof sketch</h4><p>' + escapeHtml(guide.observe) + '</p><div class="lecture-slide-actions"><button class="lecture-replay" type="button" data-carousel-replay>Replay animation</button><span class="lecture-carousel-hint">The active Manim or canvas scene resets above.</span></div></div><div class="lecture-slide-visual"><strong>Prediction loop</strong><ul class="lecture-slide-focus-list"><li><span>1</span>Pause mentally before the next change.</li><li><span>2</span>Predict the direction and relative size.</li><li><span>3</span>Use the formula to explain any surprise.</li></ul><p class="lecture-slide-callout">' + escapeHtml(sceneDescription) + '</p></div>'
                },
                {
                    title: "Transfer the idea to ML",
                    body: '<div class="lecture-slide-copy"><span class="lecture-slide-index">06</span><span class="lecture-slide-kicker">From mathematics to models</span><h4>Find the machine-learning role</h4><p>' + escapeHtml(lecture.ml) + '</p><div class="lecture-slide-actions"><a class="lecture-slide-source" href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">Watch this source lecture ↗</a></div></div><div class="lecture-slide-visual"><div class="lecture-slide-question"><strong>Check your understanding</strong>' + escapeHtml(guide.check) + '</div><div class="lecture-slide-mini-meta"><span>Explain it visually<b>' + escapeHtml(lecture.scene.replaceAll("-", " ")) + '</b></span><span>Explain it symbolically<b>Use the displayed formula</b></span></div></div>'
                }
            ];

            carouselTrack.innerHTML = slides.map(function(slide, slideIndex) {
                return '<article class="lecture-carousel-slide" role="group" aria-roledescription="slide" aria-label="Slide ' + (slideIndex + 1) + ' of ' + slides.length + '" data-slide-title="' + escapeHtml(slide.title) + '"><div class="lecture-slide-layout">' + slide.body + "</div></article>";
            }).join("");
            slideDots.innerHTML = slides.map(function(slide, slideIndex) {
                return '<button class="lecture-slide-dot" type="button" aria-label="Show slide ' + (slideIndex + 1) + ': ' + escapeHtml(slide.title) + '" data-slide-index="' + slideIndex + '"></button>';
            }).join("");
            state.slideCount = slides.length;
            showSlide(0, false);
            if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([carouselTrack]).catch(function() {});
        }

        function drawBackdrop() {
            clearCanvas(ctx, canvas);
            ctx.strokeStyle = "rgba(158,178,201,.055)";
            ctx.lineWidth = 1;
            for (let x = 0; x <= canvas.width; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
            }
            for (let y = 0; y <= canvas.height; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
            }
        }

        function plot(fn, color, width, yScale) {
            const cx = canvas.width / 2; const cy = canvas.height / 2;
            ctx.strokeStyle = color; ctx.lineWidth = width || 3; ctx.beginPath();
            for (let i = 0; i <= 500; i += 1) {
                const x = lerp(-4, 4, i / 500); const y = fn(x);
                const px = cx + x * 95; const py = cy - y * (yScale || 75);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        function drawCalculus(lecture, time, color) {
            const cx = 500; const cy = 250; const phase = (Math.sin(time * .0012) + 1) / 2;
            ctx.strokeStyle = palette.axis; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(45, cy); ctx.lineTo(955, cy); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, 30); ctx.lineTo(cx, 470); ctx.stroke();
            if (lecture.scene === "accumulation") {
                const count = 6 + Math.floor(phase * 34); const step = 5.8 / count;
                for (let i = 0; i < count; i += 1) {
                    const x = -3 + i * step; const h = .18 * (x * x + .4);
                    ctx.fillStyle = "rgba(88,230,176,.2)"; ctx.strokeStyle = "rgba(88,230,176,.5)";
                    ctx.fillRect(cx + x * 95, cy - h * 70, step * 95, h * 70); ctx.strokeRect(cx + x * 95, cy - h * 70, step * 95, h * 70);
                }
                plot(function(x) { return .18 * (x * x + .4); }, color, 3, 70);
            } else if (lecture.scene === "geometry") {
                const size = 115 + phase * 55; const dx = 12 + (1 - phase) * 32; const x = cx - size / 2; const y = cy - size / 2;
                ctx.fillStyle = "rgba(97,218,251,.14)"; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.fillRect(x, y, size, size); ctx.strokeRect(x, y, size, size);
                ctx.fillStyle = "rgba(255,209,102,.26)"; ctx.fillRect(x + size, y, dx, size); ctx.fillRect(x, y + size, size, dx);
                ctx.fillStyle = "rgba(255,122,144,.38)"; ctx.fillRect(x + size, y + size, dx, dx);
            } else if (lecture.scene === "chain") {
                const nodes = [{ x: 145, label: "x" }, { x: 375, label: "u=g(x)" }, { x: 635, label: "y=f(u)" }, { x: 860, label: "L(y)" }];
                nodes.forEach(function(node, i) {
                    if (i < nodes.length - 1) drawArrow(ctx, node.x + 45, cy, nodes[i + 1].x - 55, cy, i % 2 ? palette.violet : color, 3, 10);
                    ctx.fillStyle = "#10263d"; ctx.strokeStyle = i % 2 ? palette.violet : color; ctx.lineWidth = 2; roundedRect(ctx, node.x - 48, cy - 35, 96, 70, 15); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = palette.text; ctx.font = "800 14px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(node.label, node.x, cy + 5); ctx.textAlign = "start";
                });
                const pulseX = lerp(190, 805, (time * .00035) % 1); ctx.fillStyle = palette.gold; ctx.shadowColor = palette.gold; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(pulseX, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            } else if (lecture.scene === "constraint") {
                const radius = 145; const angle = time * .0008; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
                const px = cx + Math.cos(angle) * radius; const py = cy - Math.sin(angle) * radius; ctx.fillStyle = palette.gold; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
                drawArrow(ctx, px, py, px - Math.sin(angle) * 95, py - Math.cos(angle) * 95, palette.coral, 3, 10);
            } else if (lecture.scene === "series") {
                plot(Math.sin, color, 3, 110);
                const order = 1 + 2 * (Math.floor(time / 1300) % 4);
                plot(function(x) { let sum = 0; for (let n = 0; 2 * n + 1 <= order; n += 1) sum += (n % 2 ? -1 : 1) * x ** (2 * n + 1) / lectureFactorial(2 * n + 1); return sum; }, palette.gold, 2, 110);
                ctx.fillStyle = palette.gold; ctx.font = "800 14px Nunito, sans-serif"; ctx.fillText("Taylor order " + order, 70, 55);
            } else {
                const fn = lecture.scene === "growth" ? function(x) { return Math.exp(x * .65) * .18; } : function(x) { return .2 * x * x; };
                plot(fn, color, 3, 75);
                const x = lerp(-2.4, 2.1, phase); const h = lecture.scene === "limit" ? .05 + phase * .7 : .05 + (1 - phase) * 1.3; const y = fn(x); const slope = (fn(x + h) - y) / h;
                const px = cx + x * 95; const py = cy - y * 75; ctx.strokeStyle = palette.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px - 110, py + slope * 80); ctx.lineTo(px + 110, py - slope * 80); ctx.stroke();
                ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
                if (lecture.scene === "limit" || lecture.scene === "local-map") { ctx.strokeStyle = palette.violet; ctx.setLineDash([7, 6]); ctx.strokeRect(px - 75 * phase, py - 65 * phase, 150 * phase, 130 * phase); ctx.setLineDash([]); }
            }
        }

        function drawLinear(lecture, time, color) {
            const cx = 500; const cy = 250; const phase = (Math.sin(time * .001) + 1) / 2;
            let matrix = [1, 0, 0, 1];
            if (["transform", "composition", "basis"].includes(lecture.scene)) matrix = [1, .8 * phase, .3 * phase, 1 - .2 * phase];
            if (lecture.scene === "area" || lecture.scene === "cramer") matrix = [1.25, .65 * phase, .2, .7];
            if (lecture.scene === "subspaces" || lecture.scene === "dimensions") matrix = [1, .7, .03, .08];
            if (lecture.scene === "projection") matrix = [1, .45, 0, .2];
            if (lecture.scene === "eigen") matrix = [1.45, .45, .45, .9];
            const map = function(x, y) { return { x: cx + (matrix[0] * x + matrix[1] * y) * 62, y: cy - (matrix[2] * x + matrix[3] * y) * 62 }; };
            ctx.strokeStyle = "rgba(158,178,201,.12)"; ctx.lineWidth = 1;
            for (let n = -8; n <= 8; n += .5) {
                let a = map(n, -6), b = map(n, 6); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                a = map(-8, n); b = map(8, n); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
            const origin = map(0, 0), i = map(1, 0), j = map(0, 1); drawArrow(ctx, origin.x, origin.y, i.x, i.y, color, 4, 11); drawArrow(ctx, origin.x, origin.y, j.x, j.y, palette.coral, 4, 11);
            if (lecture.scene === "vectors" || lecture.scene === "span" || lecture.scene === "projection") { const v = map(2.6, 1.8); drawArrow(ctx, origin.x, origin.y, v.x, v.y, palette.gold, 4, 11); }
            if (lecture.scene === "area" || lecture.scene === "cramer") { const corner = map(1, 1); ctx.fillStyle = "rgba(97,218,251,.18)"; ctx.strokeStyle = color; ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(i.x, i.y); ctx.lineTo(corner.x, corner.y); ctx.lineTo(j.x, j.y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
            if (["cross", "duality3d", "transform3d"].includes(lecture.scene)) { drawArrow(ctx, cx, cy, cx + 165, cy + 75, color, 4, 11); drawArrow(ctx, cx, cy, cx - 90, cy - 130, palette.coral, 4, 11); drawArrow(ctx, cx, cy, cx + 35 * Math.sin(time * .001), cy - 180, palette.gold, 4, 11); }
            if (lecture.scene === "eigen") { ctx.setLineDash([9, 7]); ctx.strokeStyle = palette.violet; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(90, 455); ctx.lineTo(910, 45); ctx.stroke(); ctx.strokeStyle = palette.mint; ctx.beginPath(); ctx.moveTo(190, 25); ctx.lineTo(810, 475); ctx.stroke(); ctx.setLineDash([]); }
            if (lecture.scene === "abstract") { ctx.fillStyle = "rgba(7,17,31,.88)"; ctx.strokeStyle = color; roundedRect(ctx, 650, 85, 275, 330, 20); ctx.fill(); ctx.stroke(); ctx.fillStyle = palette.text; ctx.font = "800 14px Nunito, sans-serif"; ctx.fillText("functions + polynomials", 705, 120); }
        }

        function drawOde(lecture, time, color) {
            const cx = 500; const cy = 250;
            if (lecture.scene === "fourier" || lecture.scene === "complex") {
                let x = 280, y = cy; const count = lecture.scene === "complex" ? 1 : 7;
                for (let n = 1; n <= count; n += 1) { const r = 95 / n, angle = time * .00045 * n * (n % 2 ? 1 : -1); ctx.strokeStyle = "rgba(158,178,201,.18)"; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); const nx = x + Math.cos(angle) * r, ny = y + Math.sin(angle) * r; drawArrow(ctx, x, y, nx, ny, n % 2 ? color : palette.violet, 2, 6); x = nx; y = ny; }
                ctx.strokeStyle = palette.gold; ctx.lineWidth = 3; ctx.beginPath(); for (let px = x; px < 960; px += 2) { const py = y + 60 * Math.sin((px - x) * .018 + time * .001); if (px === x) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
            } else if (lecture.scene === "heat" || lecture.scene === "pde") {
                const modes = lecture.scene === "heat" ? 6 : 3;
                for (let n = modes; n >= 1; n -= 1) { const decay = Math.exp(-n * n * ((time * .00018) % 1.2)); ctx.strokeStyle = n === 1 ? color : "rgba(167,139,250,.35)"; ctx.lineWidth = n === 1 ? 4 : 1.5; ctx.beginPath(); for (let px = 45; px <= 955; px += 3) { const u = (px - 45) / 910, py = cy - 110 * decay * Math.sin(n * Math.PI * u) / n; if (px === 45) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); }
            } else if (lecture.scene === "laplace") {
                for (let i = 0; i < 10; i += 1) { const rate = .25 + i * .14; ctx.strokeStyle = "rgba(97,218,251," + (.15 + i * .055) + ")"; ctx.lineWidth = 2; ctx.beginPath(); for (let px = 80; px < 930; px += 3) { const x = (px - 80) / 130, py = 420 - 300 * Math.exp(-rate * x) * Math.cos((i % 3) * x + time * .0002); if (px === 80) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke(); }
                ctx.fillStyle = palette.gold; ctx.font = "800 14px Nunito, sans-serif"; ctx.fillText("exponential probes e⁻ˢᵗ", 75, 55);
            } else {
                const field = lecture.scene === "matrix-exp" ? function(x, y) { return [1.1 * x + .7 * y, -.5 * x + .2 * y]; } : function(x, y) { return [y, -x - .18 * y]; };
                for (let gx = -4; gx <= 4; gx += .55) for (let gy = -2; gy <= 2; gy += .5) { const d = field(gx, gy), mag = Math.hypot(d[0], d[1]) || 1, px = cx + gx * 105, py = cy - gy * 95; drawArrow(ctx, px - d[0] / mag * 10, py + d[1] / mag * 10, px + d[0] / mag * 10, py - d[1] / mag * 10, "rgba(88,230,176,.34)", 1, 4); }
                ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 450; i += 1) { const angle = i * .025, r = 175 * Math.exp(-angle * .035), px = cx + Math.cos(angle + time * .00025) * r, py = cy + Math.sin(angle + time * .00025) * r * .72; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.stroke();
            }
        }

        function drawNeural(lecture, time, color) {
            const pulse = (time * .00035) % 1;
            if (lecture.scene === "landscape") { for (let r = 180; r >= 25; r -= 28) { ctx.strokeStyle = "rgba(167,139,250,.28)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(500, 260, r * 1.8, r, -.2, 0, Math.PI * 2); ctx.stroke(); } const px = lerp(780, 500, ease(pulse)), py = lerp(100, 260, ease(pulse)); drawArrow(ctx, px + 45, py - 25, px, py, palette.gold, 4, 11); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill(); return; }
            if (lecture.scene === "attention") { const words = ["The", "model", "routes", "useful", "context"]; words.forEach(function(word, i) { ctx.fillStyle = palette.text; ctx.font = "800 12px Nunito, sans-serif"; ctx.fillText(word, 275 + i * 58, 38); ctx.fillText(word, 25, 92 + i * 58); }); for (let row = 0; row < 5; row += 1) for (let col = 0; col < 5; col += 1) { const value = Math.max(.06, Math.abs(Math.sin(row * 1.7 + col * 2.1 + time * .001)) * (col <= row ? 1 : .08)); ctx.fillStyle = "rgba(255,122,144," + value + ")"; ctx.fillRect(270 + col * 58, 60 + row * 58, 52, 52); } drawArrow(ctx, 650, 210, 900, 210, color, 3, 10); ctx.fillStyle = palette.text; ctx.fillText("softmax(QKᵀ) · V", 720, 182); return; }
            if (lecture.scene === "diffusion") { for (let stage = 0; stage < 6; stage += 1) { const x = 50 + stage * 155, clarity = stage / 5; ctx.fillStyle = "rgba(97,218,251," + (.04 + clarity * .12) + ")"; ctx.strokeStyle = "rgba(97,218,251," + (.2 + clarity * .5) + ")"; roundedRect(ctx, x, 135, 120, 210, 15); ctx.fill(); ctx.stroke(); for (let i = 0; i < Math.round(75 * (1 - clarity)); i += 1) { ctx.fillStyle = i % 2 ? "rgba(255,255,255,.35)" : "rgba(255,122,144,.35)"; ctx.fillRect(x + 8 + ((i * 37 + stage * 19) % 104), 144 + ((i * 53 + Math.floor(pulse * 20)) % 190), 2, 2); } ctx.strokeStyle = "rgba(255,209,102," + clarity + ")"; ctx.beginPath(); ctx.arc(x + 60, 220, 24 + clarity * 12, 0, Math.PI * 2); ctx.stroke(); if (stage < 5) drawArrow(ctx, x + 123, 240, x + 148, 240, palette.muted, 2, 7); } return; }
            if (["tokens", "transformer", "memory"].includes(lecture.scene)) { const labels = lecture.scene === "tokens" ? ["token", "embed", "context", "logits", "softmax"] : lecture.scene === "memory" ? ["feature", "detect", "GELU", "write", "residual"] : ["embed", "attention", "add", "MLP", "unembed"]; labels.forEach(function(label, i) { const x = 80 + i * 205, y = 250 + Math.sin(time * .001 + i) * 28; if (i < labels.length - 1) drawArrow(ctx, x + 70, y, x + 135, 250 + Math.sin(time * .001 + i + 1) * 28, i % 2 ? palette.violet : color, 3, 9); ctx.fillStyle = "#10263d"; ctx.strokeStyle = i % 2 ? palette.violet : color; roundedRect(ctx, x - 55, y - 42, 110, 84, 16); ctx.fill(); ctx.stroke(); ctx.fillStyle = palette.text; ctx.font = "800 13px Nunito, sans-serif"; ctx.textAlign = "center"; ctx.fillText(label, x, y + 5); ctx.textAlign = "start"; }); const px = lerp(150, 830, pulse); ctx.fillStyle = palette.gold; ctx.beginPath(); ctx.arc(px, 250, 7, 0, Math.PI * 2); ctx.fill(); return; }
            const layers = [[120, [165, 335]], [400, [105, 250, 395]], [690, [150, 350]], [900, [250]]];
            for (let l = 0; l < layers.length - 1; l += 1) layers[l][1].forEach(function(y1) { layers[l + 1][1].forEach(function(y2) { ctx.strokeStyle = l % 2 ? "rgba(167,139,250,.28)" : "rgba(97,218,251,.25)"; ctx.beginPath(); ctx.moveTo(layers[l][0], y1); ctx.lineTo(layers[l + 1][0], y2); ctx.stroke(); }); });
            layers.forEach(function(layer, l) { layer[1].forEach(function(y, n) { const activation = .2 + .8 * Math.abs(Math.sin(time * .001 + l * .8 + n)); ctx.fillStyle = "rgba(255,255,255," + (.04 + activation * .22) + ")"; ctx.strokeStyle = l === layers.length - 1 ? palette.gold : (l % 2 ? palette.violet : color); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(layer[0], y, 27, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }); });
            const reverse = lecture.scene === "backprop", px = lerp(reverse ? 900 : 120, reverse ? 120 : 900, pulse); ctx.fillStyle = reverse ? palette.coral : palette.gold; ctx.beginPath(); ctx.arc(px, 250, 7, 0, Math.PI * 2); ctx.fill();
        }

        function drawCarouselOverlay(course) {
            const label = String(state.slideIndex + 1).padStart(2, "0") + " / " + String(state.slideCount).padStart(2, "0") + "  " + slideNames[state.slideIndex];
            ctx.save();
            ctx.fillStyle = "rgba(255,255,255,.92)";
            ctx.strokeStyle = colorMixForCanvas(course.color, .46);
            ctx.lineWidth = 1.5;
            roundedRect(ctx, 715, 452, 260, 30, 15);
            ctx.fill(); ctx.stroke();
            ctx.fillStyle = palette.text;
            ctx.font = "800 11px Nunito, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(label, 845, 471);
            ctx.textAlign = "start";
            ctx.restore();
        }

        function colorMixForCanvas(hex, alpha) {
            const value = hex.replace("#", "");
            const numeric = Number.parseInt(value.length === 3 ? value.split("").map(function(character) { return character + character; }).join("") : value, 16);
            return "rgba(" + ((numeric >> 16) & 255) + "," + ((numeric >> 8) & 255) + "," + (numeric & 255) + "," + alpha + ")";
        }

        function drawScene(time) {
            const course = catalog[state.course], lecture = course.lectures[state.lectureIndex];
            const sceneTime = Math.max(0, time - state.sceneStart);
            drawBackdrop();
            if (state.course === "calculus") drawCalculus(lecture, sceneTime, course.color);
            if (state.course === "linear") drawLinear(lecture, sceneTime, course.color);
            if (state.course === "ode") drawOde(lecture, sceneTime, course.color);
            if (state.course === "neural") drawNeural(lecture, sceneTime, course.color);
            drawCarouselOverlay(course);
            if (library.closest(".chapter")?.classList.contains("is-active") && state.mediaMode !== "manim" && !reducedMotion) state.frame = requestAnimationFrame(drawScene);
        }

        function renderIndex() {
            const course = catalog[state.course], query = search.value.trim().toLowerCase();
            const filtered = course.lectures.map(function(lecture, lectureIndex) { return { lecture, lectureIndex }; }).filter(function(item) { return !query || [item.lecture.title, item.lecture.summary, item.lecture.ml].concat(item.lecture.concepts).join(" ").toLowerCase().includes(query); });
            index.innerHTML = "";
            if (!filtered.length) { const empty = document.createElement("p"); empty.className = "lecture-index-empty"; empty.textContent = "No concepts match this search."; index.appendChild(empty); }
            filtered.forEach(function(item) {
                const button = document.createElement("button"); const chapter = String(item.lectureIndex + 1).padStart(2, "0");
                button.type = "button"; button.className = "lecture-index-item" + (item.lectureIndex === state.lectureIndex ? " is-active" : ""); button.setAttribute("role", "option"); button.setAttribute("aria-selected", item.lectureIndex === state.lectureIndex ? "true" : "false");
                button.innerHTML = "<span>" + chapter + "</span><strong>" + item.lecture.title + "</strong><small>" + item.lecture.duration + "</small>";
                button.addEventListener("click", function() { selectLecture(item.lectureIndex); }); index.appendChild(button);
            });
            courseCount.textContent = filtered.length + " of " + course.lectures.length + " lectures";
        }

        function selectLecture(lectureIndex) {
            state.lectureIndex = lectureIndex;
            const course = catalog[state.course], lecture = course.lectures[lectureIndex];
            library.style.setProperty("--course-color", course.color);
            number.textContent = course.label.toUpperCase() + " · " + String(lectureIndex + 1).padStart(2, "0");
            title.textContent = lecture.title; duration.textContent = lecture.duration; summary.textContent = lecture.summary; mlBridge.textContent = lecture.ml;
            sceneLabel.textContent = lecture.scene.replaceAll("-", " "); sceneCaption.textContent = sceneCopy[lecture.scene] || lecture.summary;
            watchLink.href = sourceUrl(course, lecture);
            concepts.innerHTML = "";
            lecture.concepts.forEach(function(concept) { const item = document.createElement("li"), check = document.createElement("span"); check.textContent = "✓"; item.append(check, document.createTextNode(concept)); concepts.appendChild(item); });
            setMath(equation, lecture.math); buildCarousel(course, lecture, lectureIndex); updateManimMedia(); renderIndex(); restartScene();
        }

        function selectCourse(courseKey) {
            state.course = courseKey; state.lectureIndex = 0; search.value = "";
            const course = catalog[courseKey]; library.style.setProperty("--course-color", course.color); playlistLink.href = course.playlist;
            courseButtons.forEach(function(button) { const selected = button.dataset.lectureCourse === courseKey; button.classList.toggle("is-active", selected); button.setAttribute("aria-selected", selected ? "true" : "false"); button.style.setProperty("--course-color", catalog[button.dataset.lectureCourse].color); });
            selectLecture(0);
        }

        courseButtons.forEach(function(button) { button.addEventListener("click", function() { selectCourse(button.dataset.lectureCourse); }); });
        search.addEventListener("input", renderIndex);
        slidePrev.addEventListener("click", function() { showSlide(state.slideIndex - 1, true); });
        slideNext.addEventListener("click", function() { showSlide(state.slideIndex + 1, true); });
        slideDots.addEventListener("click", function(event) {
            const dot = event.target.closest("[data-slide-index]");
            if (dot) showSlide(Number(dot.dataset.slideIndex), true);
        });
        autoplay.addEventListener("click", function() {
            if (reducedMotion) return;
            if (state.autoplay) { stopAutoplay(); return; }
            autoplay.setAttribute("aria-pressed", "true");
            autoplay.textContent = "Pause slides";
            state.autoplay = window.setInterval(function() { showSlide(state.slideIndex + 1, false); }, 6500);
        });
        carousel.addEventListener("keydown", function(event) {
            if (event.key === "ArrowLeft") { event.preventDefault(); showSlide(state.slideIndex - 1, true); }
            if (event.key === "ArrowRight") { event.preventDefault(); showSlide(state.slideIndex + 1, true); }
            if (event.key === "Home") { event.preventDefault(); showSlide(0, true); }
            if (event.key === "End") { event.preventDefault(); showSlide(state.slideCount - 1, true); }
        });
        carouselViewport.addEventListener("pointerdown", function(event) { state.pointerStart = event.clientX; });
        carouselViewport.addEventListener("pointerup", function(event) {
            if (state.pointerStart === null) return;
            const distance = event.clientX - state.pointerStart; state.pointerStart = null;
            if (Math.abs(distance) > 48) showSlide(state.slideIndex + (distance < 0 ? 1 : -1), true);
        });
        carouselViewport.addEventListener("pointercancel", function() { state.pointerStart = null; });
        carouselTrack.addEventListener("click", function(event) {
            if (event.target.closest("[data-carousel-replay]")) restartScene();
        });
        mediaToggle.addEventListener("click", function() { setMediaMode(state.mediaMode === "manim" ? "canvas" : "manim"); });
        videoPlay.addEventListener("click", function() {
            if (manimVideo.paused) playManim(true); else manimVideo.pause();
            setVideoButton();
        });
        manimVideo.addEventListener("click", function() {
            if (manimVideo.paused) playManim(true); else manimVideo.pause();
        });
        manimVideo.addEventListener("play", setVideoButton);
        manimVideo.addEventListener("pause", setVideoButton);
        manimVideo.addEventListener("loadeddata", function() {
            if (!state.mediaAsset) return;
            mediaStage.classList.add("is-manim-ready");
            setMediaMode("manim");
        });
        document.querySelector('.chapter-btn[data-chapter="math-deep-dive"]')?.addEventListener("click", function() {
            restartScene();
        });
        $$(".chapter-btn").filter(function(button) { return button.dataset.chapter !== "math-deep-dive"; }).forEach(function(button) {
            button.addEventListener("click", function() { manimVideo.pause(); });
        });
        if (reducedMotion) {
            autoplay.disabled = true;
            autoplay.title = "Auto-play is disabled by your reduced-motion preference.";
        }
        selectCourse("calculus");
        loadManimCatalog();
    }

    function initializeMathDeepDive() {
        setupAtlas();
        setupCalculusLab();
        setupLinearLab();
        setupOdeLab();
        setupNetworkLab();
        setupLectureExplorer();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeMathDeepDive);
    else initializeMathDeepDive();
})();
