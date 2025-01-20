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
exports.register = register;
exports.login = login;
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const authRoute = express_1.default.Router();
const SECRET = process.env.SECRET_KEY || "withthissacredtreasureisummon8handledkeysdivergentlocksdivinetokensmahoraga";
const prisma = new client_1.PrismaClient();
const SALT_ROUNDS = 10;
function register(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, email, password, fullname } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "all fields are required" });
        }
        try {
            const existingUser = yield prisma.users.findFirst({
                where: {
                    OR: [
                        { username },
                        { email }
                    ]
                }
            });
            if (existingUser) {
                return res.status(400).json({ message: "username already taken" });
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, SALT_ROUNDS);
            const newUser = yield prisma.users.create({
                data: {
                    fullname: fullname || null,
                    username,
                    email,
                    password: hashedPassword
                }
            });
            res.status(201).json({ message: "User registered", user: newUser });
        }
        catch (error) {
            res.status(500).json({ message: "Error resgistering user", error });
        }
    });
}
;
function login(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: "All fields required" });
        }
        try {
            const user = yield prisma.users.findUnique({
                where: { username }
            });
            if (!user) {
                return res.status(400).json({ message: "user not found" });
            }
            const isMatch = yield bcrypt_1.default.compare(password, user.password);
            if (isMatch) {
                const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "24h" });
                res.status(200).json({ message: "login successful", user: {
                        username: user.username,
                        email: user.email,
                        token: token
                    }, token });
            }
            else {
                res.status(401).json({ message: "invalid credential" });
            }
        }
        catch (error) {
            res.status(500).json({ message: "Error login", error });
        }
    });
}
;
