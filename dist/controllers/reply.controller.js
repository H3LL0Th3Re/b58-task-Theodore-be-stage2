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
exports.createReply = createReply;
exports.deleteReply = deleteReply;
const client_1 = require("@prisma/client");
const upload_controller_1 = require("./upload.controller");
const prisma = new client_1.PrismaClient();
function createReply(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { threadId, content } = req.body;
        const userId = req.user.id;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }
        let imagefile = "";
        try {
            if (req.file) {
                const uploadResult = yield (0, upload_controller_1.uploadToCloudinary)(req.file, "threads");
                imagefile = uploadResult.url; // Use the secure URL from Cloudinary
            }
            const reply = yield prisma.reply.create({
                data: {
                    threadId: Number(threadId),
                    userId: userId,
                    content,
                    replyImage: imagefile || "",
                }
            });
            res.status(201).json({ message: 'Reply created', reply });
        }
        catch (error) {
            res.status(500).json({ message: 'Error creating reply', error });
        }
    });
}
function deleteReply(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const replyId = parseInt(req.params.id);
        try {
            const reply = yield prisma.reply.findUnique({ where: { id: replyId } });
            if (!reply) {
                return res.status(404).json({ message: 'Reply not found' });
            }
            if (reply.userId !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized to delete this reply' });
            }
            yield prisma.reply.delete({ where: { id: replyId } });
            res.status(200).json({ message: 'Reply deleted' });
        }
        catch (error) {
            res.status(500).json({ message: 'Error deleting reply', error });
        }
    });
}
