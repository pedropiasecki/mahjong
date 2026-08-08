import { AppDataSource } from "@shared/typeorm/data-source";
import Music from "../typeorm/entities/Music";

export default class ListMusicService {
    public async execute(): Promise<Music[]>{
        const musicRepository = AppDataSource.getRepository(Music);
        return musicRepository.find();
    }
}