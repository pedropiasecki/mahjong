import { Router } from "express";
import { celebrate, Joi, Segments } from "celebrate";
import isAuthenticated from "@shared/http/middlewares/isAuthenticated";
import PlaylistController from "../controller/PlaylistController";

const playlistRouter = Router();
const playlistController = new PlaylistController();

playlistRouter.use(isAuthenticated);

playlistRouter.post('/',
    celebrate({
        [Segments.BODY]: {
            title: Joi.string().required(),
            description: Joi.string().optional()
        },
    }),
    async (req, res, next) => {
        try {
            await playlistController.create(req, res, next);
        } catch(err) {
            next(err);
        }
    }
);

playlistRouter.patch('/:id/add-music',
    celebrate({
        [Segments.PARAMS]: {
            id: Joi.string().uuid().required()
        },
        [Segments.BODY]: {
            musicId: Joi.string().uuid().required()
        }
    }),
    async (req, res, next) => {
        try {
            await playlistController.addMusic(req, res, next);
        } catch(err) {
            next(err);
        }
    }
);

playlistRouter.get('/me',
    async (req, res, next) => {
        try {
            await playlistController.listMyPlaylists(req, res, next);
        } catch(err) {
            next(err);
        }
    }
);

export default playlistRouter;