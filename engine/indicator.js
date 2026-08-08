import { signal } from './signal.js';
export class Indicator {
    gestureIndicators = signal([]);
    hide(gestureIndicator) {
        const indicator = gestureIndicator;
        if (!indicator) {
            return;
        }
        const fullIndicator = this.findIndicator(indicator);
        if (!fullIndicator) {
            return;
        }
        // Cancel any pending hide operations for this indicator
        this.cancelHideTimer(fullIndicator);
        // Schedule hide state change
        fullIndicator.hideTimerId = setTimeout(() => {
            fullIndicator.state.set('hidden');
            fullIndicator.hideTimerId = undefined;
            // Schedule removal
            fullIndicator.removeTimerId = setTimeout(() => {
                this.removeIndicator(fullIndicator);
                fullIndicator.removeTimerId = undefined;
            }, 250);
        }, 500);
    }
    findIndicator(gestureIndicator) {
        const list = this.gestureIndicators();
        const byPosition = (indicator) => indicator.x === gestureIndicator.x && indicator.y === gestureIndicator.y;
        return list.find(indicator => indicator === gestureIndicator) ?? list.find(element => byPosition(element));
    }
    cancelHideTimer(indicator) {
        if (indicator.hideTimerId !== undefined) {
            clearTimeout(indicator.hideTimerId);
            indicator.hideTimerId = undefined;
        }
        if (indicator.removeTimerId !== undefined) {
            clearTimeout(indicator.removeTimerId);
            indicator.removeTimerId = undefined;
        }
    }
    removeIndicator(gestureIndicator) {
        const target = this.findIndicator(gestureIndicator);
        if (target) {
            // Cancel any pending timers before removing
            this.cancelHideTimer(target);
            this.gestureIndicators.update(list => list.filter(indicator => indicator !== target));
        }
    }
    setSize(nr, size) {
        const indicator = this.gestureIndicators()[nr];
        if (!indicator) {
            return;
        }
        indicator.size = size;
        indicator.top = indicator.y - (size / 2);
        indicator.left = indicator.x - (size / 2);
        this.gestureIndicators.update(list => [...list]);
    }
    display(x, y, size) {
        if (x > 0 && y > 0) {
            const gestureIndicator = {
                x,
                y,
                size,
                top: y - (size / 2),
                left: x - (size / 2),
                state: signal('hidden')
            };
            this.gestureIndicators.update(list => [...list, gestureIndicator]);
            setTimeout(() => {
                gestureIndicator.state.set('visible');
            }, 100);
            return gestureIndicator;
        }
        return undefined;
    }
}
