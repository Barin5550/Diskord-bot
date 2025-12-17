/**
 * Bot Admin Console - Main Application
 * INTENSE CHAOS INTRO with Matrix Rain, Cracks, Errors
 */

(function () {
    'use strict';

    // ===========================
    // SETTINGS (from localStorage)
    // ===========================
    const SETTINGS_KEY = 'botconsole_settings';
    const defaultSettings = {
        skipIntro: false,
        animations: true,
        sound: false,
        overkill: false, // Extreme animations mode
        theme: 'default' // 'default', 'light', 'cute'
    };

    let settings = { ...defaultSettings };

    function loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (saved) {
                settings = { ...defaultSettings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }

    // ===========================
    // THEME MANAGER
    // ===========================
    const ThemeManager = {
        current: 'default',
        themes: ['default', 'light', 'cute'],

        apply(themeName) {
            if (!this.themes.includes(themeName)) themeName = 'default';

            // Remove all theme classes
            document.body.classList.remove('theme-light', 'theme-cute');

            // Add new theme class (default has no class)
            if (themeName !== 'default') {
                document.body.classList.add(`theme-${themeName}`);
            }

            this.current = themeName;
            settings.theme = themeName;
            saveSettings();

            // Update theme selector UI
            this.updateUI();

            console.log(`Theme applied: ${themeName}`);
        },

        updateUI() {
            const buttons = document.querySelectorAll('.theme-btn');
            buttons.forEach(btn => {
                const theme = btn.dataset.theme;
                btn.classList.toggle('active', theme === this.current);
            });
        },

        init() {
            // Add click listeners to theme buttons
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const theme = btn.dataset.theme;
                    this.apply(theme);
                });
            });
        }
    };

    window.ThemeManager = ThemeManager;

    // ===========================
    // AUTH MODULE
    // ===========================
    const Auth = {
        currentUser: null,
        isAuthenticated: false,

        async checkAuth() {
            try {
                const res = await fetch('/auth/me', { credentials: 'include' });
                const data = await res.json();

                if (data.success && data.authenticated) {
                    this.currentUser = data.user;
                    this.isAuthenticated = true;
                    this.updateUI();
                    return true;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
            }
            this.isAuthenticated = false;
            this.currentUser = null;
            return false;
        },

        login() {
            window.location.href = '/auth/discord';
        },

        async logout() {
            try {
                await fetch('/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Logout failed:', error);
            }
            this.isAuthenticated = false;
            this.currentUser = null;
            window.location.reload();
        },

        updateUI() {
            // Update user menu with real data
            const userAvatar = document.querySelector('.user-avatar');
            const userName = document.querySelector('.user-name');

            if (this.currentUser && userAvatar && userName) {
                userName.textContent = this.currentUser.username;
                userAvatar.textContent = this.currentUser.username.charAt(0).toUpperCase();

                if (this.currentUser.avatar) {
                    userAvatar.style.backgroundImage = `url(https://cdn.discordapp.com/avatars/${this.currentUser.id}/${this.currentUser.avatar}.png)`;
                    userAvatar.style.backgroundSize = 'cover';
                    userAvatar.textContent = '';
                }
            }
        },

        requireAuth(callback) {
            if (this.isAuthenticated) {
                callback();
            } else {
                // Show landing page or redirect to login
                showLoginScreen();
            }
        }
    };

    // Make Auth globally accessible
    window.Auth = Auth;

    function showLoginScreen() {
        // Hide app, show landing
        const landingPage = document.getElementById('landing-page');
        const appScreen = document.getElementById('app-screen');

        if (landingPage) landingPage.classList.remove('hidden');
        if (appScreen) appScreen.classList.add('hidden');
    }

    function showAppScreen() {
        // Hide landing, show app
        const landingPage = document.getElementById('landing-page');
        const appScreen = document.getElementById('app-screen');

        if (landingPage) landingPage.classList.add('hidden');
        if (appScreen) appScreen.classList.remove('hidden');
    }

    function initSettings() {
        loadSettings();

        // Apply settings to UI
        const skipIntroEl = document.getElementById('setting-skip-intro');
        const animationsEl = document.getElementById('setting-animations');
        const soundEl = document.getElementById('setting-sound');
        const clearCacheBtn = document.getElementById('btn-clear-cache');

        if (skipIntroEl) {
            skipIntroEl.checked = settings.skipIntro;
            skipIntroEl.addEventListener('change', () => {
                settings.skipIntro = skipIntroEl.checked;
                saveSettings();
                showToast(settings.skipIntro ? 'Интро отключено' : 'Интро включено', 'info');
            });
        }

        if (animationsEl) {
            animationsEl.checked = settings.animations;
            animationsEl.addEventListener('change', () => {
                settings.animations = animationsEl.checked;
                saveSettings();
                document.body.classList.toggle('no-animations', !settings.animations);
                showToast(settings.animations ? 'Анимации включены' : 'Анимации отключены', 'info');
            });
            // Apply on load
            if (!settings.animations) {
                document.body.classList.add('no-animations');
            }
        }

        if (soundEl) {
            soundEl.checked = settings.sound;
            soundEl.addEventListener('change', () => {
                settings.sound = soundEl.checked;
                saveSettings();
                showToast(settings.sound ? 'Звук включён' : 'Звук отключён', 'info');
            });
        }

        // Overkill mode (extreme animations)
        const overkillEl = document.getElementById('setting-overkill');
        if (overkillEl) {
            overkillEl.checked = settings.overkill;
            overkillEl.addEventListener('change', () => {
                settings.overkill = overkillEl.checked;
                saveSettings();
                document.body.classList.toggle('overkill-mode', settings.overkill);
                showToast(settings.overkill ? '🔥 ПЕРЕБОР АКТИВИРОВАН!' : 'Перебор отключён', settings.overkill ? 'warning' : 'info');
            });
            // Apply on load
            if (settings.overkill) {
                document.body.classList.add('overkill-mode');
            }
        }

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                if (confirm('Очистить все сохранённые данные? Это действие нельзя отменить.')) {
                    localStorage.clear();
                    showToast('Кэш очищен!', 'success');
                    setTimeout(() => location.reload(), 1000);
                }
            });
        }

        // Initialize Theme Manager
        ThemeManager.init();
        // Apply saved theme
        ThemeManager.apply(settings.theme);

        // Initialize i18n (language system)
        if (window.i18n) {
            i18n.init();

            // Add click handlers for language buttons
            document.querySelectorAll('.lang-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const lang = btn.dataset.lang;
                    i18n.setLanguage(lang);
                    showToast(t('toast.langChanged'), 'info');
                });
            });
        }
    }

    // ===========================
    // CONFIG
    // ===========================
    const CONFIG = {
        get SKIP_INTRO() { return settings.skipIntro; },
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

    // Export Intro to window for restart functionality
    window.Intro = Intro;

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
        elements.landingPage = $('#landing-page') || $('#landing-section');
        elements.appLayout = $('#app-layout');
        elements.sidebar = $('#sidebar');
        elements.navItems = $$('.nav-item') || [];
        elements.views = $$('.app-view') || [];
        elements.modals = $$('.modal-overlay') || [];

        console.log('Navigation items found:', elements.navItems.length);
    }

    async function showView(viewName, withTransition = true) {
        // Special case: "start" returns to intro and restarts it
        if (viewName === 'start') {
            const intro = document.getElementById('intro-screen');
            const app = document.getElementById('app-layout');
            const landing = document.getElementById('landing-page');

            // Reset intro screen visibility
            if (intro) {
                intro.style.display = 'flex';
                intro.classList.remove('fade-out', 'hidden');
                // Reset all stages
                const hackingStage = document.getElementById('intro-hacking');
                const eyesStage = document.getElementById('intro-eyes');
                const helloStage = document.getElementById('intro-hello');
                if (hackingStage) hackingStage.classList.remove('hidden');
                if (eyesStage) eyesStage.classList.add('hidden');
                if (helloStage) helloStage.classList.add('hidden');
            }
            if (app) app.classList.add('hidden');
            if (landing) landing.classList.add('hidden');

            // Run the intro sequence
            if (window.Intro) {
                window.Intro.screen = document.getElementById('intro-screen');
                window.Intro.runSequence();
            }
            return;
        }

        state.currentView = viewName;
        if (withTransition) await Transitions.play();

        // Cleanup 3D Gallery when leaving it
        if (window.Gallery3D && typeof window.Gallery3D.cleanup === 'function') {
            window.Gallery3D.cleanup();
        }

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

        // Apply typing glitch effect to view title
        const targetView = $(`#view-${viewName}`);
        if (targetView) {
            const title = targetView.querySelector('.view-title');
            if (title) {
                typeGlitchEffect(title);
            }
        }

        // Initialize 3D Constructor when switching to it
        if (viewName === 'constructor' && window.Constructor3D) {
            setTimeout(() => {
                window.Constructor3D.init();
            }, 100);
        }

        // Initialize Analytics when switching to it
        if (viewName === 'analytics' && window.Analytics) {
            setTimeout(() => {
                window.Analytics.init();
            }, 100);
        }

        // Initialize 3D Gallery when switching to it
        if (viewName === 'gallery3d' && window.Gallery3D) {
            setTimeout(() => {
                window.Gallery3D.init();
            }, 100);
        }

        // Load Meme of Day when switching to it
        if (viewName === 'meme-of-day') {
            setTimeout(() => {
                MemeOfDay.load();
            }, 100);
        }

        // Load Memes when switching to memes view
        if (viewName === 'memes') {
            setTimeout(() => {
                MemeFeed.loadMemes();
            }, 100);
        }

        // Load Dashboard stats when switching to dashboard
        if (viewName === 'dashboard') {
            setTimeout(() => {
                Dashboard.load();
            }, 100);
        }
    }

    // ===========================
    // TYPING GLITCH EFFECT
    // ===========================
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя0123456789';

    function typeGlitchEffect(element) {
        if (!element || element.dataset.typing === 'true') return;

        const originalText = element.dataset.originalText || element.textContent;
        element.dataset.originalText = originalText;
        element.dataset.typing = 'true';

        let currentIndex = 0;
        const chars = originalText.split('');
        element.textContent = '';
        element.classList.add('typing-active');

        const typeInterval = setInterval(() => {
            if (currentIndex >= chars.length) {
                clearInterval(typeInterval);
                element.textContent = originalText;
                element.dataset.typing = 'false';
                element.classList.remove('typing-active');

                // Add final glitch flash
                element.classList.add('glitch-flash-once');
                setTimeout(() => element.classList.remove('glitch-flash-once'), 200);
                return;
            }

            // Show glitch characters before revealing the real one
            const glitchCount = 3;
            let glitchStep = 0;

            const glitchInterval = setInterval(() => {
                if (glitchStep >= glitchCount) {
                    clearInterval(glitchInterval);
                    element.textContent = originalText.substring(0, currentIndex + 1);
                    currentIndex++;
                    return;
                }

                const randomChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
                element.textContent = originalText.substring(0, currentIndex) + randomChar;
                glitchStep++;
            }, 30);

        }, 80);
    }

    window.typeGlitchEffect = typeGlitchEffect;

    function initNavigation() {
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view && view !== state.currentView) showView(view);
            });
        });
    }

    // Export showView to global scope for other modules
    window.showView = showView;

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

    // Make showToast globally available
    window.showToast = showToast;

    // Handle "Coming Soon" placeholder buttons
    function initComingSoonButtons() {
        $$('.coming-soon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showToast('🚧 Coming soon!', 'warning');
            });
        });
    }

    // ===========================
    // MEME MODAL
    // ===========================
    let currentModalMeme = null;

    function openMemeModal(meme) {
        currentModalMeme = meme;
        const modal = $('#modal-meme-view');
        const image = $('#meme-modal-image');
        const caption = $('#meme-modal-caption');
        const likeBtn = $('#meme-modal-like');
        const dislikeBtn = $('#meme-modal-dislike');

        if (!modal || !image) return;

        image.src = meme.image_path;
        if (caption) caption.textContent = meme.caption || '';
        if (likeBtn) likeBtn.querySelector('.vote-count').textContent = meme.like_count || 0;
        if (dislikeBtn) dislikeBtn.querySelector('.vote-count').textContent = meme.dislike_count || 0;

        modal.classList.remove('hidden');

        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) closeMemeModal();
        };
    }

    function closeMemeModal() {
        const modal = $('#modal-meme-view');
        if (modal) modal.classList.add('hidden');
        currentModalMeme = null;
    }

    // Make functions globally available
    window.openMemeModal = openMemeModal;
    window.closeMemeModal = closeMemeModal;

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
    // BOT SETTINGS UI MODULE
    // ===========================
    const BotSettingsUI = {
        botId: 1,
        debounceTimer: null,
        statusEl: null,

        async init() {
            this.statusEl = $('#bot-save-status');
            await this.load();
            this.bindEvents();
        },

        async load() {
            try {
                const res = await fetch(`${API_BASE}/api/bots/${this.botId}`);
                const data = await res.json();

                if (data.success && data.bot) {
                    const bot = data.bot;
                    const nameEl = $('#bot-name');
                    const prefixEl = $('#bot-command-prefix');

                    if (nameEl) nameEl.value = bot.name || '';
                    if (prefixEl) prefixEl.value = bot.commandPrefix || '!';

                    this.setCheckbox('bot-server-logs', bot.serverLogs);
                    this.setCheckbox('bot-big-actions', bot.bigActions);
                    this.setCheckbox('bot-auto-moderation', bot.autoModeration);
                    this.setCheckbox('bot-activity-logging', bot.activityLogging);
                    this.setCheckbox('bot-welcome-messages', bot.welcomeMessages);
                }
            } catch (error) {
                console.error('Failed to load bot settings:', error);
            }
        },

        setCheckbox(id, value) {
            const el = $(`#${id}`);
            if (el) el.checked = !!value;
        },

        bindEvents() {
            // Text inputs with debounce
            $('#bot-name')?.addEventListener('input', () => this.scheduleUpdate('name', $('#bot-name').value));
            $('#bot-command-prefix')?.addEventListener('input', () => this.scheduleUpdate('commandPrefix', $('#bot-command-prefix').value));

            // Checkboxes - immediate save
            $('#bot-server-logs')?.addEventListener('change', (e) => this.updateField('serverLogs', e.target.checked));
            $('#bot-big-actions')?.addEventListener('change', (e) => this.updateField('bigActions', e.target.checked));
            $('#bot-auto-moderation')?.addEventListener('change', (e) => this.updateField('autoModeration', e.target.checked));
            $('#bot-activity-logging')?.addEventListener('change', (e) => this.updateField('activityLogging', e.target.checked));
            $('#bot-welcome-messages')?.addEventListener('change', (e) => this.updateField('welcomeMessages', e.target.checked));
        },

        scheduleUpdate(field, value) {
            this.setStatus('saving', '💾 Saving...');
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.updateField(field, value);
            }, 1000);
        },

        async updateField(field, value) {
            this.setStatus('saving', '💾 Saving...');

            try {
                const res = await fetch(`${API_BASE}/api/bots/${this.botId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [field]: value, actorName: 'Operator' })
                });

                const data = await res.json();

                if (data.success) {
                    this.setStatus('saved', '✓ Saved');
                    setTimeout(() => this.setStatus('', ''), 2000);
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                console.error('Failed to update bot setting:', error);
                this.setStatus('failed', '✗ Failed');
                showToast('Ошибка сохранения', 'error');
            }
        },

        setStatus(cls, text) {
            if (this.statusEl) {
                this.statusEl.className = 'save-status ' + cls;
                this.statusEl.textContent = text;
            }
        }
    };

    // ===========================
    // ADMINS UI MODULE
    // ===========================
    const AdminsUI = {
        tbody: null,
        countEl: null,

        init() {
            this.tbody = $('#admins-tbody');
            this.countEl = $('#admins-count');

            // Add admin button
            $('#btn-add-admin')?.addEventListener('click', () => this.addAdmin());

            // Enter key in inputs
            ['admin-user-id', 'admin-username'].forEach(id => {
                $(`#${id}`)?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.addAdmin();
                });
            });
        },

        async load() {
            if (!this.tbody) return;
            this.tbody.innerHTML = '<tr><td colspan="5" class="no-data">Загрузка...</td></tr>';

            try {
                const res = await fetch(`${API_BASE}/api/admins`);
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                this.render(data.admins);
            } catch (error) {
                console.error('Failed to load admins:', error);
                this.tbody.innerHTML = '<tr><td colspan="5" class="no-data">Ошибка загрузки</td></tr>';
            }
        },

        render(admins) {
            if (!this.tbody) return;

            if (this.countEl) {
                this.countEl.textContent = admins.length;
            }

            if (admins.length === 0) {
                this.tbody.innerHTML = '<tr><td colspan="5" class="no-data">Нет администраторов</td></tr>';
                return;
            }

            this.tbody.innerHTML = admins.map(admin => `
                <tr data-id="${admin.id}">
                    <td><code>${this.escape(admin.user_id)}</code></td>
                    <td>${this.escape(admin.username)}</td>
                    <td><span class="role-badge ${admin.role}">${admin.role}</span></td>
                    <td>${this.formatDate(admin.created_at)}</td>
                    <td><button class="btn-remove" onclick="AdminsUI.remove(${admin.id})">Удалить</button></td>
                </tr>
            `).join('');
        },

        async addAdmin() {
            const userIdEl = $('#admin-user-id');
            const usernameEl = $('#admin-username');
            const roleEl = $('#admin-role');

            const userId = userIdEl?.value.trim();
            const username = usernameEl?.value.trim();
            const role = roleEl?.value || 'admin';

            if (!userId || !username) {
                showToast('Заполните User ID и Username', 'warning');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/admins`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, username, role, actorName: 'Operator' })
                });

                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                showToast(`Админ ${username} добавлен`, 'success');
                userIdEl.value = '';
                usernameEl.value = '';
                this.load();
            } catch (error) {
                console.error('Failed to add admin:', error);
                showToast(error.message || 'Ошибка добавления', 'error');
            }
        },

        async remove(adminId) {
            if (!confirm('Удалить этого администратора?')) return;

            try {
                const res = await fetch(`${API_BASE}/api/admins/${adminId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ actorName: 'Operator' })
                });

                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                showToast('Админ удалён', 'success');
                this.load();
            } catch (error) {
                console.error('Failed to remove admin:', error);
                showToast('Ошибка удаления', 'error');
            }
        },

        formatDate(dateStr) {
            if (!dateStr) return '—';
            return new Date(dateStr).toLocaleDateString('ru-RU');
        },

        escape(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    // Make AdminsUI globally accessible for onclick handlers
    window.AdminsUI = AdminsUI;

    // ===========================
    // SERVER FOLDERS UI MODULE
    // ===========================
    const ServerFoldersUI = {
        container: null,
        folders: [],

        init() {
            this.container = $('#folders-container');

            // Create folder button
            $('#btn-create-folder')?.addEventListener('click', () => this.createFolder());
            $('#folder-name')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.createFolder();
            });

            // Add server button
            $('#btn-add-server')?.addEventListener('click', () => this.addServer());
        },

        async load() {
            if (!this.container) return;
            this.container.innerHTML = '<div class="no-data">Загрузка папок...</div>';

            try {
                const res = await fetch(`${API_BASE}/api/server-folders`, { credentials: 'include' });
                const data = await res.json();

                if (!data.success) throw new Error(data.error);

                this.folders = data.folders;
                this.renderFolders();
                this.updateFolderSelect();
            } catch (error) {
                console.error('Failed to load folders:', error);
                this.container.innerHTML = '<div class="no-data">Ошибка загрузки папок</div>';
            }
        },

        updateFolderSelect() {
            const select = $('#target-folder');
            if (!select) return;

            select.innerHTML = '<option value="">Выберите папку</option>' +
                this.folders.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
        },

        renderFolders() {
            if (!this.container) return;

            if (this.folders.length === 0) {
                this.container.innerHTML = '<div class="no-data">Нет папок. Создайте первую!</div>';
                return;
            }

            this.container.innerHTML = this.folders.map(folder => `
                <div class="folder-card" style="border-left-color: ${folder.color}">
                    <div class="folder-header">
                        <div class="folder-title">
                            <span class="folder-icon">📁</span>
                            <span>${this.escape(folder.name)}</span>
                            <span class="badge badge-neutral">${folder.servers?.length || 0}</span>
                        </div>
                        <div class="folder-actions">
                            <button class="btn-remove" onclick="ServerFoldersUI.deleteFolder(${folder.id})">Удалить</button>
                        </div>
                    </div>
                    <div class="server-list">
                        ${folder.servers && folder.servers.length > 0
                    ? folder.servers.map(s => `
                                <div class="server-item">
                                    <div class="server-info">
                                        <div class="server-icon">${s.server_name?.charAt(0) || 'S'}</div>
                                        <div>
                                            <div class="server-name">${this.escape(s.server_name)}</div>
                                            <div class="server-id">${s.server_id}</div>
                                        </div>
                                    </div>
                                    <button class="btn-remove" onclick="ServerFoldersUI.removeServer(${folder.id}, '${s.server_id}')">✕</button>
                                </div>
                            `).join('')
                    : '<div class="empty-folder">Папка пуста</div>'
                }
                    </div>
                </div>
            `).join('');
        },

        async createFolder() {
            const nameEl = $('#folder-name');
            const colorEl = $('#folder-color');
            const name = nameEl?.value.trim();
            const color = colorEl?.value || '#00d9ff';

            if (!name) {
                showToast('Введите название папки', 'warning');
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/server-folders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, color })
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                showToast(`Папка "${name}" создана`, 'success');
                nameEl.value = '';
                this.load();
            } catch (error) {
                console.error('Failed to create folder:', error);
                showToast('Ошибка создания папки', 'error');
            }
        },

        async addServer() {
            const folderId = $('#target-folder')?.value;
            const serverId = $('#server-id')?.value.trim();
            const serverName = $('#server-name')?.value.trim();

            if (!folderId) { showToast('Выберите папку', 'warning'); return; }
            if (!serverId) { showToast('Введите Server ID', 'warning'); return; }
            if (!serverName) { showToast('Введите название сервера', 'warning'); return; }

            try {
                const res = await fetch(`${API_BASE}/api/server-folders/${folderId}/servers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ serverId, serverName })
                });

                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                showToast(`Сервер добавлен`, 'success');
                $('#server-id').value = '';
                $('#server-name').value = '';
                this.load();
            } catch (error) {
                console.error('Failed to add server:', error);
                showToast(error.message || 'Ошибка добавления', 'error');
            }
        },

        async removeServer(folderId, serverId) {
            try {
                await fetch(`${API_BASE}/api/server-folders/${folderId}/servers/${serverId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                showToast('Сервер удалён из папки', 'success');
                this.load();
            } catch (error) {
                console.error('Failed to remove server:', error);
                showToast('Ошибка удаления', 'error');
            }
        },

        async deleteFolder(folderId) {
            if (!confirm('Удалить эту папку и все серверы в ней?')) return;

            try {
                await fetch(`${API_BASE}/api/server-folders/${folderId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                showToast('Папка удалена', 'success');
                this.load();
            } catch (error) {
                console.error('Failed to delete folder:', error);
                showToast('Ошибка удаления', 'error');
            }
        },

        escape(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    window.ServerFoldersUI = ServerFoldersUI;

    // ===========================
    // PROFILE UI MODULE
    // ===========================
    const ProfileUI = {
        profile: null,

        init() {
            $('#btn-save-profile')?.addEventListener('click', () => this.save());
            $('#btn-connect-discord')?.addEventListener('click', () => this.connectDiscord());
        },

        async load() {
            try {
                const res = await fetch(`${API_BASE}/api/profile`, { credentials: 'include' });
                const data = await res.json();

                if (data.success) {
                    this.profile = data.profile;
                    this.render();
                }
            } catch (error) {
                console.error('Failed to load profile:', error);
            }
        },

        render() {
            if (!this.profile) return;

            const nameEl = $('#profile-name');
            const bioEl = $('#profile-bio');
            const avatarEl = $('#profile-avatar');

            if (nameEl) nameEl.value = this.profile.name || '';
            if (bioEl) bioEl.value = this.profile.bio || '';
            if (avatarEl) {
                avatarEl.textContent = (this.profile.name || 'U').charAt(0).toUpperCase();
                if (this.profile.avatar) {
                    avatarEl.style.backgroundImage = `url(${this.profile.avatar})`;
                    avatarEl.textContent = '';
                }
            }

            this.renderDiscordStatus();
        },

        renderDiscordStatus() {
            const container = $('#discord-status');
            if (!container) return;

            if (this.profile.discord_id) {
                container.innerHTML = `
                    <div class="discord-connected">
                        <div class="discord-avatar" style="${this.profile.discord_avatar ? `background-image:url(${this.profile.discord_avatar})` : ''}">
                            ${this.profile.discord_avatar ? '' : '🎮'}
                        </div>
                        <div class="discord-info">
                            <h4>${this.profile.discord_name || 'Discord User'}</h4>
                            <p>ID: ${this.profile.discord_id}</p>
                        </div>
                        <button class="btn btn-ghost btn-disconnect" onclick="ProfileUI.disconnectDiscord()">Отключить</button>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="discord-not-connected">
                        <p>Discord не подключён</p>
                        <button id="btn-connect-discord" class="btn btn-primary" onclick="ProfileUI.connectDiscord()">🎮 Подключить Discord</button>
                    </div>
                `;
            }
        },

        async save() {
            const name = $('#profile-name')?.value.trim();
            const bio = $('#profile-bio')?.value.trim();
            const statusEl = $('#profile-save-status');

            if (statusEl) {
                statusEl.textContent = 'Сохранение...';
                statusEl.className = 'save-status saving';
            }

            try {
                const res = await fetch(`${API_BASE}/api/profile`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name, bio })
                });

                const data = await res.json();

                if (data.success) {
                    this.profile = data.profile;
                    if (statusEl) {
                        statusEl.textContent = 'Сохранено!';
                        statusEl.className = 'save-status saved';
                    }
                    showToast('Профиль сохранён', 'success');
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                console.error('Failed to save profile:', error);
                if (statusEl) {
                    statusEl.textContent = 'Ошибка';
                    statusEl.className = 'save-status failed';
                }
                showToast('Ошибка сохранения', 'error');
            }
        },

        connectDiscord() {
            // Redirect to Discord OAuth
            window.location.href = '/auth/discord';
        },

        async disconnectDiscord() {
            if (!confirm('Отключить Discord?')) return;

            try {
                const res = await fetch(`${API_BASE}/api/profile/discord`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                const data = await res.json();
                if (data.success) {
                    this.profile = data.profile;
                    this.renderDiscordStatus();
                    showToast('Discord отключён', 'success');
                }
            } catch (error) {
                console.error('Failed to disconnect Discord:', error);
                showToast('Ошибка отключения', 'error');
            }
        }
    };

    window.ProfileUI = ProfileUI;

    // ===========================
    // CHAT ROOMS UI MODULE
    // ===========================
    const ChatRoomsUI = {
        rooms: [],
        currentRoomId: null,
        currentUserId: null,

        init() {
            $('#btn-send-message')?.addEventListener('click', () => this.sendMessage());
            $('#chat-message-input')?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        },

        async loadRooms() {
            try {
                const res = await fetch(`${API_BASE}/api/chat-rooms`, { credentials: 'include' });
                const data = await res.json();

                if (data.success) {
                    this.rooms = data.rooms;
                    this.renderRooms();
                }
            } catch (error) {
                console.error('Failed to load rooms:', error);
            }
        },

        renderRooms() {
            const container = $('#rooms-container');
            if (!container) return;

            container.innerHTML = this.rooms.map(room => `
                <div class="room-item ${room.id === this.currentRoomId ? 'active' : ''}" 
                     onclick="ChatRoomsUI.selectRoom(${room.id})">
                    <div class="room-color" style="background:${room.color}"></div>
                    <span class="room-name">${room.name}</span>
                </div>
            `).join('');
        },

        async selectRoom(roomId) {
            this.currentRoomId = roomId;
            const room = this.rooms.find(r => r.id === roomId);

            // Update header
            const nameEl = $('#current-room-name');
            if (nameEl) nameEl.textContent = room ? room.name : 'Комната';

            // Enable input
            const input = $('#chat-message-input');
            const btn = $('#btn-send-message');
            if (input) input.disabled = false;
            if (btn) btn.disabled = false;

            // Update active state
            this.renderRooms();

            // Load messages
            await this.loadMessages();
        },

        async loadMessages() {
            if (!this.currentRoomId) return;

            try {
                const res = await fetch(`${API_BASE}/api/chat-rooms/${this.currentRoomId}/messages`, { credentials: 'include' });
                const data = await res.json();

                const container = $('#messages-container');
                if (!container) return;

                if (data.success && data.messages.length > 0) {
                    container.innerHTML = data.messages.map(msg => this.renderMessage(msg)).join('');
                    container.scrollTop = container.scrollHeight;
                } else {
                    container.innerHTML = '<div class="no-messages">Нет сообщений. Напишите первым!</div>';
                }
            } catch (error) {
                console.error('Failed to load messages:', error);
            }
        },

        renderMessage(msg) {
            const isOwn = msg.user_id === this.currentUserId || msg.user_id === 'anonymous';
            const time = new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="message-bubble ${isOwn ? 'own' : ''}">
                    <div class="message-header">
                        <span class="message-username">${this.escapeHtml(msg.username)}</span>
                        <span class="message-time">${time}</span>
                    </div>
                    <div class="message-content">${this.escapeHtml(msg.content)}</div>
                </div>
            `;
        },

        async sendMessage() {
            const input = $('#chat-message-input');
            if (!input || !this.currentRoomId) return;

            const content = input.value.trim();
            if (!content) return;

            try {
                const res = await fetch(`${API_BASE}/api/chat-rooms/${this.currentRoomId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ content })
                });

                const data = await res.json();
                if (data.success) {
                    input.value = '';
                    // Add message to container
                    const container = $('#messages-container');
                    if (container) {
                        const noMessages = container.querySelector('.no-messages');
                        if (noMessages) noMessages.remove();
                        container.insertAdjacentHTML('beforeend', this.renderMessage(data.message));
                        container.scrollTop = container.scrollHeight;
                    }
                }
            } catch (error) {
                console.error('Failed to send message:', error);
                showToast('Ошибка отправки', 'error');
            }
        },

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    window.ChatRoomsUI = ChatRoomsUI;

    // ===========================
    // LOGS UI MODULE
    // ===========================
    const LogsUI = {
        messagesBody: null,
        actionsBody: null,
        messagesCursor: null,
        actionsCursor: null,
        messagesHasMore: false,
        actionsHasMore: false,

        init() {
            this.messagesBody = $('#messages-logs-body');
            this.actionsBody = $('#actions-logs-body');

            // Refresh buttons
            $('#logs-messages-refresh')?.addEventListener('click', () => this.loadMessages(true));
            $('#logs-actions-refresh')?.addEventListener('click', () => this.loadActions(true));

            // Load more buttons
            $('#logs-messages-more')?.addEventListener('click', () => this.loadMessages(false));
            $('#logs-actions-more')?.addEventListener('click', () => this.loadActions(false));
        },

        async loadMessages(reset = false) {
            if (reset) {
                this.messagesCursor = null;
                if (this.messagesBody) {
                    this.messagesBody.innerHTML = '<tr><td colspan="5" class="no-data">Загрузка...</td></tr>';
                }
            }

            try {
                let url = `${API_BASE}/api/logs/messages?limit=30`;
                if (this.messagesCursor) {
                    url += `&cursor=${this.messagesCursor}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                this.messagesCursor = data.nextCursor;
                this.messagesHasMore = data.hasMore;

                if (reset && this.messagesBody) {
                    this.messagesBody.innerHTML = '';
                }

                if (data.logs.length === 0 && reset) {
                    this.messagesBody.innerHTML = '<tr><td colspan="5" class="no-data">Нет сообщений</td></tr>';
                } else {
                    data.logs.forEach(log => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>${this.formatDate(log.created_at)}</td>
                            <td>${this.escape(log.server_name || '—')}</td>
                            <td>${this.escape(log.channel_name || '—')}</td>
                            <td>${this.escape(log.username)}</td>
                            <td>${this.escape(log.content)}</td>
                        `;
                        this.messagesBody.appendChild(tr);
                    });
                }

                // Update count
                const countEl = $('#logs-messages-count');
                if (countEl) {
                    countEl.textContent = `Всего: ${data.total}`;
                }

                // Show/hide load more
                const moreBtn = $('#logs-messages-more');
                if (moreBtn) {
                    moreBtn.style.display = this.messagesHasMore ? 'inline-block' : 'none';
                }
            } catch (error) {
                console.error('Failed to load message logs:', error);
                if (this.messagesBody) {
                    this.messagesBody.innerHTML = '<tr><td colspan="5" class="no-data">Ошибка загрузки</td></tr>';
                }
            }
        },

        async loadActions(reset = false) {
            if (reset) {
                this.actionsCursor = null;
                if (this.actionsBody) {
                    this.actionsBody.innerHTML = '<tr><td colspan="5" class="no-data">Загрузка...</td></tr>';
                }
            }

            try {
                let url = `${API_BASE}/api/logs/actions?limit=30`;
                if (this.actionsCursor) {
                    url += `&cursor=${this.actionsCursor}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (!data.success) {
                    throw new Error(data.error);
                }

                this.actionsCursor = data.nextCursor;
                this.actionsHasMore = data.hasMore;

                if (reset && this.actionsBody) {
                    this.actionsBody.innerHTML = '';
                }

                if (data.logs.length === 0 && reset) {
                    this.actionsBody.innerHTML = '<tr><td colspan="5" class="no-data">Нет действий</td></tr>';
                } else {
                    data.logs.forEach(log => {
                        const tr = document.createElement('tr');
                        const badgeClass = this.getActionBadgeClass(log.action_type);
                        tr.innerHTML = `
                            <td>${this.formatDate(log.created_at)}</td>
                            <td><span class="action-badge ${badgeClass}">${this.escape(log.action_type)}</span></td>
                            <td>${this.escape(log.actor_name)}</td>
                            <td>${log.target_name ? this.escape(log.target_name) : '—'}</td>
                            <td>${log.details ? this.escape(log.details) : '—'}</td>
                        `;
                        this.actionsBody.appendChild(tr);
                    });
                }

                // Update count
                const countEl = $('#logs-actions-count');
                if (countEl) {
                    countEl.textContent = `Всего: ${data.total}`;
                }

                // Show/hide load more
                const moreBtn = $('#logs-actions-more');
                if (moreBtn) {
                    moreBtn.style.display = this.actionsHasMore ? 'inline-block' : 'none';
                }
            } catch (error) {
                console.error('Failed to load action logs:', error);
                if (this.actionsBody) {
                    this.actionsBody.innerHTML = '<tr><td colspan="5" class="no-data">Ошибка загрузки</td></tr>';
                }
            }
        },

        getActionBadgeClass(actionType) {
            const type = (actionType || '').toLowerCase();
            if (type.includes('create') || type.includes('add')) return 'create';
            if (type.includes('update') || type.includes('edit')) return 'update';
            if (type.includes('delete') || type.includes('remove')) return 'delete';
            if (type.includes('login') || type.includes('auth')) return 'login';
            return 'default';
        },

        formatDate(dateStr) {
            if (!dateStr) return '—';
            const date = new Date(dateStr);
            return date.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        },

        escape(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    };

    // ===========================
    // DASHBOARD API
    // ===========================
    const Dashboard = {
        loaded: false,

        async load() {
            try {
                // Load stats and status in parallel
                const [statsRes, statusRes] = await Promise.all([
                    fetch(`${window.location.origin}/api/stats`),
                    fetch(`${window.location.origin}/api/status`)
                ]);

                const stats = await statsRes.json();
                const status = await statusRes.json();

                // Update UI elements
                const usersEl = $('#dash-total-users');
                const serversEl = $('#dash-active-servers');
                const commandsEl = $('#dash-commands-today');
                const statusEl = $('#dash-status');
                const uptimeEl = $('#dash-uptime');
                const statusIconEl = $('#dash-status-icon');

                if (usersEl) usersEl.textContent = this.formatNumber(stats.totalMembers || 0);
                if (serversEl) serversEl.textContent = stats.activeServers || 0;
                if (commandsEl) commandsEl.textContent = stats.commandsToday || 0;

                if (statusEl) {
                    const isOnline = status.status === 'online';
                    statusEl.textContent = isOnline ? 'Online' : 'Connecting...';
                }

                if (uptimeEl) {
                    uptimeEl.textContent = `${status.uptime || '99.9%'} uptime`;
                }

                if (statusIconEl) {
                    statusIconEl.className = status.status === 'online'
                        ? 'dash-stat-icon pulse-green'
                        : 'dash-stat-icon';
                }

                this.loaded = true;
                console.log('[Dashboard] Stats loaded:', stats, status);
            } catch (error) {
                console.error('[Dashboard] Failed to load stats:', error);
                // Show error state
                const statusEl = $('#dash-status');
                if (statusEl) statusEl.textContent = 'Offline';
            }
        },

        formatNumber(num) {
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
            return num.toString();
        }
    };

    // ===========================
    // MEME API
    // ===========================
    const API_BASE = window.location.origin;

    const MemeAPI = {
        userId: null,

        init() {
            // Get or create anonymous user ID
            this.userId = localStorage.getItem('meme_user_id');
            if (!this.userId) {
                this.userId = 'user_' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('meme_user_id', this.userId);
            }
        },

        async getMemes(sortBy = 'new') {
            try {
                const res = await fetch(`${API_BASE}/api/memes?userId=${this.userId}&sort=${sortBy}`);
                const data = await res.json();
                return data.success ? data.memes : [];
            } catch (error) {
                console.error('Failed to fetch memes:', error);
                return [];
            }
        },

        async uploadMeme(file, caption) {
            try {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('caption', caption);
                formData.append('userId', this.userId);

                const res = await fetch(`${API_BASE}/api/memes`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                return data;
            } catch (error) {
                console.error('Failed to upload meme:', error);
                return { success: false, error: error.message };
            }
        },

        async vote(memeId, voteType) {
            try {
                const res = await fetch(`${API_BASE}/api/memes/${memeId}/vote`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: this.userId, voteType })
                });
                const data = await res.json();
                return data;
            } catch (error) {
                console.error('Failed to vote:', error);
                return { success: false, error: error.message };
            }
        },

        async getMemeOfDay() {
            try {
                const res = await fetch(`${API_BASE}/api/meme-of-day?userId=${this.userId}`);
                const data = await res.json();
                return data.success ? data : { memeOfDay: null, topMemes: [] };
            } catch (error) {
                console.error('Failed to fetch meme of day:', error);
                return { memeOfDay: null, topMemes: [] };
            }
        },

        async deleteMeme(memeId) {
            try {
                const res = await fetch(`${API_BASE}/api/memes/${memeId}?userId=${this.userId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();
                return data;
            } catch (error) {
                console.error('Failed to delete meme:', error);
                return { success: false, error: error.message };
            }
        }
    };

    // ===========================
    // MEME WEBSOCKET
    // ===========================
    const MemeSocket = {
        ws: null,
        reconnectAttempts: 0,
        maxReconnectAttempts: 5,

        init() {
            this.connect();
        },

        connect() {
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

            try {
                this.ws = new WebSocket(wsUrl);

                this.ws.onopen = () => {
                    console.log('WebSocket connected');
                    this.reconnectAttempts = 0;
                };

                this.ws.onmessage = (event) => {
                    try {
                        const { event: eventType, data } = JSON.parse(event.data);
                        this.handleEvent(eventType, data);
                    } catch (e) {
                        console.error('Failed to parse WebSocket message:', e);
                    }
                };

                this.ws.onclose = () => {
                    console.log('WebSocket disconnected');
                    this.scheduleReconnect();
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                this.scheduleReconnect();
            }
        },

        scheduleReconnect() {
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                console.log(`Reconnecting in ${delay}ms...`);
                setTimeout(() => this.connect(), delay);
            }
        },

        handleEvent(eventType, data) {
            switch (eventType) {
                case 'new_meme':
                    MemeFeed.addMeme(data.meme, true);
                    break;
                case 'vote_update':
                    MemeFeed.updateVotes(data.memeId, data.likeCount, data.dislikeCount);
                    MemeOfDay.updateVotes(data.memeId, data.likeCount, data.dislikeCount);
                    break;
                case 'leader_change':
                    MemeOfDay.setMemeOfDay(data.memeOfDay);
                    showToast('🏆 Новый мем дня!', 'success');
                    break;
                case 'meme_deleted':
                    MemeFeed.removeMeme(data.memeId);
                    break;
            }
        }
    };

    // ===========================
    // MEME FEED
    // ===========================
    const MemeFeed = {
        container: null,
        uploadForm: null,
        fileInput: null,
        preview: null,
        captionInput: null,
        submitBtn: null,
        sortBtns: null,
        currentSort: 'new',
        selectedFile: null,
        memes: [],

        init() {
            this.container = $('#meme-feed');
            this.uploadForm = $('#meme-upload-form');
            this.fileInput = $('#meme-file-input');
            this.preview = $('#upload-preview');
            this.captionInput = $('#meme-caption');
            this.submitBtn = $('#meme-submit-btn');
            this.sortBtns = $$('.sort-btn');
            this.searchInput = $('#meme-search-input');
            this.searchTerm = '';

            if (!this.container) return;

            // File input handling
            this.preview?.addEventListener('click', () => this.fileInput?.click());
            this.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));

            // Form submit
            this.uploadForm?.addEventListener('submit', (e) => this.handleUpload(e));

            // Sort buttons
            this.sortBtns.forEach(btn => {
                btn.addEventListener('click', () => this.handleSort(btn));
            });

            // Search input
            let searchDebounce = null;
            this.searchInput?.addEventListener('input', (e) => {
                clearTimeout(searchDebounce);
                searchDebounce = setTimeout(() => {
                    this.searchTerm = e.target.value.toLowerCase().trim();
                    this.render();
                }, 300);
            });

            // Load initial memes
            this.loadMemes();
        },

        handleFileSelect(e) {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast('Неверный формат файла. Допустимы: JPG, PNG, GIF, WebP', 'error');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showToast('Файл слишком большой. Максимум 10 МБ', 'error');
                return;
            }

            this.selectedFile = file;

            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                this.preview.classList.add('has-image');
            };
            reader.readAsDataURL(file);

            // Enable submit
            this.submitBtn.disabled = false;
        },

        async handleUpload(e) {
            e.preventDefault();

            if (!this.selectedFile) return;

            // Show loading
            this.submitBtn.disabled = true;
            this.submitBtn.querySelector('.btn-text').classList.add('hidden');
            this.submitBtn.querySelector('.btn-loader').classList.remove('hidden');

            const caption = this.captionInput.value.trim();
            const result = await MemeAPI.uploadMeme(this.selectedFile, caption);

            // Reset loading
            this.submitBtn.querySelector('.btn-text').classList.remove('hidden');
            this.submitBtn.querySelector('.btn-loader').classList.add('hidden');

            if (result.success) {
                showToast('Мем опубликован! 🎉', 'success');
                this.resetForm();
            } else {
                showToast(result.error || 'Ошибка загрузки', 'error');
                this.submitBtn.disabled = false;
            }
        },

        resetForm() {
            this.selectedFile = null;
            this.fileInput.value = '';
            this.captionInput.value = '';
            this.preview.innerHTML = '<span class="upload-placeholder">📷 Нажми для выбора картинки</span>';
            this.preview.classList.remove('has-image');
            this.submitBtn.disabled = true;
        },

        async handleSort(btn) {
            const sortBy = btn.dataset.sort;
            if (sortBy === this.currentSort) return;

            this.currentSort = sortBy;
            this.sortBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            await this.loadMemes();
        },

        async loadMemes() {
            this.memes = await MemeAPI.getMemes(this.currentSort);
            this.render();
        },

        addMeme(meme, prepend = false) {
            // Add to array
            if (prepend) {
                this.memes.unshift(meme);
            } else {
                this.memes.push(meme);
            }
            this.render();
        },

        removeMeme(memeId) {
            this.memes = this.memes.filter(m => m.id !== memeId);
            // Remove from DOM with animation
            const item = this.container?.querySelector(`[data-meme-id="${memeId}"]`);
            if (item) {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    item.remove();
                    if (this.memes.length === 0) this.render();
                }, 300);
            }
        },

        updateVotes(memeId, likeCount, dislikeCount) {
            const meme = this.memes.find(m => m.id === memeId);
            if (meme) {
                meme.like_count = likeCount;
                meme.dislike_count = dislikeCount;

                // Update DOM directly for better performance
                const item = this.container.querySelector(`[data-meme-id="${memeId}"]`);
                if (item) {
                    const likeCountEl = item.querySelector('.like-count');
                    const dislikeCountEl = item.querySelector('.dislike-count');
                    if (likeCountEl) likeCountEl.textContent = likeCount;
                    if (dislikeCountEl) dislikeCountEl.textContent = dislikeCount;
                }
            }
        },

        render() {
            if (!this.container) return;

            const filtered = this.getFilteredMemes ? this.getFilteredMemes() : this.memes;

            if (this.memes.length === 0) {
                this.container.innerHTML = `
                    <div class="meme-feed-empty">
                        <div class="empty-icon">🎭</div>
                        <p>Пока нет мемов. Будь первым!</p>
                    </div>
                `;
                return;
            }

            if (filtered.length === 0) {
                this.container.innerHTML = `
                    <div class="meme-feed-empty">
                        <div class="empty-icon">🔍</div>
                        <p>Ничего не найдено по запросу "${this.searchTerm}"</p>
                    </div>
                `;
                return;
            }

            this.container.innerHTML = filtered.map(meme => this.renderMemeItem(meme)).join('');

            // Add vote listeners
            this.container.querySelectorAll('.vote-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleVote(e, btn));
            });

            // Add delete listeners
            this.container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleDelete(e, btn));
            });
        },

        renderMemeItem(meme) {
            const timeAgo = this.formatTimeAgo(meme.created_at);
            const userInitial = (meme.user_id || 'U').charAt(0).toUpperCase();

            return `
                <div class="meme-item" data-meme-id="${meme.id}">
                    <div class="meme-header">
                        <div class="meme-avatar">${userInitial}</div>
                        <span class="meme-author">Аноним</span>
                        <span class="meme-time">${timeAgo}</span>
                    </div>
                    <div class="meme-image-container">
                        <img src="${meme.image_path}" alt="Meme" class="meme-image" loading="lazy">
                    </div>
                    ${meme.caption ? `<div class="meme-caption">${this.escapeHtml(meme.caption)}</div>` : ''}
                    <div class="meme-actions">
                        <button class="vote-btn like ${meme.user_vote === 'like' ? 'active' : ''}" data-vote="like">
                            👍 <span class="vote-count like-count">${meme.like_count}</span>
                        </button>
                        <button class="vote-btn dislike ${meme.user_vote === 'dislike' ? 'active' : ''}" data-vote="dislike">
                            👎 <span class="vote-count dislike-count">${meme.dislike_count}</span>
                        </button>
                        ${meme.user_id === MemeAPI.userId ? `<button class="delete-btn" title="Удалить мем">🗑️</button>` : ''}
                    </div>
                </div>
            `;
        },

        async handleVote(e, btn) {
            e.preventDefault();
            const memeItem = btn.closest('.meme-item');
            const memeId = parseInt(memeItem.dataset.memeId);
            const voteType = btn.dataset.vote;

            const result = await MemeAPI.vote(memeId, voteType);

            if (result.success) {
                // Update local meme data
                const meme = this.memes.find(m => m.id === memeId);
                if (meme) {
                    meme.like_count = result.meme.like_count;
                    meme.dislike_count = result.meme.dislike_count;
                    meme.user_vote = result.result.voteType;
                }

                // Update UI
                const likeBtns = memeItem.querySelectorAll('.vote-btn');
                likeBtns.forEach(b => b.classList.remove('active'));
                if (result.result.voteType) {
                    btn.classList.add('active');
                }

                memeItem.querySelector('.like-count').textContent = result.meme.like_count;
                memeItem.querySelector('.dislike-count').textContent = result.meme.dislike_count;
            } else {
                showToast(result.error || 'Ошибка голосования', 'error');
            }
        },

        async handleDelete(e, btn) {
            e.preventDefault();
            const memeItem = btn.closest('.meme-item');
            const memeId = parseInt(memeItem.dataset.memeId);

            if (!confirm('Удалить этот мем?')) return;

            const result = await MemeAPI.deleteMeme(memeId);

            if (result.success) {
                showToast('Мем удалён', 'success');
                // Will be removed via WebSocket event, but remove locally for instant feedback
                this.removeMeme(memeId);
            } else {
                showToast(result.error || 'Не удалось удалить мем', 'error');
            }
        },

        formatTimeAgo(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diff = Math.floor((now - date) / 1000);

            if (diff < 60) return 'только что';
            if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
            if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
            return date.toLocaleDateString('ru-RU');
        },

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // ===========================
    // MEME OF THE DAY
    // ===========================
    const MemeOfDay = {
        heroContainer: null,
        topList: null,
        currentMeme: null,

        init() {
            this.heroContainer = $('#meme-of-day-hero');
            this.topList = $('#top-memes-list');
        },

        async load() {
            const data = await MemeAPI.getMemeOfDay();
            this.setMemeOfDay(data.memeOfDay);
            this.setTopMemes(data.topMemes);
        },

        setMemeOfDay(meme) {
            this.currentMeme = meme;
            if (!this.heroContainer) return;

            // Update stats cards
            const likesEl = $('#meme-day-likes');
            const rankEl = $('#meme-day-rank');

            if (!meme) {
                this.heroContainer.innerHTML = `
                    <div class="meme-hero-empty">
                        <div class="empty-icon trophy-bounce">🏆</div>
                        <p>Пока нет мема дня</p>
                        <span class="empty-hint">Загрузи первый мем и собери лайки!</span>
                    </div>
                `;
                if (likesEl) likesEl.textContent = '0';
                if (rankEl) rankEl.textContent = '—';
                return;
            }

            // Update stats
            if (likesEl) likesEl.textContent = meme.like_count || 0;
            if (rankEl) rankEl.textContent = '#1';

            this.heroContainer.innerHTML = `
                <div class="meme-hero-content animated-hero">
                    <div class="meme-hero-badge pulse-glow">🏆 МЕМ ДНЯ</div>
                    <div class="meme-hero-image-container">
                        <img src="${meme.image_path}" alt="Meme of the Day" class="meme-hero-image" onclick="openMemeModal && openMemeModal({image_path:'${meme.image_path}',caption:'${(meme.caption || '').replace(/'/g, "\\'")}',like_count:${meme.like_count},dislike_count:${meme.dislike_count}})">
                    </div>
                    <div class="meme-hero-info">
                        ${meme.caption ? `<div class="meme-hero-caption">${MemeFeed.escapeHtml(meme.caption)}</div>` : ''}
                        <div class="meme-hero-stats">
                            <div class="meme-hero-stat likes" data-meme-id="${meme.id}">
                                👍 <span class="hero-like-count">${meme.like_count}</span> лайков
                            </div>
                            <div class="meme-hero-stat dislikes">
                                👎 <span class="hero-dislike-count">${meme.dislike_count}</span> дизлайков
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        setTopMemes(memes) {
            if (!this.topList) return;

            if (!memes || memes.length === 0) {
                this.topList.innerHTML = '<div class="top-memes-empty">Недостаточно мемов для рейтинга</div>';
                return;
            }

            const rankClasses = ['gold', 'silver', 'bronze', '', ''];

            this.topList.innerHTML = memes.map((meme, index) => `
                <div class="top-meme-item" data-meme-id="${meme.id}">
                    <div class="top-meme-rank ${rankClasses[index]}">${index + 1}</div>
                    <img src="${meme.image_path}" alt="Meme" class="top-meme-thumb">
                    <div class="top-meme-info">
                        <div class="top-meme-caption">${meme.caption || 'Без подписи'}</div>
                        <div class="top-meme-stats">
                            <span class="top-meme-likes">👍 ${meme.like_count}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        },

        updateVotes(memeId, likeCount, dislikeCount) {
            if (this.currentMeme && this.currentMeme.id === memeId) {
                const likeEl = this.heroContainer?.querySelector('.hero-like-count');
                const dislikeEl = this.heroContainer?.querySelector('.hero-dislike-count');
                if (likeEl) likeEl.textContent = likeCount;
                if (dislikeEl) dislikeEl.textContent = dislikeCount;
            }
        }
    };

    // ===========================
    // INITIALIZATION
    // ===========================
    function init() {
        loadSettings();  // Load settings first
        initElements();
        Transitions.init();
        initNavigation();
        initAuth();
        initModals();
        initSidebar();
        initKeyboard();
        initComingSoonButtons();
        initSettings();  // Setup settings UI

        // Initialize meme modules
        MemeAPI.init();
        MemeFeed.init();
        MemeOfDay.init();
        MemeSocket.init();

        // Initialize folders and logs modules
        FoldersUI.init();
        LogsUI.init();
        BotSettingsUI.init();
        AdminsUI.init();
        ServerFoldersUI.init();
        ProfileUI.init();
        ChatRoomsUI.init();

        // Bind login/logout buttons
        $('#btn-login')?.addEventListener('click', () => Auth.login());
        $('#btn-access')?.addEventListener('click', async () => {
            // Check if authenticated, if so go to app, otherwise login
            if (Auth.isAuthenticated) {
                showAppScreen();
            } else {
                Auth.login();
            }
        });

        // Logout button in settings
        $('#btn-logout')?.addEventListener('click', () => Auth.logout());

        // Check URL params for auth status
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth_success')) {
            // Clean URL and skip intro - go straight to app
            window.history.replaceState({}, '', window.location.pathname);
            // Save auth state to localStorage
            localStorage.setItem('isAuthenticated', 'true');
            showToast('Успешная авторизация через Discord!', 'success');
            // Skip intro, show app directly
            const intro = $('#intro-screen');
            const landing = $('#landing-section');
            const app = $('#app-layout');
            if (intro) intro.classList.add('hidden');
            if (landing) landing.classList.add('hidden');
            if (app) app.classList.remove('hidden');
            // Fetch user info
            checkSessionInBackground();
            // Load dashboard stats
            Dashboard.load();
            return; // Don't run intro
        }
        if (urlParams.get('auth_error')) {
            showToast('Ошибка авторизации: ' + urlParams.get('auth_error'), 'error');
            window.history.replaceState({}, '', window.location.pathname);
            localStorage.removeItem('isAuthenticated');
        }

        // Check if user was previously authenticated
        if (localStorage.getItem('isAuthenticated') === 'true') {
            // User was logged in before - skip intro, go to app
            const intro = $('#intro-screen');
            const landing = $('#landing-section');
            const app = $('#app-layout');
            if (intro) intro.classList.add('hidden');
            if (landing) landing.classList.add('hidden');
            if (app) app.classList.remove('hidden');
            // Verify session in background
            checkSessionInBackground();
            // Load dashboard stats
            Dashboard.load();
        } else {
            // Not authenticated - show intro
            Intro.init();
        }
    }

    function checkSessionInBackground() {
        fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    Auth.isAuthenticated = true;
                    Auth.currentUser = data.user;
                    Auth.updateUI();
                    localStorage.setItem('isAuthenticated', 'true');
                } else {
                    localStorage.removeItem('isAuthenticated');
                }
            })
            .catch(() => { localStorage.removeItem('isAuthenticated'); });
    }

    // Logout function - return to landing
    function logout() {
        localStorage.removeItem('isAuthenticated');
        // Call server logout
        fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' })
            .catch(() => { });
        // Show landing page
        const intro = $('#intro-screen');
        const landing = $('#landing-section');
        const app = $('#app-layout');
        if (app) app.classList.add('hidden');
        if (intro) intro.classList.remove('hidden');
        if (landing) landing.classList.remove('hidden');
        showToast('Вы вышли из системы', 'info');
        // Reload to reset state
        setTimeout(() => window.location.reload(), 500);
    }

    // Expose logout globally
    window.logout = logout;

    // Bind logout button
    document.addEventListener('DOMContentLoaded', () => {
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    });

    // Load memes when viewing memes section
    const originalShowView = showView;
    showView = async function (viewName, withTransition = true) {
        await originalShowView(viewName, withTransition);

        if (viewName === 'memes') {
            MemeFeed.loadMemes();
        } else if (viewName === 'meme-of-day') {
            MemeOfDay.load();
        } else if (viewName === 'folders') {
            ServerFoldersUI.load();
        } else if (viewName === 'logs-messages') {
            LogsUI.loadMessages(true);
        } else if (viewName === 'logs-actions') {
            LogsUI.loadActions(true);
        } else if (viewName === 'moderation') {
            AdminsUI.load();
        } else if (viewName === 'profile') {
            ProfileUI.load();
        } else if (viewName === 'chat-rooms') {
            ChatRoomsUI.loadRooms();
        }
    };

    // ===========================
    // FOLDERS API
    // ===========================
    const FoldersAPI = {
        baseUrl: 'http://localhost:5000/api',

        async getFolders() {
            const res = await fetch(`${this.baseUrl}/folders`);
            return res.json();
        },

        async createFolder(name, color = '#FFE989') {
            const res = await fetch(`${this.baseUrl}/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, ownerId: getUserId() })
            });
            return res.json();
        },

        async updateFolder(folderId, name, color) {
            const res = await fetch(`${this.baseUrl}/folders/${folderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, ownerId: getUserId() })
            });
            return res.json();
        },

        async deleteFolder(folderId) {
            const res = await fetch(`${this.baseUrl}/folders/${folderId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ownerId: getUserId() })
            });
            return res.json();
        },

        async getServersInFolder(folderId) {
            const res = await fetch(`${this.baseUrl}/folders/${folderId}/servers`);
            return res.json();
        },

        async addServerToFolder(folderId, serverId, serverName, serverIcon) {
            const res = await fetch(`${this.baseUrl}/folders/${folderId}/servers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serverId, serverName, serverIcon })
            });
            return res.json();
        },

        async removeServerFromFolder(folderId, serverId) {
            const res = await fetch(`${this.baseUrl}/folders/${folderId}/servers/${serverId}`, {
                method: 'DELETE'
            });
            return res.json();
        }
    };

    // ===========================
    // FOLDERS UI
    // ===========================
    const FoldersUI = {
        currentFolderId: null,
        folders: [],

        init() {
            $('#create-folder-btn')?.addEventListener('click', () => this.showCreateModal());
            $('#folder-back-btn')?.addEventListener('click', () => showView('folders'));
            $('#add-server-btn')?.addEventListener('click', () => this.showAddServerModal());
            $('#edit-folder-btn')?.addEventListener('click', () => this.showEditModal());
            $('#delete-folder-btn')?.addEventListener('click', () => this.deleteCurrentFolder());
        },

        async loadFolders() {
            try {
                this.folders = await FoldersAPI.getFolders();
                this.renderFolders();
            } catch (e) {
                console.error('Failed to load folders:', e);
            }
        },

        renderFolders() {
            const grid = $('#folders-grid');
            if (!grid) return;

            if (this.folders.length === 0) {
                grid.innerHTML = `
                    <div class="folders-empty">
                        <span class="empty-icon">📁</span>
                        <p>Нет папок</p>
                        <p class="text-muted">Создай первую папку для организации серверов</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = this.folders.map(folder => `
                <div class="folder-card" data-folder-id="${folder.id}" style="--folder-color: ${folder.color}">
                    <div class="folder-card-icon">📁</div>
                    <div class="folder-card-name">${folder.name}</div>
                    <div class="folder-card-count">ID: ${folder.id}</div>
                </div>
            `).join('');

            grid.querySelectorAll('.folder-card').forEach(card => {
                card.addEventListener('click', () => {
                    const folderId = parseInt(card.dataset.folderId);
                    this.openFolder(folderId);
                });
            });
        },

        async openFolder(folderId) {
            this.currentFolderId = folderId;
            const folder = this.folders.find(f => f.id === folderId);
            if (!folder) return;

            $('#folder-name').textContent = folder.name;

            try {
                const servers = await FoldersAPI.getServersInFolder(folderId);
                $('#folder-server-count').textContent = `${servers.length} сервер(ов)`;
                this.renderServers(servers);
                showView('folder-details');
            } catch (e) {
                console.error('Failed to load folder:', e);
            }
        },

        renderServers(servers) {
            const grid = $('#folder-servers-grid');
            if (!grid) return;

            if (servers.length === 0) {
                grid.innerHTML = `
                    <div class="folders-empty">
                        <span class="empty-icon">🖥️</span>
                        <p>Нет серверов</p>
                        <p class="text-muted">Добавь сервер в эту папку</p>
                    </div>
                `;
                return;
            }

            grid.innerHTML = servers.map(server => `
                <div class="server-card" data-server-id="${server.server_id}">
                    <div class="server-icon">
                        ${server.server_icon ? `<img src="${server.server_icon}" alt="">` : '🖥️'}
                    </div>
                    <div class="server-info">
                        <div class="server-name">${server.server_name}</div>
                        <div class="server-id">${server.server_id}</div>
                    </div>
                    <button class="server-remove-btn" title="Удалить">✕</button>
                </div>
            `).join('');

            grid.querySelectorAll('.server-remove-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const serverId = btn.closest('.server-card').dataset.serverId;
                    if (confirm('Удалить сервер из папки?')) {
                        await FoldersAPI.removeServerFromFolder(this.currentFolderId, serverId);
                        this.openFolder(this.currentFolderId);
                    }
                });
            });
        },

        showCreateModal() {
            const name = prompt('Название папки:');
            if (name) {
                FoldersAPI.createFolder(name).then(() => this.loadFolders());
            }
        },

        showAddServerModal() {
            const serverId = prompt('ID сервера:');
            if (!serverId) return;
            const serverName = prompt('Название сервера:');
            if (!serverName) return;

            FoldersAPI.addServerToFolder(this.currentFolderId, serverId, serverName)
                .then(() => this.openFolder(this.currentFolderId));
        },

        showEditModal() {
            const folder = this.folders.find(f => f.id === this.currentFolderId);
            const name = prompt('Новое название:', folder?.name);
            if (name) {
                FoldersAPI.updateFolder(this.currentFolderId, name, folder?.color)
                    .then(() => {
                        this.loadFolders();
                        $('#folder-name').textContent = name;
                    });
            }
        },

        async deleteCurrentFolder() {
            if (!confirm('Удалить папку и все серверы в ней?')) return;
            await FoldersAPI.deleteFolder(this.currentFolderId);
            showView('folders');
            this.loadFolders();
        }
    };

    // ===========================
    // MESSAGE LOGS API
    // ===========================
    const MessageLogsAPI = {
        baseUrl: 'http://localhost:5000/api',

        async getLogs(limit = 50) {
            const res = await fetch(`${this.baseUrl}/logs/messages?limit=${limit}`);
            return res.json();
        }
    };

    // ===========================
    // MESSAGE LOGS UI
    // ===========================
    const MessageLogsUI = {
        logs: [],

        init() {
            $('#logs-refresh-btn')?.addEventListener('click', () => this.loadLogs());
        },

        async loadLogs() {
            try {
                this.logs = await MessageLogsAPI.getLogs();
                this.renderLogs();
            } catch (e) {
                console.error('Failed to load logs:', e);
            }
        },

        renderLogs() {
            const list = $('#message-logs-list');
            if (!list) return;

            if (this.logs.length === 0) {
                list.innerHTML = `
                    <div class="logs-empty">
                        <span class="empty-icon">📝</span>
                        <p>Нет логов</p>
                        <p class="text-muted">Логи появятся когда будут сообщения на серверах</p>
                    </div>
                `;
                return;
            }

            const variants = ['variant-red', 'variant-orange', 'variant-green', 'variant-blue'];

            list.innerHTML = this.logs.map((log, i) => {
                const variant = variants[i % variants.length];
                const time = new Date(log.created_at).toLocaleString('ru-RU');
                return `
                    <div class="log-card ${variant}">
                        <div class="log-header">
                            <span class="log-server">${log.server_name || 'Unknown Server'}</span>
                            <span class="log-time">${time}</span>
                        </div>
                        <div class="log-user">
                            <span class="log-username">${log.username}</span>
                            <span class="log-user-id">#${log.user_id}</span>
                        </div>
                        <div class="log-content">${log.content}</div>
                    </div>
                `;
            }).join('');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

