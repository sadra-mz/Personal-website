const PAGE_TITLES = { home: 'خانه', about: 'درباره من', services: 'خدمات', projects: 'پروژه‌ها', contact: 'تماس', skills: 'مهارت‌ها' };

class PortfolioApp {
    constructor() {
        this.loaderElement = document.getElementById('loader');
        this.loaderTextElement = this.loaderElement?.querySelector('.loader-word');
        this.textScrambleLoader = this.loaderTextElement && typeof TextScrambleLoader === 'function'
            ? new TextScrambleLoader(this.loaderTextElement, ['LOADING...', 'INITIALIZING...', 'CONNECTING...', 'READY.'])
            : null;
        this.motionMedia = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        this.pageKey = this.detectPage();
        this.projectModal = document.getElementById('projectModal');
        this.currentYear = document.getElementById('currentYear');
        this.activeCounters = [];
        this.init();
    }

    detectPage() {
        const name = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        const key = name.replace(/\.html$/, '');
        return name === 'index.html' || !PAGE_TITLES[key] ? 'home' : key;
    }

    init() {
        // Every real HTML document starts behind the same hacker loader.
        // The browser/cache still reuses previously loaded CSS, fonts, scripts and images;
        // the loader is a visual transition, not a request to download everything again.
        this.showLoader();
        this.startHackerLoader();
        this.initializeLoadingSequence();

        this.bindNavigation();
        this.bindMobileMenu();
        this.bindModal();
        this.setupGlowEffectListeners();
        this.setupTiltEffectListeners();
        this.setupCustomContextMenu();
        this.setupScrollListener();
        this.setupPageFeatures();
        this.setYear();
        this.updateActiveLink();
    }

    async startHackerLoader() {
        if (!this.textScrambleLoader) return;
        this.textScrambleLoader.stopCycleAndResolve();
        this.textScrambleLoader.isCycling = true;
        this.hackerLoaderRunning = true;

        while (this.hackerLoaderRunning) {
            const phrases = ['LOADING...', 'INITIALIZING...', 'CONNECTING...', 'READY.'];
            for (const phrase of phrases) {
                if (!this.hackerLoaderRunning) break;
                await this.textScrambleLoader.setText(phrase);
                if (!this.hackerLoaderRunning) break;
                await this.wait(10);
            }
        }
    }

    bindNavigation() {
        // Keep true multi-page navigation, but put the current document behind the
        // hacker loader before handing control back to the browser. This prevents
        // the abrupt "old page -> new page" flash.
        document.querySelectorAll('a[href]').forEach(link => {
            link.addEventListener('click', event => {
                if (event.defaultPrevented || (typeof event.button === 'number' && event.button !== 0) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

                const rawHref = link.getAttribute('href') || '';
                if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return;
                if (link.target && link.target !== '_self') return;

                const url = new URL(rawHref, window.location.href);
                if (url.origin !== window.location.origin) return;
                if (url.href === window.location.href) return;

                event.preventDefault();
                if (this.mobileNavPanel?.classList.contains('open')) this.toggleMobileNav();

                this.showLoader();
                this.startHackerLoader();

                // Give the browser a paint opportunity so the transition is actually
                // visible before the next HTML document starts loading.
                window.setTimeout(() => {
                    window.location.assign(url.href);
                }, 100);
            });
        });
    }

    showLoader() {
        this.loaderElement?.classList.add('visible');
        this.loaderElement?.setAttribute('aria-hidden', 'false');
        document.body?.classList.add('is-loading');
    }

    bindMobileMenu() {
        this.hamburgerIcon = document.getElementById('hamburger-icon');
        this.mobileNavPanel = document.getElementById('mobile-nav-panel');
        if (!this.hamburgerIcon || !this.mobileNavPanel) return;
        this.hamburgerIcon.addEventListener('click', () => this.toggleMobileNav());
    }

    toggleMobileNav() {
        if (!this.hamburgerIcon || !this.mobileNavPanel) return;
        this.hamburgerIcon.classList.toggle('open');
        this.mobileNavPanel.classList.toggle('open');
        document.body.style.overflow = this.mobileNavPanel.classList.contains('open') ? 'hidden' : '';
    }

    bindModal() {
        const closeButton = document.getElementById('closeModal');
        closeButton?.addEventListener('click', () => this.closeModal());
        this.projectModal?.addEventListener('click', event => {
            if (event.target === this.projectModal) this.closeModal();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                this.closeModal();
                this.closeCustomContextMenu();
            }
        });
    }

    closeModal() {
        if (!this.projectModal) return;
        this.projectModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    setYear() {
        if (this.currentYear) this.currentYear.textContent = String(new Date().getFullYear());
        document.title = `SADRA MZ | ${PAGE_TITLES[this.pageKey] || 'خانه'}`;
    }

    setupPageFeatures() {
        if (this.pageKey === 'home') {
            if (typeof MatrixRain === 'function') {
                try { new MatrixRain('matrix-rain-canvas'); } catch (_) {}
            }
            this.initCounters();
        }
        if (this.pageKey === 'contact') {
            this.bindContactForm();
            this.bindRubika();
        }
        if (this.pageKey === 'projects') this.bindProjectButtons();
    }

    initCounters() {
        document.querySelectorAll('[data-count]').forEach(element => {
            const target = Number.parseInt(element.dataset.count, 10);
            if (!Number.isFinite(target)) return;
            if (this.motionMedia?.matches) {
                element.textContent = String(target);
                return;
            }
            const start = performance.now();
            const duration = 1500;
            const tick = time => {
                const progress = Math.min((time - start) / duration, 1);
                element.textContent = String(progress === 1 ? target : Math.floor(progress * target));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }

    bindContactForm() {
        const form = document.getElementById('contact-form');
        const status = document.getElementById('form-status');
        if (!form || form.dataset.bound) return;
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (!form.checkValidity()) {
                form.reportValidity();
                if (status) status.innerHTML = '<p class="text-red-500 hacker-terminal">// لطفاً تمام فیلدهای لازم را کامل کنید.</p>';
                return;
            }
            if (status) status.innerHTML = '<p class="text-yellow-400 hacker-terminal">// این فرم هنوز به سرویس ارسال متصل نشده است. از روبیکا استفاده کنید.</p>';
            const card = document.querySelector('.rubika-card');
            card?.classList.add('attention-pulse');
            window.setTimeout(() => card?.classList.remove('attention-pulse'), 900);
        });
        form.dataset.bound = 'true';
    }

    bindRubika() {
        const button = document.getElementById('copy-rubika-id');
        const id = document.getElementById('rubika-id');
        const status = document.getElementById('copy-rubika-status');
        if (!button || !id || !status || button.dataset.bound) return;
        button.addEventListener('click', async () => {
            const value = id.textContent.trim();
            try {
                await navigator.clipboard.writeText(value);
                status.textContent = '// آیدی روبیکا کپی شد.';
                button.innerHTML = '<i class="fas fa-check ml-2"></i>کپی شد';
            } catch (_) {
                const textarea = document.createElement('textarea');
                textarea.value = value;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                if (document.execCommand('copy')) status.textContent = '// آیدی روبیکا کپی شد.';
                else status.textContent = '// کپی خودکار ممکن نبود؛ آیدی را انتخاب و کپی کنید.';
                textarea.remove();
            }
            window.setTimeout(() => { button.innerHTML = '<i class="fas fa-copy ml-2"></i>کپی آیدی'; }, 1600);
        });
        button.dataset.bound = 'true';
    }

    bindProjectButtons() {
        document.querySelectorAll('.project-details-button').forEach(button => {
            button.addEventListener('click', () => {
                const card = button.closest('.project-card');
                if (!card) return;
                const title = document.getElementById('modalTitle');
                const image = document.getElementById('modalImage');
                const description = document.getElementById('modalDescription');
                const tech = document.getElementById('modalTech');
                if (title) title.textContent = card.dataset.projectTitle || '';
                if (image) image.src = card.dataset.projectImg || '';
                if (description) description.textContent = card.dataset.projectDescription || '';
                if (tech) {
                    tech.replaceChildren(...(card.dataset.projectTech || '').split('|').filter(Boolean).map(item => {
                        const span = document.createElement('span');
                        span.className = 'inline-block bg-[var(--primary-bg)] border border-[var(--border-color)] text-[var(--accent-color)] text-xs font-semibold ml-2 mb-2 px-3 py-1 rounded-full shadow-sm';
                        span.textContent = item;
                        return span;
                    }));
                }
                this.projectModal?.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
    }

    setupGlowEffectListeners() {
        document.querySelectorAll('.interactive-glow-box').forEach(box => {
            box.addEventListener('pointermove', event => {
                const rect = box.getBoundingClientRect();
                box.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
                box.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
            });
        });
    }

    setupTiltEffectListeners() {
        if (this.motionMedia?.matches) return;
        document.querySelectorAll('.tilt-effect').forEach(element => {
            element.addEventListener('pointermove', event => {
                if (event.pointerType === 'touch') return;
                const rect = element.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                if (!centerX || !centerY) return;
                const rotateX = ((event.clientY - rect.top - centerY) / centerY) * -8;
                const rotateY = ((event.clientX - rect.left - centerX) / centerX) * 8;
                element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`;
            });
            element.addEventListener('pointerleave', () => {
                element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
            });
        });
    }

    setupCustomContextMenu() {
        const menu = document.getElementById('custom-context-menu');
        if (!menu) return;
        document.addEventListener('contextmenu', event => {
            event.preventDefault();
            menu.style.display = 'block';
            menu.style.left = `${Math.min(event.clientX, innerWidth - menu.offsetWidth - 5)}px`;
            menu.style.top = `${Math.min(event.clientY, innerHeight - menu.offsetHeight - 5)}px`;
            requestAnimationFrame(() => menu.classList.add('active'));
        });
        document.addEventListener('click', event => {
            if (!menu.contains(event.target)) this.closeCustomContextMenu();
        });
        menu.querySelectorAll('.context-menu-link').forEach(link => {
            link.addEventListener('click', () => this.closeCustomContextMenu());
        });
    }

    closeCustomContextMenu() {
        const menu = document.getElementById('custom-context-menu');
        if (!menu) return;
        menu.classList.remove('active');
        window.setTimeout(() => {
            if (!menu.classList.contains('active')) menu.style.display = 'none';
        }, 220);
    }

    setupScrollListener() {
        const progressBar = document.getElementById('progress-bar');
        const progressContainer = document.getElementById('scroll-progress-container');
        const circumference = 2 * Math.PI * 15.9155;
        if (progressBar) progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
        window.addEventListener('scroll', () => {
            const max = document.documentElement.scrollHeight - innerHeight;
            const ratio = max > 0 ? scrollY / max : 0;
            if (progressBar) progressBar.style.strokeDashoffset = String(circumference * (1 - ratio));
            progressContainer?.classList.toggle('visible', scrollY > 200);
        }, { passive: true });
        document.getElementById('scroll-to-top-btn')?.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: this.motionMedia?.matches ? 'auto' : 'smooth' });
        });
    }

    updateActiveLink() {
        const current = this.pageKey === 'home' ? 'index.html' : `${this.pageKey}.html`;
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            link.classList.toggle('active', href.endsWith(current));
        });
    }

    wait(ms) {
        return new Promise(resolve => window.setTimeout(resolve, ms));
    }

    waitForEvent(target, eventName, timeout = 12000) {
        if (!target) return Promise.resolve();
        if (eventName === 'load' && document.readyState === 'complete') return Promise.resolve();
        return new Promise(resolve => {
            let settled = false;
            let timer = null;
            const finish = () => {
                if (settled) return;
                settled = true;
                target.removeEventListener(eventName, finish);
                if (timer) window.clearTimeout(timer);
                resolve();
            };
            timer = window.setTimeout(finish, timeout);
            target.addEventListener(eventName, finish, { once: true });
        });
    }

    async waitForImages(root = document, timeout = 8000) {
        const images = [...root.querySelectorAll('img')];
        if (!images.length) return;
        await Promise.race([
            Promise.all(images.map(image => {
                if (image.complete) return Promise.resolve();
                return new Promise(resolve => {
                    image.addEventListener('load', resolve, { once: true });
                    image.addEventListener('error', resolve, { once: true });
                });
            })),
            this.wait(timeout)
        ]);
    }

    async waitForStylesheets(timeout = 8000) {
        const sheets = [...document.querySelectorAll('link[rel="stylesheet"]')].filter(link => link.href);
        if (!sheets.length) return;
        await Promise.race([
            Promise.all(sheets.map(link => {
                if (link.sheet) return Promise.resolve();
                return new Promise(resolve => {
                    link.addEventListener('load', resolve, { once: true });
                    link.addEventListener('error', resolve, { once: true });
                });
            })),
            this.wait(timeout)
        ]);
    }

    async waitForDocumentReady() {
        // The original loader remains active for the entire first load.
        await this.waitForEvent(window, 'load', 20000);
        await this.waitForStylesheets(8000);

        if (document.fonts?.ready) {
            await Promise.race([document.fonts.ready.catch(() => undefined), this.wait(5000)]);
        }

        await this.waitForImages(document, 8000);

        // Let the browser finish layout/paint before exposing the page.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await this.wait(80);
    }

    stopHackerLoader() {
        this.hackerLoaderRunning = false;
        if (this.textScrambleLoader) this.textScrambleLoader.stopCycleAndResolve();
    }

    async initializeLoadingSequence() {
        try {
            await this.waitForDocumentReady();
        } finally {
            this.stopHackerLoader();
            this.loaderElement?.classList.remove('visible');
            this.loaderElement?.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('is-loading');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.portfolioApp = new PortfolioApp();
});

window.addEventListener('pageshow', event => {
    if (!event.persisted || !window.portfolioApp) return;
    window.portfolioApp.showLoader();
    window.portfolioApp.startHackerLoader();
    window.portfolioApp.initializeLoadingSequence();
});
