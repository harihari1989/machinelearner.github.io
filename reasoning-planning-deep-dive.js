(() => {
    'use strict';

    const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

    function setupCausalLab() {
        const lab = document.getElementById('rpCausalLab');
        const type = document.getElementById('rpCausalType');
        const estimate = document.getElementById('rpCausalEstimate');
        const explanation = document.getElementById('rpCausalExplanation');
        if (!lab || !type || !estimate || !explanation) return;

        const queries = {
            observe: {
                type: 'Association',
                estimate: '54.5% recovered',
                explanation: 'This is a property of the observed treated group, not the effect of assigning treatment. Severity creates a backdoor path and makes the raw comparison misleading.'
            },
            intervene: {
                type: 'Intervention',
                estimate: '72.5% under treatment',
                explanation: 'Standardize the treated outcome within each severity group to the full population: 0.5 × 95% + 0.5 × 50% = 72.5%. Compare with 52.5% under no treatment.'
            },
            counterfactual: {
                type: 'Counterfactual',
                estimate: 'Not identified from these rates',
                explanation: 'A population table does not reveal both potential outcomes for this one person. A unit-level answer needs a structural causal model plus assumptions that connect observed and unobserved worlds.'
            }
        };

        lab.querySelectorAll('input[name="rpCausalQuery"]').forEach(input => {
            input.addEventListener('change', () => {
                const query = queries[input.value];
                if (!input.checked || !query) return;
                type.textContent = query.type;
                estimate.textContent = query.estimate;
                explanation.textContent = query.explanation;
            });
        });
    }

    function setupControllerLab() {
        const lab = document.getElementById('rpControllerLab');
        const gauge = lab?.querySelector('.rp-gauge');
        const score = document.getElementById('rpVerificationScore');
        const mode = document.getElementById('rpResponseMode');
        const title = document.getElementById('rpResponseTitle');
        const explanation = document.getElementById('rpResponseExplanation');
        if (!lab || !gauge || !score || !mode || !title || !explanation) return;

        const controls = [
            { input: document.getElementById('rpEvidence'), output: document.getElementById('rpEvidenceValue') },
            { input: document.getElementById('rpDissent'), output: document.getElementById('rpDissentValue') },
            { input: document.getElementById('rpStakes'), output: document.getElementById('rpStakesValue') },
            { input: document.getElementById('rpTime'), output: document.getElementById('rpTimeValue') }
        ];
        if (controls.some(control => !control.input || !control.output)) return;

        function update() {
            const [evidence, dissent, stakes, time] = controls.map(control => Number(control.input.value));
            controls.forEach(control => { control.output.value = control.input.value; });
            const budget = Math.round(clamp(
                stakes * 0.42 + dissent * 0.28 + (100 - evidence) * 0.22 + time * 0.08,
                0,
                100
            ));
            gauge.style.setProperty('--rp-gauge', `${budget}%`);
            score.textContent = String(budget);

            if (budget >= 75) {
                mode.textContent = 'Suspend and escalate';
                title.textContent = 'Require authoritative verification or human approval';
                explanation.textContent = 'High stakes, weak evidence, or strong independent dissent make an immediate commitment unsafe. Preserve state, gather authoritative evidence, and define who may approve.';
            } else if (budget >= 55) {
                mode.textContent = 'Verify before acting';
                title.textContent = 'Run a targeted external check';
                explanation.textContent = 'The expected value of a focused check is high. Name the unresolved assumption, choose evidence that could falsify it, and time-box the investigation.';
            } else if (budget >= 35) {
                mode.textContent = 'Proceed provisionally';
                title.textContent = 'Choose a reversible step and monitor';
                explanation.textContent = 'Evidence is adequate for a bounded next step, but not an irreversible commitment. State confidence, attach a stop condition, and watch the predicted signal.';
            } else {
                mode.textContent = 'Act with routine monitoring';
                title.textContent = 'The verification cost exceeds its expected value';
                explanation.textContent = 'Strong evidence and modest stakes support action. Keep an audit trail and ordinary monitoring instead of manufacturing objections that cannot change the decision.';
            }
        }

        controls.forEach(control => control.input.addEventListener('input', update));
        update();
    }

    function setupAgentLab() {
        const lab = document.getElementById('rpAgentLab');
        const tabs = Array.from(lab?.querySelectorAll('[data-rp-topology]') || []);
        const visual = document.getElementById('rpAgentVisual');
        const fields = {
            kicker: document.getElementById('rpTopologyKicker'),
            title: document.getElementById('rpTopologyTitle'),
            description: document.getElementById('rpTopologyDescription'),
            diversity: document.getElementById('rpTopologyDiversity'),
            contamination: document.getElementById('rpTopologyContamination'),
            latency: document.getElementById('rpTopologyLatency'),
            use: document.getElementById('rpTopologyUse')
        };
        if (!lab || !tabs.length || !visual || Object.values(fields).some(field => !field)) return;

        const topologies = {
            independent: {
                kicker: 'Parallel before contact',
                title: 'Independent proposals preserve diversity',
                description: 'Agents solve the same task without seeing one another, then a judge compares claims and evidence. This reduces anchoring but may duplicate work.',
                diversity: 'High', contamination: 'Low', latency: 'Low', use: 'Generate rival hypotheses'
            },
            debate: {
                kicker: 'Sequential critique',
                title: 'Debate exposes assumptions—and spreads anchors',
                description: 'Agents alternately challenge prior messages. Critique is visible, but early mistakes and rhetorical dominance can contaminate the whole group.',
                diversity: 'Medium', contamination: 'High', latency: 'High', use: 'Stress-test a short list'
            },
            blackboard: {
                kicker: 'Shared typed state',
                title: 'A validated blackboard separates claims from evidence',
                description: 'Agents publish structured claims to shared state. A validator controls promotion from proposed to verified, reducing transcript drift and stale-memory reuse.',
                diversity: 'Medium–high', contamination: 'Medium', latency: 'Medium', use: 'Long-lived workflows'
            },
            market: {
                kicker: 'Confidence-weighted aggregation',
                title: 'A market rewards calibrated information',
                description: 'Agents update probabilities or allocate a score budget to outcomes. Aggregation is compact, but shared priors and poor calibration can still create false certainty.',
                diversity: 'Medium', contamination: 'Medium', latency: 'Low–medium', use: 'Forecast measurable outcomes'
            }
        };

        function selectTopology(id, shouldFocus = false) {
            const topology = topologies[id];
            if (!topology) return;
            Object.entries(fields).forEach(([key, field]) => { field.textContent = topology[key]; });
            visual.dataset.mode = id;
            tabs.forEach(tab => {
                const selected = tab.dataset.rpTopology === id;
                tab.setAttribute('aria-selected', selected ? 'true' : 'false');
                tab.tabIndex = selected ? 0 : -1;
                if (selected && shouldFocus) tab.focus();
            });
        }

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => selectTopology(tab.dataset.rpTopology));
            tab.addEventListener('keydown', event => {
                if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                let next = index;
                if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
                if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = tabs.length - 1;
                selectTopology(tabs[next].dataset.rpTopology, true);
            });
        });
        selectTopology('independent');
    }

    function setupSagaLab() {
        const lab = document.getElementById('rpSagaLab');
        const steps = Array.from(lab?.querySelectorAll('[data-rp-saga-step]') || []);
        const next = document.getElementById('rpSagaNext');
        const fail = document.getElementById('rpSagaFail');
        const reset = document.getElementById('rpSagaReset');
        const status = document.getElementById('rpSagaStatus');
        const log = document.getElementById('rpSagaLog');
        if (!lab || steps.length !== 4 || !next || !fail || !reset || !status || !log) return;

        const messages = [
            'Request validated against patient identity, authorization, appointment window, and transport policy.',
            'Vehicle capacity held with idempotency key transport-482; hold expires in 10 minutes.',
            'Clinic arrival slot confirmed; its receipt is linked to the vehicle hold.',
            'Itinerary committed and notifications published. Outcome monitoring is now active.'
        ];
        let current = 0;
        let failed = false;

        function append(message) {
            const item = document.createElement('li');
            item.textContent = message;
            log.appendChild(item);
        }

        function render() {
            steps.forEach((step, index) => {
                step.classList.toggle('is-done', index < current && !step.classList.contains('is-rolled-back'));
                step.classList.toggle('is-active', !failed && index === current);
            });
            fail.disabled = failed || current !== 2;
            next.disabled = failed || current >= steps.length;
            status.textContent = failed ? 'Compensated · re-plan required' : current >= steps.length ? 'Committed · monitoring' : `Step ${current + 1} of ${steps.length}`;
        }

        next.addEventListener('click', () => {
            if (failed || current >= steps.length) return;
            append(messages[current]);
            current += 1;
            render();
        });

        fail.addEventListener('click', () => {
            if (failed || current !== 2) return;
            failed = true;
            steps[1].classList.remove('is-done');
            steps[1].classList.add('is-rolled-back');
            steps[2].classList.add('is-rolled-back');
            append('Clinic reservation failed: the requested slot was taken by a higher-priority case.');
            append('Compensation executed: vehicle hold transport-482 released. The request remains valid and returns to planning with alternative windows.');
            render();
        });

        reset.addEventListener('click', () => {
            current = 0;
            failed = false;
            steps.forEach(step => step.classList.remove('is-done', 'is-active', 'is-rolled-back'));
            log.innerHTML = '<li>Plan created. No external state has changed.</li>';
            render();
        });
        render();
    }

    function setupPlanBuilder() {
        const lab = document.getElementById('rpPlanBuilder');
        const buttons = Array.from(lab?.querySelectorAll('[data-rp-constraint]') || []);
        const score = document.getElementById('rpPlanScore');
        const feedback = document.getElementById('rpPlanFeedback');
        if (!lab || !buttons.length || !score || !feedback) return;

        const selected = new Set();
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const constraint = button.dataset.rpConstraint;
                if (constraint === 'cosmetic') {
                    button.classList.add('is-wrong');
                    button.setAttribute('aria-pressed', 'false');
                    feedback.textContent = 'That order is not required. Adding false dependencies makes the plan slower and can hide the real safety gates.';
                    return;
                }
                selected.add(constraint);
                button.classList.add('is-correct');
                button.classList.remove('is-wrong');
                button.setAttribute('aria-pressed', 'true');
                score.textContent = `${selected.size} / 3 constraints found`;
                feedback.textContent = selected.size === 3
                    ? 'All required constraints found. Clearance protects airspace, landing-zone verification protects the crew, and the scarce uplink must be held before streaming depends on it.'
                    : 'Correct. Now look for another safety gate or scarce resource dependency.';
            });
        });
    }

    function setupQuizStudio() {
        const quizzes = Array.from(document.querySelectorAll('.rp-quiz[data-rp-answer]'));
        const bar = document.getElementById('rpProgressBar');
        const text = document.getElementById('rpProgressText');
        const reset = document.getElementById('rpProgressReset');
        if (!quizzes.length || !bar || !text || !reset) return;

        const storageKey = 'machinelearner-rp-progress-v1';
        const feedback = {
            intervention: 'Correct. The wording assigns an action to a population, so the target is an interventional effect—not the observed treated-group rate.',
            independent: 'Correct. Independence before contact preserves alternative hypotheses; evidence-based aggregation can happen afterward.',
            provenance: 'Correct. Provenance and lifecycle metadata reveal whether the record is stale, inferred, disputed, or scoped to another context.',
            compensate: 'Correct. A saga uses a business-level compensating action when a distributed workflow cannot roll back atomically.',
            outcomes: 'Correct. Compare task outcomes, constraint violations, recovery, latency, and cost against a strong single-agent baseline.'
        };
        let completed = new Set();
        try {
            const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (Array.isArray(saved)) completed = new Set(saved.filter(Number.isInteger));
        } catch (_error) {
            completed = new Set();
        }

        function persist() {
            try { localStorage.setItem(storageKey, JSON.stringify([...completed])); } catch (_error) {}
        }

        function render() {
            quizzes.forEach((quiz, index) => {
                if (!completed.has(index)) return;
                const correct = quiz.querySelector(`[data-rp-choice="${quiz.dataset.rpAnswer}"]`);
                const output = quiz.querySelector('.rp-quiz-feedback');
                correct?.classList.add('is-correct');
                correct?.setAttribute('aria-pressed', 'true');
                if (output) output.textContent = feedback[quiz.dataset.rpAnswer];
            });
            const count = completed.size;
            bar.style.width = `${Math.round(count / quizzes.length * 100)}%`;
            text.textContent = `${count} of ${quizzes.length} checks completed`;
        }

        quizzes.forEach((quiz, index) => {
            const answer = quiz.dataset.rpAnswer;
            const output = quiz.querySelector('.rp-quiz-feedback');
            quiz.querySelectorAll('[data-rp-choice]').forEach(button => {
                button.addEventListener('click', () => {
                    const correct = button.dataset.rpChoice === answer;
                    quiz.querySelectorAll('[data-rp-choice]').forEach(choice => {
                        choice.classList.remove('is-wrong');
                        if (choice.dataset.rpChoice !== answer) choice.classList.remove('is-correct');
                        choice.setAttribute('aria-pressed', choice === button ? 'true' : 'false');
                    });
                    if (correct) {
                        button.classList.add('is-correct');
                        completed.add(index);
                        if (output) output.textContent = feedback[answer];
                        persist();
                        render();
                    } else {
                        button.classList.add('is-wrong');
                        if (output) output.textContent = 'Not quite. Re-read the governing distinction, then choose the option that changes evidence quality, execution safety, or measured outcomes.';
                    }
                });
            });
        });

        reset.addEventListener('click', () => {
            completed = new Set();
            try { localStorage.removeItem(storageKey); } catch (_error) {}
            quizzes.forEach(quiz => {
                quiz.querySelectorAll('[data-rp-choice]').forEach(button => {
                    button.classList.remove('is-correct', 'is-wrong');
                    button.setAttribute('aria-pressed', 'false');
                });
                const output = quiz.querySelector('.rp-quiz-feedback');
                if (output) output.textContent = '';
            });
            render();
        });
        render();
    }

    function initialize() {
        setupCausalLab();
        setupControllerLab();
        setupAgentLab();
        setupSagaLab();
        setupPlanBuilder();
        setupQuizStudio();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
