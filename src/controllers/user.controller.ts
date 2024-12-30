import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import "dotenv/config";
const authRoute = express.Router();
const SECRET= process.env.SECRET_KEY || "withthissacredtreasureisummon8handledkeysdivergentlocksdivinetokensmahoraga";
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function updateUser(req: Request, res: Response) {
    const { username, email, fullname, banner_pic, profile_pic, bio, password } = req.body;
    const { id } = req.params;

    // Assuming the current logged-in user is stored in req.user after authentication
    const currentUserId = (req as any).user?.id; // Adjust this to your actual session or token-based auth method

    if (!currentUserId || currentUserId !== Number(id)) {
        return res.status(403).json({ message: "You cannot edit another user's profile" });
    }

    try {
        const user = await prisma.users.findUnique({ where: { id: Number(id) } });

        if (!user) {
            return res.status(400).json({ message: "User not exist" });
        }

        const updatedData: any = {};
        if (username) updatedData.username = username;
        if (email) updatedData.email = email;
        if (fullname) updatedData.fullname = fullname;
        if (banner_pic) updatedData.banner_pic = banner_pic;
        if (profile_pic) updatedData.profile_pic = profile_pic;
        if (bio) updatedData.bio = bio;
        if (password) updatedData.password = password;

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
            data: updatedData
        });
        res.status(200).json({ message: "User updated" });
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