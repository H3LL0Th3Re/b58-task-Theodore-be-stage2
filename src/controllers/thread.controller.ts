import {PrismaClient} from '@prisma/client';
import {Request, Response} from "express";
import { uploadToCloudinary } from './upload.controller';
const prisma = new PrismaClient();


export async function createThread(req: Request, res: Response) {
    const { content, authorId } = req.body;
  
    if (!content || !authorId) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    let imagePath = ""; // Default to an empty string
  
    try {
      // Upload the file to Cloudinary if it exists
      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file, "threads");
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
      const newThread = await prisma.thread.create({
        data: data,
      });
  
      res.status(201).json({ message: "Thread created successfully", thread: newThread });
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ message: "Error creating thread", error });
    }
};





export async function getThreadById(req: Request, res: Response) {
    const userId = (req as any).user?.id; // Assuming `req.user` contains the authenticated user's details
    const { threadId } = req.params; // Get threadId from request parameters

    // Validate threadId
    if (!threadId || isNaN(Number(threadId))) {
        return res.status(400).json({ message: "Invalid thread ID" });
    }

    try {
        const thread = await prisma.thread.findUnique({
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
                        replyImage:true,
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
            orderBy: {
                createdAt: 'desc',  // Sorting by the newest post (descending order)
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

export async function updateThread(req: Request, res: Response) {
    const threadId = parseInt(req.params.id);
    const { content } = req.body;

    try {
        // Check if the thread exists
        const existingThread = await prisma.thread.findUnique({
            where: { id: threadId },
        });

        if (!existingThread) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        // Check if the current user is the author of the thread
        if (existingThread.authorId !== (req as any).user.id) {
            return res.status(401).json({ message: 'Unauthorized to update this thread' });
        }

        let imagePath = existingThread.image; // Default to the current image

        // If a new file is provided, upload it to Cloudinary
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file, 'threads');
            imagePath = uploadResult.url;
        }

        // Update the thread with new content or image
        const updatedThread = await prisma.thread.update({
            where: { id: threadId },
            data: {
                content: content || existingThread.content, // Keep existing content if not updated
                image: imagePath, // Update the image if changed
                updatedAt: new Date(),
            },
        });

        res.status(200).json({ message: 'Thread updated successfully', thread: updatedThread });
    } catch (error) {
        console.error('Error updating thread:', error);
        res.status(500).json({ message: 'Error updating thread', error });
    }
}


export async function getThreadsByUser(req: Request, res: Response) {
    // console.log("hello");
    try {
        const userId = parseInt((req as any).user?.id, 10);
        // console.log("Attempting to fetch threads for user:", userId);

        if (isNaN(userId)) {
            console.error("Invalid user ID:", userId);
            return res.status(400).json({ message: "Invalid user ID" });
        }

        // console.log("Fetching threads for userId:", userId);

        const userThreads = await prisma.thread.findMany({
            where: {
                authorId: userId,
                isDeleted: 0,
            },
            orderBy: {
                createdAt: 'desc',  // Sorting by the newest post (descending order)
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
    } catch (error) {
        console.error("Error fetching threads:", error);
        res.status(500).json({ message: "Error fetching threads", error: error });
    }
}





