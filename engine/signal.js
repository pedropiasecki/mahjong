export function signal(initialValue, options) {
    let value = initialValue;
    const listeners = new Set();
    const equal = options?.equal ?? ((a, b) => a === b);
    const read = (() => value);
    read.set = (next) => {
        if (equal(value, next)) {
            return;
        }
        value = next;
        for (const listener of listeners) {
            listener(value);
        }
    };
    read.update = (updater) => {
        read.set(updater(value));
    };
    read.subscribe = (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    return read;
}
