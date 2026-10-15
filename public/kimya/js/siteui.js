// Gezinme ve tam ekran görünümü: fare, klavye ve dokunma için ortak arayüz.
(() => {
    document.documentElement.classList.add('js');
    const menu = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    const closeMenu = () => {
        menu?.setAttribute('aria-expanded', 'false');
        nav?.classList.remove('is-open');
        const label = menu?.querySelector('.sr-only');
        if (label) label.textContent = 'Menüyü aç';
    };
    menu?.addEventListener('click', () => {
        const open = menu.getAttribute('aria-expanded') !== 'true';
        menu.setAttribute('aria-expanded', String(open));
        nav?.classList.toggle('is-open', open);
        menu.querySelector('.sr-only').textContent = open ? 'Menüyü kapat' : 'Menüyü aç';
    });
    nav?.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.site-header')) closeMenu();
    });
    let expanded = null;
    let previousFocus = null;
    const closeViewer = () => {
        if (!expanded) return;
        const stage = expanded;
        expanded = null;
        stage.classList.remove('is-expanded');
        const hint = stage.querySelector('.viewer-toolbar > p');
        if (hint && stage.dataset.inlineHint) hint.textContent = stage.dataset.inlineHint;
        stage.removeAttribute('role');
        stage.removeAttribute('aria-modal');
        stage.removeAttribute('aria-label');
        stage.querySelector('[data-expand]').setAttribute('aria-pressed', 'false');
        stage.querySelector('[data-expand]').setAttribute('aria-label', 'Tam ekran aç');
        stage.querySelector('[data-expand]').textContent = '⛶';
        document.body.classList.remove('viewer-open');
        previousFocus?.focus({ preventScroll: true });
    };
    document.querySelectorAll('[data-expand]').forEach((button) => {
        button.addEventListener('click', () => {
            const stage = button.closest('.stage');
            if (expanded === stage) return closeViewer();
            closeViewer();
            previousFocus = button;
            expanded = stage;
            stage.classList.add('is-expanded');
            const hint = stage.querySelector('.viewer-toolbar > p');
            if (hint) { stage.dataset.inlineHint = hint.textContent; hint.textContent = 'Döndür · iki parmakla yakınlaş'; }
            stage.setAttribute('role', 'dialog');
            stage.setAttribute('aria-modal', 'true');
            stage.setAttribute('aria-label', stage.querySelector('.stage-canvas').getAttribute('aria-label'));
            button.setAttribute('aria-pressed', 'true');
            button.setAttribute('aria-label', 'Tam ekranı kapat');
            button.textContent = '×';
            document.body.classList.add('viewer-open');
            stage.querySelector('.stage-canvas').focus({ preventScroll: true });
        });
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closeMenu(); closeViewer(); }
        if (event.key !== 'Tab' || !expanded) return;
        const controls = [...expanded.querySelectorAll('button, select, input, [tabindex="0"]')].filter((el) => !el.disabled);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    const links = [...document.querySelectorAll('.mobile-dock [data-section]')].filter((link) => link.getAttribute('href').startsWith('#'));
    if ('IntersectionObserver' in window && links.length) {
        const visible = new Map();
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => visible.set(entry.target.id, entry.isIntersecting));
            const current = links.find((link) => visible.get(link.dataset.section));
            if (!current) return;
            links.forEach((link) => {
                if (link === current) link.setAttribute('aria-current', 'location');
                else link.removeAttribute('aria-current');
            });
        }, { rootMargin: '-20% 0px -45% 0px' });
        links.forEach((link) => {
            const section = document.getElementById(link.dataset.section);
            if (section) observer.observe(section);
        });
    }
})();
