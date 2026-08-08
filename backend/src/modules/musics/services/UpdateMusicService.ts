import { AppDataSource } from "@shared/typeorm/data-source";
import Music from "../typeorm/entities/Music";
import AppError from "@shared/errors/AppError";

interface IRequest{
    id: string;
    name: string;
    duration: number;
    genre: string;
    release_date: Date;
    language: string;
}

export default class UpdateMusicService {

    public async execute({id, name, duration, genre, release_date, language} : IRequest): Promise<Music>{
        const musicRepository = AppDataSource.getRepository(Music);

        const music = await musicRepository.findOneBy({id});

        if (!music){
            throw new AppError('Music not found');
        }

        const musicExists = await musicRepository.findOne({
            where: { name, duration, language, release_date }
        });

        if (musicExists && musicExists.id !== music.id) {
            throw new AppError("Music already exists.")
        }

        music.name = name;
        music.duration = duration;
        music.genre = genre
        music.release_date = release_date;
        music.language = language;

        await musicRepository.save(music);
        return music;
    }

}