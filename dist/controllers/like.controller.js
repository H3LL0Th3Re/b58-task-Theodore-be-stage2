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
exports.getUserLikes = getUserLikes;
exports.toggleLikeThread = toggleLikeThread;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function getUserLikes(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const userId = req.user.id;
        try {
            const likes = yield prisma.like.findMany({
                where: {
                    userId: userId,
                },
                select: {
                    threadId: true,
                },
            });
            res.status(200).json({ likes });
        }
        catch (error) {
            res.status(500).json({ message: "Error fetching user likes", error });
        }
    });
}
function toggleLikeThread(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { threadId } = req.body;
        const userId = req.user.id;
        try {
            // Check if a like already exists
            const existingLike = yield prisma.like.findFirst({
                where: {
                    threadId: Number(threadId),
                    userId: userId,
                },
            });
            if (existingLike) {
                // If the like exists, delete it (unlike)
                yield prisma.like.delete({
                    where: { id: existingLike.id },
                });
                res.status(200).json({ message: "Successfully unliked thread" });
            }
            else {
                // If the like doesn't exist, create it (like)
                const newLike = yield prisma.like.create({
                    data: {
                        threadId: Number(threadId),
                        userId: userId,
                    },
                });
                res.status(201).json({ message: "Successfully liked thread", like: newLike });
            }
        }
        catch (error) {
            res.status(500).json({ message: "Error toggling like", error });
        }
    });
}
