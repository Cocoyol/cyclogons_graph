/**
 * ============================================
 * ANIMATIONCONTROLSVIEW.JS - Vista de Controles
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Gestiona la interfaz de usuario para el control
 * de la animación (botones, slider, etc).
 */

export class AnimationControlsView {
    /**
     * @param {HTMLElement} container - Elemento contenedor
     * @param {Object} callbacks - Callbacks de eventos
     */
    constructor(container, callbacks = {}) {
        this._container = container;
        this._callbacks = {
            onPlay: callbacks.onPlay || (() => {}),
            onPause: callbacks.onPause || (() => {}),
            onStop: callbacks.onStop || (() => {}),
            onStepForward: callbacks.onStepForward || (() => {}),
            onStepBackward: callbacks.onStepBackward || (() => {}),
            onSeek: callbacks.onSeek || (() => {})
        };

        this._isPlaying = false;
        this._render();
        this._bindEvents();
    }

    /**
     * Renderiza los controles en el contenedor
     * @private
     */
    _render() {
        this._container.innerHTML = `
            <div class="anim-controls" id="animControlsRoot">
                <div class="anim-buttons">
                    <button class="anim-btn" id="animBtnStart" title="Ir al inicio">
                        <i data-lucide="skip-back"></i>
                    </button>
                    <button class="anim-btn" id="animBtnStepBack" title="Paso atrás">
                        <i data-lucide="rewind"></i>
                    </button>
                    <button class="anim-btn play-btn" id="animBtnPlayPause" title="Reproducir/Pausar">
                        <i data-lucide="play"></i>
                    </button>
                    <button class="anim-btn" id="animBtnStepFwd" title="Paso adelante">
                        <i data-lucide="fast-forward"></i>
                    </button>
                    <button class="anim-btn" id="animBtnEnd" title="Ir al final">
                        <i data-lucide="skip-forward"></i>
                    </button>
                </div>
                <div class="anim-progress-container">
                    <input type="range" class="anim-slider" id="animSlider" min="0" max="1000" value="0">
                </div>
            </div>
        `;
        
        // Inicializar iconos
        if (window.lucide) {
            window.lucide.createIcons({
                root: this._container
            });
        }
    }

    /**
     * Vincula los eventos del DOM
     * @private
     */
    _bindEvents() {
        this._btnPlayPause = this._container.querySelector('#animBtnPlayPause');
        this._btnStart = this._container.querySelector('#animBtnStart');
        this._btnEnd = this._container.querySelector('#animBtnEnd');
        this._btnStepBack = this._container.querySelector('#animBtnStepBack');
        this._btnStepFwd = this._container.querySelector('#animBtnStepFwd');
        this._slider = this._container.querySelector('#animSlider');
        this._iconPlayPause = this._btnPlayPause.querySelector('i'); // O svg si lucide ya renderizó

        this._btnPlayPause.addEventListener('click', () => {
            if (this._isPlaying) {
                this._callbacks.onPause();
            } else {
                this._callbacks.onPlay();
            }
        });

        this._btnStart.addEventListener('click', () => {
            this._callbacks.onSeek(0);
            this._callbacks.onPause(); // Opcional: pausar al ir al inicio
        });

        this._btnEnd.addEventListener('click', () => {
            this._callbacks.onSeek(1);
            this._callbacks.onPause();
        });

        this._btnStepBack.addEventListener('click', () => this._callbacks.onStepBackward());
        this._btnStepFwd.addEventListener('click', () => this._callbacks.onStepForward());

        this._slider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value) / 1000;
            this._callbacks.onSeek(val);
        });
    }

    /**
     * Actualiza el estado visual (play/pause icon)
     * @param {boolean} isPlaying 
     */
    setPlaying(isPlaying) {
        this._isPlaying = isPlaying;
        
        // Actualizar clase para animación de glow
        const controlsRoot = this._container.querySelector('#animControlsRoot');
        if (controlsRoot) {
            if (isPlaying) {
                controlsRoot.classList.add('playing');
            } else {
                controlsRoot.classList.remove('playing');
            }
        }
        
        // Actualizar icono. Lucide reemplaza <i> con <svg>, así que buscamos el svg o recreamos
        // Una forma simple es limpiar y volver a poner el icono correcto
        this._btnPlayPause.innerHTML = `<i data-lucide="${isPlaying ? 'pause' : 'play'}"></i>`;
        if (window.lucide) {
            window.lucide.createIcons({ root: this._btnPlayPause });
        }
    }

    /**
     * Actualiza la barra de progreso
     * @param {number} progress - 0 a 1
     */
    setProgress(progress) {
        this._slider.value = Math.floor(progress * 1000);
    }
}
