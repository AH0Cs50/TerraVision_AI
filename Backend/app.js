import express from "express";
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
app.use("/api/v1/plants", plantsRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/plants", authenticate, plantCareRouter);

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
  } catch {
    console.log("failed to start app server");
    process.exit(1);
  }
}

appStart(); // start server app
