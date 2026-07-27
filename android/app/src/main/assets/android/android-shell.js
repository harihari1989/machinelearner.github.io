(() => {
    'use strict';
    if (window.MachineLearnerApp) return;

    const STORAGE_KEY = 'machine-learner-android-progress-v1';
    let framePending = false;
    let lastEmit = 0;

    document.body.classList.add('android-app');

    const clamp = value => Math.max(0, Math.min(1, value));
    const activeChapter = () => document.querySelector('.chapter.is-active') || document.querySelector('.chapter');
    const activeChapterId = () => activeChapter()?.dataset.chapter || 'foundations';

    function activateChapter(chapterId) {
        const button = document.querySelector(`.chapter-btn[data-chapter="${CSS.escape(chapterId)}"]`);
        if (button) {
            button.click();
            return true;
        }
        return false;
    }

    function visibleAnchor() {
        const chapter = activeChapter();
        if (!chapter) return '';
        const sections = [...chapter.querySelectorAll('section[id], .notebook-group[id]')];
        let current = sections[0];
        for (const section of sections) {
            if (section.getBoundingClientRect().top <= 150) current = section;
            else break;
        }
        return current?.id || '';
    }

    function currentHeading() {
        const anchor = visibleAnchor();
        const section = anchor ? document.getElementById(anchor) : null;
        return section?.querySelector('h2, h3')?.textContent?.trim()
            || activeChapter()?.querySelector('h2')?.textContent?.trim()
            || 'Machine Learner';
    }

    function progress() {
        const chapter = activeChapter();
        if (!chapter) return 0;
        const rect = chapter.getBoundingClientRect();
        const chapterTop = window.scrollY + rect.top;
        const available = Math.max(1, chapter.scrollHeight - window.innerHeight);
        return Math.round(clamp((window.scrollY - chapterTop) / available) * 100);
    }

    function saveAndEmit(force = false) {
        const now = performance.now();
        if (!force && now - lastEmit < 140) return;
        lastEmit = now;
        const state = {
            chapter: activeChapterId(),
            anchor: visibleAnchor(),
            y: Math.max(0, Math.round(window.scrollY)),
            progress: progress()
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_error) {
            // Native preferences still retain the last chapter and anchor.
        }
        window.AndroidLearning?.onProgress(
            state.progress,
            state.chapter,
            state.anchor,
            currentHeading()
        );
    }

    function scheduleEmit() {
        if (framePending) return;
        framePending = true;
        requestAnimationFrame(() => {
            framePending = false;
            saveAndEmit();
        });
    }

    function replaceHash(anchorId) {
        if (!anchorId) return;
        if (history.replaceState) history.replaceState(null, '', `#${anchorId}`);
    }

    function openChapter(chapterId, anchorId, behavior = 'smooth') {
        activateChapter(chapterId);
        requestAnimationFrame(() => {
            const target = anchorId ? document.getElementById(anchorId) : activeChapter();
            (target || document.documentElement).scrollIntoView({ behavior, block: 'start' });
            replaceHash(anchorId);
            setTimeout(() => saveAndEmit(true), behavior === 'smooth' ? 450 : 50);
        });
    }

    function readSavedState() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (_error) {
            return null;
        }
    }

    function boot(preferredChapter, preferredAnchor) {
        const saved = readSavedState();
        const chapterId = preferredChapter || saved?.chapter || activeChapterId();
        const anchorId = preferredAnchor || (saved?.chapter === chapterId ? saved.anchor : '');
        activateChapter(chapterId);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const target = anchorId ? document.getElementById(anchorId) : null;
            if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
            else if (saved?.chapter === chapterId && Number.isFinite(saved.y)) window.scrollTo(0, saved.y);
            window.AndroidLearning?.onReady(chapterId, currentHeading());
            saveAndEmit(true);
        }));
    }

    document.addEventListener('click', event => {
        const link = event.target.closest('a[href]');
        if (link) {
            const url = new URL(link.href, document.baseURI);
            const isLocalDocument = url.origin === location.origin;
            if (!isLocalDocument) {
                event.preventDefault();
                window.AndroidLearning?.openExternal(url.href);
                return;
            }
            setTimeout(() => saveAndEmit(true), 500);
        }
        if (event.target.closest('.chapter-btn')) setTimeout(() => saveAndEmit(true), 100);
    }, true);

    window.addEventListener('scroll', scheduleEmit, { passive: true });
    window.addEventListener('resize', scheduleEmit, { passive: true });
    document.addEventListener('mlmath:theme-change', scheduleEmit);

    window.MachineLearnerApp = Object.freeze({ boot, openChapter });
})();
