// dependencies
const cookieParser = require("cookie-parser");
const res = require("express/lib/response");
const bodyParser = require("body-parser");
const express = require("express");
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 8080; // default port 8080

// ??? what should I call this bit
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Database of all stored tinyURLs
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

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
function generateRandomString() {
  let randomString = "";
  const charSet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const setLength = charSet.length;
  for (let i = 0; i <= 6; i++) {
    randomString += charSet.charAt(Math.floor(Math.random() * setLength));
  }
  return randomString;
}

// GET requests
app.get("/", (req, res) => {
  const templateVars = {};

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: req.cookies["user_id"],
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: user,
  };

  res.render("login", templateVars);
});

app.get("/login_or_register", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user: user };
  res.render("login_or_register", templateVars);
});

app.get("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login_or_register");
    return;
  }
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]) {
    res.sendStatus(404);
    return;
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    user_id: req.cookies["user_id"],
    user: user,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }

  const shortURL = req.params.shortURL;
  const user = users[req.cookies["user_id"]];
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user_id: req.cookies["user_id"],
    user: user,
  };
  res.render("urls_show", templateVars);
});

// POST requests
app.post("/register", (req, res) => {
  const newUserID = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.sendStatus(400).send("Email and password fields cannot be empty");
    return;
  } else if (users.emailAlreadyExists(email)) {
    res.sendStatus(400).send("User with that email already exists");
    return;
  }

  //hash password
  const hash = bcrypt.hashSync(password, 10)
  users[newUserID] = {
    id: newUserID,
    email: email,
    password: hash,
  };

  console.log("Users databse: ", users);
  res.cookie("user_id", newUserID);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  // long URL from form
  const email = req.body.email;
  const password = req.body.password;
  const hash = users.returnPassword(email);
  //console.log("bcrypt.compareSync(password, hash): ", bcrypt.compareSync(password, hash))
  if (!users.emailAlreadyExists(email)) {
    res.sendStatus(403).send("No user with that email");
    return;
  } else if (!bcrypt.compareSync(password, hash)) {
    res.sendStatus(403).send("<p>Incorrect password</p>");
    return;
  }

  const user_id = users.userIdFromEmail(email);
  res.cookie("user_id", user_id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }

  const shortURL = req.params.shortURL;

  // long URL from form
  const longURL = req.body.longURL;

  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
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
    userID: req.cookies["user_id"],
  };
  res.redirect(`/urls/${shortURL}`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.redirect("/login");
    return;
  }
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
