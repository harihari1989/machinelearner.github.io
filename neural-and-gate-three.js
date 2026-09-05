/* One source of truth for the lesson, the graph and the decision surface. */
(() => {
    'use strict';
    const E = globalThis.NeuralEngine;
    const $ = id => document.getElementById(id);
    if (!$('and-gate-lab') || !E) return;
    const rule = $('andGateRule'), network = $('andGateView'), example = $('andGateExample');
    const parameter = $('studioParameter'), stage = $('andGateStage');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const phases = ['Inputs', 'Multiply', 'Sum', 'Predict', 'Error', 'Gradients', 'Update', 'Verify'];
    const f = (n, digits = 5) => Math.abs(n) < .5 * 10 ** -digits ? (0).toFixed(digits) : n.toFixed(digits).replace('-', '−');
    const rate = () => network.value === 'large' ? 1.2 : .5;
    const sample = () => Number(example.value);
    let model, before, after, trace, gradients, phase = 0, epochs = 0, history = [];
    let training = false, trainingFrame = 0, view = 'network';
    let THREE, renderer, scene, camera, controls, graph, visible = false, initializing = false;
    let meshes = [], edges = [], labels = [], surface, surfacePoints = [], renderFrame = 0, pulseStart = 0;

    function beginCycle() {
        before = E.clone(model);
        trace = E.forward(before, E.inputs[sample()], E.targets[rule.value][sample()]);
        gradients = E.backward(before, trace);
        after = E.apply(before, gradients, rate());
        phase = 0;
    }
    function fillParameters() {
        const previous = parameter.value;
        parameter.replaceChildren(...E.parameters(model).map(p => {
            const option = document.createElement('option');
            option.value = p.key; option.textContent = p.label; return option;
        }));
        if ([...parameter.options].some(o => o.value === previous)) parameter.value = previous;
    }
    const selected = () => E.parameters(before).find(p => p.key === parameter.value) || E.parameters(before)[0];
    function reset() {
        cancelAnimationFrame(trainingFrame);
        training = false; epochs = 0;
        model = E.create(network.value === 'large');
        history = [{ epoch: 0, loss: E.evaluate(model, rule.value).loss }];
        beginCycle(); fillParameters();
        [...example.options].forEach((option, i) => { option.textContent = '(' + E.inputs[i].join(', ') + ') → ' + E.targets[rule.value][i]; });
        if (renderer) buildScene();
        render();
    }
    function setPhase(index) {
        if (training) return;
        phase = index;
        // Replaying a phase is reversible: an update is never applied twice.
        model = E.clone(phase >= 6 ? after : before);
        pulseStart = performance.now();
        render();
    }
    function train() {
        if (training) {
            cancelAnimationFrame(trainingFrame); training = false; beginCycle(); phase = 3; render(); return;
        }
        training = true;
        const stopAt = epochs + 1000;
        function batch() {
            for (let i = 0; i < 16 && epochs < stopAt; i++) {
                model = E.epoch(model, rule.value, rate()); epochs++;
            }
            history.push({ epoch: epochs, loss: E.evaluate(model, rule.value).loss });
            beginCycle(); phase = 3;
            if (epochs >= stopAt) training = false;
            render();
            if (training) trainingFrame = requestAnimationFrame(batch);
        }
        trainingFrame = requestAnimationFrame(batch);
        render();
    }
    function renderInspector() {
        const p = selected(), old = E.value(before, p), grad = E.value(gradients, p), next = E.value(after, p);
        const source = p.kind === 'b' ? 1 : trace.a[p.l][p.i];
        const activation = trace.a[p.l + 1][p.j];
        const hiddenError = p.l < before.layers.length - 1
            ? 'Hidden δ = (' + before.layers[p.l + 1].w.map((weights, j) => f(weights[p.j], 3) + ' × ' + f(gradients.delta[p.l + 1][j], 3)).join(' + ') +
                ') × ' + f(activation, 3) + ' × (1 − ' + f(activation, 3) + ') = ' + f(gradients.delta[p.l][p.j]) + '<br>'
            : 'Output δ = ' + f(trace.prediction) + ' − ' + trace.y + ' = ' + f(trace.prediction - trace.y) + '<br>';
        $('studioParameterMath').innerHTML =
            '<div class="studio-parameter-values"><div><small>Before update</small><strong>' + f(old) +
            '</strong></div><div><small>Gradient ∂L/∂θ</small><strong>' + f(grad) +
            '</strong></div><div><small>' + (phase >= 6 ? 'After update' : 'Proposed update') + '</small><strong><span>' + f(next) +
            '</span></strong></div></div><p class="studio-parameter-equation">' + hiddenError + 'Gradient = ' + f(source) + ' × ' +
            f(gradients.delta[p.l][p.j]) + ' = ' + f(grad) + '<br>θ′ = ' + f(old) + ' − ' + rate() + ' × (' + f(grad) + ') = ' + f(next) +
            '</p><p class="studio-parameter-equation">' + (p.kind === 'b' ? 'A bias acts like a weight connected to a constant input of 1.' :
                'Source activation × destination error. A zero source gives this weight a zero gradient.') +
            (phase < 6 ? ' These values are a preview; weights change only at Update.' : ' Update applied to every parameter simultaneously.') + '</p>';
    }
    function renderCalculations() {
        const p = selected(), last = before.layers.length - 1;
        const source = p.kind === 'b' ? 1 : trace.a[p.l][p.i];
        const layer = before.layers[p.l];
        const terms = layer.w[p.j].map((w, i) => f(w, 3) + ' × ' + f(trace.a[p.l][i], 3)).join(' + ');
        const rows = [
            [['Inputs', '(' + trace.x.join(', ') + ')', 'target ' + trace.y], ['Parameter', p.label, f(E.value(before, p))]],
            [['Contribution', f(source) + ' × ' + f(E.value(before, p)), f(source * E.value(before, p))], ['Weights', 'Forward propagation only reads parameters', 'unchanged']],
            [['z of ' + p.destination, terms + ' + (' + f(layer.b[p.j], 3) + ')', f(trace.z[p.l][p.j])], ['Activation', 'σ(z) = 1 / (1 + exp(−z))', f(trace.a[p.l + 1][p.j])]],
            [['Prediction ŷ', 'σ(output z)', f(trace.prediction)], ['Binary cross-entropy', '−y ln(ŷ) − (1−y) ln(1−ŷ)', f(trace.loss)]],
            [['Output error δ', f(trace.prediction) + ' − ' + trace.y, f(gradients.delta[last][0])], ['Hidden error δ', last ? 'Σ(outgoing weight × next δ) × a(1−a)' : 'No hidden layer in this network', last ? 'chain rule' : '—']],
            [['Destination δ', p.l === last ? 'ŷ − y (sigmoid + cross-entropy)' : 'Σ(w × next δ) × a(1−a)', f(gradients.delta[p.l][p.j])], ['∂L/∂θ', f(source) + ' × ' + f(gradients.delta[p.l][p.j]), f(E.value(gradients, p))]],
            [['Old θ', p.label, f(E.value(before, p))], ['θ′ = θ − η ∂L/∂θ', f(E.value(before, p)) + ' − ' + rate() + ' × (' + f(E.value(gradients, p)) + ')', f(E.value(after, p))]],
            [['Before: example loss', 'Same input, original parameters', f(trace.loss)], ['After: example loss', 'Same input, updated parameters', f(E.forward(after, trace.x, trace.y).loss)]]
        ][phase];
        $('andGateCalculation').replaceChildren(...rows.map(values => {
            const tr = document.createElement('tr');
            values.forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.append(td); }); return tr;
        }));
    }
    function renderHistory() {
        const top = Math.max(.75, ...history.map(p => p.loss)) * 1.1;
        const maxEpoch = Math.max(1000, epochs);
        const y = loss => 112 - loss / top * 90;
        const path = history.map((p, i) => (i ? 'L' : 'M') + (48 + p.epoch / maxEpoch * 824).toFixed(2) + ',' + y(p.loss).toFixed(2)).join(' ');
        $('studioLossChart').innerHTML = [0, .5, 1].map(t => '<line class="chart-grid" x1="48" x2="872" y1="' + y(top * t) + '" y2="' + y(top * t) + '"/><text x="38" text-anchor="end" y="' + (y(top * t) + 4) + '">' + (top * t).toFixed(2) + '</text>').join('') +
            '<path class="loss-line" d="' + path + '"/><circle cx="' + (48 + history[history.length - 1].epoch / maxEpoch * 824) + '" cy="' + y(history[history.length - 1].loss) + '" r="3" fill="var(--accent-1)"/><text x="48" y="136">0</text><text x="872" y="136" text-anchor="end">' + maxEpoch.toLocaleString() + ' epochs</text>';
        $('studioHistoryLabel').textContent = 'Full-batch training · mean loss ' + f(history[history.length - 1].loss) + ' · epoch ' + epochs.toLocaleString() + '. Each epoch updates once using all four rows; single-example steps are not plotted.';
    }
    function render() {
        const result = E.evaluate(model, rule.value);
        const current = result.states[sample()];
        const descriptions = [
            'Choose one row to teach the network. Inputs and the correct answer are data; weights and biases are the learnable parameters.',
            'Each connection multiplies its source activation by its weight. Purple weights encourage activation; orange weights inhibit it. No parameter changes yet.',
            'Each neuron adds all incoming weighted values and its bias to get z. The bias shifts when that neuron switches on.',
            'The sigmoid turns z into a probability. Binary cross-entropy measures how far this prediction is from the target. Forward propagation is now complete; weights are unchanged.',
            'Work backward from the loss. With sigmoid and binary cross-entropy, the output error is δ = ŷ − y. This is the derivative of loss with respect to the output score z.',
            'The chain rule gives each weight its share of the error: gradient = source activation × destination δ. Hidden δ values combine downstream errors. Backprop computes gradients; it does not yet change weights.',
            'Gradient descent updates ALL weights and biases at once: θ′ = θ − learning rate × gradient. A negative gradient increases the parameter; a positive gradient decreases it.',
            'Run forward again with the new parameters. Compare this example’s loss before and after. One improved example does not guarantee that every truth-table row improves.'
        ];
        $('andGatePhase').textContent = (phase + 1) + ' · ' + phases[phase];
        $('andGateProgress').textContent = training ? 'Training · epoch ' + epochs : 'Step ' + (phase + 1) + ' of 8';
        $('andGateLoss').textContent = 'Example loss ' + f(current.loss);
        $('andGateStepDetail').textContent = descriptions[phase];
        $('andGateA11yStatus').textContent = rule.value + ', ' + network.selectedOptions[0].textContent + '. ' + phases[phase] + '. Prediction ' + f(current.prediction) + '. ' + result.correct + ' of 4 rows correct.';
        $('andGatePrev').disabled = training || phase === 0;
        $('andGateNext').disabled = training;
        $('andGateNext').textContent = phase === 7 ? 'Next training cycle' : 'Next step →';
        $('andGateTrain').textContent = training ? 'Pause training' : 'Train 1,000 epochs';
        [rule, network, example].forEach(control => { control.disabled = training; });
        [...$('studioSteps').children].forEach((button, i) => {
            button.disabled = training;
            button.classList.toggle('is-done', i < phase);
            if (i === phase) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
        });
        $('andGateScale').hidden = network.value !== 'large';
        $('studioExperimentNote').textContent = rule.value === 'XOR' && network.value === 'one'
            ? 'Try this: train a single neuron on XOR. It cannot separate the diagonal pairs. Switch to “Hidden layer” to learn the nonlinear boundary. Changing task or network starts fresh.'
            : 'Learning rate η = ' + rate() + '. Class 1 means P(1) ≥ 0.5. Select a connection or neuron to inspect it. Changing the example keeps learned weights; changing the task or network resets them.';
        $('studioTruthTitle').textContent = rule.value + ' truth table · ' + result.correct + '/4 correct';
        $('andGateTruthTable').innerHTML = result.states.map((state, i) =>
            '<tr' + (i === sample() ? ' class="is-active"' : '') + '><td>' + state.x[0] + '</td><td>' + state.x[1] + '</td><td>' + state.y +
            '</td><td><span class="studio-truth-prob"><i style="width:' + state.prediction * 100 + '%"></i></span>' + f(state.prediction, 3) + '</td><td>' + Number(state.prediction >= .5) + '</td></tr>').join('');
        renderInspector(); renderCalculations(); renderHistory();
        if (renderer) { syncScene(); requestRender(); }
    }
    phases.forEach((name, i) => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = name === 'Gradients' ? 'Gradient' : name; button.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + name);
        button.addEventListener('click', () => setPhase(i)); $('studioSteps').append(button);
    });
    $('andGateNext').addEventListener('click', () => { if (phase === 7) { beginCycle(); render(); } else setPhase(phase + 1); });
    $('andGatePrev').addEventListener('click', () => setPhase(Math.max(0, phase - 1)));
    $('andGateReset').addEventListener('click', reset);
    $('andGateTrain').addEventListener('click', train);
    rule.addEventListener('change', reset); network.addEventListener('change', reset);
    example.addEventListener('change', () => { beginCycle(); render(); });
    parameter.addEventListener('change', render);
    document.querySelectorAll('[data-studio-view]').forEach(button => button.addEventListener('click', () => {
        view = button.dataset.studioView;
        document.querySelectorAll('[data-studio-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        if (renderer) { buildScene(); resetCamera(); syncScene(); requestRender(); }
    }));

    function makeLabel(text, position, kind = 'node') {
        const element = document.createElement('span');
        element.className = 'studio-' + kind + '-label'; element.textContent = text;
        $('studioLabels').append(element);
        const label = { element, position }; labels.push(label); return label;
    }
    function makeNode(position, radius, color) {
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 24),
            new THREE.MeshStandardMaterial({ color, roughness: .26, metalness: .2, emissive: color, emissiveIntensity: .12 }));
        mesh.position.copy(position); graph.add(mesh); return mesh;
    }
    function addNeuron(position, layer, index, name) {
        const mesh = makeNode(position, .23, layer < 0 ? 0x71d7c2 : 0x958bfa);
        const label = makeLabel('', position.clone().add(new THREE.Vector3(0, -.36, 0)));
        if (layer >= 0) mesh.userData.key = layer + '-b-' + index;
        meshes.push({ mesh, label, layer, index, name });
        return position;
    }
    function addEdge(start, end, p) {
        const direction = end.clone().sub(start);
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, direction.length(), 10),
            new THREE.MeshStandardMaterial({ color: 0x958bfa, transparent: true, opacity: .65, roughness: .6 }));
        mesh.position.copy(start).add(end).multiplyScalar(.5);
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        mesh.userData.key = p.key; graph.add(mesh);
        const label = makeLabel('', start.clone().lerp(end, network.value === 'large' ? .36 : .47), 'edge');
        const pulse = makeNode(start, .065, 0x80edd3);
        edges.push({ mesh, label, pulse, start, end, p });
    }
    function disposeGraph() {
        if (!graph) return;
        graph.traverse(object => {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) object.material.forEach(m => m.dispose()); else object.material?.dispose();
        });
        scene.remove(graph);
        $('studioLabels').replaceChildren(); meshes = []; edges = []; labels = []; surfacePoints = []; surface = null;
    }
    function buildScene() {
        disposeGraph(); graph = new THREE.Group(); scene.add(graph);
        const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
        if (view === 'surface') {
            $('studioSceneTitle').textContent = 'The shape of a learned decision';
            $('studioSceneHelp').textContent = 'Height = P(1) · translucent plane = 0.5';
            stage.querySelector('.and-gate-key').hidden = true;
            const resolution = 40, positions = [], colors = [], indices = [];
            for (let j = 0; j <= resolution; j++) for (let i = 0; i <= resolution; i++) {
                positions.push(i / resolution * 5 - 2.5, 0, j / resolution * 5 - 2.5); colors.push(1, 1, 1);
                if (i < resolution && j < resolution) {
                    const a = j * (resolution + 1) + i, b = a + resolution + 1;
                    indices.push(a, b, a + 1, b, b + 1, a + 1);
                }
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            geometry.setIndex(indices);
            surface = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: .86, roughness: .5, metalness: .08 }));
            graph.add(surface);
            const grid = new THREE.GridHelper(5, 10, 0x506078, 0x2b384f); grid.position.y = -1.5; graph.add(grid);
            const threshold = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .08, side: THREE.DoubleSide, depthWrite: false }));
            threshold.rotation.x = -Math.PI / 2; graph.add(threshold);
            makeLabel('x₁  0 → 1', v(0, -1.8, 2.9));
            makeLabel('x₂  0 → 1', v(3.1, -1.8, 0));
            E.inputs.forEach((x, i) => {
                const mesh = makeNode(v(x[0] * 5 - 2.5, 0, x[1] * 5 - 2.5), .12, E.targets[rule.value][i] ? 0x80edd3 : 0xffa96f);
                const label = makeLabel('', mesh.position.clone());
                surfacePoints.push({ mesh, label, x, i });
            });
        } else {
            $('studioSceneTitle').textContent = network.value === 'one' ? 'One neuron · two weights + one bias' : '2 inputs → 3 hidden neurons → 1 output';
            $('studioSceneHelp').textContent = 'Drag to rotate · select a node or connection';
            stage.querySelector('.and-gate-key').hidden = false;
            const hidden = network.value === 'large';
            const positions = [hidden ? [v(-3.3, 1.1), v(-3.3, -1.1)] : [v(-2.65, 1.25), v(-2.65, -1.25)]];
            positions.push(hidden ? [v(0, 1.7, -.3), v(0, 0, .45), v(0, -1.7, -.3)] : [v(2.25, 0)]);
            if (hidden) positions.push([v(3.3, 0)]);
            positions.forEach((layer, l) => layer.forEach((position, i) => addNeuron(position, l - 1, i, l === 0 ? 'x' + (i + 1) : l === positions.length - 1 ? 'ŷ' : 'h' + (i + 1))));
            E.parameters(model).filter(p => p.kind === 'w').forEach(p => addEdge(positions[p.l][p.i], positions[p.l + 1][p.j], p));
            if (!hidden) {
                const bias = v(-2.65, 0, -.45);
                addNeuron(bias, -2, 0, 'constant 1');
                addEdge(bias, positions[1][0], E.parameters(model).find(p => p.kind === 'b'));
            }
            const grid = new THREE.GridHelper(12, 12, 0x2b384f, 0x202b40); grid.position.y = -2.6; graph.add(grid);
        }
        resetCamera(); syncScene();
    }
    function syncScene() {
        const state = E.forward(model, E.inputs[sample()], E.targets[rule.value][sample()]);
        meshes.forEach(node => {
            const activation = node.layer === -2 ? 1 : node.layer === -1 ? state.x[node.index] : state.a[node.layer + 1][node.index];
            node.mesh.material.emissiveIntensity = .08 + activation * .45;
            node.mesh.material.color.set(node.mesh.userData.key === parameter.value ? 0xcac4ff : node.layer < 0 ? 0x71d7c2 : 0x958bfa);
            node.label.element.textContent = node.name + ' = ' + f(activation, 3) + (node.layer >= 0 ? '\nb = ' + f(model.layers[node.layer].b[node.index], 3) : '');
        });
        edges.forEach(edge => {
            const weight = E.value(model, edge.p);
            edge.mesh.material.color.set(weight >= 0 ? 0x958bfa : 0xffa96f);
            edge.mesh.material.opacity = parameter.value === edge.p.key ? 1 : .55;
            const thickness = .014 + Math.min(Math.abs(weight) * .016, .055);
            edge.mesh.scale.set(thickness, 1, thickness);
            edge.label.element.textContent = (stage.clientWidth < 500 ? edge.p.label + ' · ' : edge.p.kind === 'b' ? 'b ' : '') + f(weight, 3);
            edge.label.element.classList.toggle('is-selected', parameter.value === edge.p.key);
        });
        if (surface) {
            const positions = surface.geometry.attributes.position, colors = surface.geometry.attributes.color;
            const low = new THREE.Color(0x8777f4), high = new THREE.Color(0x6de5bd), color = new THREE.Color();
            for (let i = 0; i < positions.count; i++) {
                const prediction = E.forward(model, [(positions.getX(i) + 2.5) / 5, (positions.getZ(i) + 2.5) / 5]).prediction;
                positions.setY(i, (prediction - .5) * 3);
                color.copy(low).lerp(high, prediction); colors.setXYZ(i, color.r, color.g, color.b);
            }
            positions.needsUpdate = true; colors.needsUpdate = true; surface.geometry.computeVertexNormals();
            surfacePoints.forEach(point => {
                const prediction = E.forward(model, point.x).prediction;
                point.mesh.position.y = (prediction - .5) * 3 + .05;
                point.label.position.copy(point.mesh.position).add(new THREE.Vector3(0, .35, 0));
                point.label.element.textContent = '(' + point.x.join(', ') + ') · ' + f(prediction, 2) + '\ntarget ' + E.targets[rule.value][point.i];
            });
        }
    }
    function fitCamera() {
        if (!renderer) return;
        const width = stage.clientWidth, height = stage.clientHeight, aspect = width / height;
        const halfHeight = Math.max(3.7, 5.1 / aspect);
        camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
        camera.top = halfHeight; camera.bottom = -halfHeight;
        camera.updateProjectionMatrix(); renderer.setSize(width, height, false);
        if (graph) syncScene();
        requestRender();
    }
    function resetCamera() {
        if (!camera) return;
        controls.target.set(0, 0, 0);
        camera.position.set(...(view === 'surface' ? [7, 5.8, 8] : [.55, .65, 11.8]));
        controls.update(); fitCamera();
    }
    function requestRender() {
        if (!renderFrame && renderer && visible && !document.hidden) renderFrame = requestAnimationFrame(draw);
    }
    function draw(now) {
        renderFrame = 0;
        if (!visible || document.hidden) return;
        const t = (now - pulseStart) / 1200;
        const animate = !reduceMotion.matches && t >= 0 && t < 1 && phase >= 1 && phase <= 5;
        edges.forEach(edge => {
            edge.pulse.visible = animate;
            if (animate) edge.pulse.position.copy(edge.start).lerp(edge.end, phase >= 4 ? 1 - t : t);
        });
        renderer.render(scene, camera);
        $('studioLoading').hidden = true;
        labels.forEach(label => {
            const screen = label.position.clone().project(camera);
            label.element.style.left = (screen.x * .5 + .5) * stage.clientWidth + 'px';
            label.element.style.top = (-screen.y * .5 + .5) * stage.clientHeight + 'px';
            label.element.hidden = screen.z < -1 || screen.z > 1;
        });
        if (animate) requestRender();
    }
    async function initThree() {
        if (renderer || initializing) return;
        initializing = true;
        try {
            THREE = await import('./assets/vendor/three/three.module.js');
            const { OrbitControls } = await import('./assets/vendor/three/OrbitControls.js');
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
            renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
            renderer.setClearColor(0x111727, 0);
            renderer.domElement.setAttribute('aria-hidden', 'true');
            $('studioThreeMount').append(renderer.domElement);
            scene = new THREE.Scene();
            scene.add(new THREE.HemisphereLight(0xdce9ff, 0x243347, 2.5));
            const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(2, 5, 5); scene.add(light);
            camera = new THREE.OrthographicCamera(-5, 5, 3.7, -3.7, .1, 100);
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enablePan = false; controls.enableZoom = false; controls.enableDamping = false;
            controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI * .77;
            controls.addEventListener('change', requestRender);
            let pointerStart;
            renderer.domElement.addEventListener('pointerdown', event => { pointerStart = [event.clientX, event.clientY]; });
            renderer.domElement.addEventListener('pointerup', event => {
                if (!pointerStart || Math.hypot(event.clientX - pointerStart[0], event.clientY - pointerStart[1]) > 5 || view !== 'network') return;
                const rect = renderer.domElement.getBoundingClientRect();
                const ray = new THREE.Raycaster();
                ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), camera);
                const hit = ray.intersectObjects([...meshes.map(n => n.mesh), ...edges.map(e => e.mesh)]).find(item => item.object.userData.key);
                if (hit) { parameter.value = hit.object.userData.key; render(); }
            });
            renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); $('studioFallback').hidden = false; });
            renderer.domElement.addEventListener('webglcontextrestored', () => { $('studioFallback').hidden = true; buildScene(); requestRender(); });
            new ResizeObserver(fitCamera).observe(stage);
            buildScene(); requestRender();
        } catch (error) {
            console.warn('3D scene unavailable; numerical lab remains usable.', error);
            $('studioLoading').hidden = true;
            $('studioFallback').hidden = false;
            renderer?.dispose(); renderer = null;
        } finally { initializing = false; }
    }
    $('studioCameraReset').addEventListener('click', resetCamera);
    document.addEventListener('visibilitychange', requestRender);
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) { initThree(); requestRender(); }
        else { cancelAnimationFrame(renderFrame); renderFrame = 0; }
    }, { rootMargin: '100px' }).observe(stage);
    reset();
})();
