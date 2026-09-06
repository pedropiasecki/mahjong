import { Request, Response } from 'express';
import ListRankingService from '../services/ListRankingService';
import ShowMyRankingService from '../services/ShowMyRankingService';

export default class RankingController {
	// GET /ranking?map=turtle&limit=20
	public async index(request: Request, response: Response): Promise<Response> {
		const { map, limit } = request.query;

		const listRanking = new ListRankingService();
		const ranking = await listRanking.execute({
			...(typeof map === 'string' ? { map_layout: map } : {}),
			limit: limit ? Number(limit) : 20,
		});

		return response.json(ranking);
	}

	// GET /ranking/me?map=turtle
	public async me(request: Request, response: Response): Promise<Response> {
		const { map } = request.query;

		const showMyRanking = new ShowMyRankingService();
		const myRanking = await showMyRanking.execute({
			user_id: request.user.id,
			...(typeof map === 'string' ? { map_layout: map } : {}),
		});

		return response.json(myRanking);
	}
}