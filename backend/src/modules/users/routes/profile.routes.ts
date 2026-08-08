import { Router } from "express";
import ProfileController from "../controllers/ProfileController";
import isAuthenticated from "@shared/http/middlewares/isAuthenticated";
import { celebrate, Joi, Segments } from "celebrate";

const profileRouter = Router();
const profileController = new ProfileController();
profileRouter.use(isAuthenticated);

profileRouter.get("/", async(req, res, next) => {
    try {
        profileController.show(req, res, next);
    } catch (err) {
        next(err)
    }
});

profileRouter.put(
    "/",
    celebrate({
        [Segments.BODY]: {
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().optional(),
            old_password: Joi.string().optional(),
            password_confirmation: Joi.string().valid(Joi.ref("password")).when("password", { is: Joi.exist(), then: Joi.required()})
        }
    }),
    async (req, res, next) => {
        try {
            profileController.update(req, res, next);
        } catch (err) {
            next(err);
        }
    }
)

export default profileRouter;