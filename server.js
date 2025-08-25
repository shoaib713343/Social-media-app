const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { authSocket, socketServer } = require("./socketServer");
const posts = require("./routes/posts");
const users = require("./routes/users");
const comments = require("./routes/comments");
const messages = require("./routes/messages");

// --- Basic Setup ---
dotenv.config();
const app = express();
const httpServer = require("http").createServer(app);
const PORT = process.env.PORT || 4000;

// --- Middleware Setup ---
app.use(express.json());
app.use(cors());

// --- API Routes ---
app.use("/api/posts", posts);
app.use("/api/users", users);
app.use("/api/comments", comments);
app.use("/api/messages", messages);

// --- Production Build Static Serve ---
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
  });
}

// --- Socket.IO Setup ---
const io = require("socket.io")(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://post-it-heroku.herokuapp.com"],
  },
});

io.use(authSocket);
io.on("connection", (socket) => socketServer(socket));


// --- Main Server Startup Function ---
const startServer = async function() {
  try {
    // 1. AWAIT the connection to MongoDB
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected successfully.");

    // 2. ONLY AFTER the database is connected, start the HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is listening on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error(error);
    process.exit(1); // Exit if we can't connect to the DB
  }
};

// --- Run the Server ---
startServer();