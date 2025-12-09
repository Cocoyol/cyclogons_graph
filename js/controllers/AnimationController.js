/**
 * ============================================
 * ANIMATIONCONTROLLER.JS - Controlador de Animación
 * Generador de Ciclógonos 2D
 * ============================================
 * 
 * Clase que gestiona el estado y la lógica de la animación
 * del ciclógono (play, pause, stop, step, loop).
 */

export class AnimationController {
    /**
     * @param {Object} options - Configuración
     * @param {Function} options.onUpdate - Callback por frame (progress) => void
     * @param {Function} options.onComplete - Callback al finalizar
     */
    constructor(options = {}) {
        this._onUpdate = options.onUpdate || (() => {});
        this._onComplete = options.onComplete || (() => {});

        this._isPlaying = false;
        this._progress = 0; // 0.0 a 1.0
        this._speed = 0.2; // Progreso por segundo (1 ciclo cada 5s aprox por defecto)
        this._lastTime = 0;
        this._animationFrameId = null;
        
        // Bindings
        this._loop = this._loop.bind(this);
    }

    get isPlaying() { return this._isPlaying; }
    get progress() { return this._progress; }

    /**
     * Inicia o reanuda la animación
     */
    play() {
        if (this._isPlaying) return;
        
        this._isPlaying = true;
        this._lastTime = performance.now();
        
        if (this._progress >= 1) {
            this._progress = 0;
        }
        
        this._loop();
    }

    /**
     * Pausa la animación
     */
    pause() {
        this._isPlaying = false;
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    /**
     * Detiene y reinicia la animación
     */
    stop() {
        this.pause();
        this.setProgress(0);
    }

    /**
     * Resetea el controlador sin disparar callbacks
     * Útil cuando se actualiza el ciclógono y no queremos afectar la vista
     */
    reset() {
        this._isPlaying = false;
        this._progress = 0;
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }

    /**
     * Avanza un paso (frame)
     * @param {number} stepSize - Tamaño del paso (positivo o negativo)
     */
    step(stepSize = 0.01) {
        this.pause();
        let newProgress = this._progress + stepSize;
        this.setProgress(newProgress);
    }

    /**
     * Establece el progreso manualmente
     * @param {number} value - Valor entre 0 y 1
     */
    setProgress(value) {
        this._progress = Math.max(0, Math.min(1, value));
        this._onUpdate(this._progress);
        
        if (this._progress >= 1 && this._isPlaying) {
            this.pause();
            this._onComplete();
        }
    }

    /**
     * Establece la velocidad de animación
     * @param {number} speed - Velocidad (progreso por segundo)
     */
    setSpeed(speed) {
        this._speed = speed;
    }

    /**
     * Bucle de animación
     * @private
     */
    _loop() {
        if (!this._isPlaying) return;

        const currentTime = performance.now();
        const deltaTime = (currentTime - this._lastTime) / 1000; // Segundos
        this._lastTime = currentTime;

        this._progress += this._speed * deltaTime;

        if (this._progress >= 1) {
            this._progress = 1;
            this._onUpdate(this._progress);
            this.pause();
            this._onComplete();
            return;
        }

        this._onUpdate(this._progress);
        this._animationFrameId = requestAnimationFrame(this._loop);
    }
}
