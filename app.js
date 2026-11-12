// This is just a test  //
const express = require("express");
const mysql = require("mysql");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(express.urlencoded({ extended: false }));

const database = mysql.createConnection({
  host: "localhost",
  user: "admin",
  password: "SuperSecretPassword123!", // Hard-coded credential
  database: "codeql_test"
});

// SQL injection
app.get("/user", (req, res) => {
  const id = req.query.id;

  const query = "SELECT * FROM users WHERE id = " + id;

  database.query(query, (error, results) => {
    if (error) {
      return res.status(500).send(error.message);
    }

    res.json(results);
  });
});

// Command injection
app.get("/ping", (req, res) => {
  const host = req.query.host;

  exec("ping -c 1 " + host, (error, stdout) => {
    if (error) {
      return res.status(500).send(error.message);
    }

    res.type("text").send(stdout);
  });
});

// Path traversal
app.get("/file", (req, res) => {
  const requestedFile = req.query.name;
  const filePath = path.join(__dirname, "files", requestedFile);

  fs.readFile(filePath, "utf8", (error, content) => {
    if (error) {
      return res.status(404).send("File not found");
    }

    res.send(content);
  });
});

// Reflected cross-site scripting
app.get("/hello", (req, res) => {
  const name = req.query.name;

  res.send("<h1>Hello " + name + "</h1>");
});

// Open redirect
app.get("/redirect", (req, res) => {
  const destination = req.query.url;

  res.redirect(destination);
});

// Server-side request forgery
app.get("/fetch", async (req, res) => {
  const targetUrl = req.query.url;

  try {
    const response = await axios.get(targetUrl);
    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Weak password hashing
app.get("/hash", (req, res) => {
  const password = req.query.password;

  const hash = crypto
    .createHash("md5")
    .update(password)
    .digest("hex");

  res.send(hash);
});

// Information exposure through error messages
app.get("/error", (req, res) => {
  try {
    throw new Error("Database password: SuperSecretPassword123!");
  } catch (error) {
    res.status(500).send(error.stack);
  }
});

app.listen(3000, "127.0.0.1", () => {
  console.log("Intentionally vulnerable test application running locally.");
});
