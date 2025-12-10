/**
 * ============================================
 * GRAPHPANELVIEW.JS - Vista del Panel Gráfico
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que maneja la visualización y renderizado
 * del panel gráfico usando Three.js.
 * Incluye la curva del ciclógono, línea del piso,
 * animaciones, zoom/pan y controles visuales.
 * 
 * FASE 5: Vista dedicada del panel gráfico
 */

import * as THREE from 'three';
import { CONFIG, MATH } from '../config/constants.js';
import Polygon from '../models/Polygon.js';
import Circle from '../models/Circle.js';

/**
 * Estados posibles del panel gráfico
 */
export const GraphPanelState = {
    IDLE: 'idle',
    PANNING: 'panning',
    ZOOMING: 'zooming',
    ANIMATING: 'animating'
};

/**
 * Vista del panel gráfico
 */
export class GraphPanelView {
    /**
     * Crea la vista del panel gráfico
     * @param {HTMLCanvasElement} canvas - Canvas donde renderizar
     */
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas requerido para GraphPanelView');
        }

        this._canvas = canvas;
        this._container = canvas.parentElement;

        // Escena Three.js
        this._scene = null;
        this._camera = null;
        this._renderer = null;

        // Objetos 3D
        this._cyclogonLine = null;
        this._floorLine = null;
        this._gridHelper = null;
        this._animatedShapeMesh = null;  // Polígono/Círculo animado
        this._animatedPointMesh = null;  // Punto de dibujo animado
        this._animatedRadiusLine = null; // Línea del radio animada

        // Estado de la vista
        this._state = GraphPanelState.IDLE;
        this._needsUpdate = true;
        this._lastTime = performance.now();

        // Datos de la curva actual
        this._currentCyclogon = null;
        this._curvePoints = [];

        // Estado de animación
        this._animation = {
            enabled: false,
            progress: 0,        // 0 a 1
            speed: 0.3,         // Progreso por segundo
            paused: false,
            direction: 1        // 1: adelante, -1: atrás
        };

        // Estado de pan/zoom
        this._panOffset = { x: 0, y: 0 };
        this._zoomLevel = 1;
        this._isPanning = false;
        this._lastPanPosition = { x: 0, y: 0 };

        // Límites de la cámara
        this._viewBounds = {
            minX: -10, maxX: 10,
            minY: -5, maxY: 5
        };

        // Configuración visual
        this._config = {
            showGrid: true,
            showFloor: true,
            lineGlow: true,
            animateDrawing: false
        };

        // Bind de métodos
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._onResize = this._onResize.bind(this);

        // ResizeObserver para detectar cambios de tamaño del contenedor
        this._resizeObserver = null;
        this._resizeTimeout = null;

        // Inicializar
        this._init();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /** @returns {THREE.Scene} Escena de Three.js */
    get scene() {
        return this._scene;
    }

    /** @returns {THREE.OrthographicCamera} Cámara */
    get camera() {
        return this._camera;
    }

    /** @returns {THREE.WebGLRenderer} Renderer */
    get renderer() {
        return this._renderer;
    }

    /** @returns {HTMLCanvasElement} Canvas */
    get canvas() {
        return this._canvas;
    }

    /** @returns {string} Estado actual */
    get state() {
        return this._state;
    }

    /** @returns {number} Nivel de zoom actual */
    get zoomLevel() {
        return this._zoomLevel;
    }

    /** @returns {Object} Modelo de ciclógono actual */
    get currentCyclogon() {
        return this._currentCyclogon;
    }

    /** @returns {Object} Estado de la animación */
    get animationState() {
        return { ...this._animation };
    }

    // ==========================================
    // MÉTODOS DE INICIALIZACIÓN
    // ==========================================

    /**
     * Inicializa la vista
     * @private
     */
    _init() {
        this._initScene();
        this._initCamera();
        this._initRenderer();
        this._initFloorLine();
        this._initGrid();
        this._initCyclogonLine();
        this._initEventListeners();
        this._initResizeObserver();
    }

    /**
     * Inicializa el ResizeObserver para detectar cambios de tamaño del contenedor
     * @private
     */
    _initResizeObserver() {
        if (typeof ResizeObserver !== 'undefined') {
            this._resizeObserver = new ResizeObserver((entries) => {
                // Usar debounce para evitar múltiples llamadas
                if (this._resizeTimeout) {
                    clearTimeout(this._resizeTimeout);
                }
                this._resizeTimeout = setTimeout(() => {
                    this._onResize();
                }, 50);
            });
            this._resizeObserver.observe(this._container);
        }
    }

    /**
     * Callback interno para resize desde ResizeObserver
     * @private
     */
    _onResize() {
        const width = this._container.clientWidth;
        const height = this._container.clientHeight;

        // Evitar procesamiento si el tamaño es inválido
        if (width === 0 || height === 0) return;

        this._renderer.setSize(width, height);

        // Recalcular aspect ratio y actualizar cámara
        const aspect = width / height;
        const currentHeight = this._camera.top - this._camera.bottom;
        const newWidth = currentHeight * aspect;
        const centerX = (this._camera.right + this._camera.left) / 2;

        this._camera.left = centerX - newWidth / 2;
        this._camera.right = centerX + newWidth / 2;
        this._camera.updateProjectionMatrix();

        // Si hay una curva, reajustar la vista
        if (this._curvePoints.length > 0) {
            this.fitView();
        }

        this._needsUpdate = true;
    }

    /**
     * Inicializa la escena
     * @private
     */
    _initScene() {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND_GRAPH);
    }

    /**
     * Inicializa la cámara ortográfica
     * @private
     */
    _initCamera() {
        const aspect = this._container.clientWidth / this._container.clientHeight;
        const frustumSize = CONFIG.CAMERA.GRAPH_PANEL.FRUSTUM_SIZE;

        this._camera = new THREE.OrthographicCamera(
            -frustumSize * aspect,      // left
            frustumSize * aspect,       // right
            frustumSize / 2,            // top
            -frustumSize / 2,           // bottom
            CONFIG.CAMERA.GRAPH_PANEL.NEAR,
            CONFIG.CAMERA.GRAPH_PANEL.FAR
        );
        this._camera.position.z = CONFIG.CAMERA.GRAPH_PANEL.POSITION_Z;
    }

    /**
     * Inicializa el renderer
     * @private
     */
    _initRenderer() {
        this._renderer = new THREE.WebGLRenderer({
            canvas: this._canvas,
            antialias: CONFIG.THREEJS.ANTIALIAS,
            alpha: CONFIG.THREEJS.ALPHA
        });
        this._renderer.setPixelRatio(CONFIG.THREEJS.PIXEL_RATIO);
        this._renderer.setSize(this._container.clientWidth, this._container.clientHeight);
    }

    /**
     * Inicializa la línea del piso
     * @private
     */
    _initFloorLine() {
        const points = [
            new THREE.Vector3(-100, 0, 0),
            new THREE.Vector3(100, 0, 0)
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.FLOOR_LINE,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });

        this._floorLine = new THREE.Line(geometry, material);
        this._floorLine.position.z = 0;
        this._scene.add(this._floorLine);
    }

    /**
     * Inicializa la grilla de referencia
     * @private
     */
    _initGrid() {
        const gridSize = 40;
        const gridDivisions = 80;
        const gridColor = 0x1a1a1a;

        this._gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        this._gridHelper.rotation.x = Math.PI / 2;
        this._gridHelper.material.opacity = 0.4;
        this._gridHelper.material.transparent = true;

        this._scene.add(this._gridHelper);
    }

    /**
     * Inicializa la línea del ciclógono
     * @private
     */
    _initCyclogonLine() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.CYCLOGON_LINE,
            linewidth: CONFIG.CYCLOGON.LINE_WIDTH,
            transparent: true,
            opacity: 1
        });

        this._cyclogonLine = new THREE.Line(geometry, material);
        this._cyclogonLine.position.z = 0.1;
        this._scene.add(this._cyclogonLine);

        // Crear efecto de glow (segunda línea más ancha y difusa)
        if (this._config.lineGlow) {
            const glowMaterial = new THREE.LineBasicMaterial({
                color: CONFIG.COLORS.CYCLOGON_LINE,
                linewidth: CONFIG.CYCLOGON.LINE_WIDTH + 2,
                transparent: true,
                opacity: 0.3
            });
            this._cyclogonGlow = new THREE.Line(geometry.clone(), glowMaterial);
            this._cyclogonGlow.position.z = 0.05;
            this._scene.add(this._cyclogonGlow);
        }
    }

    /**
     * Inicializa los event listeners para pan y zoom
     * @private
     */
    _initEventListeners() {
        this._canvas.addEventListener('mousedown', this._onMouseDown);
        this._canvas.addEventListener('mousemove', this._onMouseMove);
        this._canvas.addEventListener('mouseup', this._onMouseUp);
        this._canvas.addEventListener('mouseleave', this._onMouseUp);
        this._canvas.addEventListener('wheel', this._onWheel, { passive: false });

        // Touch events
        this._canvas.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        this._canvas.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        this._canvas.addEventListener('touchend', this._onTouchEnd.bind(this));
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - CURVA
    // ==========================================

    /**
     * Establece el modelo de ciclógono y actualiza la visualización
     * @param {Cyclogon} cyclogon - Modelo de ciclógono
     */
    setCyclogon(cyclogon) {
        this._currentCyclogon = cyclogon;

        if (!cyclogon || cyclogon.isEmpty) {
            this._clearCurve();
            return;
        }

        // Convertir puntos a THREE.Vector3
        this._curvePoints = cyclogon.getPoints().map(
            p => new THREE.Vector3(p.x, p.y, 0)
        );

        // Actualizar geometría de la curva
        this._updateCurveGeometry();

        // Ajustar vista automáticamente
        this.fitView();

        this._needsUpdate = true;
    }

    /**
     * Actualiza la geometría de la curva
     * @private
     */
    _updateCurveGeometry() {
        if (this._curvePoints.length === 0) return;

        // Actualizar línea principal
        this._cyclogonLine.geometry.dispose();
        this._cyclogonLine.geometry = new THREE.BufferGeometry().setFromPoints(this._curvePoints);

        // Actualizar glow si existe
        if (this._cyclogonGlow) {
            this._cyclogonGlow.geometry.dispose();
            this._cyclogonGlow.geometry = new THREE.BufferGeometry().setFromPoints(this._curvePoints);
        }
    }

    /**
     * Limpia la curva actual
     * @private
     */
    _clearCurve() {
        this._curvePoints = [];
        this._cyclogonLine.geometry.dispose();
        this._cyclogonLine.geometry = new THREE.BufferGeometry();

        if (this._cyclogonGlow) {
            this._cyclogonGlow.geometry.dispose();
            this._cyclogonGlow.geometry = new THREE.BufferGeometry();
        }
    }

    /**
     * Obtiene información de la curva actual
     * @returns {Object|null} Información de la curva
     */
    getCurveInfo() {
        if (!this._currentCyclogon) return null;

        const bbox = this._currentCyclogon.getBoundingBox();
        return {
            pointCount: this._currentCyclogon.pointCount,
            arcLength: this._currentCyclogon.getArcLength(),
            boundingBox: bbox,
            type: this._currentCyclogon.type
        };
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - CÁMARA Y VISTA
    // ==========================================

    /**
     * Ajusta la vista para mostrar toda la curva
     */
    fitView() {
        if (this._curvePoints.length === 0) {
            this._resetView();
            return;
        }

        // Calcular bounding box
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const p of this._curvePoints) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }

        // Incluir el piso (y=0)
        minY = Math.min(minY, -0.5);
        maxY = Math.max(maxY, 0.5);

        const padding = CONFIG.CAMERA.GRAPH_PANEL.PADDING;
        const width = maxX - minX + padding * 2;
        const height = maxY - minY + padding * 2;

        const aspect = this._container.clientWidth / this._container.clientHeight;
        let frustumWidth, frustumHeight;

        if (width / height > aspect) {
            frustumWidth = width;
            frustumHeight = width / aspect;
        } else {
            frustumHeight = height;
            frustumWidth = height * aspect;
        }

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        this._camera.left = -frustumWidth / 2 + centerX;
        this._camera.right = frustumWidth / 2 + centerX;
        this._camera.top = frustumHeight / 2 + centerY;
        this._camera.bottom = -frustumHeight / 2 + centerY;

        this._camera.updateProjectionMatrix();

        // Guardar límites
        this._viewBounds = { minX, maxX, minY, maxY };
        this._zoomLevel = 1;
        this._panOffset = { x: 0, y: 0 };

        this._needsUpdate = true;
    }

    /**
     * Resetea la vista a valores por defecto
     * @private
     */
    _resetView() {
        const aspect = this._container.clientWidth / this._container.clientHeight;
        const frustumSize = CONFIG.CAMERA.GRAPH_PANEL.FRUSTUM_SIZE;

        this._camera.left = -frustumSize * aspect;
        this._camera.right = frustumSize * aspect;
        this._camera.top = frustumSize / 2;
        this._camera.bottom = -frustumSize / 2;

        this._camera.updateProjectionMatrix();
        this._zoomLevel = 1;
        this._panOffset = { x: 0, y: 0 };
    }

    /**
     * Aplica zoom a la vista
     * @param {number} factor - Factor de zoom (< 1 para acercar, > 1 para alejar)
     * @param {Object} [center] - Centro del zoom {x, y} en coordenadas de pantalla
     */
    zoom(factor, center = null) {
        const oldWidth = this._camera.right - this._camera.left;
        const oldHeight = this._camera.top - this._camera.bottom;

        // Calcular centro de zoom
        let zoomCenterX, zoomCenterY;
        if (center) {
            // Convertir coordenadas de pantalla a mundo
            const worldPos = this.screenToWorld(center.x, center.y);
            zoomCenterX = worldPos.x;
            zoomCenterY = worldPos.y;
        } else {
            zoomCenterX = (this._camera.right + this._camera.left) / 2;
            zoomCenterY = (this._camera.top + this._camera.bottom) / 2;
        }

        // Calcular nuevo tamaño
        const newWidth = oldWidth * factor;
        const newHeight = oldHeight * factor;

        // Limitar zoom
        const minSize = 0.5;
        const maxSize = 100;
        if (newWidth < minSize || newWidth > maxSize) return;

        // Mantener el centro de zoom fijo
        const ratioX = (zoomCenterX - this._camera.left) / oldWidth;
        const ratioY = (zoomCenterY - this._camera.bottom) / oldHeight;

        this._camera.left = zoomCenterX - newWidth * ratioX;
        this._camera.right = zoomCenterX + newWidth * (1 - ratioX);
        this._camera.bottom = zoomCenterY - newHeight * ratioY;
        this._camera.top = zoomCenterY + newHeight * (1 - ratioY);

        this._camera.updateProjectionMatrix();
        this._zoomLevel *= factor;
        this._needsUpdate = true;
    }

    /**
     * Desplaza la vista
     * @param {number} dx - Desplazamiento en X (coordenadas del mundo)
     * @param {number} dy - Desplazamiento en Y (coordenadas del mundo)
     */
    pan(dx, dy) {
        this._camera.left -= dx;
        this._camera.right -= dx;
        this._camera.top -= dy;
        this._camera.bottom -= dy;

        this._camera.updateProjectionMatrix();
        this._panOffset.x += dx;
        this._panOffset.y += dy;
        this._needsUpdate = true;
    }

    /**
     * Convierte coordenadas de pantalla a mundo
     * @param {number} screenX - Coordenada X en pantalla
     * @param {number} screenY - Coordenada Y en pantalla
     * @returns {Object} {x, y} en coordenadas del mundo
     */
    screenToWorld(screenX, screenY) {
        const rect = this._canvas.getBoundingClientRect();
        const normalizedX = ((screenX - rect.left) / rect.width) * 2 - 1;
        const normalizedY = -((screenY - rect.top) / rect.height) * 2 + 1;

        const vector = new THREE.Vector3(normalizedX, normalizedY, 0);
        vector.unproject(this._camera);

        return { x: vector.x, y: vector.y };
    }

    // ==========================================
    // MÉTODOS DE ANIMACIÓN
    // ==========================================

    /**
     * Prepara la vista para la animación
     * @deprecated Usar prepareAnimationElements() para solo preparar sin iniciar
     */
    prepareAnimation() {
        this._createAnimatedShape();
        this._animation.enabled = true;
        this.setAnimationProgress(0);
    }

    /**
     * Prepara los elementos visuales de animación sin iniciarla
     * La curva se muestra completa y los controles quedan listos
     */
    prepareAnimationElements() {
        this._createAnimatedShape();
        // Mostrar curva completa por defecto
        this._animation.enabled = false;
        this._animation.progress = 1;
        this._updateCurveGeometry(); // Mostrar curva completa
        // Ocultar elementos de animación hasta que el usuario inicie
        if (this._animatedShapeMesh) this._animatedShapeMesh.visible = false;
        if (this._animatedPointMesh) this._animatedPointMesh.visible = false;
        if (this._animatedRadiusLine) this._animatedRadiusLine.visible = false;
    }

    /**
     * Establece el progreso de la animación
     * @param {number} progress - 0 a 1
     */
    setAnimationProgress(progress) {
        this._animation.progress = Math.max(0, Math.min(1, progress));
        
        // Mostrar elementos de animación cuando se controla el progreso
        if (this._animatedShapeMesh) this._animatedShapeMesh.visible = true;
        if (this._animatedPointMesh) this._animatedPointMesh.visible = true;
        if (this._animatedRadiusLine) this._animatedRadiusLine.visible = true;
        
        this._updateAnimatedCurve();
        this._needsUpdate = true;
    }

    /**
     * Inicia la animación de dibujo de la curva (Legacy/Internal)
     */
    startDrawingAnimation() {
        this._animation.enabled = true;
        this._animation.progress = 0;
        this._animation.paused = false;
        this._state = GraphPanelState.ANIMATING;
    }

    /**
     * Pausa/reanuda la animación
     */
    toggleAnimationPause() {
        if (this._animation.enabled) {
            this._animation.paused = !this._animation.paused;
        }
    }

    /**
     * Detiene la animación
     */
    stopAnimation() {
        this._animation.enabled = false;
        this._animation.progress = 1;
        this._state = GraphPanelState.IDLE;
        
        // Mostrar curva completa
        this._updateCurveGeometry();
    }

    /**
     * Establece la velocidad de animación
     * @param {number} speed - Progreso por segundo (0.1 a 2)
     */
    setAnimationSpeed(speed) {
        this._animation.speed = Math.max(0.1, Math.min(2, speed));
    }

    /**
     * Actualiza la animación
     * @param {number} deltaTime - Tiempo desde el último frame
     * @private
     */
    _updateAnimation(deltaTime) {
        if (!this._animation.enabled || this._animation.paused) return;

        this._animation.progress += this._animation.speed * deltaTime * this._animation.direction;

        // Clamp progress
        if (this._animation.progress >= 1) {
            this._animation.progress = 1;
            this._animation.enabled = false;
            this._state = GraphPanelState.IDLE;
        } else if (this._animation.progress <= 0) {
            this._animation.progress = 0;
        }

        // Actualizar curva parcial
        this._updateAnimatedCurve();
    }

    /**
     * Actualiza el estado de la animación (curva y forma)
     * @private
     */
    _updateAnimatedCurve() {
        if (this._curvePoints.length === 0) return;

        // 1. Actualizar Curva Progresiva
        const totalPoints = this._curvePoints.length;
        const currentPointIndex = Math.floor((totalPoints - 1) * this._animation.progress);
        const partialPoints = this._curvePoints.slice(0, currentPointIndex + 1);

        this._cyclogonLine.geometry.dispose();
        this._cyclogonLine.geometry = new THREE.BufferGeometry().setFromPoints(partialPoints);

        if (this._cyclogonGlow) {
            this._cyclogonGlow.geometry.dispose();
            this._cyclogonGlow.geometry = new THREE.BufferGeometry().setFromPoints(partialPoints);
        }

        // 2. Actualizar Forma Rodante
        if (!this._animatedShapeMesh) {
            this._createAnimatedShape();
        }

        const currentPointData = this._currentCyclogon.getPoint(currentPointIndex);
        if (currentPointData && currentPointData.center) {
            // Posición del centro
            this._animatedShapeMesh.position.set(currentPointData.center.x, currentPointData.center.y, 0);
            
            // Rotación
            // Para Círculo: theta
            // Para Polígono: rotation
            let rotation = 0;
            if (this._currentCyclogon.sourceShape instanceof Circle) {
                // En cicloide, theta es positivo, pero la rotación visual es negativa (horaria) si avanza a la derecha
                // CyclogonCalculator: const pointAngle = alpha - theta;
                // La rotación del cuerpo es -theta
                rotation = -currentPointData.theta;
            } else {
                // En polígono, rotation es acumulada
                // CyclogonCalculator: rotation: currentTotalRotation
                // La rotación es negativa (horaria)
                // Además, debemos aplicar la rotación inicial de ajuste (adjustmentRotation)
                const adjustmentRotation = this._currentCyclogon.getMetadataValue('adjustmentRotation') || 0;
                rotation = -currentPointData.rotation + adjustmentRotation;
            }
            
            this._animatedShapeMesh.rotation.z = rotation;

            // Actualizar Punto de Dibujo (Mesh)
            this._animatedPointMesh.position.set(currentPointData.x, currentPointData.y, 0.02);

            // Actualizar Línea de Radio (Centro a Punto)
            const radiusPoints = [
                new THREE.Vector3(currentPointData.center.x, currentPointData.center.y, 0),
                new THREE.Vector3(currentPointData.x, currentPointData.y, 0)
            ];
            this._animatedRadiusLine.geometry.dispose();
            this._animatedRadiusLine.geometry = new THREE.BufferGeometry().setFromPoints(radiusPoints);
        }
    }

    /**
     * Crea la geometría para la forma animada
     * @private
     */
    _createAnimatedShape() {
        // Limpiar existentes
        if (this._animatedShapeMesh) {
            this._scene.remove(this._animatedShapeMesh);
            // Dispose geometry/material safely
            if (this._animatedShapeMesh.geometry) this._animatedShapeMesh.geometry.dispose();
            if (this._animatedShapeMesh.material) this._animatedShapeMesh.material.dispose();
            this._animatedShapeMesh = null;
        }
        if (this._animatedPointMesh) {
            this._scene.remove(this._animatedPointMesh);
            if (this._animatedPointMesh.geometry) this._animatedPointMesh.geometry.dispose();
            if (this._animatedPointMesh.material) this._animatedPointMesh.material.dispose();
            this._animatedPointMesh = null;
        }
        if (this._animatedRadiusLine) {
            this._scene.remove(this._animatedRadiusLine);
            if (this._animatedRadiusLine.geometry) this._animatedRadiusLine.geometry.dispose();
            if (this._animatedRadiusLine.material) this._animatedRadiusLine.material.dispose();
            this._animatedRadiusLine = null;
        }

        if (!this._currentCyclogon) return;

        const shape = this._currentCyclogon.sourceShape;
        const color = 0xffffff; // Blanco para la forma

        // Crear Mesh de la forma
        if (shape instanceof Circle) {
            const geometry = new THREE.RingGeometry(shape.radius - 0.02, shape.radius, 64);
            const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
            this._animatedShapeMesh = new THREE.Mesh(geometry, material);
            
            // Añadir una línea para ver la rotación
            const lineGeo = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(shape.radius, 0, 0)
            ]);
            const lineMat = new THREE.LineBasicMaterial({ color: color });
            const line = new THREE.Line(lineGeo, lineMat);
            this._animatedShapeMesh.add(line);

        } else if (shape instanceof Polygon) {
            const points = [];
            // Usar los vértices del modelo original para mantener la orientación correcta
            const vertices = shape.vertices;
            
            vertices.forEach(v => {
                points.push(new THREE.Vector3(v.x, v.y, 0));
            });
            // Cerrar el polígono
            if (vertices.length > 0) {
                points.push(new THREE.Vector3(vertices[0].x, vertices[0].y, 0));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color: color });
            this._animatedShapeMesh = new THREE.Line(geometry, material);
        }

        if (this._animatedShapeMesh) {
            this._scene.add(this._animatedShapeMesh);
        }

        // Crear Punto de Dibujo
        const pointGeometry = new THREE.CircleGeometry(0.08, 16);
        const pointMaterial = new THREE.MeshBasicMaterial({ color: CONFIG.COLORS.ACCENT_SECONDARY });
        this._animatedPointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
        this._animatedPointMesh.position.z = 0.02;
        this._scene.add(this._animatedPointMesh);

        // Crear Línea de Radio
        const radiusGeo = new THREE.BufferGeometry();
        const radiusMat = new THREE.LineBasicMaterial({ 
            color: CONFIG.COLORS.TEXT_MUTED, 
            transparent: true, 
            opacity: 0.5
        });
        this._animatedRadiusLine = new THREE.Line(radiusGeo, radiusMat);
        this._scene.add(this._animatedRadiusLine);
    }

    // ==========================================
    // EVENT HANDLERS
    // ==========================================

    /**
     * Manejador de mouse down para pan
     * @private
     */
    _onMouseDown(event) {
        if (event.button !== 0 && event.button !== 1) return; // Solo botón izquierdo o medio

        this._isPanning = true;
        this._lastPanPosition = { x: event.clientX, y: event.clientY };
        this._state = GraphPanelState.PANNING;
        this._canvas.style.cursor = 'grabbing';
    }

    /**
     * Manejador de mouse move para pan
     * @private
     */
    _onMouseMove(event) {
        if (!this._isPanning) return;

        const dx = event.clientX - this._lastPanPosition.x;
        const dy = event.clientY - this._lastPanPosition.y;

        // Convertir píxeles a unidades del mundo
        const worldDx = dx * (this._camera.right - this._camera.left) / this._container.clientWidth;
        const worldDy = -dy * (this._camera.top - this._camera.bottom) / this._container.clientHeight;

        this.pan(worldDx, worldDy);

        this._lastPanPosition = { x: event.clientX, y: event.clientY };
    }

    /**
     * Manejador de mouse up
     * @private
     */
    _onMouseUp(event) {
        this._isPanning = false;
        this._state = GraphPanelState.IDLE;
        this._canvas.style.cursor = 'grab';
    }

    /**
     * Manejador de wheel para zoom
     * @private
     */
    _onWheel(event) {
        event.preventDefault();

        const factor = event.deltaY > 0 ? 1.1 : 0.9;
        this.zoom(factor, { x: event.clientX, y: event.clientY });
    }

    /**
     * Manejador de touch start
     * @private
     */
    _onTouchStart(event) {
        if (event.touches.length === 1) {
            this._isPanning = true;
            this._lastPanPosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            this._state = GraphPanelState.PANNING;
        }
    }

    /**
     * Manejador de touch move
     * @private
     */
    _onTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1 && this._isPanning) {
            const dx = event.touches[0].clientX - this._lastPanPosition.x;
            const dy = event.touches[0].clientY - this._lastPanPosition.y;

            const worldDx = dx * (this._camera.right - this._camera.left) / this._container.clientWidth;
            const worldDy = -dy * (this._camera.top - this._camera.bottom) / this._container.clientHeight;

            this.pan(worldDx, worldDy);

            this._lastPanPosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    /**
     * Manejador de touch end
     * @private
     */
    _onTouchEnd(event) {
        this._isPanning = false;
        this._state = GraphPanelState.IDLE;
    }

    // ==========================================
    // MÉTODOS DE CONFIGURACIÓN
    // ==========================================

    /**
     * Muestra/oculta la grilla
     * @param {boolean} show
     */
    setGridVisible(show) {
        this._config.showGrid = show;
        if (this._gridHelper) {
            this._gridHelper.visible = show;
        }
        this._needsUpdate = true;
    }

    /**
     * Muestra/oculta la línea del piso
     * @param {boolean} show
     */
    setFloorVisible(show) {
        this._config.showFloor = show;
        if (this._floorLine) {
            this._floorLine.visible = show;
        }
        this._needsUpdate = true;
    }

    /**
     * Activa/desactiva el efecto de glow
     * @param {boolean} enabled
     */
    setGlowEnabled(enabled) {
        this._config.lineGlow = enabled;
        if (this._cyclogonGlow) {
            this._cyclogonGlow.visible = enabled;
        }
        this._needsUpdate = true;
    }

    /**
     * Cambia el color de la curva
     * @param {number} color - Color en formato hexadecimal
     */
    setCurveColor(color) {
        if (this._cyclogonLine) {
            this._cyclogonLine.material.color.setHex(color);
        }
        if (this._cyclogonGlow) {
            this._cyclogonGlow.material.color.setHex(color);
        }
        this._needsUpdate = true;
    }

    // ==========================================
    // MÉTODOS DE RENDERIZADO
    // ==========================================

    /**
     * Renderiza la escena
     */
    render() {
        if (!this._renderer || !this._scene || !this._camera) return;

        // Calcular delta time
        const currentTime = performance.now();
        const deltaTime = (currentTime - this._lastTime) / 1000;
        this._lastTime = currentTime;

        // Actualizar animación si está activa
        if (this._animation.enabled) {
            this._updateAnimation(deltaTime);
        }

        // Renderizar
        this._renderer.render(this._scene, this._camera);
        this._needsUpdate = false;
    }

    /**
     * Marca la vista como necesitando actualización
     */
    markForUpdate() {
        this._needsUpdate = true;
    }

    /**
     * @returns {boolean} Si la vista necesita actualización
     */
    needsUpdate() {
        return this._needsUpdate || this._animation.enabled;
    }

    // ==========================================
    // MÉTODOS DE RESIZE
    // ==========================================

    /**
     * Actualiza el tamaño del renderer y la cámara
     */
    resize() {
        const width = this._container.clientWidth;
        const height = this._container.clientHeight;

        // Evitar procesamiento si el tamaño es inválido
        if (width === 0 || height === 0) return;

        this._renderer.setSize(width, height);

        // Mantener la proporción de la vista actual
        const aspect = width / height;
        const currentHeight = this._camera.top - this._camera.bottom;
        const newWidth = currentHeight * aspect;
        const centerX = (this._camera.right + this._camera.left) / 2;

        this._camera.left = centerX - newWidth / 2;
        this._camera.right = centerX + newWidth / 2;
        this._camera.updateProjectionMatrix();

        // Si hay una curva, reajustar la vista para mantener proporciones
        if (this._curvePoints.length > 0) {
            this.fitView();
        }

        this._needsUpdate = true;
    }

    // ==========================================
    // MÉTODOS DE LIMPIEZA
    // ==========================================

    /**
     * Libera todos los recursos
     */
    dispose() {
        // Eliminar ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }

        // Eliminar event listeners
        this._canvas.removeEventListener('mousedown', this._onMouseDown);
        this._canvas.removeEventListener('mousemove', this._onMouseMove);
        this._canvas.removeEventListener('mouseup', this._onMouseUp);
        this._canvas.removeEventListener('mouseleave', this._onMouseUp);
        this._canvas.removeEventListener('wheel', this._onWheel);

        // Limpiar objetos 3D
        if (this._cyclogonLine) {
            this._scene.remove(this._cyclogonLine);
            this._cyclogonLine.geometry.dispose();
            this._cyclogonLine.material.dispose();
        }

        if (this._cyclogonGlow) {
            this._scene.remove(this._cyclogonGlow);
            this._cyclogonGlow.geometry.dispose();
            this._cyclogonGlow.material.dispose();
        }

        if (this._floorLine) {
            this._scene.remove(this._floorLine);
            this._floorLine.geometry.dispose();
            this._floorLine.material.dispose();
        }

        if (this._gridHelper) {
            this._scene.remove(this._gridHelper);
            this._gridHelper.geometry.dispose();
            this._gridHelper.material.dispose();
        }

        if (this._renderer) {
            this._renderer.dispose();
        }

        // Limpiar referencias
        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._currentCyclogon = null;
        this._curvePoints = [];
    }
}

export default GraphPanelView;
