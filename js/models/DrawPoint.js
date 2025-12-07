/**
 * ============================================
 * DRAWPOINT.JS - Modelo del Punto de Dibujo
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que representa el punto de dibujo que
 * genera la trayectoria del ciclógono al rodar
 * la forma sobre una superficie.
 * 
 * FASE 3: Mejorado con estados visuales y animaciones
 */

import { CONFIG } from '../config/constants.js';
import Polygon from './Polygon.js';
import Circle from './Circle.js';

/**
 * Estados visuales del punto de dibujo
 * @enum {string}
 */
export const DrawPointState = {
    IDLE: 'idle',
    HOVERED: 'hovered',
    DRAGGING: 'dragging',
    SNAPPED: 'snapped',
    SNAP_DRAGGING: 'snap_dragging'
};

/**
 * Clase que representa el punto de dibujo
 */
export class DrawPoint {
    /**
     * Crea un punto de dibujo
     * @param {number} x - Coordenada X inicial
     * @param {number} y - Coordenada Y inicial
     */
    constructor(x = 0, y = 0) {
        this._position = { x, y };
        this._targetPosition = { x, y }; // Para animaciones suaves
        this._isSnappedToEdge = false;
        this._snappedEdgeIndex = null;
        this._edgeParameter = 0; // Parámetro t (0-1) de posición en la arista
        this._snappedAngle = null; // Para snap en círculo
        
        // Propiedades visuales
        this._radius = CONFIG.DRAW_POINT.RADIUS;
        this._color = CONFIG.DRAW_POINT.COLOR;
        this._hoverColor = CONFIG.DRAW_POINT.HOVER_COLOR;
        this._isHovered = false;
        this._isDragging = false;
        
        // FASE 3: Nuevas propiedades para feedback visual mejorado
        this._visualState = DrawPointState.IDLE;
        this._animationProgress = 1; // 0-1, para transiciones
        this._pulsePhase = 0; // Para efecto de pulso
        this._snapIndicatorVisible = false;
        this._trailPoints = []; // Para efecto de trail al arrastrar
        this._maxTrailPoints = 10;
        
        // Colores adicionales para estados
        this._colors = {
            idle: CONFIG.DRAW_POINT.COLOR,
            hovered: CONFIG.DRAW_POINT.HOVER_COLOR,
            dragging: 0xff7ab8,
            snapped: 0x00ff88,
            snapDragging: 0x4cc9f0
        };
        
        // Escalas para diferentes estados
        this._scales = {
            idle: 1.0,
            hovered: 1.15,
            dragging: 1.25,
            snapped: 1.1,
            snapDragging: 1.2
        };
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /** @returns {Object} Posición actual {x, y} */
    get position() {
        return { ...this._position };
    }

    /** @returns {number} Coordenada X */
    get x() {
        return this._position.x;
    }

    /** @returns {number} Coordenada Y */
    get y() {
        return this._position.y;
    }

    /** @returns {boolean} Si está fijado a un borde */
    get isSnappedToEdge() {
        return this._isSnappedToEdge;
    }

    /** @returns {number|null} Índice de la arista a la que está fijado */
    get snappedEdgeIndex() {
        return this._snappedEdgeIndex;
    }

    /** @returns {number} Parámetro de posición en la arista (0-1) */
    get edgeParameter() {
        return this._edgeParameter;
    }

    /** @returns {number|null} Ángulo de snap en círculo */
    get snappedAngle() {
        return this._snappedAngle;
    }

    /** @returns {number} Radio visual del punto */
    get radius() {
        return this._radius;
    }

    /** @returns {boolean} Si el mouse está sobre el punto */
    get isHovered() {
        return this._isHovered;
    }

    /** @returns {boolean} Si se está arrastrando */
    get isDragging() {
        return this._isDragging;
    }

    /** @returns {DrawPointState} Estado visual actual */
    get visualState() {
        return this._visualState;
    }

    /** @returns {number} Progreso de animación (0-1) */
    get animationProgress() {
        return this._animationProgress;
    }

    /** @returns {number} Fase de pulso para animación */
    get pulsePhase() {
        return this._pulsePhase;
    }

    /** @returns {boolean} Si el indicador de snap es visible */
    get snapIndicatorVisible() {
        return this._snapIndicatorVisible;
    }

    /** @returns {Array} Puntos del trail de arrastre */
    get trailPoints() {
        return [...this._trailPoints];
    }

    /** @returns {Object} Posición objetivo para animación suave */
    get targetPosition() {
        return { ...this._targetPosition };
    }

    // ==========================================
    // SETTERS
    // ==========================================

    /** @param {boolean} value */
    set isHovered(value) {
        this._isHovered = value;
        this._updateVisualState();
    }

    /** @param {boolean} value */
    set isDragging(value) {
        this._isDragging = value;
        this._updateVisualState();
        
        // Limpiar trail cuando termina el arrastre
        if (!value) {
            this._trailPoints = [];
        }
    }

    /** @param {boolean} value */
    set snapIndicatorVisible(value) {
        this._snapIndicatorVisible = value;
    }

    // ==========================================
    // MÉTODOS DE ESTADO VISUAL (FASE 3)
    // ==========================================

    /**
     * Actualiza el estado visual basado en las condiciones actuales
     * @private
     */
    _updateVisualState() {
        if (this._isDragging && this._isSnappedToEdge) {
            this._visualState = DrawPointState.SNAP_DRAGGING;
        } else if (this._isDragging) {
            this._visualState = DrawPointState.DRAGGING;
        } else if (this._isSnappedToEdge && !this._isHovered) {
            this._visualState = DrawPointState.SNAPPED;
        } else if (this._isHovered) {
            this._visualState = DrawPointState.HOVERED;
        } else {
            this._visualState = DrawPointState.IDLE;
        }
        
        // Resetear progreso de animación para nueva transición
        this._animationProgress = 0;
    }

    /**
     * Actualiza las animaciones del punto (llamar cada frame)
     * @param {number} deltaTime - Tiempo transcurrido en segundos
     */
    updateAnimation(deltaTime) {
        // Actualizar progreso de animación
        if (this._animationProgress < 1) {
            this._animationProgress = Math.min(1, this._animationProgress + deltaTime * 5);
        }
        
        // Actualizar fase de pulso
        this._pulsePhase += deltaTime * 3;
        if (this._pulsePhase > Math.PI * 2) {
            this._pulsePhase -= Math.PI * 2;
        }
        
        // Interpolar posición hacia el objetivo (movimiento suave)
        const lerpFactor = Math.min(1, deltaTime * 15);
        this._position.x += (this._targetPosition.x - this._position.x) * lerpFactor;
        this._position.y += (this._targetPosition.y - this._position.y) * lerpFactor;
    }

    /**
     * Añade un punto al trail de arrastre
     * @private
     */
    _addTrailPoint() {
        if (this._isDragging) {
            this._trailPoints.push({
                x: this._position.x,
                y: this._position.y,
                alpha: 1.0
            });
            
            // Limitar cantidad de puntos
            if (this._trailPoints.length > this._maxTrailPoints) {
                this._trailPoints.shift();
            }
        }
    }

    /**
     * Actualiza el trail (llamar cada frame)
     * @param {number} deltaTime - Tiempo transcurrido en segundos
     */
    updateTrail(deltaTime) {
        // Desvanecer puntos del trail
        for (let i = this._trailPoints.length - 1; i >= 0; i--) {
            this._trailPoints[i].alpha -= deltaTime * 3;
            if (this._trailPoints[i].alpha <= 0) {
                this._trailPoints.splice(i, 1);
            }
        }
    }

    // ==========================================
    // MÉTODOS DE POSICIONAMIENTO
    // ==========================================

    /**
     * Establece la posición del punto
     * @param {number} x - Nueva coordenada X
     * @param {number} y - Nueva coordenada Y
     * @param {boolean} immediate - Si es true, mueve inmediatamente sin animación
     */
    setPosition(x, y, immediate = false) {
        this._targetPosition.x = x;
        this._targetPosition.y = y;
        
        if (immediate) {
            this._position.x = x;
            this._position.y = y;
        }
        
        // Añadir al trail si está arrastrando
        if (this._isDragging) {
            this._addTrailPoint();
        }
        
        this._clearSnap();
    }

    /**
     * Mueve el punto por un delta
     * @param {number} dx - Desplazamiento en X
     * @param {number} dy - Desplazamiento en Y
     * @param {boolean} immediate - Si es true, mueve inmediatamente
     */
    moveBy(dx, dy, immediate = false) {
        this._targetPosition.x += dx;
        this._targetPosition.y += dy;
        
        if (immediate) {
            this._position.x = this._targetPosition.x;
            this._position.y = this._targetPosition.y;
        }
        
        if (this._isDragging) {
            this._addTrailPoint();
        }
        
        this._clearSnap();
    }

    /**
     * Limpia el estado de snap
     * @private
     */
    _clearSnap() {
        this._isSnappedToEdge = false;
        this._snappedEdgeIndex = null;
        this._edgeParameter = 0;
        this._snappedAngle = null;
    }

    // ==========================================
    // MÉTODOS DE SNAP
    // ==========================================

    /**
     * Hace snap del punto a una arista de un polígono
     * @param {Polygon} polygon - Polígono de referencia
     * @param {number} edgeIndex - Índice de la arista
     * @param {number} t - Parámetro de posición en la arista (0-1)
     */
    snapToPolygonEdge(polygon, edgeIndex, t) {
        const edge = polygon.getEdge(edgeIndex);
        const point = edge.getPointAt(t);
        
        this._position.x = point.x;
        this._position.y = point.y;
        this._isSnappedToEdge = true;
        this._snappedEdgeIndex = edgeIndex;
        this._edgeParameter = t;
        this._snappedAngle = null;
    }

    /**
     * Hace snap del punto al borde de un círculo
     * @param {Circle} circle - Círculo de referencia
     * @param {number} angle - Ángulo en radianes
     */
    snapToCircleBorder(circle, angle) {
        const point = circle.getPointOnCircle(angle);
        
        this._position.x = point.x;
        this._position.y = point.y;
        this._isSnappedToEdge = true;
        this._snappedEdgeIndex = null;
        this._edgeParameter = 0;
        this._snappedAngle = angle;
    }

    /**
     * Hace snap automático al borde más cercano del polígono
     * @param {Polygon} polygon - Polígono de referencia
     * @returns {Object} Información del snap { edgeIndex, t, point }
     */
    snapToNearestPolygonEdge(polygon) {
        const result = polygon.findClosestEdge(this._position);
        
        this._position.x = result.closestPoint.x;
        this._position.y = result.closestPoint.y;
        this._isSnappedToEdge = true;
        this._snappedEdgeIndex = result.edgeIndex;
        this._edgeParameter = result.t;
        this._snappedAngle = null;

        return {
            edgeIndex: result.edgeIndex,
            t: result.t,
            point: result.closestPoint
        };
    }

    /**
     * Hace snap automático al borde del círculo
     * @param {Circle} circle - Círculo de referencia
     * @returns {Object} Información del snap { angle, point }
     */
    snapToCircle(circle) {
        const projected = circle.projectToBorder(this._position);
        
        this._position.x = projected.x;
        this._position.y = projected.y;
        this._isSnappedToEdge = true;
        this._snappedEdgeIndex = null;
        this._edgeParameter = 0;
        this._snappedAngle = projected.angle;

        return {
            angle: projected.angle,
            point: { x: projected.x, y: projected.y }
        };
    }

    /**
     * Método genérico para snap al borde de cualquier forma
     * @param {Polygon|Circle} shape - Forma (polígono o círculo)
     * @returns {Object} Información del snap
     */
    snapToShape(shape) {
        if (shape instanceof Polygon) {
            return this.snapToNearestPolygonEdge(shape);
        } else if (shape instanceof Circle) {
            return this.snapToCircle(shape);
        } else {
            throw new Error('Forma no soportada para snap');
        }
    }

    // ==========================================
    // MÉTODOS DE CÁLCULO
    // ==========================================

    /**
     * Calcula la distancia desde el origen (0, 0)
     * @returns {number} Distancia al origen
     */
    getDistanceFromOrigin() {
        return Math.sqrt(this._position.x ** 2 + this._position.y ** 2);
    }

    /**
     * Calcula la distancia desde un punto dado
     * @param {Object} point - Punto {x, y}
     * @returns {number} Distancia
     */
    getDistanceFrom(point) {
        const dx = this._position.x - point.x;
        const dy = this._position.y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calcula el ángulo desde el origen al punto
     * @returns {number} Ángulo en radianes
     */
    getAngleFromOrigin() {
        return Math.atan2(this._position.y, this._position.x);
    }

    /**
     * Verifica si un punto dado está dentro del área clickeable del punto de dibujo
     * @param {Object} point - Punto {x, y}
     * @param {number} tolerance - Tolerancia adicional (default: 0.1)
     * @returns {boolean} true si está dentro
     */
    containsPoint(point, tolerance = 0.1) {
        const distance = this.getDistanceFrom(point);
        return distance <= (this._radius + tolerance);
    }

    /**
     * Calcula el parámetro d para la fórmula de la cicloide
     * d = distancia_al_centro / radio_forma
     * @param {number} shapeRadius - Radio de la forma
     * @returns {number} Parámetro d
     */
    getCycloidParameter(shapeRadius) {
        return this.getDistanceFromOrigin() / shapeRadius;
    }

    // ==========================================
    // MÉTODOS DE POSICIONAMIENTO INICIAL
    // ==========================================

    /**
     * Posiciona el punto en la parte superior de un círculo
     * @param {Circle} circle - Círculo de referencia
     */
    resetToCircleTop(circle) {
        const topPoint = circle.getTopPoint();
        this._position.x = topPoint.x;
        this._position.y = topPoint.y;
        this._isSnappedToEdge = true;
        this._snappedAngle = Math.PI / 2;
        this._snappedEdgeIndex = null;
        this._edgeParameter = 0;
    }

    /**
     * Posiciona el punto en el vértice superior de un polígono
     * @param {Polygon} polygon - Polígono de referencia
     */
    resetToPolygonTop(polygon) {
        const topVertex = polygon.getTopVertex();
        this._position.x = topVertex.x;
        this._position.y = topVertex.y;
        this._isSnappedToEdge = true;
        this._snappedEdgeIndex = topVertex.index;
        this._edgeParameter = 0;
        this._snappedAngle = null;
    }

    /**
     * Método genérico para posicionar en la parte superior de cualquier forma
     * @param {Polygon|Circle} shape - Forma (polígono o círculo)
     */
    resetToShapeTop(shape) {
        if (shape instanceof Polygon) {
            this.resetToPolygonTop(shape);
        } else if (shape instanceof Circle) {
            this.resetToCircleTop(shape);
        } else {
            throw new Error('Forma no soportada');
        }
    }

    // ==========================================
    // MÉTODOS VISUALES (MEJORADOS FASE 3)
    // ==========================================

    /**
     * Obtiene el color actual del punto basado en el estado visual
     * @returns {number} Color hexadecimal
     */
    getCurrentColor() {
        switch (this._visualState) {
            case DrawPointState.SNAP_DRAGGING:
                return this._colors.snapDragging;
            case DrawPointState.DRAGGING:
                return this._colors.dragging;
            case DrawPointState.SNAPPED:
                return this._colors.snapped;
            case DrawPointState.HOVERED:
                return this._colors.hovered;
            default:
                return this._colors.idle;
        }
    }

    /**
     * Obtiene el radio visual actual basado en el estado
     * @returns {number} Radio
     */
    getCurrentRadius() {
        const baseScale = this._scales[this._visualState] || 1.0;
        
        // Añadir efecto de pulso si está en hover o snapped
        let pulseEffect = 0;
        if (this._visualState === DrawPointState.HOVERED || 
            this._visualState === DrawPointState.SNAPPED) {
            pulseEffect = Math.sin(this._pulsePhase) * 0.05;
        }
        
        return this._radius * (baseScale + pulseEffect);
    }

    /**
     * Obtiene la escala actual para el anillo exterior
     * @returns {number} Escala
     */
    getRingScale() {
        const baseScale = this._scales[this._visualState] || 1.0;
        
        // Añadir pulso más pronunciado al anillo
        let pulseEffect = 0;
        if (this._visualState !== DrawPointState.IDLE) {
            pulseEffect = Math.sin(this._pulsePhase * 1.5) * 0.1;
        }
        
        return baseScale + pulseEffect;
    }

    /**
     * Obtiene la opacidad del anillo exterior
     * @returns {number} Opacidad (0-1)
     */
    getRingOpacity() {
        switch (this._visualState) {
            case DrawPointState.SNAP_DRAGGING:
                return 0.95;
            case DrawPointState.DRAGGING:
                return 0.85;
            case DrawPointState.SNAPPED:
                return 0.8;
            case DrawPointState.HOVERED:
                return 0.7;
            default:
                return 0.5;
        }
    }

    /**
     * Obtiene el color del anillo exterior
     * @returns {number} Color hexadecimal
     */
    getRingColor() {
        if (this._isSnappedToEdge) {
            return 0x00ff88; // Verde para indicar snap
        }
        return 0xffffff;
    }

    /**
     * Obtiene información visual completa para renderizado
     * @returns {Object} Información visual del punto
     */
    getVisualInfo() {
        return {
            color: this.getCurrentColor(),
            radius: this.getCurrentRadius(),
            ringScale: this.getRingScale(),
            ringOpacity: this.getRingOpacity(),
            ringColor: this.getRingColor(),
            state: this._visualState,
            isSnapped: this._isSnappedToEdge,
            snapIndicatorVisible: this._snapIndicatorVisible,
            trailPoints: this._trailPoints,
            pulsePhase: this._pulsePhase
        };
    }

    // ==========================================
    // MÉTODOS DE SERIALIZACIÓN
    // ==========================================

    /**
     * Convierte el punto a un objeto plano
     * @returns {Object} Representación del punto
     */
    toJSON() {
        return {
            position: { ...this._position },
            isSnappedToEdge: this._isSnappedToEdge,
            snappedEdgeIndex: this._snappedEdgeIndex,
            edgeParameter: this._edgeParameter,
            snappedAngle: this._snappedAngle,
            distanceFromOrigin: this.getDistanceFromOrigin(),
            angleFromOrigin: this.getAngleFromOrigin()
        };
    }

    /**
     * Crea un punto de dibujo desde un objeto JSON
     * @param {Object} json - Objeto con datos del punto
     * @returns {DrawPoint} Nueva instancia
     */
    static fromJSON(json) {
        const point = new DrawPoint(json.position.x, json.position.y);
        point._isSnappedToEdge = json.isSnappedToEdge;
        point._snappedEdgeIndex = json.snappedEdgeIndex;
        point._edgeParameter = json.edgeParameter;
        point._snappedAngle = json.snappedAngle;
        return point;
    }

    /**
     * Crea una copia del punto
     * @returns {DrawPoint} Nueva instancia
     */
    clone() {
        const cloned = new DrawPoint(this._position.x, this._position.y);
        cloned._isSnappedToEdge = this._isSnappedToEdge;
        cloned._snappedEdgeIndex = this._snappedEdgeIndex;
        cloned._edgeParameter = this._edgeParameter;
        cloned._snappedAngle = this._snappedAngle;
        return cloned;
    }

    /**
     * Representación en string para debugging
     * @returns {string}
     */
    toString() {
        const snapInfo = this._isSnappedToEdge 
            ? (this._snappedAngle !== null 
                ? `snapped to angle ${(this._snappedAngle * 180 / Math.PI).toFixed(1)}°`
                : `snapped to edge ${this._snappedEdgeIndex} at t=${this._edgeParameter.toFixed(3)}`)
            : 'free';
        
        return `DrawPoint(x=${this._position.x.toFixed(3)}, y=${this._position.y.toFixed(3)}, ${snapInfo})`;
    }
}

export default DrawPoint;
