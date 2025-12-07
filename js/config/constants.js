/**
 * ============================================
 * CONSTANTS.JS - Configuración Global del Sistema
 * Generador de Ciclógonos 2D
 * ============================================
 */

export const CONFIG = {
    // ==========================================
    // CONFIGURACIÓN DE LA APLICACIÓN
    // ==========================================
    APP: {
        NAME: 'Generador de Ciclógonos',
        VERSION: '1.0.0',
        DEBUG: false
    },

    // ==========================================
    // CONFIGURACIÓN DE FORMAS
    // ==========================================
    SHAPES: {
        DEFAULT_TYPE: 'circle',         // 'circle' o 'polygon'
        MIN_POLYGON_SIDES: 3,
        MAX_POLYGON_SIDES: 20,
        DEFAULT_POLYGON_SIDES: 3,
        DEFAULT_RADIUS: 1.0             // Radio fijo del polígono/círculo
    },

    // ==========================================
    // CONFIGURACIÓN DEL PUNTO DE DIBUJO
    // ==========================================
    DRAW_POINT: {
        RADIUS: 0.08,                   // Radio visual del punto
        DEFAULT_ANGLE: Math.PI / 2,     // 90° - parte superior (para círculo)
        SNAP_THRESHOLD: 0.1,            // Distancia para activar snap
        COLOR: 0xf72585,                // Rosa/Magenta
        HOVER_COLOR: 0xff5ca1
    },

    // ==========================================
    // CONFIGURACIÓN DEL CICLÓGONO
    // ==========================================
    CYCLOGON: {
        DEFAULT_CYCLES: 1,              // Ciclos completos por defecto
        MIN_CYCLES: 0.5,
        MAX_CYCLES: 5,
        POINTS_PER_SIDE: 50,            // Puntos de discretización por lado (polígonos)
        POINTS_PER_RADIAN: 30,          // Puntos por radián (círculos)
        LINE_COLOR: 0x00ff88,           // Verde brillante
        LINE_WIDTH: 2
    },

    // ==========================================
    // CONFIGURACIÓN DE COLORES (Paleta del PRD)
    // ==========================================
    COLORS: {
        BACKGROUND_CONFIG: 0x1a1a2e,    // Gris oscuro
        BACKGROUND_GRAPH: 0x0f0f0f,     // Negro
        POLYGON: 0x4cc9f0,              // Azul claro
        CIRCLE: 0x4cc9f0,               // Azul claro
        DRAW_POINT: 0xf72585,           // Rosa/Magenta
        CYCLOGON_LINE: 0x00ff88,        // Verde brillante
        FLOOR_LINE: 0xffffff,           // Blanco
        UI_ELEMENTS: 0xadb5bd,          // Gris medio
        ACCENT: 0x7209b7,               // Púrpura
        SECONDARY: 0x3a0ca3             // Azul oscuro
    },

    // ==========================================
    // CONFIGURACIÓN DE THREE.JS
    // ==========================================
    THREEJS: {
        ANTIALIAS: true,
        ALPHA: true,
        PIXEL_RATIO: window.devicePixelRatio || 1
    },

    // ==========================================
    // CONFIGURACIÓN DE CÁMARAS
    // ==========================================
    CAMERA: {
        CONFIG_PANEL: {
            // Cámara ortográfica para panel de configuración
            FRUSTUM_SIZE: 3,            // Tamaño del frustum
            NEAR: 0.1,
            FAR: 100,
            POSITION_Z: 10
        },
        GRAPH_PANEL: {
            // Cámara ortográfica para panel gráfico
            FRUSTUM_SIZE: 5,
            NEAR: 0.1,
            FAR: 100,
            POSITION_Z: 10,
            // Márgenes para visualización del ciclógono
            PADDING: 0.5
        }
    },

    // ==========================================
    // CONFIGURACIÓN DE EXPORTACIÓN
    // ==========================================
    EXPORT: {
        DECIMAL_PRECISION: 6,
        FILE_PREFIX: 'cyclogon',
        FILE_EXTENSION: 'csv',
        DELIMITER: ','
    },

    // ==========================================
    // CONFIGURACIÓN DE ANIMACIONES
    // ==========================================
    ANIMATION: {
        DURATION_MS: 300,               // Duración de transiciones
        EASING: 'ease-out',
        FPS_TARGET: 60
    },

    // ==========================================
    // TECLAS DE CONTROL
    // ==========================================
    KEYS: {
        SNAP_MODIFIER: 'Shift'          // Tecla para activar snap a bordes
    }
};

// ==========================================
// CONSTANTES MATEMÁTICAS
// ==========================================
export const MATH = {
    TWO_PI: Math.PI * 2,
    HALF_PI: Math.PI / 2,
    DEG_TO_RAD: Math.PI / 180,
    RAD_TO_DEG: 180 / Math.PI
};

// ==========================================
// MENSAJES DE LA INTERFAZ
// ==========================================
export const UI_TEXT = {
    TITLE: 'Generador de Ciclógonos',
    SUBTITLE: 'Visualización interactiva de curvas matemáticas',
    
    // Panel de configuración
    SHAPE_SELECTOR: 'Forma Base',
    CIRCLE_OPTION: 'Círculo',
    POLYGON_OPTION: 'Polígono Regular',
    SIDES_LABEL: 'Lados',
    POINT_POSITION: 'Posición del Punto',
    COORDINATES: 'Coordenadas',
    RADIUS_LABEL: 'Radio',
    
    // Controles
    RESET_BUTTON: 'Reiniciar',
    EXPORT_BUTTON: 'Exportar CSV',
    CYCLES_LABEL: 'Ciclos',
    
    // Tooltips
    SHIFT_TIP: 'SHIFT: Snap a bordes',
    DRAG_TIP: 'Arrastra el punto para mover',
    
    // Estados
    LOADING: 'Cargando...',
    READY: 'Listo'
};

// Freeze para prevenir modificaciones accidentales
Object.freeze(CONFIG);
Object.freeze(MATH);
Object.freeze(UI_TEXT);
