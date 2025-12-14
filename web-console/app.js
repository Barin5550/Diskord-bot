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
            const wsUrl = `${wsProtocol}//${window.location.host}`;

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

            if (this.memes.length === 0) {
                this.container.innerHTML = `
                    <div class="meme-feed-empty">
                        <div class="empty-icon">🎭</div>
                        <p>Пока нет мемов. Будь первым!</p>
                    </div>
                `;
                return;
            }

            this.container.innerHTML = this.memes.map(meme => this.renderMemeItem(meme)).join('');

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

            if (!meme) {
                this.heroContainer.innerHTML = `
                    <div class="meme-hero-empty">
                        <div class="empty-icon">🏆</div>
                        <p>Пока нет мема дня</p>
                        <span class="empty-hint">Загрузи первый мем и собери лайки!</span>
                    </div>
                `;
                return;
            }

            this.heroContainer.innerHTML = `
                <div class="meme-hero-content">
                    <div class="meme-hero-badge">🏆 МЕМ ДНЯ</div>
                    <div class="meme-hero-image-container">
                        <img src="${meme.image_path}" alt="Meme of the Day" class="meme-hero-image">
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
        initElements();
        Transitions.init();
        initNavigation();
        initAuth();
        initModals();
        initSidebar();
        initKeyboard();

        // Initialize meme modules
        MemeAPI.init();
        MemeFeed.init();
        MemeOfDay.init();
        MemeSocket.init();

        Intro.init();
    }

    // Load memes when viewing memes section
    const originalShowView = showView;
    showView = async function (viewName, withTransition = true) {
        await originalShowView(viewName, withTransition);

        if (viewName === 'memes') {
            MemeFeed.loadMemes();
        } else if (viewName === 'meme-of-day') {
            MemeOfDay.load();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
