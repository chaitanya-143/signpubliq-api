import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173", // Common Vite port
    process.env.CORS_ORIGIN
];

import authRoutes from './routes/auth.routes.js';

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
);

app.use("/api/v1/auth", authRoutes);

app.get("/api/v1", (req, res) => {
    res.send("signPublicQ API is running....");
});

export { app };
