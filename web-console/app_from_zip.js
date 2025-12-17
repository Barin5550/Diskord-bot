/**
 * Bot Admin Console - Main Application
 * Updated with Tetris, Memes, Live Logs, and Admin Management
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:5000';
    const DISCORD_CLIENT_ID = '1441381190371246261';
    const REDIRECT_URI = encodeURIComponent('http://localhost:5000/folders'); 
    const DISCORD_ADD_BOT_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${REDIRECT_URI}&integration_type=0&scope=bot+identify+email+guilds`;
    const DISCORD_LOGIN_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=identify+email+guilds`;
    
    const state = {
        currentView: 'folders',
        activeFolder: null,
        pendingServer: null,
        user: null
    };

    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const elements = {
        landingPage: null,
        appLayout: null,
        sidebar: null,
        navItems: null,
        views: null,
        headerContext: null,
        navLockedSection: null,
        pendingBanner: null,
        userAvatar: null,
        userName: null
    };

    function initElements() {
        elements.landingPage = $('#landing-page');
        elements.appLayout = $('#app-layout');
        elements.sidebar = $('#sidebar');
        elements.navItems = $$('.nav-item');
        elements.views = $$('.app-view');
        elements.headerContext = $('#header-folder-context');
        elements.navLockedSection = $('#nav-locked-section');
        elements.pendingBanner = $('#pending-assignment-banner');
        elements.userAvatar = $('.user-avatar');
        elements.userName = $('.user-name');
    }

    async function showView(viewName, withTransition = true) {
        const publicViews = ['folders', 'folder-details', 'help-faq'];
        
        if (!state.activeFolder && !publicViews.includes(viewName)) {
            if (state.currentView !== 'folders') {
                showToast('⚠️ Сначала выберите папку серверов!', 'warning');
            }
            viewName = 'folders';
        }

        state.currentView = viewName;
        
        elements.navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        elements.views.forEach(view => {
            const isTarget = view.id === `view-${viewName}`;
            view.classList.toggle('hidden', !isTarget);
        });

        // Trigger data loads
        if (viewName === 'folders') {
            FoldersUI.loadFolders();
            updatePendingBanner();
        }
        if (viewName === 'dashboard' && state.activeFolder) DashboardUI.loadStats();
        if (viewName === 'logs-messages') LogsUI.loadMessages(true);
        if (viewName === 'moderation') ModerationUI.loadAdmins();
        if (viewName === 'help-faq') HelpUI.loadFAQ();
        if (viewName === 'memes') MemesUI.loadMemes();
        
        // Tetris Handling
        if (viewName === 'tetris') {
            if(window.TetrisGame) window.TetrisGame.init();
        } else {
            if(window.TetrisGame) window.TetrisGame.togglePause(); // Auto-pause if leaving tab
        }
    }

    function initNavigation() {
        elements.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) showView(view);
            });
        });

        $('#btn-exit-folder')?.addEventListener('click', () => {
            setActiveFolder(null);
            showView('folders');
        });

        $('#cancel-assignment-btn')?.addEventListener('click', () => {
            state.pendingServer = null;
            updatePendingBanner();
            showToast('Assignment cancelled', 'info');
        });
    }

    function setActiveFolder(folder) {
        state.activeFolder = folder;
        if (folder) {
            elements.navLockedSection.classList.remove('locked');
            elements.headerContext.classList.remove('hidden');
            $('#active-folder-name').textContent = folder.name;
            showToast(`📂 Контекст: ${folder.name}`, 'success');
        } else {
            elements.navLockedSection.classList.add('locked');
            elements.headerContext.classList.add('hidden');
            $('#active-folder-name').textContent = 'Не выбрана';
        }
    }

    function updatePendingBanner() {
        if (state.pendingServer) {
            elements.pendingBanner.classList.remove('hidden');
            $('#pending-server-text').textContent = `✨ Select a folder to assign ${state.pendingServer.name}`;
        } else {
            elements.pendingBanner.classList.add('hidden');
        }
    }

    function updateUserUI() {
        if (state.user) {
            if (state.user.avatar) {
                elements.userAvatar.innerHTML = `<img src="${state.user.avatar}" style="width:100%;height:100%;border-radius:50%;">`;
            } else {
                elements.userAvatar.textContent = state.user.username.charAt(0).toUpperCase();
            }
            elements.userName.textContent = state.user.username;
        }
    }

    // ===========================
    // UI COMPONENTS
    // ===========================
    
    // DASHBOARD
    const DashboardUI = {
        async loadStats() {
            if (!state.activeFolder) return;
            $('#stat-members').textContent = '...';
            $('#stat-servers').textContent = '...';
            try {
                const res = await fetch(`${API_BASE}/api/stats?folderId=${state.activeFolder.id}`);
                const data = await res.json();
                $('#stat-members').textContent = data.totalMembers.toLocaleString();
                $('#stat-servers').textContent = data.activeServers;
                $('#dashboard-subtitle').textContent = `Статистика для папки "${state.activeFolder.name}"`;
            } catch (e) { console.error("Stats error", e); }
        }
    };

    // MEMES (Restored)
    const MemesUI = {
        currentSort: 'new',
        init() {
            $('#meme-upload-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadMeme();
            });
            $('#sort-new')?.addEventListener('click', () => { this.currentSort = 'new'; this.loadMemes(); });
            $('#sort-popular')?.addEventListener('click', () => { this.currentSort = 'popular'; this.loadMemes(); });
        },
        async uploadMeme() {
            const fileInput = $('#meme-file');
            const captionInput = $('#meme-caption');
            if(!fileInput.files[0]) return showToast("Select an image", "warning");
            
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);
            formData.append('caption', captionInput.value);
            formData.append('userId', state.user.id);

            try {
                const res = await fetch(`${API_BASE}/api/memes`, { method: 'POST', body: formData });
                const data = await res.json();
                if(data.success) {
                    showToast("Meme uploaded!", "success");
                    fileInput.value = '';
                    captionInput.value = '';
                    this.loadMemes();
                } else {
                    showToast("Upload failed", "error");
                }
            } catch(e) { showToast("API Error", "error"); }
        },
        async loadMemes() {
            const grid = $('#memes-grid');
            grid.innerHTML = '<div class="folders-empty">Loading...</div>';
            try {
                const res = await fetch(`${API_BASE}/api/memes?sort=${this.currentSort}&userId=${state.user?.id}`);
                const data = await res.json();
                if(data.memes.length === 0) {
                    grid.innerHTML = '<div class="folders-empty">No memes yet. Upload one!</div>';
                    return;
                }
                grid.innerHTML = data.memes.map(m => `
                    <div class="card" style="padding:0; overflow:hidden;">
                        <img src="${API_BASE}${m.url}" style="width:100%; height:250px; object-fit:cover; border-bottom:1px solid #333;">
                        <div style="padding:15px;">
                            ${m.caption ? `<div style="margin-bottom:10px; font-weight:bold;">${m.caption}</div>` : ''}
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <button class="btn btn-sm btn-ghost" onclick="MemesUI.vote(${m.id}, 'like')">👍 ${m.likes}</button>
                                    <button class="btn btn-sm btn-ghost" onclick="MemesUI.vote(${m.id}, 'dislike')">👎 ${m.dislikes}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                // Expose vote function globally
                window.MemesUI = this;
            } catch(e) { grid.innerHTML = '<div class="folders-empty">Failed to load memes</div>'; }
        },
        async vote(id, type) {
            try {
                await fetch(`${API_BASE}/api/memes/${id}/vote`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ userId: state.user.id, voteType: type })
                });
                this.loadMemes(); // Refresh to show new counts
            } catch(e) { showToast("Vote failed", "error"); }
        }
    };

    // LOGS
    const LogsUI = {
        init() {
            $('#logs-messages-refresh')?.addEventListener('click', () => this.loadMessages(true));
        },
        async loadMessages() {
            const folderParam = state.activeFolder ? `?folderId=${state.activeFolder.id}` : '';
            const tbody = $('#messages-logs-body');
            tbody.innerHTML = '<tr><td colspan="5">Загрузка...</td></tr>';
            
            try {
                const res = await fetch(`${API_BASE}/api/logs/messages${folderParam}`);
                const data = await res.json();
                
                if (data.logs.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="5" class="no-data">Нет логов (отправьте сообщение в Discord)</td></tr>';
                    return;
                }
                
                tbody.innerHTML = data.logs.map(log => `
                    <tr>
                        <td style="white-space:nowrap; color:#888;">${new Date(log.created_at).toLocaleString()}</td>
                        <td style="color:#FFD54A;">${log.server_name}</td>
                        <td style="color:#aaa;">#${log.channel_name}</td>
                        <td style="font-weight:bold;">${log.username}</td>
                        <td style="color:#fff;">${log.content}</td>
                    </tr>
                `).join('');
            } catch (e) { 
                console.error(e);
                tbody.innerHTML = '<tr><td colspan="5">Ошибка загрузки API</td></tr>'; 
            }
        }
    };

    // MODERATION
    const ModerationUI = {
        init() {
            $('#btn-add-admin')?.addEventListener('click', () => this.addAdmin());
        },
        async loadAdmins() {
            const tbody = $('#admins-table-body');
            tbody.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';
            try {
                const res = await fetch(`${API_BASE}/api/admins`);
                const data = await res.json();
                if (data.admins.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="no-data">Нет админов</td></tr>';
                    return;
                }
                tbody.innerHTML = data.admins.map(admin => `
                    <tr>
                        <td style="font-family:monospace; color:#FFD54A; font-size:1.1em;">${admin.user_id}</td>
                        <td>${admin.added_at}</td>
                        <td>
                            ${admin.is_owner 
                                ? '<span class="badge badge-success">OWNER (PROTECTED)</span>' 
                                : `<button class="btn btn-ghost btn-sm btn-delete-admin" data-id="${admin.user_id}" style="color:#ef4444;">Удалить</button>`
                            }
                        </td>
                    </tr>
                `).join('');
                $$('.btn-delete-admin').forEach(btn => {
                    btn.addEventListener('click', () => this.removeAdmin(btn.dataset.id));
                });
            } catch(e) { tbody.innerHTML = '<tr><td colspan="3">Ошибка загрузки</td></tr>'; }
        },
        async addAdmin() {
            const input = $('#admin-id-input');
            const userId = input.value.trim();
            if (!userId) return showToast("Введите User ID", "warning");
            try {
                const res = await fetch(`${API_BASE}/api/admins`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ userId })
                });
                const data = await res.json();
                if (data.success) {
                    showToast("Админ добавлен", "success");
                    input.value = '';
                    this.loadAdmins();
                } else {
                    showToast("Ошибка: " + data.error, "error");
                }
            } catch(e) { showToast("Ошибка API", "error"); }
        },
        async removeAdmin(id) {
            if (!confirm(`Удалить админа ${id}?`)) return;
            try {
                await fetch(`${API_BASE}/api/admins/${id}`, { method: 'DELETE' });
                this.loadAdmins();
                showToast("Админ удален", "success");
            } catch(e) { showToast("Ошибка API", "error"); }
        }
    };

    // HELP
    const HelpUI = {
        async loadFAQ() {
            const container = $('#faq-container');
            container.innerHTML = 'Загрузка...';
            try {
                const res = await fetch(`${API_BASE}/api/faq`); // Note: Requires FAQ endpoint
                if(res.ok) {
                    const data = await res.json();
                    container.innerHTML = data.faqs.map(q => `
                        <div class="card" style="margin-bottom:10px;">
                            <div style="font-weight:bold; color:var(--color-accent); margin-bottom:5px;">Q: ${q.q}</div>
                            <div style="color:var(--color-text);">A: ${q.a}</div>
                        </div>
                    `).join('');
                } else { container.innerHTML = 'No FAQ available.'; }
            } catch(e) { container.innerHTML = 'No FAQ available.'; }
        }
    };

    // FOLDERS
    const FoldersUI = {
        folders: [],
        currentViewingFolderId: null,

        init() {
            $('#create-folder-btn')?.addEventListener('click', () => this.showCreateModal());
            $('#folder-back-btn')?.addEventListener('click', () => showView('folders'));
            $('#btn-select-folder-context')?.addEventListener('click', () => {
                const folder = this.folders.find(f => f.id === this.currentViewingFolderId);
                if (folder) {
                    setActiveFolder(folder);
                    showView('dashboard');
                }
            });
            $('#add-server-btn')?.addEventListener('click', () => {
                 window.location.href = DISCORD_ADD_BOT_URL;
            });
            $('#delete-folder-btn')?.addEventListener('click', () => this.deleteFolder());
        },

        async loadFolders() {
            try {
                const res = await fetch(`${API_BASE}/api/folders`);
                this.folders = await res.json();
                this.renderFolders();
            } catch (e) { $('#folders-grid').innerHTML = '<div class="folders-empty">Ошибка загрузки API</div>'; }
        },

        renderFolders() {
            const grid = $('#folders-grid');
            if (this.folders.length === 0) {
                grid.innerHTML = '<div class="folders-empty"><p>Нет папок. Создайте первую!</p></div>';
                return;
            }
            grid.innerHTML = this.folders.map(folder => `
                <div class="folder-card" data-id="${folder.id}" style="--folder-color: ${folder.color}">
                    <div class="folder-card-icon">📁</div>
                    <div class="folder-card-name">${folder.name}</div>
                    <div class="folder-card-count">ID: ${folder.id}</div>
                </div>
            `).join('');
            $$('.folder-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (state.pendingServer) {
                        this.assignPendingServer(parseInt(card.dataset.id));
                    } else {
                        this.openFolderDetails(parseInt(card.dataset.id));
                    }
                });
            });
        },

        async assignPendingServer(folderId) {
            if (!state.pendingServer) return;
            try {
                await fetch(`${API_BASE}/api/folders/${folderId}/servers`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        serverId: state.pendingServer.id, 
                        serverName: state.pendingServer.name
                    })
                });
                showToast(`✅ ${state.pendingServer.name} assigned to folder!`, 'success');
                state.pendingServer = null;
                updatePendingBanner();
                this.openFolderDetails(folderId);
            } catch(e) { showToast('Failed to assign server', 'error'); }
        },

        async openFolderDetails(folderId) {
            try {
                this.currentViewingFolderId = folderId;
                const folder = this.folders.find(f => f.id === folderId);
                if (!folder) return showToast('Folder not found', 'error');

                $('#folder-name').textContent = folder.name;
                const srvRes = await fetch(`${API_BASE}/api/folders/${folderId}/servers`);
                const servers = await srvRes.json();
                const serverGrid = $('#folder-servers-grid');
                
                if (servers.length === 0) {
                    serverGrid.innerHTML = '<div class="folders-empty"><p>Нет серверов</p></div>';
                } else {
                    serverGrid.innerHTML = servers.map(s => `
                        <div class="server-card">
                            <div class="server-icon">🖥️</div>
                            <div class="server-info">
                                <div class="server-name">${s.server_name}</div>
                                <div class="server-id">${s.server_id}</div>
                            </div>
                            <button class="btn-ghost btn-icon btn-remove-server" data-server="${s.server_id}" style="margin-left:auto; color:#ef4444;">🗑️</button>
                        </div>
                    `).join('');
                    $$('.btn-remove-server').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.removeServer(folderId, btn.dataset.server);
                        });
                    });
                }
                showView('folder-details');
            } catch(e) { showToast("Failed to load details", "error"); }
        },

        async removeServer(folderId, serverId) {
            if(!confirm("Remove server from this folder?")) return;
            try {
                await fetch(`${API_BASE}/api/folders/${folderId}/servers/${serverId}`, { method: 'DELETE' });
                this.openFolderDetails(folderId);
                showToast("Server removed", "success");
            } catch(e) { showToast("Error removing server", "error"); }
        },

        async showCreateModal() {
            const name = prompt("Название папки:");
            if (name) {
                await fetch(`${API_BASE}/api/folders`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name})
                });
                this.loadFolders();
            }
        },
        async deleteFolder() {
            if(confirm("Удалить папку?")) showToast("Функция удаления в разработке", "info");
        }
    };

    // TOAST
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

    // AUTH
    function redirectToLogin() { window.location.href = DISCORD_LOGIN_URL; }
    function redirectToAddServer() { window.location.href = DISCORD_ADD_BOT_URL; }

    async function handleAuthReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const guildId = urlParams.get('guild_id');
        
        if (code) {
            try {
                showToast("Logging in...", "info");
                const response = await fetch(`${API_BASE}/api/auth/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ code })
                });
                const data = await response.json();
                
                if (data.success) {
                    state.user = data.user;
                    localStorage.setItem('nexus_user', JSON.stringify(state.user));
                    elements.landingPage.classList.add('hidden');
                    elements.appLayout.classList.remove('hidden');
                    updateUserUI();
                    showView('folders', false);
                    showToast(`Welcome, ${state.user.username}!`, 'success');
                    
                    if (guildId) {
                        let serverName = `Server ${guildId}`;
                        state.pendingServer = { id: guildId, name: serverName };
                        updatePendingBanner();
                        showToast("Server added! Select a folder.", "success");
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                    return true;
                } else {
                    showToast("Login failed: " + data.error, 'error');
                }
            } catch (e) { showToast("Auth error", 'error'); }
        }
        return false;
    }

    function checkLocalSession() {
        const storedUser = localStorage.getItem('nexus_user');
        if (storedUser) {
            try {
                state.user = JSON.parse(storedUser);
                elements.landingPage.classList.add('hidden');
                elements.appLayout.classList.remove('hidden');
                updateUserUI();
                showView('folders', false);
                return true;
            } catch(e) { localStorage.removeItem('nexus_user'); }
        }
        return false;
    }

    async function init() {
        initElements();
        initNavigation();
        FoldersUI.init();
        LogsUI.init();
        ModerationUI.init();
        MemesUI.init(); // Init Memes
        
        $('#btn-login')?.addEventListener('click', redirectToLogin);
        $('#btn-add-server')?.addEventListener('click', redirectToAddServer);
        
        setActiveFolder(null);

        const isAuthRedirect = await handleAuthReturn();
        if (!isAuthRedirect) {
            const hasSession = checkLocalSession();
            if (!hasSession) elements.landingPage.classList.remove('hidden');
        }
    }

    document.addEventListener('DOMContentLoaded', init);

})();