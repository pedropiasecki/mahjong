import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import { Profile } from '../typeorm/entities/Profile';

interface IRequest {
	user_id: string;
}

export default class ShowProfileService {
	public async execute({ user_id }: IRequest): Promise<Profile> {
		const profileRepository = AppDataSource.getRepository(Profile);

		const profile = await profileRepository.findOne({
			where: { user_id },
		});

		if (!profile) {
			throw new AppError('Profile not found', 404);
		}

		return profile;
	}
}