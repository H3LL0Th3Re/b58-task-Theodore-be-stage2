import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import "dotenv/config";
import { uploadToCloudinary } from './upload.controller';
const authRoute = express.Router();
const SECRET= process.env.SECRET_KEY || "withthissacredtreasureisummon8handledkeysdivergentlocksdivinetokensmahoraga";
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function updateUser(req: Request, res: Response) {
  const { username, email, fullname, bio, password } = req.body;
  const { id } = req.params;
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const currentUserId = (req as any).user?.id;

  if (!currentUserId || currentUserId !== Number(id)) {
      return res.status(403).json({ message: "You cannot edit another user's profile" });
  }

  try {
      const user = await prisma.users.findUnique({ where: { id: Number(id) } });
      if (!user) {
          return res.status(400).json({ message: "User not exist" });
      }

      // Handle file uploads
      let profilePicUrl = user.profile_pic;
      let bannerPicUrl = user.banner_pic;

      if (files) {
          if (files.profile_pic) {
              const uploadResult = await uploadToCloudinary(files.profile_pic[0], "threads");
              profilePicUrl = uploadResult.url;
          }
          if (files.banner_pic) {
              const uploadResult = await uploadToCloudinary(files.banner_pic[0], "threads");
              bannerPicUrl = uploadResult.url;
          }
      }

      const data = {
          ...(username && { username }),
          ...(email && { email }),
          ...(fullname && { fullname }),
          ...(bio && { bio }),
          ...(password && { password }),
          profile_pic: profilePicUrl,
          banner_pic: bannerPicUrl
      };

      // Check for username/email conflicts
      if (username || email) {
          const exist_user = await prisma.users.findFirst({
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

      const update_user = await prisma.users.update({
          where: { id: Number(id) },
          data
      });
      
      res.status(200).json({ message: "User updated", user: update_user });
  } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Error updating user", error: error.message });
  }
}


export async function getAllUsers(req: Request, res: Response) {
    const allUsers = await prisma.users.findMany({
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
}


export async function getCurrentUser(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
    if (!token) {
        return res.status(401).json({ message: "Token is required" });
    }

    try {
        const decoded: any = jwt.verify(token, SECRET);
        const user = await prisma.users.findUnique({
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
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data", error });
    }
}



export async function delete_user(req: Request, res: Response) {
    // const userId = parseInt(req.params.id);
    // const userIndex = users.findIndex(u => u.id === userId);
    // if (userIndex === -1) {
    //     return res.status(404).json({ message: 'User not found' });
    // }
    // users.splice(userIndex, 1);
    // res.status(204).send();
};


export async function search(req:Request, res:Response) {
    const { query } = req.query;
  
    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "Search query is required" });
    }
  
    try {
      const users = await prisma.users.findMany({
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
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
};



export const getSuggestedUsers = async (req: Request, res: Response) => {
    const currentUserId = parseInt((req as any).user.id);
  
    try {
      const followersOfCurrentUser = await prisma.follower.findMany({
        where: { followingId: currentUserId },
        select: { followerId: true },
      });
  
      const usersFollowedByCurrentUser = await prisma.follower.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
  
      const followersIds = followersOfCurrentUser.map((f) => f.followerId);
      const followingIds = usersFollowedByCurrentUser.map((f) => f.followingId);
  
      const suggestedUsers = await prisma.users.findMany({
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
  
        if (aFollowsCurrentUser && !bFollowsCurrentUser) return -1;
        if (!aFollowsCurrentUser && bFollowsCurrentUser) return 1;
        return 0;
      });
  
      res.status(200).json(sortedSuggestedUsers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong' });
    }
};