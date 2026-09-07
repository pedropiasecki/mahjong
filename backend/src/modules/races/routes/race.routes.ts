import { Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import RaceController from '../controllers/RaceController';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';

const raceRouter = Router();
const controller = new RaceController();

raceRouter.post(
	'/',
	isAuthenticated,
	celebrate({
		[Segments.BODY]: {
			map_layout: Joi.string().required(),
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

raceRouter.get(
	'/',
	isAuthenticated,
	celebrate({
		[Segments.QUERY]: {
			status: Joi.string().valid('waiting', 'running', 'finished').optional(),
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

raceRouter.get(
	'/:id',
	isAuthenticated,
	celebrate({
		[Segments.PARAMS]: {
			id: Joi.string().uuid().required(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.show(req, res);
		} catch (err) {
			next(err);
		}
	},
);

raceRouter.post(
	'/:id/join',
	isAuthenticated,
	celebrate({
		[Segments.PARAMS]: {
			id: Joi.string().uuid().required(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.join(req, res);
		} catch (err) {
			next(err);
		}
	},
);

raceRouter.post(
	'/:id/start',
	isAuthenticated,
	celebrate({
		[Segments.PARAMS]: {
			id: Joi.string().uuid().required(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.start(req, res);
		} catch (err) {
			next(err);
		}
	},
);

raceRouter.post(
	'/:id/finish',
	isAuthenticated,
	celebrate({
		[Segments.PARAMS]: {
			id: Joi.string().uuid().required(),
		},
		[Segments.BODY]: {
			duration_seconds: Joi.number().integer().min(0).required(),
			moves_count: Joi.number().integer().min(0).required(),
			bonus_points: Joi.number().integer().min(0).optional(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.finish(req, res);
		} catch (err) {
			next(err);
		}
	},
);

export default raceRouter;