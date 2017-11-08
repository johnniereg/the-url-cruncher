const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;

const bodyParser = require("body-parser");

// Used to take form input and parse it into friendly strings.
app.use(bodyParser.urlencoded({extended: true}));

// Sets up EJS views.
app.set("view engine", "ejs");

// Make random strings for the crunched links.
function generateCrunchString() {
  let crunchString = "";
  const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i ++) {
    randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return crunchString;
}

// Object where we are storing URLs and their short codes.
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Index page with just a welcome message.
app.get("/", (req, res) => {
  res.end("Welcome to The Link Cruncher!");
});

// Where user goes to input new URLs to be crunched.
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// Page with all of our URLs.
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
  console.log(templateVars);
});

// Takes in submissions of new URLs.
app.post("/urls", (req, res) => {
  console.log(req.body); // Debug statement to see POST params.
  var crunch = generateCrunchString();
  urlDatabase[crunch] = req.body['longURL'];
  console.log(urlDatabase);
  res.redirect(`http://localhost:8080/urls/${crunch}`);
});

// Page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURLs: urlDatabase };
  res.render("urls_show", templateVars);
});

// Redirect to the the long URL
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (longURL === undefined) {
    res.end("Oops! Not a valid crunched link.");
  } else {
    res.redirect(longURL);
  }
});

// // Gives JSON of the URL Database
// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// // app.get test for page /hello
// app.get("/hello", (req, res) => {
//   res.end("<html><body>Hello <b>World</b></body></html>\n");
// });

// Turns on server and listens at specified PORT.
app.listen(PORT, () => {
  console.log(`The app cruncher is alive. Listening on port ${PORT}!`);
});



