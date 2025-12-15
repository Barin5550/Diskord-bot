/**
 * Analytics Module
 * Charts and statistics for the bot console
 */

(function () {
    'use strict';

    const BOT_API = 'http://localhost:5000/api';

    let messagesChart = null;
    let hourlyChart = null;
    let isInitialized = false;

    // Initialize analytics when view becomes visible
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        loadAllData();
    }

    // Load all analytics data
    async function loadAllData() {
        await Promise.all([
            loadMessagesChart(),
            loadHourlyChart(),
            loadTopUsers(),
            loadServerStats()
        ]);
    }

    // Load messages activity chart (30 days)
    async function loadMessagesChart() {
        const canvas = document.getElementById('messages-chart');
        if (!canvas) return;

        try {
            const res = await fetch(`${BOT_API}/analytics/messages`);
            const data = await res.json();

            if (data.length === 0) {
                showNoData(canvas.parentElement);
                return;
            }

            const labels = data.map(d => formatDate(d.date));
            const values = data.map(d => d.count);

            if (messagesChart) {
                messagesChart.destroy();
            }

            messagesChart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Сообщения',
                        data: values,
                        borderColor: '#FFE989',
                        backgroundColor: 'rgba(255, 233, 137, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#FFE989'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: '#888'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: '#888'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load messages chart:', error);
            showNoData(canvas.parentElement, 'Ошибка загрузки');
        }
    }

    // Load hourly activity chart
    async function loadHourlyChart() {
        const canvas = document.getElementById('hourly-chart');
        if (!canvas) return;

        try {
            const res = await fetch(`${BOT_API}/analytics/activity`);
            const data = await res.json();

            const labels = data.map(d => `${d.hour}:00`);
            const values = data.map(d => d.count);

            if (hourlyChart) {
                hourlyChart.destroy();
            }

            hourlyChart = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'Активность',
                        data: values,
                        backgroundColor: 'rgba(255, 233, 137, 0.6)',
                        borderColor: '#FFE989',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#888',
                                maxRotation: 0
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)'
                            },
                            ticks: {
                                color: '#888'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load hourly chart:', error);
            showNoData(canvas.parentElement, 'Ошибка загрузки');
        }
    }

    // Load top users
    async function loadTopUsers() {
        const container = document.getElementById('top-users-list');
        if (!container) return;

        try {
            const res = await fetch(`${BOT_API}/analytics/users?limit=10`);
            const users = await res.json();

            if (users.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <div class="no-data-icon">👥</div>
                        <p>Нет данных о пользователях</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = users.map((user, index) => {
                const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
                return `
                    <div class="user-item">
                        <div class="user-rank ${rankClass}">${index + 1}</div>
                        <div class="user-info">
                            <div class="user-name">${escapeHtml(user.username)}</div>
                            <div class="user-id">${user.user_id}</div>
                        </div>
                        <div class="user-messages">${user.message_count} 💬</div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Failed to load top users:', error);
            container.innerHTML = '<div class="no-data">Ошибка загрузки</div>';
        }
    }

    // Load server statistics
    async function loadServerStats() {
        const container = document.getElementById('server-stats');
        if (!container) return;

        try {
            const res = await fetch(`${BOT_API}/analytics/servers`);
            const servers = await res.json();

            if (servers.length === 0) {
                container.innerHTML = `
                    <div class="no-data">
                        <div class="no-data-icon">🖥️</div>
                        <p>Бот не подключен к серверам</p>
                        <span class="text-muted">Добавьте Discord токен в .env</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = servers.map(server => `
                <div class="server-stat-item">
                    <div class="server-icon">
                        ${server.icon
                    ? `<img src="${server.icon}" alt="${escapeHtml(server.name)}">`
                    : server.name.charAt(0).toUpperCase()
                }
                    </div>
                    <div class="server-info">
                        <div class="server-name">${escapeHtml(server.name)}</div>
                        <div class="server-meta">
                            <span>👥 ${server.member_count || 0}</span>
                            <span>💬 ${server.channel_count || 0} каналов</span>
                            <span>🏷️ ${server.role_count || 0} ролей</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load server stats:', error);
            container.innerHTML = '<div class="no-data">Ошибка загрузки</div>';
        }
    }

    // Helper: format date
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }

    // Helper: escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper: show no data message
    function showNoData(container, message = 'Нет данных') {
        container.innerHTML = `
            <div class="no-data">
                <div class="no-data-icon">📊</div>
                <p>${message}</p>
            </div>
        `;
    }

    // Public API
    window.Analytics = {
        init,
        refresh: loadAllData
    };

})();
