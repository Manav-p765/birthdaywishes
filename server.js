const express = require("express");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

const DB_FILE = "./links.json";

// Load DB
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

// Save DB
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// 🔑 Create new link
app.get("/create-link", (req, res) => {
  const token = uuidv4();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  const db = loadDB();
  db[token] = { expiresAt };
  saveDB(db);

  res.json({
    link: `${req.protocol}://${req.get("host")}/access/${token}`
  });
});

// 🔐 Protected access route
app.get("/access/:token", (req, res) => {
  const { token } = req.params;
  const db = loadDB();

  if (!db[token]) {
    return res.status(403).send("⛔ Invalid link");
  }

  if (Date.now() > db[token].expiresAt) {
    return res.status(403).send("⛔ Link expired");
  }

  res.sendFile(path.join(__dirname, "index.html"));
});

// ❌ Block direct access
app.get("/", (req, res) => {
  res.send("⛔ Access denied. Use your private link.");
});

// ✅ Serve static files LAST
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
