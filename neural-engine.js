/* Small deterministic sigmoid networks; no rendering dependencies. */
(() => {
    'use strict';
    const inputs = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const targets = { AND: [0, 0, 0, 1], OR: [0, 1, 1, 1], XOR: [0, 1, 1, 0] };
    const sigmoid = z => z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
    const clone = model => JSON.parse(JSON.stringify(model));
    function create(hidden = false) {
        if (!hidden) return { layers: [{ w: [[.2, -.1]], b: [0] }] };
        let seed = 3;
        const random = () => {
            seed = (seed + 0x6D2B79F5) >>> 0;
            let value = Math.imul(seed ^ (seed >>> 15), seed | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((((value ^ (value >>> 14)) >>> 0) / 4294967296) - .5) * 1.2;
        };
        const w = Array.from({ length: 3 }, () => [random(), random()]);
        const b = [random(), random(), random()];
        return { layers: [{ w, b }, { w: [[random(), random(), random()]], b: [random()] }] };
    }
    function forward(model, x, y = 0) {
        const a = [[...x]], z = [];
        model.layers.forEach(layer => {
            const scores = layer.w.map((weights, j) => weights.reduce((sum, w, i) => sum + w * a[a.length - 1][i], layer.b[j]));
            z.push(scores);
            a.push(scores.map(sigmoid));
        });
        const score = z[z.length - 1][0], prediction = a[a.length - 1][0];
        // Softplus form avoids taking log(0) for confident predictions.
        const loss = Math.max(score, 0) - score * y + Math.log1p(Math.exp(-Math.abs(score)));
        return { x: [...x], y, a, z, prediction, loss };
    }
    function backward(model, state) {
        const delta = [], gradient = [];
        const last = model.layers.length - 1;
        delta[last] = [state.prediction - state.y];
        for (let l = last; l >= 0; l--) {
            gradient[l] = {
                w: delta[l].map(d => state.a[l].map(value => d * value)),
                b: [...delta[l]]
            };
            if (l > 0) delta[l - 1] = state.a[l].map((activation, i) =>
                model.layers[l].w.reduce((sum, weights, j) => sum + weights[i] * delta[l][j], 0)
                * activation * (1 - activation));
        }
        return { layers: gradient, delta };
    }
    function apply(model, gradient, rate) {
        const next = clone(model);
        next.layers.forEach((layer, l) => {
            layer.w.forEach((weights, j) => weights.forEach((_, i) => { layer.w[j][i] -= rate * gradient.layers[l].w[j][i]; }));
            layer.b.forEach((_, j) => { layer.b[j] -= rate * gradient.layers[l].b[j]; });
        });
        return next;
    }
    function evaluate(model, gate) {
        const states = inputs.map((x, i) => forward(model, x, targets[gate][i]));
        return { states, loss: states.reduce((sum, state) => sum + state.loss, 0) / 4,
            correct: states.filter(s => Number(s.prediction >= .5) === s.y).length };
    }
    function epoch(model, gate, rate) {
        const gradients = inputs.map((x, i) => backward(model, forward(model, x, targets[gate][i])));
        const average = { layers: model.layers.map((layer, l) => ({
            w: layer.w.map((weights, j) => weights.map((_, i) => gradients.reduce((sum, g) => sum + g.layers[l].w[j][i], 0) / 4)),
            b: layer.b.map((_, j) => gradients.reduce((sum, g) => sum + g.layers[l].b[j], 0) / 4)
        })) };
        return apply(model, average, rate);
    }
    function parameters(model) {
        const result = [];
        model.layers.forEach((layer, l) => {
            layer.w.forEach((weights, j) => {
                const destination = l === model.layers.length - 1 ? 'ŷ' : 'h' + (j + 1);
                weights.forEach((_, i) => result.push({
                    key: l + '-w-' + j + '-' + i, l, j, i, kind: 'w',
                    label: (l === 0 ? 'x' : 'h') + (i + 1) + ' → ' + destination,
                    destination, source: (l === 0 ? 'x' : 'h') + (i + 1)
                }));
                result.push({ key: l + '-b-' + j, l, j, kind: 'b', destination, label: 'Bias of ' + destination });
            });
        });
        return result;
    }
    function value(model, p) { return p.kind === 'w' ? model.layers[p.l].w[p.j][p.i] : model.layers[p.l].b[p.j]; }
    globalThis.NeuralEngine = { inputs, targets, sigmoid, clone, create, forward, backward, apply, evaluate, epoch, parameters, value };
})();
