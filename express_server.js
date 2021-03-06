// dependencies
const bodyParser = require("body-parser");
const res = require("express/lib/response");
const cookieSession = require("cookie-session");
const express = require("express");
const bcrypt = require("bcryptjs");
const { getUserByEmail } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

// Middleware stuff
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "Session",
    keys: ["let", "there", "be keys"],
  })
);

// Database of all stored tinyURLs
const urlDatabase = {};

// Database of users
const users = {
  // check if a user with that email already exists and returns true/false
  emailAlreadyExists: function (email) {
    for (const user in this) {
      if (this[user].email === email) {
        return true;
      }
    }
    return false;
  },
  // returns the password associated with that email
  returnPassword: function (email) {
    for (const user in this) {
      if (this[user].email === email) {
        return this[user].password;
      }
    }
    return false;
  },
  // returns the user id associated with that email
  userIdFromEmail: function (email) {
    for (const user in this) {
      if (this[user].email === email) {
        return this[user].id;
      }
    }
  },
};

// Generate a random string
const generateRandomString = function () {
  let randomString = "";
  const charSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const setLength = charSet.length;
  for (let i = 0; i <= 6; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * setLength));
  }
  return randomString;
};

// GET requests
app.get("/", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
    return;
  }
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  if (req.session["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user: req.session["user_id"],
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];
  if (req.session["user_id"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {
    user_id: req.session["user_id"],
    user: user,
  };
  res.render("login", templateVars);
});

app.get("/login_or_register", (req, res) => {
  const user = users[req.session["user_id"]];
  const templateVars = { user: user };
  res.render("login_or_register", templateVars);
});

app.get("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login_or_register");
    return;
  }
  const user = users[req.session["user_id"]];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
    return;
  }
  const user = users[req.session["user_id"]];
  const templateVars = {
    user_id: req.session["user_id"],
    user: user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const user = users[req.session["user_id"]];

  if (!urlDatabase[shortURL]) {
    res.send("Unauthorized Access");
  } else if (req.session["user_id"] !== urlDatabase[shortURL].userID) {
    res.send("Unauthorized Access");
  }

  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user_id: req.session["user_id"],
    user: user,
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    res.send("<p>This TinyURL does not exist!</p>");
    return;
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// POST requests
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (users.emailAlreadyExists(email)) {
    res.send("User with that email already exists");
    return;
  } else if (email === "" || password === "") {
    res.send("Email and password fields cannot be empty");
    return;
  }

  //hash password
  const hash = bcrypt.hashSync(password, 10);
  users[newUserID] = {
    id: newUserID,
    email: email,
    password: hash,
  };

  req.session.user_id = newUserID;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  // long URL from form
  const email = req.body.email;
  const password = req.body.password;
  const hash = users.returnPassword(email);

  if (!users.emailAlreadyExists(email)) {
    res.send("<p>No user with that email</p>");
    return;
  } else if (!bcrypt.compareSync(password, hash)) {
    res.send("<p>Incorrect password</p>");
    return;
  }

  const user_id = users.userIdFromEmail(email);
  req.session.user_id = user_id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session["user_id"] !== urlDatabase[shortURL].userID) {
    res.send("Unauthorized Access");
  }

  // long URL from form
  const longURL = req.body.longURL;

  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    res.redirect("/login");
    return;
  }
  // long URL from form
  const longURL = req.body.longURL;
  // short URL from form random string function
  const shortURL = generateRandomString();

  // add short url and long url as a key value pair to database
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: req.session["user_id"],
  };
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session["user_id"] !== urlDatabase[shortURL].userID) {
    res.send("Unauthorized Access");
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
