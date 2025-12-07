# 🌀 Generador de Ciclógonos 2D

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/three.js-0.160.0-green.svg" alt="Three.js">
  <img src="https://img.shields.io/badge/license-MIT-orange.svg" alt="License">
</p>

Una aplicación web interactiva para generar y visualizar ciclógonos en 2D. Un **ciclógono** es la curva trazada por un punto fijo en un polígono regular (o círculo) mientras este rueda sin deslizar sobre una línea recta.

![Cyclogon Generator Preview](docs/preview.png)

---

## 🎯 Características

- **Múltiples formas**: Genera curvas con círculos (cicloide clásica) o polígonos regulares de 3 a 20 lados
- **Punto de dibujo interactivo**: Arrastra el punto libremente o usa SHIFT para snap a los bordes
- **Visualización en tiempo real**: Observa cómo cambia la curva mientras ajustas los parámetros
- **Controles intuitivos**: Ajusta el número de ciclos con un slider
- **Zoom y pan**: Navega por la gráfica con scroll y arrastre
- **Exportación múltiple**: Descarga tus curvas en CSV, SVG o JSON
- **Diseño moderno**: Interfaz con glassmorphism, gradientes y animaciones suaves

---

## 🚀 Demo

Abre `index.html` en tu navegador para usar la aplicación localmente.

---

## 📦 Instalación

No requiere instalación. Simplemente clona el repositorio y abre el archivo HTML:

```bash
git clone https://github.com/tu-usuario/cyclogons_graph.git
cd cyclogons_graph
```

Luego abre `index.html` en un navegador moderno (Chrome, Firefox, Safari o Edge).

> **Nota**: Three.js se carga desde CDN (unpkg), por lo que necesitas conexión a internet para la primera carga.

---

## 🎮 Uso

### Panel de Configuración

1. **Selecciona la forma base**:
   - **Círculo**: Genera una cicloide clásica
   - **Polígono**: Genera un ciclógono (usa los botones +/- para ajustar los lados)

2. **Posiciona el punto de dibujo**:
   - Arrastra el punto rosa en la vista previa
   - Mantén **SHIFT** para que el punto se adhiera a los bordes de la forma

3. **Ajusta los ciclos**: Usa el slider para controlar cuántas vueltas completas visualizar

### Panel Gráfico

- **Zoom**: Usa la rueda del ratón o los botones +/-
- **Pan**: Arrastra con el ratón para desplazar la vista
- **Ajustar vista**: Click en el botón de maximizar para centrar la curva

### Exportación

1. Selecciona el formato deseado (CSV, SVG, JSON)
2. Ajusta la precisión decimal (1-12 decimales)
3. Click en "Exportar"

---

## 🔧 Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| **SHIFT + Drag** | Snap del punto a los bordes |
| **Doble Click** | Resetear punto a posición inicial |

---

## 📁 Estructura del Proyecto

```
cyclogons_graph/
├── index.html                    # Punto de entrada
├── css/
│   ├── main.css                  # Estilos globales y variables
│   ├── config-panel.css          # Estilos del panel de configuración
│   └── graph-panel.css           # Estilos del panel gráfico
├── js/
│   ├── app.js                    # Aplicación principal
│   ├── config/
│   │   └── constants.js          # Constantes y configuración
│   ├── controllers/
│   │   └── InputController.js    # Manejo de entrada (mouse/teclado)
│   ├── models/
│   │   ├── Polygon.js            # Modelo del polígono
│   │   ├── Circle.js             # Modelo del círculo
│   │   ├── DrawPoint.js          # Modelo del punto de dibujo
│   │   └── Cyclogon.js           # Modelo de la curva
│   ├── services/
│   │   ├── CyclogonCalculator.js # Cálculos matemáticos
│   │   └── ExportService.js      # Servicio de exportación
│   └── views/
│       ├── ConfigPanelView.js    # Vista del panel de configuración
│       └── GraphPanelView.js     # Vista del panel gráfico
├── docs/
│   └── DEVELOPMENT_LOG.md        # Registro de desarrollo
└── README.md
```

---

## 🧮 Matemáticas

### Cicloide (Círculo)

La cicloide se genera usando las ecuaciones paramétricas:

```
X = R · θ + d · cos(α - θ)
Y = R + d · sin(α - θ)
```

Donde:
- **R**: Radio del círculo
- **θ**: Ángulo de rotación acumulado
- **d**: Distancia del punto de dibujo al centro
- **α**: Ángulo inicial del punto de dibujo

### Ciclógono (Polígono)

El ciclógono se construye como una secuencia de arcos circulares:

1. El polígono descansa sobre un lado
2. El vértice en contacto con el suelo es el **pivote**
3. El polígono rota alrededor del pivote un ángulo exterior (2π/n)
4. El punto de dibujo traza un arco circular
5. Al completar la rotación, el siguiente vértice toca el suelo
6. Se repite para cada lado

**Fórmulas clave**:
- Longitud de lado: `L = 2R · sin(π/n)`
- Ángulo exterior: `β = 2π/n`
- Apotema: `a = R · cos(π/n)`

---

## 🎨 Formatos de Exportación

### CSV
```csv
X,Y
0.000000,0.000000
0.052336,0.003427
...
```

### SVG
Vector escalable con efecto glow y gradientes. Ideal para diseño gráfico.

### JSON
```json
{
  "type": "cycloid",
  "pointCount": 628,
  "points": [...],
  "metadata": {...},
  "boundingBox": {...}
}
```

---

## 🛠️ Tecnologías

- **HTML5 / CSS3 / JavaScript ES6+**
- **Three.js v0.160.0** - Renderizado 2D con WebGL
- **Lucide Icons** - Iconografía
- **Google Fonts** - Inter, Poppins, JetBrains Mono

---

## 📊 Rendimiento

- **60 FPS** de renderizado continuo
- **Throttling** en actualizaciones durante arrastre
- **Simplificación Douglas-Peucker** disponible para curvas densas
- Soporta hasta **10,000+ puntos** sin degradación notable

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Para cambios importantes:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- [Three.js](https://threejs.org/) por la biblioteca de renderizado
- [Lucide](https://lucide.dev/) por los iconos
- [MathWorld](https://mathworld.wolfram.com/Cyclogon.html) por la documentación matemática

---

<p align="center">
  Hecho con 💜 y matemáticas
</p>
