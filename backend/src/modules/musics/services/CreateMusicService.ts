import { AppDataSource } from "@shared/typeorm/data-source";
import Music from "../typeorm/entities/Music";
import AppError from "@shared/errors/AppError";

interface IRequest{
    name: string;
    duration: number;
    genre: string;
    release_date: Date;
    language: string;
}

export default class CreateMusicService {

    public async execute({name, duration, genre, release_date, language} : IRequest): Promise<Music>{
        const musicRepository = AppDataSource.getRepository(Music);

        const musicExists = await musicRepository.findOne({
            where: { name, duration, language, release_date }
        });

        if (musicExists) {
            throw new AppError("This music already exists.")
        }

        const music = musicRepository.create({name, duration, genre, release_date, language});
        await musicRepository.save(music);
        return music;
    }

}