import { Request, Response } from 'express';
import ShowProfileService from '../services/ShowProfileService';
import UpdateProfileService from '../services/UpdateProfileService';
import UpdateProfileAvatarService from '../services/UpdateProfileAvatarService';
import AppError from '@shared/errors/AppError';

export default class ProfileController {
	// GET /profiles/me — perfil do usuário autenticado (via token)
	public async show(request: Request, response: Response): Promise<Response> {
		const showProfile = new ShowProfileService();

		const profile = await showProfile.execute({ user_id: request.user.id });

		return response.json(profile);
	}

	// PUT /profiles/me — atualiza avatar / bio / display_name do próprio usuário
	public async update(request: Request, response: Response): Promise<Response> {
		const { display_name, avatar_url, bio } = request.body;

		const updateProfile = new UpdateProfileService();

		const profile = await updateProfile.execute({
			user_id: request.user.id,
			display_name,
			avatar_url,
			bio,
		});

		return response.json(profile);
	}

	// PATCH /profiles/me/avatar — upload de foto de perfil (multipart/form-data)
	public async updateAvatar(request: Request, response: Response): Promise<Response> {
		if (!request.file) {
			throw new AppError('Nenhum arquivo de imagem foi enviado.');
		}

		const updateProfileAvatar = new UpdateProfileAvatarService();

		const profile = await updateProfileAvatar.execute({
			user_id: request.user.id,
			avatarFilename: request.file.filename,
		});

		return response.json(profile);
	}
}