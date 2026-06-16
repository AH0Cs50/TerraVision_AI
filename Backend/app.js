import express from "express";
import morgan from "morgan";
//routes
import authRouter from "./routes/auth.route.js";
import plantsRouter from "./routes/plant.route.js";
import userRouter from "./routes/user.route.js";
import plantCareRouter from "./routes/plant-care.route.js";
import dashboardRouter from "./routes/dashboard.route.js";
//middlewares
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import mongoose from "./shared/db.js";

const app = express();
// APP CONSTRUCTION
app.get("/", (req, res) => {
  res.send("Server is running");
});

//global middleware
app.use(express.json());
app.use(morgan(":method :url :status :response-time ms"));

//routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/plants", plantsRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/plants", authenticate, plantCareRouter);
app.use("/api/v1/dashboard", authenticate, dashboardRouter);

// error middleware
app.use(errorHandler);

const port = process.env.PORT || 3000;

function appStart() {
  try {
    //some micro-service test check before run server
    const server = app.listen(port, "0.0.0.0", () => {
      const addr = server.address();
      console.log("SERVER STARTED ON PORT:", addr ? addr.port : port);
    });

    process.on("SIGTERM", () => gracefulShutdown(server));
    process.on("SIGINT", () => gracefulShutdown(server));
  } catch {
    console.log("failed to start app server");
    process.exit(1);
  }
}

async function gracefulShutdown(server) {
  console.log("Shutting down gracefully...");
  server.close(async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
}

appStart(); // start server app
