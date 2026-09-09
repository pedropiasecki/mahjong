import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import RankingController from '../controllers/RankingController';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';

const rankingRouter = Router();
const controller = new RankingController();

rankingRouter.get(
	'/',
	isAuthenticated,
	celebrate({
		[Segments.QUERY]: {
			map: Joi.string().optional(),
			limit: Joi.number().integer().min(1).max(100).optional(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.index(req, res);
		} catch (err) {
			next(err);
		}
	},
);

rankingRouter.get(
	'/me',
	isAuthenticated,
	celebrate({
		[Segments.QUERY]: {
			map: Joi.string().optional(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.me(req, res);
		} catch (err) {
			next(err);
		}
	},
);

export default rankingRouter;