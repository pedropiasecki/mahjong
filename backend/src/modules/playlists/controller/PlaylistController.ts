import { NextFunction, Request, Response } from "express";
import CreatePlaylistService from "../services/CreatePlaylistService";
import AddMusicToPlaylistService from "../services/AddMusicToPlaylistService";
import ListUserPlaylistsService from "../services/ListUserPlaylistsService";

export default class PlaylistController {
    public async create(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { title, description } = request.body;
            const userId = request.user.id;

            const createPlaylist = new CreatePlaylistService();
            const playlist = await createPlaylist.execute({ title, description, userId });

            return response.status(201).json(playlist);
        } catch(err) {
            next(err);
        }
    }

    public async addMusic(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const playlistId = request.params.id as string; 
            const { musicId } = request.body;
            const userId = request.user.id;

            const addMusic = new AddMusicToPlaylistService();
            const updatedPlaylist = await addMusic.execute({
                playlistId,
                musicId,
                userId
            });

            return response.status(200).json(updatedPlaylist);
        } catch(err) {
            next(err);
        }
    }

    public async listMyPlaylists(request: Request, response: Response, next: NextFunction): Promise<Response | void> {
        try {
            const userId = request.user.id;

            const listPlaylists = new ListUserPlaylistsService();
            const playlists = await listPlaylists.execute(userId);

            return response.status(200).json(playlists);
        } catch(err) {
            next(err);
        }
    }
}