// Versão sem dependências externas: usa a Web Audio API nativa do
// navegador em vez do pacote 'zzfx' (que exigiria um bundler pra
// resolver o import num projeto HTML/CSS/JS puro). Efeitos simples,
// mas sem precisar instalar nada.
export const SOUNDS = {
    NOPE: { freq: 140, duration: 0.08 },
    SELECT: { freq: 400, duration: 0.05 },
    MATCH: { freq: 800, duration: 0.08 },
    OVER: { freq: 146, duration: 0.3 },
    UNDO: { freq: 260, duration: 0.1 },
    HINT: { freq: 500, duration: 0.1 },
    SHUFFLE: { freq: 300, duration: 0.15 },
    WIN: { freq: 900, duration: 0.4 }
};
export class Sound {
    enabled = true;
    context;
    play(sound) {
        if (!this.enabled || !sound) {
            return;
        }
        try {
            this.context ??= new AudioContext();
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.frequency.value = sound.freq;
            oscillator.type = 'sine';
            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + sound.duration);
            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.start();
            oscillator.stop(this.context.currentTime + sound.duration);
        }
        catch {
            // nope, plataforma sem suporte a Web Audio
        }
    }
}
