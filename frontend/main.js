import { Game } from '../engine/game.js';
import { MODE_SOLVABLE } from '../engine/builder.js';
import { GAME_MODE_ID_DEFAULT } from '../engine/consts.js';
import { generateRandomMapping } from '../engine/random-layout/random-layout.js';
// --- 1. Um StorageProvider simples (em memória, não salva nada) ---
// O motor espera um objeto capaz de guardar/carregar estado. Pra começar,
// usamos um "fake" só em memória. Depois dá pra trocar por localStorage
// ou por chamadas à sua API (quando integrar o backend de ranking).
class MemoryStorage {
    state;
    scores = {};
    settings;
    getState() {
        return this.state;
    }
    storeState(store) {
        this.state = store;
    }
    getScore(id) {
        return this.scores[id];
    }
    storeScore(id, store) {
        if (store) {
            this.scores[id] = store;
        }
    }
    getSettings() {
        return this.settings;
    }
    storeSettings(store) {
        this.settings = store;
    }
}
// --- 2. Criar o jogo ---
const game = new Game(new MemoryStorage());
// --- 3. Gerar um tabuleiro aleatório e iniciar a partida ---
const mapping = generateRandomMapping('random', 'random', 'random');
const layout = {
    id: 'demo-board',
    name: 'Tabuleiro de demonstração',
    category: 'demo',
    mapping
};
game.start(layout, MODE_SOLVABLE, GAME_MODE_ID_DEFAULT);
// --- 4. Renderização simples (divs posicionadas, sem imagens) ---
const boardEl = document.querySelector('#board');
const timeEl = document.querySelector('#time');
const statusEl = document.querySelector('#status');
const comboEl = document.querySelector('#combo');
const TILE_W = 34;
const TILE_H = 44;
const LAYER_OFFSET = 6; // desloca cada camada (z) um pouco, efeito 3D simples
function render() {
    boardEl.innerHTML = '';
    for (const stone of game.board.stones()) {
        if (stone.picked()) {
            continue;
        }
        const el = document.createElement('div');
        el.className = 'stone';
        if (stone.state().blocked) {
            el.classList.add('blocked');
        }
        if (stone.selected()) {
            el.classList.add('selected');
        }
        el.style.left = `${stone.x * (TILE_W / 2) - stone.z * LAYER_OFFSET}px`;
        el.style.top = `${stone.y * (TILE_H / 2) - stone.z * LAYER_OFFSET}px`;
        el.style.zIndex = `${stone.z * 100 + stone.y}`;
        el.textContent = tileLabel(stone.img.id);
        el.addEventListener('click', () => {
            game.click(stone);
            render();
        });
        boardEl.appendChild(el);
    }
    updateHUD();
}
// Relógio/status são atualizados à parte do tabuleiro: não precisam
// recriar as divs das peças, então rodam num intervalo próprio sem
// arriscar "roubar" um clique que esteja em andamento.
function updateHUD() {
    timeEl.textContent = formatTime(game.clock.elapsed());
    statusEl.textContent = game.isRunning() ? 'jogando' : game.isPaused() ? 'pausado' : 'parado';
}
// Traduz o id interno da peça (ex: "t_do3") num rótulo curto e legível,
// já que ainda não temos as imagens dos tiles no projeto novo.
function tileLabel(id) {
    if (!id) {
        return '?';
    }
    return id.replace('t_', '').slice(0, 4);
}
function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}
// --- 5. Combo: 3 pares em 10s ---
// Guardamos o timestamp de cada par encontrado. A cada novo par, olhamos
// quantos caíram na janela dos últimos 10s.
const matchTimestamps = [];
const COMBO_WINDOW_MS = 10_000;
const COMBO_TARGET = 3;
// Detectamos um "match" comparando a contagem de peças antes/depois do clique
// (o motor não expõe um evento pronto de match, então observamos a mudança).
let previousStoneCount = game.board.count();
function checkForMatch() {
    const currentCount = game.board.count();
    if (currentCount === previousStoneCount - 2) {
        const now = Date.now();
        matchTimestamps.push(now);
        while (matchTimestamps.length > 0 && now - matchTimestamps[0] > COMBO_WINDOW_MS) {
            matchTimestamps.shift();
        }
        if (matchTimestamps.length >= COMBO_TARGET) {
            triggerComboBonus();
            matchTimestamps.length = 0; // reseta após o bônus
        }
    }
    previousStoneCount = currentCount;
}
function triggerComboBonus() {
    comboEl.textContent = '🔥 combo! +bônus';
    comboEl.classList.add('flash');
    setTimeout(() => comboEl.classList.remove('flash'), 800);
    // É aqui que você chamaria sua API/estado de corrida pra registrar o
    // bônus (ex: reduzir tempo, somar pontos) — por enquanto só um alerta visual.
}
const originalClick = game.click.bind(game);
game.click = (stone) => {
    const result = originalClick(stone);
    checkForMatch();
    return result;
};
// --- 6. Loop simples pra atualizar só o relógio na tela ---
// (não chama render() aqui — isso recriaria as peças o tempo todo e
// podia "engolir" o clique do jogador se ele caísse no meio do redraw)
setInterval(updateHUD, 250);
render();
