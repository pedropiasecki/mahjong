import { AppDataSource } from "@shared/typeorm/data-source";
import Music from "../typeorm/entities/Music";
import AppError from "@shared/errors/AppError";

interface IRequest {
    id: string;
}

export default class ShowMusicService {
    public async execute({id}: IRequest): Promise<Music>{
        const musicRepository = AppDataSource.getRepository(Music);
        
        const music = await musicRepository.findOneBy({id});

        if (!music){
            throw new AppError('Music not found');
        }

        return music;
    }
}