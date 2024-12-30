import {PrismaClient} from '@prisma/client';
import {Request, Response} from "express";
const prisma = new PrismaClient();


export async function createThread (req: Request, res: Response) {
    const {content, authorId} = req.body;
    const user = (req as any).user;
    
    if(!content || !authorId){
        return res.status(400).json({message:"all fields are required"});
    }

    let imagePath: string|null = null;

    console.log(req.file);
    if(req.file){   
        imagePath = req.file.filename;
    }



    try{
        const data = {
            content,
            authorId: parseInt(authorId),
            image: imagePath
        }
        // console.log(data);
        const newThread = await prisma.thread.create({
            data: data
        });
        
        res.status(201).json({message: "Thread Created", thread: newThread});
    } catch(error){
        res.status(500).json({message: "Error creating thread", error});
    }  
};


export async function getThreadById(req: Request, res: Response) {
    const userId = (req as any).user?.id; // Assuming `req.user` contains the authenticated user's details
    const { threadId } = req.params; // Get threadId from request parameters

    try {
        const thread = await prisma.thread.findUnique({
            where: {
                id: parseInt(threadId), // Convert threadId to integer if it's passed as a string
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

        if (!thread) {
            return res.status(404).json({ message: "Thread not found" });
        }

        // Process thread data
        const likeCount = thread.likes.length;
        const isLikedByCurrentUser = thread.likes.some((like) => like.userId === userId);

        const formattedThread = {
            ...thread,
            likeCount,
            isLikedByCurrentUser,
        };

        res.status(200).json({ message: "Thread fetched successfully", thread: formattedThread });
    } catch (error) {
        console.error("Error fetching thread by ID:", error);
        res.status(500).json({ message: "Error fetching thread", error });
    }
}


export async function getAllThreads(req: Request, res: Response){
    const userId = (req as any).user?.id;
    try{
        const allThreads = await prisma.thread.findMany({
            where: {
                isDeleted: 0
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
                        user:{
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
            
            return {
                ...thread,
                likeCount,
                isLikedByCurrentUser,
                replies: thread.replies // replies are already included
            };
        });
        res.status(200).json({message: 'get all threads successful', thread: formattedThreads});
    } catch(error){
        res.status(500).json({message: "error fetching threads", error})
    }
    
}

export async function deleteThread(req: Request, res: Response) {
    const threadId = parseInt(req.params.id);
  
    try {
      const threadExist = await prisma.thread.findUnique({
        where: { id: threadId },
      });
  
      if (!threadExist) {
        return res.status(404).json({ message: 'Thread not found' });
      }
  
      if (threadExist.authorId !== (req as any).user.id) {
        return res
          .status(401)
          .json({ message: 'User not granted to delete this thread' });
      }
  
      if (threadExist.isDeleted === 1) {
        return res.status(400).json({ message: 'Thread is already deleted' });
      }
  
      //soft delete
      await prisma.thread.update({
        where: {
          id: threadId,
        },
        data: {
          isDeleted: 1,
        },
      });
  
      res.status(200).json({ message: 'thread deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting thread', error });
    }
}


