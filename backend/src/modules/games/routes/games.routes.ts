import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import GameSessionController from '../controllers/GameSessionController';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';

const gameRouter = Router();
const controller = new GameSessionController();

gameRouter.get(
	'/',
	isAuthenticated,
	async (req, res, next) => {
		try {
			await controller.index(req, res);
		} catch (err) {
			next(err);
		}
	},
);

gameRouter.post(
	'/',
	isAuthenticated,
	celebrate({
		[Segments.BODY]: {
			mode: Joi.string().valid('singleplayer', 'multiplayer').required(),
			map_layout: Joi.string().optional(),
			tileset: Joi.string().optional(),
			duration_seconds: Joi.number().integer().min(0).required(),
			moves_count: Joi.number().integer().min(0).optional(),
			result: Joi.string().valid('won', 'abandoned').required(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.create(req, res);
		} catch (err) {
			next(err);
		}
	},
);

export default gameRouter;