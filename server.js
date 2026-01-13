require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
const { v4: uuidv4 } = require("uuid");

const app = express();

// ================== CONFIG ==================
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
const DB_FILE = path.join(__dirname, "links.json");

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== PUBLIC ASSETS (NO HTML) ==================
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/music", express.static(path.join(__dirname, "music")));

// Expose root CSS and JS explicitly
app.get("/style.css", (req, res) => {
  res.sendFile(path.join(__dirname, "style.css"));
});

app.get("/index.js", (req, res) => {
  res.sendFile(path.join(__dirname, "index.js"));
});

// ================== SESSION ==================
app.use(
  session({
    secret: "super-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
  })
);

// ================== DB HELPERS ==================
function loadDB() {
  if (!fs.existsSync(DB_FILE)) return {};
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ================== AUTH MIDDLEWARE ==================
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Unauthorized" });
}

// ================== ADMIN PAGES ==================

// Default → admin panel
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// Direct admin access
app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// ================== ADMIN LOGIN ==================
app.post("/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.sendStatus(200);
  }

  res.sendStatus(401);
});

// ================== CREATE LINK (ADMIN ONLY) ==================
app.post("/admin/create-link", requireAdmin, (req, res) => {
  const hours = Number(req.body.hours) || 24;

  const token = uuidv4().replace(/-/g, "");
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;

  const db = loadDB();
  db[token] = { expiresAt };
  saveDB(db);

  res.json({
    link: `${req.protocol}://${req.get("host")}/access/${token}`,
  });
});

// ================== ACCESS VIA TOKEN ==================
app.get("/access/:token", (req, res) => {
  const { token } = req.params;
  const db = loadDB();

  if (!db[token]) {
    return res.status(403).send("⛔ Invalid link");
  }

  if (Date.now() > db[token].expiresAt) {
    delete db[token];
    saveDB(db);
    return res.status(403).send("⛔ Link expired");
  }

  // Valid link → serve protected site
  res.sendFile(path.join(__dirname, "index.html"));
});

// ================== BLOCK DIRECT INDEX ==================
app.get("/index.html", (req, res) => {
  res.status(403).send("⛔ Direct access not allowed.");
});

// ================== START ==================
app.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});
