(() => {
    'use strict';

    function setupArchitectureExplorer() {
        const data = window.PyTorchCourseData?.architectures;
        const tabs = Array.from(document.querySelectorAll('[data-architecture]'));
        const fields = {
            family: document.getElementById('architectureFamily'),
            title: document.getElementById('architectureTitle'),
            intuition: document.getElementById('architectureIntuition'),
            shape: document.getElementById('architectureShape'),
            use: document.getElementById('architectureUse'),
            blocks: document.getElementById('architectureBlocks'),
            caution: document.getElementById('architectureCaution'),
            code: document.getElementById('architectureCode')
        };
        if (!data || !tabs.length || Object.values(fields).some(field => !field)) return;

        function selectArchitecture(id, focus = false) {
            const item = data[id];
            if (!item) return;
            Object.entries(fields).forEach(([key, element]) => {
                element.textContent = item[key];
            });
            tabs.forEach(tab => {
                const selected = tab.dataset.architecture === id;
                tab.setAttribute('aria-selected', selected ? 'true' : 'false');
                tab.tabIndex = selected ? 0 : -1;
                if (selected && focus) tab.focus();
            });
        }

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => selectArchitecture(tab.dataset.architecture));
            tab.addEventListener('keydown', event => {
                if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                let nextIndex = index;
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = tabs.length - 1;
                selectArchitecture(tabs[nextIndex].dataset.architecture, true);
            });
        });
        selectArchitecture(tabs.find(tab => tab.getAttribute('aria-selected') === 'true')?.dataset.architecture || 'mlp');
    }

    function setupManimCarousel() {
        const carousel = document.getElementById('pytorchManimCarousel');
        const track = document.getElementById('pytorchManimTrack');
        const previous = document.getElementById('pytorchManimPrev');
        const next = document.getElementById('pytorchManimNext');
        const counter = document.getElementById('pytorchManimCounter');
        const dots = document.getElementById('pytorchManimDots');
        if (!carousel || !track || !previous || !next || !counter || !dots) return;

        const slides = Array.from(track.querySelectorAll('.pytorch-carousel-slide'));
        if (!slides.length) return;
        let current = 0;

        const dotButtons = slides.map((slide, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('aria-label', `Show slide ${index + 1}: ${slide.querySelector('h4')?.textContent || 'concept'}`);
            button.addEventListener('click', () => show(index, true));
            dots.appendChild(button);
            return button;
        });

        function show(index, userInitiated = false) {
            current = (index + slides.length) % slides.length;
            track.style.transform = `translateX(-${current * 100}%)`;
            counter.textContent = `${current + 1} / ${slides.length}`;
            slides.forEach((slide, slideIndex) => {
                const active = slideIndex === current;
                slide.setAttribute('aria-hidden', active ? 'false' : 'true');
                const video = slide.querySelector('video');
                if (!video) return;
                if (!active) video.pause();
                else if (userInitiated) video.play().catch(() => {});
            });
            dotButtons.forEach((button, dotIndex) => {
                button.setAttribute('aria-current', dotIndex === current ? 'true' : 'false');
            });
        }

        previous.addEventListener('click', () => show(current - 1, true));
        next.addEventListener('click', () => show(current + 1, true));
        carousel.addEventListener('keydown', event => {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                show(current - 1, true);
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                show(current + 1, true);
            }
        });
        show(0);
    }

    function setupExampleLinks() {
        const select = document.getElementById('pythonCourseExample');
        const lab = document.getElementById('python-course-lab');
        const buttons = Array.from(document.querySelectorAll('[data-pytorch-example]'));
        if (!select || !lab || !buttons.length) return;

        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const requested = button.dataset.pytorchExample;
                const option = select.querySelector(`option[value="${requested}"]`);
                if (!option) return;
                select.value = requested;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                lab.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    function setupNanoGPTExplorer() {
        const tabs = Array.from(document.querySelectorAll('[data-nanogpt-step]'));
        const fields = {
            kicker: document.getElementById('nanoGPTStepKicker'),
            title: document.getElementById('nanoGPTStepTitle'),
            concept: document.getElementById('nanoGPTStepConcept'),
            input: document.getElementById('nanoGPTStepInput'),
            operation: document.getElementById('nanoGPTStepOperation'),
            output: document.getElementById('nanoGPTStepOutput'),
            api: document.getElementById('nanoGPTStepAPI'),
            invariant: document.getElementById('nanoGPTStepInvariant'),
            failure: document.getElementById('nanoGPTStepFailure'),
            source: document.getElementById('nanoGPTStepSource')
        };
        if (!tabs.length || Object.values(fields).some(field => !field)) return;

        const steps = {
            data: {
                kicker: 'prepare.py · data contract',
                title: 'Tokenize text into one contiguous integer stream',
                concept: 'The model never receives strings. A tokenizer maps text to integer IDs and writes independent training and validation streams plus decoding metadata.',
                input: 'UTF-8 text',
                operation: 'tokenizer.encode',
                output: 'uint16 token stream [N]',
                api: 'Tokenizer · NumPy array/memmap · metadata',
                invariant: 'The tokenizer and vocabulary are versioned with the model, and validation text never becomes training evidence.',
                failure: 'A different vocabulary gives the same integer a different meaning and invalidates learned embeddings.',
                source: 'data/*/prepare.py → train.py lines 114–131'
            },
            batch: {
                kicker: 'train.py · get_batch',
                title: 'Sample aligned windows for next-token prediction',
                concept: 'A random start index selects block_size + 1 consecutive tokens. The first T become input x; the same window shifted one place becomes target y.',
                input: 'token stream [N]',
                operation: 'slice + stack + shift',
                output: 'x,y [B,T]',
                api: 'np.memmap · randint · from_numpy · stack · pin_memory · to',
                invariant: 'For every row and position, y[b,t] is the token immediately after x[b,t] in the original stream.',
                failure: 'Shuffling tokens inside a window destroys language structure; shifting by zero leaks the answer.',
                source: 'train.py lines 116–131'
            },
            embed: {
                kicker: 'model.py · GPT.forward',
                title: 'Add token identity and absolute position',
                concept: 'Token embeddings answer “what symbol is this?” and position embeddings answer “where is it?” Broadcasting adds [T,C] positions to every batch row.',
                input: 'token IDs [B,T]',
                operation: 'wte(idx) + wpe(arange(T))',
                output: 'residual stream [B,T,C]',
                api: 'nn.Embedding · torch.arange · broadcasting · Dropout',
                invariant: 'T cannot exceed block_size, token IDs must be integer and less than vocabulary size, and both embeddings share width C.',
                failure: 'A tokenizer/model vocabulary mismatch appears as out-of-range IDs or silently wrong meanings.',
                source: 'model.py lines 170–180'
            },
            block: {
                kicker: 'model.py · Block + CausalSelfAttention + MLP',
                title: 'Apply two pre-normalized residual edits per block',
                concept: 'Attention routes information from allowed prefix positions. The 4× MLP transforms each token independently. Residual addition preserves a direct information path.',
                input: 'stream [B,T,C]',
                operation: 'LN→attention→add; LN→MLP→add',
                output: 'stream [B,T,C]',
                api: 'LayerNorm · Linear · SDPA · GELU · Dropout · view/transpose',
                invariant: 'C is divisible by H; causal attention never assigns weight to a future position; every residual branch returns width C.',
                failure: 'A wrong transpose can keep valid dimensions while mixing heads, time, or channels incorrectly.',
                source: 'model.py lines 29–106'
            },
            loss: {
                kicker: 'model.py · language head and objective',
                title: 'Score the true next token at every position',
                concept: 'The tied language head maps C features to V raw logits. Flattening B and T turns teacher forcing into B×T classification problems evaluated in parallel.',
                input: 'hidden [B,T,C] + targets [B,T]',
                operation: 'lm_head + cross_entropy',
                output: 'logits [B,T,V] + scalar loss',
                api: 'nn.Linear · Tensor.view · F.cross_entropy',
                invariant: 'Targets are class indices, logits are unnormalized, and no position may read the target token through attention.',
                failure: 'Applying softmax before cross-entropy loses numerical stability and violates the API contract.',
                source: 'model.py lines 182–193'
            },
            backward: {
                kicker: 'train.py · accumulation loop',
                title: 'Accumulate a correctly scaled gradient over microbatches',
                concept: 'Each loss is divided by A before backward, so A accumulated mean gradients equal one larger logical batch gradient when examples and reduction match.',
                input: 'A scalar losses',
                operation: 'scaler.scale(loss/A).backward()',
                output: 'summed parameter.grad tensors',
                api: 'autograd · GradScaler · DDP synchronization control',
                invariant: 'Do not zero gradients between microsteps; synchronize distributed gradients only after the final local contribution.',
                failure: 'Forgetting the 1/A factor multiplies the effective gradient and changes optimization unless learning rate is compensated.',
                source: 'train.py lines 290–305'
            },
            step: {
                kicker: 'train.py · stable parameter update',
                title: 'Unscale, clip, apply AdamW, then release gradients',
                concept: 'fp16 gradients are returned to real scale before a global-norm bound. AdamW uses moment state and decoupled decay; zero_grad(set_to_none=True) frees buffers.',
                input: 'parameters + gradients + optimizer state',
                operation: 'unscale → clip → step → update scaler',
                output: 'new parameters + moment state',
                api: 'clip_grad_norm_ · AdamW · GradScaler.step/update · zero_grad',
                invariant: 'Every rank starts with identical parameters and applies the same synchronized update.',
                failure: 'Clipping scaled gradients measures the artificial scale, not the true global norm.',
                source: 'train.py lines 306–315; model.py lines 263–287'
            },
            checkpoint: {
                kicker: 'train.py · evaluation and durable state',
                title: 'Measure held-out loss and save a resumable experiment',
                concept: 'Evaluation averages many random batches in eval/no-grad mode. A checkpoint stores the model, optimizer, architecture, progress, best validation loss, and run config.',
                input: 'model + optimizer + validation stream',
                operation: 'estimate_loss + state_dict + torch.save',
                output: 'metrics + ckpt.pt',
                api: 'eval/train · no_grad · state_dict · torch.save/load',
                invariant: 'A resumed architecture must match saved tensor shapes and the validation split remains untouched by updates.',
                failure: 'Weights without optimizer moments, step, tokenizer, or data identity do not reproduce the training trajectory.',
                source: 'train.py lines 158–202 and 214–286'
            },
            generate: {
                kicker: 'sample.py + model.py · autoregressive loop',
                title: 'Turn the final-position logits into one new token',
                concept: 'Crop context, run the model, temperature-scale the final logits, top-k mask, softmax, sample, append, and repeat. Original nanoGPT recomputes the prefix each time.',
                input: 'prompt IDs [B,T≤block_size]',
                operation: 'forward → temperature → top-k → sample',
                output: 'extended IDs [B,T+1]',
                api: 'no_grad · topk · softmax · multinomial · cat',
                invariant: 'Generation uses eval mode, temperature is positive, and the same tokenizer decodes the sampled IDs.',
                failure: 'No KV cache means compute repeats as context grows; top-k and temperature alter diversity but cannot repair learned knowledge.',
                source: 'model.py lines 305–330; sample.py lines 76–88'
            }
        };

        function selectStep(id, focus = false) {
            const step = steps[id];
            if (!step) return;
            Object.entries(fields).forEach(([key, field]) => {
                field.textContent = step[key];
            });
            tabs.forEach(tab => {
                const selected = tab.dataset.nanogptStep === id;
                tab.setAttribute('aria-selected', selected ? 'true' : 'false');
                tab.tabIndex = selected ? 0 : -1;
                if (selected && focus) tab.focus();
            });
        }

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => selectStep(tab.dataset.nanogptStep));
            tab.addEventListener('keydown', event => {
                if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault();
                let next = index;
                if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
                if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = tabs.length - 1;
                selectStep(tabs[next].dataset.nanogptStep, true);
            });
        });
        selectStep('data');
    }

    function initialize() {
        setupArchitectureExplorer();
        setupManimCarousel();
        setupExampleLinks();
        setupNanoGPTExplorer();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
