import { NextFunction, Request, Response } from "express";
import ListMusicService from "../services/ListMusicService";
import ShowMusicService from "../services/ShowMusicService";
import CreateMusicService from "../services/CreateMusicService";
import UpdateMusicService from "../services/UpdateMusicService";
import DeleteMusicService from "../services/DeleteMusicService";

export default class MusicController {
    
    public async index(request: Request, response: Response, next: NextFunction): Promise<Response | void>{
        try{
            const listMusics = new ListMusicService();
            const musics = await listMusics.execute();
            return response.status(200).json(musics);
        }catch(err){
            next(err);
        }
    }

    public async show(request: Request, response: Response, next: NextFunction): Promise<Response | void>{
        try{
            const id = request.params.id as string;
            const showMusic = new ShowMusicService();
            const music = await showMusic.execute({id});
            return response.status(200).json(music);
        }catch(err){
            next(err);
        }
    }

    public async create(request: Request, response: Response, next: NextFunction): Promise<Response | void>{
        try{
            const {name, duration, genre, release_date, language} = request.body;
            const createMusic = new CreateMusicService();
            const music = await createMusic.execute({name, duration, genre, release_date, language});
            return response.status(201).json(music);
        }catch(err){
            next(err);
        }
    }

    public async update(request: Request, response: Response, next: NextFunction): Promise<Response | void>{
        try{
            const id = request.params.id as string;
            const {name, duration, genre, release_date, language} = request.body;
            const updateMusic = new UpdateMusicService();
            const music = await updateMusic.execute({id, name, duration, genre, release_date, language});
            return response.status(200).json(music);
        }catch(err){
            next(err);
        }
    }

    public async delete(request: Request, response: Response, next: NextFunction): Promise<Response | void>{
        try{
            const id = request.params.id as string;
            const deleteMusic = new DeleteMusicService();
            await deleteMusic.execute({id});
            return response.status(204).send();
        }catch(err){
            next(err);
        }
    }
}