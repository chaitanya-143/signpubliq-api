import mongoose from "mongoose";

const ALLOWED_ENVS = ["development", "production"];

const connectDB = async () => {
  try {
    const env = process.env.NODE_ENV || "development";

    if (!ALLOWED_ENVS.includes(env)) {
      throw new Error(`NODE_ENV "${env}" not supported. Allowed values: ${ALLOWED_ENVS.join(", ")}`);
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set in environment variables");
    }

    const dbName = env === "production" ? process.env.MONGODB_DB_PROD : process.env.MONGODB_DB_DEV;

    if (!dbName) {
      throw new Error(`Database name for environment ${env} is not set`);
    }

    let uri = process.env.MONGODB_URI;
    if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
      uri = `mongodb://${uri}`;
    }

    const connectionInstance = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: dbName,
    });

    console.log(`\nMongoDB connected. Host: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`);

  } catch (error) {
    console.error("MONGODB connection FAILED:", error);
    process.exit(1);
  }
};

export default connectDB;
