import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import { Profile } from '../typeorm/entities/Profile';

interface IRequest {
	user_id: string;
	display_name?: string;
	avatar_url?: string;
	bio?: string;
}

// Só atualiza os campos "editáveis pelo próprio jogador". games_played,
// wins, losses e best_time_seconds NUNCA passam por aqui — só são tocados
// pelo CreateGameSessionService, a partir de partidas realmente jogadas.
export default class UpdateProfileService {
	public async execute({
		user_id,
		display_name,
		avatar_url,
		bio,
	}: IRequest): Promise<Profile> {
		const profileRepository = AppDataSource.getRepository(Profile);

		const profile = await profileRepository.findOne({
			where: { user_id },
		});

		if (!profile) {
			throw new AppError('Profile not found', 404);
		}

		if (display_name !== undefined) profile.display_name = display_name;
		if (avatar_url !== undefined) profile.avatar_url = avatar_url;
		if (bio !== undefined) profile.bio = bio;

		await profileRepository.save(profile);

		return profile;
	}
}