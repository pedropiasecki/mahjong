import User from "@modules/users/typeorm/entities/User";
import Music from "@modules/musics/typeorm/entities/Music";
import { AppDataSource } from "@shared/typeorm/data-source";
import { Playlist } from "../typeorm/entitites/Playlist";

interface IRequest {
	title: string;
	description?: string;
	userId: string;
}

export default class CreatePlaylistService {
	private playlistRepository = AppDataSource.getRepository(Playlist);
	private userRepository = AppDataSource.getRepository(User);

	async execute({ title, description, userId }: IRequest): Promise<Playlist> {
		const user = await this.userRepository.findOneBy({ id: userId });
		if (!user) {
			throw new Error("Usuário não encontrado.");
		}

		const playlist = this.playlistRepository.create({
			title,
			description: description ?? "",
			user,
			musics: [] as Music[]
		});

		return await this.playlistRepository.save(playlist);
	}
}