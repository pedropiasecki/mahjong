import { signal } from './signal.js';
import { ImageSetDefault, LangDefault, ThemeDefault, Themes } from './consts.js';
export class Settings {
    storageProvider;
    lang = signal(LangDefault);
    sounds = signal(true);
    tileset = signal(ImageSetDefault);
    music = signal(false);
    contrast = signal(false);
    dark = signal(false);
    tile3d = signal(false);
    shadows = signal(true);
    confetti = signal(true);
    showClock = signal(true);
    background = signal('');
    pattern = signal(undefined);
    kyodaiUrl = signal(undefined);
    theme = signal(ThemeDefault);
    tutorialCompleted = signal(false);
    stats = {
        games: 0,
        bestTime: 0
    };
    constructor(storageProvider) {
        this.storageProvider = storageProvider;
    }
    load() {
        try {
            const store = this.storageProvider.getSettings();
            if (store) {
                this.lang.set(store.lang ?? LangDefault);
                this.tileset.set(store.tileset ?? ImageSetDefault);
                this.background.set(store.background ?? this.background());
                this.pattern.set(store.pattern);
                this.theme.set(this.validTheme(store.theme) ? store.theme : ThemeDefault);
                this.contrast.set(store.contrast ?? false);
                this.dark.set(store.dark ?? false);
                this.tile3d.set(store.tile3d ?? false);
                this.shadows.set(store.shadows ?? true);
                this.confetti.set(store.confetti ?? true);
                this.showClock.set(store.showClock ?? true);
                this.sounds.set(store.sounds ?? this.sounds());
                this.music.set(store.music ?? this.music());
                this.kyodaiUrl.set(store.kyodaiUrl);
                this.tutorialCompleted.set(store.tutorialCompleted ?? true);
            }
            return true;
        }
        catch (error) {
            console.error('load settings failed', error);
        }
        return false;
    }
    validTheme(theme) {
        return !!(theme && Themes.some(t => t.id === theme));
    }
    save() {
        try {
            this.storageProvider.storeSettings({
                lang: this.lang(),
                sounds: this.sounds(),
                music: this.music(),
                contrast: this.contrast(),
                dark: this.dark(),
                tile3d: this.tile3d(),
                shadows: this.shadows(),
                confetti: this.confetti(),
                showClock: this.showClock(),
                background: this.background(),
                pattern: this.pattern(),
                theme: this.theme(),
                tileset: this.tileset(),
                kyodaiUrl: this.kyodaiUrl(),
                tutorialCompleted: this.tutorialCompleted()
            });
            return true;
        }
        catch (error) {
            console.error('storing settings failed', error);
        }
        return false;
    }
}
