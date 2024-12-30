import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { delete_user, getAllUsers, getCurrentUser, updateUser } from '../../controllers/user.controller';
import { auth_mid } from '../../middlewares/auth_midware';
import { followUser, toggleFollowUser, unfollowUser } from '../../controllers/follow.controller';
const user_app = express.Router();
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
user_app.use(express.json());



// GET current user
user_app.get('/', auth_mid, getCurrentUser);

// Replace user by ID
user_app.put('/:id', auth_mid, updateUser);
// user_app.post('/follow', auth_mid, followUser);
// user_app.post('/unfollow', auth_mid,unfollowUser);
user_app.post('/toggle-follow', auth_mid, toggleFollowUser);
// user_app.get(':userId/suggest-users', auth_mid, getSuggestedUsers);
// DELETE user by ID
user_app.delete('/:id', auth_mid, delete_user);

export default user_app;
