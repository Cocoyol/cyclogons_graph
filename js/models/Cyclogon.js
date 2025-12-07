/**
 * ============================================
 * CYCLOGON.JS - Modelo de la Curva Ciclógono
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que representa un ciclógono o cicloide generado.
 * Almacena los puntos de la curva y metadatos asociados.
 * 
 * FASE 4: Modelo formal para almacenar curvas generadas
 */

/**
 * Modelo que representa un ciclógono o cicloide calculado
 */
export class Cyclogon {
    /**
     * Crea un nuevo modelo de ciclógono
     * @param {string} type - Tipo de curva ('cycloid', 'cyclogon', etc.)
     * @param {Object} sourceShape - Forma origen (Circle o Polygon) que generó la curva
     */
    constructor(type, sourceShape = null) {
        this._type = type;
        this._sourceShape = sourceShape;
        this._points = [];
        this._metadata = {};
        this._timestamp = Date.now();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /** @returns {string} Tipo de curva */
    get type() {
        return this._type;
    }

    /** @returns {Object} Forma que generó la curva */
    get sourceShape() {
        return this._sourceShape;
    }

    /** @returns {number} Número de puntos en la curva */
    get pointCount() {
        return this._points.length;
    }

    /** @returns {Object} Metadatos de la curva */
    get metadata() {
        return { ...this._metadata };
    }

    /** @returns {number} Timestamp de creación */
    get timestamp() {
        return this._timestamp;
    }

    /** @returns {boolean} Si la curva tiene puntos */
    get isEmpty() {
        return this._points.length === 0;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - GESTIÓN DE PUNTOS
    // ==========================================

    /**
     * Añade un punto a la curva
     * @param {Object} point - Punto con al menos {x, y}
     */
    addPoint(point) {
        this._points.push({
            x: point.x,
            y: point.y,
            ...point // Incluir propiedades adicionales (theta, sideIndex, etc.)
        });
    }

    /**
     * Añade múltiples puntos a la curva
     * @param {Array} points - Array de puntos
     */
    addPoints(points) {
        points.forEach(p => this.addPoint(p));
    }

    /**
     * Obtiene todos los puntos de la curva
     * @returns {Array} Copia del array de puntos
     */
    getPoints() {
        return this._points.map(p => ({ ...p }));
    }

    /**
     * Obtiene un punto específico por índice
     * @param {number} index - Índice del punto
     * @returns {Object|null} Punto o null si no existe
     */
    getPoint(index) {
        if (index < 0 || index >= this._points.length) {
            return null;
        }
        return { ...this._points[index] };
    }

    /**
     * Obtiene el primer punto de la curva
     * @returns {Object|null} Primer punto o null
     */
    getFirstPoint() {
        return this.getPoint(0);
    }

    /**
     * Obtiene el último punto de la curva
     * @returns {Object|null} Último punto o null
     */
    getLastPoint() {
        return this.getPoint(this._points.length - 1);
    }

    /**
     * Obtiene solo las coordenadas X, Y de todos los puntos
     * @returns {Array} Array de {x, y}
     */
    getCoordinates() {
        return this._points.map(p => ({ x: p.x, y: p.y }));
    }

    /**
     * Limpia todos los puntos de la curva
     */
    clear() {
        this._points = [];
        this._metadata = {};
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - METADATOS
    // ==========================================

    /**
     * Establece metadatos de la curva
     * @param {Object} metadata - Objeto con metadatos
     */
    setMetadata(metadata) {
        this._metadata = { ...this._metadata, ...metadata };
    }

    /**
     * Obtiene un valor de metadatos específico
     * @param {string} key - Clave del metadato
     * @returns {*} Valor o undefined
     */
    getMetadataValue(key) {
        return this._metadata[key];
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - CÁLCULOS GEOMÉTRICOS
    // ==========================================

    /**
     * Calcula el bounding box de la curva
     * @returns {Object} {minX, maxX, minY, maxY, width, height}
     */
    getBoundingBox() {
        if (this._points.length === 0) {
            return null;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const p of this._points) {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        }

        return {
            minX, maxX, minY, maxY,
            width: maxX - minX,
            height: maxY - minY,
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2
            }
        };
    }

    /**
     * Calcula la longitud total de la curva (perímetro)
     * @returns {number} Longitud de arco aproximada
     */
    getArcLength() {
        if (this._points.length < 2) {
            return 0;
        }

        let length = 0;
        for (let i = 1; i < this._points.length; i++) {
            const p0 = this._points[i - 1];
            const p1 = this._points[i];
            length += Math.sqrt(
                (p1.x - p0.x) ** 2 + (p1.y - p0.y) ** 2
            );
        }

        return length;
    }

    /**
     * Encuentra el punto más cercano a una posición dada
     * @param {Object} position - Posición {x, y}
     * @returns {Object} {point, index, distance}
     */
    findClosestPoint(position) {
        if (this._points.length === 0) {
            return null;
        }

        let closestIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < this._points.length; i++) {
            const p = this._points[i];
            const distance = Math.sqrt(
                (p.x - position.x) ** 2 + (p.y - position.y) ** 2
            );

            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        return {
            point: { ...this._points[closestIndex] },
            index: closestIndex,
            distance: minDistance
        };
    }

    /**
     * Obtiene un subconjunto de la curva entre dos índices
     * @param {number} startIndex - Índice inicial
     * @param {number} endIndex - Índice final (no incluido)
     * @returns {Array} Subarray de puntos
     */
    slice(startIndex, endIndex) {
        return this._points.slice(startIndex, endIndex).map(p => ({ ...p }));
    }

    /**
     * Submuestrea la curva tomando cada N puntos
     * @param {number} step - Paso de submuestreo
     * @returns {Array} Puntos submuestreados
     */
    subsample(step = 2) {
        const result = [];
        for (let i = 0; i < this._points.length; i += step) {
            result.push({ ...this._points[i] });
        }
        // Asegurar que el último punto esté incluido
        if ((this._points.length - 1) % step !== 0) {
            result.push({ ...this._points[this._points.length - 1] });
        }
        return result;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - TRANSFORMACIONES
    // ==========================================

    /**
     * Traslada todos los puntos de la curva
     * @param {number} dx - Desplazamiento en X
     * @param {number} dy - Desplazamiento en Y
     */
    translate(dx, dy) {
        this._points = this._points.map(p => ({
            ...p,
            x: p.x + dx,
            y: p.y + dy
        }));
    }

    /**
     * Escala la curva desde el origen
     * @param {number} scale - Factor de escala
     */
    scale(scale) {
        this._points = this._points.map(p => ({
            ...p,
            x: p.x * scale,
            y: p.y * scale
        }));
    }

    /**
     * Normaliza la curva para que quepa en un rango [0, 1] x [0, 1]
     * @returns {Object} Factores de normalización {offsetX, offsetY, scale}
     */
    normalize() {
        const bbox = this.getBoundingBox();
        if (!bbox) return null;

        const scale = Math.max(bbox.width, bbox.height);
        
        this._points = this._points.map(p => ({
            ...p,
            x: (p.x - bbox.minX) / scale,
            y: (p.y - bbox.minY) / scale
        }));

        return {
            offsetX: bbox.minX,
            offsetY: bbox.minY,
            scale: scale
        };
    }

    /**
     * Crea una copia de la curva
     * @returns {Cyclogon} Nueva instancia
     */
    clone() {
        const copy = new Cyclogon(this._type, this._sourceShape);
        copy._points = this._points.map(p => ({ ...p }));
        copy._metadata = { ...this._metadata };
        copy._timestamp = this._timestamp;
        return copy;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - SERIALIZACIÓN
    // ==========================================

    /**
     * Convierte la curva a formato CSV
     * @param {number} precision - Decimales de precisión
     * @param {boolean} includeHeaders - Incluir cabeceras
     * @returns {string} String CSV
     */
    toCSV(precision = 6, includeHeaders = true) {
        let csv = includeHeaders ? 'X,Y\n' : '';
        
        for (const p of this._points) {
            csv += `${p.x.toFixed(precision)},${p.y.toFixed(precision)}\n`;
        }
        
        return csv;
    }

    /**
     * Convierte la curva a un objeto plano (JSON)
     * @returns {Object} Representación de la curva
     */
    toJSON() {
        return {
            type: this._type,
            pointCount: this._points.length,
            points: this._points.map(p => ({ x: p.x, y: p.y })),
            metadata: { ...this._metadata },
            timestamp: this._timestamp,
            boundingBox: this.getBoundingBox(),
            arcLength: this.getArcLength()
        };
    }

    /**
     * Crea un Cyclogon desde un objeto JSON
     * @param {Object} json - Objeto con datos de la curva
     * @returns {Cyclogon} Nueva instancia
     */
    static fromJSON(json) {
        const cyclogon = new Cyclogon(json.type);
        cyclogon._points = json.points.map(p => ({ ...p }));
        cyclogon._metadata = json.metadata || {};
        cyclogon._timestamp = json.timestamp || Date.now();
        return cyclogon;
    }

    /**
     * Representación en string para debugging
     * @returns {string}
     */
    toString() {
        const bbox = this.getBoundingBox();
        return `Cyclogon(type=${this._type}, points=${this._points.length}, ` +
               `width=${bbox ? bbox.width.toFixed(3) : 'N/A'}, ` +
               `height=${bbox ? bbox.height.toFixed(3) : 'N/A'})`;
    }

    // ==========================================
    // MÉTODOS ESTÁTICOS - UTILIDADES
    // ==========================================

    /**
     * Combina múltiples curvas en una sola
     * @param {Array<Cyclogon>} cyclogons - Array de curvas
     * @returns {Cyclogon} Curva combinada
     */
    static merge(cyclogons) {
        if (cyclogons.length === 0) {
            return new Cyclogon('merged');
        }

        const merged = new Cyclogon('merged');
        
        for (const c of cyclogons) {
            merged.addPoints(c.getPoints());
        }

        return merged;
    }
}

export default Cyclogon;
