import { AppDataSource } from "@shared/typeorm/data-source";
import { Playlist } from "../typeorm/entitites/Playlist";

export default class ListUserPlaylistsService {
	private playlistRepository = AppDataSource.getRepository(Playlist);

	async execute(userId: string): Promise<Playlist[]> {
		return await this.playlistRepository.find({
			where: { user: { id: userId } },
			relations: ["musics"]
		});
	}
}