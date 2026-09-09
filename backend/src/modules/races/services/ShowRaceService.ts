import { In } from 'typeorm';
import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import { Profile } from '@modules/profiles/typeorm/entities/Profile';
import { Race } from '../typeorm/entities/Race';
import { RaceParticipant, RaceParticipantStatus } from '../typeorm/entities/RaceParticipant';

interface IRequest {
	race_id: string;
}

export interface RaceParticipantView {
	user_id: string;
	display_name: string | null;
	avatar_url: string | null;
	status: RaceParticipantStatus;
	duration_seconds: number | null;
	moves_count: number | null;
	bonus_points: number;
	placement: number | null;
}

export interface RaceView {
	id: string;
	map_layout: string;
	seed: string;
	status: string;
	created_by: string;
	started_at: Date | null;
	created_at: Date;
	participants: RaceParticipantView[];
}

// Usado tanto pela sala de espera (status='waiting', ninguém terminou
// ainda) quanto pelo placar ao vivo (status='running', via polling — o
// front-end chama isso de novos em novos segundos pra saber quem já
// terminou e em quanto tempo).
export default class ShowRaceService {
	public async execute({ race_id }: IRequest): Promise<RaceView> {
		const raceRepository = AppDataSource.getRepository(Race);
		const participantRepository = AppDataSource.getRepository(RaceParticipant);

		const race = await raceRepository.findOne({ where: { id: race_id } });
		if (!race) {
			throw new AppError('Race not found', 404);
		}

		const participants = await participantRepository.find({
			where: { race_id },
			order: { placement: 'ASC', joined_at: 'ASC' },
		});

		const profileRepository = AppDataSource.getRepository(Profile);
		const profiles = await profileRepository.find({
			where: { user_id: In(participants.map(p => p.user_id)) },
		});
		const profileByUserId = new Map(profiles.map(profile => [profile.user_id, profile]));

		return {
			id: race.id,
			map_layout: race.map_layout,
			seed: race.seed,
			status: race.status,
			created_by: race.created_by,
			started_at: race.started_at,
			created_at: race.created_at,
			participants: participants.map(participant => {
				const profile = profileByUserId.get(participant.user_id);
				return {
					user_id: participant.user_id,
					display_name: profile?.display_name ?? null,
					avatar_url: profile?.avatar_url ?? null,
					status: participant.status,
					duration_seconds: participant.duration_seconds,
					moves_count: participant.moves_count,
					bonus_points: participant.bonus_points,
					placement: participant.placement,
				};
			}),
		};
	}
}