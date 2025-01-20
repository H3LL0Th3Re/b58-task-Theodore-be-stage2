"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const api_router = express_1.default.Router();
const users_1 = __importDefault(require("../routing/router/users"));
const thread_1 = __importDefault(require("../routing/router/thread"));
const auth_1 = __importDefault(require("../routing/router/auth"));
api_router.use(express_1.default.json());
api_router.use('/users', users_1.default);
api_router.use('/thread', thread_1.default);
api_router.use("/auth", auth_1.default);
exports.default = api_router;
