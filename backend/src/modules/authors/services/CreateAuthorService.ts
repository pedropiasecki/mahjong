import { AppDataSource } from "@shared/typeorm/data-source";
import { Author } from "../typeorm/entities/Author";
import AppError from "@shared/errors/AppError";

export default class CreateAuthorService {
    private authorRepository = AppDataSource.getRepository(Author);

    async execute(data: Partial<Author>): Promise<Author> {
        const { name, birthDate } = data;

        if (name && birthDate) {

            const authorExists = await this.authorRepository.findOne({
                where: { name, birthDate }
            });

            if (authorExists) {
                throw new AppError("Já existe esse autor cadastrado.");
            }
        }

        const newAuthor = this.authorRepository.create(data);
        return await this.authorRepository.save(newAuthor);
    }
}