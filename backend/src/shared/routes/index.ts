import authorRouter from "@modules/authors/routes/author.routes";
import musicRouter from "@modules/musics/routes/music.routes";
import playlistRouter from "@modules/playlists/routes/playlist.routes";
import sessionsRouter from "@modules/sessions/routes/sessions.routes";
import profileRouter from "@modules/users/routes/profile.routes";
import userRouter from "@modules/users/routes/user.routes";
import { Router } from "express";
import response = require("express");

const routes = Router();
routes.use('/musics', musicRouter);
routes.use('/authors', authorRouter);
routes.use('/users', userRouter)
routes.use('/profile', profileRouter);
routes.use('/sessions', sessionsRouter);
routes.use('/playlists', playlistRouter)

routes.get('/', (request, response) => {
    response.json({message: 'Hello Dev!'});
    return;
})

export default routes;