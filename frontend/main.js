import { Game } from '../engine/game.js';
import { MODE_SOLVABLE } from '../engine/builder.js';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, GAME_MODE_ID_DEFAULT, RESCUE_SHUFFLE_ATTEMPTS } from '../engine/consts.js';
import { seedRNG } from '../engine/rng.js';
import { generateRandomMapping } from '../engine/random-layout/random-layout.js';
import { KyodaiTileSets, buildKyodaiSVG } from '../engine/tilesets.js';

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

const storage = new MemoryStorage();
const game = new Game(storage);
const boardEl = document.querySelector('#board');
const boardFrameEl = document.querySelector('#board-frame');
const timeEl = document.querySelector('#time');
const statusEl = document.querySelector('#status');
const stonesCountEl = document.querySelector('#stones-count');
const movesCountEl = document.querySelector('#moves-count');
const possibleMovesCountEl = document.querySelector('#possible-moves-count');
const toastEl = document.querySelector('#toast');
const clockStatEl = document.querySelector('#clock-stat');
const pauseActionEl = document.querySelector('#pause-action');

const BASE_TILE_W = 75;
const BASE_TILE_H = 100;
// Same-layer tiles must sit edge-to-edge with zero overlap: the grid uses
// half-tile units for both axes, so each axis needs its own step (half of
// the tile's own width/height) to fully separate neighbouring tiles.
const BASE_STEP_X = BASE_TILE_W / 2;
const BASE_STEP_Y = BASE_TILE_H / 2;
// How far a tile shifts per stacked layer. Tuned so a tile directly above
// another (same x/y, next z) still hides at least 4/5 of the one beneath it.
const BASE_LAYER_OFFSET = 9;
const MIN_SCALE = 0.45;
const MAX_SCALE = 1.25;
const COMPACT_SCALE = 0.88;
const COMBO_WINDOW_MS = 10_000;
const COMBO_TARGET = 3;

const mapNames = {
	turtle: 'Tartaruga clássica', lines: 'Linhas', checker: 'Tabuleiro', rings: 'Anéis', cross: 'Cruz',
	diamond: 'Diamante', triangle: 'Triângulo', areas: 'Áreas', shapes: 'Formas'
};

const mapModes = {
	turtle: 'turtle', lines: 'lines', checker: 'checker', rings: 'rings', cross: 'cross',
	diamond: 'diamond', triangle: 'triangle', areas: 'areas', shapes: 'shapes'
};

let currentMap = localStorage.getItem('mahjong-map') || 'turtle';
let currentTileset = localStorage.getItem('mahjong-tileset') || KyodaiTileSets[0]?.source;

let currentDifficulty = 'normal';
let matchTimestamps = [];
let previousStoneCount = 144;
// Enquanto a mesma partida durar, uma derrota (travou e o jogador escolheu
// embaralhar, ou travou de vez) só é reportada ao backend UMA vez, mesmo
// que o tabuleiro trave várias vezes seguidas — evita inflar games_played.
let matchLossReported = false;
// Preenchido só quando a página abre com ?race=<id> e a corrida é válida
// pra esse usuário jogar agora. null = partida solo normal.
let raceContext = null;
// Quantas vezes o bônus "3 pares em 10s" disparou nessa partida — só
// importa (e só é reportado) em modo corrida.
let raceBonusCount = 0;
// true só durante o replay de uma corrida retomada (ver replaySavedRaceProgress)
// — evita que os cliques do replay sejam contados como combo de verdade.
let isReplayingRace = false;
let toastTimer;
let resizeFrame;
let lastFocusedKey;

function getGameMode(value = currentDifficulty) {
	if (value === 'facil') return GAME_MODE_EASY;
	if (value === 'dificil') return GAME_MODE_EXPERT;
	return GAME_MODE_ID_DEFAULT;
}

function buildClassicTurtleMapping() {
	// Canonical Turtle proportions: 87 / 36 / 16 / 4 / 1 positions over five levels.
	// Coordinates use the same even grid as the existing layout generator.
	const rows = [1, 10, 12, 14, 14, 14, 12, 10];
	const mapping = [];
	const maxWidth = Math.max(...rows);
	for (let y = 0; y < rows.length; y++) {
		const count = rows[y];
		const start = Math.floor((maxWidth - count) / 2) * 2;
		for (let i = 0; i < count; i++) mapping.push([0, start + i * 2, y * 2]);
	}
	const addCenteredRect = (z, width, height) => {
		const startX = Math.floor((maxWidth - width) / 2) * 2;
		const startY = Math.floor((rows.length - height) / 2) * 2;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) mapping.push([z, startX + x * 2, startY + y * 2]);
	};
	addCenteredRect(1, 6, 6); // 36
	addCenteredRect(2, 4, 4); // 16
	addCenteredRect(3, 2, 2); // 4
	addCenteredRect(4, 1, 1); // 1
	return mapping;
}

function generateMap(mode = currentMap) {
	if (mode === 'turtle') return buildClassicTurtleMapping();
	const mapping = generateRandomMapping('true', 'true', mapModes[mode] ?? mode);
	if (!mapping?.length) throw new Error(`Não foi possível gerar o mapa ${mode}`);
	return mapping;
}

function startNewGame(map = currentMap, difficulty = currentDifficulty) {
	// Trocar de tabuleiro (botão "Novo jogo", trocar mapa ou dificuldade)
	// enquanto uma partida já está rodando/pausada conta como abandono —
	// surrender() dispara o game.gameOver() interceptado abaixo, que reporta
	// isso ao backend antes do reset apagar o progresso.
	if (!game.isIdle()) {
		game.surrender();
	}
	currentMap = map;
	currentDifficulty = difficulty;
	localStorage.setItem('mahjong-map', currentMap);
	game.reset();
	const mapping = generateMap(currentMap);
	game.start(
		{ id: `random-${currentMap}`, name: mapNames[currentMap] ?? currentMap, category: 'generated', mapping },
		MODE_SOLVABLE,
		getGameMode(currentDifficulty)
	);
	previousStoneCount = game.board.count();
	matchTimestamps = [];
	matchLossReported = false;
	raceBonusCount = 0;
	updatePauseLabel();
	render();
}

function formatTime(ms) {
	const totalSeconds = Math.floor(ms / 1000);
	return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function getBoardBounds() {
	const stones = game.board.stones().filter(stone => !stone.picked());
	if (!stones.length) {
		return { minX: 0, minY: 0, maxX: BASE_TILE_W, maxY: BASE_TILE_H };
	}

	return stones.reduce((bounds, stone) => {
		const x = stone.x * BASE_STEP_X - stone.z * BASE_LAYER_OFFSET;
		const y = stone.y * BASE_STEP_Y - stone.z * BASE_LAYER_OFFSET;
		return {
			minX: Math.min(bounds.minX, x),
			minY: Math.min(bounds.minY, y),
			maxX: Math.max(bounds.maxX, x + BASE_TILE_W),
			maxY: Math.max(bounds.maxY, y + BASE_TILE_H),
		};
	}, {
		minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity
	});
}

function getBoardScale() {
	const bounds = getBoardBounds();
	const availableWidth = Math.max(1, boardFrameEl.clientWidth - 28);
	const availableHeight = Math.max(1, boardFrameEl.clientHeight - 28);
	const fitScale = Math.min(availableWidth / (bounds.maxX - bounds.minX), availableHeight / (bounds.maxY - bounds.minY));
	const compactFactor = document.body.classList.contains('compact') ? COMPACT_SCALE : 1;
	return Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitScale * compactFactor));
}

function render() {
	boardEl.innerHTML = '';
	const scale = getBoardScale();
	const tileW = BASE_TILE_W * scale;
	const tileH = BASE_TILE_H * scale;
	const stepX = BASE_STEP_X * scale;
	const stepY = BASE_STEP_Y * scale;
	const layerOffset = BASE_LAYER_OFFSET * scale;
	const bounds = getBoardBounds();
	const naturalWidth = (bounds.maxX - bounds.minX) * scale;
	const naturalHeight = (bounds.maxY - bounds.minY) * scale;

	boardEl.style.width = `${naturalWidth}px`;
	boardEl.style.height = `${naturalHeight}px`;

	for (const stone of game.board.stones()) {
		if (stone.picked()) continue;

		const el = document.createElement('button');
		el.type = 'button';
		el.className = 'stone';
		el.setAttribute('role', 'gridcell');
		el.setAttribute('aria-label', `Pedra ${stone.img?.id ?? ''}`);
		if (stone.state().blocked) el.classList.add('blocked');
		if (stone.selected()) el.classList.add('selected');
		if (stone.hinted?.()) el.classList.add('hinted');
		if (stone.matched?.()) el.classList.add('matched');

		el.style.width = `${tileW}px`;
		el.style.height = `${tileH}px`;
		const rawX = stone.x * stepX - stone.z * layerOffset;
		const rawY = stone.y * stepY - stone.z * layerOffset;
		el.style.left = `${rawX - bounds.minX * scale}px`;
		el.style.top = `${rawY - bounds.minY * scale}px`;
		el.style.zIndex = `${stone.z * 100 + stone.y}`;
		el.style.setProperty('--layer', String(stone.z));
		el.dataset.gx = String(stone.x);
		el.dataset.gy = String(stone.y);
		el.dataset.gz = String(stone.z);
		el.innerHTML = `<svg class="stone-icon" viewBox="0 0 75 100" aria-hidden="true"><use href="#${stone.img.id}"></use></svg>`;
		el.addEventListener('click', () => {
			game.click(stone);
			render();
		});
		// Blink feedback when the piece is focused via keyboard, mirroring what
		// already happens on mouse hover, so navigating with keys feels like
		// actually handling that tile.
		el.addEventListener('focus', () => {
			el.classList.add('kbd-focus');
			lastFocusedKey = `${stone.x},${stone.y},${stone.z}`;
		});
		el.addEventListener('blur', () => el.classList.remove('kbd-focus'));
		if (`${stone.x},${stone.y},${stone.z}` === lastFocusedKey) {
			requestAnimationFrame(() => el.focus({ preventScroll: true }));
		}
		boardEl.appendChild(el);
	}
	updateHUD();
}

function countPossibleMoves() {
	// Groups of currently free (removable) stones sharing the same tile type;
	// each group of size k contributes floor(k/2) matchable pairs right now.
	return game.board.collectHints().reduce((sum, group) => sum + Math.floor(group.stones.length / 2), 0);
}

function updateHUD() {
	const stones = game.board.count();
	stonesCountEl.textContent = String(stones);
	movesCountEl.textContent = String(Math.floor(game.board.undo().length / 2));
	if (possibleMovesCountEl) possibleMovesCountEl.textContent = String(countPossibleMoves());
	timeEl.textContent = formatTime(game.clock.elapsed());

	const status = game.isRunning() ? 'Jogando' : game.isPaused() ? 'Pausado' : 'Pronto';
	statusEl.textContent = status;
	statusEl.className = `status-pill ${status.toLowerCase()}`;
	updatePauseLabel();
}

function updatePauseLabel() {
	if (!pauseActionEl) return;
	pauseActionEl.textContent = game.isPaused() ? 'Continuar' : 'Pausar';
	pauseActionEl.disabled = game.isIdle();
}

function showToast(message) {
	toastEl.textContent = message;
	toastEl.classList.add('visible');
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 2200);
}

function checkForMatch() {
	const currentStoneCount = game.board.count();
	if (currentStoneCount === previousStoneCount - 2 && !isReplayingRace) {
		const now = Date.now();
		matchTimestamps.push(now);
		matchTimestamps = matchTimestamps.filter(t => now - t <= COMBO_WINDOW_MS);
		if (matchTimestamps.length >= COMBO_TARGET) {
			const combo = document.createElement('span');
			combo.className = 'combo';
			combo.textContent = 'Combo x3';
			document.querySelector('.stats')?.appendChild(combo);
			setTimeout(() => combo.remove(), 850);
			matchTimestamps = [];
			raceBonusCount += 1;
		}
	}
	previousStoneCount = currentStoneCount;
}

const originalClick = game.click.bind(game);
game.click = stone => {
	const result = originalClick(stone);
	checkForMatch();
	game.save();
	if (raceContext && !isReplayingRace) saveRaceProgress();
	return result;
};

const API_BASE_URL = window.MAHJONG_API_URL || 'http://localhost:3333';

// Helper genérico pra chamadas autenticadas (usado pelas rotas de corrida).
// reportGameSession abaixo tem sua própria versão simplificada porque não
// precisa tratar erro de resposta com detalhe — aqui sim, porque erros de
// corrida (ex.: "já terminou") precisam aparecer pro jogador.
async function raceApiRequest(path, options = {}) {
	const token = localStorage.getItem('mahjong:token');
	let response;
	try {
		response = await fetch(`${API_BASE_URL}${path}`, {
			...options,
			headers: {
				Authorization: `Bearer ${token}`,
				...(options.headers || {}),
			},
		});
	} catch (networkError) {
		throw new Error(`Não foi possível conectar ao servidor em ${API_BASE_URL}.`);
	}

	let data = null;
	try {
		data = await response.json();
	} catch {
		// sem corpo
	}

	if (!response.ok) {
		throw new Error((data && data.message) || `Erro inesperado (${response.status}).`);
	}

	return data;
}

// Envia o resultado da partida pro backend (POST /games), que já atualiza
// games_played/wins/losses/best_time_seconds do profile na mesma transação.
// Nunca deixa uma falha de rede/backend quebrar o jogo — só loga um aviso.
// NÃO é usada em modo corrida — lá o resultado vai pra /races/:id/finish ou
// /races/:id/abandon (ver handleRaceGameOver), que já registram o
// GameSession correspondente no servidor. Chamar as duas contaria a mesma
// partida duas vezes nas estatísticas.
async function reportGameSession(result, elapsedMs, movesCount) {
	const token = localStorage.getItem('mahjong:token');
	if (!token) return; // index.html já exige login antes de chegar aqui, mas por segurança

	try {
		const response = await fetch(`${API_BASE_URL}/games`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				mode: 'singleplayer',
				map_layout: currentMap,
				tileset: currentTileset,
				duration_seconds: Math.max(0, Math.round(elapsedMs / 1000)),
				moves_count: movesCount,
				result,
			}),
		});

		if (!response.ok) {
			console.warn('Não foi possível registrar a partida no backend.', response.status);
		}
	} catch (error) {
		// Backend fora do ar — o jogo continua normalmente, só essa
		// partida específica não entra nas estatísticas do perfil.
		console.warn('Backend indisponível, partida não registrada.', error);
	}
}

// Mostra a tela de fim de partida com o motivo real (vitória com/sem
// recorde, ou derrota por falta de jogadas). Abandono (troca de mapa) não
// passa por aqui — quem trocou de mapa já sabe o que fez.
const gameOverModalEl = document.querySelector('#game-over-modal');
const gameOverIconEl = document.querySelector('#game-over-icon');
const gameOverTitleEl = document.querySelector('#game-over-title');
const gameOverMessageEl = document.querySelector('#game-over-message');
const gameOverStatsEl = document.querySelector('#game-over-stats');

function showGameOverModal(kind, { elapsedMs, movesCount, isRecord, racePlacement }) {
	gameOverModalEl.classList.remove('is-won', 'is-lost');
	gameOverModalEl.classList.add(kind === 'won' ? 'is-won' : 'is-lost');
	const replayButton = document.querySelector('#game-over-replay');

	if (raceContext) {
		if (kind === 'won') {
			gameOverIconEl.textContent = racePlacement === 1 ? '🥇' : '🏁';
			gameOverTitleEl.textContent = racePlacement
				? `Você terminou em ${racePlacement}º lugar!`
				: 'Você terminou a corrida!';
			gameOverMessageEl.textContent = 'Volte pra sala da corrida pra ver o placar completo dos outros jogadores.';
		} else {
			gameOverIconEl.textContent = '🚪';
			gameOverTitleEl.textContent = 'Corrida encerrada pra você';
			gameOverMessageEl.textContent = 'O tabuleiro travou — isso contou como desistência dessa corrida.';
		}
		replayButton.textContent = 'Ver placar da corrida';
	} else if (kind === 'won') {
		gameOverIconEl.textContent = isRecord ? '🏆' : '🎉';
		gameOverTitleEl.textContent = isRecord ? 'Novo recorde!' : 'Vitória!';
		gameOverMessageEl.textContent = isRecord
			? 'Você zerou o tabuleiro e bateu seu melhor tempo nesse mapa.'
			: 'Você encontrou todos os pares e zerou o tabuleiro.';
		replayButton.textContent = 'Jogar novamente';
	} else {
		gameOverIconEl.textContent = '😕';
		gameOverTitleEl.textContent = 'Sem mais jogadas';
		gameOverMessageEl.textContent = 'As peças que restaram não formam nenhum par possível — o tabuleiro travou. Da próxima vez, "Desfazer" ou "Dica" no menu Jogo podem evitar isso.';
		replayButton.textContent = 'Jogar novamente';
	}

	gameOverStatsEl.innerHTML = `
		<div class="game-over-stat"><span class="game-over-stat-value">${formatTime(elapsedMs)}</span><span class="game-over-stat-label">Tempo</span></div>
		<div class="game-over-stat"><span class="game-over-stat-value">${movesCount}</span><span class="game-over-stat-label">Jogadas</span></div>
	`;

	gameOverModalEl.hidden = false;
	replayButton.focus();
}

function hideGameOverModal() {
	gameOverModalEl.hidden = true;
}

function bindGameOverModal() {
	document.querySelector('#game-over-close').addEventListener('click', hideGameOverModal);
	document.querySelector('#game-over-replay').addEventListener('click', () => {
		hideGameOverModal();
		if (raceContext) {
			window.location.href = 'html/races.html';
			return;
		}
		startNewGame(currentMap, currentDifficulty);
		showToast('Novo tabuleiro criado.');
	});
	// clicar fora do card (no fundo escurecido) também fecha
	gameOverModalEl.addEventListener('click', event => {
		if (event.target === gameOverModalEl) hideGameOverModal();
	});
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape' && !gameOverModalEl.hidden) hideGameOverModal();
	});
}

// game.gameOver(message, playTime) é o único ponto do engine por onde toda
// partida termina — vitória (MSG_GOOD/MSG_BEST), derrota por falta de
// jogadas (MSG_FAIL) e desistência via surrender() (sem message nenhuma).
// Interceptar aqui cobre os três desfechos sem duplicar lógica.
const originalGameOver = game.gameOver.bind(game);
game.gameOver = (message, playTime) => {
	const elapsedMs = playTime ?? game.clock.elapsed();
	const movesCount = Math.floor(game.board.undo().length / 2);

	let result;
	if (message === 'MSG_GOOD' || message === 'MSG_BEST') result = 'won';
	else if (message === 'MSG_FAIL') result = 'lost';
	else result = 'abandoned';

	originalGameOver(message, playTime);

	// Só reporta/mostra partidas com pelo menos uma jogada — evita logar
	// "partidas" vazias de quem só ficou trocando de mapa sem chegar a jogar.
	if (movesCount === 0) return;

	if (raceContext) {
		handleRaceGameOver(result, elapsedMs, movesCount);
		return;
	}

	const shouldReport = result !== 'lost' || !matchLossReported;
	if (shouldReport) {
		reportGameSession(result, elapsedMs, movesCount);
		if (result === 'lost') matchLossReported = true;
	}

	if (result === 'won' || result === 'lost') {
		showGameOverModal(result, { elapsedMs, movesCount, isRecord: message === 'MSG_BEST' });
	}
};

// Em modo corrida não existe "derrota" isolada — só "terminou" (com
// colocação) ou "desistiu" (travou e não quis/conseguiu embaralhar, ou
// trocou de tabuleiro no meio). Cada caminho fala com o endpoint certo.
async function handleRaceGameOver(result, elapsedMs, movesCount) {
	if (result === 'won') {
		try {
			const participant = await raceApiRequest(`/races/${raceContext.id}/finish`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					duration_seconds: Math.max(0, Math.round(elapsedMs / 1000)),
					moves_count: movesCount,
					bonus_points: raceBonusCount,
				}),
			});
			showGameOverModal('won', { elapsedMs, movesCount, racePlacement: participant.placement });
		} catch (err) {
			console.warn('Não foi possível registrar o resultado da corrida.', err);
			showGameOverModal('won', { elapsedMs, movesCount });
		}
		clearRaceProgress(raceContext.id);
		return;
	}

	// 'lost' (travou de vez) ou 'abandoned' (trocou de tabuleiro) em modo
	// corrida são a mesma coisa pro backend: você saiu sem terminar.
	try {
		await raceApiRequest(`/races/${raceContext.id}/abandon`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ moves_count: movesCount }),
		});
	} catch (err) {
		console.warn('Não foi possível registrar a desistência da corrida.', err);
	}
	clearRaceProgress(raceContext.id);

	if (result === 'lost') {
		showGameOverModal('lost', { elapsedMs, movesCount });
	}
}

// ---------------------------------------------------------------------
// Tabuleiro travado (sem jogadas possíveis)
//
// O engine tem DOIS pontos que finalizam a partida quando trava:
//   - gameOverLosing(): Normal/Difícil (e Fácil quando sobra <=1 peça livre)
//     — finaliza a partida NA HORA, indo direto pro estado "idle". É por
//     isso que "Desfazer"/"Embaralhar" paravam de funcionar: eles só agem
//     com isRunning()===true, e "idle" não é "running".
//   - gameOverEasyMode(): só no modo Fácil, tentava um resgate silencioso
//     (nenhuma mensagem aparecia na tela).
//
// Interceptando os dois, a partida nunca mais cai direto no "idle" travado:
// sempre mostramos uma escolha real antes. O estado continua 'run' durante
// a escolha, então os botões do menu (Desfazer etc.) continuam funcionando
// normalmente por trás — mas como o modal cobre a tela, oferecemos as
// mesmas ações diretamente nele.
// ---------------------------------------------------------------------
const originalGameOverLosing = game.gameOverLosing.bind(game);

const stuckModalEl = document.querySelector('#stuck-modal');
const stuckStatsEl = document.querySelector('#stuck-stats');
const stuckUndoButton = document.querySelector('#stuck-undo');
let stuckSnapshot = null; // { elapsedMs, movesCount } no exato momento em que travou

function showStuckModal() {
	stuckSnapshot = {
		elapsedMs: game.clock.elapsed(),
		movesCount: Math.floor(game.board.undo().length / 2),
	};

	stuckStatsEl.innerHTML = `
		<div class="game-over-stat"><span class="game-over-stat-value">${formatTime(stuckSnapshot.elapsedMs)}</span><span class="game-over-stat-label">Tempo</span></div>
		<div class="game-over-stat"><span class="game-over-stat-value">${stuckSnapshot.movesCount}</span><span class="game-over-stat-label">Jogadas</span></div>
	`;

	// Desfazer é uma regra do próprio jogo desabilitada no modo Difícil —
	// mantemos essa mesma regra aqui em vez de reinventar uma nova.
	stuckUndoButton.hidden = game.mode() === GAME_MODE_EXPERT;

	stuckModalEl.hidden = false;
	document.querySelector('#stuck-shuffle')?.focus();
}

function hideStuckModal() {
	stuckModalEl.hidden = true;
}

function bindStuckModal() {
	stuckUndoButton.addEventListener('click', () => {
		hideStuckModal();
		game.back();
		render();
		showToast('Última jogada desfeita.');
	});

	document.querySelector('#stuck-shuffle').addEventListener('click', () => {
		const { elapsedMs, movesCount } = stuckSnapshot;
		hideStuckModal();

		// Em modo corrida não existe "derrota" pra reportar aqui — só ao
		// terminar (finish) ou desistir de vez (abandon, tratado abaixo se
		// nem embaralhar resolver). Continuar tentando não é reportado.
		let isFirstLossThisMatch = false;
		if (!raceContext) {
			// Conta como derrota só na primeira vez que a partida trava — se
			// travar de novo mais adiante na mesma partida, não conta de novo.
			isFirstLossThisMatch = !matchLossReported;
			if (isFirstLossThisMatch) {
				reportGameSession('lost', elapsedMs, movesCount);
				matchLossReported = true;
			}
		}

		let rescued = false;
		for (let attempt = 0; attempt < RESCUE_SHUFFLE_ATTEMPTS; attempt += 1) {
			game.board.shuffle();
			if (game.board.free().length > 0) {
				rescued = true;
				break;
			}
		}
		render();

		if (rescued) {
			showToast(
				raceContext
					? 'Peças embaralhadas — continue correndo!'
					: isFirstLossThisMatch
						? 'Peças embaralhadas — a derrota já foi registrada, mas dá pra continuar.'
						: 'Peças embaralhadas — essa partida já contava como derrota, dá pra continuar.'
			);
		} else {
			// Nem embaralhar resolveu (raro) — a partida realmente acabou.
			// originalGameOver (a versão CRUA, sem o patch) só cuida do
			// estado interno do engine — por isso em modo corrida a
			// desistência precisa ser reportada manualmente aqui.
			originalGameOver('MSG_FAIL');
			if (raceContext) {
				handleRaceGameOver('lost', elapsedMs, movesCount);
			} else {
				showGameOverModal('lost', { elapsedMs, movesCount, isRecord: false });
			}
		}
	});

	document.querySelector('#stuck-finish').addEventListener('click', () => {
		hideStuckModal();
		originalGameOverLosing();
	});

	// Sem fechar clicando fora/Esc de propósito: enquanto travado, o
	// jogador precisa escolher uma das 3 ações — não existe "deixar como
	// está" sem ficar preso de novo.
}

game.gameOverLosing = showStuckModal;
game.gameOverEasyMode = showStuckModal;

function closeMenus() {
	document.querySelectorAll('.menu-panel').forEach(panel => {
		panel.hidden = true;
		const trigger = document.querySelector(`[data-menu="${panel.id}"]`);
		trigger?.setAttribute('aria-expanded', 'false');
	});
}

function bindMenus() {
	document.querySelectorAll('.nav-button').forEach(button => {
		button.addEventListener('click', event => {
			event.stopPropagation();
			const panel = document.getElementById(button.dataset.menu);
			const wasOpen = !panel.hidden;
			closeMenus();
			if (!wasOpen) {
				panel.hidden = false;
				button.setAttribute('aria-expanded', 'true');
			}
		});
	});
	document.addEventListener('click', closeMenus);
	document.querySelectorAll('.menu-panel').forEach(panel => panel.addEventListener('click', event => event.stopPropagation()));
}

function handleAction(action) {
	closeMenus();
	try {
		switch (action) {
			case 'new':
				startNewGame();
				showToast('Novo tabuleiro criado.');
				break;
			case 'pause':
				if (game.isRunning() || game.isPaused()) {
					game.toggle();
					game.save();
					render();
					showToast(game.isPaused() ? 'Partida pausada.' : 'Partida retomada.');
				}
				break;
			case 'hint':
				if (!game.isRunning()) return showToast('Retome a partida para usar a dica.');
				game.hint();
				render();
				showToast(currentDifficulty === 'dificil' ? 'A dica está desativada nesta dificuldade.' : 'Uma jogada possível foi destacada.');
				break;
			case 'undo':
				if (!game.isRunning()) return showToast('Retome a partida para desfazer.');
				const before = game.board.undo().length;
				game.back();
				game.save();
				render();
				showToast(before >= 2 ? 'Movimento desfeito.' : 'Não há movimento para desfazer.');
				break;
			case 'shuffle':
				if (!game.isRunning()) return showToast('Retome a partida para embaralhar.');
				if (currentDifficulty !== 'facil') return showToast('Embaralhar está disponível apenas no Fácil.');
				game.shuffle();
				game.save();
				render();
				showToast('Pedras embaralhadas.');
				break;
			case 'clear-selection':
				game.click();
				render();
				break;
			case 'fullscreen':
				if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
				else document.exitFullscreen?.();
				break;
		}
	} catch (error) {
		console.error(error);
		showToast('Não foi possível executar esta ação.');
	}
}

function bindSettings() {
	document.querySelector('#clock-toggle').addEventListener('change', event => {
		clockStatEl.hidden = !event.target.checked;
		showToast(event.target.checked ? 'Relógio ativado.' : 'Relógio ocultado.');
	});
	document.querySelector('#compact-toggle').addEventListener('change', event => {
		document.body.classList.toggle('compact', event.target.checked);
		requestBoardRender();
	});
	document.querySelector('#sound-toggle').addEventListener('change', event => {
		if (game.sound) game.sound.enabled = event.target.checked;
	});
}

function bindThemes() {
	document.querySelectorAll('[data-theme]').forEach(button => {
		button.addEventListener('click', () => {
			document.body.dataset.theme = button.dataset.theme;
			closeMenus();
			showToast(`Tema: ${button.textContent}`);
			requestBoardRender();
		});
	});
}

function bindMapControls() {
	document.querySelectorAll('[data-map]').forEach(button => {
		button.addEventListener('click', () => {
			const map = button.dataset.map;
			closeMenus();
			startNewGame(map, currentDifficulty);
			showToast(`Mapa: ${mapNames[map]}`);
		});
	});
}

function bindControls() {
	document.querySelectorAll('[data-action]').forEach(button => {
		button.addEventListener('click', () => handleAction(button.dataset.action));
	});
}

function bindDifficulty() {
	// The difficulty selector lives in the Jogo menu so it does not consume game-board space.
	const panel = document.querySelector('#game-menu');
	const divider = document.createElement('div');
	divider.className = 'menu-divider';
	panel.appendChild(divider);
	const label = document.createElement('label');
	label.className = 'menu-select-row';
	label.innerHTML = '<span>Dificuldade</span><select id="difficulty"><option value="facil">Fácil</option><option value="normal" selected>Normal</option><option value="dificil">Difícil</option></select>';
	panel.appendChild(label);
	label.querySelector('select').addEventListener('change', event => {
		currentDifficulty = event.target.value;
		startNewGame(currentMap, currentDifficulty);
		closeMenus();
		showToast(`Dificuldade: ${event.target.options[event.target.selectedIndex].text}`);
	});
}

function requestBoardRender() {
	cancelAnimationFrame(resizeFrame);
	resizeFrame = requestAnimationFrame(render);
}

async function loadTileset(source) {
	const selected = KyodaiTileSets.find(set => set.source === source) ?? KyodaiTileSets[0];
	if (!selected) throw new Error('Nenhum tileset disponível.');
	const svgContent = await buildKyodaiSVG(selected.source);
	let defs = document.querySelector('#tileset-defs');
	if (!defs) {
		defs = document.createElement('div');
		defs.id = 'tileset-defs';
		defs.hidden = true;
		document.body.appendChild(defs);
	}
	defs.innerHTML = svgContent;
	currentTileset = selected.source;
	localStorage.setItem('mahjong-tileset', currentTileset);
	const select = document.querySelector('#tileset-select');
	if (select) select.value = currentTileset;
}

function bindTilesets() {
	const select = document.querySelector('#tileset-select');
	if (!select) return;
	select.innerHTML = KyodaiTileSets.map((set, index) => `<option value="${set.source}">${set.name}</option>`).join('');
	select.value = currentTileset;
	select.addEventListener('change', async event => {
		try {
			await loadTileset(event.target.value);
			closeMenus();
			render();
			showToast(`Tema das peças: ${event.target.options[event.target.selectedIndex].text}`);
		} catch (error) {
			console.error(error);
			showToast('Não foi possível carregar esse tema de peças.');
		}
	});
}

function bindKeyboard() {
	document.addEventListener('keydown', event => {
		if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
		const tag = document.activeElement?.tagName;
		if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
		if (event.key.toLowerCase() === 'p') {
			event.preventDefault();
			handleAction('pause');
		}
	});
}

// Arrow-key navigation across the board: moving focus onto a tile "blinks" it
// (same visual as hovering with the mouse), and Enter/Space selects it just
// like a click, since the tiles are native buttons.
function bindBoardNavigation() {
	boardEl.addEventListener('keydown', event => {
		if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
		const current = document.activeElement;
		if (!current || !current.classList.contains('stone') || !boardEl.contains(current)) return;
		event.preventDefault();

		const cx = Number(current.dataset.gx);
		const cy = Number(current.dataset.gy);
		let best = null;
		let bestDist = Infinity;
		boardEl.querySelectorAll('.stone').forEach(el => {
			if (el === current) return;
			const x = Number(el.dataset.gx);
			const y = Number(el.dataset.gy);
			const dx = x - cx;
			const dy = y - cy;
			let inDirection = false;
			if (event.key === 'ArrowRight') inDirection = dx > 0 && Math.abs(dy) <= Math.abs(dx);
			else if (event.key === 'ArrowLeft') inDirection = dx < 0 && Math.abs(dy) <= Math.abs(dx);
			else if (event.key === 'ArrowDown') inDirection = dy > 0 && Math.abs(dx) <= Math.abs(dy);
			else if (event.key === 'ArrowUp') inDirection = dy < 0 && Math.abs(dx) <= Math.abs(dy);
			if (!inDirection) return;
			const dist = dx * dx + dy * dy;
			if (dist < bestDist) {
				bestDist = dist;
				best = el;
			}
		});
		best?.focus({ preventScroll: true });
	});
}

// -----------------------------------------------------------------------
// Modo corrida — ativado quando a página abre com ?race=<id> na URL
// (link vindo de html/races.html, botão "Jogar agora").
// -----------------------------------------------------------------------

function getRaceIdFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get('race');
}

const RACE_COUNTDOWN_MS = 5000;

function raceProgressKey(raceId) {
	return `mahjong:race:${raceId}:progress`;
}

// Cada jogada em modo corrida salva o histórico de pares casados (não o
// tabuleiro inteiro) — como o tabuleiro é gerado de forma determinística a
// partir da seed, basta refazer os mesmos cliques, na mesma ordem, pra
// reconstruir exatamente o mesmo estado depois de um F5.
function saveRaceProgress() {
	if (!raceContext) return;
	localStorage.setItem(raceProgressKey(raceContext.id), JSON.stringify({
		undo: game.board.undo(),
		bonusCount: raceBonusCount,
	}));
}

function loadRaceProgress(raceId) {
	try {
		const raw = localStorage.getItem(raceProgressKey(raceId));
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function clearRaceProgress(raceId) {
	localStorage.removeItem(raceProgressKey(raceId));
}

// Refaz os cliques salvos contra o tabuleiro recém-gerado (idêntico ao de
// antes do reload, mesma seed). isReplayingRace evita que isso dispare
// combo/som como se fossem jogadas novas.
function replaySavedRaceProgress(progress) {
	isReplayingRace = true;
	const pairs = progress.undo ?? [];
	for (let i = 0; i < pairs.length; i += 1) {
		const [z, x, y] = pairs[i];
		const stone = game.board.stones().find(s => s.x === x && s.y === y && s.z === z && !s.picked());
		if (stone) game.click(stone);
	}
	isReplayingRace = false;
	matchTimestamps = [];
	raceBonusCount = progress.bonusCount ?? 0;
	// O replay pode ter iniciado o relógio de verdade (click() liga o
	// cronômetro na primeira jogada) — para ele agora; o tempo correto vem
	// do horário oficial de início da corrida, calculado logo em seguida.
	game.clock.pause();
}

// Mostra "5, 4, 3, 2, 1, Vai!" cobrindo a tela (o tabuleiro fica visível,
// só não é clicável) até o horário oficial de início chegar. msRemaining
// vem de raceContext.playStartsAt, então é o MESMO instante pra todo mundo
// na corrida, veio de quando entrou na tela ou não.
function showRaceCountdown(msRemaining, onDone) {
	const overlay = document.querySelector('#race-countdown-overlay');
	const numberEl = document.querySelector('#race-countdown-number');
	overlay.hidden = false;

	const timer = window.setInterval(() => {
		msRemaining -= 200;
		const secondsLeft = Math.max(0, Math.ceil(msRemaining / 1000));
		numberEl.textContent = secondsLeft > 0 ? String(secondsLeft) : 'Vai!';

		if (msRemaining <= -400) {
			window.clearInterval(timer);
			overlay.hidden = true;
			onDone();
		}
	}, 200);

	numberEl.textContent = String(Math.max(1, Math.ceil(msRemaining / 1000)));
}

// Roda depois que o tabuleiro da corrida já foi gerado (startNewGame já
// aconteceu). Retoma progresso salvo se houver, e sincroniza o cronômetro
// com o horário oficial de início — com ou sem contador, dependendo de
// quanto tempo já passou.
function setupRaceCountdownAndResume() {
	const progress = loadRaceProgress(raceContext.id);
	if (progress) {
		replaySavedRaceProgress(progress);
		render();
	}

	const syncClockAndRun = () => {
		game.clock.elapsed.set(Math.max(0, Date.now() - raceContext.playStartsAt));
		game.clock.run();
	};

	const msRemaining = raceContext.playStartsAt - Date.now();
	if (msRemaining > 0) {
		game.clock.elapsed.set(0);
		showRaceCountdown(msRemaining, syncClockAndRun);
	} else {
		syncClockAndRun();
	}
}

function lockControlsForRace() {
	// Numa corrida o mapa é fixo (definido pela seed compartilhada) —
	// trocar de mapa, dificuldade ou começar um jogo novo abandonaria a
	// corrida sem avisar, então trava esses controles em vez disso.
	document.querySelectorAll('[data-action="new"]').forEach(btn => {
		btn.disabled = true;
		btn.title = 'Não disponível durante uma corrida';
	});
	document.querySelectorAll('#map-menu [data-map]').forEach(btn => {
		btn.disabled = true;
		btn.title = 'O mapa é fixo durante uma corrida';
	});
	const difficultySelect = document.querySelector('#difficulty');
	if (difficultySelect) {
		difficultySelect.disabled = true;
		difficultySelect.title = 'Não disponível durante uma corrida';
	}
}

function bindRaceMode() {
	document.querySelector('#abandon-race-in-game-button').addEventListener('click', async () => {
		if (!raceContext) return;
		const confirmed = window.confirm(
			'Tem certeza que quer desistir dessa corrida? Você sai da disputa e não recebe colocação.'
		);
		if (!confirmed) return;

		const movesCount = Math.floor(game.board.undo().length / 2);
		try {
			await raceApiRequest(`/races/${raceContext.id}/abandon`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ moves_count: movesCount }),
			});
		} catch (err) {
			console.warn('Não foi possível registrar a desistência.', err);
		}
		clearRaceProgress(raceContext.id);
		window.location.href = 'html/races.html';
	});
}

// Valida a corrida da URL e prepara o modo corrida ANTES do tabuleiro ser
// gerado (a ordem importa: seedRNG precisa rodar antes de startNewGame()).
// Retorna false se redirecionou pra outro lugar (corrida inválida, ainda
// não começou, já terminou, ou o usuário não faz parte dela) — nesse caso
// quem chamou não deve continuar iniciando um jogo normal por engano.
async function setupRaceMode() {
	const raceId = getRaceIdFromUrl();
	if (!raceId) return true;

	const storedUser = JSON.parse(localStorage.getItem('mahjong:user') || 'null');

	try {
		const race = await raceApiRequest(`/races/${raceId}`);
		const myParticipant = storedUser && race.participants.find(p => p.user_id === storedUser.id);

		if (!myParticipant) {
			showToast('Você não faz parte dessa corrida.');
			window.location.href = 'html/races.html';
			return false;
		}
		if (myParticipant.status !== 'racing') {
			showToast('Você já terminou ou desistiu dessa corrida.');
			window.location.href = 'html/races.html';
			return false;
		}
		if (race.status === 'waiting') {
			showToast('Essa corrida ainda não começou.');
			window.location.href = 'html/races.html';
			return false;
		}
		if (race.status === 'finished') {
			showToast('Essa corrida já terminou.');
			window.location.href = 'html/races.html';
			return false;
		}

		raceContext = {
			id: race.id,
			seed: race.seed,
			map_layout: race.map_layout,
			// Âncora do início "de verdade" da corrida: 5s depois do horário
			// em que o CRIADOR clicou em "Iniciar corrida" no servidor — não
			// de quando ESTE jogador carregou a tela. Isso garante que o
			// contador regressivo e o cronômetro fiquem sincronizados entre
			// todos os participantes, mesmo que cada um entre em momentos
			// diferentes (e sobrevive a um F5 sem perder a sincronia).
			playStartsAt: new Date(race.started_at).getTime() + RACE_COUNTDOWN_MS,
		};

		// A seed precisa ser aplicada ANTES de qualquer geração de tabuleiro
		// — é isso que garante que todo mundo na corrida recebe exatamente
		// o mesmo mapa (ver engine/array-utilities.js).
		seedRNG(raceContext.seed);
		currentMap = raceContext.map_layout;

		document.querySelector('#race-mode-badge').hidden = false;
		document.querySelector('#abandon-race-in-game-button').hidden = false;
		lockControlsForRace();

		return true;
	} catch (err) {
		console.warn('Não foi possível entrar na corrida:', err);
		showToast('Não foi possível entrar nessa corrida.');
		window.location.href = 'html/races.html';
		return false;
	}
}

async function init() {
	try {
		await loadTileset(currentTileset);
	} catch (error) {
		console.error('Erro ao carregar tileset:', error);
	}

	bindMenus();
	bindSettings();
	bindThemes();
	bindTilesets();
	bindMapControls();
	bindKeyboard();
	bindBoardNavigation();
	bindControls();
	bindDifficulty();
	bindGameOverModal();
	bindStuckModal();
	bindRaceMode();
	window.addEventListener('resize', requestBoardRender);

	const shouldStartNormally = await setupRaceMode();
	if (!shouldStartNormally) return;

	startNewGame();
	if (raceContext) setupRaceCountdownAndResume();
	setInterval(updateHUD, 250);
}

init();