import { AppDataSource } from '@shared/typeorm/data-source';
import { Profile } from '../typeorm/entities/Profile';

interface IRequest {
	user_id: string;
	display_name?: string;
}

// Chamado uma única vez, logo após o CreateUserService salvar o User —
// todo usuário deve ter exatamente um Profile (por isso user_id é unique).
export default class CreateProfileService {
	public async execute({ user_id, display_name }: IRequest): Promise<Profile> {
		const profileRepository = AppDataSource.getRepository(Profile);

		const profile = profileRepository.create({
			user_id,
			...(display_name !== undefined ? { display_name } : {}),
		});

		await profileRepository.save(profile);

		return profile;
	}
}