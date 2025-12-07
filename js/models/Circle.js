/**
 * ============================================
 * CIRCLE.JS - Modelo del Círculo
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que representa un círculo con sus
 * propiedades geométricas y métodos de cálculo.
 */

import { MATH } from '../config/constants.js';

/**
 * Clase que representa un círculo
 */
export class Circle {
    /**
     * Crea un círculo
     * @param {number} radius - Radio del círculo
     * @param {Object} center - Centro del círculo (default: {x: 0, y: 0})
     */
    constructor(radius, center = { x: 0, y: 0 }) {
        if (radius <= 0) {
            throw new Error('El radio debe ser positivo');
        }

        this._radius = radius;
        this._center = { ...center };
    }

    // ==========================================
    // GETTERS
    // ==========================================

    /** @returns {number} Radio del círculo */
    get radius() {
        return this._radius;
    }

    /** @returns {Object} Centro del círculo {x, y} */
    get center() {
        return { ...this._center };
    }

    /** @returns {number} Diámetro del círculo */
    get diameter() {
        return this._radius * 2;
    }

    /** @returns {number} Circunferencia del círculo */
    get circumference() {
        return MATH.TWO_PI * this._radius;
    }

    /** @returns {number} Área del círculo */
    get area() {
        return Math.PI * this._radius * this._radius;
    }

    // ==========================================
    // SETTERS
    // ==========================================

    /**
     * Cambia el radio del círculo
     * @param {number} newRadius
     */
    set radius(newRadius) {
        if (newRadius <= 0) {
            throw new Error('El radio debe ser positivo');
        }
        this._radius = newRadius;
    }

    /**
     * Cambia el centro del círculo
     * @param {Object} newCenter - {x, y}
     */
    set center(newCenter) {
        this._center = { ...newCenter };
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - PUNTOS EN EL CÍRCULO
    // ==========================================

    /**
     * Obtiene un punto en el borde del círculo dado un ángulo
     * @param {number} angle - Ángulo en radianes (0 = derecha, π/2 = arriba)
     * @returns {Object} Punto {x, y} en el borde
     */
    getPointOnCircle(angle) {
        return {
            x: this._center.x + Math.cos(angle) * this._radius,
            y: this._center.y + Math.sin(angle) * this._radius
        };
    }

    /**
     * Obtiene el punto superior del círculo (ángulo = π/2)
     * @returns {Object} Punto {x, y}
     */
    getTopPoint() {
        return this.getPointOnCircle(MATH.HALF_PI);
    }

    /**
     * Obtiene el punto inferior del círculo (ángulo = -π/2)
     * @returns {Object} Punto {x, y}
     */
    getBottomPoint() {
        return this.getPointOnCircle(-MATH.HALF_PI);
    }

    /**
     * Obtiene el punto derecho del círculo (ángulo = 0)
     * @returns {Object} Punto {x, y}
     */
    getRightPoint() {
        return this.getPointOnCircle(0);
    }

    /**
     * Obtiene el punto izquierdo del círculo (ángulo = π)
     * @returns {Object} Punto {x, y}
     */
    getLeftPoint() {
        return this.getPointOnCircle(Math.PI);
    }

    /**
     * Genera un array de puntos equidistantes en el círculo
     * @param {number} numPoints - Número de puntos a generar
     * @param {number} startAngle - Ángulo inicial (default: 0)
     * @returns {Array} Array de puntos [{x, y, angle}, ...]
     */
    getPoints(numPoints, startAngle = 0) {
        const points = [];
        const angleStep = MATH.TWO_PI / numPoints;

        for (let i = 0; i < numPoints; i++) {
            const angle = startAngle + i * angleStep;
            const point = this.getPointOnCircle(angle);
            points.push({
                ...point,
                angle: angle,
                index: i
            });
        }

        return points;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - CONSULTAS GEOMÉTRICAS
    // ==========================================

    /**
     * Calcula el ángulo desde el centro al punto dado
     * @param {Object} point - Punto {x, y}
     * @returns {number} Ángulo en radianes
     */
    angleToPoint(point) {
        return Math.atan2(
            point.y - this._center.y,
            point.x - this._center.x
        );
    }

    /**
     * Calcula la distancia desde el centro a un punto
     * @param {Object} point - Punto {x, y}
     * @returns {number} Distancia
     */
    distanceFromCenter(point) {
        const dx = point.x - this._center.x;
        const dy = point.y - this._center.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Verifica si un punto está dentro del círculo
     * @param {Object} point - Punto {x, y}
     * @returns {boolean} true si está dentro
     */
    containsPoint(point) {
        return this.distanceFromCenter(point) <= this._radius;
    }

    /**
     * Verifica si un punto está exactamente en el borde (con tolerancia)
     * @param {Object} point - Punto {x, y}
     * @param {number} tolerance - Tolerancia (default: 0.001)
     * @returns {boolean} true si está en el borde
     */
    isOnBorder(point, tolerance = 0.001) {
        const distance = this.distanceFromCenter(point);
        return Math.abs(distance - this._radius) <= tolerance;
    }

    /**
     * Calcula la distancia de un punto al borde del círculo
     * @param {Object} point - Punto {x, y}
     * @returns {number} Distancia (negativa si está dentro, positiva si está fuera)
     */
    distanceToBorder(point) {
        return this.distanceFromCenter(point) - this._radius;
    }

    /**
     * Proyecta un punto al borde del círculo
     * @param {Object} point - Punto {x, y}
     * @returns {Object} Punto proyectado {x, y, angle}
     */
    projectToBorder(point) {
        const angle = this.angleToPoint(point);
        const projected = this.getPointOnCircle(angle);
        return {
            ...projected,
            angle: angle
        };
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - CÁLCULOS PARA CICLOIDE
    // ==========================================

    /**
     * Calcula un punto de la cicloide dado un ángulo de rotación
     * Ecuaciones paramétricas:
     *   X = R * (θ - d * sin(θ))
     *   Y = R * (1 - d * cos(θ))
     * donde d = distancia_punto_centro / R
     * 
     * @param {number} theta - Ángulo de rotación del círculo
     * @param {Object} drawPoint - Punto de dibujo {x, y} relativo al centro
     * @returns {Object} Punto de la cicloide {x, y}
     */
    getCycloidPoint(theta, drawPoint) {
        const d = Math.sqrt(drawPoint.x ** 2 + drawPoint.y ** 2) / this._radius;
        
        // Calcular ángulo inicial del punto de dibujo
        const initialAngle = Math.atan2(drawPoint.y, drawPoint.x);
        
        // Posición del centro del círculo después de rodar
        const centerX = this._radius * theta;
        const centerY = this._radius;
        
        // Posición del punto de dibujo (rotado)
        const pointAngle = initialAngle - theta; // El círculo rota en sentido horario al rodar
        const pointX = centerX + d * this._radius * Math.cos(pointAngle);
        const pointY = centerY + d * this._radius * Math.sin(pointAngle);
        
        return { x: pointX, y: pointY };
    }

    /**
     * Genera los puntos de una cicloide completa
     * @param {Object} drawPoint - Punto de dibujo {x, y}
     * @param {number} cycles - Número de ciclos (vueltas completas)
     * @param {number} pointsPerRadian - Puntos por radián para suavidad
     * @returns {Array} Array de puntos [{x, y}, ...]
     */
    generateCycloidPoints(drawPoint, cycles = 1, pointsPerRadian = 30) {
        const points = [];
        const totalAngle = cycles * MATH.TWO_PI;
        const numPoints = Math.floor(totalAngle * pointsPerRadian);

        for (let i = 0; i <= numPoints; i++) {
            const theta = (i / numPoints) * totalAngle;
            const point = this.getCycloidPoint(theta, drawPoint);
            points.push(point);
        }

        return points;
    }

    /**
     * Calcula la longitud de arco para un ángulo dado
     * @param {number} angle - Ángulo en radianes
     * @returns {number} Longitud de arco
     */
    arcLength(angle) {
        return Math.abs(angle) * this._radius;
    }

    /**
     * Calcula el ángulo para una longitud de arco dada
     * @param {number} length - Longitud de arco
     * @returns {number} Ángulo en radianes
     */
    angleForArcLength(length) {
        return length / this._radius;
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - TRANSFORMACIONES
    // ==========================================

    /**
     * Escala el círculo por un factor
     * @param {number} factor - Factor de escala
     */
    scale(factor) {
        if (factor <= 0) {
            throw new Error('El factor de escala debe ser positivo');
        }
        this._radius *= factor;
    }

    /**
     * Mueve el círculo a una nueva posición
     * @param {number} x - Nueva coordenada X del centro
     * @param {number} y - Nueva coordenada Y del centro
     */
    moveTo(x, y) {
        this._center = { x, y };
    }

    /**
     * Desplaza el círculo por un delta
     * @param {number} dx - Desplazamiento en X
     * @param {number} dy - Desplazamiento en Y
     */
    moveBy(dx, dy) {
        this._center.x += dx;
        this._center.y += dy;
    }

    /**
     * Crea una copia del círculo
     * @returns {Circle} Nueva instancia
     */
    clone() {
        return new Circle(this._radius, this._center);
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - SERIALIZACIÓN
    // ==========================================

    /**
     * Convierte el círculo a un objeto plano
     * @returns {Object} Representación del círculo
     */
    toJSON() {
        return {
            radius: this._radius,
            center: { ...this._center },
            diameter: this.diameter,
            circumference: this.circumference,
            area: this.area
        };
    }

    /**
     * Crea un círculo desde un objeto JSON
     * @param {Object} json - Objeto con datos del círculo
     * @returns {Circle} Nueva instancia
     */
    static fromJSON(json) {
        return new Circle(json.radius, json.center);
    }

    /**
     * Representación en string para debugging
     * @returns {string}
     */
    toString() {
        return `Circle(radius=${this._radius.toFixed(3)}, ` +
               `center=(${this._center.x.toFixed(3)}, ${this._center.y.toFixed(3)}), ` +
               `circumference=${this.circumference.toFixed(3)})`;
    }
}

export default Circle;
