import authConfig from "@config/auth";
import AppError from "@shared/errors/AppError";
import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";

interface ITokenPayload {
    iat: number; // quando foi criado
    exp: number; // quando vai expirar
    sub: string; // quem é o usuario
}

export default function isAuthenticated(
    request: Request, response: Response, next: NextFunction
): void {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
        throw new AppError("JWT token is missing.");
    }

    const [type, token] = authHeader.split(' ');
    try {
        const decodedToken = verify(token, authConfig.jwt.secret);

        const { sub } = decodedToken as ITokenPayload;
        request.user = { id: sub };

        return next();
    } catch {
        throw new AppError("Invalid JWT Token.");
    }
}