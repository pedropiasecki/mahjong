import { signal } from './signal.js';
export class Clock {
    elapsed = signal(0);
    lastTime = 0;
    timer = undefined;
    reset() {
        this.clearTimer();
        this.lastTime = 0;
        this.elapsed.set(0);
    }
    run() {
        if (this.timer !== undefined) {
            return;
        }
        this.lastTime = Date.now();
        this.timer = setTimeout(() => {
            this.step();
        }, 1000);
    }
    pause() {
        if (this.timer === undefined) {
            return;
        }
        this.clearTimer();
        this.elapsed.update(value => value + (Date.now() - this.lastTime));
    }
    step() {
        const newTime = Date.now();
        this.elapsed.update(value => value + (newTime - this.lastTime));
        this.lastTime = newTime;
        this.clearTimer();
        this.timer = setTimeout(() => {
            this.step();
        }, 1000);
    }
    clearTimer() {
        if (this.timer === undefined) {
            return;
        }
        clearTimeout(this.timer);
        this.timer = undefined;
    }
}
