# PRD: Generador de Ciclógonos 2D

## Documento de Requisitos del Producto (PRD)

**Versión:** 1.0  
**Fecha:** 7 de Diciembre, 2025  
**Estado:** En Desarrollo  
**Autor:** Equipo de Desarrollo

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Proyecto
Aplicación web interactiva para generar y visualizar ciclógonos en 2D. Un ciclógono es la curva trazada por un punto fijo en un polígono regular (o círculo) mientras este rueda sin deslizar sobre una línea recta (superficie plana).

### 1.2 Objetivo Principal
Crear una herramienta educativa y visual que permita a los usuarios:
- Configurar polígonos regulares (desde 3 lados) o círculos
- Posicionar un punto de dibujo en cualquier lugar del polígono
- Visualizar la trayectoria (ciclógono) generada al rodar el polígono
- Exportar los datos de la curva generada

### 1.3 Stack Tecnológico
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Biblioteca Gráfica:** Three.js
- **Arquitectura:** Capas separadas (MVC-like)

---

## 2. Arquitectura del Sistema

### 2.1 Estructura de Carpetas
```
cyclogons_graph/
├── index.html                 # Punto de entrada HTML
├── css/
│   ├── main.css              # Estilos principales
│   ├── config-panel.css      # Estilos panel configuración
│   └── graph-panel.css       # Estilos panel gráfico
├── js/
│   ├── app.js                # Inicialización de la aplicación
│   ├── config/
│   │   └── constants.js      # Constantes y configuraciones
│   ├── models/
│   │   ├── Polygon.js        # Modelo del polígono
│   │   ├── Circle.js         # Modelo del círculo
│   │   ├── DrawPoint.js      # Modelo del punto de dibujo
│   │   └── Cyclogon.js       # Modelo del ciclógono
│   ├── views/
│   │   ├── ConfigPanelView.js    # Vista panel configuración
│   │   └── GraphPanelView.js     # Vista panel gráfico
│   ├── controllers/
│   │   ├── ConfigController.js   # Controlador configuración
│   │   ├── GraphController.js    # Controlador gráfico
│   │   └── InputController.js    # Controlador de entrada (mouse/teclado)
│   ├── services/
│   │   ├── CyclogonCalculator.js # Servicio de cálculo matemático
│   │   └── ExportService.js      # Servicio de exportación CSV
│   └── utils/
│       ├── MathUtils.js          # Utilidades matemáticas
│       └── GeometryUtils.js      # Utilidades geométricas
├── assets/
│   └── icons/                    # Iconos de la interfaz
├── docs/
│   ├── DEVELOPMENT_LOG.md        # Registro de avances
│   └── API_REFERENCE.md          # Referencia de la API interna
└── README.md                     # Documentación del proyecto
```

### 2.2 Diagrama de Capas
```
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                  │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  ConfigPanelView    │  │    GraphPanelView       │   │
│  │  (Three.js Scene)   │  │    (Three.js Scene)     │   │
│  └─────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                   CAPA DE CONTROLADORES                  │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │ConfigController│ │GraphController│ │InputController│  │
│  └───────────────┘ └───────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                     │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │ CyclogonCalculator  │  │    ExportService        │   │
│  └─────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                     CAPA DE MODELOS                      │
│  ┌────────┐ ┌────────┐ ┌───────────┐ ┌───────────────┐  │
│  │Polygon │ │Circle  │ │ DrawPoint │ │   Cyclogon    │  │
│  └────────┘ └────────┘ └───────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    CAPA DE UTILIDADES                    │
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │     MathUtils       │  │    GeometryUtils        │   │
│  └─────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Especificaciones Funcionales

### 3.1 Panel de Configuración (Lado Izquierdo)

#### 3.1.1 Selector de Forma
| Elemento | Descripción |
|----------|-------------|
| **Círculo** | Botón/opción para seleccionar círculo como forma base |
| **Polígono Regular** | Selector numérico (spinner) para elegir número de lados (mínimo 3) |
| **Visualización** | Renderizado en tiempo real de la forma seleccionada |

#### 3.1.2 Punto de Dibujo (Draw Point)
| Funcionalidad | Descripción |
|---------------|-------------|
| **Posición Inicial** | En un vértice (polígono) o parte superior (círculo) |
| **Arrastre Libre** | El usuario puede mover el punto libremente dentro/fuera del polígono |
| **Modo Snap (SHIFT)** | Al mantener SHIFT, el punto se restringe a los bordes de la forma |
| **Indicador Visual** | Punto destacado con color diferente y radio visible |

#### 3.1.3 Información Mostrada
- Tipo de forma actual
- Número de lados (si es polígono)
- Coordenadas del punto de dibujo (relativas al centro)
- Radio del polígono/círculo (fijo, no editable)

### 3.2 Botón de Reinicio y Estado Inicial

#### 3.2.1 Botón de Reinicio
| Elemento | Descripción |
|----------|-------------|
| **Ubicación** | Panel de configuración, visible y accesible |
| **Icono** | 🔄 o similar, con etiqueta "Reiniciar" |
| **Acción** | Restaura el sistema al estado inicial |

#### 3.2.2 Estado Inicial del Sistema
| Parámetro | Valor Inicial |
|-----------|---------------|
| **Forma** | Círculo |
| **Curva** | Cicloide clásica |
| **Punto de dibujo** | Borde superior de la circunferencia (ángulo 90° / π/2) |
| **Longitud de gráfica** | Valor por defecto (1 ciclo completo) |

#### 3.2.3 Comportamiento al Cambiar de Polígono
| Evento | Acción |
|--------|--------|
| **Cambio de número de lados** | El punto de dibujo se reposiciona automáticamente a un vértice superior del polígono |
| **Cambio de círculo a polígono** | El punto de dibujo se reposiciona al vértice superior del nuevo polígono |
| **Cambio de polígono a círculo** | El punto de dibujo se reposiciona al borde superior del círculo |

---

### 3.3 Panel Gráfico (Inferior)

#### 3.3.1 Visualización del Ciclógono
| Elemento | Descripción |
|----------|-------------|
| **Superficie Plana** | Línea horizontal representando el "piso" |
| **Curva del Ciclógono** | Trayectoria trazada por el punto de dibujo |
| **Animación Opcional** | Mostrar el polígono rodando (opcional, mejora UX) |

#### 3.3.2 Controles del Panel Gráfico
| Control | Descripción |
|---------|-------------|
| **Longitud de Gráfica** | Slider para ajustar cuántas "vueltas" o distancia mostrar |
| **Botón Exportar CSV** | Descarga archivo CSV con columnas X, Y |
| **Botón Reiniciar** | Restaura al estado inicial (círculo con punto superior) |
| **Zoom/Pan** | Controles básicos de navegación (opcional) |

### 3.4 Exportación CSV

#### Formato de Salida
```csv
X,Y
0.000000,0.000000
0.052336,0.003427
0.104528,0.013661
...
```

#### Configuración de Exportación
- Precisión decimal configurable (default: 6 decimales)
- Nombre de archivo: `cyclogon_[forma]_[timestamp].csv`

---

## 4. Especificaciones Técnicas

### 4.1 Modelos de Datos

#### 4.1.1 Polygon Model
```javascript
class Polygon {
    constructor(sides, radius) {
        this.sides = sides;          // número de lados (≥3)
        this.radius = radius;        // radio circunscrito (fijo)
        this.vertices = [];          // array de Vector2
        this.edges = [];             // array de Edge objects
    }
    
    getVertices() { }               // Calcula vértices
    getEdge(index) { }              // Obtiene arista específica
    getPerimeter() { }              // Calcula perímetro
    getSideLength() { }             // Longitud de cada lado
}
```

#### 4.1.2 Circle Model
```javascript
class Circle {
    constructor(radius) {
        this.radius = radius;
        this.circumference = 2 * Math.PI * radius;
    }
    
    getPointOnCircle(angle) { }     // Punto en ángulo dado
}
```

#### 4.1.3 DrawPoint Model
```javascript
class DrawPoint {
    constructor(x, y) {
        this.position = new Vector2(x, y);
        this.isSnappedToEdge = false;
        this.currentEdgeIndex = null;
        this.edgeParameter = 0;      // 0-1 posición en arista
    }
    
    setPosition(x, y) { }
    snapToEdge(polygon, edgeIndex, t) { }
    getDistanceFromCenter() { }
}
```

#### 4.1.4 Cyclogon Model
```javascript
class Cyclogon {
    constructor() {
        this.points = [];            // Array de Vector2
        this.totalDistance = 0;
        this.currentRotation = 0;
    }
    
    addPoint(point) { }
    getPoints() { }
    clear() { }
}
```

### 4.2 Algoritmo de Cálculo del Ciclógono

#### Para Polígonos Regulares (Construcción Geométrica por Arcos):
El movimiento no es continuo, sino una secuencia de arcos circulares.
1. **Inicialización**:
   - El polígono comienza descansando sobre un lado.
   - El primer "pivote" (punto de contacto) está en `(L/2, 0)` o `(-L/2, 0)` dependiendo de la referencia.
2. **Iteración por cada lado (paso)**:
   - Se define el vértice actual que toca el suelo como el **Centro de Rotación (Pivote)**.
   - El **Punto de Dibujo** traza un arco circular alrededor de este Pivote.
   - El ángulo total de rotación para este paso es el ángulo exterior: `β = 2π/n`.
   - Se discretiza este arco en `k` puntos para suavidad visual.
3. **Transición**:
   - Al completar el ángulo `β`, el siguiente vértice del polígono toca el suelo.
   - Este nuevo vértice se convierte en el nuevo Pivote.
   - La posición del nuevo Pivote en X aumenta en `L` (longitud del lado).
   - Repetir el proceso.

#### Para Círculos (Cicloide clásica):
```
1. Parametrizar por ángulo θ de rotación (continuo)
2. X = R * (θ - d * sin(θ))
3. Y = R * (1 - d * cos(θ))
   donde d = distancia_punto_centro / R
```

### 4.3 Fórmulas Matemáticas Clave

| Concepto | Fórmula |
|----------|---------|
| Vértices del polígono | `(R·cos(2πk/n), R·sin(2πk/n))` para k=0..n-1 |
| Longitud de lado (L) | `2R·sin(π/n)` |
| Apotema (Altura centro) | `R·cos(π/n)` |
| Ángulo interior | `(n-2)π/n` |
| Ángulo de rotación por paso | `2π/n` (Ángulo exterior) |
| Circunferencia del círculo | `2πR` |

### 4.4 Integración con Three.js

#### Escena del Panel de Configuración
```javascript
// Setup básico
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(...);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Geometrías
const polygonGeometry = new THREE.BufferGeometry();
const drawPointGeometry = new THREE.CircleGeometry(pointRadius, 32);

// Interactividad con Raycaster
const raycaster = new THREE.Raycaster();
```

#### Escena del Panel Gráfico
```javascript
// Setup similar pero para visualización
const graphScene = new THREE.Scene();
const graphCamera = new THREE.OrthographicCamera(...);

// Línea del ciclógono
const cyclogonGeometry = new THREE.BufferGeometry();
const cyclogonMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const cyclogonLine = new THREE.Line(cyclogonGeometry, cyclogonMaterial);
```

---

## 5. Interfaz de Usuario (UI/UX)

### 5.1 Layout Principal

> **Nota de Diseño:** El layout utiliza una distribución **horizontal (arriba-abajo)** para maximizar el espacio del panel gráfico, permitiendo que el ciclógono se extienda horizontalmente sin restricciones.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HEADER                                             │
│                    "Generador de Ciclógonos"                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                      PANEL DE CONFIGURACIÓN (Superior)                       │
│  ┌──────────────┐  ┌───────────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ [○] Círculo  │  │ [●] Polígono: [3▼]│  │  ┌─────┐    │  │ Punto:      │  │
│  │              │  │                   │  │  │ /\  │    │  │ (0.5, 0.3)  │  │
│  │              │  │                   │  │  │/ •\ │    │  │ Radio: 1.0  │  │
│  └──────────────┘  └───────────────────┘  │  └────-┘    │  └─────────────┘  │
│                                           └─────────────┘                    │
│  [🔄 Reiniciar]  │  Longitud: [────●────] 3 ciclos  │  [📥 Exportar CSV]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                        PANEL GRÁFICO (Inferior - Maximizado)                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~        │  │
│  │        /                      \                      /                │  │
│  │       /                        \                    /                 │  │
│  │  ─────────────────────────────────────────────────────────────────    │  │
│  │                              (piso)                                   │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│   SHIFT: Snap a bordes │ Arrastra el punto para mover                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Requisitos de Interfaz Creativa

> ⚠️ **OBLIGATORIO**: La interfaz debe ser **moderna, creativa y visualmente atractiva**. NO se deben utilizar estilos por defecto del navegador.

#### 5.2.1 Principios de Diseño
| Principio | Descripción |
|-----------|-------------|
| **Modernidad** | Uso de tendencias actuales de diseño UI/UX (glassmorphism, neumorphism, gradientes suaves) |
| **Creatividad** | Elementos visuales únicos y distintivos que reflejen la naturaleza matemática del proyecto |
| **Animaciones** | Transiciones suaves y micro-interacciones que mejoren la experiencia del usuario |
| **Tipografía** | Fuentes modernas (Google Fonts o similares), NO fuentes del sistema por defecto |

#### 5.2.2 Fuentes Recomendadas
| Uso | Fuente Sugerida | Alternativa |
|-----|-----------------|-------------|
| **Títulos** | Poppins, Montserrat, Inter | Raleway, Outfit |
| **Cuerpo/UI** | Inter, Roboto, Open Sans | Source Sans Pro, Nunito |
| **Datos/Números** | JetBrains Mono, Fira Code | Roboto Mono, Space Mono |

#### 5.2.3 Estilos Obligatorios
| Elemento | Requisito |
|----------|----------|
| **Botones** | Estilo personalizado con hover effects, sombras suaves y bordes redondeados |
| **Inputs/Sliders** | Controles customizados, NO estilos nativos del navegador |
| **Paneles** | Fondos con gradientes sutiles o efectos de cristal (glassmorphism) |
| **Transiciones** | Animaciones CSS/JS para cambios de estado (ease-out, 200-300ms) |
| **Iconografía** | Iconos consistentes (Font Awesome, Lucide, o SVG personalizados) |

#### 5.2.4 Animaciones Requeridas
| Interacción | Animación |
|-------------|----------|
| **Hover en botones** | Escala sutil (1.02-1.05) + cambio de color/sombra |
| **Click en controles** | Feedback visual inmediato (ripple effect o similar) |
| **Cambio de forma** | Transición suave del polígono/círculo |
| **Actualización de gráfica** | Redibujado progresivo o fade-in de la curva |
| **Arrastre de punto** | Trail visual o indicador de movimiento |

### 5.3 Paleta de Colores Sugerida
| Elemento | Color | Hex |
|----------|-------|-----|
| Fondo Configuración | Gris oscuro | `#1a1a2e` |
| Fondo Gráfico | Negro | `#0f0f0f` |
| Polígono | Azul claro | `#4cc9f0` |
| Punto de dibujo | Rojo/Naranja | `#f72585` |
| Línea del ciclógono | Verde brillante | `#00ff88` |
| Superficie/Piso | Blanco | `#ffffff` |
| UI Elements | Gris medio | `#adb5bd` |

### 5.4 Interacciones de Usuario

| Acción | Resultado |
|--------|-----------|
| Click en punto de dibujo + Drag | Mueve el punto libremente |
| SHIFT + Drag en punto | Snap del punto a los bordes |
| Cambiar selector de lados | Actualiza polígono y recalcula ciclógono |
| Cambiar a círculo | Cambia forma y recalcula |
| Ajustar slider longitud | Extiende/reduce la curva mostrada |
| Click en Exportar CSV | Descarga archivo con los puntos |
| Click en Reiniciar | Restaura círculo con punto en borde superior |

---

## 6. Plan de Desarrollo

### 6.1 Fases del Proyecto

#### FASE 1: Configuración Base (Sprint 1)
| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| Crear estructura de carpetas | Alta | 0.5h |
| Configurar index.html base | Alta | 0.5h |
| Implementar constantes y configuración | Alta | 0.5h |
| Setup básico de Three.js (dos escenas) | Alta | 2h |
| Estilos CSS base (layout dividido) | Alta | 1h |

#### FASE 2: Panel de Configuración (Sprint 2)
| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| Modelo Polygon | Alta | 2h |
| Modelo Circle | Alta | 1h |
| Modelo DrawPoint | Alta | 1.5h |
| Vista ConfigPanelView | Alta | 3h |
| Renderizado de polígono con Three.js | Alta | 2h |
| Controles UI (selector forma, lados) | Alta | 2h |

#### FASE 3: Interactividad del Punto (Sprint 3)
| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| InputController (mouse events) | Alta | 2h |
| Drag & Drop del punto de dibujo | Alta | 2h |
| Detección de tecla SHIFT | Alta | 1h |
| Lógica de snap a bordes | Alta | 3h |
| Feedback visual del punto | Media | 1h |

#### FASE 4: Cálculo del Ciclógono (Sprint 4)
| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| CyclogonCalculator service | Alta | 4h |
| Implementar algoritmo de arcos (Polígonos) | Alta | 3h |
| Implementar fórmula paramétrica (Círculos) | Alta | 2h |
| Modelo Cyclogon | Alta | 1h |
| Tests de cálculos matemáticos | Media | 2h |

#### FASE 5: Panel Gráfico (Sprint 5)
| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| Vista GraphPanelView | Alta | 3h |
| Renderizado de la curva | Alta | 2h |
| Slider de longitud | Alta | 1.5h |
| Línea del piso | Alta | 0.5h |
| Actualización en tiempo real | Alta | 2h |

#### FASE 6: Exportación y Pulido (Sprint 6)
| Tarea | Prioridad | Estimación |
|-------|-----------|------------|
| ExportService (CSV) | Alta | 2h |
| Botón de exportación | Alta | 1h |
| Pulido de UI/UX | Media | 3h |
| Optimización de rendimiento | Media | 2h |
| Documentación final | Media | 2h |

### 6.2 Cronograma Estimado
```
Semana 1: Fase 1 + Fase 2
Semana 2: Fase 3 + Fase 4
Semana 3: Fase 5 + Fase 6
```

**Tiempo Total Estimado:** ~50 horas de desarrollo

---

## 7. Requisitos No Funcionales

### 7.1 Rendimiento
- La aplicación debe mantener 60 FPS en la visualización
- El cálculo del ciclógono debe completarse en < 100ms
- Soporte para al menos 10,000 puntos en la curva

### 7.2 Compatibilidad
- Navegadores modernos: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Resoluciones: 1280x720 mínimo, responsive hasta 4K
- Dispositivos: Desktop (mouse obligatorio para interacción óptima)

### 7.3 Accesibilidad
- Contraste de colores adecuado (WCAG AA)
- Indicadores visuales claros para el estado del punto
- Tooltips informativos en controles

---

## 8. Requisitos Obligatorios del Desarrollador

### 8.1 Documentación Continua

> ⚠️ **OBLIGATORIO**: El desarrollador DEBE mantener actualizada la documentación durante todo el proceso de desarrollo.

#### Archivo: `docs/DEVELOPMENT_LOG.md`
```markdown
# Registro de Desarrollo

## [Fecha] - [Sprint/Fase]

### Tareas Completadas
- [ ] Tarea 1
- [ ] Tarea 2

### Cambios Realizados
- Descripción de cambios...

### Problemas Encontrados
- Problema y solución...

### Próximos Pasos
- Siguiente tarea...
```

#### Actualización Requerida
| Momento | Acción |
|---------|--------|
| Inicio de cada fase | Crear entrada en el log |
| Completar cada tarea | Marcar como completada |
| Encontrar problema | Documentar problema y solución |
| Fin de cada fase | Resumen de avances |

### 8.2 Consulta de Documentación

> ⚠️ **OBLIGATORIO**: Consultar documentación actualizada antes de implementar.

#### Fuentes de Documentación
1. **MCP Context7** (si está disponible)
   - Consultar API de Three.js actualizada
   - Verificar mejores prácticas actuales

2. **Documentación Web Oficial**
   - Three.js: https://threejs.org/docs/
   - MDN Web Docs para JavaScript/HTML/CSS

#### Protocolo de Consulta
```
1. Antes de implementar un componente Three.js:
   → Consultar Context7 o docs oficiales
   → Verificar compatibilidad de versión
   → Documentar versión utilizada

2. Para algoritmos matemáticos:
   → Verificar fórmulas en fuentes confiables
   → Documentar referencia utilizada
```

---

## 9. Criterios de Aceptación

### 9.1 Panel de Configuración
- [ ] Se puede seleccionar entre círculo y polígono
- [ ] El polígono permite configurar desde 3 lados en adelante
- [ ] El punto de dibujo es visible y draggable
- [ ] SHIFT + drag hace snap a los bordes
- [ ] Se muestran las coordenadas del punto en tiempo real
- [ ] El botón de reinicio restaura al estado inicial (círculo + punto superior)
- [ ] Al cambiar número de lados, el punto se reposiciona al vértice superior

### 9.2 Panel Gráfico
- [ ] Se visualiza la curva del ciclógono correctamente
- [ ] El slider de longitud funciona correctamente
- [ ] La gráfica se actualiza en tiempo real al mover el punto
- [ ] El piso/superficie es visible

### 9.3 Exportación
- [ ] El botón de exportar genera un archivo CSV válido
- [ ] El CSV contiene columnas X, Y con los puntos correctos
- [ ] El archivo se descarga correctamente

### 9.4 Interfaz de Usuario
- [ ] NO se utilizan estilos por defecto del navegador
- [ ] Se utilizan fuentes modernas (Google Fonts o similares)
- [ ] Los botones tienen efectos hover y animaciones
- [ ] Los controles (sliders, inputs) están personalizados
- [ ] Existen transiciones suaves entre estados
- [ ] La paleta de colores es consistente y moderna

### 9.5 General
- [ ] La aplicación funciona sin errores en consola
- [ ] El rendimiento es fluido (60 FPS)
- [ ] El código está organizado por capas
- [ ] La documentación está actualizada

---

## 10. Glosario

| Término | Definición |
|---------|------------|
| **Ciclógono** | Curva generada por un punto en un polígono que rueda sobre una línea recta |
| **Cicloide** | Caso especial de ciclógono cuando la forma es un círculo |
| **Epicicloide** | Curva generada cuando un círculo rueda sobre otro círculo (fuera de alcance) |
| **Snap** | Acción de "pegar" o restringir un elemento a una posición específica |
| **Draw Point** | Punto de dibujo que genera la trayectoria |
| **Polígono Regular** | Polígono con todos los lados y ángulos iguales |

---

## 11. Referencias

1. **Three.js Documentation**: https://threejs.org/docs/
2. **Cyclogon Mathematics**: https://mathworld.wolfram.com/Cyclogon.html
3. **Roulette Curves**: https://en.wikipedia.org/wiki/Roulette_(curve)

---

## 12. Historial de Versiones del PRD

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 07/12/2025 | Equipo | Versión inicial del PRD |

---

## 13. Aprobaciones

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Product Owner | | | |
| Tech Lead | | | |
| Desarrollador | | | |

---

*Este documento es la fuente de verdad para el desarrollo del Generador de Ciclógonos. Cualquier cambio debe ser documentado y aprobado.*
