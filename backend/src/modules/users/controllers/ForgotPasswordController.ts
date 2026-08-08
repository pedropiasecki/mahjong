import { NextFunction, Request, Response } from "express";
import SendForgotPasswordEmailService from "../services/SendForgotPasswordEmailService";

export default class ForgotPasswordController {
    public async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const { email } = req.body;
            const sendForgotPasswordEmail = new SendForgotPasswordEmailService();
            await sendForgotPasswordEmail.execute({ email });
            return res.status(204).json();
        } catch (err) {
            next(err);
        }
    }
}