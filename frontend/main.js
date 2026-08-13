import { Game } from '../engine/game.js';
import { MODE_SOLVABLE } from '../engine/builder.js';
import { GAME_MODE_ID_DEFAULT } from '../engine/consts.js';
import { generateRandomMapping } from '../engine/random-layout/random-layout.js';
// Importa do seu tilesets.js
import { KyodaiTileSets, buildKyodaiSVG } from '../engine/tilesets.js';

// --- Storage Provider ---
class MemoryStorage {
    state;
    scores = {};
    settings;
    getState() { return this.state; }
    storeState(store) { this.state = store; }
    getScore(id) { return this.scores[id]; }
    storeScore(id, store) { if (store) this.scores[id] = store; }
    getSettings() { return this.settings; }
    storeSettings(store) { this.settings = store; }
}

// --- Inicialização do Jogo ---
const game = new Game(new MemoryStorage());
const mapping = generateRandomMapping('random', 'random', 'random');
const layout = {
    id: 'demo-board',
    name: 'Tabuleiro de demonstração',
    category: 'demo',
    mapping
};
game.start(layout, MODE_SOLVABLE, GAME_MODE_ID_DEFAULT);

// Elementos do DOM
const boardEl = document.querySelector('#board');
const timeEl = document.querySelector('#time');
const statusEl = document.querySelector('#status');
const comboEl = document.querySelector('#combo');

// --- Ajuste os tamanhos aqui ---
const TILE_W = 51;          // Exemplo: aumentado de 34 para 51 (1.5x)
const TILE_H = 66;          // Exemplo: aumentado de 44 para 66 (1.5x)
const LAYER_OFFSET = 9;     // Exemplo: aumentado de 6 para 9 (1.5x)

// --- Renderização com SVG dos Tiles ---
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

        // 1. Aplica o tamanho dinâmico direto na pedra
        el.style.width = `${TILE_W}px`;
        el.style.height = `${TILE_H}px`;

        // 2. Posicionamento 3D ajustado com base nos novos tamanhos
        el.style.left = `${stone.x * (TILE_W / 2) - stone.z * LAYER_OFFSET}px`;
        el.style.top = `${stone.y * (TILE_H / 2) - stone.z * LAYER_OFFSET}px`;
        el.style.zIndex = `${stone.z * 100 + stone.y}`;

        // Insere o elemento SVG referenciando a peça no catálogo de definições
        const tileId = stone.img.id;
        el.innerHTML = `<svg class="stone-icon" viewBox="0 0 75 100"><use href="#${tileId}"></use></svg>`;

        el.addEventListener('click', () => {
            game.click(stone);
            render();
        });
        boardEl.appendChild(el);
    }
    updateHUD();
}

function updateHUD() {
    timeEl.textContent = formatTime(game.clock.elapsed());
    statusEl.textContent = game.isRunning() ? 'jogando' : game.isPaused() ? 'pausado' : 'parado';
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

// --- Lógica do Combo ---
const matchTimestamps = [];
const COMBO_WINDOW_MS = 10_000;
const COMBO_TARGET = 3;

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
            matchTimestamps.length = 0;
        }
    }
    previousStoneCount = currentCount;
}

function triggerComboBonus() {
    comboEl.textContent = '🔥 combo! +bônus';
    comboEl.classList.add('flash');
    setTimeout(() => comboEl.classList.remove('flash'), 800);
}

const originalClick = game.click.bind(game);
game.click = (stone) => {
    const result = originalClick(stone);
    checkForMatch();
    return result;
};

// --- Inicialização Segura com Fallback ---
async function initTilesetAndStart() {
    try {
        // Seleciona o tileset desejado
        const selectedTileset = KyodaiTileSets[0]; 

        console.log('Carregando tileset:', selectedTileset.source);
        
        // Tenta construir o SVG
        const svgContent = await buildKyodaiSVG(selectedTileset.source);
        
        // Se deu certo, injeta os <defs> na página
        let svgDefsContainer = document.querySelector('#tileset-defs');
        if (!svgDefsContainer) {
            svgDefsContainer = document.createElement('div');
            svgDefsContainer.id = 'tileset-defs';
            svgDefsContainer.style.display = 'none';
            document.body.appendChild(svgDefsContainer);
        }
        svgDefsContainer.innerHTML = svgContent;
        console.log('Tileset carregado com sucesso!');

    } catch (error) {
        console.error('Erro ao carregar imagem do tileset:', error);
        // Opcional: Aqui você pode definir uma flag de erro se quiser ajustar o render
    } finally {
        // O finally GARANTE que render() será chamado mesmo que a imagem falhe!
        setInterval(updateHUD, 250);
        render();
    }
}

initTilesetAndStart();