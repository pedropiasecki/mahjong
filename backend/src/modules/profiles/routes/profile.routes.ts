import { Router } from 'express';
import multer from 'multer';
import { celebrate, Joi, Segments } from 'celebrate';

import ProfileController from '../controllers/ProfileController';
import isAuthenticated from '@shared/http/middlewares/isAuthenticated';
import uploadConfig from '@config/upload';

const profileRouter = Router();
const controller = new ProfileController();
const upload = multer(uploadConfig);

profileRouter.get(
	'/me',
	isAuthenticated,
	async (req, res, next) => {
		try {
			await controller.show(req, res);
		} catch (err) {
			next(err);
		}
	},
);

profileRouter.put(
	'/me',
	isAuthenticated,
	celebrate({
		[Segments.BODY]: {
			display_name: Joi.string().min(2).optional(),
			avatar_url: Joi.string().uri().optional(),
			bio: Joi.string().max(280).allow('').optional(),
		},
	}),
	async (req, res, next) => {
		try {
			await controller.update(req, res);
		} catch (err) {
			next(err);
		}
	},
);

// multipart/form-data, campo "avatar" — ex.: FormData.append('avatar', file)
profileRouter.patch(
	'/me/avatar',
	isAuthenticated,
	upload.single('avatar'),
	async (req, res, next) => {
		try {
			await controller.updateAvatar(req, res);
		} catch (err) {
			next(err);
		}
	},
);

export default profileRouter;