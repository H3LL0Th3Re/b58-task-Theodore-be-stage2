import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
cloudinary.config({
  cloud_name: "dsvwuyzje", 
  api_key: "677828616913324", 
  api_secret: process.env.API_SECRET, 
});

export default cloudinary;