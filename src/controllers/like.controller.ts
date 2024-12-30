import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export async function likeThread(req: Request, res: Response) {
    const { threadId } = req.body;
    const userId = (req as any).user.id;

    try {
        const like = await prisma.like.create({
            data: {
                threadId: Number(threadId),
                userId: userId
            }
        });
        res.status(201).json({ message: 'Successfully liked thread', like });
    } catch (error) {
        res.status(500).json({ message: 'Error liking thread', error });
    }
}

export async function unlikeThread(req: Request, res: Response) {
    const { threadId } = req.body;
    const userId = (req as any).user.id;

    try {
        await prisma.like.deleteMany({
            where: {
                threadId: Number(threadId),
                userId: userId
            }
        });
        res.status(200).json({ message: 'Successfully unliked thread' });
    } catch (error) {
        res.status(500).json({ message: 'Error unliking thread', error });
    }
}


export async function toggleLikeThread(req: Request, res: Response) {
    const { threadId } = req.body;
    const userId = (req as any).user.id;
  
    try {
      // Check if a like already exists
      const existingLike = await prisma.like.findFirst({
        where: {
          threadId: Number(threadId),
          userId: userId,
        },
      });
  
      if (existingLike) {
        // If the like exists, delete it (unlike)
        await prisma.like.delete({
          where: { id: existingLike.id },
        });
        res.status(200).json({ message: "Successfully unliked thread" });
      } else {
        // If the like doesn't exist, create it (like)
        const newLike = await prisma.like.create({
          data: {
            threadId: Number(threadId),
            userId: userId,
          },
        });
        res.status(201).json({ message: "Successfully liked thread", like: newLike });
      }
    } catch (error) {
      res.status(500).json({ message: "Error toggling like", error });
    }
}


