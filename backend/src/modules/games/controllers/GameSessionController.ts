import { Request, Response } from 'express';
import CreateGameSessionService from '../services/CreateGameSessionService';
import ListGameSessionsService from '../services/ListGameSessionsService';

export default class GameSessionController {
	// POST /games — chamado pelo frontend quando uma partida termina
	// (vitória) ou é abandonada.
	public async create(request: Request, response: Response): Promise<Response> {
		const { mode, map_layout, tileset, duration_seconds, moves_count, result } = request.body;

		const createGameSession = new CreateGameSessionService();

		const gameSession = await createGameSession.execute({
			user_id: request.user.id,
			mode,
			map_layout,
			tileset,
			duration_seconds,
			moves_count,
			result,
		});

		return response.status(201).json(gameSession);
	}

	// GET /games — histórico de partidas do usuário autenticado
	public async index(request: Request, response: Response): Promise<Response> {
		const listGameSessions = new ListGameSessionsService();

		const sessions = await listGameSessions.execute({ user_id: request.user.id });

		return response.json(sessions);
	}
}