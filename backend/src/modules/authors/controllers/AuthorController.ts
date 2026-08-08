import { NextFunction, Request, Response } from "express";
import CreateAuthorService from "../services/CreateAuthorService";
import ListAuthorsService from "../services/ListAuthorsService";
import ShowAuthorService from "../services/ShowAuthorService";
import LinkAuthorMusicService from "../services/LinkAuthorMusicService";

export default class AuthorController {
    
    public async create(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { name, artistic_name, nationality, birth_date, about } = request.body;

            const createAuthorService = new CreateAuthorService();
            const author = await createAuthorService.execute({
                name,
                artisticName: artistic_name,
                nationality,
                birthDate: new Date(birth_date),
                about,
            });

            return response.status(201).json(author);
        } catch(err) {
            next(err);
        }
    }

    public async list(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const listAuthorsService = new ListAuthorsService();
            const authors = await listAuthorsService.execute();

            return response.status(200).json(authors);
        } catch(err) {
            next(err);
        }
    }

    public async show(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const id = request.params.id as string;
            
            const showAuthorService = new ShowAuthorService();
            const author = await showAuthorService.execute(id);

            return response.status(200).json(author);
        } catch(err) {
            next(err);
        }
    }

    public async linkMusic(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { authorId, musicId } = request.body;

            const linkAuthorMusicService = new LinkAuthorMusicService();
            const updatedMusic = await linkAuthorMusicService.execute({
                authorId,
                musicId,
            });

            return response.status(200).json({
                message: "Música vinculada ao autor com sucesso!",
                music: updatedMusic
            });
        } catch(err) {
            next(err);
        }
    }
}