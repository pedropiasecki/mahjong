import path from 'path';
import { AppDataSource } from '@shared/typeorm/data-source';
import AppError from '@shared/errors/AppError';
import uploadConfig from '@config/upload';
import { Profile } from '../typeorm/entities/Profile';
import deleteFile from '@shared/utils/deleteFile';

interface IRequest {
	user_id: string;
	avatarFilename: string;
}

// avatar_url guarda um caminho relativo ("/files/<nome-do-arquivo>"), servido
// estaticamente pelo server.ts (app.use('/files', express.static(...))). O
// front-end deve prefixar com a URL base da API para montar o link completo
// da imagem (ex.: `${API_BASE_URL}${profile.avatar_url}`).
export default class UpdateProfileAvatarService {
	public async execute({ user_id, avatarFilename }: IRequest): Promise<Profile> {
		const profileRepository = AppDataSource.getRepository(Profile);

		const profile = await profileRepository.findOne({ where: { user_id } });

		if (!profile) {
			throw new AppError('Profile not found', 404);
		}

		if (profile.avatar_url) {
			const oldFilename = path.basename(profile.avatar_url);
			await deleteFile(path.join(uploadConfig.directory, oldFilename));
		}

		profile.avatar_url = `/files/${avatarFilename}`;

		await profileRepository.save(profile);

		return profile;
	}
}