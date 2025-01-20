import express, { Response, Request } from 'express';
import { createThread, deleteThread, getAllThreads, getThreadById, getThreadsByUser, updateThread } from '../../controllers/thread.controller';
import { auth_mid } from '../../middlewares/auth_midware';
import { upload } from '../../middlewares/upload-file';
import { getUserLikes, toggleLikeThread} from '../../controllers/like.controller';
import { createReply, deleteReply } from '../../controllers/reply.controller';

const thread_app = express.Router();

thread_app.post('/', auth_mid, upload.single('image'), createThread);
thread_app.put('/:id', auth_mid, upload.single('image'), updateThread);
thread_app.post('/reply', auth_mid, upload.single('image'),createReply);
thread_app.get('/', auth_mid, getAllThreads);
thread_app.get('/user-likes', auth_mid, getUserLikes);
thread_app.get('/thread-user', auth_mid, getThreadsByUser);
thread_app.get("/:threadId", getThreadById);
thread_app.post('/like', auth_mid, toggleLikeThread);
thread_app.delete('/reply/:id', auth_mid, deleteReply);
thread_app.delete('/:id', auth_mid, deleteThread);
export default thread_app;