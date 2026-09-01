class MatrixRain {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.animationFrameId = null;
        this.resizeObserver = new ResizeObserver(() => this.setup());

        this.setup();
        if (this.canvas.parentElement) {
            this.resizeObserver.observe(this.canvas.parentElement);
        } else {
            this.resizeObserver.observe(document.body);
        }
        this.draw = this.draw.bind(this);
        this.start();
    }

    setup() {
        if (!this.canvas) return;
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width = parent.offsetWidth;
            this.canvas.height = parent.offsetHeight;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        this.katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        this.latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this.nums = '0123456789';
        this.characters = this.katakana + this.latin + this.nums;

        this.fontSize = 12;
        this.columns = Math.floor(this.canvas.width / this.fontSize);
        if (this.columns <= 0) this.columns = 1;
        this.drops = [];
        for (let x = 0; x < this.columns; x++) {
            this.drops[x] = 1 + Math.random() * this.canvas.height / this.fontSize;
        }
    }

    draw() {
        if (!this.ctx) return;
        this.ctx.fillStyle = 'rgba(10, 15, 24, 0.04)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim() || '#00FF9C';
        this.ctx.font = this.fontSize + 'px monospace';

        for (let i = 0; i < this.drops.length; i++) {
            const text = this.characters.charAt(Math.floor(Math.random() * this.characters.length));
            this.ctx.fillText(text, i * this.fontSize, this.drops[i] * this.fontSize);

            if (this.drops[i] * this.fontSize > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
        this.animationFrameId = requestAnimationFrame(this.draw);
    }

    start() {
        if (!this.animationFrameId && this.canvas && this.ctx) {
            this.draw();
        }
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        if (this.resizeObserver && this.canvas && this.canvas.parentElement) {
            this.resizeObserver.unobserve(this.canvas.parentElement);
        } else if (this.resizeObserver && this.canvas) {
            this.resizeObserver.unobserve(document.body);
        }
    }
}