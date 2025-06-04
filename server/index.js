const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("Error: MONGO_URI not defined in .env file");
  process.exit(1);
}

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Import routers
const productRouter = require("./routes/productRouter");
const requestRouter = require("./routes/requestRouter");
const authRouter = require("./routes/authRouter");

// Routes
app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

app.use(cookieParser());

app.use("/products", productRouter);
app.use("/request", requestRouter);
app.use("/auth", authRouter);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
