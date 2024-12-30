import express from 'express';
import { createThread, deleteThread, getAllThreads, getThreadById } from '../../controllers/thread.controller';
import { auth_mid } from '../../middlewares/auth_midware';
import { upload } from '../../middlewares/upload-file';
import { likeThread, toggleLikeThread, unlikeThread } from '../../controllers/like.controller';
import { createReply, deleteReply } from '../../controllers/reply.controller';

const thread_app = express.Router();

thread_app.post('/', auth_mid, upload, createThread);
thread_app.get('/', auth_mid, getAllThreads);
thread_app.get("/:threadId", getThreadById);
thread_app.post('/like', auth_mid, toggleLikeThread);
thread_app.post('/reply', auth_mid, createReply);
thread_app.delete('/reply/:id', auth_mid, deleteReply);
thread_app.delete('/:id', auth_mid, deleteThread);

export default thread_app;