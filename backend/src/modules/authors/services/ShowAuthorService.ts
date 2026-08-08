import { AppDataSource } from "@shared/typeorm/data-source";
import { Author } from "../typeorm/entities/Author";

export default class ShowAuthorService {
    private authorRepository = AppDataSource.getRepository(Author);

    async execute(id: string): Promise<Author | null> {
        return await this.authorRepository.findOne({
            where: { id },
            relations: ["musics"],
        });
    }
}
