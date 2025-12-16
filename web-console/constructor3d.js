/**
 * 3D Constructor - Курс Молодого Инженера
 * Advanced 3D Editor with Three.js
 */

(function () {
    'use strict';

    // Three.js components
    let scene, camera, renderer, controls, transformControls;
    let selectedObject = null;
    let objects = [];
    let transformMode = 'translate'; // select, translate, rotate, scale (Maya-style: Q/W/E/R)
    let isInitialized = false;
    let animationId = null;
    let gridHelper = null;
    let axesHelper = null;

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Colors palette
    const COLORS = [
        '#FFE989', '#FF6B6B', '#4ECDC4', '#45B7D1',
        '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA'
    ];

    // Object counter for unique names
    let objectCounter = {
        cube: 0, sphere: 0, cylinder: 0, cone: 0, torus: 0, plane: 0,
        pyramid: 0, ring: 0, capsule: 0, icosahedron: 0, octahedron: 0, tetrahedron: 0,
        knot: 0, text: 0, group: 0
    };

    // Undo/Redo history
    let history = [];
    let historyIndex = -1;
    const maxHistory = 50;

    // Initialize the 3D scene
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        const container = document.getElementById('constructor-canvas');
        if (!container) return;

        // Clear container
        container.innerHTML = '';

        // Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 30, 100);

        // Camera
        camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        camera.position.set(8, 8, 8);
        camera.lookAt(0, 0, 0);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        container.appendChild(renderer.domElement);

        // Orbit Controls
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 2;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI * 0.9;

        // Transform Controls (стрелки для перемещения/вращения/масштаба)
        transformControls = new THREE.TransformControls(camera, renderer.domElement);
        transformControls.setSize(0.75);
        scene.add(transformControls);

        // Disable orbit controls when using transform controls
        transformControls.addEventListener('dragging-changed', (event) => {
            controls.enabled = !event.value;
            if (!event.value && selectedObject) {
                // Save state after transform
                saveState();
                updatePropertiesPanel();
            }
        });

        transformControls.addEventListener('change', () => {
            if (selectedObject) {
                updatePropertiesPanel();
            }
        });

        // Lights
        setupLighting();

        // Helpers
        setupHelpers();

        // Events
        renderer.domElement.addEventListener('click', onCanvasClick);
        renderer.domElement.addEventListener('dblclick', onCanvasDoubleClick);
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('keydown', onKeyDown);

        // ResizeObserver to handle container size changes (e.g. when Channel Box appears)
        const resizeObserver = new ResizeObserver(() => {
            onWindowResize();
        });
        resizeObserver.observe(container);

        // Start animation loop
        animate();

        // Setup UI
        setupUI();

        console.log('[3D] Курс Молодого Инженера initialized');
    }

    // Setup lighting
    function setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        scene.add(directionalLight);

        // Fill light
        const fillLight = new THREE.DirectionalLight(0x4ECDC4, 0.3);
        fillLight.position.set(-10, 5, -10);
        scene.add(fillLight);

        // Rim light
        const rimLight = new THREE.DirectionalLight(0xFF6B6B, 0.2);
        rimLight.position.set(0, -5, 10);
        scene.add(rimLight);

        // Hemisphere light for natural lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
        scene.add(hemiLight);
    }

    // Setup helpers
    function setupHelpers() {
        // Grid Helper - larger and more detailed
        gridHelper = new THREE.GridHelper(40, 40, 0x444466, 0x333344);
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        scene.add(gridHelper);

        // Axes Helper
        axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

        // Ground plane for shadows
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.01;
        ground.receiveShadow = true;
        ground.userData.isHelper = true;
        scene.add(ground);
    }

    // Animation loop
    function animate() {
        animationId = requestAnimationFrame(animate);
        controls.update();

        // Animate selected object emissive glow
        if (selectedObject && selectedObject.material) {
            const time = Date.now() * 0.003;
            selectedObject.material.emissiveIntensity = 0.2 + Math.sin(time) * 0.15;
        }

        renderer.render(scene, camera);
    }

    // Handle window resize
    function onWindowResize() {
        const container = document.getElementById('constructor-canvas');
        if (!container || !camera || !renderer) return;

        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Handle canvas click for selection
    function onCanvasClick(event) {
        const container = document.getElementById('constructor-canvas');
        const rect = container.getBoundingClientRect();

        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(objects, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            // Find root object if in group
            while (obj.parent && !objects.includes(obj)) {
                obj = obj.parent;
            }
            selectObject(obj);
        } else {
            deselectObject();
        }
    }

    // Handle double click for focus
    function onCanvasDoubleClick(event) {
        if (selectedObject) {
            focusOnObject(selectedObject);
        }
    }

    // Focus camera on object
    function focusOnObject(obj) {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const distance = maxDim * 3;

        controls.target.copy(center);
        camera.position.set(
            center.x + distance,
            center.y + distance * 0.5,
            center.z + distance
        );
        controls.update();
    }

    // Handle keyboard shortcuts
    function onKeyDown(event) {
        // Check if typing in an input
        if (event.target.tagName === 'INPUT') return;

        switch (event.key.toLowerCase()) {
            case 'delete':
            case 'backspace':
                if (selectedObject) {
                    event.preventDefault();
                    deleteSelected();
                }
                break;
            case 'g':
                transformMode = 'translate';
                updateModeUI();
                break;
            case 'r':
                transformMode = 'rotate';
                updateModeUI();
                break;
            case 's':
                if (!event.ctrlKey) {
                    transformMode = 'scale';
                    updateModeUI();
                }
                break;
            case 'd':
                if (event.ctrlKey && selectedObject) {
                    event.preventDefault();
                    duplicateSelected();
                }
                break;
            case 'z':
                if (event.ctrlKey) {
                    event.preventDefault();
                    undo();
                }
                break;
            case 'y':
                if (event.ctrlKey) {
                    event.preventDefault();
                    redo();
                }
                break;
            case 'a':
                if (event.ctrlKey) {
                    event.preventDefault();
                    selectAll();
                }
                break;
            case 'escape':
                deselectObject();
                break;
            case 'f':
                if (selectedObject) {
                    focusOnObject(selectedObject);
                }
                break;
            case 'h':
                showShortcuts();
                break;
            // Maya-style hotkeys
            case 'q':
                transformMode = 'select';
                updateModeUI();
                setStatusMessage('Инструмент: Выделение (Q)');
                break;
            case 'w':
                transformMode = 'translate';
                updateModeUI();
                setStatusMessage('Инструмент: Перемещение (W)');
                break;
            case 'e':
                transformMode = 'rotate';
                updateModeUI();
                setStatusMessage('Инструмент: Вращение (E)');
                break;
            case 'r':
                if (!event.ctrlKey) {
                    transformMode = 'scale';
                    updateModeUI();
                    setStatusMessage('Инструмент: Масштаб (R)');
                }
                break;
            case '4':
                toggleAllWireframe(true);
                document.getElementById('btn-wireframe')?.classList.add('active');
                document.getElementById('btn-shading')?.classList.remove('active');
                setStatusMessage('Режим: Каркас (4)');
                break;
            case '5':
                toggleAllWireframe(false);
                document.getElementById('btn-shading')?.classList.add('active');
                document.getElementById('btn-wireframe')?.classList.remove('active');
                setStatusMessage('Режим: Затенение (5)');
                break;
            case 'g':
                if (!event.ctrlKey) {
                    toggleGrid();
                }
                break;
            case 'home':
                resetCamera();
                setStatusMessage('Камера сброшена');
                break;
        }
    }

    // Select an object
    function selectObject(obj) {
        if (obj === selectedObject) return;
        deselectObject();
        selectedObject = obj;

        // Create selection highlight using emissive instead of outline mesh
        // This prevents the stretching issue
        if (obj.material) {
            // Store original color/emissive for restoration
            if (!obj.userData.originalEmissive) {
                obj.userData.originalEmissive = obj.material.emissive ? obj.material.emissive.clone() : new THREE.Color(0x000000);
                obj.userData.originalEmissiveIntensity = obj.material.emissiveIntensity || 0;
            }
            // Apply selection glow
            obj.material.emissive = new THREE.Color(0xFFE989);
            obj.material.emissiveIntensity = 0.3;
        }

        // Attach transform controls
        if (transformControls) {
            transformControls.attach(obj);
            transformControls.setMode(transformMode === 'rotate' ? 'rotate' :
                transformMode === 'scale' ? 'scale' : 'translate');
        }

        updatePropertiesPanel();
        updateObjectsList();
    }

    // Deselect current object
    function deselectObject() {
        if (selectedObject) {
            // Restore original emissive
            if (selectedObject.material && selectedObject.userData.originalEmissive) {
                selectedObject.material.emissive = selectedObject.userData.originalEmissive;
                selectedObject.material.emissiveIntensity = selectedObject.userData.originalEmissiveIntensity || 0;
            }
        }
        selectedObject = null;

        // Detach transform controls
        if (transformControls) {
            transformControls.detach();
        }

        updatePropertiesPanel();
        updateObjectsList();
    }

    // Select all objects
    function selectAll() {
        if (objects.length > 0) {
            selectObject(objects[objects.length - 1]);
        }
    }

    // Create material with settings
    function createMaterial(color, options = {}) {
        return new THREE.MeshStandardMaterial({
            color: color || getRandomColor(),
            metalness: options.metalness || 0.3,
            roughness: options.roughness || 0.7,
            flatShading: options.flatShading || false,
            wireframe: options.wireframe || false,
            transparent: options.transparent || false,
            opacity: options.opacity || 1,
            side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide
        });
    }

    // Add mesh to scene
    function addMeshToScene(geometry, type, yOffset = 0.5) {
        const material = createMaterial();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = yOffset;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = type;
        mesh.userData.name = `${type.charAt(0).toUpperCase() + type.slice(1)}_${++objectCounter[type]}`;

        scene.add(mesh);
        objects.push(mesh);
        selectObject(mesh);
        updateObjectsList();
        saveState();
        return mesh;
    }

    // === BASIC PRIMITIVES ===
    function addCube() {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        addMeshToScene(geometry, 'cube');
    }

    function addSphere() {
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        addMeshToScene(geometry, 'sphere');
    }

    function addCylinder() {
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
        addMeshToScene(geometry, 'cylinder');
    }

    function addCone() {
        const geometry = new THREE.ConeGeometry(0.5, 1, 32);
        addMeshToScene(geometry, 'cone');
    }

    function addTorus() {
        const geometry = new THREE.TorusGeometry(0.4, 0.15, 16, 64);
        addMeshToScene(geometry, 'torus');
    }

    function addPlane() {
        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = addMeshToScene(geometry, 'plane', 0.01);
        mesh.rotation.x = -Math.PI / 2;
        mesh.material.side = THREE.DoubleSide;
    }

    // === ADVANCED PRIMITIVES ===
    function addPyramid() {
        const geometry = new THREE.ConeGeometry(0.7, 1, 4);
        const mesh = addMeshToScene(geometry, 'pyramid');
        mesh.rotation.y = Math.PI / 4;
    }

    function addRing() {
        const geometry = new THREE.RingGeometry(0.3, 0.6, 32);
        const mesh = addMeshToScene(geometry, 'ring', 0.01);
        mesh.rotation.x = -Math.PI / 2;
        mesh.material.side = THREE.DoubleSide;
    }

    function addCapsule() {
        const geometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
        addMeshToScene(geometry, 'capsule');
    }

    function addIcosahedron() {
        const geometry = new THREE.IcosahedronGeometry(0.5, 0);
        addMeshToScene(geometry, 'icosahedron');
    }

    function addOctahedron() {
        const geometry = new THREE.OctahedronGeometry(0.5, 0);
        addMeshToScene(geometry, 'octahedron');
    }

    function addTetrahedron() {
        const geometry = new THREE.TetrahedronGeometry(0.5, 0);
        addMeshToScene(geometry, 'tetrahedron');
    }

    function addTorusKnot() {
        const geometry = new THREE.TorusKnotGeometry(0.4, 0.1, 64, 16);
        addMeshToScene(geometry, 'knot');
    }

    // === GROUP OPERATIONS ===
    function createGroup() {
        if (objects.length < 2) {
            showNotification('Нужно минимум 2 объекта для группы', 'warning');
            return;
        }

        const group = new THREE.Group();
        group.userData.type = 'group';
        group.userData.name = `Group_${++objectCounter.group}`;

        objects.forEach(obj => {
            scene.remove(obj);
            group.add(obj);
        });

        scene.add(group);
        objects = [group];
        selectObject(group);
        updateObjectsList();
        saveState();
    }

    // === OBJECT OPERATIONS ===
    function deleteSelected() {
        if (!selectedObject) return;

        scene.remove(selectedObject);
        objects = objects.filter(obj => obj !== selectedObject);
        selectedObject = null;
        updateObjectsList();
        updatePropertiesPanel();
        saveState();
    }

    function duplicateSelected() {
        if (!selectedObject) return;

        const clone = selectedObject.clone();
        clone.position.x += 1.5;
        clone.userData.name = `${selectedObject.userData.type}_${++objectCounter[selectedObject.userData.type]}`;
        clone.userData.outline = null;

        // Clone materials if needed
        if (clone.material) {
            clone.material = clone.material.clone();
        }

        scene.add(clone);
        objects.push(clone);
        selectObject(clone);
        updateObjectsList();
        saveState();
    }

    // === MATERIAL OPERATIONS ===
    function toggleWireframe() {
        if (!selectedObject || !selectedObject.material) return;
        selectedObject.material.wireframe = !selectedObject.material.wireframe;
        showNotification(selectedObject.material.wireframe ? 'Wireframe ВКЛ' : 'Wireframe ВЫКЛ', 'info');
    }

    function toggleFlatShading() {
        if (!selectedObject || !selectedObject.material) return;
        selectedObject.material.flatShading = !selectedObject.material.flatShading;
        selectedObject.material.needsUpdate = true;
        showNotification(selectedObject.material.flatShading ? 'Flat Shading ВКЛ' : 'Flat Shading ВЫКЛ', 'info');
    }

    function setOpacity(value) {
        if (!selectedObject || !selectedObject.material) return;
        const opacity = parseFloat(value);
        selectedObject.material.transparent = opacity < 1;
        selectedObject.material.opacity = opacity;
    }

    // === HISTORY ===
    function saveState() {
        const state = objects.map(obj => serializeObject(obj));

        // Remove future states if we're not at the end
        if (historyIndex < history.length - 1) {
            history = history.slice(0, historyIndex + 1);
        }

        history.push(state);
        if (history.length > maxHistory) {
            history.shift();
        }
        historyIndex = history.length - 1;
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            loadState(history[historyIndex]);
            showNotification('Отменено', 'info');
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            loadState(history[historyIndex]);
            showNotification('Повторено', 'info');
        }
    }

    function serializeObject(obj) {
        return {
            type: obj.userData.type,
            name: obj.userData.name,
            position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
            rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
            scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
            color: '#' + obj.material.color.getHexString(),
            metalness: obj.material.metalness,
            roughness: obj.material.roughness,
            wireframe: obj.material.wireframe || false,
            opacity: obj.material.opacity || 1
        };
    }

    function loadState(state) {
        clearSceneInternal();
        state.forEach(objData => createObjectFromData(objData));
        updateObjectsList();
    }

    // === UTILITY FUNCTIONS ===
    function getRandomColor() {
        return COLORS[Math.floor(Math.random() * COLORS.length)];
    }

    function showNotification(message, type = 'info') {
        // Use existing toast system if available
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`[3D] ${message}`);
        }
    }

    function toggleHelp() {
        const helpPanel = document.querySelector('.constructor-help');
        if (helpPanel) {
            helpPanel.classList.toggle('expanded');
        }
    }

    // Update properties panel
    function updatePropertiesPanel() {
        const panel = document.getElementById('constructor-properties');
        if (!panel) return;

        if (!selectedObject) {
            panel.innerHTML = `
                <div class="properties-empty">
                    <span>🖱️</span>
                    <p>Выберите объект</p>
                    <small>Кликните на объект<br>или добавьте новый</small>
                </div>
            `;
            return;
        }

        const pos = selectedObject.position;
        const rot = selectedObject.rotation;
        const scale = selectedObject.scale;
        const color = '#' + selectedObject.material.color.getHexString();
        const mat = selectedObject.material;

        panel.innerHTML = `
            <div class="property-group">
                <h4>📦 ${selectedObject.userData.name}</h4>
                <small class="text-muted">${selectedObject.userData.type}</small>
            </div>
            
            <div class="property-group">
                <label>📍 Позиция</label>
                <div class="property-row">
                    <span class="axis-x">X</span>
                    <input type="number" step="0.1" value="${pos.x.toFixed(2)}" 
                           onchange="Constructor3D.setPosition('x', this.value)">
                </div>
                <div class="property-row">
                    <span class="axis-y">Y</span>
                    <input type="number" step="0.1" value="${pos.y.toFixed(2)}" 
                           onchange="Constructor3D.setPosition('y', this.value)">
                </div>
                <div class="property-row">
                    <span class="axis-z">Z</span>
                    <input type="number" step="0.1" value="${pos.z.toFixed(2)}" 
                           onchange="Constructor3D.setPosition('z', this.value)">
                </div>
            </div>
            
            <div class="property-group">
                <label>🔄 Вращение (°)</label>
                <div class="property-row">
                    <span class="axis-x">X</span>
                    <input type="number" step="5" value="${(rot.x * 180 / Math.PI).toFixed(0)}" 
                           onchange="Constructor3D.setRotation('x', this.value)">
                </div>
                <div class="property-row">
                    <span class="axis-y">Y</span>
                    <input type="number" step="5" value="${(rot.y * 180 / Math.PI).toFixed(0)}" 
                           onchange="Constructor3D.setRotation('y', this.value)">
                </div>
                <div class="property-row">
                    <span class="axis-z">Z</span>
                    <input type="number" step="5" value="${(rot.z * 180 / Math.PI).toFixed(0)}" 
                           onchange="Constructor3D.setRotation('z', this.value)">
                </div>
            </div>
            
            <div class="property-group">
                <label>📏 Масштаб</label>
                <div class="property-row">
                    <span class="axis-x">X</span>
                    <input type="number" step="0.1" min="0.1" value="${scale.x.toFixed(2)}" 
                           onchange="Constructor3D.setScale('x', this.value)">
                </div>
                <div class="property-row">
                    <span class="axis-y">Y</span>
                    <input type="number" step="0.1" min="0.1" value="${scale.y.toFixed(2)}" 
                           onchange="Constructor3D.setScale('y', this.value)">
                </div>
                <div class="property-row">
                    <span class="axis-z">Z</span>
                    <input type="number" step="0.1" min="0.1" value="${scale.z.toFixed(2)}" 
                           onchange="Constructor3D.setScale('z', this.value)">
                </div>
            </div>
            
            <div class="property-group">
                <label>🎨 Цвет</label>
                <input type="color" value="${color}" 
                       onchange="Constructor3D.setColor(this.value)">
                <div class="color-presets">
                    ${COLORS.map(c => `
                        <div class="color-preset" style="background: ${c}" 
                             onclick="Constructor3D.setColor('${c}')"></div>
                    `).join('')}
                </div>
            </div>
            
            <div class="property-group">
                <label>✨ Материал</label>
                <div class="property-row">
                    <span>Металл</span>
                    <input type="range" min="0" max="1" step="0.1" 
                           value="${mat.metalness}"
                           onchange="Constructor3D.setMetalness(this.value)">
                </div>
                <div class="property-row">
                    <span>Шероховатость</span>
                    <input type="range" min="0" max="1" step="0.1" 
                           value="${mat.roughness}"
                           onchange="Constructor3D.setRoughness(this.value)">
                </div>
                <div class="property-row">
                    <span>Прозрачность</span>
                    <input type="range" min="0" max="1" step="0.1" 
                           value="${mat.opacity || 1}"
                           onchange="Constructor3D.setOpacity(this.value)">
                </div>
            </div>
            
            <div class="property-group">
                <label>🔧 Опции</label>
                <div class="property-buttons">
                    <button onclick="Constructor3D.toggleWireframe()" class="btn-small ${mat.wireframe ? 'active' : ''}">
                        Wireframe
                    </button>
                    <button onclick="Constructor3D.toggleFlatShading()" class="btn-small ${mat.flatShading ? 'active' : ''}">
                        Flat
                    </button>
                </div>
            </div>
            
            <div class="property-actions">
                <button onclick="Constructor3D.duplicateSelected()" class="btn-secondary">
                    📋 Дублировать
                </button>
                <button onclick="Constructor3D.deleteSelected()" class="btn-danger">
                    🗑️ Удалить
                </button>
            </div>
        `;
    }

    // Update objects list (Maya-style Outliner)
    function updateObjectsList() {
        const list = document.getElementById('constructor-objects-list');
        if (!list) return;

        if (objects.length === 0) {
            list.innerHTML = `
                <div class="maya-empty-message">
                    <p>Нет объектов</p>
                    <small>Создай → Полигоны</small>
                </div>
            `;
        } else {
            list.innerHTML = objects.map((obj, index) => `
                <div class="maya-tree-item ${obj === selectedObject ? 'selected' : ''}" 
                     onclick="Constructor3D.selectByIndex(${index})"
                     ondblclick="Constructor3D.focusByIndex(${index})">
                    <span class="tree-icon">${getIconForType(obj.userData.type)}</span>
                    <span>${obj.userData.name}</span>
                </div>
            `).join('');
        }

        // Update status bar
        updateStatusBar();
    }

    // Get icon for object type
    function getIconForType(type) {
        const icons = {
            'cube': '◼', 'sphere': '●', 'cylinder': '⬤', 'cone': '▲',
            'torus': '◎', 'plane': '▭', 'pyramid': '△', 'ring': '○',
            'capsule': '💊', 'icosahedron': '⬡', 'octahedron': '◇', 'tetrahedron': '▽',
            'knot': '∞', 'group': '📁', 'text': '📝'
        };
        return icons[type] || '📦';
    }

    // Update mode UI
    function updateModeUI() {
        // Update old mode buttons (if exist)
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === transformMode);
        });

        // Update Maya tool buttons
        document.getElementById('tool-select')?.classList.toggle('active', transformMode === 'select');
        document.getElementById('tool-move')?.classList.toggle('active', transformMode === 'translate');
        document.getElementById('tool-rotate')?.classList.toggle('active', transformMode === 'rotate');
        document.getElementById('tool-scale')?.classList.toggle('active', transformMode === 'scale');

        // Update TransformControls mode
        if (transformControls && selectedObject) {
            if (transformMode === 'translate') {
                transformControls.setMode('translate');
            } else if (transformMode === 'rotate') {
                transformControls.setMode('rotate');
            } else if (transformMode === 'scale') {
                transformControls.setMode('scale');
            }
        }

        // Update status bar
        const modeNames = {
            'select': 'Выделение',
            'translate': 'Перемещение',
            'rotate': 'Вращение',
            'scale': 'Масштаб'
        };
        const statusMode = document.getElementById('status-mode');
        if (statusMode) {
            statusMode.textContent = `Режим: ${modeNames[transformMode] || transformMode}`;
        }
    }

    // Update status bar
    function updateStatusBar() {
        const objectsCount = document.getElementById('status-objects');
        const selectionStatus = document.getElementById('status-selection');

        if (objectsCount) {
            objectsCount.textContent = `Объектов: ${objects.length}`;
        }
        if (selectionStatus) {
            selectionStatus.textContent = selectedObject
                ? `Выбрано: ${selectedObject.userData.name}`
                : 'Выбрано: —';
        }
    }

    // Set status message
    function setStatusMessage(message) {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
            // Reset after 3 seconds
            setTimeout(() => {
                statusMessage.textContent = 'Готов к работе';
            }, 3000);
        }
    }

    // Setup UI event listeners
    function setupUI() {
        // Basic primitives (toolbar buttons)
        document.getElementById('add-cube')?.addEventListener('click', addCube);
        document.getElementById('add-sphere')?.addEventListener('click', addSphere);
        document.getElementById('add-cylinder')?.addEventListener('click', addCylinder);
        document.getElementById('add-cone')?.addEventListener('click', addCone);
        document.getElementById('add-torus')?.addEventListener('click', addTorus);
        document.getElementById('add-plane')?.addEventListener('click', addPlane);

        // Advanced primitives (from menu)
        document.getElementById('add-pyramid')?.addEventListener('click', addPyramid);
        document.getElementById('add-ring')?.addEventListener('click', addRing);
        document.getElementById('add-capsule')?.addEventListener('click', addCapsule);
        document.getElementById('add-icosahedron')?.addEventListener('click', addIcosahedron);
        document.getElementById('add-octahedron')?.addEventListener('click', addOctahedron);
        document.getElementById('add-tetrahedron')?.addEventListener('click', addTetrahedron);
        document.getElementById('add-knot')?.addEventListener('click', addTorusKnot);

        // Old mode buttons (backup)
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                transformMode = btn.dataset.mode;
                updateModeUI();
            });
        });

        // Maya-style tool buttons
        document.getElementById('tool-select')?.addEventListener('click', () => {
            transformMode = 'select';
            updateModeUI();
            setStatusMessage('Инструмент: Выделение (Q)');
        });
        document.getElementById('tool-move')?.addEventListener('click', () => {
            transformMode = 'translate';
            updateModeUI();
            setStatusMessage('Инструмент: Перемещение (W)');
        });
        document.getElementById('tool-rotate')?.addEventListener('click', () => {
            transformMode = 'rotate';
            updateModeUI();
            setStatusMessage('Инструмент: Вращение (E)');
        });
        document.getElementById('tool-scale')?.addEventListener('click', () => {
            transformMode = 'scale';
            updateModeUI();
            setStatusMessage('Инструмент: Масштаб (R)');
        });

        // Wireframe / Shading toggle
        document.getElementById('btn-wireframe')?.addEventListener('click', () => {
            toggleAllWireframe(true);
            document.getElementById('btn-wireframe')?.classList.add('active');
            document.getElementById('btn-shading')?.classList.remove('active');
            setStatusMessage('Режим отображения: Каркас');
        });
        document.getElementById('btn-shading')?.addEventListener('click', () => {
            toggleAllWireframe(false);
            document.getElementById('btn-shading')?.classList.add('active');
            document.getElementById('btn-wireframe')?.classList.remove('active');
            setStatusMessage('Режим отображения: Затенение');
        });

        // Export/Import
        document.getElementById('export-scene')?.addEventListener('click', exportScene);
        document.getElementById('export-gltf')?.addEventListener('click', exportGLTF);
        document.getElementById('import-scene')?.addEventListener('click', () => {
            document.getElementById('import-file')?.click();
        });
        document.getElementById('import-file')?.addEventListener('change', importScene);

        // Clear scene
        document.getElementById('clear-scene')?.addEventListener('click', clearScene);

        // Undo/Redo
        document.getElementById('undo-btn')?.addEventListener('click', undo);
        document.getElementById('redo-btn')?.addEventListener('click', redo);

        // Publish to gallery
        document.getElementById('publish-gallery')?.addEventListener('click', publishToGallery);

        updateModeUI();
        updateStatusBar();
    }

    // Toggle wireframe for all objects
    function toggleAllWireframe(enabled) {
        objects.forEach(obj => {
            if (obj.material) {
                obj.material.wireframe = enabled;
            }
        });
    }

    // Property setters
    function setPosition(axis, value) {
        if (!selectedObject) return;
        selectedObject.position[axis] = parseFloat(value);
    }

    function setRotation(axis, value) {
        if (!selectedObject) return;
        selectedObject.rotation[axis] = parseFloat(value) * Math.PI / 180;
    }

    function setScale(axis, value) {
        if (!selectedObject) return;
        selectedObject.scale[axis] = Math.max(0.1, parseFloat(value));
    }

    function setColor(color) {
        if (!selectedObject) return;
        selectedObject.material.color.set(color);
        updatePropertiesPanel();
    }

    function setMetalness(value) {
        if (!selectedObject) return;
        selectedObject.material.metalness = parseFloat(value);
    }

    function setRoughness(value) {
        if (!selectedObject) return;
        selectedObject.material.roughness = parseFloat(value);
    }

    // Select object by index
    function selectByIndex(index) {
        if (objects[index]) {
            selectObject(objects[index]);
        }
    }

    // Focus on object by index
    function focusByIndex(index) {
        if (objects[index]) {
            focusOnObject(objects[index]);
        }
    }

    // Create object from data
    function createObjectFromData(objData) {
        let geometry;
        switch (objData.type) {
            case 'cube': geometry = new THREE.BoxGeometry(1, 1, 1); break;
            case 'sphere': geometry = new THREE.SphereGeometry(0.5, 32, 32); break;
            case 'cylinder': geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32); break;
            case 'cone': geometry = new THREE.ConeGeometry(0.5, 1, 32); break;
            case 'torus': geometry = new THREE.TorusGeometry(0.4, 0.15, 16, 64); break;
            case 'plane': geometry = new THREE.PlaneGeometry(2, 2); break;
            case 'pyramid': geometry = new THREE.ConeGeometry(0.7, 1, 4); break;
            case 'ring': geometry = new THREE.RingGeometry(0.3, 0.6, 32); break;
            case 'capsule': geometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16); break;
            case 'icosahedron': geometry = new THREE.IcosahedronGeometry(0.5, 0); break;
            case 'octahedron': geometry = new THREE.OctahedronGeometry(0.5, 0); break;
            case 'tetrahedron': geometry = new THREE.TetrahedronGeometry(0.5, 0); break;
            case 'knot': geometry = new THREE.TorusKnotGeometry(0.4, 0.1, 64, 16); break;
            default: return null;
        }

        const material = new THREE.MeshStandardMaterial({
            color: objData.color,
            metalness: objData.metalness || 0.3,
            roughness: objData.roughness || 0.7,
            wireframe: objData.wireframe || false,
            transparent: (objData.opacity || 1) < 1,
            opacity: objData.opacity || 1,
            side: objData.type === 'plane' || objData.type === 'ring' ? THREE.DoubleSide : THREE.FrontSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(objData.position.x, objData.position.y, objData.position.z);
        mesh.rotation.set(objData.rotation.x, objData.rotation.y, objData.rotation.z);
        mesh.scale.set(objData.scale.x, objData.scale.y, objData.scale.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.type = objData.type;
        mesh.userData.name = objData.name;

        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    // Export scene to JSON
    function exportScene() {
        const sceneData = objects.map(obj => serializeObject(obj));

        const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scene_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Сцена экспортирована!', 'success');
    }

    // Import scene from JSON
    function importScene(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const sceneData = JSON.parse(e.target.result);
                clearSceneInternal();

                sceneData.forEach(objData => createObjectFromData(objData));

                updateObjectsList();
                saveState();
                showNotification('Сцена загружена!', 'success');
            } catch (err) {
                console.error('Failed to import scene:', err);
                showNotification('Ошибка импорта сцены', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // Clear all objects from scene (internal)
    function clearSceneInternal() {
        objects.forEach(obj => scene.remove(obj));
        objects = [];
        selectedObject = null;
    }

    // Clear all objects from scene (public)
    function clearScene() {
        if (objects.length === 0) return;

        clearSceneInternal();
        updateObjectsList();
        updatePropertiesPanel();
        saveState();
        showNotification('Сцена очищена', 'info');
    }

    // Export scene as GLTF/GLB
    function exportGLTF() {
        if (objects.length === 0) {
            showNotification('Нет объектов для экспорта', 'warning');
            return;
        }

        // Create a group with all objects for export
        const exportGroup = new THREE.Group();
        objects.forEach(obj => {
            const clone = obj.clone();
            // Remove outline from clone
            clone.children = clone.children.filter(c => c !== obj.userData.outline);
            exportGroup.add(clone);
        });

        const exporter = new THREE.GLTFExporter();

        exporter.parse(exportGroup, function (result) {
            // GLB binary format
            const blob = new Blob([result], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${Date.now()}.glb`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('3D модель скачана (.glb)!', 'success');
        }, function (error) {
            console.error('GLTF Export error:', error);
            showNotification('Ошибка экспорта', 'error');
        }, { binary: true });
    }

    // Publish scene to gallery
    function publishToGallery() {
        if (objects.length === 0) {
            showNotification('Нет объектов для публикации', 'warning');
            return;
        }

        const title = prompt('Название модели:', `Модель_${Date.now()}`);
        if (!title) return;

        // Serialize scene data
        const sceneData = objects.map(obj => serializeObject(obj));

        // Publish to gallery
        if (window.Gallery3D) {
            window.Gallery3D.publishFromConstructor(sceneData, title);
            showNotification('Опубликовано в галерею!', 'success');

            // Switch to gallery view
            if (typeof window.showView === 'function') {
                setTimeout(() => window.showView('gallery3d'), 500);
            }
        } else {
            showNotification('Галерея недоступна', 'error');
        }
    }

    // Reset camera
    function resetCamera() {
        camera.position.set(8, 8, 8);
        controls.target.set(0, 0, 0);
        controls.update();
    }

    // Show tutorial view
    function showTutorial() {
        // Use the global showView function if available
        if (typeof window.showView === 'function') {
            window.showView('engineer-tutorial');
        } else {
            // Fallback: trigger click on nav item
            const tutorialNav = document.querySelector('[data-view="engineer-tutorial"]');
            if (tutorialNav) tutorialNav.click();
        }
    }

    // Show shortcuts modal
    function showShortcuts() {
        const modal = document.getElementById('shortcuts-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    // Toggle grid visibility
    function toggleGrid() {
        if (gridHelper) {
            gridHelper.visible = !gridHelper.visible;
            setStatusMessage(gridHelper.visible ? 'Сетка: ВКЛ' : 'Сетка: ВЫКЛ');
        }
    }

    // Toggle axes visibility
    function toggleAxes() {
        if (axesHelper) {
            axesHelper.visible = !axesHelper.visible;
            setStatusMessage(axesHelper.visible ? 'Оси: ВКЛ' : 'Оси: ВЫКЛ');
        }
    }

    // Focus on selected object
    function focusSelected() {
        if (selectedObject) {
            focusOnObject(selectedObject);
            setStatusMessage('Фокус на: ' + selectedObject.userData.name);
        }
    }

    // Toggle fullscreen mode
    let isFullscreen = false;
    function toggleFullscreen() {
        const section = document.getElementById('view-constructor');
        if (!section) return;

        isFullscreen = !isFullscreen;

        if (isFullscreen) {
            section.classList.add('constructor-fullscreen');
            document.body.style.overflow = 'hidden';
            setStatusMessage('Полноэкранный режим ВКЛ (нажми снова для выхода)');
        } else {
            section.classList.remove('constructor-fullscreen');
            document.body.style.overflow = '';
            setStatusMessage('Полноэкранный режим ВЫКЛ');
        }

        // Trigger resize after transition
        setTimeout(() => {
            onWindowResize();
        }, 100);
    }

    // Export scene as OBJ format
    function exportOBJ() {
        if (objects.length === 0) {
            showNotification('Нет объектов для экспорта', 'warning');
            return;
        }

        // Create export group
        const exportGroup = new THREE.Group();
        objects.forEach(obj => {
            const clone = obj.clone();
            clone.children = clone.children.filter(c => c !== obj.userData.outline);
            exportGroup.add(clone);
        });

        // Check if OBJExporter exists
        if (typeof THREE.OBJExporter === 'undefined') {
            // Simple OBJ export implementation
            let objContent = '# Exported from 3D Constructor\n';
            let vertexOffset = 1;

            exportGroup.traverse(mesh => {
                if (mesh.geometry) {
                    const positions = mesh.geometry.attributes.position;
                    const normals = mesh.geometry.attributes.normal;

                    objContent += `o ${mesh.userData.name || 'Object'}\n`;

                    // Apply world transform
                    mesh.updateMatrixWorld();
                    const matrix = mesh.matrixWorld;

                    // Vertices
                    for (let i = 0; i < positions.count; i++) {
                        const v = new THREE.Vector3(
                            positions.getX(i),
                            positions.getY(i),
                            positions.getZ(i)
                        ).applyMatrix4(matrix);
                        objContent += `v ${v.x.toFixed(6)} ${v.y.toFixed(6)} ${v.z.toFixed(6)}\n`;
                    }

                    // Normals
                    if (normals) {
                        for (let i = 0; i < normals.count; i++) {
                            const n = new THREE.Vector3(
                                normals.getX(i),
                                normals.getY(i),
                                normals.getZ(i)
                            );
                            objContent += `vn ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}\n`;
                        }
                    }

                    // Faces
                    const indices = mesh.geometry.index;
                    if (indices) {
                        for (let i = 0; i < indices.count; i += 3) {
                            const a = indices.getX(i) + vertexOffset;
                            const b = indices.getX(i + 1) + vertexOffset;
                            const c = indices.getX(i + 2) + vertexOffset;
                            objContent += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
                        }
                    } else {
                        for (let i = 0; i < positions.count; i += 3) {
                            const a = i + vertexOffset;
                            const b = i + 1 + vertexOffset;
                            const c = i + 2 + vertexOffset;
                            objContent += `f ${a}//${a} ${b}//${b} ${c}//${c}\n`;
                        }
                    }

                    vertexOffset += positions.count;
                }
            });

            const blob = new Blob([objContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${Date.now()}.obj`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('3D модель скачана (.obj)!', 'success');
        } else {
            const exporter = new THREE.OBJExporter();
            const result = exporter.parse(exportGroup);
            const blob = new Blob([result], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${Date.now()}.obj`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('3D модель скачана (.obj)!', 'success');
        }
    }

    // Export scene as STL format (for 3D printing)
    function exportSTL() {
        if (objects.length === 0) {
            showNotification('Нет объектов для экспорта', 'warning');
            return;
        }

        // Create export group
        const exportGroup = new THREE.Group();
        objects.forEach(obj => {
            const clone = obj.clone();
            clone.children = clone.children.filter(c => c !== obj.userData.outline);
            exportGroup.add(clone);
        });

        // Check if STLExporter exists
        if (typeof THREE.STLExporter === 'undefined') {
            // Simple ASCII STL export
            let stlContent = 'solid model\n';

            exportGroup.traverse(mesh => {
                if (mesh.geometry) {
                    mesh.updateMatrixWorld();
                    const matrix = mesh.matrixWorld;
                    const positions = mesh.geometry.attributes.position;
                    const indices = mesh.geometry.index;

                    const processTriangle = (i0, i1, i2) => {
                        const v0 = new THREE.Vector3(positions.getX(i0), positions.getY(i0), positions.getZ(i0)).applyMatrix4(matrix);
                        const v1 = new THREE.Vector3(positions.getX(i1), positions.getY(i1), positions.getZ(i1)).applyMatrix4(matrix);
                        const v2 = new THREE.Vector3(positions.getX(i2), positions.getY(i2), positions.getZ(i2)).applyMatrix4(matrix);

                        // Calculate normal
                        const edge1 = new THREE.Vector3().subVectors(v1, v0);
                        const edge2 = new THREE.Vector3().subVectors(v2, v0);
                        const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

                        stlContent += `  facet normal ${normal.x.toFixed(6)} ${normal.y.toFixed(6)} ${normal.z.toFixed(6)}\n`;
                        stlContent += '    outer loop\n';
                        stlContent += `      vertex ${v0.x.toFixed(6)} ${v0.y.toFixed(6)} ${v0.z.toFixed(6)}\n`;
                        stlContent += `      vertex ${v1.x.toFixed(6)} ${v1.y.toFixed(6)} ${v1.z.toFixed(6)}\n`;
                        stlContent += `      vertex ${v2.x.toFixed(6)} ${v2.y.toFixed(6)} ${v2.z.toFixed(6)}\n`;
                        stlContent += '    endloop\n';
                        stlContent += '  endfacet\n';
                    };

                    if (indices) {
                        for (let i = 0; i < indices.count; i += 3) {
                            processTriangle(indices.getX(i), indices.getX(i + 1), indices.getX(i + 2));
                        }
                    } else {
                        for (let i = 0; i < positions.count; i += 3) {
                            processTriangle(i, i + 1, i + 2);
                        }
                    }
                }
            });

            stlContent += 'endsolid model\n';

            const blob = new Blob([stlContent], { type: 'application/sla' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${Date.now()}.stl`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('3D модель скачана (.stl) для 3D печати!', 'success');
        } else {
            const exporter = new THREE.STLExporter();
            const result = exporter.parse(exportGroup);
            const blob = new Blob([result], { type: 'application/sla' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `model_${Date.now()}.stl`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification('3D модель скачана (.stl) для 3D печати!', 'success');
        }
    }

    // Public API
    window.Constructor3D = {
        init,
        // Basic
        addCube, addSphere, addCylinder, addCone, addTorus, addPlane,
        // Advanced
        addPyramid, addRing, addCapsule, addIcosahedron, addOctahedron, addTetrahedron, addTorusKnot,
        // Groups
        createGroup,
        // Operations
        deleteSelected, duplicateSelected, selectByIndex, focusByIndex, focusSelected,
        // Properties
        setPosition, setRotation, setScale, setColor, setMetalness, setRoughness, setOpacity,
        // Material
        toggleWireframe, toggleFlatShading,
        // Scene
        exportScene, exportGLTF, exportOBJ, exportSTL, clearScene, resetCamera, publishToGallery,
        // View
        toggleGrid, toggleAxes, toggleFullscreen,
        // History
        undo, redo,
        // Help
        showTutorial, showShortcuts
    };

})();
