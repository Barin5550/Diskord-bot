/**
 * 3D Gallery Module
 * Share and view 3D models
 */

(function () {
    'use strict';

    const STORAGE_KEY = 'gallery3d_models';
    const CHAT_KEY = 'gallery3d_chat';

    let models = [];
    let chatMessages = [];
    let currentModel = null;
    let previewScene = null;
    let previewCamera = null;
    let previewRenderer = null;
    let previewControls = null;
    let previewAnimationId = null;
    let isInitialized = false;

    // Initialize gallery
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        loadModels();
        loadChat();
        setupEventListeners();
        renderGallery();
        renderChat();

        console.log('[Gallery3D] Initialized');
    }

    // Setup event listeners
    function setupEventListeners() {
        // Gallery tabs
        document.querySelectorAll('.gallery-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.gallery-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderGallery(tab.dataset.filter);
            });
        });

        // Chat input enter
        const chatInput = document.getElementById('gallery-chat-message');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMessage();
            });
        }

        // File upload zone
        const uploadZone = document.getElementById('file-upload-zone');
        const uploadFile = document.getElementById('upload-file');

        if (uploadZone && uploadFile) {
            uploadZone.addEventListener('click', () => uploadFile.click());
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('dragover');
            });
            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('dragover');
            });
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('dragover');
                if (e.dataTransfer.files.length) {
                    uploadFile.files = e.dataTransfer.files;
                    updateFilename();
                }
            });
            uploadFile.addEventListener('change', updateFilename);
        }
    }

    function updateFilename() {
        const uploadFile = document.getElementById('upload-file');
        const filenameDisplay = document.getElementById('upload-filename');
        if (uploadFile.files.length && filenameDisplay) {
            filenameDisplay.textContent = `📄 ${uploadFile.files[0].name}`;
        }
    }

    // Load models from localStorage
    function loadModels() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                models = JSON.parse(saved);
            } else {
                // Demo models
                models = [
                    {
                        id: 1,
                        title: 'Кубик',
                        description: 'Простой тестовый кубик',
                        author: 'System',
                        date: new Date().toISOString(),
                        views: 42,
                        likes: 5,
                        comments: [],
                        data: JSON.stringify([{
                            type: 'cube',
                            name: 'Cube_1',
                            position: { x: 0, y: 0.5, z: 0 },
                            rotation: { x: 0, y: 0.5, z: 0 },
                            scale: { x: 1, y: 1, z: 1 },
                            color: '#FFE989',
                            metalness: 0.5,
                            roughness: 0.5
                        }])
                    },
                    {
                        id: 2,
                        title: 'Снеговик',
                        description: 'Праздничный снеговик',
                        author: 'Demo',
                        date: new Date().toISOString(),
                        views: 128,
                        likes: 23,
                        comments: [{ author: 'User1', text: 'Классный!', date: new Date().toISOString() }],
                        data: JSON.stringify([
                            { type: 'sphere', name: 'Body_1', position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#ffffff', metalness: 0.1, roughness: 0.9 },
                            { type: 'sphere', name: 'Body_2', position: { x: 0, y: 1.4, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.7, y: 0.7, z: 0.7 }, color: '#ffffff', metalness: 0.1, roughness: 0.9 },
                            { type: 'sphere', name: 'Head', position: { x: 0, y: 2.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.5, y: 0.5, z: 0.5 }, color: '#ffffff', metalness: 0.1, roughness: 0.9 },
                            { type: 'cone', name: 'Nose', position: { x: 0, y: 2.1, z: 0.3 }, rotation: { x: 1.57, y: 0, z: 0 }, scale: { x: 0.2, y: 0.4, z: 0.2 }, color: '#FF6B6B', metalness: 0.3, roughness: 0.7 }
                        ])
                    }
                ];
                saveModels();
            }
        } catch (e) {
            console.error('Failed to load models:', e);
            models = [];
        }
    }

    // Save models to localStorage
    function saveModels() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
        } catch (e) {
            console.error('Failed to save models:', e);
        }
    }

    // Load chat from localStorage
    function loadChat() {
        try {
            const saved = localStorage.getItem(CHAT_KEY);
            if (saved) {
                chatMessages = JSON.parse(saved);
            } else {
                chatMessages = [
                    { type: 'system', text: 'Добро пожаловать в 3D галерею!' }
                ];
            }
        } catch (e) {
            chatMessages = [];
        }
    }

    // Save chat to localStorage
    function saveChat() {
        try {
            localStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages.slice(-100))); // Keep last 100
        } catch (e) {
            console.error('Failed to save chat:', e);
        }
    }

    // Render gallery grid
    function renderGallery(filter = 'all') {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;

        let filteredModels = [...models];

        switch (filter) {
            case 'popular':
                filteredModels.sort((a, b) => b.likes - a.likes);
                break;
            case 'new':
                filteredModels.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'my':
                filteredModels = filteredModels.filter(m => m.author === 'Вы');
                break;
        }

        if (filteredModels.length === 0) {
            grid.innerHTML = `
                <div class="gallery-empty">
                    <span>🖼️</span>
                    <p>Нет моделей</p>
                    <button class="btn btn-primary" onclick="Gallery3D.openUploadModal()">Загрузить первую</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredModels.map(model => `
            <div class="gallery-item" onclick="Gallery3D.openPreview(${model.id})">
                <div class="gallery-item-preview" id="preview-${model.id}">
                    <div class="gallery-item-placeholder">📦</div>
                </div>
                <div class="gallery-item-info">
                    <h4>${escapeHtml(model.title)}</h4>
                    <p class="gallery-item-author">👤 ${escapeHtml(model.author)}</p>
                    <div class="gallery-item-stats">
                        <span>👁️ ${model.views}</span>
                        <span>❤️ ${model.likes}</span>
                        <span>💬 ${model.comments.length}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Create mini previews
        filteredModels.forEach(model => {
            setTimeout(() => createMiniPreview(model), 100);
        });
    }

    // Create mini 3D preview
    function createMiniPreview(model) {
        const container = document.getElementById(`preview-${model.id}`);
        if (!container || container.querySelector('canvas')) return;

        try {
            const data = JSON.parse(model.data);
            if (!data.length) return;

            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x1a1a2e);

            const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
            camera.position.set(3, 3, 3);
            camera.lookAt(0, 0.5, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(200, 150);

            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            // Lighting
            scene.add(new THREE.AmbientLight(0xffffff, 0.6));
            const light = new THREE.DirectionalLight(0xffffff, 0.8);
            light.position.set(5, 10, 5);
            scene.add(light);

            // Add objects
            data.forEach(objData => createObjectFromData(scene, objData));

            // Render once
            renderer.render(scene, camera);
        } catch (e) {
            console.error('Failed to create preview:', e);
        }
    }

    // Create object from data
    function createObjectFromData(scene, objData) {
        let geometry;
        switch (objData.type) {
            case 'cube': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 16, 16); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 16); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 16); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.4, 0.15, 8, 32); break;
            case 'plane': geometry = new THREE.PlaneGeometry(2, 2); break;
            case 'pyramid': geometry = new THREE.ConeGeometry(0.7, 1, 4); break;
            default: return null;
        }

        const material = new THREE.MeshStandardMaterial({
            color: objData.color || '#FFE989',
            metalness: objData.metalness || 0.3,
            roughness: objData.roughness || 0.7
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
        mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
        mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);

        scene.add(mesh);
        return mesh;
    }

    // Render chat
    function renderChat() {
        const chat = document.getElementById('gallery-chat');
        if (!chat) return;

        chat.innerHTML = chatMessages.map(msg => {
            if (msg.type === 'system') {
                return `<div class="chat-message system"><span>${escapeHtml(msg.text)}</span></div>`;
            }
            if (msg.type === 'model') {
                return `
                    <div class="chat-message model">
                        <span class="chat-author">${escapeHtml(msg.author)}</span>
                        <div class="chat-model-preview" onclick="Gallery3D.openPreview(${msg.modelId})">
                            <span>📦</span>
                            <span>${escapeHtml(msg.modelTitle)}</span>
                        </div>
                        <span class="chat-time">${formatTime(msg.date)}</span>
                    </div>
                `;
            }
            return `
                <div class="chat-message">
                    <span class="chat-author">${escapeHtml(msg.author)}</span>
                    <span class="chat-text">${escapeHtml(msg.text)}</span>
                    <span class="chat-time">${formatTime(msg.date)}</span>
                </div>
            `;
        }).join('');

        chat.scrollTop = chat.scrollHeight;
    }

    // Send chat message
    function sendMessage() {
        const input = document.getElementById('gallery-chat-message');
        if (!input || !input.value.trim()) return;

        chatMessages.push({
            type: 'text',
            author: 'Вы',
            text: input.value.trim(),
            date: new Date().toISOString()
        });

        input.value = '';
        saveChat();
        renderChat();
    }

    // Share model to chat
    function shareModelToChat(model) {
        chatMessages.push({
            type: 'model',
            author: 'Вы',
            modelId: model.id,
            modelTitle: model.title,
            date: new Date().toISOString()
        });
        saveChat();
        renderChat();
    }

    // Open model preview
    function openPreview(modelId) {
        const model = models.find(m => m.id === modelId);
        if (!model) return;

        currentModel = model;
        model.views++;
        saveModels();

        // Update info
        document.getElementById('model-preview-title').textContent = model.title;
        document.getElementById('model-preview-author').innerHTML = `Автор: <span>${escapeHtml(model.author)}</span>`;
        document.getElementById('model-preview-date').innerHTML = `Опубликовано: <span>${formatDate(model.date)}</span>`;
        document.getElementById('model-views').textContent = model.views;
        document.getElementById('model-likes').textContent = model.likes;
        document.getElementById('model-comments').textContent = model.comments.length;

        // Render comments
        renderComments();

        // Show modal
        document.getElementById('model-preview-modal').classList.remove('hidden');

        // Create 3D preview
        setTimeout(() => createFullPreview(model), 100);
    }

    // Create full 3D preview
    function createFullPreview(model) {
        const container = document.getElementById('model-preview-canvas');
        if (!container) return;

        // Cleanup previous
        if (previewAnimationId) {
            cancelAnimationFrame(previewAnimationId);
        }
        container.innerHTML = '';

        try {
            let data = model.data;

            // Parse if string
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            // Ensure data is array
            if (!Array.isArray(data)) {
                throw new Error('Неверный формат данных модели');
            }

            if (data.length === 0) {
                container.innerHTML = '<div class="preview-error">Модель пустая</div>';
                return;
            }

            previewScene = new THREE.Scene();
            previewScene.background = new THREE.Color(0x1a1a2e);

            previewCamera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
            previewCamera.position.set(4, 4, 4);
            previewCamera.lookAt(0, 0.5, 0);

            previewRenderer = new THREE.WebGLRenderer({ antialias: true });
            previewRenderer.setSize(container.clientWidth, container.clientHeight);
            previewRenderer.shadowMap.enabled = true;
            container.appendChild(previewRenderer.domElement);

            previewControls = new THREE.OrbitControls(previewCamera, previewRenderer.domElement);
            previewControls.enableDamping = true;

            // Lighting
            previewScene.add(new THREE.AmbientLight(0xffffff, 0.5));
            const light = new THREE.DirectionalLight(0xffffff, 0.8);
            light.position.set(10, 20, 10);
            light.castShadow = true;
            previewScene.add(light);

            // Grid
            previewScene.add(new THREE.GridHelper(10, 10, 0x444444, 0x333333));

            // Add objects
            let objectsCreated = 0;
            data.forEach(objData => {
                if (objData && objData.type) {
                    const mesh = createObjectFromData(previewScene, objData);
                    if (mesh) {
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        objectsCreated++;
                    }
                }
            });

            if (objectsCreated === 0) {
                container.innerHTML = '<div class="preview-error">Не удалось создать объекты</div>';
                return;
            }

            // Animation loop
            function animate() {
                previewAnimationId = requestAnimationFrame(animate);
                previewControls.update();
                previewRenderer.render(previewScene, previewCamera);
            }
            animate();

        } catch (e) {
            console.error('Failed to create full preview:', e);
            container.innerHTML = `<div class="preview-error">Ошибка: ${e.message || 'Не удалось загрузить модель'}</div>`;
        }
    }

    // Render comments
    function renderComments() {
        const list = document.getElementById('model-comments-list');
        if (!list || !currentModel) return;

        if (currentModel.comments.length === 0) {
            list.innerHTML = '<p class="no-comments">Пока нет комментариев</p>';
            return;
        }

        list.innerHTML = currentModel.comments.map(c => `
            <div class="comment-item">
                <span class="comment-author">${escapeHtml(c.author)}</span>
                <span class="comment-text">${escapeHtml(c.text)}</span>
                <span class="comment-date">${formatTime(c.date)}</span>
            </div>
        `).join('');
    }

    // Add comment
    function addComment() {
        const input = document.getElementById('model-comment-text');
        if (!input || !input.value.trim() || !currentModel) return;

        currentModel.comments.push({
            author: 'Вы',
            text: input.value.trim(),
            date: new Date().toISOString()
        });

        input.value = '';
        saveModels();
        renderComments();
        document.getElementById('model-comments').textContent = currentModel.comments.length;
    }

    // Like model
    function likeModel() {
        if (!currentModel) return;
        currentModel.likes++;
        document.getElementById('model-likes').textContent = currentModel.likes;
        saveModels();
    }

    // Download model
    function downloadModel() {
        if (!currentModel) return;

        const blob = new Blob([currentModel.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentModel.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Close preview
    function closePreview() {
        if (previewAnimationId) {
            cancelAnimationFrame(previewAnimationId);
            previewAnimationId = null;
        }
        document.getElementById('model-preview-modal').classList.add('hidden');
        currentModel = null;
    }

    // Open upload modal
    function openUploadModal() {
        document.getElementById('upload-modal').classList.remove('hidden');
    }

    // Close upload modal
    function closeUploadModal() {
        document.getElementById('upload-modal').classList.add('hidden');
        document.getElementById('upload-title').value = '';
        document.getElementById('upload-description').value = '';
        document.getElementById('upload-file').value = '';
        document.getElementById('upload-filename').textContent = '';
    }

    // Upload model
    function uploadModel() {
        const title = document.getElementById('upload-title').value.trim();
        const description = document.getElementById('upload-description').value.trim();
        const file = document.getElementById('upload-file').files[0];

        if (!title) {
            alert('Введите название модели');
            return;
        }

        if (!file) {
            alert('Выберите файл модели');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let data = e.target.result;

                // Validate JSON
                if (file.name.endsWith('.json')) {
                    JSON.parse(data);
                }

                const newModel = {
                    id: Date.now(),
                    title,
                    description,
                    author: 'Вы',
                    date: new Date().toISOString(),
                    views: 0,
                    likes: 0,
                    comments: [],
                    data: data
                };

                models.unshift(newModel);
                saveModels();
                renderGallery();
                closeUploadModal();

                // Share to chat
                shareModelToChat(newModel);

            } catch (err) {
                alert('Ошибка чтения файла: ' + err.message);
            }
        };
        reader.readAsText(file);
    }

    // Publish from constructor
    function publishFromConstructor(sceneData, title) {
        const newModel = {
            id: Date.now(),
            title: title || `Модель_${Date.now()}`,
            description: 'Создано в 3D Конструкторе',
            author: 'Вы',
            date: new Date().toISOString(),
            views: 0,
            likes: 0,
            comments: [],
            data: JSON.stringify(sceneData)
        };

        models.unshift(newModel);
        saveModels();
        renderGallery();
        shareModelToChat(newModel);

        return newModel;
    }

    // Helpers
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('ru-RU');
    }

    function formatTime(dateStr) {
        return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }

    // Cleanup function - call when switching views
    function cleanup() {
        // Stop animation
        if (previewAnimationId) {
            cancelAnimationFrame(previewAnimationId);
            previewAnimationId = null;
        }

        // Close preview modal if open
        const modal = document.getElementById('model-preview-modal');
        if (modal) {
            modal.classList.add('hidden');
        }

        // Dispose preview renderer
        if (previewRenderer) {
            previewRenderer.dispose();
            previewRenderer = null;
        }

        // Clear preview canvas
        const previewCanvas = document.getElementById('model-preview-canvas');
        if (previewCanvas) {
            previewCanvas.innerHTML = '';
        }

        // Clear mini preview canvases
        const miniPreviews = document.querySelectorAll('.gallery-item-preview canvas');
        miniPreviews.forEach(canvas => {
            canvas.remove();
        });

        currentModel = null;
        isInitialized = false;
    }

    // Public API
    window.Gallery3D = {
        init,
        cleanup,
        openPreview,
        closePreview,
        likeModel,
        downloadModel,
        addComment,
        sendMessage,
        openUploadModal,
        closeUploadModal,
        uploadModel,
        publishFromConstructor
    };

})();
