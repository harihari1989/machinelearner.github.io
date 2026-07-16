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

    function initialize() {
        setupArchitectureExplorer();
        setupManimCarousel();
        setupExampleLinks();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
