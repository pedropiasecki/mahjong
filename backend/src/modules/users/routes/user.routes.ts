import { Router } from "express";
import { celebrate, Joi, Segments } from "celebrate";

import UserController from "../controllers/UserController";
import isAuthenticated from "@shared/http/middlewares/isAuthenticated";

const usersRouter = Router();

const userController = new UserController();

usersRouter.get(
	"",
	isAuthenticated,
	async (req, res, next) => {
		try {
			await userController.index(req, res);
		} catch (err) {
			next(err);
		}
	}
);

usersRouter.post(
	"/",
	celebrate({
		[Segments.BODY]: {
            name: Joi.string().min(2).required(),
			email: Joi.string().email().required(),
			password: Joi.string().min(6).required(),
		},
	}),
	async (req, res, next) => {
		try {
			await userController.create(req, res);
		} catch (err) {
			next(err);
		}
	}
);

export default usersRouter;