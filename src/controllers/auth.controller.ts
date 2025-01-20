import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import "dotenv/config";
const authRoute = express.Router();
const SECRET= process.env.SECRET_KEY || "withthissacredtreasureisummon8handledkeysdivergentlocksdivinetokensmahoraga";
const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export async function register (req: Request, res: Response) {
    const {username, email, password, fullname} = req.body ;
    if(!username || !email || !password){
        return res.status(400).json({message:"all fields are required"});
    }

    try{
        const existingUser = await prisma.users.findFirst({
            where: {
                OR:[
                    {username},
                    {email}
                ]
            }
        });
        if(existingUser){
            return res.status(400).json({message: "username already taken"});
        }
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
        
        const newUser = await prisma.users.create({
            data:{
                fullname: fullname || null,
                username,
                email,
                password: hashedPassword
            }
        });
        res.status(201).json({message: "User registered", user:newUser});
    } catch(error){
        res.status(500).json({message: "Error resgistering user", error});
    }  
};



export async function login (req: Request, res: Response) {
    const {username, password} = req.body;
    if(!username || !password){
        return res.status(400).json({message: "All fields required"})
    }
    try{
        const user = await prisma.users.findUnique({
            where: {username}
        })
        if(!user){
            return res.status(400).json({message: "user not found"})
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if(isMatch){
            const token = jwt.sign(
                {id: user.id, username: user.username}, SECRET, {expiresIn: "24h"}
            )
            res.status(200).json({message:"login successful" ,user: {
                username: user.username,
                email: user.email,
                token: token
            }, token})
        }
        else{
            res.status(401).json({message: "invalid credential"})
        }
    } catch(error){
        res.status(500).json({message: "Error login", error})
    }
};



