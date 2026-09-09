import ListRankingService from './ListRankingService';

interface IRequest {
	user_id: string;
	map_layout?: string;
}

interface IResponse {
	ranked: boolean;
	position: number | null;
	best_time_seconds: number | null;
	total_ranked: number;
}

// Reaproveita o ListRankingService pedindo a lista INTEIRA (sem limit) e
// procura a posição do usuário nela, em vez de duplicar a query com uma
// subquery de contagem — mais simples e com a mesma fonte de verdade do
// ranking exibido.
export default class ShowMyRankingService {
	public async execute({ user_id, map_layout }: IRequest): Promise<IResponse> {
		const listRanking = new ListRankingService();
		const fullRanking = await listRanking.execute(
			map_layout !== undefined ? { map_layout } : {}
		);

		const myEntry = fullRanking.find(entry => entry.user_id === user_id);

		if (!myEntry) {
			return {
				ranked: false,
				position: null,
				best_time_seconds: null,
				total_ranked: fullRanking.length,
			};
		}

		return {
			ranked: true,
			position: myEntry.position,
			best_time_seconds: myEntry.best_time_seconds,
			total_ranked: fullRanking.length,
		};
	}
}