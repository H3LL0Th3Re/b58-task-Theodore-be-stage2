"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSuggestedUsers = void 0;
exports.updateUser = updateUser;
exports.getAllUsers = getAllUsers;
exports.getCurrentUser = getCurrentUser;
exports.delete_user = delete_user;
exports.search = search;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const upload_controller_1 = require("./upload.controller");
const authRoute = express_1.default.Router();
const SECRET = process.env.SECRET_KEY || "withthissacredtreasureisummon8handledkeysdivergentlocksdivinetokensmahoraga";
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
function updateUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { username, email, fullname, bio, password } = req.body;
        const { id } = req.params;
        const files = req.files;
        const currentUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!currentUserId || currentUserId !== Number(id)) {
            return res.status(403).json({ message: "You cannot edit another user's profile" });
        }
        try {
            const user = yield prisma.users.findUnique({ where: { id: Number(id) } });
            if (!user) {
                return res.status(400).json({ message: "User not exist" });
            }
            // Handle file uploads
            let profilePicUrl = user.profile_pic;
            let bannerPicUrl = user.banner_pic;
            if (files) {
                if (files.profile_pic) {
                    const uploadResult = yield (0, upload_controller_1.uploadToCloudinary)(files.profile_pic[0], "threads");
                    profilePicUrl = uploadResult.url;
                }
                if (files.banner_pic) {
                    const uploadResult = yield (0, upload_controller_1.uploadToCloudinary)(files.banner_pic[0], "threads");
                    bannerPicUrl = uploadResult.url;
                }
            }
            const data = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (username && { username })), (email && { email })), (fullname && { fullname })), (bio && { bio })), (password && { password })), { profile_pic: profilePicUrl, banner_pic: bannerPicUrl });
            // Check for username/email conflicts
            if (username || email) {
                const exist_user = yield prisma.users.findFirst({
                    where: {
                        OR: [
                            { username: username || undefined },
                            { email: email || undefined }
                        ],
                        NOT: { id: Number(id) },
                    }
                });
                if (exist_user) {
                    return res.status(400).json({ message: "Username or email already in use" });
                }
            }
            const update_user = yield prisma.users.update({
                where: { id: Number(id) },
                data
            });
            res.status(200).json({ message: "User updated", user: update_user });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ message: "Error updating user", error: error.message });
        }
    });
}
function getAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const allUsers = yield prisma.users.findMany({
            where: {
                isDeleted: 0
            },
            select: {
                username: true,
                fullname: true,
                followers: true,
                following: true
            }
        });
        res.json(allUsers);
    });
}
function getCurrentUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1]; // Expecting "Bearer <token>"
        if (!token) {
            return res.status(401).json({ message: "Token is required" });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, SECRET);
            const user = yield prisma.users.findUnique({
                where: { id: decoded.id },
                select: {
                    id: true,
                    username: true,
                    fullname: true,
                    email: true,
                    profile_pic: true,
                    banner_pic: true,
                    bio: true,
                    followers: true,
                    following: true,
                },
            });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            res.status(200).json(user);
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching user data", error });
        }
    });
}
function delete_user(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // const userId = parseInt(req.params.id);
        // const userIndex = users.findIndex(u => u.id === userId);
        // if (userIndex === -1) {
        //     return res.status(404).json({ message: 'User not found' });
        // }
        // users.splice(userIndex, 1);
        // res.status(204).send();
    });
}
;
function search(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { query } = req.query;
        if (typeof query !== "string" || !query.trim()) {
            return res.status(400).json({ error: "Search query is required" });
        }
        try {
            const users = yield prisma.users.findMany({
                where: {
                    OR: [
                        { username: { contains: query, mode: "insensitive" } },
                        { fullname: { contains: query, mode: "insensitive" } },
                    ],
                    isDeleted: 0,
                },
                select: {
                    id: true,
                    username: true,
                    fullname: true,
                    profile_pic: true,
                },
            });
            res.json(users);
        }
        catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Failed to fetch users" });
        }
    });
}
;
const getSuggestedUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const currentUserId = parseInt(req.user.id);
    try {
        const followersOfCurrentUser = yield prisma.follower.findMany({
            where: { followingId: currentUserId },
            select: { followerId: true },
        });
        const usersFollowedByCurrentUser = yield prisma.follower.findMany({
            where: { followerId: currentUserId },
            select: { followingId: true },
        });
        const followersIds = followersOfCurrentUser.map((f) => f.followerId);
        const followingIds = usersFollowedByCurrentUser.map((f) => f.followingId);
        const suggestedUsers = yield prisma.users.findMany({
            where: {
                id: {
                    notIn: [currentUserId, ...followingIds],
                },
                isDeleted: 0,
            },
        });
        const sortedSuggestedUsers = suggestedUsers.sort((a, b) => {
            const aFollowsCurrentUser = followersIds.includes(a.id);
            const bFollowsCurrentUser = followersIds.includes(b.id);
            if (aFollowsCurrentUser && !bFollowsCurrentUser)
                return -1;
            if (!aFollowsCurrentUser && bFollowsCurrentUser)
                return 1;
            return 0;
        });
        res.status(200).json(sortedSuggestedUsers);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
});
exports.getSuggestedUsers = getSuggestedUsers;
