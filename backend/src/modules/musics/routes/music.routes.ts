import { Router } from "express";
import MusicController from "../controllers/MusicController";
import { celebrate, Joi, Segments } from "celebrate";

const musicRouter = Router();
const musicController = new MusicController();

musicRouter.get('/', async (req, res, next)=>{
    try {
        await musicController.index(req, res, next);
    } catch(err){
        next(err);
    }
});

musicRouter.get('/:id',
    celebrate({[Segments.PARAMS]:{
        id: Joi.string().uuid().required()
        }
    }),
    async (req, res, next)=>{
    try {
        await musicController.show(req, res, next);
    } catch(err){
        next(err);
    }
});

musicRouter.post('/',
    celebrate({[Segments.BODY]:{
        name: Joi.string().required(),
        duration: Joi.number().min(0).required(),
        genre: Joi.string().required(),
        release_date:  Joi.date().max('now').required(),
        language: Joi.string().required()
        },
    }),
    async (req, res, next)=>{
    try {
        await musicController.create(req, res, next);
    } catch(err){
        next(err);
    }
});

musicRouter.put('/:id',
    celebrate({[Segments.PARAMS]:{
        id: Joi.string().uuid().required()
        },
        [Segments.BODY]: {
            name: Joi.string().required(),
            duration: Joi.number().min(0).required(),
            genre: Joi.string().required(),
            release_date:  Joi.date().max('now').required(),
            language: Joi.string().required()
        },
    }),
    async (req, res, next)=>{
    try {
        await musicController.update(req, res, next);
    } catch(err){
        next(err);
    }
});

musicRouter.delete('/:id',
    celebrate({[Segments.PARAMS]:{
        id: Joi.string().uuid().required()
        },
    }),
    async (req, res, next)=>{
    try {
        await musicController.delete(req, res, next);
    } catch(err){
        next(err);
    }
});

export default musicRouter;
