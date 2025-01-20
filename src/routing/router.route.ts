import express, {Request, Response} from 'express';
import 'dotenv/config';
const api_router = express.Router();
import user_app from "../routing/router/users";
import thread_app from "../routing/router/thread";
import authRoute from "../routing/router/auth";
api_router.use(express.json());

api_router.use('/users', user_app);
api_router.use('/thread', thread_app);
api_router.use("/auth", authRoute);


export default api_router;



