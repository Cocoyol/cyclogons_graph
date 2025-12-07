/**
 * ============================================
 * EXPORT SERVICE - Servicio de Exportación
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Servicio dedicado para exportar los ciclógonos generados
 * en múltiples formatos: CSV, SVG, JSON.
 * 
 * FASE 6: Servicio de exportación completo
 */

/**
 * Formatos de exportación soportados
 */
export const ExportFormat = {
    CSV: 'csv',
    SVG: 'svg',
    JSON: 'json'
};

/**
 * Configuración por defecto para exportación
 */
const DEFAULT_CONFIG = {
    csv: {
        precision: 6,
        delimiter: ',',
        includeHeaders: true,
        includeMetadata: false,
        lineEnding: '\n'
    },
    svg: {
        width: 800,
        height: 400,
        padding: 40,
        strokeColor: '#00ff88',
        strokeWidth: 2,
        backgroundColor: '#0f0f0f',
        showFloor: true,
        floorColor: '#ffffff',
        floorOpacity: 0.3,
        showGrid: false,
        gridColor: '#333333',
        gridOpacity: 0.5,
        title: 'Cyclogon'
    },
    json: {
        precision: 6,
        includeMetadata: true,
        pretty: true
    }
};

/**
 * Servicio de exportación para ciclógonos
 */
export class ExportService {
    /**
     * Crea una instancia del servicio de exportación
     * @param {Object} config - Configuración personalizada
     */
    constructor(config = {}) {
        this.config = {
            csv: { ...DEFAULT_CONFIG.csv, ...config.csv },
            svg: { ...DEFAULT_CONFIG.svg, ...config.svg },
            json: { ...DEFAULT_CONFIG.json, ...config.json }
        };
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - EXPORTACIÓN
    // ==========================================

    /**
     * Exporta un ciclógono al formato especificado
     * @param {Cyclogon} cyclogon - Modelo del ciclógono a exportar
     * @param {string} format - Formato de exportación (csv, svg, json)
     * @param {Object} options - Opciones adicionales
     * @returns {string} Contenido del archivo
     */
    export(cyclogon, format = ExportFormat.CSV, options = {}) {
        if (!cyclogon || cyclogon.isEmpty) {
            throw new Error('No hay datos para exportar');
        }

        switch (format.toLowerCase()) {
            case ExportFormat.CSV:
                return this.toCSV(cyclogon, options);
            case ExportFormat.SVG:
                return this.toSVG(cyclogon, options);
            case ExportFormat.JSON:
                return this.toJSON(cyclogon, options);
            default:
                throw new Error(`Formato no soportado: ${format}`);
        }
    }

    /**
     * Descarga un ciclógono como archivo
     * @param {Cyclogon} cyclogon - Modelo del ciclógono
     * @param {string} format - Formato de exportación
     * @param {string} filename - Nombre base del archivo (sin extensión)
     * @param {Object} options - Opciones adicionales
     */
    download(cyclogon, format = ExportFormat.CSV, filename = null, options = {}) {
        const content = this.export(cyclogon, format, options);
        const mimeTypes = {
            [ExportFormat.CSV]: 'text/csv;charset=utf-8;',
            [ExportFormat.SVG]: 'image/svg+xml;charset=utf-8;',
            [ExportFormat.JSON]: 'application/json;charset=utf-8;'
        };

        const blob = new Blob([content], { type: mimeTypes[format] });
        const link = document.createElement('a');
        const timestamp = this._getTimestamp();
        
        // Generar nombre de archivo
        const baseName = filename || this._generateFilename(cyclogon, timestamp);
        const extension = format.toLowerCase();
        
        link.href = URL.createObjectURL(blob);
        link.download = `${baseName}.${extension}`;
        link.click();
        
        URL.revokeObjectURL(link.href);

        return {
            filename: `${baseName}.${extension}`,
            size: blob.size,
            format: format,
            pointCount: cyclogon.pointCount
        };
    }

    // ==========================================
    // MÉTODOS PRIVADOS - CONVERSIÓN A CSV
    // ==========================================

    /**
     * Convierte un ciclógono a formato CSV
     * @param {Cyclogon} cyclogon - Modelo del ciclógono
     * @param {Object} options - Opciones de exportación
     * @returns {string} Contenido CSV
     */
    toCSV(cyclogon, options = {}) {
        const config = { ...this.config.csv, ...options };
        const { precision, delimiter, includeHeaders, includeMetadata, lineEnding } = config;
        
        let csv = '';

        // Agregar metadatos como comentarios
        if (includeMetadata) {
            csv += this._generateCSVMetadata(cyclogon, delimiter, lineEnding);
        }

        // Agregar cabeceras
        if (includeHeaders) {
            csv += `X${delimiter}Y${lineEnding}`;
        }

        // Agregar puntos
        const points = cyclogon.getPoints();
        for (const p of points) {
            csv += `${p.x.toFixed(precision)}${delimiter}${p.y.toFixed(precision)}${lineEnding}`;
        }

        return csv;
    }

    /**
     * Genera metadatos para CSV
     * @private
     */
    _generateCSVMetadata(cyclogon, delimiter, lineEnding) {
        const metadata = cyclogon.metadata;
        const bbox = cyclogon.getBoundingBox();
        const arcLength = cyclogon.getArcLength();
        
        let meta = '';
        meta += `# Cyclogon Export${lineEnding}`;
        meta += `# Type: ${cyclogon.type}${lineEnding}`;
        meta += `# Points: ${cyclogon.pointCount}${lineEnding}`;
        meta += `# Cycles: ${metadata.cycles || 'N/A'}${lineEnding}`;
        meta += `# Arc Length: ${arcLength.toFixed(4)}${lineEnding}`;
        
        if (bbox) {
            meta += `# Bounding Box: [${bbox.minX.toFixed(4)}, ${bbox.minY.toFixed(4)}] - [${bbox.maxX.toFixed(4)}, ${bbox.maxY.toFixed(4)}]${lineEnding}`;
        }
        
        meta += `# Exported: ${new Date().toISOString()}${lineEnding}`;
        meta += `#${lineEnding}`;
        
        return meta;
    }

    // ==========================================
    // MÉTODOS PRIVADOS - CONVERSIÓN A SVG
    // ==========================================

    /**
     * Convierte un ciclógono a formato SVG
     * @param {Cyclogon} cyclogon - Modelo del ciclógono
     * @param {Object} options - Opciones de exportación
     * @returns {string} Contenido SVG
     */
    toSVG(cyclogon, options = {}) {
        const config = { ...this.config.svg, ...options };
        const { 
            width, height, padding, 
            strokeColor, strokeWidth, backgroundColor,
            showFloor, floorColor, floorOpacity,
            showGrid, gridColor, gridOpacity,
            title 
        } = config;

        const points = cyclogon.getPoints();
        const bbox = cyclogon.getBoundingBox();
        
        if (!bbox) {
            throw new Error('No se pudo calcular el bounding box');
        }

        // Calcular transformación para ajustar al viewport
        const viewWidth = width - (padding * 2);
        const viewHeight = height - (padding * 2);
        
        const scaleX = viewWidth / bbox.width;
        const scaleY = viewHeight / bbox.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Centrar la curva
        const offsetX = padding + (viewWidth - bbox.width * scale) / 2;
        const offsetY = padding + (viewHeight - bbox.height * scale) / 2;

        // Transformar puntos al espacio SVG (invertir Y)
        const transformPoint = (p) => ({
            x: (p.x - bbox.minX) * scale + offsetX,
            y: height - ((p.y - bbox.minY) * scale + offsetY)
        });

        // Generar path de la curva
        const pathData = this._generateSVGPath(points, transformPoint);
        
        // Calcular posición del piso
        const floorY = height - (offsetY + (0 - bbox.minY) * scale);

        // Construir SVG
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" height="${height}" 
     viewBox="0 0 ${width} ${height}"
     style="background-color: ${backgroundColor}">
  <title>${title}</title>
  <desc>Cyclogon generated curve - ${cyclogon.type} with ${cyclogon.pointCount} points</desc>
  
  <!-- Definiciones -->
  <defs>
    <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00ff88"/>
      <stop offset="50%" stop-color="#4cc9f0"/>
      <stop offset="100%" stop-color="#00ff88"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
`;

        // Grid (opcional)
        if (showGrid) {
            svg += this._generateSVGGrid(width, height, padding, gridColor, gridOpacity);
        }

        // Línea del piso
        if (showFloor) {
            svg += `
  <!-- Piso -->
  <line x1="${padding}" y1="${floorY}" x2="${width - padding}" y2="${floorY}" 
        stroke="${floorColor}" stroke-width="1" stroke-opacity="${floorOpacity}"/>
`;
        }

        // Curva con glow
        svg += `
  <!-- Curva del Ciclógono (glow) -->
  <path d="${pathData}" 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth + 4}" 
        stroke-opacity="0.3"
        stroke-linecap="round"
        stroke-linejoin="round"/>
  
  <!-- Curva del Ciclógono (principal) -->
  <path d="${pathData}" 
        fill="none" 
        stroke="url(#curveGradient)" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#glow)"/>
`;

        // Metadata como comentarios
        svg += `
  <!-- Metadata -->
  <!-- Type: ${cyclogon.type} -->
  <!-- Points: ${cyclogon.pointCount} -->
  <!-- Cycles: ${cyclogon.metadata.cycles || 'N/A'} -->
  <!-- Arc Length: ${cyclogon.getArcLength().toFixed(4)} -->
  <!-- Exported: ${new Date().toISOString()} -->
`;

        svg += `</svg>`;

        return svg;
    }

    /**
     * Genera el path SVG de la curva
     * @private
     */
    _generateSVGPath(points, transformPoint) {
        if (points.length === 0) return '';

        const firstPoint = transformPoint(points[0]);
        let path = `M ${firstPoint.x.toFixed(2)} ${firstPoint.y.toFixed(2)}`;

        for (let i = 1; i < points.length; i++) {
            const p = transformPoint(points[i]);
            path += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
        }

        return path;
    }

    /**
     * Genera la grid SVG
     * @private
     */
    _generateSVGGrid(width, height, padding, gridColor, gridOpacity) {
        const gridSpacing = 50;
        let grid = '\n  <!-- Grid -->\n  <g stroke="' + gridColor + '" stroke-opacity="' + gridOpacity + '">\n';
        
        // Líneas verticales
        for (let x = padding; x <= width - padding; x += gridSpacing) {
            grid += `    <line x1="${x}" y1="${padding}" x2="${x}" y2="${height - padding}"/>\n`;
        }
        
        // Líneas horizontales
        for (let y = padding; y <= height - padding; y += gridSpacing) {
            grid += `    <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}"/>\n`;
        }
        
        grid += '  </g>\n';
        return grid;
    }

    // ==========================================
    // MÉTODOS PRIVADOS - CONVERSIÓN A JSON
    // ==========================================

    /**
     * Convierte un ciclógono a formato JSON
     * @param {Cyclogon} cyclogon - Modelo del ciclógono
     * @param {Object} options - Opciones de exportación
     * @returns {string} Contenido JSON
     */
    toJSON(cyclogon, options = {}) {
        const config = { ...this.config.json, ...options };
        const { precision, includeMetadata, pretty } = config;

        const data = {
            type: cyclogon.type,
            pointCount: cyclogon.pointCount,
            points: cyclogon.getPoints().map(p => ({
                x: parseFloat(p.x.toFixed(precision)),
                y: parseFloat(p.y.toFixed(precision))
            }))
        };

        if (includeMetadata) {
            data.metadata = cyclogon.metadata;
            data.boundingBox = cyclogon.getBoundingBox();
            data.arcLength = parseFloat(cyclogon.getArcLength().toFixed(precision));
            data.exportedAt = new Date().toISOString();
        }

        return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    }

    // ==========================================
    // MÉTODOS DE UTILIDAD
    // ==========================================

    /**
     * Genera un nombre de archivo basado en el ciclógono
     * @private
     */
    _generateFilename(cyclogon, timestamp) {
        const metadata = cyclogon.metadata;
        const shapeName = metadata.shapeType || cyclogon.type;
        const cycles = metadata.cycles ? `_${metadata.cycles}cycles` : '';
        const sides = metadata.sides ? `${metadata.sides}sides` : '';
        
        return `cyclogon_${shapeName}${sides}${cycles}_${timestamp}`;
    }

    /**
     * Obtiene timestamp formateado
     * @private
     */
    _getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    }

    /**
     * Actualiza la configuración del servicio
     * @param {Object} newConfig - Nueva configuración parcial
     */
    updateConfig(newConfig) {
        if (newConfig.csv) {
            this.config.csv = { ...this.config.csv, ...newConfig.csv };
        }
        if (newConfig.svg) {
            this.config.svg = { ...this.config.svg, ...newConfig.svg };
        }
        if (newConfig.json) {
            this.config.json = { ...this.config.json, ...newConfig.json };
        }
    }

    /**
     * Obtiene la configuración actual
     * @returns {Object} Configuración
     */
    getConfig() {
        return {
            csv: { ...this.config.csv },
            svg: { ...this.config.svg },
            json: { ...this.config.json }
        };
    }

    /**
     * Obtiene los formatos soportados
     * @returns {Array} Lista de formatos
     */
    static getSupportedFormats() {
        return Object.values(ExportFormat);
    }

    /**
     * Valida un formato de exportación
     * @param {string} format - Formato a validar
     * @returns {boolean} Si es válido
     */
    static isValidFormat(format) {
        return Object.values(ExportFormat).includes(format.toLowerCase());
    }
}

export default ExportService;
