import { signal } from './signal.js';
import { Board } from './board.js';
import { Clock } from './clock.js';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, GAME_MODE_ID_DEFAULT, RESCUE_SHUFFLE_ATTEMPTS, STATES } from './consts.js';
import { SOUNDS, Sound } from './sound.js';
import { MODE_SOLVABLE } from './builder.js';
import { Music } from './music.js';
import { RANDOM_LAYOUT_ID_PREFIX } from './random-layout/consts.js';
export class Game {
    storage;
    clock = new Clock();
    board = new Board();
    sound = new Sound();
    music = new Music();
    state = signal(STATES.idle);
    message = signal(undefined);
    onWin;
    layoutID = undefined;
    mode = signal(GAME_MODE_ID_DEFAULT);
    saveTimer;
    matchesTimer;
    constructor(storage) {
        this.storage = storage;
    }
    destroy() {
        this.clearSaveTimer();
        this.clearMatchesTimer();
        this.clock.reset();
        this.music.pause();
        this.board.reset();
    }
    init() {
        this.load();
        this.board.update();
        if (this.state() === STATES.run) {
            this.pause();
        }
        this.message.set({ messageID: this.isPaused() ? 'MSG_CONTINUE_SAVE' : 'MSG_START' });
    }
    click(stone) {
        if (!stone) {
            this.clearMatchesTimer();
            this.board.clearSelection();
            this.board.clearHints();
            return false;
        }
        if (!this.isRunning() || stone.state().blocked) {
            this.sound.play(SOUNDS.NOPE);
            this.wiggleStone(stone);
            this.board.clearHints();
            return true;
        }
        if (this.clock.elapsed() === 0) {
            this.clock.run();
        }
        if (stone && this.board.selected && stone !== this.board.selected && stone.groupNr === this.board.selected.groupNr) {
            this.clearMatchesTimer();
            this.resolveMatchingStone(stone);
            this.board.clearHints();
            return true;
        }
        if (!stone.hinted()) {
            this.board.clearHints();
        }
        this.board.setStoneSelected(this.board.selected === stone ? undefined : stone);
        this.sound.play(SOUNDS.SELECT);
        if (this.board.selected && this.mode() === GAME_MODE_EASY) {
            this.startMatchesHighlight(this.board.selected);
        }
        else {
            this.clearMatchesTimer();
        }
        return true;
    }
    wiggleStone(stone) {
        if (!stone) {
            return;
        }
        if (stone.wiggleTimer !== undefined) {
            clearTimeout(stone.wiggleTimer);
        }
        stone.wiggle.set(true);
        stone.wiggleTimer = setTimeout(() => {
            stone.wiggle.set(false);
            stone.wiggleTimer = undefined;
        }, 300);
    }
    isRunning() {
        return this.state() === STATES.run;
    }
    isPaused() {
        return this.state() === STATES.pause;
    }
    isIdle() {
        return this.state() === STATES.idle;
    }
    resume() {
        this.run();
        this.clock.run();
        this.music.play();
    }
    run() {
        this.board.clearHints();
        this.board.update();
        this.setState(STATES.run);
    }
    toggle() {
        if (this.state() === STATES.run) {
            this.pause();
        }
        else if (this.state() === STATES.pause) {
            this.resume();
        }
    }
    pause() {
        if (!this.isRunning()) {
            return;
        }
        this.clock.pause();
        this.setState(STATES.pause, 'MSG_CONTINUE_PAUSE');
        this.clearSaveTimer();
        this.save();
        this.music.pause();
    }
    reset() {
        this.clearSaveTimer();
        this.clearMatchesTimer();
        this.clock.reset();
        this.setState(STATES.idle);
        this.board.reset();
        this.layoutID = undefined;
    }
    start(layout, buildMode, gameMode) {
        this.layoutID = layout.id;
        this.mode.set(gameMode);
        this.board.applyMapping(layout.mapping, buildMode);
        this.board.update();
        this.run();
    }
    hint() {
        if (this.mode() === GAME_MODE_EXPERT) {
            return;
        }
        this.board.hint();
        this.sound.play(SOUNDS.HINT);
    }
    shuffle() {
        if (this.mode() !== GAME_MODE_EASY) {
            return;
        }
        this.board.shuffle();
        this.sound.play(SOUNDS.SHUFFLE);
    }
    back() {
        if (this.mode() === GAME_MODE_EXPERT) {
            return;
        }
        if (!this.isRunning()) {
            return;
        }
        this.clearMatchesTimer();
        this.board.back();
        this.sound.play(SOUNDS.UNDO);
    }
    load() {
        try {
            const store = this.storage.getState();
            if (store?.stones?.length) {
                if (!this.board.load(store.stones, store.undo ?? [])) {
                    this.discardStoredState();
                    return false;
                }
                this.clock.elapsed.set(store.elapsed ?? 0);
                this.layoutID = store.layout;
                this.mode.set(store.gameMode ?? GAME_MODE_ID_DEFAULT);
                this.board.buildMode = store.buildMode ?? MODE_SOLVABLE;
                this.state.set(store.state ?? STATES.idle);
                return true;
            }
        }
        catch (error) {
            console.error('load state failed', error);
        }
        return false;
    }
    // a save that cannot be restored
    discardStoredState() {
        this.layoutID = undefined;
        this.state.set(STATES.idle);
        try {
            this.storage.storeState();
        }
        catch (error) {
            console.error('clearing state failed', error);
        }
    }
    save() {
        if (!this.layoutID) {
            return;
        }
        try {
            this.storage.storeState({
                elapsed: this.clock.elapsed(),
                state: this.state(),
                layout: this.layoutID,
                gameMode: this.mode(),
                buildMode: this.board.buildMode,
                undo: this.board.undo(),
                stones: this.board.save()
            });
        }
        catch (error) {
            console.error('storing state failed', error);
        }
    }
    gameOverEasyModeShuffle() {
        // the retries are one rescue attempt for the player, so they get one sound
        this.sound.play(SOUNDS.SHUFFLE);
        for (let index = 0; index < RESCUE_SHUFFLE_ATTEMPTS; index++) {
            this.board.shuffle();
            if (this.board.free().length > 0) {
                this.resume();
                return;
            }
        }
        // no rescue possible after all attempts, do not re-offer the shuffle prompt
        this.gameOverLosing();
    }
    surrender() {
        this.storeLostGame();
        this.sound.play(SOUNDS.OVER);
        this.gameOver();
    }
    checkGameState() {
        if (this.board.count() < 2) {
            this.gameOverWinning();
        }
        else if (this.board.free().length === 0) {
            if (this.mode() === GAME_MODE_EASY && this.board.countUnblocked() > 1) {
                this.gameOverEasyMode();
                return false;
            }
            this.gameOverLosing();
        }
        else {
            this.sound.play(SOUNDS.MATCH);
            this.delayedSave();
            return true;
        }
        return false;
    }
    clearSaveTimer() {
        if (this.saveTimer === undefined) {
            return;
        }
        clearTimeout(this.saveTimer);
        this.saveTimer = undefined;
    }
    startMatchesHighlight(stone) {
        this.clearMatchesTimer();
        this.board.highlightMatches(stone);
        this.matchesTimer = setTimeout(() => {
            this.board.clearMatches();
            this.matchesTimer = undefined;
        }, 700);
    }
    clearMatchesTimer() {
        if (this.matchesTimer !== undefined) {
            clearTimeout(this.matchesTimer);
            this.matchesTimer = undefined;
        }
        this.board.clearMatches();
    }
    isStorableLayoutId() {
        return this.layoutID !== undefined && !this.layoutID.startsWith(RANDOM_LAYOUT_ID_PREFIX);
    }
    storeLostGame() {
        if (!this.isStorableLayoutId()) {
            return;
        }
        const id = this.layoutID ?? 'unknown';
        const score = this.storage.getScore(id) ?? {};
        score.loseCount = (score.loseCount ?? 0) + 1;
        this.storage.storeScore(id, score);
    }
    gameOverLosing() {
        this.storeLostGame();
        this.sound.play(SOUNDS.OVER);
        this.gameOver('MSG_FAIL');
    }
    gameOverWinning() {
        const playTime = this.clock.elapsed();
        if (!this.isStorableLayoutId()) {
            this.gameOver('MSG_GOOD', playTime);
            this.sound.play(SOUNDS.WIN);
            this.onWin?.();
            return;
        }
        const id = this.layoutID ?? 'unknown';
        const score = this.storage.getScore(id) ?? {};
        score.winCount = (score.winCount ?? 0) + 1;
        score.playTime = (score.playTime ?? 0) + playTime;
        if (!score.bestTime || score.bestTime > playTime) {
            score.bestTime = playTime;
            this.gameOver('MSG_BEST', playTime);
        }
        else {
            this.gameOver('MSG_GOOD', playTime);
        }
        this.storage.storeScore(id, score);
        this.sound.play(SOUNDS.WIN);
        this.onWin?.();
    }
    delayedSave() {
        this.clearSaveTimer();
        this.saveTimer = setTimeout(() => {
            this.saveTimer = undefined;
            this.save();
        }, 300);
    }
    gameOverEasyMode() {
        this.clock.pause();
        this.message.set({ messageID: 'MSG_FAIL', askShuffle: true });
        this.state.set(STATES.pause);
        this.delayedSave();
        this.music.pause();
    }
    resolveMatchingStone(stone) {
        const sel = this.board.selected;
        if (!sel) {
            return;
        }
        this.board.pick(sel, stone);
        this.checkGameState();
    }
    gameOver(message, playTime) {
        this.setState(STATES.idle, message, playTime);
        this.clock.reset();
        this.clearSaveTimer();
        this.save();
    }
    setState(state, messageID, playTime) {
        this.message.set(messageID ? { messageID, playTime } : undefined);
        this.state.set(state);
    }
}
