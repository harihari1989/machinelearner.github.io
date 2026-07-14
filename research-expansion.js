(() => {
    'use strict';

    const byId = id => document.getElementById(id);
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    function cssColor(name, fallback) {
        return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
    }

    function palette() {
        return {
            ink: cssColor('--ink', '#1f2937'),
            muted: cssColor('--ink-soft', '#475569'),
            paper: cssColor('--canvas-bg', '#f8fafc'),
            grid: cssColor('--grid', '#e2e8f0'),
            axis: cssColor('--axis', '#94a3b8'),
            a: cssColor('--accent-1', '#38bdf8'),
            b: cssColor('--accent-2', '#fb7185'),
            c: cssColor('--accent-3', '#34d399'),
            d: cssColor('--accent-4', '#f59e0b')
        };
    }

    function clearCanvas(ctx, colors) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = colors.paper;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function roundedRect(ctx, x, y, width, height, radius, fill, stroke, lineWidth = 2) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    }

    function line(ctx, x1, y1, x2, y2, color, width = 2, dash = []) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash(dash);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.restore();
    }

    function arrow(ctx, x1, y1, x2, y2, color, width = 2, head = 9) {
        line(ctx, x1, y1, x2, y2, color, width);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(angle - Math.PI / 6), y2 - head * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(x2 - head * Math.cos(angle + Math.PI / 6), y2 - head * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function circle(ctx, x, y, radius, fill, stroke, lineWidth = 2) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
        }
    }

    function label(ctx, text, x, y, color, size = 16, align = 'center', weight = 700) {
        ctx.fillStyle = color;
        ctx.font = `${weight} ${size}px Nunito, sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight, color, size = 14, align = 'center', maxLines = 3) {
        ctx.fillStyle = color;
        ctx.font = `600 ${size}px Nunito, sans-serif`;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';
        const words = String(text).split(/\s+/);
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
                if (lines.length === maxLines - 1) break;
            } else {
                current = test;
            }
        }
        if (current && lines.length < maxLines) lines.push(current);
        lines.forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
    }

    function shortConcept(text) {
        const first = String(text).split(/[.;:]/)[0].trim();
        const words = first.split(/\s+/);
        return words.length > 7 ? `${words.slice(0, 7).join(' ')}…` : first;
    }

    function drawProgress(ctx, step, count, colors) {
        const left = 56;
        const right = ctx.canvas.width - 56;
        const y = ctx.canvas.height - 34;
        line(ctx, left, y, right, y, colors.grid, 5);
        const ratio = count <= 1 ? 1 : step / (count - 1);
        line(ctx, left, y, left + (right - left) * ratio, y, colors.b, 5);
        for (let index = 0; index < count; index += 1) {
            const x = left + (right - left) * (index / Math.max(1, count - 1));
            circle(ctx, x, y, 6, index <= step ? colors.b : colors.paper, index <= step ? colors.b : colors.axis, 2);
        }
    }

    function drawPipeline(ctx, paper, step, progress, colors) {
        const count = paper.concepts.length;
        const gap = 18;
        const width = (ctx.canvas.width - 80 - gap * (count - 1)) / count;
        const y = 155;
        paper.concepts.forEach((concept, index) => {
            const x = 40 + index * (width + gap);
            const active = index <= step;
            const rise = index === step ? -8 * progress : 0;
            roundedRect(ctx, x, y + rise, width, 105, 14, active ? `${colors.a}22` : colors.paper, active ? colors.a : colors.grid, index === step ? 4 : 2);
            label(ctx, String(index + 1), x + width / 2, y + 24 + rise, active ? colors.a : colors.axis, 17);
            wrapText(ctx, shortConcept(concept), x + width / 2, y + 44 + rise, width - 14, 17, active ? colors.ink : colors.muted, 12, 'center', 3);
            if (index < count - 1) arrow(ctx, x + width + 4, y + 52, x + width + gap - 4, y + 52, index < step ? colors.c : colors.grid, 2);
        });
    }

    function drawAttention(ctx, paper, step, progress, colors) {
        const tokenCount = 5;
        const left = 85;
        const gap = 118;
        const sourceY = 285;
        const queryX = left + Math.min(step, tokenCount - 1) * gap;
        const queryY = 95;
        const weights = paper.visual === 'pointer' ? [0.05, 0.12, 0.58, 0.18, 0.07] : [0.08, 0.18, 0.42, 0.23, 0.09];
        for (let index = 0; index < tokenCount; index += 1) {
            const x = left + index * gap;
            const alpha = Math.min(1, weights[index] * (1.2 + progress));
            line(ctx, queryX, queryY + 34, x, sourceY - 29, `${colors.b}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`, 2 + weights[index] * 9);
            roundedRect(ctx, x - 42, sourceY - 28, 84, 56, 12, colors.paper, index === 2 ? colors.b : colors.a, index === 2 ? 4 : 2);
            label(ctx, paper.visual === 'pointer' ? `item ${index + 1}` : `token ${index + 1}`, x, sourceY, colors.ink, 13);
            label(ctx, weights[index].toFixed(2), x, sourceY + 48, colors.muted, 12);
        }
        roundedRect(ctx, queryX - 54, queryY - 30, 108, 60, 14, `${colors.d}22`, colors.d, 3);
        label(ctx, paper.visual === 'alignment' ? 'decoder query' : paper.visual === 'pointer' ? 'output pointer' : 'query', queryX, queryY, colors.ink, 14);
        label(ctx, paper.visual === 'pointer' ? 'distribution over input positions' : 'content-dependent weighted read', ctx.canvas.width / 2, 365, colors.muted, 15);
    }

    function drawRecurrence(ctx, paper, step, progress, colors) {
        const count = 6;
        const y = 210;
        const left = 70;
        const gap = 115;
        for (let index = 0; index < count; index += 1) {
            const x = left + index * gap;
            if (index < count - 1) arrow(ctx, x + 33, y, x + gap - 33, y, index < step + 1 ? colors.c : colors.grid, 3);
            circle(ctx, x, y, 32, index <= step ? `${colors.a}33` : colors.paper, index <= step ? colors.a : colors.axis, 3);
            label(ctx, `h${index}`, x, y, colors.ink, 14);
            label(ctx, `x${index}`, x, y + 57, colors.muted, 13);
            arrow(ctx, x, y + 43, x, y + 33, colors.axis, 1.5, 7);
            if (paper.visual === 'lstm') {
                const gate = ['f', 'i', 'c', 'o'][index % 4];
                roundedRect(ctx, x - 18, y - 72, 36, 26, 7, `${colors.d}25`, colors.d, 1.5);
                label(ctx, gate, x, y - 59, colors.d, 13);
            }
            if (paper.visual === 'dropout' && index % 2 === 1) {
                line(ctx, x - 22, y - 22, x + 22, y + 22, colors.b, 4);
                line(ctx, x + 22, y - 22, x - 22, y + 22, colors.b, 4);
            }
        }
        const backwardStart = left + (count - 1) * gap;
        const backwardEnd = left;
        arrow(ctx, backwardStart, 110, backwardEnd + 5, 110, colors.b, 3 + progress, 11);
        label(ctx, paper.visual === 'lstm' ? 'protected additive memory and gradient path' : 'shared transition; credit flows backward through time', ctx.canvas.width / 2, 78, colors.muted, 14);
    }

    function drawResidual(ctx, step, progress, colors) {
        const x0 = 80;
        const y = 215;
        roundedRect(ctx, 250, 130, 225, 105, 15, `${colors.a}20`, colors.a, 3);
        label(ctx, 'learn F(x)', 362, 182, colors.ink, 18);
        arrow(ctx, x0, y, 235, y, colors.axis, 3);
        arrow(ctx, 475, 182, 575, 215, colors.a, 3);
        arrow(ctx, 145, y, 145, 95, colors.d, 3);
        arrow(ctx, 145, 95, 575, 95, colors.d, 3);
        arrow(ctx, 575, 95, 575, 198, colors.d, 3);
        circle(ctx, 575, 215, 19, `${colors.c}33`, colors.c, 3);
        label(ctx, '+', 575, 215, colors.ink, 18);
        arrow(ctx, 594, 215, 675, 215, colors.c, 3);
        label(ctx, 'x', 67, y, colors.ink, 17);
        label(ctx, 'identity shortcut', 360, 72, colors.d, 14);
        label(ctx, 'x + F(x)', 650, 185, colors.ink, 15);
        if (step >= 3) {
            arrow(ctx, 650, 310, 105, 310, colors.b, 3 + progress, 11);
            label(ctx, 'gradient has an identity term', 380, 340, colors.muted, 14);
        }
    }

    function drawVision(ctx, paper, step, progress, colors) {
        const gridSize = 11;
        const cell = 25;
        const originX = 80;
        const originY = 70;
        for (let row = 0; row < gridSize; row += 1) {
            for (let col = 0; col < gridSize; col += 1) {
                const rate = paper.visual === 'dilation' ? Math.min(4, 1 + step) : 1;
                const center = 5;
                const isTap = Math.abs(row - center) <= rate && Math.abs(col - center) <= rate && (row - center) % rate === 0 && (col - center) % rate === 0;
                ctx.fillStyle = isTap ? `${colors.b}${Math.round((0.35 + progress * 0.45) * 255).toString(16).padStart(2, '0')}` : colors.paper;
                ctx.fillRect(originX + col * cell, originY + row * cell, cell - 2, cell - 2);
                ctx.strokeStyle = colors.grid;
                ctx.strokeRect(originX + col * cell, originY + row * cell, cell - 2, cell - 2);
            }
        }
        arrow(ctx, 385, 205, 480, 205, colors.a, 3);
        roundedRect(ctx, 500, 105, 150, 200, 16, `${colors.a}18`, colors.a, 3);
        label(ctx, paper.visual === 'dilation' ? 'dense context' : 'feature maps', 575, 135, colors.ink, 17);
        for (let index = 0; index < 4; index += 1) {
            roundedRect(ctx, 525, 170 + index * 28, 100, 18, 5, `${[colors.a, colors.c, colors.d, colors.b][index]}55`, null);
        }
        label(ctx, paper.visual === 'dilation' ? 'spaced taps enlarge field' : 'shared local detector', 220, 375, colors.muted, 15);
    }

    function drawGraph(ctx, paper, step, progress, colors) {
        const nodes = [[180, 105], [350, 85], [530, 135], [230, 280], [440, 285], [610, 275]];
        const edges = [[0, 1], [1, 2], [0, 3], [1, 3], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5]];
        edges.forEach(([a, b], index) => {
            const active = index % Math.max(1, paper.visual === 'relations' ? 2 : 3) <= step % 3;
            line(ctx, nodes[a][0], nodes[a][1], nodes[b][0], nodes[b][1], active ? colors.c : colors.grid, active ? 3 : 2);
            if (active && progress > 0.3) {
                const t = progress;
                circle(ctx, nodes[a][0] + (nodes[b][0] - nodes[a][0]) * t, nodes[a][1] + (nodes[b][1] - nodes[a][1]) * t, 5, colors.b, null);
            }
        });
        nodes.forEach(([x, y], index) => {
            circle(ctx, x, y, 25, `${colors.a}25`, index === step % nodes.length ? colors.b : colors.a, index === step % nodes.length ? 4 : 2);
            label(ctx, paper.visual === 'relations' ? `o${index + 1}` : `v${index + 1}`, x, y, colors.ink, 13);
        });
        label(ctx, paper.visual === 'relations' ? 'shared pair function, then invariant sum' : 'messages aggregate; node states update', ctx.canvas.width / 2, 365, colors.muted, 15);
    }

    function drawMemory(ctx, paper, step, progress, colors) {
        roundedRect(ctx, 55, 145, 155, 115, 16, `${colors.a}20`, colors.a, 3);
        label(ctx, 'controller', 132, 185, colors.ink, 18);
        label(ctx, 'read / write heads', 132, 220, colors.muted, 13);
        const rows = 7;
        const cols = paper.visual === 'relational-memory' ? 5 : 8;
        const startX = 365;
        const startY = 80;
        const cw = 38;
        const ch = 38;
        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const active = row === step % rows || (paper.visual === 'relational-memory' && col === step % cols);
                ctx.fillStyle = active ? `${colors.b}${Math.round((0.28 + 0.45 * progress) * 255).toString(16).padStart(2, '0')}` : colors.paper;
                ctx.fillRect(startX + col * cw, startY + row * ch, cw - 3, ch - 3);
                ctx.strokeStyle = active ? colors.b : colors.grid;
                ctx.strokeRect(startX + col * cw, startY + row * ch, cw - 3, ch - 3);
            }
        }
        arrow(ctx, 210, 175, startX - 18, 130, colors.d, 3);
        arrow(ctx, startX - 18, 235, 210, 230, colors.c, 3);
        label(ctx, paper.visual === 'relational-memory' ? 'memory slots attend to one another' : 'soft weights select memory rows', 500, 380, colors.muted, 15);
    }

    function drawCompression(ctx, paper, step, progress, colors) {
        const strings = ['0000000000000000', '0101010101010101', '0110100101110010'];
        const names = ['repeat', 'alternating', 'irregular'];
        strings.forEach((bits, index) => {
            const y = 105 + index * 92;
            label(ctx, bits, 65, y, colors.ink, 15, 'left');
            arrow(ctx, 270, y, 350, y, colors.axis, 2);
            const length = [95, 150, 250][index] * (0.65 + 0.35 * progress);
            roundedRect(ctx, 370, y - 18, length, 36, 8, `${[colors.c, colors.d, colors.b][index]}55`, [colors.c, colors.d, colors.b][index], 2);
            label(ctx, `${names[index]}: ${Math.round(length / 6)} bits`, 382, y, colors.ink, 13, 'left');
        });
        label(ctx, paper.visual === 'intelligence' ? 'simpler environments receive greater prior weight' : 'model bits + unexplained data bits', ctx.canvas.width / 2, 365, colors.muted, 15);
    }

    function drawScaling(ctx, step, progress, colors) {
        const left = 82;
        const bottom = 340;
        const top = 70;
        const right = 660;
        arrow(ctx, left, bottom, right, bottom, colors.axis, 2);
        arrow(ctx, left, bottom, left, top, colors.axis, 2);
        label(ctx, 'log resource', (left + right) / 2, 380, colors.muted, 14);
        ctx.save();
        ctx.translate(38, (top + bottom) / 2);
        ctx.rotate(-Math.PI / 2);
        label(ctx, 'test loss', 0, 0, colors.muted, 14);
        ctx.restore();
        const series = [[colors.a, 0], [colors.c, 34], [colors.b, 68]];
        series.forEach(([color, offset], seriesIndex) => {
            ctx.beginPath();
            for (let i = 0; i <= 100; i += 1) {
                const x = left + (right - left) * i / 100;
                const y = top + 35 + offset + 185 * Math.exp(-i / (24 + seriesIndex * 9));
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = seriesIndex === step % 3 ? 5 : 2.5;
            ctx.stroke();
        });
        const x = left + (right - left) * (0.25 + 0.65 * progress);
        line(ctx, x, top, x, bottom, colors.d, 2, [6, 6]);
        label(ctx, 'measured regime → extrapolation risk', 405, 50, colors.muted, 14);
    }

    function drawComplexity(ctx, step, progress, colors) {
        const panels = 3;
        const grid = 12;
        const cell = 11;
        for (let panel = 0; panel < panels; panel += 1) {
            const startX = 72 + panel * 225;
            const startY = 118;
            for (let row = 0; row < grid; row += 1) {
                for (let col = 0; col < grid; col += 1) {
                    let on;
                    if (panel === 0) on = col < grid / 2;
                    else if (panel === 1) on = ((row * 5 + col * 3 + Math.floor(progress * 3)) % 11) < 5;
                    else on = ((row * 17 + col * 13 + 7) % 19) < 9;
                    ctx.fillStyle = on ? colors.a : colors.paper;
                    ctx.fillRect(startX + col * cell, startY + row * cell, cell - 1, cell - 1);
                }
            }
            label(ctx, ['ordered', 'structured mixing', 'equilibrium-like'][panel], startX + 66, startY + 158, panel === step % 3 ? colors.b : colors.muted, 13);
        }
        const heights = [35, 115, 40];
        heights.forEach((height, index) => {
            ctx.fillStyle = index === step % 3 ? colors.b : colors.grid;
            ctx.fillRect(120 + index * 225, 370 - height, 42, height);
        });
        label(ctx, 'candidate complexity: low → high → low', ctx.canvas.width / 2, 397, colors.muted, 14);
    }

    function drawLatent(ctx, step, progress, colors) {
        roundedRect(ctx, 50, 145, 145, 110, 15, `${colors.a}22`, colors.a, 3);
        label(ctx, 'input x', 122, 200, colors.ink, 18);
        arrow(ctx, 195, 200, 300, 200, colors.a, 3);
        circle(ctx, 350, 200, 40, `${colors.d}35`, colors.d, 3);
        label(ctx, 'global z', 350, 200, colors.ink, 15);
        arrow(ctx, 390, 200, 500, 200, colors.c, 3);
        roundedRect(ctx, 500, 145, 165, 110, 15, `${colors.c}22`, colors.c, 3);
        label(ctx, 'decoder p(x|z)', 582, 200, colors.ink, 16);
        arrow(ctx, 120, 285, 545, 285, colors.b, 3);
        label(ctx, 'local autoregressive context explains texture', 335, 315, colors.muted, 14);
        if (step >= 3) {
            line(ctx, 350, 240, 350, 340, colors.d, 3 + progress);
            label(ctx, 'z must carry global structure', 350, 365, colors.d, 14);
        }
    }

    function drawOrdering(ctx, step, progress, colors) {
        const items = ['A', 'B', 'C', 'D'];
        items.forEach((item, index) => {
            const angle = index * Math.PI / 2 + progress * 0.25;
            const x = 180 + Math.cos(angle) * 90;
            const y = 210 + Math.sin(angle) * 90;
            circle(ctx, x, y, 24, `${colors.a}25`, colors.a, 2);
            label(ctx, item, x, y, colors.ink, 14);
        });
        arrow(ctx, 310, 210, 400, 210, colors.d, 3);
        const sequence = step % 2 ? ['C', 'A', 'D', 'B'] : ['A', 'B', 'C', 'D'];
        sequence.forEach((item, index) => {
            roundedRect(ctx, 430 + index * 60, 185, 46, 50, 8, `${colors.b}20`, colors.b, 2);
            label(ctx, item, 453 + index * 60, 210, colors.ink, 14);
        });
        label(ctx, 'same set', 180, 345, colors.muted, 14);
        label(ctx, 'different factorization and learning path', 535, 270, colors.muted, 14);
    }

    function drawSpeech(ctx, paper, step, progress, colors) {
        const stages = ['audio', 'spectrogram', 'conv', 'recurrent context', 'CTC paths', 'text'];
        const gap = 12;
        const width = (ctx.canvas.width - 70 - gap * (stages.length - 1)) / stages.length;
        stages.forEach((stage, index) => {
            const x = 35 + index * (width + gap);
            roundedRect(ctx, x, 165, width, 90, 12, index <= step ? `${colors.a}22` : colors.paper, index <= step ? colors.a : colors.grid, index === step ? 4 : 2);
            wrapText(ctx, stage, x + width / 2, 194, width - 10, 17, colors.ink, 13, 'center', 2);
            if (index < stages.length - 1) arrow(ctx, x + width + 2, 210, x + width + gap - 2, 210, index < step ? colors.c : colors.grid, 2, 7);
        });
        label(ctx, 'many frame-level alignments collapse to one transcript', ctx.canvas.width / 2, 315, colors.muted, 15);
    }

    function drawPaperVisual(ctx, paper, step, progress) {
        const colors = palette();
        clearCanvas(ctx, colors);
        const visual = paper.visual;
        if (['attention', 'alignment', 'pointer'].includes(visual)) drawAttention(ctx, paper, step, progress, colors);
        else if (['recurrence', 'lstm', 'dropout'].includes(visual)) drawRecurrence(ctx, paper, step, progress, colors);
        else if (visual === 'residual') drawResidual(ctx, step, progress, colors);
        else if (['convolution', 'dilation'].includes(visual)) drawVision(ctx, paper, step, progress, colors);
        else if (['graph', 'relations'].includes(visual)) drawGraph(ctx, paper, step, progress, colors);
        else if (['memory', 'relational-memory'].includes(visual)) drawMemory(ctx, paper, step, progress, colors);
        else if (['compression', 'kolmogorov', 'intelligence'].includes(visual)) drawCompression(ctx, paper, step, progress, colors);
        else if (visual === 'scaling') drawScaling(ctx, step, progress, colors);
        else if (visual === 'complexity') drawComplexity(ctx, step, progress, colors);
        else if (visual === 'latent') drawLatent(ctx, step, progress, colors);
        else if (visual === 'ordering') drawOrdering(ctx, step, progress, colors);
        else if (visual === 'speech') drawSpeech(ctx, paper, step, progress, colors);
        else drawPipeline(ctx, paper, step, progress, colors);
        drawProgress(ctx, step, paper.concepts.length, colors);
    }

    function setupPaperConceptStudio() {
        const papers = Array.isArray(window.ResearchPaperConcepts) ? window.ResearchPaperConcepts : [];
        const select = byId('paperConceptSelect');
        const canvas = byId('paperConceptCanvas');
        if (!papers.length || !select || !canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        papers.forEach((paper, index) => {
            const option = document.createElement('option');
            option.value = paper.id;
            option.textContent = `${index + 1}. ${paper.title}`;
            select.appendChild(option);
        });

        const elements = {
            progress: byId('paperConceptProgress'), category: byId('paperConceptCategory'), year: byId('paperConceptYear'),
            title: byId('paperConceptTitle'), question: byId('paperConceptQuestion'), foundation: byId('paperConceptFoundation'),
            stepLabel: byId('paperConceptStepLabel'), steps: byId('paperConceptSteps'), formula: byId('paperConceptFormula'),
            evidence: byId('paperConceptEvidence'), limit: byId('paperConceptLimit'), transfer: byId('paperConceptTransfer'),
            source: byId('paperConceptSource'), caption: byId('paperConceptCaption'), prev: byId('paperConceptPrev'),
            next: byId('paperConceptNext'), replay: byId('paperConceptReplay'), motion: byId('paperConceptMotion'),
            video: byId('paperConceptVideo'), videoCaption: byId('paperConceptVideoCaption')
        };
        let paperIndex = 0;
        let step = 0;
        let frameHandle = null;

        function typeset(...targets) {
            if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise(targets.filter(Boolean)).catch(() => {});
        }

        function configureMotion(paper) {
            if (!elements.motion || !elements.video) return;
            if (!paper.manim) {
                elements.video.pause();
                elements.video.removeAttribute('src');
                elements.video.innerHTML = '';
                elements.motion.hidden = true;
                return;
            }
            elements.motion.hidden = false;
            elements.video.pause();
            elements.video.innerHTML = '';
            const webm = document.createElement('source');
            webm.src = `assets/manim/${paper.manim}.webm`;
            webm.type = 'video/webm';
            const mp4 = document.createElement('source');
            mp4.src = `assets/manim/${paper.manim}.mp4`;
            mp4.type = 'video/mp4';
            elements.video.append(webm, mp4);
            elements.video.poster = `assets/manim/${paper.manim}.jpg`;
            elements.video.load();
            elements.videoCaption.textContent = `Motion study: ${shortConcept(paper.concepts[Math.min(step, paper.concepts.length - 1)])}`;
        }

        function animate() {
            if (frameHandle) cancelAnimationFrame(frameHandle);
            const paper = papers[paperIndex];
            if (reduceMotion) {
                drawPaperVisual(ctx, paper, step, 1);
                return;
            }
            let start = null;
            const duration = 900;
            const frame = now => {
                if (start === null) start = now;
                const progress = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - progress, 3);
                drawPaperVisual(ctx, paper, step, eased);
                if (progress < 1) frameHandle = requestAnimationFrame(frame);
            };
            frameHandle = requestAnimationFrame(frame);
        }

        function render() {
            const paper = papers[paperIndex];
            select.value = paper.id;
            elements.progress.textContent = `Reading ${paperIndex + 1} of ${papers.length}`;
            elements.category.textContent = paper.category;
            elements.year.textContent = paper.year;
            elements.title.textContent = paper.title;
            elements.question.textContent = paper.question;
            elements.foundation.textContent = paper.foundation;
            elements.formula.innerHTML = paper.formula;
            elements.evidence.textContent = paper.evidence;
            elements.limit.textContent = paper.limit;
            elements.transfer.textContent = paper.transfer;
            elements.source.href = paper.source;
            elements.steps.innerHTML = '';
            paper.concepts.forEach((concept, index) => {
                const item = document.createElement('li');
                item.textContent = concept;
                item.classList.toggle('is-current', index === step);
                elements.steps.appendChild(item);
            });
            elements.stepLabel.textContent = `Step ${step + 1} of ${paper.concepts.length}`;
            elements.caption.textContent = paper.concepts[step];
            elements.prev.disabled = step === 0;
            elements.next.textContent = step === paper.concepts.length - 1 ? 'Next reading' : 'Next idea';
            configureMotion(paper);
            animate();
            typeset(elements.formula);
        }

        select.addEventListener('change', () => {
            const nextIndex = papers.findIndex(paper => paper.id === select.value);
            if (nextIndex >= 0) paperIndex = nextIndex;
            step = 0;
            render();
        });
        elements.prev.addEventListener('click', () => {
            if (step > 0) step -= 1;
            render();
        });
        elements.next.addEventListener('click', () => {
            const paper = papers[paperIndex];
            if (step < paper.concepts.length - 1) step += 1;
            else {
                paperIndex = (paperIndex + 1) % papers.length;
                step = 0;
            }
            render();
        });
        elements.replay.addEventListener('click', animate);
        const observer = new MutationObserver(() => drawPaperVisual(ctx, papers[paperIndex], step, 1));
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        render();
    }

    const rlConcepts = {
        mdp: {
            eyebrow: 'The decision process', title: 'A Markov decision process names every moving part',
            intuition: 'The agent does not learn from a static labeled table. It changes what data it will see next. An MDP separates the policy from the environment dynamics so we can reason about that feedback loop.',
            formula: '\\(S_t\\xrightarrow{A_t} (R_{t+1},S_{t+1}),\\quad P(s\',r\\mid s,a)\\)',
            steps: ['State summarizes the information needed to predict the next transition.', 'The policy chooses an action, possibly as a probability distribution.', 'The environment samples the next state and reward from its dynamics.', 'The new state changes the next decision and therefore the future data distribution.'],
            confusion: 'A state is not necessarily the raw observation. It is a sufficient predictive summary. When observations omit relevant history, the agent faces partial observability.',
            caption: 'Action changes the state distribution; the learner and its data-collection process are coupled.'
        },
        return: {
            eyebrow: 'The objective', title: 'Return turns delayed consequences into one comparable quantity',
            intuition: 'An action can be costly now and beneficial later. Discounted return assigns a present value to every future reward so policies can be compared by long-term consequences.',
            formula: '\\(G_t=R_{t+1}+\\gamma R_{t+2}+\\gamma^2R_{t+3}+\\cdots=R_{t+1}+\\gamma G_{t+1}\\)',
            steps: ['List rewards from the current decision onward.', 'Multiply rewards k steps away by γ^k.', 'Add the discounted terms to obtain one sampled return.', 'Average returns across possible trajectories to define a value.'],
            confusion: 'The discount factor is not only impatience. In continuing tasks it can make the infinite sum finite and specifies the effective planning horizon.',
            caption: 'Changing γ changes how strongly delayed rewards influence today’s decision.'
        },
        bellman: {
            eyebrow: 'Recursive prediction', title: 'A Bellman backup replaces a long future with one reward and one shorter prediction',
            intuition: 'Every return has the same recursive structure. This lets dynamic programming and TD learning update a long-horizon prediction without enumerating every complete future.',
            formula: '\\(V^\\pi(s)=\\sum_a\\pi(a\\mid s)\\sum_{s\',r}p(s\',r\\mid s,a)[r+\\gamma V^\\pi(s\')]\\)',
            steps: ['Start from a state whose value is being estimated.', 'Average immediate reward plus next-state value over environment outcomes.', 'Average those action values under the policy for evaluation.', 'Replace the policy average with a maximum for optimal control.'],
            confusion: 'The expectation equation evaluates a fixed policy; the optimality equation includes a max and is nonlinear. They answer different questions.',
            caption: 'Probability-weighted branches flow backward into the current value.'
        },
        sampling: {
            eyebrow: 'Learning without a model', title: 'Monte Carlo and temporal difference learning estimate the same value with different targets',
            intuition: 'Monte Carlo waits for an actual completed return. TD updates immediately using a bootstrapped estimate for the unseen tail. The choice is a bias–variance and timing tradeoff.',
            formula: '\\(MC:G_t-V(S_t),\\qquad TD:R_{t+1}+\\gamma V(S_{t+1})-V(S_t)\\)',
            steps: ['Observe a transition from experience.', 'MC stores it until the episode return is known.', 'TD forms a one-step target immediately from reward and next value.', 'Move the current estimate toward the chosen target with step size α.'],
            confusion: 'Bootstrapping does not mean “using fake data.” It means using one current prediction inside the target for another prediction.',
            caption: 'MC has a longer real-data target; TD has a shorter, lower-variance bootstrapped target.'
        },
        control: {
            eyebrow: 'Policy improvement', title: 'Control alternates prediction with better action choice',
            intuition: 'Action values make policy improvement local: compare actions at the current state. Exploration is still required because an action that looks poor may simply be under-sampled.',
            formula: '\\(Q(s,a)\\leftarrow Q(s,a)+\\alpha[r+\\gamma\\max_{a\'}Q(s\',a\')-Q(s,a)]\\)',
            steps: ['Estimate action values from current experience.', 'Usually exploit the largest estimate, but sometimes explore.', 'Observe the reward and next state.', 'Update the chosen action and repeat until estimates and behavior stabilize.'],
            confusion: 'Greedy behavior is only as good as current estimates. Premature exploitation can permanently miss a better action.',
            caption: 'The agent balances uncertain information gathering against known reward.'
        },
        'policy-gradient': {
            eyebrow: 'Differentiate behavior', title: 'Policy gradients move probability toward actions with positive advantage',
            intuition: 'The environment need not be differentiable. The log-derivative identity turns sampled rewards into an unbiased direction for changing a differentiable stochastic policy.',
            formula: '\\(\\nabla_\\theta J=\\mathbb E[\\nabla_\\theta\\log\\pi_\\theta(A_t\\mid S_t)\\,\\hat A_t]\\)',
            steps: ['Sample an action from the current policy.', 'Estimate whether its return was above or below the state baseline.', 'Multiply that advantage by the gradient of its log probability.', 'Increase advantageous action probability and decrease disadvantageous probability.'],
            confusion: 'The baseline changes variance, not the expected gradient, when it does not depend on the sampled action.',
            caption: 'Advantage determines direction; the log-policy gradient determines how parameters change action probability.'
        }
    };

    function drawRlMdp(ctx, step, progress, colors) {
        roundedRect(ctx, 70, 135, 190, 120, 18, `${colors.a}22`, colors.a, 3);
        roundedRect(ctx, 500, 135, 190, 120, 18, `${colors.c}22`, colors.c, 3);
        label(ctx, 'agent / policy π', 165, 185, colors.ink, 20);
        label(ctx, 'environment p', 595, 185, colors.ink, 20);
        arrow(ctx, 260, 165, 500, 165, step >= 1 ? colors.b : colors.axis, 4);
        label(ctx, 'action Aₜ', 380, 140, colors.b, 15);
        arrow(ctx, 500, 230, 260, 230, step >= 2 ? colors.d : colors.axis, 4);
        label(ctx, 'reward Rₜ₊₁, state Sₜ₊₁', 380, 257, colors.d, 15);
        circle(ctx, 165, 335, 18 + progress * 4, `${colors.b}33`, colors.b, 2);
        label(ctx, `step ${step + 1}`, 165, 335, colors.ink, 13);
    }

    function drawRlReturn(ctx, step, progress, colors, gamma) {
        const rewards = [1, -0.5, 2, 0, 4];
        const left = 85;
        const gap = 135;
        let total = 0;
        rewards.forEach((reward, index) => {
            const x = left + index * gap;
            const weight = Math.pow(gamma, index);
            const contribution = reward * weight;
            total += contribution;
            line(ctx, x, 125, x, 295, colors.grid, 2);
            const height = contribution * 28;
            ctx.fillStyle = contribution >= 0 ? `${colors.c}99` : `${colors.b}99`;
            ctx.fillRect(x - 20, 235 - Math.max(0, height), 40, Math.abs(height));
            label(ctx, `r${index}=${reward}`, x, 270, colors.ink, 13);
            label(ctx, `γ${index}=${weight.toFixed(2)}`, x, 305, colors.muted, 12);
            if (index < rewards.length - 1) arrow(ctx, x + 28, 180, x + gap - 28, 180, index <= step ? colors.a : colors.grid, 2);
        });
        label(ctx, `discounted return = ${total.toFixed(3)}`, ctx.canvas.width / 2, 70, colors.ink, 20);
        label(ctx, `effective horizon is roughly 1/(1−γ) = ${(1 / Math.max(0.01, 1 - gamma)).toFixed(1)} steps`, ctx.canvas.width / 2, 370, colors.muted, 14);
    }

    function drawRlBellman(ctx, step, progress, colors, gamma) {
        const root = [170, 215];
        const actions = [[355, 125], [355, 305]];
        const nextStates = [[600, 80], [600, 170], [600, 270], [600, 360]];
        circle(ctx, root[0], root[1], 38, `${colors.a}25`, colors.a, 3);
        label(ctx, 'V(s)', root[0], root[1], colors.ink, 17);
        actions.forEach((point, index) => {
            arrow(ctx, root[0] + 38, root[1], point[0] - 46, point[1], step >= 1 ? colors.b : colors.grid, 3);
            roundedRect(ctx, point[0] - 45, point[1] - 27, 90, 54, 10, `${colors.b}18`, colors.b, 2);
            label(ctx, `a${index + 1}`, point[0], point[1], colors.ink, 15);
        });
        nextStates.forEach((point, index) => {
            const action = actions[index < 2 ? 0 : 1];
            arrow(ctx, action[0] + 45, action[1], point[0] - 28, point[1], step >= 2 ? colors.c : colors.grid, 2);
            circle(ctx, point[0], point[1], 28, `${colors.c}20`, colors.c, 2);
            label(ctx, `s'${index + 1}`, point[0], point[1], colors.ink, 13);
            label(ctx, `p=${[0.7, 0.3, 0.4, 0.6][index]}`, point[0], point[1] + 43, colors.muted, 11);
        });
        if (step >= 2) {
            arrow(ctx, 655, 215, 705 - progress * 420, 215, colors.d, 4, 12);
            label(ctx, `r + ${gamma.toFixed(2)}V(s') backs up`, 580, 40, colors.d, 15);
        }
    }

    function drawRlSampling(ctx, step, progress, colors, gamma) {
        const current = 1.2;
        const mcTarget = 3.8;
        const tdTarget = 1.0 + gamma * 2.1;
        const max = 5;
        const baseY = 345;
        const scale = 52;
        line(ctx, 90, baseY, 690, baseY, colors.axis, 2);
        [current, mcTarget, tdTarget].forEach((value, index) => {
            const x = [180, 380, 580][index];
            const height = value * scale * (0.65 + 0.35 * progress);
            ctx.fillStyle = [colors.axis, colors.b, colors.c][index];
            ctx.fillRect(x - 42, baseY - height, 84, height);
            label(ctx, ['current V', 'MC target', 'TD target'][index], x, baseY + 25, colors.ink, 13);
            label(ctx, value.toFixed(2), x, baseY - height - 17, colors.ink, 14);
        });
        label(ctx, 'MC: real tail, higher variance', 380, 70, colors.b, 15);
        label(ctx, 'TD: predicted tail, temporary bias', 580, 105, colors.c, 15);
        for (let index = 0; index <= max; index += 1) label(ctx, String(index), 74, baseY - index * scale, colors.muted, 11, 'right');
    }

    function drawRlControl(ctx, step, progress, colors) {
        const q = [1.2, 2.6, 1.8, 3.4];
        q.forEach((value, index) => {
            const x = 110 + index * 165;
            const height = value * 58;
            ctx.fillStyle = index === 3 ? `${colors.c}bb` : `${colors.a}88`;
            ctx.fillRect(x - 40, 335 - height, 80, height);
            label(ctx, ['up', 'right', 'down', 'left'][index], x, 362, colors.ink, 13);
            label(ctx, `Q=${value.toFixed(1)}`, x, 315 - height, colors.ink, 13);
            if (index === step % 4) circle(ctx, x, 382, 8 + progress * 3, colors.b, null);
        });
        label(ctx, step % 3 === 2 ? 'explore an uncertain action' : 'exploit current best estimate', ctx.canvas.width / 2, 65, step % 3 === 2 ? colors.b : colors.c, 18);
    }

    function drawRlPolicyGradient(ctx, step, progress, colors) {
        const base = 0.42;
        const shift = (step + progress) * 0.09;
        const pGood = Math.min(0.9, base + shift);
        const pOther = 1 - pGood;
        const baseY = 330;
        [[pGood, colors.c, 'advantage +'], [pOther, colors.b, 'advantage −']].forEach(([prob, color, text], index) => {
            const x = 250 + index * 270;
            const height = prob * 230;
            ctx.fillStyle = `${color}aa`;
            ctx.fillRect(x - 70, baseY - height, 140, height);
            label(ctx, `${(prob * 100).toFixed(0)}%`, x, baseY - height - 22, colors.ink, 20);
            label(ctx, text, x, 360, color, 15);
        });
        arrow(ctx, 330, 195, 430, 195, colors.d, 3 + progress, 12);
        label(ctx, 'probability mass moves', 380, 155, colors.d, 14);
        label(ctx, 'the environment supplied reward, not a differentiable path', ctx.canvas.width / 2, 65, colors.muted, 14);
    }

    function setupRlConceptStudio() {
        const canvas = byId('rlConceptCanvas');
        const buttons = Array.from(document.querySelectorAll('[data-rl-concept]'));
        if (!canvas || !buttons.length) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const elements = {
            eyebrow: byId('rlConceptEyebrow'), title: byId('rlConceptTitle'), intuition: byId('rlConceptIntuition'),
            formula: byId('rlConceptFormula'), steps: byId('rlConceptSteps'), confusion: byId('rlConceptConfusion'),
            caption: byId('rlConceptCaption'), gamma: byId('rlConceptGamma'), gammaValue: byId('rlConceptGammaValue'),
            advance: byId('rlConceptStep'), reset: byId('rlConceptReset')
        };
        let mode = 'mdp';
        let step = 0;
        let frameHandle = null;

        function typeset() {
            if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise([elements.formula]).catch(() => {});
        }

        function draw(progress = 1) {
            const colors = palette();
            clearCanvas(ctx, colors);
            const gamma = Number(elements.gamma.value);
            if (mode === 'mdp') drawRlMdp(ctx, step, progress, colors);
            else if (mode === 'return') drawRlReturn(ctx, step, progress, colors, gamma);
            else if (mode === 'bellman') drawRlBellman(ctx, step, progress, colors, gamma);
            else if (mode === 'sampling') drawRlSampling(ctx, step, progress, colors, gamma);
            else if (mode === 'control') drawRlControl(ctx, step, progress, colors);
            else drawRlPolicyGradient(ctx, step, progress, colors);
        }

        function animate() {
            if (frameHandle) cancelAnimationFrame(frameHandle);
            if (reduceMotion) {
                draw(1);
                return;
            }
            let started = null;
            const frame = now => {
                if (started === null) started = now;
                const raw = Math.min(1, (now - started) / 900);
                draw(1 - Math.pow(1 - raw, 3));
                if (raw < 1) frameHandle = requestAnimationFrame(frame);
            };
            frameHandle = requestAnimationFrame(frame);
        }

        function render() {
            const concept = rlConcepts[mode];
            elements.eyebrow.textContent = concept.eyebrow;
            elements.title.textContent = concept.title;
            elements.intuition.textContent = concept.intuition;
            elements.formula.innerHTML = concept.formula;
            elements.confusion.textContent = concept.confusion;
            elements.caption.textContent = concept.caption;
            elements.steps.innerHTML = '';
            concept.steps.forEach((text, index) => {
                const item = document.createElement('li');
                item.textContent = text;
                item.classList.toggle('is-current', index === step % concept.steps.length);
                elements.steps.appendChild(item);
            });
            buttons.forEach(button => button.classList.toggle('is-active', button.dataset.rlConcept === mode));
            elements.gammaValue.textContent = Number(elements.gamma.value).toFixed(2);
            animate();
            typeset();
        }

        buttons.forEach(button => button.addEventListener('click', () => {
            mode = button.dataset.rlConcept;
            step = 0;
            render();
        }));
        elements.advance.addEventListener('click', () => {
            step = (step + 1) % rlConcepts[mode].steps.length;
            render();
        });
        elements.reset.addEventListener('click', () => {
            step = 0;
            elements.gamma.value = '0.9';
            render();
        });
        elements.gamma.addEventListener('input', () => {
            elements.gammaValue.textContent = Number(elements.gamma.value).toFixed(2);
            draw(1);
        });
        const observer = new MutationObserver(() => draw(1));
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
        render();
    }

    function initialize() {
        setupPaperConceptStudio();
        setupRlConceptStudio();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
    else initialize();
})();
