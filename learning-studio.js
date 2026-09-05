(() => {
    'use strict';
    const chapterNav = document.querySelector('.chapter-switcher');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    new ResizeObserver(() => {
        document.documentElement.style.setProperty('--studio-nav-height', chapterNav.getBoundingClientRect().height + 'px');
    }).observe(chapterNav);

    // Use the existing chapter controls as the single source of navigation behavior.
    const destinations = ['ai-categories','math-atlas','python-mental-model','ml-intro','kaggle-ml-roadmap','and-gate-lab','rl-fundamentals','transformer-map'];
    const chapters = [...document.querySelectorAll('.chapter-btn')];
    document.querySelectorAll('.guided-curriculum li').forEach((item, index) => {
        const strong = item.querySelector('strong');
        const chapter = document.querySelector('.chapter[data-chapter="' + chapters[index].dataset.chapter + '"]');
        const target = chapter.querySelector('[id="' + destinations[index] + '"]') || chapter.querySelector('.example-section:not([hidden])[id]');
        const link = document.createElement('a');
        link.className = 'curriculum-link';
        link.href = '#' + target.id;
        link.textContent = strong.textContent;
        strong.replaceChildren(link);
    });

    const dialog = document.createElement('dialog');
    dialog.className = 'lesson-dialog';
    dialog.setAttribute('aria-label', 'Find a lesson');
    dialog.innerHTML = '<div class="lesson-dialog-top"><label><span class="sr-only">Search lesson titles</span><input type="search" placeholder="Vectors, backpropagation, attention…" autocomplete="off"></label><button type="button" aria-label="Close lesson search">Esc</button></div><ul class="lesson-results"></ul>';
    document.body.appendChild(dialog);
    const search = dialog.querySelector('input');
    const results = dialog.querySelector('ul');
    const names = new Map(chapters.map(button => [button.dataset.chapter, button.textContent.trim().replace(/^\d+\s*/, '')]));
    const entries = [...document.querySelectorAll('.chapter h2, .chapter h3')].flatMap((heading, index) => {
        const chapter = heading.closest('.chapter');
        if (!names.has(chapter.dataset.chapter) || heading.closest('[hidden]')) return [];
        if (!heading.id) heading.id = 'lesson-heading-' + index;
        return [{ title: heading.textContent.trim(), id: heading.id, chapter: names.get(chapter.dataset.chapter) }];
    });
    function renderResults() {
        const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const matches = entries.filter(entry => terms.every(term => (entry.title + ' ' + entry.chapter).toLowerCase().includes(term))).slice(0,30);
        results.replaceChildren();
        matches.forEach(entry => {
            const li = document.createElement('li');
            const a = document.createElement('a'), small = document.createElement('small');
            a.href = '#' + entry.id; a.textContent = entry.title;
            small.textContent = entry.chapter;
            a.append(small); li.append(a); results.append(li);
        });
        if (!matches.length) { const li = document.createElement('li'); li.className = 'lesson-empty'; li.textContent = 'No matching lessons. Try “gradient” or “attention”.'; results.append(li); }
    }
    const searchButton = document.getElementById('lessonSearchOpen');
    searchButton.querySelector('kbd').textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
    function openSearch() { renderResults(); dialog.showModal(); search.focus(); }
    searchButton.addEventListener('click', openSearch);
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    search.addEventListener('input', renderResults);
    search.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); results.querySelector('a')?.focus(); }
        if (event.key === 'Enter') { event.preventDefault(); results.querySelector('a')?.click(); }
    });
    results.addEventListener('keydown', event => {
        const links = [...results.querySelectorAll('a')], index = links.indexOf(document.activeElement);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); links[(index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length]?.focus(); }
    });
    document.addEventListener('keydown', event => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); dialog.open ? dialog.close() : openSearch(); }
    });
    // Delegate only new links; pre-existing links already have the site's handler.
    document.addEventListener('click', event => {
        const link = event.target.closest('.curriculum-link, .lesson-results a');
        if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = document.getElementById(link.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        if (dialog.open) dialog.close();
        setActiveChapter(target.closest('.chapter').dataset.chapter);
        refreshAllVisuals();
        history.pushState(null, '', link.hash);
        target.scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth' });
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    });
    let scheduled = false;
    function updateSectionIndicator() {
        scheduled = false;
        const links = [...document.querySelectorAll('.chapter.is-active .chapter-nav a')];
        const offset = chapterNav.getBoundingClientRect().height + 105;
        let active = links[0];
        links.forEach(link => {
            const target = document.getElementById(link.hash.slice(1));
            if (target && target.getBoundingClientRect().top <= offset) active = link;
        });
        links.forEach(link => { if (link === active) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
    }
    document.addEventListener('scroll', () => {
        if (!scheduled) { scheduled = true; requestAnimationFrame(updateSectionIndicator); }
    }, { passive: true });
    document.addEventListener('mlmath:chapter-change', () => requestAnimationFrame(updateSectionIndicator));
    function restoreLocation() {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        const target = document.getElementById(id || 'learning-roadmap');
        const chapter = target?.closest('.chapter');
        if (!chapter || target.closest('[hidden]')) return;
        setActiveChapter(chapter.dataset.chapter);
        refreshAllVisuals();
        requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
    }
    window.addEventListener('popstate', restoreLocation);
    window.addEventListener('hashchange', restoreLocation);
    // Fonts and equation typesetting may move the initial deep-link target.
    window.addEventListener('load', () => { if (location.hash) restoreLocation(); });
    updateSectionIndicator();
})();
