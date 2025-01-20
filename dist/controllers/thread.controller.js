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
exports.createThread = createThread;
exports.getThreadById = getThreadById;
exports.getAllThreads = getAllThreads;
exports.deleteThread = deleteThread;
exports.updateThread = updateThread;
exports.getThreadsByUser = getThreadsByUser;
const client_1 = require("@prisma/client");
const upload_controller_1 = require("./upload.controller");
const prisma = new client_1.PrismaClient();
function createThread(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { content, authorId } = req.body;
        if (!content || !authorId) {
            return res.status(400).json({ message: "All fields are required" });
        }
        let imagePath = ""; // Default to an empty string
        try {
            // Upload the file to Cloudinary if it exists
            if (req.file) {
                const uploadResult = yield (0, upload_controller_1.uploadToCloudinary)(req.file, "threads");
                imagePath = uploadResult.url; // Use the secure URL from Cloudinary
            }
            console.log("the image path: ", imagePath);
            // Prepare data for database insertion
            const data = {
                content,
                authorId: parseInt(authorId),
                image: imagePath || "",
            };
            // Create the thread in the database
            const newThread = yield prisma.thread.create({
                data: data,
            });
            res.status(201).json({ message: "Thread created successfully", thread: newThread });
        }
        catch (error) {
            console.error("Error creating thread:", error);
            res.status(500).json({ message: "Error creating thread", error });
        }
    });
}
;
function getThreadById(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // Assuming `req.user` contains the authenticated user's details
        const { threadId } = req.params; // Get threadId from request parameters
        // Validate threadId
        if (!threadId || isNaN(Number(threadId))) {
            return res.status(400).json({ message: "Invalid thread ID" });
        }
        try {
            const thread = yield prisma.thread.findUnique({
                where: {
                    id: parseInt(threadId, 10), // Convert threadId to an integer
                },
                select: {
                    id: true,
                    authorId: true,
                    createdAt: true,
                    updatedAt: true,
                    content: true,
                    image: true,
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile_pic: true,
                            banner_pic: true,
                            followers: true,
                            following: true,
                            fullname: true,
                        },
                    },
                    likes: {
                        select: {
                            userId: true,
                        },
                    },
                    replies: {
                        select: {
                            id: true,
                            content: true,
                            replyImage: true,
                            createdAt: true,
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    profile_pic: true
                                },
                            },
                        },
                    },
                },
            });
            if (!thread) {
                return res.status(404).json({ message: "Thread not found" });
            }
            // Process thread data
            const likeCount = thread.likes.length;
            const isLikedByCurrentUser = thread.likes.some((like) => like.userId === userId);
            const formattedThread = Object.assign(Object.assign({}, thread), { likeCount,
                isLikedByCurrentUser });
            res.status(200).json({ message: "Thread fetched successfully", thread: formattedThread });
        }
        catch (error) {
            console.error("Error fetching thread by ID:", error);
            res.status(500).json({ message: "Error fetching thread", error });
        }
    });
}
function getAllThreads(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        try {
            const allThreads = yield prisma.thread.findMany({
                where: {
                    isDeleted: 0
                },
                orderBy: {
                    createdAt: 'desc', // Sorting by the newest post (descending order)
                },
                select: {
                    id: true,
                    authorId: true,
                    createdAt: true,
                    updatedAt: true,
                    content: true,
                    image: true,
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile_pic: true,
                            banner_pic: true,
                            followers: true,
                            following: true,
                            fullname: true
                        }
                    },
                    likes: {
                        select: {
                            userId: true
                        }
                    },
                    replies: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            user: {
                                select: {
                                    id: true,
                                    username: true
                                }
                            }
                        }
                    }
                }
            });
            const formattedThreads = allThreads.map(thread => {
                const likeCount = thread.likes.length;
                const isLikedByCurrentUser = thread.likes.some(like => like.userId === userId);
                return Object.assign(Object.assign({}, thread), { likeCount,
                    isLikedByCurrentUser, replies: thread.replies // replies are already included
                 });
            });
            res.status(200).json({ message: 'get all threads successful', thread: formattedThreads });
        }
        catch (error) {
            res.status(500).json({ message: "error fetching threads", error });
        }
    });
}
function deleteThread(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const threadId = parseInt(req.params.id);
        try {
            const threadExist = yield prisma.thread.findUnique({
                where: { id: threadId },
            });
            if (!threadExist) {
                return res.status(404).json({ message: 'Thread not found' });
            }
            if (threadExist.authorId !== req.user.id) {
                return res
                    .status(401)
                    .json({ message: 'User not granted to delete this thread' });
            }
            if (threadExist.isDeleted === 1) {
                return res.status(400).json({ message: 'Thread is already deleted' });
            }
            //soft delete
            yield prisma.thread.update({
                where: {
                    id: threadId,
                },
                data: {
                    isDeleted: 1,
                },
            });
            res.status(200).json({ message: 'thread deleted' });
        }
        catch (error) {
            res.status(500).json({ message: 'Error deleting thread', error });
        }
    });
}
function updateThread(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const threadId = parseInt(req.params.id);
        const { content } = req.body;
        try {
            // Check if the thread exists
            const existingThread = yield prisma.thread.findUnique({
                where: { id: threadId },
            });
            if (!existingThread) {
                return res.status(404).json({ message: 'Thread not found' });
            }
            // Check if the current user is the author of the thread
            if (existingThread.authorId !== req.user.id) {
                return res.status(401).json({ message: 'Unauthorized to update this thread' });
            }
            let imagePath = existingThread.image; // Default to the current image
            // If a new file is provided, upload it to Cloudinary
            if (req.file) {
                const uploadResult = yield (0, upload_controller_1.uploadToCloudinary)(req.file, 'threads');
                imagePath = uploadResult.url;
            }
            // Update the thread with new content or image
            const updatedThread = yield prisma.thread.update({
                where: { id: threadId },
                data: {
                    content: content || existingThread.content, // Keep existing content if not updated
                    image: imagePath, // Update the image if changed
                    updatedAt: new Date(),
                },
            });
            res.status(200).json({ message: 'Thread updated successfully', thread: updatedThread });
        }
        catch (error) {
            console.error('Error updating thread:', error);
            res.status(500).json({ message: 'Error updating thread', error });
        }
    });
}
function getThreadsByUser(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // console.log("hello");
        try {
            const userId = parseInt((_a = req.user) === null || _a === void 0 ? void 0 : _a.id, 10);
            // console.log("Attempting to fetch threads for user:", userId);
            if (isNaN(userId)) {
                console.error("Invalid user ID:", userId);
                return res.status(400).json({ message: "Invalid user ID" });
            }
            // console.log("Fetching threads for userId:", userId);
            const userThreads = yield prisma.thread.findMany({
                where: {
                    authorId: userId,
                    isDeleted: 0,
                },
                orderBy: {
                    createdAt: 'desc', // Sorting by the newest post (descending order)
                },
                select: {
                    id: true,
                    authorId: true,
                    createdAt: true,
                    updatedAt: true,
                    content: true,
                    image: true,
                    likes: {
                        select: {
                            userId: true,
                        },
                    },
                    author: {
                        select: {
                            id: true,
                            username: true,
                            profile_pic: true,
                            banner_pic: true,
                            followers: true,
                            following: true,
                            fullname: true
                        }
                    },
                    replies: {
                        select: {
                            id: true,
                            content: true,
                            createdAt: true,
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
            });
            console.log("Threads fetched successfully:", userThreads);
            res.status(200).json({ message: "Threads fetched", threads: userThreads });
        }
        catch (error) {
            console.error("Error fetching threads:", error);
            res.status(500).json({ message: "Error fetching threads", error: error });
        }
    });
}
