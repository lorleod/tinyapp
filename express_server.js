const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const express = require("express");
const res = require("express/lib/response");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get("/", (req, res) => {
  const templateVars = {
  //  username: req.cookies["username"]
  }

  res.render("/urls", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };

  res.render("urls_index", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  console.log("URL database", urlDatabase);
  //console.log("REQ.params.shortURL: " + req.params.shortURL);
  const shortURL = req.params.shortURL
  const longURL = urlDatabase[shortURL];
  console.log(longURL);
  res.redirect(longURL);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  }

  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  //console.log("req.params: ", req.params);
  const shortURL = req.params.shortURL;
  const templateVars = {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL],
    username: req.cookies["username"]
  };
  res.render("urls_show", templateVars);
});

app.post("/login", (req, res) => {
  // long URL from form
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // long URL from form
  const longURL = req.body.longURL;

  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  //console.log(req.body); // Log the POST request body to the console

  // long URL from form
  const longURL = req.body.longURL;
  // short URL from form random string function
  const shortURL = generateRandomString();

  // add short url and long url as a key value pair to database
  urlDatabase[shortURL] = longURL;
  //console.log("urldatabase short url: :", urlDatabase[shortURL]);
  res.redirect(`/urls/${shortURL}`);
  //res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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
