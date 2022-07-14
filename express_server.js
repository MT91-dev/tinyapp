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

//requiring helper functions
const { generateRandomString, validateCookie, getUserByEmail, validPassword, getAllUrlsByUser } = require('./helpers');

app.get("/", (req, res) => {
  let currentObject = getAllUrlsByUser(req.session.user_id, nestedURLDatabase);
  const templateVars = {
    urls: currentObject,
    user: validateCookie(req.session.user_id, users)
  };
  res.render("urls_index", templateVars);
});

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
    // console.log("templateVars", templateVars);
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  if (!loginState) {
    res.redirect(`/login`);
  } else {
    const templateVars = {
      user: validateCookie(req.session.user_id, users)
      // username: req.cookies["username"],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const loginState = validateCookie(req.session.user_id, users);
  const currentUserObject = getAllUrlsByUser(req.session.user_id, nestedURLDatabase);
  // console.log(nestedURLDatabase);
  // console.log(currentUserObject);
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
    res.render("urls_show", templateVars); //200 level status code
  }
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(nestedURLDatabase[id]); //300 level status code
});

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

//Post request logic that handles how to process the users input that is submittted
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
    res.redirect(`/urls/${tempId}`); // Respond with 'Ok' (we will replace this)
  }
});

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

app.post("/urls/:id/update", (req, res) => {
  nestedURLDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect(`/urls`);
  // res.render(("urls_index", templateVars));
});

app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email.trim(), users)) {
    res.status(403).send("This user does not exist.");
  } else if (!bcrypt.compareSync(req.body.password, getUserByEmail(req.body.email.trim(), users).password)) {
    res.status(403).send("The password you have entered is incorrect.");
  } else {
    req.session.user_id = getUserByEmail(req.body.email, users).id;
    // res.cookie("user_id", getUserByEmail(req.body.email).id);
    res.redirect(`/urls`);
  }
  // console.log(users);
});

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie("user_id");
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  if (!req.body.email.trim() || !req.body.password.trim()) {
    res.status(400).send("Please enter a valid email and password.");
  } else if (getUserByEmail(req.body.email)) {
    res.status(400).send("Sorry, but that email already exists!");
  } else {
    req.session.user_id = userId;
    // res.cookie("user_id", userId);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: hashedPassword,
    };
  }
  // console.log(users);
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});