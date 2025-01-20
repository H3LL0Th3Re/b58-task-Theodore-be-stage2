import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const prisma = new PrismaClient();

export async function followUser(req: Request, res: Response) {
    const { followingId } = req.body;
    const userId = (req as any).user.id;

    try {
        const follow = await prisma.follower.create({
            data: {
                followerId: userId,
                followingId: Number(followingId),
            }
        });
        res.status(201).json({ message: 'Successfully followed user', follow });
    } catch (error) {
        res.status(500).json({ message: 'Error following user', error });
    }
}

export async function unfollowUser(req: Request, res: Response) {
    const { followingId } = req.body;
    const userId = (req as any).user.id;

    try {
        await prisma.follower.deleteMany({
            where: {
                followerId: userId,
                followingId: Number(followingId)
            }
        });
        res.status(200).json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(500).json({ message: 'Error unfollowing user', error });
    }
}


export async function toggleFollowUser(req: Request, res: Response) {
    const { followingId } = req.body;
    const userId = (req as any).user.id;

    try {
        // Check if the follow relationship already exists
        const existingFollow = await prisma.follower.findFirst({
            where: {
                followerId: userId,
                followingId: Number(followingId),
            },
        });

        if (existingFollow) {
            // If the relationship exists, unfollow the user
            await prisma.follower.delete({
                where: { id: existingFollow.id },
            });
            res.status(200).json({ message: 'Successfully unfollowed user' });
        } else {
            // If the relationship doesn't exist, follow the user
            const follow = await prisma.follower.create({
                data: {
                    followerId: userId,
                    followingId: Number(followingId),
                },
            });
            res.status(201).json({ message: 'Successfully followed user', follow });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error toggling follow status', error });
    }
}


export const getFollowing = async (req: Request, res: Response) => {
    const { userId } = req.params;

    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
  
    try {
      const following = await prisma.follower.findMany({
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
    } catch (error) {
      console.error('Error fetching following:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  };
  
  export const getFollowers = async (req: Request, res: Response) => {
    const { userId } = req.params;
  
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
  
    try {
      const followers = await prisma.follower.findMany({
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
    } catch (error) {
      console.error('Error fetching followers:', error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  };


export const getFollowCounts = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const userIdInt = parseInt(userId);
  if (isNaN(userIdInt)) {
      return res.status(400).json({ error: 'Invalid userId' });
  }

  try {
      const [followersCount, followingCount] = await Promise.all([
          prisma.follower.count({ where: { followingId: userIdInt } }),
          prisma.follower.count({ where: { followerId: userIdInt } }),
      ]);

      return res.status(200).json({ followersCount, followingCount });
  } catch (error) {
      console.error('Error fetching follow counts:', error);
      return res.status(500).json({ error: 'Something went wrong' });
  }
};