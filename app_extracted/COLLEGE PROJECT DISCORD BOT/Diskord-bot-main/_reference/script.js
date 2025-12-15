/**
 * NEXUS CONSOLE LOGIC
 * Authentication & Data Management
 */

const API_BASE = 'http://localhost:5000/api'; 
const STATE = {
    user: null,
    folders: [],
    currentView: 'dashboard',
    pendingServer: null
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check on Load
    checkAuth();

    // 2. Check for OAuth Redirect params (Server Added)
    const urlParams = new URLSearchParams(window.location.search);
    const addedServerId = urlParams.get('added_server_id');
    const addedServerName = urlParams.get('added_server_name');

    if (addedServerId && addedServerName) {
        STATE.pendingServer = { id: addedServerId, name: addedServerName };
        // Redirect logic handled in login success if valid
        // Clean URL
        window.history.replaceState({}, document.title, "/");
        // Open folders tab to assign
        if(STATE.user) {
            switchTab('folders');
            showServerBanner();
        }
    }
});

function checkAuth() {
    const userStr = localStorage.getItem('nexus_user');
    if (!userStr) {
        showView('landing');
    } else {
        STATE.user = JSON.parse(userStr);
        updateUserProfile();
        showView('app-wrapper');
        // Initial Data Fetch
        fetchFolders(); 
    }
}

function loginWithDiscord() {
    // TODO: Replace with actual Discord OAuth2 Link
    // For demo, we simulate a login + redirect back
    const mockUser = {
        id: '999999',
        username: 'fxm1ne',
        avatar: 'https://placehold.co/60x60/FFD54A/000?text=F'
    };
    localStorage.setItem('nexus_user', JSON.stringify(mockUser));
    
    // Simulate page reload behavior
    location.reload(); 
}

function updateUserProfile() {
    if(STATE.user) {
        document.getElementById('display-username').textContent = STATE.user.username;
        document.getElementById('display-avatar').src = STATE.user.avatar;
    }
}

function showView(viewId) {
    document.getElementById('view-landing').classList.add('hidden');
    document.getElementById('app-wrapper').classList.add('hidden');
    
    document.getElementById(viewId).classList.remove('hidden');
}

function switchTab(tabName) {
    // Hide all sub-views
    document.getElementById('view-dashboard-content').classList.add('hidden');
    document.getElementById('view-server-content').classList.add('hidden');
    document.getElementById('view-folders-content').classList.add('hidden');
    document.getElementById('view-folder-details').classList.add('hidden');

    if (tabName === 'dashboard') {
        document.getElementById('view-dashboard-content').classList.remove('hidden');
    } else if (tabName === 'folders') {
        document.getElementById('view-folders-content').classList.remove('hidden');
        renderFolders();
    } else {
        // Placeholder for other tabs
        alert("Tab " + tabName + " is under construction or requires backend data.");
    }
}

// ===========================
// FOLDER LOGIC
// ===========================

async function fetchFolders() {
    try {
        const res = await fetch(`${API_BASE}/folders`);
        const data = await res.json();
        STATE.folders = data;
        renderFolders();
    } catch(e) {
        console.error("API Error", e);
    }
}

function renderFolders() {
    const container = document.getElementById('folders-grid');
    container.innerHTML = '';

    STATE.folders.forEach((folder, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const top = row * 384; 
        const left = col * 468;

        const div = document.createElement('div');
        div.className = 'folder-box';
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        div.onclick = () => onFolderClick(folder);

        div.innerHTML = `
             <div style="left: 58px; top: 41px; position: absolute; color: ${folder.color || '#D9FF42'}; font-size: 50px; font-weight: 400;">
                ${folder.name}
            </div>
        `;
        container.appendChild(div);
    });
}

async function createNewFolder() {
    const name = prompt("New Folder Name:");
    if (!name) return;
    
    await fetch(`${API_BASE}/folders`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: name, ownerId: STATE.user.id })
    });
    fetchFolders();
}

async function onFolderClick(folder) {
    // If we have a pending server (just added via OAuth), assign it
    if (STATE.pendingServer) {
        const confirmAssign = confirm(`Assign ${STATE.pendingServer.name} to ${folder.name}?`);
        if (confirmAssign) {
            await fetch(`${API_BASE}/folders/${folder.id}/servers`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ serverId: STATE.pendingServer.id })
            });
            alert("Server Assigned!");
            STATE.pendingServer = null;
            document.getElementById('new-server-banner').classList.add('hidden');
        }
        return;
    }

    // Otherwise, show folder contents
    showFolderContents(folder);
}

function showServerBanner() {
    if(STATE.pendingServer) {
        document.getElementById('new-server-banner').classList.remove('hidden');
        document.getElementById('pending-server-name').textContent = STATE.pendingServer.name;
    }
}

async function showFolderContents(folder) {
    document.getElementById('view-folders-content').classList.add('hidden');
    document.getElementById('view-folder-details').classList.remove('hidden');
    
    const container = document.getElementById('folder-servers-grid');
    container.innerHTML = 'Loading...';

    const res = await fetch(`${API_BASE}/folders/${folder.id}/servers`);
    const servers = await res.json();
    
    container.innerHTML = '';
    servers.forEach((server, index) => {
        // Grid logic same as folders
        const row = Math.floor(index / 3);
        const col = index % 3;
        const top = row * 150; // smaller grid for servers
        const left = col * 350;

        const div = document.createElement('div');
        div.style.position = 'absolute';
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        div.style.width = '300px';
        div.style.height = '100px';
        div.style.background = '#333';
        div.style.border = '1px solid #FFE989';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.color = 'white';
        div.style.fontSize = '20px';
        div.innerText = server.name;
        
        container.appendChild(div);
    });
}

function addServerOAuth() {
    // Simulate redirect to Discord OAuth
    // In real app: window.location.href = "https://discord.com/api/oauth2/..."
    // We simulate returning with a new server
    const newServerId = Math.floor(Math.random() * 100000);
    window.location.href = `?added_server_id=${newServerId}&added_server_name=NewServer${newServerId}`;
}

function copyServerId() {
    // Placeholder logic
    alert("Server ID copied to clipboard");
}
