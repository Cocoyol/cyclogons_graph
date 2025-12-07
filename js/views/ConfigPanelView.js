/**
 * ============================================
 * CONFIGPANELVIEW.JS - Vista del Panel de Configuración
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que maneja la visualización y renderizado
 * del panel de configuración usando Three.js.
 * Incluye la forma (círculo/polígono), el punto de
 * dibujo y toda la interacción visual.
 * 
 * FASE 3: Mejorado con feedback visual avanzado y animaciones
 */

import * as THREE from 'three';
import { CONFIG, MATH } from '../config/constants.js';
import Polygon from '../models/Polygon.js';
import Circle from '../models/Circle.js';
import DrawPoint, { DrawPointState } from '../models/DrawPoint.js';

/**
 * Vista del panel de configuración
 */
export class ConfigPanelView {
    /**
     * Crea la vista del panel de configuración
     * @param {HTMLCanvasElement} canvas - Canvas donde renderizar
     */
    constructor(canvas) {
        if (!canvas) {
            throw new Error('Canvas requerido para ConfigPanelView');
        }

        this._canvas = canvas;
        this._container = canvas.parentElement;

        // Escena Three.js
        this._scene = null;
        this._camera = null;
        this._renderer = null;

        // Modelos
        this._shapeModel = null;  // Polygon o Circle
        this._drawPointModel = null;

        // Objetos 3D
        this._shapeGroup = null;
        this._shapeFill = null;
        this._shapeOutline = null;
        this._drawPointMesh = null;
        this._drawPointRing = null;
        this._gridHelper = null;

        // FASE 3: Nuevos objetos visuales
        this._snapIndicator = null;      // Indicador visual de modo snap
        this._trailGroup = null;         // Grupo para el trail del punto
        this._glowMesh = null;           // Efecto de glow en el punto
        this._snapGuideLines = null;     // Líneas guía para snap

        // Estado de renderizado
        this._needsUpdate = true;
        this._animationFrameId = null;
        this._lastTime = performance.now();
        this._isSnapModeActive = false;

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

    /** @returns {Polygon|Circle|null} Modelo de forma actual */
    get shapeModel() {
        return this._shapeModel;
    }

    /** @returns {DrawPoint|null} Modelo del punto de dibujo */
    get drawPointModel() {
        return this._drawPointModel;
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
        this._initGrid();
        this._initDefaultShape();
        this._initDrawPoint();
        this._initSnapIndicator();
        this._initTrailGroup();
    }

    /**
     * Inicializa la escena
     * @private
     */
    _initScene() {
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(CONFIG.COLORS.BACKGROUND_CONFIG);
    }

    /**
     * Inicializa la cámara ortográfica
     * @private
     */
    _initCamera() {
        const aspect = this._container.clientWidth / this._container.clientHeight;
        const frustumSize = CONFIG.CAMERA.CONFIG_PANEL.FRUSTUM_SIZE;

        this._camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            CONFIG.CAMERA.CONFIG_PANEL.NEAR,
            CONFIG.CAMERA.CONFIG_PANEL.FAR
        );
        this._camera.position.z = CONFIG.CAMERA.CONFIG_PANEL.POSITION_Z;
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
     * Inicializa la grilla de referencia
     * @private
     */
    _initGrid() {
        const gridSize = 6;
        const gridDivisions = 12;
        const gridColor = 0x2a2a4a;

        this._gridHelper = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
        this._gridHelper.rotation.x = Math.PI / 2;
        this._gridHelper.material.opacity = 0.3;
        this._gridHelper.material.transparent = true;

        this._scene.add(this._gridHelper);
    }

    /**
     * Inicializa la forma por defecto (círculo)
     * @private
     */
    _initDefaultShape() {
        const radius = CONFIG.SHAPES.DEFAULT_RADIUS;
        this._shapeModel = new Circle(radius);
        this._createShapeVisual();
    }

    /**
     * Inicializa el punto de dibujo
     * @private
     */
    _initDrawPoint() {
        this._drawPointModel = new DrawPoint(0, CONFIG.SHAPES.DEFAULT_RADIUS);
        this._createDrawPointVisual();
    }

    /**
     * Inicializa el indicador de modo snap (FASE 3)
     * @private
     */
    _initSnapIndicator() {
        // Crear grupo para indicador de snap
        this._snapIndicator = new THREE.Group();
        this._snapIndicator.visible = false;
        
        // Crear anillo exterior pulsante
        const ringGeometry = new THREE.RingGeometry(0.15, 0.18, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.name = 'snapRing';
        this._snapIndicator.add(ring);
        
        // Crear líneas radiales
        const linesGeometry = new THREE.BufferGeometry();
        const linePositions = [];
        const numLines = 8;
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            const innerRadius = 0.2;
            const outerRadius = 0.3;
            linePositions.push(
                Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, 0,
                Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius, 0
            );
        }
        linesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        const linesMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
        lines.name = 'snapLines';
        this._snapIndicator.add(lines);
        
        this._scene.add(this._snapIndicator);
    }

    /**
     * Inicializa el grupo para el trail del punto (FASE 3)
     * @private
     */
    _initTrailGroup() {
        this._trailGroup = new THREE.Group();
        this._scene.add(this._trailGroup);
    }

    // ==========================================
    // MÉTODOS DE CREACIÓN VISUAL - FORMAS
    // ==========================================

    /**
     * Crea/actualiza los objetos 3D de la forma
     * @private
     */
    _createShapeVisual() {
        this._clearShapeVisual();

        this._shapeGroup = new THREE.Group();

        if (this._shapeModel instanceof Circle) {
            this._createCircleVisual();
        } else if (this._shapeModel instanceof Polygon) {
            this._createPolygonVisual();
        }

        this._scene.add(this._shapeGroup);
        this._needsUpdate = true;
    }

    /**
     * Crea la visualización de un círculo
     * @private
     */
    _createCircleVisual() {
        const radius = this._shapeModel.radius;

        // Relleno del círculo (muy sutil)
        const fillGeometry = new THREE.CircleGeometry(radius, 64);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.POLYGON,
            transparent: true,
            opacity: 0.1
        });
        this._shapeFill = new THREE.Mesh(fillGeometry, fillMaterial);
        this._shapeGroup.add(this._shapeFill);

        // Borde del círculo (más visible)
        const outlineGeometry = new THREE.RingGeometry(radius - 0.03, radius, 64);
        const outlineMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.POLYGON,
            transparent: true,
            opacity: 0.9
        });
        this._shapeOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
        this._shapeOutline.position.z = 0.01;
        this._shapeGroup.add(this._shapeOutline);

        // Añadir círculos de referencia (centro)
        this._addCenterMarker();
    }

    /**
     * Crea la visualización de un polígono
     * @private
     */
    _createPolygonVisual() {
        const polygon = this._shapeModel;
        const vertices = polygon.vertices;

        // Crear shape para el relleno
        const shape = new THREE.Shape();
        vertices.forEach((v, i) => {
            if (i === 0) {
                shape.moveTo(v.x, v.y);
            } else {
                shape.lineTo(v.x, v.y);
            }
        });
        shape.closePath();

        // Relleno del polígono (muy sutil)
        const fillGeometry = new THREE.ShapeGeometry(shape);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.POLYGON,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        this._shapeFill = new THREE.Mesh(fillGeometry, fillMaterial);
        this._shapeGroup.add(this._shapeFill);

        // Borde del polígono (líneas más gruesas)
        const points = vertices.map(v => new THREE.Vector3(v.x, v.y, 0));
        points.push(points[0].clone()); // Cerrar el polígono

        const outlineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const outlineMaterial = new THREE.LineBasicMaterial({
            color: CONFIG.COLORS.POLYGON,
            linewidth: 2
        });
        this._shapeOutline = new THREE.Line(outlineGeometry, outlineMaterial);
        this._shapeOutline.position.z = 0.01;
        this._shapeGroup.add(this._shapeOutline);

        // Añadir marcadores de vértices
        this._addVertexMarkers(vertices);

        // Añadir centro
        this._addCenterMarker();
    }

    /**
     * Añade marcadores visuales en los vértices del polígono
     * @param {Array} vertices - Array de vértices
     * @private
     */
    _addVertexMarkers(vertices) {
        const markerGeometry = new THREE.CircleGeometry(0.04, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({
            color: CONFIG.COLORS.POLYGON,
            transparent: true,
            opacity: 0.7
        });

        vertices.forEach(v => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.set(v.x, v.y, 0.02);
            this._shapeGroup.add(marker);
        });
    }

    /**
     * Añade un marcador en el centro de la forma
     * @private
     */
    _addCenterMarker() {
        // Cruz en el centro
        const size = 0.08;
        const lineGeometry = new THREE.BufferGeometry();
        
        const positions = new Float32Array([
            -size, 0, 0.02,
            size, 0, 0.02,
            0, -size, 0.02,
            0, size, 0.02
        ]);
        
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        
        const centerLines = new THREE.LineSegments(lineGeometry, lineMaterial);
        this._shapeGroup.add(centerLines);
    }

    /**
     * Limpia los objetos visuales de la forma
     * @private
     */
    _clearShapeVisual() {
        if (this._shapeGroup) {
            this._scene.remove(this._shapeGroup);
            
            // Dispose de todas las geometrías y materiales
            this._shapeGroup.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            
            this._shapeGroup = null;
            this._shapeFill = null;
            this._shapeOutline = null;
        }
    }

    // ==========================================
    // MÉTODOS DE CREACIÓN VISUAL - PUNTO DE DIBUJO
    // ==========================================

    /**
     * Crea/actualiza el objeto 3D del punto de dibujo
     * @private
     */
    _createDrawPointVisual() {
        this._clearDrawPointVisual();

        const drawPoint = this._drawPointModel;
        const radius = drawPoint.radius;

        // FASE 3: Crear efecto de glow (círculo más grande y difuso)
        const glowGeometry = new THREE.CircleGeometry(radius * 2, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: drawPoint.getCurrentColor(),
            transparent: true,
            opacity: 0.15
        });
        this._glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this._glowMesh.position.set(drawPoint.x, drawPoint.y, 0.05);
        this._scene.add(this._glowMesh);

        // Punto principal
        const geometry = new THREE.CircleGeometry(radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: drawPoint.getCurrentColor()
        });
        this._drawPointMesh = new THREE.Mesh(geometry, material);
        this._drawPointMesh.position.set(drawPoint.x, drawPoint.y, 0.1);

        // Anillo exterior
        const ringGeometry = new THREE.RingGeometry(radius + 0.02, radius + 0.04, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        this._drawPointRing = new THREE.Mesh(ringGeometry, ringMaterial);
        this._drawPointRing.position.z = 0.05;
        this._drawPointMesh.add(this._drawPointRing);

        // Línea al centro (para referencia visual)
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(drawPoint.x, drawPoint.y, 0)
        ]);
        const lineMaterial = new THREE.LineDashedMaterial({
            color: CONFIG.DRAW_POINT.COLOR,
            transparent: true,
            opacity: 0.4,
            dashSize: 0.05,
            gapSize: 0.03
        });
        this._drawPointLine = new THREE.Line(lineGeometry, lineMaterial);
        this._drawPointLine.computeLineDistances();
        this._drawPointLine.position.z = 0.05;

        this._scene.add(this._drawPointMesh);
        this._scene.add(this._drawPointLine);
        this._needsUpdate = true;
    }

    /**
     * Limpia los objetos visuales del punto de dibujo
     * @private
     */
    _clearDrawPointVisual() {
        if (this._glowMesh) {
            this._scene.remove(this._glowMesh);
            this._glowMesh.geometry.dispose();
            this._glowMesh.material.dispose();
            this._glowMesh = null;
        }
        if (this._drawPointMesh) {
            this._scene.remove(this._drawPointMesh);
            this._drawPointMesh.geometry.dispose();
            this._drawPointMesh.material.dispose();
            this._drawPointMesh = null;
        }
        if (this._drawPointRing) {
            this._drawPointRing.geometry.dispose();
            this._drawPointRing.material.dispose();
            this._drawPointRing = null;
        }
        if (this._drawPointLine) {
            this._scene.remove(this._drawPointLine);
            this._drawPointLine.geometry.dispose();
            this._drawPointLine.material.dispose();
            this._drawPointLine = null;
        }
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - ACTUALIZACIÓN DE FORMA
    // ==========================================

    /**
     * Cambia la forma a un círculo
     * @param {number} radius - Radio del círculo
     */
    setCircle(radius = CONFIG.SHAPES.DEFAULT_RADIUS) {
        this._shapeModel = new Circle(radius);
        this._createShapeVisual();
        
        // Resetear estados del punto de dibujo antes de reposicionar
        this._drawPointModel.isDragging = false;
        this._drawPointModel.isHovered = false;
        this._isSnapModeActive = false;
        
        // Reposicionar punto de dibujo
        this._drawPointModel.resetToCircleTop(this._shapeModel);
        this.updateDrawPointPosition();
    }

    /**
     * Cambia la forma a un polígono
     * @param {number} sides - Número de lados
     * @param {number} radius - Radio circunscrito
     */
    setPolygon(sides, radius = CONFIG.SHAPES.DEFAULT_RADIUS) {
        // Calcular rotación para que el polígono descanse sobre un lado
        const rotationOffset = -Math.PI / 2 + Math.PI / sides;
        this._shapeModel = new Polygon(sides, radius, rotationOffset);
        this._createShapeVisual();
        
        // Resetear estados del punto de dibujo antes de reposicionar
        this._drawPointModel.isDragging = false;
        this._drawPointModel.isHovered = false;
        this._isSnapModeActive = false;
        
        // Reposicionar punto de dibujo
        this._drawPointModel.resetToPolygonTop(this._shapeModel);
        this.updateDrawPointPosition();
    }

    /**
     * Actualiza el número de lados del polígono actual
     * @param {number} sides - Nuevo número de lados
     */
    updatePolygonSides(sides) {
        if (!(this._shapeModel instanceof Polygon)) {
            console.warn('La forma actual no es un polígono');
            return;
        }
        
        // Recalcular polígono con nueva rotación para mantenerlo sobre un lado
        const radius = this._shapeModel.radius;
        const rotationOffset = -Math.PI / 2 + Math.PI / sides;
        this._shapeModel = new Polygon(sides, radius, rotationOffset);
        
        this._createShapeVisual();
        
        // Resetear estados del punto de dibujo antes de reposicionar
        this._drawPointModel.isDragging = false;
        this._drawPointModel.isHovered = false;
        this._isSnapModeActive = false;
        
        // Reposicionar punto de dibujo
        this._drawPointModel.resetToPolygonTop(this._shapeModel);
        this.updateDrawPointPosition();
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - PUNTO DE DIBUJO
    // ==========================================

    /**
     * Actualiza la posición visual del punto de dibujo (FASE 3 - Mejorado)
     */
    updateDrawPointPosition() {
        if (!this._drawPointMesh || !this._drawPointModel) return;

        const point = this._drawPointModel;
        const visualInfo = point.getVisualInfo();
        
        // Actualizar posición del mesh
        this._drawPointMesh.position.set(point.x, point.y, 0.1);
        
        // Actualizar color según estado
        this._drawPointMesh.material.color.setHex(visualInfo.color);
        
        // Actualizar tamaño del punto
        const scale = visualInfo.radius / point.radius;
        this._drawPointMesh.scale.set(scale, scale, 1);
        
        // Actualizar glow
        if (this._glowMesh) {
            this._glowMesh.position.set(point.x, point.y, 0.05);
            this._glowMesh.material.color.setHex(visualInfo.color);
            
            // Efecto de pulso en el glow
            const pulseScale = 1 + Math.sin(visualInfo.pulsePhase) * 0.15;
            this._glowMesh.scale.set(scale * pulseScale, scale * pulseScale, 1);
            
            // Más opaco cuando está activo
            this._glowMesh.material.opacity = point.isDragging ? 0.25 : (point.isHovered ? 0.2 : 0.1);
        }
        
        // Actualizar línea al centro
        if (this._drawPointLine) {
            const positions = this._drawPointLine.geometry.attributes.position.array;
            positions[3] = point.x;
            positions[4] = point.y;
            this._drawPointLine.geometry.attributes.position.needsUpdate = true;
            this._drawPointLine.computeLineDistances();
            
            // Cambiar color si está en modo snap
            if (this._isSnapModeActive && point.isDragging) {
                this._drawPointLine.material.color.setHex(0x00ff88);
                this._drawPointLine.material.opacity = 0.7;
            } else {
                this._drawPointLine.material.color.setHex(CONFIG.DRAW_POINT.COLOR);
                this._drawPointLine.material.opacity = 0.4;
            }
        }
        
        // Actualizar anillo según estado
        if (this._drawPointRing) {
            this._drawPointRing.scale.set(visualInfo.ringScale, visualInfo.ringScale, 1);
            this._drawPointRing.material.opacity = visualInfo.ringOpacity;
            this._drawPointRing.material.color.setHex(visualInfo.ringColor);
        }
        
        // Actualizar indicador de snap
        this._updateSnapIndicator();
        
        // Actualizar trail
        this._updateTrailVisual();

        this._needsUpdate = true;
    }

    /**
     * Actualiza el indicador visual de modo snap (FASE 3)
     * @private
     */
    _updateSnapIndicator() {
        if (!this._snapIndicator) return;
        
        const point = this._drawPointModel;
        
        // Mostrar indicador solo cuando está en modo snap y arrastrando
        const shouldShow = this._isSnapModeActive && point.isDragging;
        this._snapIndicator.visible = shouldShow;
        
        if (shouldShow) {
            this._snapIndicator.position.set(point.x, point.y, 0.03);
            
            // Animar rotación
            this._snapIndicator.rotation.z += 0.02;
            
            // Pulso en el anillo
            const ring = this._snapIndicator.getObjectByName('snapRing');
            if (ring) {
                const scale = 1 + Math.sin(point.pulsePhase * 2) * 0.1;
                ring.scale.set(scale, scale, 1);
            }
        }
    }

    /**
     * Actualiza la visualización del trail (FASE 3)
     * @private
     */
    _updateTrailVisual() {
        if (!this._trailGroup || !this._drawPointModel) return;
        
        // Limpiar trail anterior
        while (this._trailGroup.children.length > 0) {
            const child = this._trailGroup.children[0];
            this._trailGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        
        // Dibujar nuevos puntos del trail
        const trailPoints = this._drawPointModel.trailPoints;
        const baseRadius = this._drawPointModel.radius * 0.5;
        
        trailPoints.forEach((tp, index) => {
            const ratio = index / trailPoints.length;
            const radius = baseRadius * (0.3 + ratio * 0.7);
            
            const geometry = new THREE.CircleGeometry(radius, 16);
            const material = new THREE.MeshBasicMaterial({
                color: CONFIG.DRAW_POINT.COLOR,
                transparent: true,
                opacity: tp.alpha * 0.5
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(tp.x, tp.y, 0.08);
            this._trailGroup.add(mesh);
        });
    }

    /**
     * Mueve el punto de dibujo a una nueva posición
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {boolean} snap - Si debe hacer snap al borde
     */
    moveDrawPoint(x, y, snap = false) {
        if (!this._drawPointModel) return;

        if (snap) {
            // En modo snap: primero establecer la posición objetivo (sin animación),
            // luego proyectar al borde de la forma inmediatamente
            this._drawPointModel.setPositionForSnap(x, y);
            this._drawPointModel.snapToShape(this._shapeModel);
        } else {
            this._drawPointModel.setPosition(x, y);
        }

        this.updateDrawPointPosition();
    }

    /**
     * Establece el estado de hover del punto
     * @param {boolean} isHovered
     */
    setDrawPointHovered(isHovered) {
        if (this._drawPointModel) {
            this._drawPointModel.isHovered = isHovered;
            this.updateDrawPointPosition();
        }
    }

    /**
     * Establece el estado de arrastre del punto
     * @param {boolean} isDragging
     */
    setDrawPointDragging(isDragging) {
        if (this._drawPointModel) {
            this._drawPointModel.isDragging = isDragging;
            this.updateDrawPointPosition();
        }
    }

    /**
     * Establece el modo snap activo (FASE 3)
     * @param {boolean} isActive
     */
    setSnapMode(isActive) {
        this._isSnapModeActive = isActive;
        if (this._drawPointModel) {
            this._drawPointModel.snapIndicatorVisible = isActive;
        }
        this.updateDrawPointPosition();
    }

    /**
     * Obtiene la información actual del punto de dibujo
     * @returns {Object} { x, y, distanceFromCenter, angle }
     */
    getDrawPointInfo() {
        if (!this._drawPointModel) return null;

        return {
            x: this._drawPointModel.x,
            y: this._drawPointModel.y,
            distanceFromCenter: this._drawPointModel.getDistanceFromOrigin(),
            angle: this._drawPointModel.getAngleFromOrigin(),
            isSnapped: this._drawPointModel.isSnappedToEdge
        };
    }

    // ==========================================
    // MÉTODOS DE UTILIDAD - COORDENADAS
    // ==========================================

    /**
     * Convierte coordenadas de pantalla a coordenadas del mundo
     * @param {number} screenX - Coordenada X en pantalla (normalizada -1 a 1)
     * @param {number} screenY - Coordenada Y en pantalla (normalizada -1 a 1)
     * @returns {Object} { x, y } en coordenadas del mundo
     */
    screenToWorld(screenX, screenY) {
        const vector = new THREE.Vector3(screenX, screenY, 0);
        vector.unproject(this._camera);
        return { x: vector.x, y: vector.y };
    }

    /**
     * Obtiene las coordenadas normalizadas del mouse relativas al canvas
     * @param {MouseEvent} event
     * @returns {Object} { x, y } normalizados (-1 a 1)
     */
    getMouseCoords(event) {
        const rect = this._canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    /**
     * Verifica si un punto del mundo está sobre el punto de dibujo
     * @param {Object} worldPoint - { x, y }
     * @param {number} tolerance - Tolerancia adicional
     * @returns {boolean}
     */
    isPointOverDrawPoint(worldPoint, tolerance = 0.1) {
        if (!this._drawPointModel) return false;
        return this._drawPointModel.containsPoint(worldPoint, tolerance);
    }

    // ==========================================
    // MÉTODOS DE RENDERIZADO (FASE 3 - Mejorado)
    // ==========================================

    /**
     * Renderiza la escena (FASE 3 - Con animaciones)
     */
    render() {
        if (this._renderer && this._scene && this._camera) {
            // Calcular delta time para animaciones
            const currentTime = performance.now();
            const deltaTime = (currentTime - this._lastTime) / 1000;
            this._lastTime = currentTime;
            
            // Actualizar animaciones del punto de dibujo
            if (this._drawPointModel) {
                this._drawPointModel.updateAnimation(deltaTime);
                this._drawPointModel.updateTrail(deltaTime);
                
                // Solo actualizar visualmente si hay cambios significativos
                if (this._drawPointModel.isDragging || 
                    this._drawPointModel.isHovered ||
                    this._drawPointModel.trailPoints.length > 0 ||
                    this._drawPointModel.isMoving()) {
                    this.updateDrawPointPosition();
                }
            }
            
            this._renderer.render(this._scene, this._camera);
            this._needsUpdate = false;
        }
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
        return this._needsUpdate;
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
        const aspect = width / height;
        const frustumSize = CONFIG.CAMERA.CONFIG_PANEL.FRUSTUM_SIZE;

        this._camera.left = -frustumSize * aspect / 2;
        this._camera.right = frustumSize * aspect / 2;
        this._camera.top = frustumSize / 2;
        this._camera.bottom = -frustumSize / 2;
        this._camera.updateProjectionMatrix();

        this._renderer.setSize(width, height);
        this._needsUpdate = true;
    }

    // ==========================================
    // MÉTODOS DE LIMPIEZA
    // ==========================================

    /**
     * Libera todos los recursos
     */
    dispose() {
        this._clearShapeVisual();
        this._clearDrawPointVisual();

        if (this._gridHelper) {
            this._scene.remove(this._gridHelper);
            this._gridHelper.geometry.dispose();
            this._gridHelper.material.dispose();
        }

        // FASE 3: Limpiar nuevos objetos
        if (this._snapIndicator) {
            this._scene.remove(this._snapIndicator);
            this._snapIndicator.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }

        if (this._trailGroup) {
            this._scene.remove(this._trailGroup);
            this._trailGroup.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            });
        }

        if (this._renderer) {
            this._renderer.dispose();
        }

        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._shapeModel = null;
        this._drawPointModel = null;
    }
}

export default ConfigPanelView;
