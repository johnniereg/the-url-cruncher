const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

// Used to take form input and parse it into friendly strings.
app.use(bodyParser.urlencoded({extended: true}));

// Used to log server requests
app.use(morgan("dev"));

// Used to read the values from cookies
app.use(cookieParser());

// Sets up EJS views.
app.set("view engine", "ejs");


// Where we are storing URLs and their short codes.
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "12345"
  },
  "userRandomID2": {
    id: "userRandomID2",
    email: "user2@example.com",
    password: "23456"
  },
  "userRandomID3": {
    id: "userRandomID3",
    email: "user3@example.com",
    password: "34567"
  }
};

// Make random strings for the crunched links and user IDs.
function generateRandomString() {
  let randomString = "";
  const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 6; i ++) {
    randomString += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }
  return randomString;
}

// Checks our users database to see if the email address exists already.
function checkUserExistance(email) {
  let exists = false;
  for (let id in users) {
    if (users[id].email === email) {
      exists = true;
    }
  }
  return exists;
}

function checkPassword(email, password) {
  let passwordAccuracy = false;
    for (let id in users) {
      if (users[id].email === email) {
        if (users[id].password === password) {
          passwordAccuracy = true;
        }
      }
    }
  return passwordAccuracy;
}

function getUserID(email) {
  for (let id in users) {
    if (users[id].email === email) {
      return users[id].id;
    }
  }

}



// Routes

// Index page with just a welcome message.
app.get("/", (req, res) => {
  res.end("Welcome to The Link Cruncher!");
});

// Registration page.
app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  let userID = generateRandomString();
  // Check that user inputed an email and password.
  if (!req.body.email | !req.body.password) {
    res.status(400);
    res.send("Error. Must enter a valid email and password.");
  // Check that the email isn't already registered.
  } else if (checkUserExistance(req.body.email)) {
    res.status(400);
    res.send("Error. That email is already registered.");
  } else {
  console.log("Users before: ", users); // Debug --- Remove later.
  users[userID] = {
    "id": userID,
    "email": req.body.email,
    "password": req.body.password
  };
  console.log("Users after: ", users); // Debug --- Remove later.
  res.cookie("user_id", userID);
  res.redirect("/urls");
  }
});




app.get("/login", (req, res) => {
  res.render("login")
});

// Handle login and logout. Create or remove cookie.
app.post("/login", (req, res) => {
  console.log("Supplied email:", req.body.email);
  console.log("Supplied password:", req.body.password);
// Check that user inputed an email and password.
  if (!req.body.email | !req.body.password) {
    res.status(400);
    res.send("Error. Must enter a valid email and password.");
  } else if (!checkUserExistance(req.body.email)) {
    res.status(403);
    res.send("Error. That email is not registered.");
  } else if (checkPassword(req.body.email, req.body.password) == false) {
    res.status(403);
    res.send("Incorrect password entered.");
  } else {
    res.cookie("user_id", getUserID(req.body.email));
    res.redirect("/urls");
  }

});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id", req.cookies.user_id);
  res.redirect("/urls");
});


// Where user goes to input new URLs to be crunched.
app.get("/urls/new", (req, res) => {
  console.log(req.cookies.user_id);
  if (req.cookies.user_id === undefined) {
    res.redirect("/login");
  } else {
    let templateVars = { urls: urlDatabase, userinfo: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);
  }
});

// Page with all of our URLs.
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, userinfo: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

// Takes in submissions of new URLs.
app.post("/urls", (req, res) => {
  // console.log(req.body); // Debug statement to see POST params.
  let crunch = generateRandomString();
  urlDatabase[crunch] = req.body['longURL'];
  res.redirect(`http://localhost:8080/urls/${crunch}`);
});

// Deletes a URL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls"); // Sends user back to the URLs page after deletion.
});

// Page for displaying a single URL and its shortened form.
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURLs: urlDatabase, userinfo: users[req.cookies.user_id] };
  res.render("urls_show", templateVars);
});

// Update the long URL associated with a crunched URL
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls")
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



