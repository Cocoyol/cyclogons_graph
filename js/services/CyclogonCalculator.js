/**
 * ============================================
 * CYCLOGONCALCULATOR.JS - Servicio de Cálculo
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Servicio dedicado para cálculos matemáticos de ciclógonos.
 * Implementa algoritmos para:
 * - Cicloide (círculo rodando)
 * - Ciclógono (polígono rodando con arcos)
 * 
 * FASE 4: Servicio de cálculo dedicado
 */

import { MATH, CONFIG } from '../config/constants.js';
import Polygon from '../models/Polygon.js';
import Circle from '../models/Circle.js';
import Cyclogon from '../models/Cyclogon.js';

/**
 * Tipos de curvas generables
 */
export const CurveType = {
    CYCLOID: 'cycloid',         // Cicloide (círculo)
    CYCLOGON: 'cyclogon',       // Ciclógono (polígono)
    EPITROCHOID: 'epitrochoid', // Epitrocoide (futuro)
    HYPOTROCHOID: 'hypotrochoid' // Hipotrocoide (futuro)
};

/**
 * Servicio de cálculo de ciclógonos
 * Encapsula toda la lógica matemática
 */
export class CyclogonCalculator {
    /**
     * Constructor del calculador
     * @param {Object} options - Opciones de configuración
     */
    constructor(options = {}) {
        this.options = {
            pointsPerSide: options.pointsPerSide || CONFIG.CYCLOGON.POINTS_PER_SIDE,
            pointsPerRadian: options.pointsPerRadian || CONFIG.CYCLOGON.POINTS_PER_RADIAN,
            precision: options.precision || CONFIG.EXPORT.DECIMAL_PRECISION
        };
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - GENERACIÓN DE CURVAS
    // ==========================================

    /**
     * Genera una curva basada en la forma dada
     * @param {Polygon|Circle} shape - Forma base (polígono o círculo)
     * @param {Object} drawPoint - Punto de dibujo {x, y}
     * @param {number} cycles - Número de ciclos completos
     * @returns {Cyclogon} Modelo con los puntos de la curva
     */
    generate(shape, drawPoint, cycles = 1) {
        if (shape instanceof Circle) {
            return this.generateCycloid(shape, drawPoint, cycles);
        } else if (shape instanceof Polygon) {
            return this.generateCyclogon(shape, drawPoint, cycles);
        } else {
            throw new Error('Forma no soportada. Use Circle o Polygon.');
        }
    }

    /**
     * Genera una cicloide (curva de círculo rodando)
     * Ecuaciones paramétricas:
     *   X = R * θ + d * cos(α - θ)
     *   Y = R + d * sin(α - θ)
     * donde:
     *   R = radio del círculo
     *   θ = ángulo de rotación
     *   d = distancia del punto al centro
     *   α = ángulo inicial del punto
     * 
     * @param {Circle} circle - Círculo base
     * @param {Object} drawPoint - Punto de dibujo {x, y} relativo al centro
     * @param {number} cycles - Número de ciclos completos
     * @returns {Cyclogon} Modelo con los puntos de la cicloide
     */
    generateCycloid(circle, drawPoint, cycles = 1) {
        const cyclogon = new Cyclogon(CurveType.CYCLOID, circle);
        const R = circle.radius;
        
        // Distancia del punto de dibujo al centro
        const d = Math.sqrt(drawPoint.x ** 2 + drawPoint.y ** 2);
        
        // Ángulo inicial del punto de dibujo
        const alpha = Math.atan2(drawPoint.y, drawPoint.x);
        
        // Total de ángulo a recorrer
        const totalAngle = cycles * MATH.TWO_PI;
        
        // Número de puntos a generar
        const numPoints = Math.ceil(totalAngle * this.options.pointsPerRadian);
        
        // Generar puntos de la cicloide
        for (let i = 0; i <= numPoints; i++) {
            const theta = (i / numPoints) * totalAngle;
            
            // Posición del centro del círculo después de rodar θ radianes
            const centerX = R * theta;
            const centerY = R;
            
            // El punto rota en sentido opuesto al avance (horario cuando rueda hacia la derecha)
            const pointAngle = alpha - theta;
            
            // Posición del punto de dibujo
            const x = centerX + d * Math.cos(pointAngle);
            const y = centerY + d * Math.sin(pointAngle);
            
            cyclogon.addPoint({ x, y, theta, center: { x: centerX, y: centerY } });
        }
        
        // Calcular metadatos
        cyclogon.setMetadata({
            cycles: cycles,
            totalDistance: R * totalAngle,
            drawPointDistance: d,
            drawPointAngle: alpha
        });
        
        return cyclogon;
    }

    /**
     * Genera un ciclógono (curva de polígono rodando)
     * 
     * Algoritmo de construcción por arcos:
     * 1. El polígono descansa sobre un lado en el "piso" (Y=0)
     * 2. El vértice inferior derecho del lado en contacto es el pivote inicial
     * 3. El polígono rota alrededor de este pivote un ángulo exterior (2π/n)
     * 4. El punto de dibujo traza un arco circular alrededor del pivote
     * 5. Al completar la rotación, el siguiente vértice toca el suelo y se convierte en pivote
     * 6. Repetir para cada lado
     * 
     * @param {Polygon} polygon - Polígono base
     * @param {Object} drawPoint - Punto de dibujo {x, y} relativo al centro del polígono
     * @param {number} cycles - Número de ciclos completos
     * @returns {Cyclogon} Modelo con los puntos del ciclógono
     */
    generateCyclogon(polygon, drawPoint, cycles = 1) {
        const cyclogon = new Cyclogon(CurveType.CYCLOGON, polygon);
        
        const n = polygon.sides;
        const sideLength = polygon.getSideLength();
        const apothem = polygon.getApothem();
        const exteriorAngle = polygon.getExteriorAngle(); // 2π/n
        
        // 1. Ajustar orientación inicial
        // Encontrar el lado que debería estar en el suelo (el que tiene la normal más hacia abajo)
        const bottomSideIndex = this._findBottomSideIndex(polygon);
        
        // Calcular rotación necesaria para que ese lado quede horizontal en el suelo
        const currentNormalAngle = this._getEdgeNormalAngle(polygon, bottomSideIndex);
        const targetNormalAngle = -Math.PI / 2; // Normal apuntando hacia abajo
        const adjustmentRotation = targetNormalAngle - currentNormalAngle;
        
        // Ajustar el punto de dibujo a la nueva orientación
        const adjustedDrawPoint = this._rotatePoint(drawPoint, {x:0, y:0}, adjustmentRotation);
        
        // Total de lados a recorrer
        const totalSides = Math.ceil(cycles * n);
        
        // Ángulo de rotación inicial del polígono (para que descanse sobre un lado)
        let polygonRotation = 0;
        
        // Posición X acumulada del pivote
        // Empezamos en sideLength para que el primer lado descanse entre 0 y sideLength
        let pivotX = sideLength;
        
        // Para cada lado que el polígono rueda sobre
        for (let sideIndex = 0; sideIndex < totalSides; sideIndex++) {
            // Si estamos en el último ciclo parcial, ajustar puntos
            const isLastSide = sideIndex === totalSides - 1;
            const fractionOfLastSide = isLastSide && (cycles * n) % 1 !== 0 
                ? (cycles * n) % 1 
                : 1;
            
            // Número de puntos para este lado
            const pointsThisSide = Math.ceil(this.options.pointsPerSide * fractionOfLastSide);
            
            // Calcular el pivote actual (vértice en contacto con el suelo)
            // El pivote está en (pivotX, 0)
            const pivot = { x: pivotX, y: 0 };
            
            // Generar puntos del arco para este lado
            for (let p = 0; p <= pointsThisSide; p++) {
                // Evitar duplicar el último punto de un lado con el primero del siguiente
                if (p === pointsThisSide && sideIndex < totalSides - 1) continue;
                
                // Fracción del ángulo de rotación para este punto
                const t = p / this.options.pointsPerSide;
                
                // Ángulo de rotación LOCAL para este paso (0 a exteriorAngle)
                const localRotation = t * exteriorAngle;

                // Ángulo de rotación TOTAL acumulado
                const currentTotalRotation = polygonRotation + localRotation;
                
                // Calcular la posición del punto de dibujo
                // El punto de dibujo está a una posición (drawPoint.x, drawPoint.y) del centro
                // El centro del polígono está a una altura 'apothem' del suelo cuando descansa
                
                // Calcular la posición del centro del polígono relativo al pivote
                // Cuando el polígono rota alrededor del pivote, el centro orbita
                const centerDistance = this._getDistancePivotToCenter(polygon, sideIndex);
                const centerAngleFromPivot = this._getCenterAngleFromPivot(polygon, sideIndex);
                
                // El centro rota alrededor del pivote (usando rotación LOCAL)
                // Reseteamos la referencia para cada nuevo pivote
                const rotatedCenterAngle = centerAngleFromPivot - localRotation;
                const centerX = pivot.x + centerDistance * Math.cos(rotatedCenterAngle);
                const centerY = pivot.y + centerDistance * Math.sin(rotatedCenterAngle);
                
                // El punto de dibujo rota junto con el polígono (usando rotación TOTAL)
                // Usamos el punto ajustado
                const rotatedDrawPointAngle = Math.atan2(adjustedDrawPoint.y, adjustedDrawPoint.x) - currentTotalRotation;
                const drawPointDist = Math.sqrt(adjustedDrawPoint.x ** 2 + adjustedDrawPoint.y ** 2);
                
                const x = centerX + drawPointDist * Math.cos(rotatedDrawPointAngle);
                const y = centerY + drawPointDist * Math.sin(rotatedDrawPointAngle);
                
                cyclogon.addPoint({
                    x,
                    y,
                    sideIndex,
                    rotation: currentTotalRotation,
                    pivot: { ...pivot },
                    center: { x: centerX, y: centerY }
                });
            }
            
            // Actualizar para el siguiente lado
            pivotX += sideLength;
            polygonRotation += exteriorAngle;
        }
        
        // Calcular metadatos
        cyclogon.setMetadata({
            cycles: cycles,
            sides: n,
            totalDistance: totalSides * sideLength,
            sideLength: sideLength,
            exteriorAngle: exteriorAngle,
            adjustmentRotation: adjustmentRotation
        });
        
        return cyclogon;
    }

    /**
     * Encuentra el índice del lado que debería estar en el suelo (normal más cercana a -90°)
     * @private
     */
    _findBottomSideIndex(polygon) {
        let bestIndex = 0;
        let maxDot = -Infinity; // Dot product con vector (0, -1)
        
        for (let i = 0; i < polygon.sides; i++) {
            const edge = polygon.getEdge(i);
            const normal = edge.getNormal();
            // Dot product con (0, -1) es -normal.y
            const dot = -normal.y;
            
            if (dot > maxDot) {
                maxDot = dot;
                bestIndex = i;
            }
        }
        return bestIndex;
    }

    /**
     * Obtiene el ángulo de la normal de una arista
     * @private
     */
    _getEdgeNormalAngle(polygon, edgeIndex) {
        const edge = polygon.getEdge(edgeIndex);
        const normal = edge.getNormal();
        return Math.atan2(normal.y, normal.x);
    }

    // ==========================================
    // MÉTODOS PRIVADOS - CÁLCULOS AUXILIARES
    // ==========================================

    /**
     * Calcula la distancia del pivote (vértice en el suelo) al centro del polígono
     * @private
     * @param {Polygon} polygon - Polígono
     * @param {number} sideIndex - Índice del lado actual
     * @returns {number} Distancia
     */
    _getDistancePivotToCenter(polygon, sideIndex) {
        // El pivote es siempre un vértice del polígono
        // La distancia del vértice al centro es el radio circunscrito
        return polygon.radius;
    }

    /**
     * Calcula el ángulo inicial del centro respecto al pivote
     * @private
     * @param {Polygon} polygon - Polígono
     * @param {number} sideIndex - Índice del lado actual
     * @returns {number} Ángulo en radianes
     */
    _getCenterAngleFromPivot(polygon, sideIndex) {
        const n = polygon.sides;
        
        // El polígono comienza con un vértice arriba (rotationOffset = -π/2)
        // Cuando descansa sobre un lado, los dos vértices inferiores tocan el suelo
        // El pivote es el vértice derecho del lado en contacto
        
        // Ángulo inicial: el centro está "arriba" del pivote
        // Para un polígono descansando sobre un lado:
        // - El centro está a una distancia R del pivote
        // - El ángulo depende de qué vértice es el pivote
        
        // Para el primer lado (sideIndex = 0):
        // El pivote es el vértice que está en el lado inferior derecho
        // El centro está arriba y a la izquierda del pivote
        
        // Ángulo interior en cada vértice
        const interiorAngle = polygon.getInteriorAngle();
        
        // Ángulo del centro respecto al pivote inicial
        // Para un polígono regular, cuando descansa sobre un lado con el vértice arriba,
        // el ángulo del centro desde el vértice-pivote es:
        const baseAngle = MATH.HALF_PI + (Math.PI - interiorAngle) / 2;
        
        return baseAngle;
    }

    /**
     * Rotación de un punto alrededor de un pivote
     * @private
     * @param {Object} point - Punto a rotar {x, y}
     * @param {Object} pivot - Centro de rotación {x, y}
     * @param {number} angle - Ángulo de rotación (positivo = antihorario)
     * @returns {Object} Punto rotado {x, y}
     */
    _rotatePoint(point, pivot, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const dx = point.x - pivot.x;
        const dy = point.y - pivot.y;
        
        return {
            x: pivot.x + dx * cos - dy * sin,
            y: pivot.y + dx * sin + dy * cos
        };
    }

    // ==========================================
    // MÉTODOS PÚBLICOS - ANÁLISIS DE CURVAS
    // ==========================================

    /**
     * Calcula propiedades de la curva generada
     * @param {Cyclogon} cyclogon - Curva a analizar
     * @returns {Object} Propiedades calculadas
     */
    analyzeShape(cyclogon) {
        const points = cyclogon.getPoints();
        
        if (points.length < 2) {
            return null;
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let totalArcLength = 0;
        
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
            
            if (i > 0) {
                const prev = points[i - 1];
                totalArcLength += Math.sqrt(
                    (p.x - prev.x) ** 2 + (p.y - prev.y) ** 2
                );
            }
        }
        
        return {
            boundingBox: {
                minX, maxX, minY, maxY,
                width: maxX - minX,
                height: maxY - minY
            },
            arcLength: totalArcLength,
            pointCount: points.length
        };
    }

    /**
     * Simplifica una curva reduciendo el número de puntos
     * Usa el algoritmo de Douglas-Peucker
     * @param {Cyclogon} cyclogon - Curva a simplificar
     * @param {number} tolerance - Tolerancia de simplificación
     * @returns {Array} Array de puntos simplificado
     */
    simplify(cyclogon, tolerance = 0.01) {
        const points = cyclogon.getPoints();
        
        if (points.length < 3) {
            return points;
        }
        
        return this._douglasPeucker(points, tolerance);
    }

    /**
     * Algoritmo Douglas-Peucker para simplificación de líneas
     * @private
     */
    _douglasPeucker(points, tolerance) {
        if (points.length < 3) return points;
        
        // Encontrar el punto más lejano de la línea entre el primero y último
        let maxDistance = 0;
        let maxIndex = 0;
        
        const first = points[0];
        const last = points[points.length - 1];
        
        for (let i = 1; i < points.length - 1; i++) {
            const distance = this._perpendicularDistance(points[i], first, last);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }
        
        // Si la distancia máxima es mayor que la tolerancia, recursivamente simplificar
        if (maxDistance > tolerance) {
            const left = this._douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
            const right = this._douglasPeucker(points.slice(maxIndex), tolerance);
            
            return left.slice(0, -1).concat(right);
        } else {
            return [first, last];
        }
    }

    /**
     * Calcula la distancia perpendicular de un punto a una línea
     * @private
     */
    _perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            return Math.sqrt(
                (point.x - lineStart.x) ** 2 + 
                (point.y - lineStart.y) ** 2
            );
        }
        
        const t = Math.max(0, Math.min(1, 
            ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared
        ));
        
        const projX = lineStart.x + t * dx;
        const projY = lineStart.y + t * dy;
        
        return Math.sqrt(
            (point.x - projX) ** 2 + 
            (point.y - projY) ** 2
        );
    }
}

export default CyclogonCalculator;
