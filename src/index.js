import "./config/env.js";

import { app } from "./app.js";
import connectDB from "./db/mongo.js";
import pool from "./db/postgres.js";

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Verify PostgreSQL Connection
        const pgClient = await pool.connect();
        pgClient.release();
        console.log("PostgreSQL Connection Verified");

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Server start failed", err);
        try {
            const fs = await import('fs');
            const util = await import('util');
            fs.writeFileSync('error_dump.txt', util.inspect(err));
        } catch (fileErr) {
            console.error("Failed to write error dump", fileErr);
        }
    }
};

startServer();

