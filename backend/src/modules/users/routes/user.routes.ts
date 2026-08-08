import { Router } from "express";
import UsersController from "../controllers/UsersController";
import { celebrate, Joi, Segments } from "celebrate";
import isAuthenticated from "@shared/http/middlewares/isAuthenticated";
import multer from "multer";
import uploadConfig from "@config/upload"
import UsersAvatarController from "../controllers/UsersAvatarController";

const userRouter = Router();
const controller = new UsersController();
const usersAvatarController = new UsersAvatarController();
const upload = multer(uploadConfig)

userRouter.get('/', isAuthenticated, async (req, res, next) =>{
    try {
        await controller.index(req, res, next);
    } catch (err) {
        next(err);
    }
})

userRouter.post(
    '/',
    celebrate({
        [Segments.BODY]: {
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required(),
        }
    }),
    async (req, res, next) => {
        try {
            await controller.create(req, res, next);
        } catch (err) {
            next(err);
        }
    }
)

userRouter.patch(
    '/avatar',
    isAuthenticated,
    upload.single('avatar'),
    async (req, res, next) => {
        try {
            await usersAvatarController.update(req, res, next);
        } catch (err) {
            next (err);
        }
    }
)

export default userRouter;