import express from "express";
import { PORT } from "./config/config.js";
//routes
import authRouter from "./routes/auth.route.js";
import plantsRouter from "./routes/plant.route.js";
import userRouter from "./routes/user.route.js";
import plantCareRouter from "./routes/plant-care.route.js";
//middlewares
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();
// APP CONSTRUCTION
app.get("/", (req, res) => {
  res.send("Server is running");
});

//global middleware
app.use(express.json());

//routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/plants", authenticate, plantsRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/plants", authenticate, plantCareRouter);

// error middleware
app.use(errorHandler);

const port = PORT || 3000;

function appStart() {
  try {
    //some micoreserive test check before run server

    app.listen(port, () => {
      console.log(`server app runs at port ${port}`);
    });
  } catch {
    console.log("failed to start app server");
    process.exit(1);
  }
}

appStart(); // start server app
