import { Request, Response } from 'express';
import CreateRaceService from '../services/CreateRaceService';
import JoinRaceService from '../services/JoinRaceService';
import StartRaceService from '../services/StartRaceService';
import FinishRaceService from '../services/FinishRaceService';
import ShowRaceService from '../services/ShowRaceService';
import ListRacesService, { RaceListItem } from '../services/ListRacesService';
import AbandonRaceService from '../services/AbandonRaceService';

export default class RaceController {
	// POST /races
	public async create(request: Request, response: Response): Promise<Response> {
		const { map_layout } = request.body;

		const createRace = new CreateRaceService();
		const race = await createRace.execute({ user_id: request.user.id, map_layout });

		return response.status(201).json(race);
	}

	// GET /races?status=waiting
	public async index(request: Request, response: Response): Promise<Response> {
		const { status, limit } = request.query;

		const listRaces = new ListRacesService();
		const races: RaceListItem[] = await listRaces.execute({
			...(typeof status === 'string' ? { status: status as 'waiting' | 'running' | 'finished' } : {}),
			limit: limit ? Number(limit) : 20,
		});

		return response.json(races);
	}

	// GET /races/:id
	public async show(request: Request, response: Response): Promise<Response> {
		const { id } = request.params;

		const showRace = new ShowRaceService();
		const race = await showRace.execute({ race_id: id as string });

		return response.json(race);
	}

	// POST /races/:id/join
	public async join(request: Request, response: Response): Promise<Response> {
		const { id } = request.params;

		const joinRace = new JoinRaceService();
		const participant = await joinRace.execute({ race_id: id as string, user_id: request.user.id });

		return response.status(201).json(participant);
	}

	// POST /races/:id/start
	public async start(request: Request, response: Response): Promise<Response> {
		const { id } = request.params;

		const startRace = new StartRaceService();
		const race = await startRace.execute({ race_id: id as string, user_id: request.user.id });

		return response.json(race);
	}

	// POST /races/:id/finish
	public async finish(request: Request, response: Response): Promise<Response> {
		const { id } = request.params;
		const { duration_seconds, moves_count, bonus_points } = request.body;

		const finishRace = new FinishRaceService();
		const participant = await finishRace.execute({
			race_id: id as string,
			user_id: request.user.id,
			duration_seconds,
			moves_count,
			...(bonus_points !== undefined ? { bonus_points } : {}),
		});

		return response.json(participant);
	}

	// POST /races/:id/abandon
	public async abandon(request: Request, response: Response): Promise<Response> {
		const { id } = request.params;
		const { moves_count } = request.body;

		const abandonRace = new AbandonRaceService();
		const participant = await abandonRace.execute({
			race_id: id as string,
			user_id: request.user.id,
			...(moves_count !== undefined ? { moves_count } : {}),
		});

		return response.json(participant);
	}
}