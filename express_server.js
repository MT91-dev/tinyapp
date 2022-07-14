//Requiring libraries/frameworks
const express = require("express");
const cookieParser = require('cookie-parser');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');

//settings
const salt = bcrypt.genSaltSync(10);
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["cant touch this", "only if you are Neo from Matrix"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//Users database object which is updated when new user is created
const users = {
  example: {
    id: "b2xVn2",
    email: "example@example.com",
    password: "example",
  },
};

//URLs database //not used anymore since we have nested object for database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//Nested URL database with unique id's for keys that hold url information that are generated each time a user generates a new url
const nestedURLDatabase = {
  example: {
    userID: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca"
  },
  test: {
    userID: "9sm5xK",
    longURL: "http://www.google.com"
  },
};

//requiring helper functions from helpers.js
const { generateRandomString, validateCookie, getUserByEmail, validPassword, getAllUrlsByUser } = require('./helpers');

//GET request for home page that takes all urls by current user and passes it to urls_index as an object.
app.get("/", (req, res) => {
  let currentObject = getAllUrlsByUser(req.session.user_id, nestedURLDatabase);
  const templateVars = {
    urls: currentObject,
    user: validateCookie(req.session.user_id, users)
  };
  res.render("urls_index", templateVars);
});

//GET request for /urls page which checks if user is logged in via cookie session, send HTML message is user is not logged in, 
//otherwise displays URLs for user.
app.get("/urls", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  if (!loginState) {
    res.send("Please login to use TinyApp");
  } else {
    let currentObject = getAllUrlsByUser(req.session.user_id, nestedURLDatabase);
    const templateVars = {
      urls: currentObject,
      user: validateCookie(req.session.user_id, users)
    };
    res.render("urls_index", templateVars);
  }
});

//GET request for when user wants to make new url, first checks if user is logged in and redirects to login 
//page if user is not, otherwise renders to form in urls_new.ejs
app.get("/urls/new", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  if (!loginState) {
    res.redirect(`/login`);
  } else {
    const templateVars = {
      user: validateCookie(req.session.user_id, users)
    };
    res.render("urls_new", templateVars);
  }
});

//GET request for urls page at new ID; first checks if user is logged in, if they are, created object with 
//url id, url, and user id which is rendered to urls_show.ejs.
app.get("/urls/:id", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  const currentUserObject = getAllUrlsByUser(req.session.user_id, nestedURLDatabase);
  if (!loginState) {
    res.send("Please login to use TinyApp");
  } else if (currentUserObject[req.params.id] === undefined) {
    res.send("You do not have permissions to view or change this URL");
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: currentUserObject[req.params.id],
      user: validateCookie(req.session.user_id, users)
    };
    res.render("urls_show", templateVars);
  }
});

//GET request that redirects user to correct short url id
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(nestedURLDatabase[id]);
});

//GET request that checks if user is logged in via cookie session. If user is logged in, redirects to /urls 
//page, otherwise, creates new user object and renders to urls_registration.ejs.
app.get("/register", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  if (loginState) {
    res.redirect(`/urls`);
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: nestedURLDatabase[req.params.id],
      user: validateCookie(req.session.user_id, users)
    };
    res.render("urls_registration", templateVars);
  }
});

//GET request that checks if user is logged in via cookie session, if they are, redirects to /urls. 
//Otherwise, creates new user object and renders to urls_login.ejs.
app.get("/login", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  if (loginState) {
    res.redirect(`/urls`);
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: nestedURLDatabase[req.params.id],
      user: validateCookie(req.session.user_id, users)
    };
    res.render("urls_login", templateVars);
  }
});

//POST request logic that first checks if user is logged in, if they are not, sends appropriate HTML message.
//If they are, creates new entry in nestedURLDatabase with unique id and redirects to /urls page.
app.post("/urls", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  if (!loginState) {
    res.send("You are unable to shorten the URL because you are either not logged in or are not a registered user.");
  } else {
    const tempId = generateRandomString();
    nestedURLDatabase[tempId] = {
      userID: req.session.user_id,
      longURL: req.body.longURL,
    };
    res.redirect(`/urls/${tempId}`);
  }
});

//POST request that checks if user is logged in or owns the url the user is trying to delete. Sends appropriate HTML message if user 
//is not logged in or does not own the url. If user is logged in and owns the url, deletes the url from nestedURLDatabase and redirects to /urls page.
app.post("/urls/:id/delete", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  const currentUserObject = getAllUrlsByUser(req.session.user_id, nestedURLDatabase);
  if (!loginState) {
    res.send("Please login to use TinyApp");
  } else if (currentUserObject[req.params.id] === undefined) {
    res.send("You do not have permissions to view or change this URL");
  } else {
    delete nestedURLDatabase[req.params.id];
    res.redirect(`/urls`);
  }
});

//POST request that allows for user to update url by accessing the url object in the database, and replaces longURL with new URL entered by user, 
//after which redirects to /urls page.
app.post("/urls/:id/update", (req, res) => {
  nestedURLDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls`);
});

//POST request that checks if users inputted email exists and if the password entered belongs to that user. If either is false, sends appropriate HTML message. 
//If both are true, creates new cookie session and redirects to /urls page.
app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email.trim(), users)) {
    res.status(403).send("This user does not exist.");
  } else if (!bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email.trim(), users).password)) {
    res.status(403).send("The password you have entered is incorrect.");
  } else {
    req.session.user_id = getUserByEmail(req.body.email, users).id;
    res.redirect(`/urls`);
  }
});

//POST request for logout that deletes cookie session and redirects to /urls page.
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//POSt request for registration that first creates randomly generated userID using helper function. Then checks if user inputted valid email and password. 
//If either is false, sends appropriate HTML message. If both are true, creates a hashed password and generates new object entry in users and redirects to /urls page.
app.post("/register", (req, res) => {
  const userId = generateRandomString();
  if (!req.body.email.trim() || !req.body.password.trim()) {
    res.status(400).send("Please enter a valid email and password.");
  } else if (getUserByEmail(req.body.email)) {
    res.status(400).send("Sorry, but that email already exists!");
  } else {
    req.session.user_id = userId;
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: hashedPassword,
    };
  }
  res.redirect(`/urls`);
});

//Server is listening on port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});