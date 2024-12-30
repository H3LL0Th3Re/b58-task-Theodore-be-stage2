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


// export const getSuggestedUsers = async (req: Request, res: Response) => {
//     const currentUserId = parseInt((req as any).user.id);
  
//     try {
//       const followersOfCurrentUser = await prisma.follower.findMany({
//         where: { followingId: currentUserId },
//         select: { followerId: true },
//       });
  
//       const usersFollowedByCurrentUser = await prisma.follower.findMany({
//         where: { followerId: currentUserId },
//         select: { followingId: true },
//       });
  
//       const followersIds = followersOfCurrentUser.map((f) => f.followerId);
//       const followingIds = usersFollowedByCurrentUser.map((f) => f.followingId);
  
//       const suggestedUsers = await prisma.users.findMany({
//         where: {
//           id: {
//             notIn: [currentUserId, ...followingIds],
//           },
//           isDeleted: false,
//         },
//       });
  
//       const sortedSuggestedUsers = suggestedUsers.sort((a, b) => {
//         const aFollowsCurrentUser = followersIds.includes(a.id);
//         const bFollowsCurrentUser = followersIds.includes(b.id);
  
//         if (aFollowsCurrentUser && !bFollowsCurrentUser) return -1;
//         if (!aFollowsCurrentUser && bFollowsCurrentUser) return 1;
//         return 0;
//       });
  
//       res.status(200).json(sortedSuggestedUsers);
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'Something went wrong' });
//     }
// };