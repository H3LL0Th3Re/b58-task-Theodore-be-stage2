"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const user_controller_1 = require("../../controllers/user.controller");
const auth_midware_1 = require("../../middlewares/auth_midware");
const follow_controller_1 = require("../../controllers/follow.controller");
const upload_file_1 = require("../../middlewares/upload-file");
const user_app = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
user_app.use(express_1.default.json());
// GET current user
user_app.get('/', auth_midware_1.auth_mid, user_controller_1.getCurrentUser);
user_app.get('/search', user_controller_1.search);
// Replace user by ID
user_app.put('/:id', auth_midware_1.auth_mid, upload_file_1.upload.fields([
    { name: 'profile_pic', maxCount: 1 },
    { name: 'banner_pic', maxCount: 1 }
]), user_controller_1.updateUser);
// user_app.post('/follow', auth_mid, followUser);
// user_app.post('/unfollow', auth_mid,unfollowUser);
user_app.post('/toggle-follow', auth_midware_1.auth_mid, follow_controller_1.toggleFollowUser);
user_app.get('/:userId/followers', auth_midware_1.auth_mid, follow_controller_1.getFollowers);
user_app.get('/:userId/following', auth_midware_1.auth_mid, follow_controller_1.getFollowing);
user_app.get('/:userId/follow-counts', auth_midware_1.auth_mid, follow_controller_1.getFollowCounts);
user_app.get('/:userId/suggest-users', auth_midware_1.auth_mid, user_controller_1.getSuggestedUsers);
// DELETE user by ID
user_app.delete('/:id', auth_midware_1.auth_mid, user_controller_1.delete_user);
exports.default = user_app;
