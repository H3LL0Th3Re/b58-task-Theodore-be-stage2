"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// const express = require('express');
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const router_route_1 = __importDefault(require("./routing/router.route"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/api", router_route_1.default);
app.get('/', (req, res) => {
    res.send("main page");
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
