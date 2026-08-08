import { AppDataSource } from "@shared/typeorm/data-source";
import { Playlist } from "../typeorm/entitites/Playlist";
import Music from "@modules/musics/typeorm/entities/Music";
import AppError from "@shared/errors/AppError";

interface IRequest {
	playlistId: string;
	musicId: string;
	userId: string;
}

export default class AddMusicToPlaylistService {
	private playlistRepository = AppDataSource.getRepository(Playlist);
	private musicRepository = AppDataSource.getRepository(Music);

	async execute({ playlistId, musicId, userId }: IRequest): Promise<Playlist> {
		const playlist = await this.playlistRepository.findOne({
			where: { id: playlistId },
			relations: ["musics", "user"]
		});

		if (!playlist) {
			throw new AppError("Playlist não encontrada.");
		}

		if (playlist.user.id !== userId) {
			throw new AppError("Você não tem permissão para alterar esta playlist.");
		}

		const music = await this.musicRepository.findOneBy({ id: musicId });
		if (!music) {
			throw new AppError("Música não encontrada.");
		}

		const musicExists = playlist.musics.some(m => m.id === musicId);
		if (musicExists) {
			throw new AppError("Esta música já está na playlist.");
		}

		playlist.musics.push(music);
		return await this.playlistRepository.save(playlist);
	}
}