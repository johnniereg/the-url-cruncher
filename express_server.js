// The URL Cruncher
// An application to shorten URLs just like bit.ly

const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const methodOverride = require("method-override");

// Used to take form input and parse it into friendly strings.
app.use(bodyParser.urlencoded({extended: true}));

// Used to allow PUT/DELETE
app.use(methodOverride("_method"));

// Used to read the values from cookies
app.use(cookieSession({
  name: "session",
  keys: ["drone"]
}));

// Used to log server requests
app.use(morgan("dev"));

// Sets up EJS views.
app.set("view engine", "ejs");

// Object for storing URLs. Includes sample URLs for testing the program.
const urlDatabase = {
  "b2xVn2": { userID: "userRandomID",
              longURL: "http://www.lighthouselabs.ca",
              visits: 0,
              unique: [],
              stamps: []
            },
  "9sm5xK": { userID: "userRandomID2",
              longURL: "http://www.google.com",
              visits: 0,
              unique: [],
              stamps:[]
            }
};

// Object for storing users. Inclues sample users for testing the program.
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$3KOvugIouEimgBNlfIXJfeleboPrh/g7PoZc03q/pbIWMouemp.VS"
  },
  "userRandomID2": {
    id: "userRandomID2",
    email: "user2@example.com",
    password: "$2a$10$RQgNV4Y0RpmYkYR.JtnGiuNQxpQ0JMoQV5iWSODsUOc55SlvJUgOS"
  },
  "userRandomID3": {
    id: "userRandomID3",
    email: "user3@example.com",
    password: "$2a$10$E0aHoRpCtZwBTWHxGPLT5u6lOhXt8ySqn0uHcPKu/2uLSqJt1oJ/G"
  }
};

// Functions

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

// Verifies password accuracy.
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

// Gets corresponding user ID for login email.
function getUserID(email) {
  for (let id in users) {
    if (users[id].email === email) {
      return users[id].id;
    }
  }
}

// Gives new URL container holding just the given user ID's associated URLs.
function urlsForUser(id) {
  let userLinks = {};
  for (let entry in urlDatabase) {
    if (urlDatabase[entry].userID === id) {
      userLinks[entry] = urlDatabase[entry];
    }
  }
  return userLinks;
}

// Checks that a crunched link
function verifyCrunchedURL(crunchedURL) {
  let linkExistance = false;
  for (let link in urlDatabase) {
    if (link === crunchedURL) {
      linkExistance = true;
    }
  }
  return linkExistance;
}

// Checks that a users ID (and corresponding cookie) match a user in the database.
function verifyUserID(userID) {
  let verification = false;
  for (let user in users) {
    if (user === userID) {
      verification = true;
    }
  }
  return verification;
}

// Counts up total views to a crunched URL.
function countViews(crunchedURL) {
  let views = 0;
  for (let entry in urlDatabase) {
    if (entry === crunchedURL) {
      views = urlDatabase[entry].visits;
    }
  }
  return views;
}

// Checks if a visitor is a unique visitor to a crunched URL.
function isUniqueVisitor(visitorid, crunchedURL) {
  let unique = true;
  let visitors = urlDatabase[crunchedURL].unique;
  visitors.forEach(function(visitor) {
    if (visitor === visitorid) {
      unique = false;
    }
  });
  return unique;
}

// Makes unique timestamp for each visit.
function generateTimeStamp(userid) {
  let time = new Date();
  let dateString = time.toUTCString();
  let stamp = `${userid} visited on ${dateString}`;
  return stamp;
}

// Routes //

app.get("/", (req, res) => {
  // If not logged in, redirect to log in page.
  if (!verifyUserID(req.session.user_id)) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/register", (req, res) => {
  // If user is already logged in and registered, redirect to URLs page.
  if (verifyUserID(req.session.user_id)) {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

app.put("/register", (req, res) => {
  let userID = generateRandomString();
  // Check that user inputed an email and password.
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("<h3>Error. Must enter a valid email and password. <a href=\"/register\">Try again.</a></h3>");
  // Check that the email isn't already registered.
  } else if (checkUserExistance(req.body.email)) {
    res.status(400);
    res.send("<h3>Error. That email is already registered. <a href=\"/register\">Try again.</a></h3>");
  } else {
    users[userID] = {
      "id": userID,
      "email": req.body.email,
      "password": bcrypt.hashSync(req.body.password, 10)
    };
    req.session.user_id = userID;
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  // If user is already logged in, redirect to URLs page.
  if (verifyUserID(req.session.user_id)) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

app.post("/login", (req, res) => {
  // Check that user inputed an email and password.
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send("<h3>Error 400. Must enter a valid email and password. <a href=\"/login\">Try again.</a></h3>");
  } else if (!checkUserExistance(req.body.email)) {
    res.status(403);
    res.send("<h3>Error 403. That email is not registered. <a href=\"/login\">Try again.</a></h3>");
  // Checks that the user password matches, if false they are blocked.
  } else if (!bcrypt.compareSync(req.body.password, users[getUserID(req.body.email)].password)) {
    res.status(403);
    res.send("<h3>Error 403. Incorrect password entered. <a href=\"/login\">Try again.</a></h3>");
  // Sets cookie.
  } else {
    req.session.user_id = getUserID(req.body.email);
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {
  // Clears the cookie (aka logs out).
  req.session = null;
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => {
  if (!verifyUserID(req.session.user_id)) {
    res.redirect("/login");
  // Takes user to page to input new URLs.
  } else {
    let templateVars = { urlCollection: urlDatabase, userinfo: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls", (req, res) => {
  // Displays all of the users crunched URLs.
  if (verifyUserID(req.session.user_id)) {
    let templateVars = { urlCollection: urlsForUser(req.session.user_id), userinfo: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  } else {
    res.status(403);
    res.redirect("/login");
  }
});

app.put("/urls", (req, res) => {
  // Takes in submissions of new URLs.
  if (verifyUserID(req.session.user_id)) {
    let crunch = generateRandomString();
    urlDatabase[crunch] = { "userID": req.session.user_id,
                            "longURL": req.body.longURL,
                            "visits": 0,
                            "unique": [],
                            "stamps": []
                           };
    res.redirect(`http://localhost:8080/urls/${crunch}`);
  } else {
    res.status(403);
    res.send("<h3>Error 403. You need to be <a href=\"/login\">logged in</a>.</h3>");
  }
});

app.delete("/urls/:id", (req, res) => {
  if (!verifyUserID(req.session.user_id)) {
    res.status(403);
    res.send("<h3>Error 403. You need to be <a href=\"/login\">logged in</a>.</h3>");
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(403);
    res.send("<h3>Error 403. You do not have permission to delete this entry.</h3>");
  // Deletes the crunched URL entry.
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.get("/urls/:id", (req, res) => {
  if (!verifyCrunchedURL(req.params.id)) {
    res.status(404);
    res.send("<h3>Error 404. Not a valid crunched URL.</h3>");
  } else if (!verifyUserID(req.session.user_id)) {
    res.redirect("/login");
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(403);
    res.send("<h3>Error 403. This crunched URL does not belong to you.</h3>");
  // Page for displaying a single URL and its shortened form.
  } else {
    let templateVars = { shortURL: req.params.id,
                         urlCollection: urlDatabase,
                         userinfo: users[req.session.user_id],
                         visits: countViews(req.params.id),
                         unique: urlDatabase[req.params.id].unique.length,
                         stamps: urlDatabase[req.params.id].stamps
                       };
    res.render("urls_show", templateVars);
  }
});

app.post("/urls/:id", (req, res) => {
  if (!verifyUserID(req.session.user_id)) {
    res.status(403);
    res.send("<h3>Error 403. You need to be <a href=\"/login\">logged in</a>.</h3>");
  } else if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    res.status(403);
    res.send("<h3>Error 403. You do not have permission to edit this entry.</h3>");
  // Update the long URL associated with a crunched URL.
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (verifyCrunchedURL(req.params.shortURL)) {
    // Adds to total views counter.
    urlDatabase[req.params.shortURL].visits += 1;
    // Adds cookie to track unique visits.
    if (req.session.unique === undefined) {
      let uniqueVisitor = generateRandomString();
      req.session.unique = uniqueVisitor;
    }
    // Check that user is unique. Add them to unique visitors.
    if (isUniqueVisitor(req.session.unique, req.params.shortURL) === true) {
      urlDatabase[req.params.shortURL].unique.push(req.session.unique)
    }
    // Adds visit to time stamps.
    urlDatabase[req.params.shortURL].stamps.push( generateTimeStamp(req.session.unique));
    // Redirect to the the long URL.
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.status(404);
    res.end("<h3>Error 404. Not found. Not a valid crunched link.</h3>");
  }
});

// Turns on server and listens at specified PORT.
app.listen(PORT, () => {
  console.log(`The app cruncher is alive. Listening on port ${PORT}!`);
});



