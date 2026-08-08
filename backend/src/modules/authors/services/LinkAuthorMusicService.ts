import { AppDataSource } from "@shared/typeorm/data-source";
import { Author } from "../typeorm/entities/Author";
import Music from "@modules/musics/typeorm/entities/Music";
import AppError from "@shared/errors/AppError";

interface IRequest {
    authorId: string;
    musicId: string;
}

export default class LinkAuthorMusicService {
    private authorRepository = AppDataSource.getRepository(Author);
    private musicRepository = AppDataSource.getRepository(Music);

    async execute({ authorId, musicId }: IRequest): Promise<Music> {
        const author = await this.authorRepository.findOneBy({ id: authorId });
        if (!author) {
            throw new AppError("Autor não encontrado.");
        }

        const music = await this.musicRepository.findOneBy({ id: musicId });
        if (!music) {
            throw new AppError("Música não encontrada.");
        }

        music.author = author;

        return await this.musicRepository.save(music);
    }
}