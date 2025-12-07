/**
 * ============================================
 * INPUTCONTROLLER.JS - Controlador de Entrada
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Controlador dedicado para manejar todos los eventos
 * de entrada del usuario: mouse, teclado y touch.
 * Implementa un sistema de eventos desacoplado
 * para comunicarse con otros componentes.
 * 
 * FASE 3: Interactividad del Punto
 */

import * as THREE from 'three';
import { CONFIG, MATH } from '../config/constants.js';

/**
 * Estados posibles del controlador de entrada
 * @enum {string}
 */
export const InputState = {
    IDLE: 'idle',
    HOVERING: 'hovering',
    DRAGGING: 'dragging',
    SNAP_MODE: 'snap_mode'
};

/**
 * Tipos de eventos emitidos por el controlador
 * @enum {string}
 */
export const InputEventType = {
    DRAG_START: 'dragStart',
    DRAG_MOVE: 'dragMove',
    DRAG_END: 'dragEnd',
    HOVER_ENTER: 'hoverEnter',
    HOVER_LEAVE: 'hoverLeave',
    SNAP_MODE_CHANGE: 'snapModeChange',
    CLICK: 'click',
    DOUBLE_CLICK: 'doubleClick'
};

/**
 * Controlador de entrada del usuario
 */
export class InputController {
    /**
     * Crea un controlador de entrada
     * @param {HTMLCanvasElement} canvas - Canvas sobre el que escuchar eventos
     * @param {THREE.OrthographicCamera} camera - Cámara para conversión de coordenadas
     */
    constructor(canvas, camera) {
        if (!canvas || !camera) {
            throw new Error('Canvas y camera son requeridos para InputController');
        }

        this._canvas = canvas;
        this._camera = camera;

        // Estado interno
        this._state = InputState.IDLE;
        this._isSnapModeActive = false;
        this._isDragging = false;
        this._isHovering = false;

        // Coordenadas actuales
        this._mousePosition = { x: 0, y: 0 };      // Coordenadas de pantalla normalizadas (-1 a 1)
        this._worldPosition = { x: 0, y: 0 };      // Coordenadas del mundo
        this._lastWorldPosition = { x: 0, y: 0 };  // Posición anterior (para calcular delta)
        this._dragStartPosition = { x: 0, y: 0 };  // Posición de inicio del arrastre

        // Sistema de eventos
        this._eventListeners = new Map();

        // Configuración
        this._doubleClickThreshold = 300; // ms
        this._lastClickTime = 0;

        // Raycaster para detección precisa
        this._raycaster = new THREE.Raycaster();

        // Target actual (objeto sobre el que se detecta interacción)
        this._currentTarget = null;
        this._hitTestCallback = null;

        // Bind de métodos para event listeners
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onContextMenu = this._onContextMenu.bind(this);

        // Inicializar
        this._setupEventListeners();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /** @returns {InputState} Estado actual del controlador */
    get state() {
        return this._state;
    }

    /** @returns {boolean} Si el modo snap está activo */
    get isSnapModeActive() {
        return this._isSnapModeActive;
    }

    /** @returns {boolean} Si se está arrastrando */
    get isDragging() {
        return this._isDragging;
    }

    /** @returns {boolean} Si el mouse está sobre un objetivo */
    get isHovering() {
        return this._isHovering;
    }

    /** @returns {Object} Posición del mouse en coordenadas normalizadas */
    get mousePosition() {
        return { ...this._mousePosition };
    }

    /** @returns {Object} Posición del mouse en coordenadas del mundo */
    get worldPosition() {
        return { ...this._worldPosition };
    }

    /** @returns {Object} Delta desde la última posición */
    get worldDelta() {
        return {
            x: this._worldPosition.x - this._lastWorldPosition.x,
            y: this._worldPosition.y - this._lastWorldPosition.y
        };
    }

    /** @returns {Object} Posición inicial del arrastre */
    get dragStartPosition() {
        return { ...this._dragStartPosition };
    }

    // ==========================================
    // SETTERS / CONFIGURACIÓN
    // ==========================================

    /**
     * Establece la función de callback para hit testing
     * Esta función debe retornar true si el punto dado está sobre un objeto interactivo
     * @param {Function} callback - (worldPosition) => boolean
     */
    setHitTestCallback(callback) {
        this._hitTestCallback = callback;
    }

    /**
     * Actualiza la referencia de la cámara
     * @param {THREE.OrthographicCamera} camera
     */
    updateCamera(camera) {
        this._camera = camera;
    }

    // ==========================================
    // SISTEMA DE EVENTOS
    // ==========================================

    /**
     * Suscribe un listener a un tipo de evento
     * @param {InputEventType} eventType - Tipo de evento
     * @param {Function} callback - Función a ejecutar
     * @returns {Function} Función para desuscribirse
     */
    on(eventType, callback) {
        if (!this._eventListeners.has(eventType)) {
            this._eventListeners.set(eventType, new Set());
        }
        this._eventListeners.get(eventType).add(callback);

        // Retornar función para desuscribirse
        return () => this.off(eventType, callback);
    }

    /**
     * Desuscribe un listener de un tipo de evento
     * @param {InputEventType} eventType - Tipo de evento
     * @param {Function} callback - Función a remover
     */
    off(eventType, callback) {
        if (this._eventListeners.has(eventType)) {
            this._eventListeners.get(eventType).delete(callback);
        }
    }

    /**
     * Emite un evento a todos los listeners suscritos
     * @param {InputEventType} eventType - Tipo de evento
     * @param {Object} data - Datos del evento
     * @private
     */
    _emit(eventType, data = {}) {
        const eventData = {
            type: eventType,
            state: this._state,
            mousePosition: { ...this._mousePosition },
            worldPosition: { ...this._worldPosition },
            isSnapMode: this._isSnapModeActive,
            timestamp: Date.now(),
            ...data
        };

        if (this._eventListeners.has(eventType)) {
            this._eventListeners.get(eventType).forEach(callback => {
                try {
                    callback(eventData);
                } catch (error) {
                    console.error(`Error en listener de ${eventType}:`, error);
                }
            });
        }
    }

    // ==========================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ==========================================

    /**
     * Configura todos los event listeners
     * @private
     */
    _setupEventListeners() {
        // Mouse events
        this._canvas.addEventListener('mousedown', this._onMouseDown);
        this._canvas.addEventListener('mousemove', this._onMouseMove);
        this._canvas.addEventListener('mouseup', this._onMouseUp);
        this._canvas.addEventListener('mouseleave', this._onMouseLeave);
        this._canvas.addEventListener('contextmenu', this._onContextMenu);

        // Touch events (para dispositivos táctiles)
        this._canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
        this._canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
        this._canvas.addEventListener('touchend', this._onTouchEnd);

        // Keyboard events (en window para capturar siempre)
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
    }

    /**
     * Remueve todos los event listeners
     */
    dispose() {
        // Mouse events
        this._canvas.removeEventListener('mousedown', this._onMouseDown);
        this._canvas.removeEventListener('mousemove', this._onMouseMove);
        this._canvas.removeEventListener('mouseup', this._onMouseUp);
        this._canvas.removeEventListener('mouseleave', this._onMouseLeave);
        this._canvas.removeEventListener('contextmenu', this._onContextMenu);

        // Touch events
        this._canvas.removeEventListener('touchstart', this._onTouchStart);
        this._canvas.removeEventListener('touchmove', this._onTouchMove);
        this._canvas.removeEventListener('touchend', this._onTouchEnd);

        // Keyboard events
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);

        // Limpiar listeners de eventos internos
        this._eventListeners.clear();
    }

    // ==========================================
    // CONVERSIÓN DE COORDENADAS
    // ==========================================

    /**
     * Convierte coordenadas de evento del mouse a coordenadas normalizadas (-1 a 1)
     * @param {MouseEvent|Touch} event
     * @returns {Object} { x, y } normalizados
     * @private
     */
    _getMouseCoords(event) {
        const rect = this._canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    /**
     * Convierte coordenadas normalizadas a coordenadas del mundo
     * @param {number} normalizedX
     * @param {number} normalizedY
     * @returns {Object} { x, y } en coordenadas del mundo
     * @private
     */
    _screenToWorld(normalizedX, normalizedY) {
        const vector = new THREE.Vector3(normalizedX, normalizedY, 0);
        vector.unproject(this._camera);
        return { x: vector.x, y: vector.y };
    }

    /**
     * Actualiza las posiciones internas basándose en un evento
     * @param {MouseEvent|Touch} event
     * @private
     */
    _updatePositions(event) {
        // Guardar posición anterior
        this._lastWorldPosition.x = this._worldPosition.x;
        this._lastWorldPosition.y = this._worldPosition.y;

        // Calcular nuevas posiciones
        this._mousePosition = this._getMouseCoords(event);
        this._worldPosition = this._screenToWorld(this._mousePosition.x, this._mousePosition.y);
    }

    // ==========================================
    // HIT TESTING
    // ==========================================

    /**
     * Verifica si el punto actual está sobre un objeto interactivo
     * @returns {boolean}
     * @private
     */
    _performHitTest() {
        if (this._hitTestCallback) {
            return this._hitTestCallback(this._worldPosition);
        }
        return false;
    }

    // ==========================================
    // MANEJADORES DE EVENTOS - MOUSE
    // ==========================================

    /**
     * Manejador de mousedown
     * @param {MouseEvent} event
     * @private
     */
    _onMouseDown(event) {
        if (event.button !== 0) return; // Solo botón izquierdo

        this._updatePositions(event);

        // Verificar si se hizo clic en un objeto interactivo
        const isOverTarget = this._performHitTest();

        if (isOverTarget) {
            this._isDragging = true;
            this._dragStartPosition = { ...this._worldPosition };
            this._state = this._isSnapModeActive ? InputState.SNAP_MODE : InputState.DRAGGING;
            this._canvas.style.cursor = 'grabbing';

            this._emit(InputEventType.DRAG_START, {
                startPosition: this._dragStartPosition
            });

            // Detectar doble clic
            const now = Date.now();
            if (now - this._lastClickTime < this._doubleClickThreshold) {
                this._emit(InputEventType.DOUBLE_CLICK);
            }
            this._lastClickTime = now;
        }
    }

    /**
     * Manejador de mousemove
     * @param {MouseEvent} event
     * @private
     */
    _onMouseMove(event) {
        this._updatePositions(event);

        if (this._isDragging) {
            // Actualizar estado si cambió el modo snap
            this._state = this._isSnapModeActive ? InputState.SNAP_MODE : InputState.DRAGGING;

            this._emit(InputEventType.DRAG_MOVE, {
                delta: this.worldDelta,
                totalDelta: {
                    x: this._worldPosition.x - this._dragStartPosition.x,
                    y: this._worldPosition.y - this._dragStartPosition.y
                }
            });
        } else {
            // Verificar hover
            const isOverTarget = this._performHitTest();

            if (isOverTarget && !this._isHovering) {
                // Entrar en hover
                this._isHovering = true;
                this._state = InputState.HOVERING;
                this._canvas.style.cursor = 'grab';
                this._emit(InputEventType.HOVER_ENTER);
            } else if (!isOverTarget && this._isHovering) {
                // Salir de hover
                this._isHovering = false;
                this._state = InputState.IDLE;
                this._canvas.style.cursor = 'default';
                this._emit(InputEventType.HOVER_LEAVE);
            }
        }
    }

    /**
     * Manejador de mouseup
     * @param {MouseEvent} event
     * @private
     */
    _onMouseUp(event) {
        if (!this._isDragging) return;

        this._updatePositions(event);
        this._isDragging = false;

        const wasOverTarget = this._performHitTest();
        this._state = wasOverTarget ? InputState.HOVERING : InputState.IDLE;
        this._canvas.style.cursor = wasOverTarget ? 'grab' : 'default';

        this._emit(InputEventType.DRAG_END, {
            startPosition: this._dragStartPosition,
            endPosition: { ...this._worldPosition },
            totalDelta: {
                x: this._worldPosition.x - this._dragStartPosition.x,
                y: this._worldPosition.y - this._dragStartPosition.y
            }
        });

        // Emitir click si no hubo mucho movimiento
        const distance = Math.sqrt(
            Math.pow(this._worldPosition.x - this._dragStartPosition.x, 2) +
            Math.pow(this._worldPosition.y - this._dragStartPosition.y, 2)
        );
        if (distance < 0.01) {
            this._emit(InputEventType.CLICK);
        }
    }

    /**
     * Manejador de mouseleave
     * @param {MouseEvent} event
     * @private
     */
    _onMouseLeave(event) {
        if (this._isDragging) {
            // Terminar arrastre si sale del canvas
            this._onMouseUp(event);
        }

        if (this._isHovering) {
            this._isHovering = false;
            this._state = InputState.IDLE;
            this._emit(InputEventType.HOVER_LEAVE);
        }

        this._canvas.style.cursor = 'default';
    }

    /**
     * Previene el menú contextual
     * @param {MouseEvent} event
     * @private
     */
    _onContextMenu(event) {
        event.preventDefault();
    }

    // ==========================================
    // MANEJADORES DE EVENTOS - TECLADO
    // ==========================================

    /**
     * Manejador de keydown
     * @param {KeyboardEvent} event
     * @private
     */
    _onKeyDown(event) {
        if (event.key === CONFIG.KEYS.SNAP_MODIFIER && !this._isSnapModeActive) {
            this._isSnapModeActive = true;

            // Actualizar estado si está arrastrando
            if (this._isDragging) {
                this._state = InputState.SNAP_MODE;
            }

            this._emit(InputEventType.SNAP_MODE_CHANGE, {
                isActive: true
            });
        }
    }

    /**
     * Manejador de keyup
     * @param {KeyboardEvent} event
     * @private
     */
    _onKeyUp(event) {
        if (event.key === CONFIG.KEYS.SNAP_MODIFIER && this._isSnapModeActive) {
            this._isSnapModeActive = false;

            // Actualizar estado si está arrastrando
            if (this._isDragging) {
                this._state = InputState.DRAGGING;
            }

            this._emit(InputEventType.SNAP_MODE_CHANGE, {
                isActive: false
            });
        }
    }

    // ==========================================
    // MANEJADORES DE EVENTOS - TOUCH
    // ==========================================

    /**
     * Manejador de touchstart
     * @param {TouchEvent} event
     * @private
     */
    _onTouchStart(event) {
        if (event.touches.length !== 1) return;
        event.preventDefault();

        // Simular mousedown con el primer touch
        this._updatePositions(event.touches[0]);

        const isOverTarget = this._performHitTest();

        if (isOverTarget) {
            this._isDragging = true;
            this._dragStartPosition = { ...this._worldPosition };
            this._state = InputState.DRAGGING;

            this._emit(InputEventType.DRAG_START, {
                startPosition: this._dragStartPosition,
                isTouch: true
            });
        }
    }

    /**
     * Manejador de touchmove
     * @param {TouchEvent} event
     * @private
     */
    _onTouchMove(event) {
        if (!this._isDragging || event.touches.length !== 1) return;
        event.preventDefault();

        this._updatePositions(event.touches[0]);

        this._emit(InputEventType.DRAG_MOVE, {
            delta: this.worldDelta,
            totalDelta: {
                x: this._worldPosition.x - this._dragStartPosition.x,
                y: this._worldPosition.y - this._dragStartPosition.y
            },
            isTouch: true
        });
    }

    /**
     * Manejador de touchend
     * @param {TouchEvent} event
     * @private
     */
    _onTouchEnd(event) {
        if (!this._isDragging) return;

        this._isDragging = false;
        this._state = InputState.IDLE;

        this._emit(InputEventType.DRAG_END, {
            startPosition: this._dragStartPosition,
            endPosition: { ...this._worldPosition },
            isTouch: true
        });
    }

    // ==========================================
    // MÉTODOS DE UTILIDAD
    // ==========================================

    /**
     * Resetea el estado del controlador
     */
    reset() {
        this._isDragging = false;
        this._isHovering = false;
        this._state = InputState.IDLE;
        this._canvas.style.cursor = 'default';
    }

    /**
     * Obtiene información de debug del estado actual
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            state: this._state,
            isDragging: this._isDragging,
            isHovering: this._isHovering,
            isSnapModeActive: this._isSnapModeActive,
            mousePosition: { ...this._mousePosition },
            worldPosition: { ...this._worldPosition },
            dragStartPosition: this._isDragging ? { ...this._dragStartPosition } : null
        };
    }
}

export default InputController;
