import { AppDataSource } from "@shared/typeorm/data-source";
import { Author } from "../typeorm/entities/Author";


export default class ListAuthorsService {
    private authorRepository = AppDataSource.getRepository(Author);

    async execute(): Promise<Author[]> {
        return await this.authorRepository.find();
    }
}