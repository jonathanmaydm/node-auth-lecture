require("dotenv").config();
const express = require("express");
const app = express();
const massive = require("massive");

massive(process.env.CONNECTION_STRING).then(db => {
  app.set("db", db);
  console.log("Database connected");
  if (!db.auth_user) {
    db.initialSetup().then(result => console.log("Table created"));
  }
});

app.use(express.json());

app.post("/auth/login", (req, res) => {
  // Login
});

app.post("/auth/signup", (req, res) => {
  // Signup
});

app.post("/auth/logout", (req, res) => {
  // Logout
});

app.listen(5050, () => console.log("Listening on 5050"));
