"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
require("dotenv/config");
cloudinary_1.v2.config({
    cloud_name: "dsvwuyzje",
    api_key: "677828616913324",
    api_secret: process.env.API_SECRET,
});
exports.default = cloudinary_1.v2;
