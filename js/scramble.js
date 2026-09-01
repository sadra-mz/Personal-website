class TextScrambleLoader {
    constructor(el, phrases = ['LOADING...']) {
        this.el = el;
        this.phrases = phrases;
        this.chars = '!<>-_\\/[]{}—=+*^?#';
        this.update = this.update.bind(this);
        this.frameRequest = null;
        this.currentPhraseIndex = 0;
        this.resolvePromise = null;
        this.isCycling = false;
    }

    setText(newText) {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
            const oldText = this.el.textContent || "";
            this.queue = [];
            const length = Math.max(oldText.length, newText.length);
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 5) + 1;
                const end = start + Math.floor(Math.random() * 5) + 2;
                this.queue.push({ from, to, start, end, char: null });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
        });
    }

    async cyclePhrases(targetCycles = 1, delayBetween = 10) {
        this.isCycling = true;
        this.currentPhraseIndex = 0;
        for (let cycle = 0; cycle < targetCycles * this.phrases.length; cycle++) {
            if (!this.isCycling) break;
            await this.setText(this.phrases[this.currentPhraseIndex]);
            this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
            if (cycle < (targetCycles * this.phrases.length) - 1) {
                await new Promise(r => setTimeout(r, delayBetween));
            }
        }
        this.isCycling = false;
    }

    stopCycleAndResolve() {
        this.isCycling = false;
        cancelAnimationFrame(this.frameRequest);
        if (this.resolvePromise) {
            if (this.queue && this.queue.length > 0 && this.el) {
                let finalText = '';
                this.queue.forEach(item => finalText += item.to);
                this.el.innerHTML = finalText;
            }
            this.resolvePromise();
            this.resolvePromise = null;
        }
    }

    update() {
        let output = '';
        let complete = 0;
        if (!this.queue) return;

        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.7) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        if (this.el) this.el.innerHTML = output;

        if (complete === this.queue.length) {
            cancelAnimationFrame(this.frameRequest);
            if (this.resolvePromise) {
                this.resolvePromise();
                this.resolvePromise = null;
            }
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }
}