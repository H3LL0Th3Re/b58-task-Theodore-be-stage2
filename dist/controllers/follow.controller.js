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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFollowCounts = exports.getFollowers = exports.getFollowing = void 0;
exports.followUser = followUser;
exports.unfollowUser = unfollowUser;
exports.toggleFollowUser = toggleFollowUser;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function followUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { followingId } = req.body;
        const userId = req.user.id;
        try {
            const follow = yield prisma.follower.create({
                data: {
                    followerId: userId,
                    followingId: Number(followingId),
                }
            });
            res.status(201).json({ message: 'Successfully followed user', follow });
        }
        catch (error) {
            res.status(500).json({ message: 'Error following user', error });
        }
    });
}
function unfollowUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { followingId } = req.body;
        const userId = req.user.id;
        try {
            yield prisma.follower.deleteMany({
                where: {
                    followerId: userId,
                    followingId: Number(followingId)
                }
            });
            res.status(200).json({ message: 'Successfully unfollowed user' });
        }
        catch (error) {
            res.status(500).json({ message: 'Error unfollowing user', error });
        }
    });
}
function toggleFollowUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { followingId } = req.body;
        const userId = req.user.id;
        try {
            // Check if the follow relationship already exists
            const existingFollow = yield prisma.follower.findFirst({
                where: {
                    followerId: userId,
                    followingId: Number(followingId),
                },
            });
            if (existingFollow) {
                // If the relationship exists, unfollow the user
                yield prisma.follower.delete({
                    where: { id: existingFollow.id },
                });
                res.status(200).json({ message: 'Successfully unfollowed user' });
            }
            else {
                // If the relationship doesn't exist, follow the user
                const follow = yield prisma.follower.create({
                    data: {
                        followerId: userId,
                        followingId: Number(followingId),
                    },
                });
                res.status(201).json({ message: 'Successfully followed user', follow });
            }
        }
        catch (error) {
            res.status(500).json({ message: 'Error toggling follow status', error });
        }
    });
}
const getFollowing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ error: 'Invalid userId' });
    }
    try {
        const following = yield prisma.follower.findMany({
            where: { followerId: userIdInt },
            include: {
                following: true,
            },
        });
        if (following.length === 0) {
            return res.status(200).json([]);
        }
        const followingData = following.map((f) => f.following);
        return res.status(200).json(followingData);
    }
    catch (error) {
        console.error('Error fetching following:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});
exports.getFollowing = getFollowing;
const getFollowers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ error: 'Invalid userId' });
    }
    try {
        const followers = yield prisma.follower.findMany({
            where: { followingId: userIdInt },
            include: {
                follower: true,
            },
        });
        if (followers.length === 0) {
            return res.status(200).json([]);
        }
        const followersData = followers.map((f) => f.follower);
        return res.status(200).json(followersData);
    }
    catch (error) {
        console.error('Error fetching followers:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});
exports.getFollowers = getFollowers;
const getFollowCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        return res.status(400).json({ error: 'Invalid userId' });
    }
    try {
        const [followersCount, followingCount] = yield Promise.all([
            prisma.follower.count({ where: { followingId: userIdInt } }),
            prisma.follower.count({ where: { followerId: userIdInt } }),
        ]);
        return res.status(200).json({ followersCount, followingCount });
    }
    catch (error) {
        console.error('Error fetching follow counts:', error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});
exports.getFollowCounts = getFollowCounts;
