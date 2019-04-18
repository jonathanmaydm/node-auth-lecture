require("dotenv").config();
const express = require("express");
const app = express();
const massive = require("massive");
const bcrypt = require("bcryptjs");
const session = require("express-session");

massive(process.env.CONNECTION_STRING).then(db => {
  app.set("db", db);
  console.log("Database connected");
  // only create the table if massive doesn't see the table already existing
  if (!db.auth_user) {
    db.initialSetup().then(result => console.log("Table created"));
  }
});

// create our session so we can hold the user's information across requests
app.use(
  session({ secret: "househunters", resave: false, saveUninitialized: true })
);

app.use(express.json());

app.get("/auth/me", (req, res) => {
  // so we can check the currently logged in user's information
  res.json(req.session.user);
});

// NEW STYLE ASYNC/AWAIT VERSION
app.post("/auth/login", async (req, res) => {
  // Login

  // First, let's check to see if the username exists in the database
  const result = await req.app
    .get("db")
    .getUser(req.body.username)
    .catch(error => {
      // if we get an error, log it and send a generic error to the front end
      console.log(error);
      res.status(500).json("An unknown error occurred.");
    });
  // massive always returns an array.
  if (result.length > 0) {
    // if there is a user in the array,
    // we need check the plain text password with the hashed password from the db
    const isMatch = await bcrypt.compare(req.body.password, result[0].password);

    //if they are the same, add the user to the session and send a response
    if (isMatch) {
      req.session.user = result[0].username;
      res.json(result[0].username);
    } else {
      // if they are different, let the user know
      res.status(403).json("Incorrect username or password");
    }
  } else {
    // if there's no user returned in the array, let the front end know.
    res.status(403).json("Incorrect username or password");
  }
});

// OLD STYLE .THEN PROMISES
// app.post("/auth/login", (req, res) => {
//   req.app.get("db").getUser(req.body.username)
//   .then(result => {
//     if (result.length > 0){
//       bcrypt.compare(req.body.password, result[0].password)
//       .then(isMatch => {
//         if (isMatch){
//           req.session.user = result[0].username;
//           res.json(result[0].username);
//         } else {
//           res.status(403).json("Incorrect username or password")
//         }
//       })
//     } else {
//       res.status(403).json("Incorrect username or password")
//     }
//   })
// })

app.post("/auth/signup", async (req, res) => {
  // Signup
  const { username, password } = req.body;
  //   bcrypt.hash(password, 10).then(hash => {
  //       /// do things
  //   })
  const hash = await bcrypt.hash(password, 10).catch(err => console.log(err));
  const dbResult = await req.app
    .get("db")
    .addUser([username, hash])
    .catch(err => {
      console.log(err);
      res.status(403).json("Username already exists");
    });
  req.session.user = username;
  res.json(dbResult);
});

app.post("/auth/logout", (req, res) => {
  // Logout
  req.session.destroy();
  res.json("Successfully logged out");
});

app.listen(5050, () => console.log("Listening on 5050"));
