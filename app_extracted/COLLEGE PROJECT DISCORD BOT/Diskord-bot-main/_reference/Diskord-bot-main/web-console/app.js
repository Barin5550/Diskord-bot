/**
 * Bot Admin Console - Main Application
 * Cleaned version - Intro Removed
 */

(function () {
    'use strict';

    // ===========================
    // CONFIG
    // ===========================
    const CONFIG = {
        VIEW_TRANSITION_DURATION: 300
    };

    // ===========================
    // STATE
    // ===========================
    const state = {
        currentView: 'dashboard',
    };

    // ===========================
    // DOM HELPERS
    // ===========================
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

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
    // INITIALIZATION
    // ===========================
    function init() {
        initElements();
        Transitions.init();
        initNavigation();
        initAuth();
        initModals();
        initSidebar();
        // Intro removed, showing landing page immediately
        $('#landing-page')?.classList.remove('hidden');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();