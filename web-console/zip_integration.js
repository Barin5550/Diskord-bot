/**
 * ZIP Integration Module
 * 4 Tabs from ZIP: Server Folders, Dashboard, Живые Логи, Модерация
 * This module adds folder context locking and OAuth2 server flow
 */

(function () {
    'use strict';

    const API_BASE = 'http://localhost:5000';
    const DISCORD_CLIENT_ID = '1441381190371246261'; // Replace with your client ID
    const REDIRECT_URI = encodeURIComponent(window.location.origin + '/folders');
    const DISCORD_ADD_BOT_URL = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=8&response_type=code&redirect_uri=${REDIRECT_URI}&integration_type=0&scope=bot+identify+email+guilds`;

    // ===========================
    // GLOBAL STATE
    // ===========================
    window.ZipState = {
        activeFolder: null,
        pendingServer: null
    };

    // ===========================
    // SET ACTIVE FOLDER (Unlock Main Section)
    // ===========================
    window.setActiveFolder = function (folder) {
        window.ZipState.activeFolder = folder;

        const navLocked = document.querySelector('#nav-locked-section');
        const headerContext = document.querySelector('#header-folder-context');
        const folderNameEl = document.querySelector('#active-folder-name');

        if (folder) {
            // Unlock navigation
            if (navLocked) navLocked.classList.add('unlocked');
            if (headerContext) headerContext.classList.remove('hidden');
            if (folderNameEl) folderNameEl.textContent = folder.name;

            // Set Dashboard filter
            if (window.Dashboard) {
                window.Dashboard.activeFolderId = folder.id;
            }

            if (window.showToast) window.showToast(`📂 Контекст: ${folder.name}`, 'success');
        } else {
            // Lock navigation
            if (navLocked) navLocked.classList.remove('unlocked');
            if (headerContext) headerContext.classList.add('hidden');
            if (folderNameEl) folderNameEl.textContent = 'Не выбрана';

            if (window.Dashboard) {
                window.Dashboard.activeFolderId = null;
            }
        }
    };

    // ===========================
    // EXIT FOLDER CONTEXT
    // ===========================
    window.exitFolderContext = function () {
        window.setActiveFolder(null);
        if (window.showView) window.showView('folders');
    };

    // ===========================
    // PENDING SERVER BANNER
    // ===========================
    window.updatePendingBanner = function () {
        const banner = document.querySelector('#pending-assignment-banner');
        const text = document.querySelector('#pending-server-text');

        if (window.ZipState.pendingServer && banner) {
            banner.classList.remove('hidden');
            if (text) text.textContent = `✨ Выбери папку для сервера "${window.ZipState.pendingServer.name}"`;
        } else if (banner) {
            banner.classList.add('hidden');
        }
    };

    window.cancelPendingServer = function () {
        window.ZipState.pendingServer = null;
        window.updatePendingBanner();
        if (window.showToast) window.showToast('Назначение отменено', 'info');
    };

    // ===========================
    // REDIRECT TO ADD SERVER (OAuth2)
    // ===========================
    window.redirectToAddServer = function () {
        window.location.href = DISCORD_ADD_BOT_URL;
    };

    // ===========================
    // DASHBOARD UI (from ZIP)
    // ===========================
    window.DashboardUIZip = {
        async loadStats() {
            if (!window.ZipState.activeFolder) {
                console.log('No active folder for dashboard');
                return;
            }

            const membersEl = document.querySelector('#stat-members');
            const serversEl = document.querySelector('#stat-servers');
            const subtitleEl = document.querySelector('#dashboard-subtitle');

            if (membersEl) membersEl.textContent = '...';
            if (serversEl) serversEl.textContent = '...';

            try {
                const folderId = window.ZipState.activeFolder.id;
                const res = await fetch(`${API_BASE}/api/stats?folderId=${folderId}`);
                const data = await res.json();

                if (membersEl) membersEl.textContent = data.totalMembers.toLocaleString();
                if (serversEl) serversEl.textContent = data.activeServers;
                if (subtitleEl) subtitleEl.textContent = `Статистика для папки "${window.ZipState.activeFolder.name}"`;
            } catch (e) {
                console.error("Dashboard stats error:", e);
            }
        }
    };

    // ===========================
    // LOGS UI (from ZIP)
    // ===========================
    window.LogsUIZip = {
        init() {
            const refreshBtn = document.querySelector('#logs-messages-refresh');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', () => this.loadMessages());
            }
        },

        async loadMessages() {
            const folderParam = window.ZipState.activeFolder
                ? `?folderId=${window.ZipState.activeFolder.id}`
                : '';

            const tbody = document.querySelector('#messages-logs-body');
            if (!tbody) return;

            tbody.innerHTML = '<tr><td colspan="5">Загрузка...</td></tr>';

            try {
                const res = await fetch(`${API_BASE}/api/logs/messages${folderParam}`);
                const data = await res.json();

                if (!data.logs || data.logs.length === 0) {
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
                console.error("Logs error:", e);
                tbody.innerHTML = '<tr><td colspan="5">Ошибка загрузки API</td></tr>';
            }
        }
    };

    // ===========================
    // MODERATION UI (from ZIP)
    // ===========================
    window.ModerationUIZip = {
        init() {
            const addBtn = document.querySelector('#btn-add-admin');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.addAdmin());
            }
        },

        async loadAdmins() {
            const tbody = document.querySelector('#admins-table-body');
            if (!tbody) return;

            tbody.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';

            try {
                const res = await fetch(`${API_BASE}/api/admins`);
                const data = await res.json();

                if (!data.admins || data.admins.length === 0) {
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

                document.querySelectorAll('.btn-delete-admin').forEach(btn => {
                    btn.addEventListener('click', () => this.removeAdmin(btn.dataset.id));
                });
            } catch (e) {
                console.error("Admins error:", e);
                tbody.innerHTML = '<tr><td colspan="3">Ошибка загрузки</td></tr>';
            }
        },

        async addAdmin() {
            const input = document.querySelector('#admin-id-input');
            if (!input) return;

            const userId = input.value.trim();
            if (!userId) {
                if (window.showToast) window.showToast("Введите User ID", "warning");
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/admins`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId })
                });
                const data = await res.json();

                if (data.success) {
                    if (window.showToast) window.showToast("Админ добавлен", "success");
                    input.value = '';
                    this.loadAdmins();
                } else {
                    if (window.showToast) window.showToast("Ошибка: " + data.error, "error");
                }
            } catch (e) {
                if (window.showToast) window.showToast("Ошибка API", "error");
            }
        },

        async removeAdmin(id) {
            if (!confirm(`Удалить админа ${id}?`)) return;

            try {
                await fetch(`${API_BASE}/api/admins/${id}`, { method: 'DELETE' });
                this.loadAdmins();
                if (window.showToast) window.showToast("Админ удален", "success");
            } catch (e) {
                if (window.showToast) window.showToast("Ошибка API", "error");
            }
        }
    };

    // ===========================
    // FOLDERS UI (from ZIP)
    // ===========================
    window.FoldersUIZip = {
        folders: [],
        currentViewingFolderId: null,

        init() {
            const createBtn = document.querySelector('#create-folder-btn');
            const backBtn = document.querySelector('#folder-back-btn');
            const selectBtn = document.querySelector('#btn-select-folder-context');
            const addServerBtn = document.querySelector('#add-server-btn');
            const addServerOAuthBtn = document.querySelector('#add-server-oauth-btn');
            const deleteBtn = document.querySelector('#delete-folder-btn');

            if (createBtn) createBtn.addEventListener('click', () => this.showCreateModal());
            if (backBtn) backBtn.addEventListener('click', () => window.showView && window.showView('folders'));
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    const folder = this.folders.find(f => f.id === this.currentViewingFolderId);
                    if (folder) {
                        window.setActiveFolder(folder);
                        if (window.showView) window.showView('dashboard');
                    }
                });
            }
            if (addServerBtn) addServerBtn.addEventListener('click', () => window.redirectToAddServer());
            if (addServerOAuthBtn) addServerOAuthBtn.addEventListener('click', () => window.redirectToAddServer());
            if (deleteBtn) deleteBtn.addEventListener('click', () => this.deleteFolder());
        },

        async loadFolders() {
            const grid = document.querySelector('#folders-grid');
            if (!grid) return;

            try {
                const res = await fetch(`${API_BASE}/api/server-folders`);
                const data = await res.json();
                // API returns {success: true, folders: [...]} or just array
                this.folders = data.folders || data;
                this.renderFolders();
            } catch (e) {
                console.error("Folders error:", e);
                grid.innerHTML = '<div class="folders-empty">Ошибка загрузки API</div>';
            }
        },

        renderFolders() {
            const grid = document.querySelector('#folders-grid');
            if (!grid) return;

            if (this.folders.length === 0) {
                grid.innerHTML = '<div class="folders-empty"><p>Нет папок. Создайте первую!</p></div>';
                return;
            }

            const isPending = window.ZipState.pendingServer ? ' pending-target' : '';

            grid.innerHTML = this.folders.map(folder => `
                <div class="folder-card${isPending}" data-id="${folder.id}" style="--folder-color: ${folder.color || '#FFE989'}">
                    <div class="folder-card-icon">📁</div>
                    <div class="folder-card-name">${folder.name}</div>
                    <div class="folder-card-count">ID: ${folder.id}</div>
                </div>
            `).join('');

            document.querySelectorAll('.folder-card').forEach(card => {
                card.addEventListener('click', () => {
                    if (window.ZipState.pendingServer) {
                        this.assignPendingServer(parseInt(card.dataset.id));
                    } else {
                        this.openFolderDetails(parseInt(card.dataset.id));
                    }
                });
            });
        },

        async assignPendingServer(folderId) {
            if (!window.ZipState.pendingServer) return;

            try {
                await fetch(`${API_BASE}/api/server-folders/${folderId}/servers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serverId: window.ZipState.pendingServer.id,
                        serverName: window.ZipState.pendingServer.name
                    })
                });

                if (window.showToast) {
                    window.showToast(`✅ ${window.ZipState.pendingServer.name} добавлен в папку!`, 'success');
                }

                window.ZipState.pendingServer = null;
                window.updatePendingBanner();
                this.openFolderDetails(folderId);
            } catch (e) {
                if (window.showToast) window.showToast('Ошибка добавления сервера', 'error');
            }
        },

        async openFolderDetails(folderId) {
            try {
                this.currentViewingFolderId = folderId;
                const folder = this.folders.find(f => f.id === folderId);

                if (!folder) {
                    if (window.showToast) window.showToast('Папка не найдена', 'error');
                    return;
                }

                const nameEl = document.querySelector('#folder-name');
                if (nameEl) nameEl.textContent = folder.name;

                const srvRes = await fetch(`${API_BASE}/api/server-folders/${folderId}/servers`);
                const servers = await srvRes.json();

                const serverGrid = document.querySelector('#folder-servers-grid');
                if (!serverGrid) return;

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

                    document.querySelectorAll('.btn-remove-server').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            this.removeServer(folderId, btn.dataset.server);
                        });
                    });
                }

                if (window.showView) window.showView('folder-details');
            } catch (e) {
                console.error("Folder details error:", e);
                if (window.showToast) window.showToast("Ошибка загрузки", "error");
            }
        },

        async removeServer(folderId, serverId) {
            if (!confirm("Удалить сервер из папки?")) return;

            try {
                await fetch(`${API_BASE}/api/server-folders/${folderId}/servers/${serverId}`, { method: 'DELETE' });
                this.openFolderDetails(folderId);
                if (window.showToast) window.showToast("Сервер удален", "success");
            } catch (e) {
                if (window.showToast) window.showToast("Ошибка удаления", "error");
            }
        },

        async showCreateModal() {
            const name = prompt("Название папки:");
            if (name) {
                try {
                    await fetch(`${API_BASE}/api/server-folders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name })
                    });
                    this.loadFolders();
                } catch (e) {
                    if (window.showToast) window.showToast("Ошибка создания папки", "error");
                }
            }
        },

        async deleteFolder() {
            if (!this.currentViewingFolderId) return;

            if (confirm("Удалить папку и все серверы в ней?")) {
                try {
                    await fetch(`${API_BASE}/api/server-folders/${this.currentViewingFolderId}`, { method: 'DELETE' });
                    if (window.showToast) window.showToast("Папка удалена", "success");
                    if (window.showView) window.showView('folders');
                    this.loadFolders();
                } catch (e) {
                    if (window.showToast) window.showToast("Ошибка удаления", "error");
                }
            }
        }
    };

    // ===========================
    // HANDLE OAUTH REDIRECT
    // ===========================
    window.handleOAuthRedirect = function () {
        const urlParams = new URLSearchParams(window.location.search);
        const guildId = urlParams.get('guild_id');

        if (guildId) {
            window.ZipState.pendingServer = {
                id: guildId,
                name: `Server ${guildId}`
            };

            // Clean URL
            window.history.replaceState({}, document.title, '/folders');

            // Show pending banner
            window.updatePendingBanner();

            if (window.showToast) {
                window.showToast(`✨ Сервер добавлен! Выбери папку для размещения.`, 'success');
            }

            return true;
        }
        return false;
    };

    // ===========================
    // INITIALIZATION
    // ===========================
    function initZipIntegration() {
        console.log('[ZIP Integration] Initializing 4 tabs from ZIP...');

        // Init UI components
        window.FoldersUIZip.init();
        window.LogsUIZip.init();
        window.ModerationUIZip.init();

        // Lock Main section initially
        window.setActiveFolder(null);

        // Check for OAuth redirect
        window.handleOAuthRedirect();

        console.log('[ZIP Integration] ✅ Ready. Use FoldersUIZip, DashboardUIZip, LogsUIZip, ModerationUIZip');
    }

    // Run on DOM loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initZipIntegration);
    } else {
        initZipIntegration();
    }

})();
