import express from 'express';
import { login, register } from '../../controllers/auth.controller';

const authRoute = express.Router();


// Create new user
authRoute.post('/register', register);
authRoute.post("/login", login);

export default authRoute;