"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinaryConfig_1 = __importDefault(require("../cloudinaryConfig"));
const uploadToCloudinary = (file, folder) => __awaiter(void 0, void 0, void 0, function* () {
    const base64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${base64}`;
    const cloudinaryResponse = yield cloudinaryConfig_1.default.uploader.upload(dataURI, {
        folder: folder,
    });
    //   console.log("folder: ", folder);
    return {
        url: cloudinaryResponse.secure_url,
        fileName: file.originalname,
    };
});
exports.uploadToCloudinary = uploadToCloudinary;
