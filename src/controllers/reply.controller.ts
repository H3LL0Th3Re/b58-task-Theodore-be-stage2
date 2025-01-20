import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { uploadToCloudinary } from './upload.controller';
const prisma = new PrismaClient();

export async function createReply(req: Request, res: Response) {
    const { threadId, content} = req.body;
    const userId = (req as any).user.id;

    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    let imagefile = "";

    try {
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file, "threads");
            imagefile = uploadResult.url; // Use the secure URL from Cloudinary
        }
        const reply = await prisma.reply.create({
            data: {
                threadId: Number(threadId),
                userId: userId,
                content,
                replyImage: imagefile || "",  
            }
        });
        res.status(201).json({ message: 'Reply created', reply });
    } catch (error) {
        res.status(500).json({ message: 'Error creating reply', error });
    }
}

export async function deleteReply(req: Request, res: Response) {
    const replyId = parseInt(req.params.id);

    try {
        const reply = await prisma.reply.findUnique({ where: { id: replyId } });
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        if (reply.userId !== (req as any).user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this reply' });
        }

        await prisma.reply.delete({ where: { id: replyId } });
        res.status(200).json({ message: 'Reply deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting reply', error });
    }
}
