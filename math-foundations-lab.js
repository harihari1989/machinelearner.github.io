(() => {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
    const TAU = Math.PI * 2;
    const palette = {
        background: '#f8fbff', panel: '#ffffff', ink: '#1f2937', muted: '#64748b', grid: 'rgba(71,85,105,.12)',
        blue: '#2563eb', cyan: '#0284c7', violet: '#7c3aed', coral: '#e11d48', gold: '#b86b00', mint: '#059669'
    };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const lerp = (a, b, amount) => a + (b - a) * amount;
    const fmt = (value, digits = 3) => Number(value).toFixed(digits).replace(/^-0\.0+$/, '0');

    function setMath(element, markup) {
        if (!element) return;
        element.innerHTML = markup;
        if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([element]).catch(() => {});
    }

    function setActive(buttons, key, value) {
        buttons.forEach(button => {
            const active = button.dataset[key] === value;
            button.classList.toggle('is-active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
    }

    function prepare(ctx, canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = palette.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = palette.grid;
        ctx.lineWidth = 1;
        for (let x = 20; x < canvas.width; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 20; y < canvas.height; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function arrow(ctx, x1, y1, x2, y2, color, width = 3, head = 10) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
        ctx.closePath(); ctx.fill();
    }

    function label(ctx, text, x, y, color = palette.ink, align = 'left', size = 15, weight = 700) {
        ctx.fillStyle = color;
        ctx.font = `${weight} ${size}px Nunito, system-ui, sans-serif`;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
        ctx.textAlign = 'left';
    }

    function arcArrow(ctx, cx, cy, radius, start, end, color, width = 4) {
        ctx.strokeStyle = color; ctx.lineWidth = width;
        ctx.beginPath(); ctx.arc(cx, cy, radius, start, end, false); ctx.stroke();
        const x = cx + radius * Math.cos(end), y = cy + radius * Math.sin(end);
        const tangent = end + Math.PI / 2;
        ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y);
        ctx.lineTo(x - 10 * Math.cos(tangent - .45), y - 10 * Math.sin(tangent - .45));
        ctx.lineTo(x - 10 * Math.cos(tangent + .45), y - 10 * Math.sin(tangent + .45));
        ctx.closePath(); ctx.fill();
    }

    function axes(ctx, cx, cy, width, height) {
        ctx.strokeStyle = 'rgba(51,65,85,.32)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - width, cy); ctx.lineTo(cx + width, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - height); ctx.lineTo(cx, cy + height); ctx.stroke();
    }

    function unitPoint(cx, cy, radius, theta) {
        return [cx + radius * Math.cos(theta), cy - radius * Math.sin(theta)];
    }

    function drawUnitCircle(ctx, cx, cy, radius, theta, options = {}) {
        const point = unitPoint(cx, cy, radius, theta);
        axes(ctx, cx, cy, radius + 42, radius + 42);
        ctx.strokeStyle = 'rgba(37,99,235,.28)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.stroke();
        arrow(ctx, cx, cy, point[0], point[1], options.radiusColor || palette.blue, 4, 12);
        ctx.setLineDash([6, 6]); ctx.strokeStyle = palette.coral; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(point[0], point[1]); ctx.lineTo(point[0], cy); ctx.stroke();
        ctx.strokeStyle = palette.mint;
        ctx.beginPath(); ctx.moveTo(point[0], point[1]); ctx.lineTo(cx, point[1]); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = palette.blue; ctx.beginPath(); ctx.arc(point[0], point[1], 7, 0, TAU); ctx.fill();
        arcArrow(ctx, cx, cy, radius * .28, 0, -theta, palette.gold, 3);
        label(ctx, 'θ', cx + radius * .32, cy - 12, palette.gold, 'center', 18, 800);
        label(ctx, `cos θ = ${fmt(Math.cos(theta))}`, point[0], cy + 28, palette.coral, 'center', 14, 800);
        label(ctx, `sin θ = ${fmt(Math.sin(theta))}`, cx - 14, point[1] - 10, palette.mint, 'right', 14, 800);
        return point;
    }

    const trigCopy = {
        circle: {
            stage: 'Coordinates are shadows of a radius', kicker: 'UNIT CIRCLE', title: 'Sine and cosine are coordinates',
            text: 'A unit radius at angle θ lands at (cos θ, sin θ). Its horizontal and vertical shadows are exactly the two trigonometric coordinates.',
            equation: '\\[\\mathbf u(\\theta)=\\begin{bmatrix}\\cos\\theta\\\\\\sin\\theta\\end{bmatrix}\\]',
            labels: ['Horizontal coordinate', 'Vertical coordinate', 'Radius check'],
            conclusionTitle: 'What the picture proves', conclusion: 'Because the radius remains one, the coordinate pair always satisfies cos²θ + sin²θ = 1.'
        },
        rotation: {
            stage: 'A rotation is determined by two columns', kicker: 'ROTATED BASIS', title: 'The matrix records where the axes move',
            text: 'The first column is the rotated x-axis. The second is the rotated y-axis, one quarter-turn farther. Linearity then moves every vector using the same two columns.',
            equation: '\\[R(\\theta)=\\begin{bmatrix}\\cos\\theta&-\\sin\\theta\\\\\\sin\\theta&\\cos\\theta\\end{bmatrix}\\]',
            labels: ['det R', 'Column dot product', 'Length preserved'],
            conclusionTitle: 'Why this sign pattern is forced', conclusion: 'The columns are perpendicular unit vectors with positive orientation, so the transformation preserves lengths, angles, and area.'
        },
        addition: {
            stage: 'Two turns equal one combined turn', kicker: 'COMPOSITION', title: 'Motion proves the angle-addition identities',
            text: 'Turning by B and then by A reaches the same endpoint as one turn by A+B. Therefore R(A)R(B) and R(A+B) are the same matrix entry by entry.',
            equation: '\\[\\sin(A+B)=\\sin A\\cos B+\\cos A\\sin B\\]',
            labels: ['Composed y', 'Direct y', 'Difference'],
            conclusionTitle: 'The proof', conclusion: 'Compare the lower-left entries of R(A)R(B) and R(A+B). Comparing upper-left entries simultaneously proves the cosine formula.'
        },
        'small-angle': {
            stage: 'Triangle < sector < tangent triangle', kicker: 'SQUEEZE', title: 'Circle areas determine the small-angle limits',
            text: 'For 0<h<π/2, an inscribed triangle sits inside the sector, which sits inside the tangent triangle. Their areas squeeze sin h / h to one.',
            equation: '\\[\\sin h<h<\\tan h\\Rightarrow\\cos h<\\frac{\\sin h}{h}<1\\]',
            labels: ['sin h / h', '(1−cos h) / h', 'h in radians'],
            conclusionTitle: 'Why radians matter', conclusion: 'On a unit circle the sector area is h/2 only when h is measured in radians. That is why the derivative has no conversion constant.'
        },
        derivative: {
            stage: 'Secant displacement becomes the tangent vector', kicker: 'DERIVATIVE OF SINE', title: 'The vertical tangent component is cos θ',
            text: 'The addition identity splits the sine difference quotient into two small-angle ratios. One vanishes and the other tends to one, leaving cos θ.',
            equation: '\\[\\frac{\\sin(\\theta+h)-\\sin\\theta}{h}=\\sin\\theta\\frac{\\cos h-1}{h}+\\cos\\theta\\frac{\\sin h}{h}\\to\\cos\\theta\\]',
            labels: ['Secant slope', 'cos θ', 'Absolute error'],
            conclusionTitle: 'Geometric meaning', conclusion: 'The moving radius has tangent velocity u′(θ)=(-sin θ, cos θ). Sine is its height, so its rate is the tangent’s vertical component: cos θ.'
        }
    };

    function setupTrigLab() {
        const canvas = $('#trigProofCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const buttons = $$('[data-trig-proof]');
        const thetaInput = $('#trigTheta'), aInput = $('#trigA'), bInput = $('#trigB'), hInput = $('#trigH');
        let mode = 'circle', frame = 0, animationStart = 0, renderedEquation = '';

        function values() {
            return { theta: Number(thetaInput.value), A: Number(aInput.value), B: Number(bInput.value), h: Number(hInput.value) };
        }

        function drawCircle(v) {
            drawUnitCircle(ctx, 500, 280, 185, v.theta);
            label(ctx, 'The same point has three simultaneous readings', 500, 52, palette.ink, 'center', 18, 800);
            label(ctx, `angle θ = ${fmt(v.theta, 2)} radians`, 500, 500, palette.muted, 'center', 15, 700);
        }

        function drawRotation(v) {
            const cx = 500, cy = 285, r = 170;
            axes(ctx, cx, cy, 250, 215);
            const i = unitPoint(cx, cy, r, v.theta);
            const j = unitPoint(cx, cy, r, v.theta + Math.PI / 2);
            arrow(ctx, cx, cy, i[0], i[1], palette.blue, 5, 13);
            arrow(ctx, cx, cy, j[0], j[1], palette.violet, 5, 13);
            ctx.strokeStyle = 'rgba(37,99,235,.22)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(i[0], i[1]); ctx.lineTo(i[0] + j[0] - cx, i[1] + j[1] - cy); ctx.lineTo(j[0], j[1]); ctx.stroke();
            label(ctx, 'column 1', i[0] + 12, i[1] - 12, palette.blue, 'left', 15, 800);
            label(ctx, '(cos θ, sin θ)', i[0] + 12, i[1] + 10, palette.blue, 'left', 13, 700);
            label(ctx, 'column 2', j[0] - 12, j[1] - 12, palette.violet, 'right', 15, 800);
            label(ctx, '(−sin θ, cos θ)', j[0] - 12, j[1] + 10, palette.violet, 'right', 13, 700);
            arcArrow(ctx, cx, cy, 72, 0, -v.theta, palette.gold, 4);
            label(ctx, 'Every vector keeps its length because the columns remain orthonormal', 500, 515, palette.muted, 'center', 15, 700);
        }

        function drawAddition(v) {
            const cx = 410, cy = 300, r = 185;
            axes(ctx, cx, cy, 235, 220);
            ctx.strokeStyle = 'rgba(37,99,235,.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
            const pB = unitPoint(cx, cy, r, v.B), pAB = unitPoint(cx, cy, r, v.A + v.B);
            arrow(ctx, cx, cy, pB[0], pB[1], palette.violet, 3, 10);
            arrow(ctx, cx, cy, pAB[0], pAB[1], palette.blue, 5, 13);
            arcArrow(ctx, cx, cy, 55, 0, -v.B, palette.violet, 4);
            arcArrow(ctx, cx, cy, 92, -v.B, -(v.A + v.B), palette.coral, 4);
            arcArrow(ctx, cx, cy, 130, 0, -(v.A + v.B), palette.gold, 3);
            label(ctx, 'B', cx + 74, cy - 16, palette.violet, 'center', 16, 800);
            label(ctx, 'A', cx + 30, cy - 108, palette.coral, 'center', 16, 800);
            label(ctx, 'A + B', cx + 132, cy - 112, palette.gold, 'center', 16, 800);
            ctx.setLineDash([6, 6]); ctx.strokeStyle = palette.mint; ctx.beginPath(); ctx.moveTo(pAB[0], pAB[1]); ctx.lineTo(pAB[0], cy); ctx.stroke(); ctx.setLineDash([]);
            label(ctx, 'same endpoint', pAB[0] + 12, pAB[1] - 12, palette.blue, 'left', 15, 800);
            label(ctx, 'Matrix equality', 735, 130, palette.ink, 'center', 16, 800);
            label(ctx, 'R(A) R(B)', 735, 180, palette.violet, 'center', 22, 800);
            label(ctx, '=', 735, 225, palette.muted, 'center', 22, 800);
            label(ctx, 'R(A + B)', 735, 270, palette.blue, 'center', 22, 800);
            label(ctx, 'compare row 2, column 1', 735, 330, palette.muted, 'center', 14, 700);
            label(ctx, 'sin A cos B', 735, 380, palette.coral, 'center', 17, 800);
            label(ctx, '+ cos A sin B', 735, 414, palette.coral, 'center', 17, 800);
            label(ctx, '= sin(A + B)', 735, 462, palette.mint, 'center', 17, 800);
        }

        function drawSmallAngle(v) {
            const h = clamp(Math.abs(v.h), .02, 1.1), cx = 390, cy = 410, r = 255;
            const p = unitPoint(cx, cy, r, h), tangentX = cx + r, tangentY = cy - r * Math.tan(h);
            axes(ctx, cx, cy, 320, 290);
            ctx.fillStyle = 'rgba(37,99,235,.10)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, 0, -h, true); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(5,150,105,.12)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.lineTo(cx + r, cy); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(225,29,72,.08)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, tangentY); ctx.lineTo(cx + r, cy); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = palette.blue; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, -h, true); ctx.stroke();
            arrow(ctx, cx, cy, p[0], p[1], palette.mint, 3, 10);
            ctx.strokeStyle = palette.coral; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + r, cy + 30); ctx.lineTo(cx + r, tangentY - 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, tangentY); ctx.stroke();
            arcArrow(ctx, cx, cy, 70, 0, -h, palette.gold, 3);
            label(ctx, 'area ½ sin h', 320, 318, palette.mint, 'center', 15, 800);
            label(ctx, 'area ½ h', 465, 245, palette.blue, 'center', 15, 800);
            label(ctx, 'area ½ tan h', 655, 210, palette.coral, 'center', 15, 800);
            label(ctx, 'Divide every area by ½, then by h', 720, 350, palette.ink, 'center', 17, 800);
            label(ctx, 'cos h  <  sin h / h  <  1', 720, 400, palette.blue, 'center', 22, 800);
            label(ctx, 'both outer terms → 1', 720, 442, palette.muted, 'center', 15, 700);
            label(ctx, 'therefore sin h / h → 1', 720, 485, palette.mint, 'center', 17, 800);
        }

        function drawDerivative(v) {
            const cx = 275, cy = 278, r = 165, h = Math.max(.02, v.h);
            const p = drawUnitCircle(ctx, cx, cy, r, v.theta);
            const q = unitPoint(cx, cy, r, v.theta + h);
            arrow(ctx, p[0], p[1], q[0], q[1], palette.coral, 3, 10);
            const tx = p[0] - Math.sin(v.theta) * 90, ty = p[1] - Math.cos(v.theta) * 90;
            arrow(ctx, p[0], p[1], tx, ty, palette.gold, 4, 12);
            label(ctx, 'secant Δu', (p[0] + q[0]) / 2 + 8, (p[1] + q[1]) / 2 - 10, palette.coral, 'left', 13, 800);
            label(ctx, 'tangent u′(θ)', tx - 8, ty - 10, palette.gold, 'right', 13, 800);
            const gx = 540, gy = 280, xScale = 58, yScale = 145;
            axes(ctx, 735, gy, 230, 190);
            ctx.strokeStyle = palette.blue; ctx.lineWidth = 4; ctx.beginPath();
            for (let i = 0; i <= 420; i += 1) {
                const x = lerp(-Math.PI, Math.PI, i / 420), px = 735 + x * xScale, py = gy - Math.sin(x) * yScale;
                if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
            const px = 735 + v.theta * xScale, py = gy - Math.sin(v.theta) * yScale;
            const slope = Math.cos(v.theta), dx = 95;
            ctx.strokeStyle = palette.gold; ctx.lineWidth = 4; ctx.beginPath();
            ctx.moveTo(px - dx, py + slope * dx * yScale / xScale); ctx.lineTo(px + dx, py - slope * dx * yScale / xScale); ctx.stroke();
            ctx.fillStyle = palette.blue; ctx.beginPath(); ctx.arc(px, py, 7, 0, TAU); ctx.fill();
            label(ctx, 'height = sin θ', 735, 68, palette.blue, 'center', 16, 800);
            label(ctx, 'tangent slope = cos θ', 735, 508, palette.gold, 'center', 17, 800);
        }

        function updateCopy(v) {
            const copy = trigCopy[mode];
            $('#trigStageLabel').textContent = copy.stage; $('#trigProofKicker').textContent = copy.kicker;
            $('#trigProofTitle').textContent = copy.title; $('#trigProofText').textContent = copy.text;
            if (copy.equation !== renderedEquation) { setMath($('#trigProofEquation'), copy.equation); renderedEquation = copy.equation; }
            $('#trigMetricALabel').textContent = copy.labels[0]; $('#trigMetricBLabel').textContent = copy.labels[1]; $('#trigMetricCLabel').textContent = copy.labels[2];
            $('#trigConclusionTitle').textContent = copy.conclusionTitle; $('#trigConclusion').textContent = copy.conclusion;
            let metrics;
            if (mode === 'circle') metrics = [fmt(Math.cos(v.theta)), fmt(Math.sin(v.theta)), fmt(Math.cos(v.theta) ** 2 + Math.sin(v.theta) ** 2)];
            else if (mode === 'rotation') metrics = ['1.000', fmt(Math.cos(v.theta) * -Math.sin(v.theta) + Math.sin(v.theta) * Math.cos(v.theta)), '1.000'];
            else if (mode === 'addition') { const composed = Math.sin(v.A) * Math.cos(v.B) + Math.cos(v.A) * Math.sin(v.B), direct = Math.sin(v.A + v.B); metrics = [fmt(composed), fmt(direct), fmt(Math.abs(composed - direct), 6)]; }
            else if (mode === 'small-angle') metrics = [fmt(Math.sin(v.h) / v.h), fmt((1 - Math.cos(v.h)) / v.h), fmt(v.h, 2)];
            else { const secant = (Math.sin(v.theta + v.h) - Math.sin(v.theta)) / v.h, exact = Math.cos(v.theta); metrics = [fmt(secant), fmt(exact), fmt(Math.abs(secant - exact))]; }
            $('#trigMetricA').textContent = metrics[0]; $('#trigMetricB').textContent = metrics[1]; $('#trigMetricC').textContent = metrics[2];
        }

        function render() {
            const v = values();
            $('#trigThetaValue').textContent = fmt(v.theta, 2); $('#trigAValue').textContent = fmt(v.A, 2); $('#trigBValue').textContent = fmt(v.B, 2); $('#trigHValue').textContent = fmt(v.h, 2);
            prepare(ctx, canvas);
            if (mode === 'circle') drawCircle(v);
            else if (mode === 'rotation') drawRotation(v);
            else if (mode === 'addition') drawAddition(v);
            else if (mode === 'small-angle') drawSmallAngle(v);
            else drawDerivative(v);
            updateCopy(v);
        }

        buttons.forEach(button => button.addEventListener('click', () => { mode = button.dataset.trigProof; setActive(buttons, 'trigProof', mode); render(); }));
        [thetaInput, aInput, bInput, hInput].forEach(input => input.addEventListener('input', render));
        $('#trigAnimate').addEventListener('click', () => {
            cancelAnimationFrame(frame); animationStart = performance.now();
            const initial = values();
            const animate = now => {
                const t = clamp((now - animationStart) / 5200, 0, 1), eased = (1 - Math.cos(t * Math.PI)) / 2;
                if (mode === 'addition') { aInput.value = String(lerp(-.2, 1.15, eased)); bInput.value = String(lerp(.15, 1.0, eased)); }
                else if (mode === 'small-angle' || mode === 'derivative') hInput.value = String(lerp(Math.max(.8, initial.h), .02, eased));
                else thetaInput.value = String(lerp(-Math.PI, Math.PI, eased));
                render();
                if (t < 1 && !reducedMotion) frame = requestAnimationFrame(animate);
            };
            frame = requestAnimationFrame(animate);
        });
        render();
    }

    function mulberry32(seed) {
        return () => {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    function normal(random) {
        const u = Math.max(1e-9, random()), v = random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
    }

    const probabilityCopy = {
        events: ['Events are regions of a sample space', 'SAMPLE SPACE', 'Probability is normalized area', 'An event is a set of outcomes. Intersections are overlap; unions include both regions but count overlap only once.', '\\[P(A\\cup B)=P(A)+P(B)-P(A\\cap B)\\]', ['P(A)', 'Observed frequency', '|frequency − p|'], 'A classifier estimates mass over labels; calibration compares predicted probability with observed frequency.'],
        bayes: ['Evidence filters prior probability mass', 'BAYES UPDATE', 'Posterior means surviving mass after evidence', 'Split the population by the prior, filter each group by its likelihood, then compare only the evidence-positive survivors.', '\\[P(H\\mid D)=\\frac{P(D\\mid H)P(H)}{P(D\\mid H)P(H)+P(D\\mid H^c)P(H^c)}\\]', ['Prior P(H)', 'Posterior P(H|D)', 'Evidence P(D)'], 'Probabilistic models update plausible explanations of an observation in the same way.'],
        distribution: ['Probability mass has shape, center, and spread', 'DISTRIBUTIONS', 'A distribution describes every possible value', 'A Bernoulli trial has two masses; n independent trials produce a binomial count whose center is np and variance is np(1−p).', '\\[P(K=k)=\\binom nkp^k(1-p)^{n-k},\\quad E[K]=np\\]', ['Expected count np', 'Std. deviation', 'Observed mean'], 'Loss functions arise by assigning a distribution to labels and taking negative log-likelihood.'],
        clt: ['Repeated averages form a sampling distribution', 'CENTRAL LIMIT THEOREM', 'Averages become stable and approximately Gaussian', 'Even when individual outcomes are binary, repeated sample means cluster around p. Their standard error shrinks like 1/√n.', '\\[\\frac{\\bar X-p}{\\sqrt{p(1-p)/n}}\\approx\\mathcal N(0,1)\\]', ['Mean of means', 'Predicted SE', 'Observed SE'], 'A minibatch gradient is a sample mean; larger batches reduce its noise with the same square-root law.'],
        inference: ['An estimate changes when the sample changes', 'STATISTICAL INFERENCE', 'Intervals describe a repeatable procedure', 'Each sample gives a different estimate and interval. Over repeated samples, about 95% of correctly constructed intervals cover the fixed truth.', '\\[\\hat p\\pm1.96\\sqrt{\\frac{\\hat p(1-\\hat p)}{n}}\\]', ['Estimate p̂', 'Interval half-width', 'Coverage in simulation'], 'Model scores and A/B results need uncertainty intervals, not only point estimates.']
    };

    function setupProbabilityLab() {
        const canvas = $('#probabilityDeepCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d'), buttons = $$('[data-prob-mode]');
        const pInput = $('#probP'), nInput = $('#probN'), trialsInput = $('#probTrials');
        let mode = 'events', seed = 41, samples = [], renderedEquation = '';

        function values() { return { p: Number(pInput.value), n: Number(nInput.value), trials: Number(trialsInput.value) }; }
        function resample(v) {
            const random = mulberry32(seed++);
            samples = Array.from({ length: v.trials }, () => {
                let successes = 0;
                for (let i = 0; i < v.n; i += 1) if (random() < v.p) successes += 1;
                return successes / v.n;
            });
        }

        function drawEvents(v) {
            const cols = 20, rows = 10, total = cols * rows, random = mulberry32(seed + 7);
            let hits = 0;
            label(ctx, 'Ω — all possible outcomes', 70, 70, palette.ink, 'left', 18, 800);
            for (let i = 0; i < total; i += 1) {
                const hit = random() < v.p; if (hit) hits += 1;
                const x = 78 + (i % cols) * 42, y = 104 + Math.floor(i / cols) * 39;
                ctx.fillStyle = hit ? 'rgba(37,99,235,.78)' : 'rgba(100,116,139,.16)';
                ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
            }
            ctx.strokeStyle = palette.blue; ctx.lineWidth = 3; ctx.setLineDash([8, 7]); ctx.strokeRect(55, 82, 865 * v.p, 410); ctx.setLineDash([]);
            label(ctx, 'A', 68, 112, palette.blue, 'left', 20, 800);
            label(ctx, `${hits} of ${total} sampled outcomes landed in A`, 500, 530, palette.muted, 'center', 16, 700);
            return [v.p, hits / total, Math.abs(hits / total - v.p)];
        }

        function drawBayes(v) {
            const sensitivity = .85, falsePositive = .12, total = 200;
            const h = Math.round(total * v.p), notH = total - h, truePos = Math.round(h * sensitivity), falsePos = Math.round(notH * falsePositive);
            const posterior = truePos / Math.max(1, truePos + falsePos), evidence = (truePos + falsePos) / total;
            label(ctx, 'Prior population', 135, 68, palette.ink, 'center', 17, 800);
            label(ctx, 'Evidence filter', 500, 68, palette.ink, 'center', 17, 800);
            label(ctx, 'Posterior among positives', 840, 68, palette.ink, 'center', 17, 800);
            const drawPeople = (count, x0, y0, color, faint = false) => {
                for (let i = 0; i < count; i += 1) {
                    const x = x0 + (i % 10) * 18, y = y0 + Math.floor(i / 10) * 18;
                    ctx.fillStyle = faint ? 'rgba(100,116,139,.12)' : color; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
                }
            };
            drawPeople(h, 48, 105, palette.blue); drawPeople(notH, 48, 245, 'rgba(100,116,139,.35)');
            label(ctx, `H: ${h}`, 135, 225, palette.blue, 'center', 14, 800); label(ctx, `not H: ${notH}`, 135, 500, palette.muted, 'center', 14, 800);
            arrow(ctx, 265, 285, 410, 285, palette.gold, 3, 10);
            drawPeople(truePos, 420, 120, palette.blue); drawPeople(falsePos, 420, 280, palette.coral);
            label(ctx, `true positives ${truePos}`, 500, 245, palette.blue, 'center', 14, 800); label(ctx, `false positives ${falsePos}`, 500, 410, palette.coral, 'center', 14, 800);
            arrow(ctx, 595, 285, 720, 285, palette.gold, 3, 10);
            const radius = 110;
            ctx.fillStyle = 'rgba(225,29,72,.18)'; ctx.beginPath(); ctx.moveTo(840, 285); ctx.arc(840, 285, radius, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - posterior)); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(37,99,235,.82)'; ctx.beginPath(); ctx.moveTo(840, 285); ctx.arc(840, 285, radius, -Math.PI / 2 + TAU * (1 - posterior), -Math.PI / 2 + TAU); ctx.closePath(); ctx.fill();
            label(ctx, `${fmt(posterior * 100, 1)}%`, 840, 295, palette.ink, 'center', 27, 800); label(ctx, 'posterior', 840, 322, palette.ink, 'center', 14, 700);
            return [v.p, posterior, evidence];
        }

        function binomialProbability(n, k, p) {
            let coefficient = 1;
            for (let i = 1; i <= k; i += 1) coefficient *= (n - (k - i)) / i;
            return coefficient * p ** k * (1 - p) ** (n - k);
        }

        function drawDistribution(v) {
            const n = Math.min(v.n, 50), probs = Array.from({ length: n + 1 }, (_, k) => binomialProbability(n, k, v.p));
            const max = Math.max(...probs), left = 80, bottom = 470, width = 840, height = 340, bar = width / (n + 1);
            axes(ctx, left, bottom, 0, height);
            ctx.strokeStyle = 'rgba(51,65,85,.35)'; ctx.beginPath(); ctx.moveTo(left, bottom); ctx.lineTo(left + width, bottom); ctx.stroke();
            probs.forEach((probability, k) => {
                const h = probability / max * height, x = left + k * bar;
                ctx.fillStyle = Math.abs(k - n * v.p) < 1 ? palette.coral : 'rgba(37,99,235,.66)';
                ctx.fillRect(x + 1, bottom - h, Math.max(2, bar - 2), h);
            });
            const observed = samples.reduce((sum, value) => sum + value * n, 0) / Math.max(1, samples.length);
            const meanX = left + n * v.p * bar + bar / 2;
            ctx.strokeStyle = palette.coral; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(meanX, 100); ctx.lineTo(meanX, bottom); ctx.stroke(); ctx.setLineDash([]);
            label(ctx, `K successes in n = ${n} trials`, 500, 55, palette.ink, 'center', 19, 800);
            label(ctx, `mean np = ${fmt(n * v.p, 2)}`, meanX, 90, palette.coral, 'center', 14, 800);
            label(ctx, '0', left, 500, palette.muted, 'center', 13, 700); label(ctx, String(n), left + width, 500, palette.muted, 'center', 13, 700);
            return [n * v.p, Math.sqrt(n * v.p * (1 - v.p)), observed];
        }

        function histogram(data, bins, min, max) {
            const counts = Array(bins).fill(0);
            data.forEach(value => { const index = clamp(Math.floor((value - min) / (max - min) * bins), 0, bins - 1); counts[index] += 1; });
            return counts;
        }

        function drawClt(v) {
            const min = Math.max(0, v.p - .5), max = Math.min(1, v.p + .5), counts = histogram(samples, 24, min, max), peak = Math.max(...counts, 1);
            const left = 90, bottom = 470, width = 820, height = 330, bar = width / counts.length;
            counts.forEach((count, i) => { const h = count / peak * height; ctx.fillStyle = 'rgba(5,150,105,.7)'; ctx.fillRect(left + i * bar + 2, bottom - h, bar - 4, h); });
            const predictedSe = Math.sqrt(v.p * (1 - v.p) / v.n), observedMean = samples.reduce((a, b) => a + b, 0) / samples.length;
            const observedSe = Math.sqrt(samples.reduce((sum, value) => sum + (value - observedMean) ** 2, 0) / Math.max(1, samples.length - 1));
            const meanX = left + (v.p - min) / (max - min) * width;
            ctx.strokeStyle = palette.coral; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(meanX, 105); ctx.lineTo(meanX, bottom); ctx.stroke();
            label(ctx, `${v.trials} repeated sample means, each averaging n = ${v.n} binary outcomes`, 500, 55, palette.ink, 'center', 18, 800);
            label(ctx, `truth p = ${fmt(v.p, 2)}`, meanX, 92, palette.coral, 'center', 14, 800);
            label(ctx, fmt(min, 2), left, 505, palette.muted, 'center', 13, 700); label(ctx, fmt(max, 2), left + width, 505, palette.muted, 'center', 13, 700);
            return [observedMean, predictedSe, observedSe];
        }

        function drawInference(v) {
            const random = mulberry32(seed + 91), intervals = 28, xLeft = 200, xRight = 920, span = .75;
            let covered = 0, selected = null;
            label(ctx, 'Repeated 95% confidence intervals', 500, 50, palette.ink, 'center', 19, 800);
            for (let row = 0; row < intervals; row += 1) {
                let successes = 0; for (let i = 0; i < v.n; i += 1) if (random() < v.p) successes += 1;
                const phat = successes / v.n, se = Math.sqrt(Math.max(.0001, phat * (1 - phat) / v.n)), half = 1.96 * se;
                const low = phat - half, high = phat + half, covers = low <= v.p && high >= v.p;
                if (covers) covered += 1; if (row === 6) selected = [phat, half];
                const y = 82 + row * 15.5, map = value => xLeft + (value - (v.p - span / 2)) / span * (xRight - xLeft);
                ctx.strokeStyle = covers ? 'rgba(5,150,105,.68)' : palette.coral; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(map(low), y); ctx.lineTo(map(high), y); ctx.stroke();
                ctx.fillStyle = covers ? palette.mint : palette.coral; ctx.beginPath(); ctx.arc(map(phat), y, 3.5, 0, TAU); ctx.fill();
            }
            const truthX = xLeft + .5 * (xRight - xLeft);
            ctx.strokeStyle = palette.blue; ctx.lineWidth = 3; ctx.setLineDash([8, 5]); ctx.beginPath(); ctx.moveTo(truthX, 72); ctx.lineTo(truthX, 520); ctx.stroke(); ctx.setLineDash([]);
            label(ctx, `fixed truth p = ${fmt(v.p, 2)}`, truthX, 544, palette.blue, 'center', 15, 800);
            return [selected[0], selected[1], covered / intervals];
        }

        function updateCopy(metrics) {
            const copy = probabilityCopy[mode];
            $('#probStageLabel').textContent = copy[0]; $('#probKicker').textContent = copy[1]; $('#probTitle').textContent = copy[2]; $('#probDescription').textContent = copy[3];
            if (copy[4] !== renderedEquation) { setMath($('#probEquation'), copy[4]); renderedEquation = copy[4]; }
            copy[5].forEach((value, index) => { $('#probMetric' + 'ABC'[index] + 'Label').textContent = value; $('#probMetric' + 'ABC'[index]).textContent = mode === 'inference' && index === 2 ? `${fmt(metrics[index] * 100, 1)}%` : fmt(metrics[index]); });
            $('#probBridge').textContent = copy[6];
        }

        function render(resampleFirst = false) {
            const v = values(); if (resampleFirst || !samples.length) resample(v);
            $('#probPValue').textContent = fmt(v.p, 2); $('#probNValue').textContent = String(v.n); $('#probTrialsValue').textContent = String(v.trials);
            prepare(ctx, canvas);
            const metrics = mode === 'events' ? drawEvents(v) : mode === 'bayes' ? drawBayes(v) : mode === 'distribution' ? drawDistribution(v) : mode === 'clt' ? drawClt(v) : drawInference(v);
            updateCopy(metrics);
        }
        buttons.forEach(button => button.addEventListener('click', () => { mode = button.dataset.probMode; setActive(buttons, 'probMode', mode); render(true); }));
        [pInput, nInput, trialsInput].forEach(input => input.addEventListener('input', () => render(true)));
        $('#probResample').addEventListener('click', () => render(true));
        render(true);
    }

    const pythonExamples = {
        sine: `import math\n\ntheta = 0.8\nprint("Why d/dθ sin(θ) = cos(θ)\\n")\nprint(" h        secant slope       cos(θ)          error")\nfor h in [1, .5, .1, .01, .001]:\n    secant = (math.sin(theta + h) - math.sin(theta)) / h\n    exact = math.cos(theta)\n    print(f"{h:<8g} {secant:>14.9f} {exact:>14.9f} {abs(secant-exact):>14.9f}")`,
        rotation: `import math\n\ndef rotation(angle):\n    c, s = math.cos(angle), math.sin(angle)\n    return ((c, -s), (s, c))\n\ndef multiply(A, B):\n    return tuple(tuple(sum(A[i][k]*B[k][j] for k in range(2)) for j in range(2)) for i in range(2))\n\nA, B = 0.65, 0.90\ncomposed = multiply(rotation(A), rotation(B))\ndirect = rotation(A + B)\nprint("R(A)R(B):", composed)\nprint("R(A+B): ", direct)\nprint("\\nsin(A+B) from composition:", math.sin(A)*math.cos(B) + math.cos(A)*math.sin(B))\nprint("sin(A+B) directly:       ", math.sin(A+B))`,
        bayes: `prior = 0.01\nsensitivity = 0.95\nfalse_positive_rate = 0.05\n\ntrue_positive_mass = sensitivity * prior\nfalse_positive_mass = false_positive_rate * (1-prior)\nevidence = true_positive_mass + false_positive_mass\nposterior = true_positive_mass / evidence\n\nprint(f"prior probability:        {prior:.2%}")\nprint(f"true-positive mass:       {true_positive_mass:.4f}")\nprint(f"false-positive mass:      {false_positive_mass:.4f}")\nprint(f"posterior after positive: {posterior:.2%}")\nprint("\\nThe test is accurate, but the rare base rate still matters.")`,
        clt: `import random, math, statistics\nrandom.seed(7)\np, n, experiments = 0.35, 40, 1000\nmeans = [sum(random.random() < p for _ in range(n))/n for _ in range(experiments)]\nobserved_mean = statistics.mean(means)\nobserved_se = statistics.stdev(means)\npredicted_se = math.sqrt(p*(1-p)/n)\n\nprint(f"truth p:                  {p:.4f}")\nprint(f"mean of sample means:     {observed_mean:.4f}")\nprint(f"observed standard error:  {observed_se:.4f}")\nprint(f"predicted sqrt(p(1-p)/n): {predicted_se:.4f}")\nprint(f"four times more data SE:  {math.sqrt(p*(1-p)/(4*n)):.4f}")`,
        gradient: `# Gradient descent on L(w) = (w-3)^2\nw = -4.0\nlearning_rate = 0.15\nprint("step       w          loss       gradient")\nfor step in range(12):\n    loss = (w - 3)**2\n    gradient = 2*(w - 3)\n    print(f"{step:>3} {w:>10.5f} {loss:>11.5f} {gradient:>11.5f}")\n    w -= learning_rate * gradient\nprint("\\nEach update subtracts the local slope, so w moves toward 3.")`
    };

    function setupPythonLab() {
        const editor = $('#pythonEditor'); if (!editor) return;
        const example = $('#pythonExample'), run = $('#pythonRun'), reset = $('#pythonReset'), status = $('#pythonStatus'), output = $('#pythonOutput');
        let runtimePromise = null;
        const loadExample = () => { editor.value = pythonExamples[example.value]; output.textContent = 'Run the code to inspect the numerical experiment.'; status.textContent = 'Ready'; };
        async function runtime() {
            if (!window.loadPyodide) throw new Error('The Python runtime could not be loaded. Check the network connection and try again.');
            if (!runtimePromise) {
                status.textContent = 'Loading Python…';
                runtimePromise = window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.2/full/' });
            }
            return runtimePromise;
        }
        run.addEventListener('click', async () => {
            run.disabled = true; output.textContent = ''; status.textContent = 'Running…';
            try {
                const pyodide = await runtime(); const lines = [];
                pyodide.setStdout({ batched: text => lines.push(text) }); pyodide.setStderr({ batched: text => lines.push(text) });
                const result = await pyodide.runPythonAsync(editor.value);
                if (result !== undefined && result !== null) lines.push(String(result));
                output.textContent = lines.join('\n').trim() || 'Code completed without printed output.'; status.textContent = 'Complete';
                if (result?.destroy) result.destroy();
            } catch (error) {
                output.textContent = `${error.name || 'Python error'}: ${error.message || error}`; status.textContent = 'Needs attention';
            } finally { run.disabled = false; }
        });
        example.addEventListener('change', loadExample); reset.addEventListener('click', loadExample); loadExample();
    }

    function drawProbabilityLecture(ctx, canvas, lecture, time) {
        const scene = lecture.scene, pulse = (time % 8000) / 8000, cx = canvas.width / 2, cy = canvas.height / 2;
        if (scene === 'sample-space' || scene === 'conditional' || scene === 'bayes-update') {
            const radius = 105, shift = scene === 'conditional' ? 105 + pulse * 70 : 125;
            ctx.fillStyle = 'rgba(37,99,235,.2)'; ctx.beginPath(); ctx.arc(cx - shift / 2, cy, radius, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(225,29,72,.18)'; ctx.beginPath(); ctx.arc(cx + shift / 2, cy, radius, 0, TAU); ctx.fill();
            ctx.strokeStyle = palette.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx - shift / 2, cy, radius, 0, TAU); ctx.stroke();
            ctx.strokeStyle = palette.coral; ctx.beginPath(); ctx.arc(cx + shift / 2, cy, radius, 0, TAU); ctx.stroke();
            label(ctx, scene === 'bayes-update' ? 'prior × likelihood' : 'A', cx - 120, cy, palette.blue, 'center', 18, 800);
            label(ctx, scene === 'bayes-update' ? 'normalize' : 'B', cx + 120, cy, palette.coral, 'center', 18, 800);
            label(ctx, scene === 'bayes-update' ? 'posterior mass' : 'intersection', cx, cy + 155, palette.mint, 'center', 16, 800);
            return true;
        }
        if (scene === 'least-squares' || scene === 'variance-covariance') {
            axes(ctx, cx, cy, 400, 200);
            const random = mulberry32(12), slope = scene === 'least-squares' ? .65 : .35 + pulse * .8;
            for (let i = 0; i < 80; i += 1) { const x = (random() - .5) * 700, y = -slope * x + normal(random) * 55; ctx.fillStyle = 'rgba(37,99,235,.55)'; ctx.beginPath(); ctx.arc(cx + x, cy + y, 4, 0, TAU); ctx.fill(); }
            ctx.strokeStyle = palette.coral; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 390, cy + slope * 390); ctx.lineTo(cx + 390, cy - slope * 390); ctx.stroke();
            label(ctx, scene === 'least-squares' ? 'residuals are perpendicular at the least-squares projection' : 'covariance tracks joint directional spread', cx, 55, palette.ink, 'center', 17, 800);
            return true;
        }
        if (['clt-sampling', 'inference', 'continuous-distributions', 'random-variable', 'discrete-distributions'].includes(scene)) {
            const sigma = 110 + 30 * Math.sin(time * .0004), baseline = 405;
            ctx.strokeStyle = palette.mint; ctx.lineWidth = 5; ctx.beginPath();
            for (let x = 70; x <= 930; x += 4) { const z = (x - cx) / sigma, y = baseline - Math.exp(-z * z / 2) * 285; if (x === 70) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
            ctx.strokeStyle = palette.coral; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(cx, 100); ctx.lineTo(cx, baseline); ctx.stroke(); ctx.setLineDash([]);
            label(ctx, scene === 'clt-sampling' ? 'sampling distribution of the mean' : scene === 'inference' ? 'estimate ± uncertainty' : 'probability is area, not curve height', cx, 65, palette.ink, 'center', 18, 800);
            label(ctx, 'center', cx, baseline + 42, palette.coral, 'center', 14, 800);
            return true;
        }
        if (scene === 'information' || scene === 'likelihood' || scene === 'bayesian-inference') {
            const positions = [180, 390, 610, 820], heights = positions.map((_, i) => 90 + 230 * Math.abs(Math.sin(time * .00035 + i * 1.4)));
            positions.forEach((x, i) => { ctx.fillStyle = i === 1 ? palette.coral : 'rgba(37,99,235,.65)'; ctx.fillRect(x - 55, 420 - heights[i], 110, heights[i]); label(ctx, `p${i + 1}`, x, 455, palette.muted, 'center', 14, 700); });
            label(ctx, scene === 'information' ? 'surprise grows as assigned probability shrinks' : scene === 'likelihood' ? 'data reshapes plausibility over parameters' : 'prior × likelihood → posterior', cx, 62, palette.ink, 'center', 18, 800);
            return true;
        }
        if (scene === 'counting') {
            const levels = [[500, 80], [330, 220], [670, 220], [220, 390], [440, 390], [560, 390], [780, 390]];
            [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]].forEach(([a,b]) => arrow(ctx, levels[a][0], levels[a][1]+15, levels[b][0], levels[b][1]-15, 'rgba(37,99,235,.45)', 2, 7));
            levels.forEach((p, i) => { ctx.fillStyle = i ? palette.panel : palette.gold; ctx.strokeStyle = i ? palette.blue : palette.gold; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1], 22, 0, TAU); ctx.fill(); ctx.stroke(); });
            label(ctx, 'multiply choices along branches; add distinct leaves', cx, 485, palette.ink, 'center', 18, 800); return true;
        }
        return false;
    }

    window.MathVisualScenes = {
        drawLectureScene(ctx, canvas, lecture, time) {
            if (!lecture) return false;
            if (['unit-circle-proof', 'rotation-addition-proof', 'sine-derivative-proof'].includes(lecture.scene)) {
                if (lecture.scene === 'unit-circle-proof') drawUnitCircle(ctx, canvas.width / 2, canvas.height / 2, 175, time * .00022);
                else if (lecture.scene === 'rotation-addition-proof') {
                    const a = .7 + .3 * Math.sin(time * .0002), b = .9;
                    const cx = canvas.width / 2, cy = canvas.height / 2, r = 175, end = unitPoint(cx, cy, r, a + b);
                    axes(ctx, cx, cy, 260, 220); arrow(ctx, cx, cy, end[0], end[1], palette.blue, 5, 13);
                    arcArrow(ctx, cx, cy, 70, 0, -b, palette.violet, 4); arcArrow(ctx, cx, cy, 105, -b, -(a+b), palette.coral, 4); arcArrow(ctx, cx, cy, 145, 0, -(a+b), palette.gold, 3);
                    label(ctx, 'R(A)R(B) = R(A+B)', cx, 55, palette.ink, 'center', 20, 800);
                } else {
                    const theta = .8, h = .8 * Math.exp(-((time % 10000) / 2400));
                    const cx = 360, cy = 265, r = 165, p = unitPoint(cx, cy, r, theta), q = unitPoint(cx, cy, r, theta+h);
                    drawUnitCircle(ctx, cx, cy, r, theta); arrow(ctx, p[0], p[1], q[0], q[1], palette.coral, 4, 11);
                    label(ctx, `h → ${fmt(h, 3)}`, 760, 180, palette.coral, 'center', 22, 800); label(ctx, 'secant → tangent', 760, 235, palette.ink, 'center', 20, 800); label(ctx, 'vertical rate → cos θ', 760, 290, palette.mint, 'center', 20, 800);
                }
                return true;
            }
            return drawProbabilityLecture(ctx, canvas, lecture, time);
        }
    };

    function initialize() { setupTrigLab(); setupProbabilityLab(); setupPythonLab(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
