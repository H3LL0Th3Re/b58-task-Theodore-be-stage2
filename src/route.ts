// const express = require('express');
import express, {Request, Response} from 'express';
import 'dotenv/config';
import cors from 'cors';
import api_router from './routing/router.route';
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

app.use("/api", api_router);
app.get('/',(req: Request, res: Response) => {
    res.send("main page");
});



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});