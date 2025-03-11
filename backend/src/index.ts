import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

const TMP_DIR = path.join(__dirname, "../tmp");

// Ensure the tmp directory exists
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

app.post("/project", (req, res) => {
  const { replId, language } = req.body;

  if (!replId || !language) {
    return res.status(400).json({ error: "Missing replId or language" });
  }

  const projectPath = path.join(TMP_DIR, replId);

  try {
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    console.log(`Project created: ${replId} (${language})`);
    res.status(200).json({ message: "Project created" });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  try {
    // Dummy file structure for testing
    const rootContent = [
      { path: "/main.js", type: "file" },
      { path: "/src", type: "directory" },
    ];

    // Send 'loaded' event to the client
    socket.emit("loaded", { rootContent });

    socket.on("fetchDir", (dirPath, callback) => {
      const directoryPath = path.join(TMP_DIR, dirPath);
      try {
        if (fs.existsSync(directoryPath)) {
          const files = fs.readdirSync(directoryPath).map((file) => ({
            path: path.join(dirPath, file),
            type: fs.statSync(path.join(directoryPath, file)).isDirectory()
              ? "directory"
              : "file",
          }));
          callback(files);
        } else {
          callback([]);
        }
      } catch (error) {
        console.error(`Error fetching directory ${dirPath}:`, error);
        callback([]);
      }
    });

    socket.on("fetchContent", ({ path: filePath }, callback) => {
      const absolutePath = path.join(TMP_DIR, filePath);
      try {
        if (fs.existsSync(absolutePath)) {
          const content = fs.readFileSync(absolutePath, "utf-8");
          callback(content);
        } else {
          callback("");
        }
      } catch (error) {
        console.error(`Error fetching file ${filePath}:`, error);
        callback("");
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  } catch (error) {
    console.error("Error in socket connection:", error);
  }
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
