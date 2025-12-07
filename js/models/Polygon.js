/**
 * ============================================
 * POLYGON.JS - Modelo del Polígono Regular
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que representa un polígono regular con sus
 * propiedades geométricas y métodos de cálculo.
 */

import { MATH } from '../config/constants.js';

/**
 * Representa una arista del polígono
 */
export class Edge {
    /**
     * @param {Object} start - Punto inicial {x, y}
     * @param {Object} end - Punto final {x, y}
     * @param {number} index - Índice de la arista
     */
    constructor(start, end, index) {
        this.start = { ...start };
        this.end = { ...end };
        this.index = index;
    }

    /**
     * Calcula la longitud de la arista
     * @returns {number} Longitud de la arista
     */
    getLength() {
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Obtiene el punto medio de la arista
     * @returns {Object} Punto medio {x, y}
     */
    getMidpoint() {
        return {
            x: (this.start.x + this.end.x) / 2,
            y: (this.start.y + this.end.y) / 2
        };
    }

    /**
     * Obtiene un punto en la arista según parámetro t (0-1)
     * @param {number} t - Parámetro de interpolación (0 = start, 1 = end)
     * @returns {Object} Punto interpolado {x, y}
     */
    getPointAt(t) {
        t = Math.max(0, Math.min(1, t));
        return {
            x: this.start.x + t * (this.end.x - this.start.x),
            y: this.start.y + t * (this.end.y - this.start.y)
        };
    }

    /**
     * Calcula la distancia de un punto a esta arista
     * @param {Object} point - Punto {x, y}
     * @returns {Object} { distance, closestPoint, t }
     */
    distanceToPoint(point) {
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            // La arista es un punto
            const dist = Math.sqrt(
                (point.x - this.start.x) ** 2 + 
                (point.y - this.start.y) ** 2
            );
            return {
                distance: dist,
                closestPoint: { ...this.start },
                t: 0
            };
        }

        // Proyección del punto sobre la línea
        let t = ((point.x - this.start.x) * dx + (point.y - this.start.y) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const closestPoint = {
            x: this.start.x + t * dx,
            y: this.start.y + t * dy
        };

        const distance = Math.sqrt(
            (point.x - closestPoint.x) ** 2 + 
            (point.y - closestPoint.y) ** 2
        );

        return { distance, closestPoint, t };
    }

    /**
     * Obtiene el vector normal de la arista (apuntando hacia afuera)
     * @returns {Object} Vector normal normalizado {x, y}
     */
    getNormal() {
        const dx = this.end.x - this.start.x;
        const dy = this.end.y - this.start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        // Normal perpendicular (hacia afuera del polígono)
        return {
            x: dy / length,
            y: -dx / length
        };
    }
}

/**
 * Clase principal que representa un polígono regular
 */
export class Polygon {
    /**
     * Crea un polígono regular
     * @param {number} sides - Número de lados (≥3)
     * @param {number} radius - Radio circunscrito
     * @param {number} rotationOffset - Ángulo de rotación inicial (default: -π/2 para vértice arriba)
     */
    constructor(sides, radius, rotationOffset = -MATH.HALF_PI) {
        if (sides < 3) {
            throw new Error('Un polígono debe tener al menos 3 lados');
        }
        if (radius <= 0) {
            throw new Error('El radio debe ser positivo');
        }

        this._sides = sides;
        this._radius = radius;
        this._rotationOffset = rotationOffset;
        this._vertices = [];
        this._edges = [];

        // Calcular vértices y aristas
        this._calculateGeometry();
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /** @returns {number} Número de lados */
    get sides() {
        return this._sides;
    }

    /** @returns {number} Radio circunscrito */
    get radius() {
        return this._radius;
    }

    /** @returns {Array} Array de vértices [{x, y}, ...] */
    get vertices() {
        return this._vertices.map(v => ({ ...v }));
    }

    /** @returns {Array} Array de aristas [Edge, ...] */
    get edges() {
        return this._edges;
    }

    /** @returns {number} Ángulo de rotación inicial */
    get rotationOffset() {
        return this._rotationOffset;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    /**
     * Cambia el número de lados y recalcula geometría
     * @param {number} newSides
     */
    set sides(newSides) {
        if (newSides < 3) {
            throw new Error('Un polígono debe tener al menos 3 lados');
        }
        this._sides = newSides;
        this._calculateGeometry();
    }

    /**
     * Cambia el radio y recalcula geometría
     * @param {number} newRadius
     */
    set radius(newRadius) {
        if (newRadius <= 0) {
            throw new Error('El radio debe ser positivo');
        }
        this._radius = newRadius;
        this._calculateGeometry();
    }

    // ==========================================
    // MÉTODOS PRIVADOS
    // ==========================================

    /**
     * Calcula los vértices y aristas del polígono
     * @private
     */
    _calculateGeometry() {
        this._vertices = [];
        this._edges = [];

        const angleStep = MATH.TWO_PI / this._sides;

        // Calcular vértices
        for (let i = 0; i < this._sides; i++) {
            const angle = this._rotationOffset + i * angleStep;
            this._vertices.push({
                x: Math.cos(angle) * this._radius,
                y: Math.sin(angle) * this._radius,
                angle: angle,
                index: i
            });
        }

        // Calcular aristas
        for (let i = 0; i < this._sides; i++) {
            const start = this._vertices[i];
            const end = this._vertices[(i + 1) % this._sides];
            this._edges.push(new Edge(start, end, i));
        }
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - PROPIEDADES GEOMÉTRICAS
    // ==========================================

    /**
     * Calcula el perímetro del polígono
     * @returns {number} Perímetro total
     */
    getPerimeter() {
        return this._sides * this.getSideLength();
    }

    /**
     * Calcula la longitud de cada lado
     * Fórmula: L = 2R * sin(π/n)
     * @returns {number} Longitud de un lado
     */
    getSideLength() {
        return 2 * this._radius * Math.sin(Math.PI / this._sides);
    }

    /**
     * Calcula el apotema (distancia del centro al punto medio de un lado)
     * Fórmula: a = R * cos(π/n)
     * @returns {number} Apotema
     */
    getApothem() {
        return this._radius * Math.cos(Math.PI / this._sides);
    }

    /**
     * Calcula el área del polígono
     * Fórmula: A = (1/2) * perímetro * apotema
     * @returns {number} Área
     */
    getArea() {
        return 0.5 * this.getPerimeter() * this.getApothem();
    }

    /**
     * Calcula el ángulo interior del polígono
     * Fórmula: (n-2) * π / n
     * @returns {number} Ángulo interior en radianes
     */
    getInteriorAngle() {
        return ((this._sides - 2) * Math.PI) / this._sides;
    }

    /**
     * Calcula el ángulo exterior (ángulo de rotación por paso)
     * Fórmula: 2π / n
     * @returns {number} Ángulo exterior en radianes
     */
    getExteriorAngle() {
        return MATH.TWO_PI / this._sides;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - CONSULTAS
    // ==========================================

    /**
     * Obtiene un vértice específico por índice
     * @param {number} index - Índice del vértice (0 a n-1)
     * @returns {Object} Vértice {x, y, angle, index}
     */
    getVertex(index) {
        const normalizedIndex = ((index % this._sides) + this._sides) % this._sides;
        return { ...this._vertices[normalizedIndex] };
    }

    /**
     * Obtiene una arista específica por índice
     * @param {number} index - Índice de la arista (0 a n-1)
     * @returns {Edge} Arista
     */
    getEdge(index) {
        const normalizedIndex = ((index % this._sides) + this._sides) % this._sides;
        return this._edges[normalizedIndex];
    }

    /**
     * Obtiene el vértice más cercano a la parte superior
     * @returns {Object} Vértice superior {x, y, angle, index}
     */
    getTopVertex() {
        let topVertex = this._vertices[0];
        for (const vertex of this._vertices) {
            if (vertex.y > topVertex.y) {
                topVertex = vertex;
            }
        }
        return { ...topVertex };
    }

    /**
     * Encuentra la arista más cercana a un punto dado
     * @param {Object} point - Punto {x, y}
     * @returns {Object} { edge, distance, closestPoint, t, edgeIndex }
     */
    findClosestEdge(point) {
        let minDistance = Infinity;
        let result = null;

        for (let i = 0; i < this._edges.length; i++) {
            const edge = this._edges[i];
            const distResult = edge.distanceToPoint(point);

            if (distResult.distance < minDistance) {
                minDistance = distResult.distance;
                result = {
                    edge: edge,
                    distance: distResult.distance,
                    closestPoint: distResult.closestPoint,
                    t: distResult.t,
                    edgeIndex: i
                };
            }
        }

        return result;
    }

    /**
     * Verifica si un punto está dentro del polígono
     * @param {Object} point - Punto {x, y}
     * @returns {boolean} true si el punto está dentro
     */
    containsPoint(point) {
        // Algoritmo de ray casting
        let inside = false;
        const n = this._vertices.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const vi = this._vertices[i];
            const vj = this._vertices[j];

            if (((vi.y > point.y) !== (vj.y > point.y)) &&
                (point.x < (vj.x - vi.x) * (point.y - vi.y) / (vj.y - vi.y) + vi.x)) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Calcula la distancia de un punto al borde del polígono
     * @param {Object} point - Punto {x, y}
     * @returns {number} Distancia al borde más cercano
     */
    distanceToBorder(point) {
        return this.findClosestEdge(point).distance;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - TRANSFORMACIONES
    // ==========================================

    /**
     * Rota el polígono un ángulo dado (modifica rotationOffset)
     * @param {number} angle - Ángulo de rotación en radianes
     */
    rotate(angle) {
        this._rotationOffset += angle;
        this._calculateGeometry();
    }

    /**
     * Crea una copia del polígono
     * @returns {Polygon} Nueva instancia del polígono
     */
    clone() {
        return new Polygon(this._sides, this._radius, this._rotationOffset);
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - SERIALIZACIÓN
    // ==========================================

    /**
     * Convierte el polígono a un objeto plano
     * @returns {Object} Representación del polígono
     */
    toJSON() {
        return {
            sides: this._sides,
            radius: this._radius,
            rotationOffset: this._rotationOffset,
            vertices: this._vertices.map(v => ({ x: v.x, y: v.y })),
            sideLength: this.getSideLength(),
            apothem: this.getApothem(),
            perimeter: this.getPerimeter(),
            area: this.getArea()
        };
    }

    /**
     * Crea un polígono desde un objeto JSON
     * @param {Object} json - Objeto con datos del polígono
     * @returns {Polygon} Nueva instancia
     */
    static fromJSON(json) {
        return new Polygon(json.sides, json.radius, json.rotationOffset);
    }

    /**
     * Representación en string para debugging
     * @returns {string}
     */
    toString() {
        return `Polygon(sides=${this._sides}, radius=${this._radius.toFixed(3)}, ` +
               `sideLength=${this.getSideLength().toFixed(3)}, apothem=${this.getApothem().toFixed(3)})`;
    }
}

export default Polygon;
