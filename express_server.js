const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

// Make random strings for the crunched links.
function generateRandomString() {
  let randomString = "";
  let possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i ++) {
    randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return randomString;
}

// Where we are storing URLs and their short codes.
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Index with just a welcome message.
app.get("/", (request, response) => {
  response.end("Welcome to The Link Cruncher!");
});

// Input new URLs to be crunched.
app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});

app.post("/urls", (request, response) => {
  console.log(request.body); // Debug statement to see POST params.
  var crunch = generateRandomString();
  urlDatabase[crunch] = request.body['longURL'];
  console.log(urlDatabase);
  response.redirect(`http://localhost:8080/urls/${crunch}`);
});

// Page with all of our URLs.
app.get("/urls", (request, response) => {
  let templateVars = { urls: urlDatabase };
  response.render("urls_index", templateVars);
  console.log(templateVars);
});

// Page for displaying a single URL and its shortened form.
app.get("/urls/:id", (request, response) => {
  let templateVars = { shortURL: request.params.id, longURLs: urlDatabase };
  response.render("urls_show", templateVars);
});

// Redirect to the the long URL
app.get("/u/:shortURL", (request, response) => {
  let longURL = urlDatabase[request.params.shortURL];
  if (longURL == undefined) {
    response.end("Oops! Not a valid crunched link.");
  } else {
    response.redirect(longURL);
  }
});

// Gives JSON of the URL Database
app.get("/urls.json", (request, response) => {
  response.json(urlDatabase);
});

// app.get test for page /hello
app.get("/hello", (request, response) => {
  response.end("<html><body>Hello <b>World</b></body></html>\n");
});

// Turns on server and listens at specified PORT.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});