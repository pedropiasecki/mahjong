import { Router } from "express";
import { celebrate, Joi, Segments } from "celebrate";
import AuthorController from "../controllers/AuthorController";

const authorRouter = Router();
const authorController = new AuthorController();

authorRouter.post('/',
    celebrate({
        [Segments.BODY]: {
            name: Joi.string().required(),
            artistic_name: Joi.string().required(),
            nationality: Joi.string().required(),
            birth_date: Joi.date().max('now').required(),
            about: Joi.string().optional()
        },
    }),
    async (req, res, next) => {
        try {
            await authorController.create(req, res, next);
        } catch(err) {
            next(err);
        }
    }
);

authorRouter.get('/', async (req, res, next) => {
    try {
        await authorController.list(req, res, next);
    } catch(err) {
        next(err);
    }
});

authorRouter.get('/:id',
    celebrate({
        [Segments.PARAMS]: {
            id: Joi.string().uuid().required()
        }
    }),
    async (req, res, next) => {
        try {
            await authorController.show(req, res, next);
        } catch(err) {
            next(err);
        }
    }
);

authorRouter.patch('/link-music',
    celebrate({
        [Segments.BODY]: {
            authorId: Joi.string().uuid().required(),
            musicId: Joi.string().uuid().required()
        }
    }),
    async (req, res, next) => {
        try {
            await authorController.linkMusic(req, res, next);
        } catch(err) {
            next(err);
        }
    }
);

export default authorRouter;