/**
 * Bot Admin Console - Main Application
 * INTENSE CHAOS INTRO with Matrix Rain, Cracks, Errors
 */

(function () {
    'use strict';

    // ===========================
    // CONFIG
    // ===========================
    const CONFIG = {
        SKIP_INTRO: false,
        INTRO_CHAOS_DURATION: 4000,  // 4 seconds pressure buildup
        INTRO_EYES_DURATION: 400,    // 0.4 seconds - SUPER FAST!
        INTRO_HELLO_DURATION: 2000,  // 2 seconds for typing
        VIEW_TRANSITION_DURATION: 500
    };

    // ===========================
    // STATE
    // ===========================
    const state = {
        currentView: 'dashboard',
        introComplete: false
    };

    // ===========================
    // DOM HELPERS
    // ===========================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    // ===========================
    // INTRO SEQUENCE
    // ===========================
    const Intro = {
        screen: null,
        matrixInterval: null,
        chaosIntervals: [],

        init() {
            this.screen = $('#intro-screen');
            if (!this.screen) return;

            if (CONFIG.SKIP_INTRO) {
                this.complete();
                return;
            }

            this.runSequence();
        },

        async runSequence() {
            await this.runChaosStage();
            await this.runEyesStage();
            await this.runHelloStage();
            this.complete();
        },

        async runChaosStage() {
            const canvas = $('#matrix-canvas');
            const ctx = canvas?.getContext('2d');
            const popupContainer = $('#popup-container');
            const bigWarning = $('.big-warning');
            const floatTexts = $$('.float-text');

            // Setup matrix canvas
            if (canvas && ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                this.startMatrixRain(ctx, canvas);
            }

            // Error messages
            const errors = [
                '⚠ CRITICAL ERROR 0x80004005',
                'ACCESS VIOLATION AT 0x00000000',
                'BUFFER OVERFLOW DETECTED',
                'STACK CORRUPTION',
                'MEMORY FAULT',
                'SEGMENTATION FAULT',
                'KERNEL PANIC',
                'SYSTEM HALTED',
                'DATA CORRUPTION',
                'FIREWALL BREACH',
                'UNAUTHORIZED ACCESS',
                'ENCRYPTION FAILED',
                'TRACE ROUTE DETECTED',
                'MALWARE INJECTION',
                'ROOTKIT INSTALLED'
            ];

            // Warning messages
            const warnings = [
                '⚠ SYSTEM COMPROMISED',
                'BREACH DETECTED',
                'ACCESS DENIED',
                'FATAL ERROR',
                'INTRUSION ALERT',
                '!!! DANGER !!!'
            ];

            // Code snippets for floating text
            const codeSnippets = [
                `> rm -rf /\n> chmod 777 *\n> cat /etc/passwd\n> wget malware.exe`,
                `0x7FF4A2B3\n0xDEADBEEF\n0xCAFEBABE\n0x00000000`,
                `if(bypass) {\n  inject();\n  escalate();\n}`,
                `[FOUND] admin:admin\n[FOUND] root:toor\n[CRACK] ********`,
                `ssh -L 8080:localhost:80\nproxy chain: TOR\nip: SPOOFED`,
                `kernel32.dll HIJACKED\nntdll.dll PATCHED\nsvchost.exe INFECTED`
            ];

            // Spawn error popups rapidly
            const spawnError = () => {
                const popup = document.createElement('div');
                popup.className = 'error-popup';
                popup.textContent = errors[Math.floor(Math.random() * errors.length)];
                popup.style.top = `${5 + Math.random() * 80}%`;
                popup.style.left = `${5 + Math.random() * 70}%`;
                popupContainer?.appendChild(popup);

                setTimeout(() => popup.remove(), 300 + Math.random() * 400);
            };

            // Flash big warning
            const flashWarning = () => {
                if (bigWarning) {
                    bigWarning.textContent = warnings[Math.floor(Math.random() * warnings.length)];
                    bigWarning.style.opacity = '1';
                    setTimeout(() => {
                        bigWarning.style.opacity = '0';
                    }, 150);
                }
            };

            // Update floating texts rapidly
            const updateFloatTexts = () => {
                floatTexts.forEach(el => {
                    el.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
                });
            };

            // Start INTENSE chaos intervals - MUCH FASTER
            this.chaosIntervals.push(setInterval(spawnError, 50));  // Error every 50ms!
            this.chaosIntervals.push(setInterval(flashWarning, 200)); // Warning every 200ms
            this.chaosIntervals.push(setInterval(updateFloatTexts, 100)); // Text every 100ms

            // Initial text
            updateFloatTexts();

            await this.sleep(CONFIG.INTRO_CHAOS_DURATION);

            // Cleanup
            this.chaosIntervals.forEach(id => clearInterval(id));
            this.chaosIntervals = [];
            if (this.matrixInterval) {
                cancelAnimationFrame(this.matrixInterval);
            }
            popupContainer.innerHTML = '';
        },

        startMatrixRain(ctx, canvas) {
            const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            const fontSize = 14;
            const columns = Math.floor(canvas.width / fontSize);
            const drops = new Array(columns).fill(1);

            const draw = () => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = '#FFD54A';
                ctx.font = `${fontSize}px monospace`;

                for (let i = 0; i < drops.length; i++) {
                    const char = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(char, i * fontSize, drops[i] * fontSize);

                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }

                this.matrixInterval = requestAnimationFrame(draw);
            };

            draw();
        },

        async runEyesStage() {
            const hackingEl = $('#intro-hacking');
            const eyesEl = $('#intro-eyes');
            const leftEye = $('#intro-eyes .eye.left');
            const rightEye = $('#intro-eyes .eye.right');

            hackingEl?.classList.add('hidden');
            eyesEl?.classList.remove('hidden');

            leftEye?.classList.add('flash');
            rightEye?.classList.add('flash');

            await this.sleep(CONFIG.INTRO_EYES_DURATION);
        },

        async runHelloStage() {
            const eyesEl = $('#intro-eyes');
            const helloEl = $('#intro-hello');
            const titleEl = $('.hello-title');

            eyesEl?.classList.add('hidden');
            helloEl?.classList.remove('hidden');

            // Programmer types print command
            const command = 'print("Hello, World!")';
            titleEl?.classList.add('typing');
            titleEl.style.fontFamily = 'var(--font-mono)';
            titleEl.style.fontSize = 'clamp(1.5rem, 5vw, 3rem)';

            // Type character by character
            for (let i = 0; i <= command.length; i++) {
                if (titleEl) titleEl.textContent = '> ' + command.substring(0, i);
                await this.sleep(CONFIG.INTRO_HELLO_DURATION / command.length);
            }

            // Brief pause then smooth transition
            await this.sleep(600);
        },

        complete() {
            state.introComplete = true;
            this.chaosIntervals.forEach(id => clearInterval(id));
            if (this.matrixInterval) {
                cancelAnimationFrame(this.matrixInterval);
            }

            if (this.screen) {
                this.screen.classList.add('fade-out');
                setTimeout(() => {
                    this.screen.style.display = 'none';
                }, 1000);
            }
            $('#landing-page')?.classList.remove('hidden');
        },

        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    };

    // ===========================
    // VIEW TRANSITIONS
    // ===========================
    const Transitions = {
        overlay: null,

        init() {
            this.overlay = $('#view-transition');
        },

        async play() {
            if (!this.overlay) return;
            this.overlay.classList.remove('hidden');
            this.overlay.classList.add('active');
            await new Promise(resolve => setTimeout(resolve, CONFIG.VIEW_TRANSITION_DURATION));
            this.overlay.classList.remove('active');
            this.overlay.classList.add('hidden');
        }
    };

    // ===========================
    // NAVIGATION
    // ===========================
    const elements = {
        landingPage: null,
        appLayout: null,
        sidebar: null,
        navItems: null,
        views: null,
        modals: null
    };

    function initElements() {
        elements.landingPage = $('#landing-page');
        elements.appLayout = $('#app-layout');
        elements.sidebar = $('#sidebar');
        elements.navItems = $$('.nav-item');
        elements.views = $$('.app-view');
        elements.modals = $$('.modal-overlay');
    }

    async function showView(viewName, withTransition = true) {
        state.currentView = viewName;
        if (withTransition) await Transitions.play();

        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        elements.views.forEach(view => {
            const isTarget = view.id === `view-${viewName}`;
            view.classList.toggle('hidden', !isTarget);
            if (isTarget) {
                view.classList.remove('glitch-in');
                void view.offsetWidth;
                view.classList.add('glitch-in');
            }
        });
    }

    function initNavigation() {
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view && view !== state.currentView) showView(view);
            });
        });
    }

    // ===========================
    // LOGIN / LOGOUT
    // ===========================
    async function handleLogin() {
        await Transitions.play();
        elements.landingPage.classList.add('hidden');
        elements.appLayout.classList.remove('hidden');
        elements.appLayout.classList.add('glitch-in');
        showView('dashboard', false);
        showToast('Welcome to the console!', 'success');
    }

    function handleLogout() {
        elements.appLayout.classList.add('hidden');
        elements.landingPage.classList.remove('hidden');
        closeAllModals();
        showToast('Session terminated', 'info');
    }

    function initAuth() {
        $('#btn-login')?.addEventListener('click', handleLogin);
        $('#btn-access')?.addEventListener('click', handleLogin);
        $('#btn-logout')?.addEventListener('click', handleLogout);
    }

    // ===========================
    // MODALS
    // ===========================
    function openModal(modalId) {
        const modal = $(`#${modalId}`);
        if (modal) modal.classList.remove('hidden');
    }

    function closeModal(modal) {
        modal.classList.add('hidden');
    }

    function closeAllModals() {
        elements.modals.forEach(m => m.classList.add('hidden'));
    }

    function initModals() {
        $('#btn-settings')?.addEventListener('click', () => openModal('modal-settings'));
        $('#user-menu')?.addEventListener('click', () => openModal('modal-profile'));

        $$('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal-overlay');
                if (modal) closeModal(modal);
            });
        });

        $$('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modal);
            });
        });
    }

    // ===========================
    // TOAST NOTIFICATIONS
    // ===========================
    function showToast(message, type = 'info') {
        let container = $('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ===========================
    // SIDEBAR TOGGLE
    // ===========================
    function initSidebar() {
        $('#btn-menu')?.addEventListener('click', () => {
            elements.sidebar.classList.toggle('open');
        });
    }

    // ===========================
    // KEYBOARD SHORTCUTS
    // ===========================
    function initKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 's' && !state.introComplete) {
                Intro.complete();
            }
        });
    }

    // ===========================
    // INITIALIZATION
    // ===========================
    function init() {
        initElements();
        Transitions.init();
        initNavigation();
        initAuth();
        initModals();
        initSidebar();
        initKeyboard();
        Intro.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
