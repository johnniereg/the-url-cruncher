const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Index with just a welcome message.
app.get("/", (request, response) => {
  response.end("Welcome to The Link Cruncher!");
});

// Page with all of our URLs
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

app.get("urls/new", (request, response) => {
  response.render("urls_new");
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