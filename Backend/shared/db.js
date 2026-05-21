import mongoose from "mongoose";
import { MongoURI } from "../config/config.js";

const base = (MongoURI || "mongodb://127.0.0.1:27017").replace(/\/+$/, "");
const MONGO_URI = `${base}/terra_db`;

await mongoose.connect(MONGO_URI);
console.log("MongoDB connected");

export default mongoose;
