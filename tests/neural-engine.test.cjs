const { test } = require('node:test');
const assert = require('node:assert/strict');
require('../neural-engine.js');
const E = globalThis.NeuralEngine;
const close = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, a + ' ≠ ' + b);

test('AND worked example: forward is read-only; only apply changes parameters', () => {
    const model = E.create(), original = E.clone(model);
    const state = E.forward(model, [1, 1], 1);
    const gradient = E.backward(model, state);
    assert.deepEqual(model, original);
    close(state.prediction, .52497918747894);
    close(state.loss, .6443966600735709);
    close(gradient.layers[0].w[0][0], -.47502081252106);
    const next = E.apply(model, gradient, .5);
    close(next.layers[0].w[0][0], .43751040626053);
    close(next.layers[0].w[0][1], .13751040626053);
    close(next.layers[0].b[0], .23751040626053);
    assert.ok(E.forward(next, [1, 1], 1).loss < state.loss);
    assert.deepEqual(model, original);
});

for (const hidden of [false, true]) {
    test((hidden ? 'Hidden' : 'Single') + ' network: all gradients match central finite differences', () => {
        const model = E.create(hidden), epsilon = 1e-5;
        for (const gate of ['AND', 'OR', 'XOR']) {
            E.inputs.forEach((x, row) => {
                const y = E.targets[gate][row], gradient = E.backward(model, E.forward(model, x, y));
                E.parameters(model).forEach(p => {
                    const plus = E.clone(model), minus = E.clone(model);
                    if (p.kind === 'b') { plus.layers[p.l].b[p.j] += epsilon; minus.layers[p.l].b[p.j] -= epsilon; }
                    else { plus.layers[p.l].w[p.j][p.i] += epsilon; minus.layers[p.l].w[p.j][p.i] -= epsilon; }
                    const numerical = (E.forward(plus, x, y).loss - E.forward(minus, x, y).loss) / (2 * epsilon);
                    close(E.value(gradient, p), numerical);
                });
            });
        }
    });
}

test('Parameter counts match the rendered 2→1 and 2→3→1 networks', () => {
    assert.equal(E.parameters(E.create()).length, 3);
    assert.equal(E.parameters(E.create(true)).length, 13);
});

test('Zero inputs give zero input-weight gradients, but a bias can still learn', () => {
    const model = E.create(), gradient = E.backward(model, E.forward(model, [0, 0], 0));
    assert.deepEqual(gradient.layers[0].w, [[0, 0]]);
    close(gradient.layers[0].b[0], .5);
});

for (const gate of ['AND', 'OR', 'XOR']) {
    test(gate + ' converges with the lesson’s deterministic initialization and training rate', () => {
        const hidden = gate === 'XOR';
        let model = E.create(hidden);
        for (let epoch = 0; epoch < 1000; epoch++) model = E.epoch(model, gate, hidden ? 1.2 : .5);
        const result = E.evaluate(model, gate);
        assert.equal(result.correct, 4);
        assert.ok(result.loss < .1, gate + ' loss = ' + result.loss);
    });
}

test('A single sigmoid neuron cannot learn the XOR truth table', () => {
    let model = E.create();
    for (let epoch = 0; epoch < 1000; epoch++) model = E.epoch(model, 'XOR', .5);
    const result = E.evaluate(model, 'XOR');
    assert.ok(result.correct < 4);
    close(result.loss, Math.log(2), 1e-4);
});

test('Full-batch epoch applies the mean of the four sample gradients', () => {
    const model = E.create(true), rate = 1.2;
    const updated = E.epoch(model, 'AND', rate);
    const gradients = E.inputs.map((x, i) => E.backward(model, E.forward(model, x, E.targets.AND[i])));
    E.parameters(model).forEach(p => close(E.value(updated, p),
        E.value(model, p) - rate * gradients.reduce((sum, g) => sum + E.value(g, p), 0) / 4));
});

test('Stable sigmoid and cross-entropy remain finite for extreme scores', () => {
    for (const b of [-1000, 1000]) for (const y of [0, 1]) {
        const state = E.forward({ layers: [{ w: [[0, 0]], b: [b] }] }, [1, 1], y);
        assert.ok(Number.isFinite(state.loss));
        assert.ok(Number.isFinite(state.prediction));
    }
});
