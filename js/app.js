/**
 * ============================================
 * APP.JS - Punto de Entrada de la Aplicación
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Este archivo inicializa la aplicación completa,
 * utilizando la arquitectura MVC con modelos,
 * vistas y controladores separados.
 * 
 * FASE 5: Integración de GraphPanelView para
 * separar la vista del panel gráfico
 */

import * as THREE from 'three';
import { CONFIG, UI_TEXT, MATH } from './config/constants.js';
import ConfigPanelView from './views/ConfigPanelView.js';
import GraphPanelView from './views/GraphPanelView.js';
import Polygon from './models/Polygon.js';
import Circle from './models/Circle.js';
import DrawPoint from './models/DrawPoint.js';
import Cyclogon from './models/Cyclogon.js';
import InputController, { InputEventType, InputState } from './controllers/InputController.js';
import CyclogonCalculator, { CurveType } from './services/CyclogonCalculator.js';
import ExportService, { ExportFormat } from './services/ExportService.js';
import { AnimationController } from './controllers/AnimationController.js';
import { AnimationControlsView } from './views/AnimationControlsView.js';

/**
 * ============================================
 * CLASE PRINCIPAL DE LA APLICACIÓN
 * ============================================
 */
class CyclogonApp {
    constructor() {
        // Referencias DOM
        this.configCanvas = null;
        this.graphCanvas = null;
        
        // Vistas (FASE 2 y FASE 5 - Arquitectura MVC)
        this.configPanelView = null;
        this.graphPanelView = null;  // FASE 5: Nueva vista del panel gráfico
        
        // FASE 3: Controlador de entrada
        this.inputController = null;
        
        // FASE 4: Calculador de ciclógonos
        this.cyclogonCalculator = null;
        this.currentCyclogon = null; // Modelo Cyclogon actual
        
        // FASE 6: Servicio de exportación
        this.exportService = null;
        
        // FASE 7: Módulo de Animación
        this.animationController = null;
        this.animationControlsView = null;
        
        // Estado de la aplicación
        this.state = {
            shapeType: CONFIG.SHAPES.DEFAULT_TYPE,
            polygonSides: CONFIG.SHAPES.DEFAULT_POLYGON_SIDES,
            cycles: CONFIG.CYCLOGON.DEFAULT_CYCLES,
            isShiftPressed: false,
            isDragging: false,
            exportFormat: ExportFormat.CSV,
            exportPrecision: CONFIG.EXPORT.DECIMAL_PRECISION
        };
        
        // Bind de métodos
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        
        // FASE 6: Throttling para optimización de rendimiento
        this._lastUpdateTime = 0;
        this._updateThrottle = 16; // ~60fps máximo para actualizaciones
        this._pendingUpdate = false;
    }
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log(`${UI_TEXT.TITLE} - Iniciando...`);
        
        try {
            // Obtener referencias al DOM
            this.getElements();
            
            // Inicializar vista del panel de configuración (FASE 2)
            this.initConfigPanelView();
            
            // FASE 3: Inicializar controlador de entrada
            this.initInputController();
            
            // FASE 4: Inicializar calculador de ciclógonos
            this.initCyclogonCalculator();
            
            // FASE 5: Inicializar vista del panel gráfico
            this.initGraphPanelView();
            
            // FASE 6: Inicializar servicio de exportación
            this.initExportService();
            
            // FASE 7: Inicializar módulos de animación
            this.initAnimationModules();
            
            // Configurar eventos (UI)
            this.setupEventListeners();
            
            // Calcular ciclógono inicial
            this.updateCyclogon();
            
            // Iniciar loop de renderizado
            this.animate();
            
            // Actualizar estado
            this.updateStatus('ready', UI_TEXT.READY);
            
            console.log(`${UI_TEXT.TITLE} - Inicializado correctamente`);
            console.log('Modelos cargados: Polygon, Circle, DrawPoint, Cyclogon');
            console.log('Vistas: ConfigPanelView, GraphPanelView');
            console.log('FASE 3: InputController integrado');
            console.log('FASE 4: CyclogonCalculator integrado');
            console.log('FASE 5: GraphPanelView integrado');
            console.log('FASE 6: ExportService integrado');
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.updateStatus('error', 'Error de inicialización');
        }
    }
    
    /**
     * Obtiene referencias a elementos del DOM
     */
    getElements() {
        this.configCanvas = document.getElementById('configCanvas');
        this.graphCanvas = document.getElementById('graphCanvas');
        
        // Elementos de UI
        this.elements = {
            // Selectores de forma
            shapeOptions: document.querySelectorAll('input[name="shapeType"]'),
            sidesSelector: document.getElementById('sidesSelector'),
            sidesInput: document.getElementById('sidesInput'),
            sidesMinus: document.getElementById('sidesMinus'),
            sidesPlus: document.getElementById('sidesPlus'),
            
            // Información del punto
            pointX: document.getElementById('pointX'),
            pointY: document.getElementById('pointY'),
            pointRadius: document.getElementById('pointRadius'),
            pointDistance: document.getElementById('pointDistance'),
            
            // Controles
            cyclesSlider: document.getElementById('cyclesSlider'),
            cyclesValue: document.getElementById('cyclesValue'),
            resetBtn: document.getElementById('resetBtn'),
            exportBtn: document.getElementById('exportBtn'),
            
            // Controles de gráfico
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            fitViewBtn: document.getElementById('fitViewBtn'),
            
            // FASE 6: Controles de exportación
            exportFormat: document.getElementById('exportFormat'),
            precisionValue: document.getElementById('precisionValue'),
            precisionMinus: document.getElementById('precisionMinus'),
            precisionPlus: document.getElementById('precisionPlus'),
            
            // Status
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText')
        };
    }
    
    /**
     * Inicializa la vista del panel de configuración (FASE 2)
     */
    initConfigPanelView() {
        this.configPanelView = new ConfigPanelView(this.configCanvas);
        
        // La vista ya inicializa con un círculo por defecto
        // Actualizamos la UI con la información inicial
        this.updatePointInfo();
    }
    
    /**
     * Inicializa el controlador de entrada (FASE 3)
     */
    initInputController() {
        // Crear controlador de entrada con el canvas y cámara del panel de configuración
        this.inputController = new InputController(
            this.configCanvas,
            this.configPanelView.camera
        );
        
        // Configurar callback de hit testing
        this.inputController.setHitTestCallback((worldPos) => {
            return this.configPanelView.isPointOverDrawPoint(worldPos);
        });
        
        // Suscribirse a eventos del controlador
        this.setupInputEvents();
    }
    
    /**
     * Inicializa el calculador de ciclógonos (FASE 4)
     */
    initCyclogonCalculator() {
        this.cyclogonCalculator = new CyclogonCalculator({
            pointsPerSide: CONFIG.CYCLOGON.POINTS_PER_SIDE,
            pointsPerRadian: CONFIG.CYCLOGON.POINTS_PER_RADIAN
        });
        
        console.log('CyclogonCalculator inicializado');
    }
    
    /**
     * Inicializa la vista del panel gráfico (FASE 5)
     */
    initGraphPanelView() {
        this.graphPanelView = new GraphPanelView(this.graphCanvas);
        console.log('GraphPanelView inicializado');
    }
    
    /**
     * Inicializa el servicio de exportación (FASE 6)
     */
    initExportService() {
        this.exportService = new ExportService({
            csv: {
                precision: this.state.exportPrecision,
                includeMetadata: true
            },
            svg: {
                width: 1200,
                height: 500,
                strokeWidth: 2
            },
            json: {
                precision: this.state.exportPrecision,
                pretty: true
            }
        });
        console.log('ExportService inicializado');
    }

    /**
     * Inicializa los módulos de animación (FASE 7)
     */
    initAnimationModules() {
        // 1. Inicializar Controlador
        this.animationController = new AnimationController({
            onUpdate: (progress) => {
                // Actualizar vista gráfica
                if (this.graphPanelView) {
                    this.graphPanelView.setAnimationProgress(progress);
                }
                // Actualizar slider de controles
                if (this.animationControlsView) {
                    this.animationControlsView.setProgress(progress);
                }
            },
            onComplete: () => {
                if (this.animationControlsView) {
                    this.animationControlsView.setPlaying(false);
                }
            }
        });

        // 2. Inicializar Vista de Controles
        const controlsContainer = document.getElementById('animationControls');
        if (controlsContainer) {
            this.animationControlsView = new AnimationControlsView(controlsContainer, {
                onPlay: () => {
                    this.animationController.play();
                    this.animationControlsView.setPlaying(true);
                },
                onPause: () => {
                    this.animationController.pause();
                    this.animationControlsView.setPlaying(false);
                },
                onStop: () => {
                    this.animationController.stop();
                    this.animationControlsView.setPlaying(false);
                },
                onStepForward: () => {
                    this.animationController.step(0.01); // 1% step
                    this.animationControlsView.setPlaying(false);
                },
                onStepBackward: () => {
                    this.animationController.step(-0.01);
                    this.animationControlsView.setPlaying(false);
                },
                onSeek: (value) => {
                    this.animationController.setProgress(value);
                }
            });
        }

        console.log('Módulos de animación inicializados');
    }
    
    /**
     * Configura los eventos del InputController (FASE 3)
     */
    setupInputEvents() {
        // Evento de inicio de arrastre
        this.inputController.on(InputEventType.DRAG_START, (event) => {
            this.state.isDragging = true;
            this.configPanelView.setDrawPointDragging(true);
            this.updateStatus('active', 'Arrastrando punto...');
        });
        
        // Evento de movimiento durante arrastre
        this.inputController.on(InputEventType.DRAG_MOVE, (event) => {
            const worldPos = event.worldPosition;
            const snapMode = event.isSnapMode;
            
            // Mover punto con snap si corresponde
            this.configPanelView.moveDrawPoint(worldPos.x, worldPos.y, snapMode);
            
            // Actualizar modo snap en la vista
            this.configPanelView.setSnapMode(snapMode);
            
            // Actualizar UI
            this.updatePointInfo();
            
            // FASE 6: Throttle para optimización - actualizar ciclógono con límite de frecuencia
            this.throttledUpdateCyclogon();
            
            // Actualizar estado visual
            if (snapMode) {
                this.updateStatus('active', 'Modo SNAP activo');
            }
        });
        
        // Evento de fin de arrastre
        this.inputController.on(InputEventType.DRAG_END, (event) => {
            this.state.isDragging = false;
            this.configPanelView.setDrawPointDragging(false);
            this.configPanelView.setSnapMode(false);
            this.updateStatus('ready', UI_TEXT.READY);
        });
        
        // Evento de hover enter
        this.inputController.on(InputEventType.HOVER_ENTER, (event) => {
            this.configPanelView.setDrawPointHovered(true);
        });
        
        // Evento de hover leave
        this.inputController.on(InputEventType.HOVER_LEAVE, (event) => {
            this.configPanelView.setDrawPointHovered(false);
        });
        
        // Evento de cambio de modo snap
        this.inputController.on(InputEventType.SNAP_MODE_CHANGE, (event) => {
            this.state.isShiftPressed = event.isActive;
            
            if (this.state.isDragging) {
                this.configPanelView.setSnapMode(event.isActive);
                
                // Actualizar posición con nuevo modo snap
                const worldPos = this.inputController.worldPosition;
                this.configPanelView.moveDrawPoint(worldPos.x, worldPos.y, event.isActive);
                this.updatePointInfo();
                this.updateCyclogon();
            }
            
            // Feedback visual en la UI
            if (event.isActive) {
                this.elements.statusText.textContent = 'SHIFT: Modo snap activo';
            } else if (!this.state.isDragging) {
                this.elements.statusText.textContent = UI_TEXT.READY;
            }
        });
        
        // Evento de doble clic (resetear posición del punto)
        this.inputController.on(InputEventType.DOUBLE_CLICK, (event) => {
            // Resetear punto a la posición superior de la forma
            if (this.state.shapeType === 'circle') {
                this.configPanelView.setCircle(CONFIG.SHAPES.DEFAULT_RADIUS);
            } else {
                this.configPanelView.setPolygon(
                    this.state.polygonSides,
                    CONFIG.SHAPES.DEFAULT_RADIUS
                );
            }
            this.updatePointInfo();
            this.updateCyclogon();
        });
    }
    
    /**
     * Actualiza el ciclógono con throttling para mejorar rendimiento
     * FASE 6: Optimización de rendimiento durante arrastres frecuentes
     */
    throttledUpdateCyclogon() {
        const now = performance.now();
        
        if (now - this._lastUpdateTime >= this._updateThrottle) {
            this._lastUpdateTime = now;
            this.updateCyclogon();
            this._pendingUpdate = false;
        } else if (!this._pendingUpdate) {
            this._pendingUpdate = true;
            setTimeout(() => {
                if (this._pendingUpdate) {
                    this.updateCyclogon();
                    this._pendingUpdate = false;
                    this._lastUpdateTime = performance.now();
                }
            }, this._updateThrottle);
        }
    }
    
    /**
     * Actualiza el ciclógono basado en el estado actual
     * FASE 4: Usa el servicio CyclogonCalculator para generar la curva
     * FASE 5: Usa GraphPanelView para visualizar
     */
    updateCyclogon() {
        const cycles = this.state.cycles;
        
        // Obtener posición del punto de dibujo desde la vista
        const drawPointInfo = this.configPanelView.getDrawPointInfo();
        if (!drawPointInfo) return;
        
        const drawPoint = { x: drawPointInfo.x, y: drawPointInfo.y };
        const shapeModel = this.configPanelView.shapeModel;
        
        // Usar el servicio CyclogonCalculator (FASE 4)
        try {
            this.currentCyclogon = this.cyclogonCalculator.generate(
                shapeModel,
                drawPoint,
                cycles
            );
            
            // FASE 5: Pasar el ciclógono a la vista del panel gráfico
            this.graphPanelView.setCyclogon(this.currentCyclogon);
            
            // FASE 7: Preparar animación (sin iniciarla automáticamente)
            // Solo preparamos los elementos visuales y mostramos la curva completa
            if (this.graphPanelView.prepareAnimationElements) {
                this.graphPanelView.prepareAnimationElements();
            }
            
            // Resetear controles de animación sin afectar la curva visible
            if (this.animationController) {
                this.animationController.reset();
            }
            if (this.animationControlsView) {
                this.animationControlsView.setPlaying(false);
                this.animationControlsView.setProgress(0);
            }
            
            // Log de información de la curva (solo en debug)
            if (CONFIG.APP.DEBUG) {
                console.log(`Curva generada: ${this.currentCyclogon.toString()}`);
                console.log(`Metadatos:`, this.currentCyclogon.metadata);
            }
        } catch (error) {
            console.error('Error al generar ciclógono:', error);
        }
    }
    
    /**
     * Configura los event listeners (FASE 3 - Simplificado)
     * La interacción con el punto ahora es manejada por InputController
     */
    setupEventListeners() {
        // Resize
        window.addEventListener('resize', this.onWindowResize);
        
        // Controles UI
        this.setupUIControls();
    }
    
    /**
     * Configura los controles de UI
     */
    setupUIControls() {
        // Selector de forma
        this.elements.shapeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.state.shapeType = e.target.value;
                this.elements.sidesSelector.style.display = 
                    this.state.shapeType === 'polygon' ? 'flex' : 'none';
                
                // Resetear estado del InputController para evitar congelamiento
                this.inputController.reset();
                this.state.isDragging = false;
                
                // Actualizar vista usando la nueva arquitectura
                if (this.state.shapeType === 'circle') {
                    this.configPanelView.setCircle(CONFIG.SHAPES.DEFAULT_RADIUS);
                } else {
                    this.configPanelView.setPolygon(
                        this.state.polygonSides, 
                        CONFIG.SHAPES.DEFAULT_RADIUS
                    );
                }
                
                this.updatePointInfo();
                this.updateCyclogon();
            });
        });
        
        // Selector de lados
        this.elements.sidesMinus.addEventListener('click', () => {
            if (this.state.polygonSides > CONFIG.SHAPES.MIN_POLYGON_SIDES) {
                // Resetear estado del InputController para evitar congelamiento
                this.inputController.reset();
                this.state.isDragging = false;
                
                this.state.polygonSides--;
                this.elements.sidesInput.value = this.state.polygonSides;
                this.configPanelView.updatePolygonSides(this.state.polygonSides);
                this.updatePointInfo();
                this.updateCyclogon();
            }
        });
        
        this.elements.sidesPlus.addEventListener('click', () => {
            if (this.state.polygonSides < CONFIG.SHAPES.MAX_POLYGON_SIDES) {
                // Resetear estado del InputController para evitar congelamiento
                this.inputController.reset();
                this.state.isDragging = false;
                
                this.state.polygonSides++;
                this.elements.sidesInput.value = this.state.polygonSides;
                this.configPanelView.updatePolygonSides(this.state.polygonSides);
                this.updatePointInfo();
                this.updateCyclogon();
            }
        });
        
        // Slider de ciclos
        this.elements.cyclesSlider.addEventListener('input', (e) => {
            this.state.cycles = parseFloat(e.target.value);
            this.elements.cyclesValue.textContent = this.state.cycles;
            this.updateCyclogon();
        });
        
        // Botón de reinicio
        this.elements.resetBtn.addEventListener('click', () => {
            this.resetToInitialState();
        });
        
        // Botón de exportar
        this.elements.exportBtn.addEventListener('click', () => {
            this.exportCyclogon();
        });
        
        // FASE 6: Selector de formato de exportación
        this.elements.exportFormat.addEventListener('change', (e) => {
            this.state.exportFormat = e.target.value;
        });
        
        // FASE 6: Controles de precisión
        this.elements.precisionMinus.addEventListener('click', () => {
            if (this.state.exportPrecision > 1) {
                this.state.exportPrecision--;
                this.elements.precisionValue.textContent = this.state.exportPrecision;
                this.exportService.updateConfig({
                    csv: { precision: this.state.exportPrecision },
                    json: { precision: this.state.exportPrecision }
                });
            }
        });
        
        this.elements.precisionPlus.addEventListener('click', () => {
            if (this.state.exportPrecision < 12) {
                this.state.exportPrecision++;
                this.elements.precisionValue.textContent = this.state.exportPrecision;
                this.exportService.updateConfig({
                    csv: { precision: this.state.exportPrecision },
                    json: { precision: this.state.exportPrecision }
                });
            }
        });
        
        // Controles de zoom (FASE 5: Delegado a GraphPanelView)
        this.elements.zoomInBtn.addEventListener('click', () => this.graphPanelView.zoom(0.8));
        this.elements.zoomOutBtn.addEventListener('click', () => this.graphPanelView.zoom(1.25));
        this.elements.fitViewBtn.addEventListener('click', () => this.graphPanelView.fitView());
    }
    
    /**
     * Reinicia al estado inicial
     */
    resetToInitialState() {
        // Restaurar estado
        this.state.shapeType = CONFIG.SHAPES.DEFAULT_TYPE;
        this.state.polygonSides = CONFIG.SHAPES.DEFAULT_POLYGON_SIDES;
        this.state.cycles = CONFIG.CYCLOGON.DEFAULT_CYCLES;
        
        // Resetear estado del InputController para evitar congelamiento
        this.inputController.reset();
        this.state.isDragging = false;
        
        // Actualizar UI
        document.querySelector('input[value="circle"]').checked = true;
        this.elements.sidesSelector.style.display = 'none';
        this.elements.sidesInput.value = this.state.polygonSides;
        this.elements.cyclesSlider.value = this.state.cycles;
        this.elements.cyclesValue.textContent = this.state.cycles;
        
        // Reiniciar vista usando ConfigPanelView
        this.configPanelView.setCircle(CONFIG.SHAPES.DEFAULT_RADIUS);
        
        this.updatePointInfo();
        this.updateCyclogon();
    }
    
    /**
     * Actualiza la información del punto en la UI
     */
    updatePointInfo() {
        const info = this.configPanelView.getDrawPointInfo();
        if (!info) return;
        
        this.elements.pointX.textContent = info.x.toFixed(3);
        this.elements.pointY.textContent = info.y.toFixed(3);
        this.elements.pointRadius.textContent = CONFIG.SHAPES.DEFAULT_RADIUS.toFixed(3);
        this.elements.pointDistance.textContent = info.distanceFromCenter.toFixed(3);
    }
    
    /**
     * Exporta los datos del ciclógono usando ExportService
     * FASE 6: Soporte para múltiples formatos (CSV, SVG, JSON)
     */
    exportCyclogon() {
        // Verificar que hay datos para exportar
        if (!this.currentCyclogon || this.currentCyclogon.isEmpty) {
            console.warn('No hay datos para exportar');
            this.updateStatus('warning', 'No hay datos para exportar');
            return;
        }

        try {
            // Agregar metadatos adicionales al ciclógono antes de exportar
            this.currentCyclogon.setMetadata({
                shapeType: this.state.shapeType,
                sides: this.state.shapeType === 'polygon' ? this.state.polygonSides : null,
                cycles: this.state.cycles,
                exportedAt: new Date().toISOString()
            });

            // Generar nombre de archivo
            const shapeName = this.state.shapeType === 'circle' ? 
                'circle' : `polygon${this.state.polygonSides}`;
            const cyclesStr = this.state.cycles.toString().replace('.', '_');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `cyclogon_${shapeName}_${cyclesStr}cycles_${timestamp}`;

            // Usar ExportService para descargar
            const result = this.exportService.download(
                this.currentCyclogon,
                this.state.exportFormat,
                filename
            );

            // Feedback al usuario según formato
            const formatLabels = {
                [ExportFormat.CSV]: 'CSV',
                [ExportFormat.SVG]: 'SVG',
                [ExportFormat.JSON]: 'JSON'
            };
            
            this.updateStatus('ready', 
                `Exportado ${formatLabels[this.state.exportFormat]}: ${result.pointCount} puntos`
            );

            // Log de información de exportación
            if (CONFIG.APP.DEBUG) {
                const analysis = this.cyclogonCalculator.analyzeShape(this.currentCyclogon);
                console.log('Exportación completada:', {
                    formato: this.state.exportFormat,
                    archivo: result.filename,
                    tamaño: `${(result.size / 1024).toFixed(2)} KB`,
                    puntos: result.pointCount,
                    longitudArco: analysis?.arcLength?.toFixed(3),
                    boundingBox: analysis?.boundingBox
                });
            }
        } catch (error) {
            console.error('Error al exportar:', error);
            this.updateStatus('error', 'Error al exportar');
        }
    }
    
    /**
     * Actualiza el indicador de estado
     */
    updateStatus(status, text) {
        this.elements.statusIndicator.className = `status-indicator ${status}`;
        this.elements.statusText.textContent = text;
    }
    
    /**
     * Manejador de resize de ventana
     */
    onWindowResize() {
        // Actualizar vista del panel de configuración (FASE 2)
        this.configPanelView.resize();
        
        // FASE 3: Actualizar cámara en el InputController
        if (this.inputController) {
            this.inputController.updateCamera(this.configPanelView.camera);
        }
        
        // FASE 5: Actualizar vista del panel gráfico
        this.graphPanelView.resize();
    }
    
    /**
     * Loop de animación principal
     */
    animate() {
        requestAnimationFrame(this.animate);
        
        // Renderizar panel de configuración usando ConfigPanelView (FASE 2)
        this.configPanelView.render();
        
        // FASE 5: Renderizar panel gráfico usando GraphPanelView
        this.graphPanelView.render();
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const app = new CyclogonApp();
    app.init();
    
    // Exponer para debugging
    if (CONFIG.APP.DEBUG) {
        window.cyclogonApp = app;
    }
});
