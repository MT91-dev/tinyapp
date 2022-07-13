const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

//settings
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//generating a random unique short url id

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

//function to check if cookie with user_id exists
const validateCookie = (cookie_id) => {
  for (let user in users) {
    if (users[user].id === cookie_id) {
      return users[user];
    };
  };
  return undefined;
}

//function to check if user exists in user object with email entered
const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    };
  };
  return undefined;
}

//function to check if password is correct based on users object for user logging in
const validPassword = (password) => {
  for (const user in users) {
    if (users[user].password === password) {
      return true;
    };
  };
  return false;
}

//function to get all URLs by user_id
const getAllUrlsByUser = (cookie) => {
  let currentUserObject = {};
  let currentUser = cookie;
  for (const url in nestedURLDatabase) {
    if (nestedURLDatabase[url].userID === currentUser) {
      let key = url;
      let value = nestedURLDatabase[url]["longURL"];
      currentUserObject[key] = value;
    };
  };
  return currentUserObject;
}

//Users database object
const users = {
  example: {
    id: "b2xVn2",
    email: "example@example.com",
    password: "example",
  },
};

//URLs database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/", (req, res) => {
  let currentObject = getAllUrlsByUser(req.cookies["user_id"]);
  const templateVars = {
    urls: currentObject,
    user: validateCookie(req.cookies["user_id"])
  };
  res.render("urls_index", templateVars);
});

app.get("/urls", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  if (!loginState) {
    res.send("Please login to use TinyApp")
  } else {
    let currentObject = getAllUrlsByUser(req.cookies["user_id"]);
    const templateVars = {
      urls: currentObject,
      user: validateCookie(req.cookies["user_id"])
    };
    // console.log("templateVars", templateVars);
    res.render("urls_index", templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  if (!loginState) {
    res.redirect(`/login`);
  } else {
    const templateVars = {
      user: validateCookie(req.cookies["user_id"])
      // username: req.cookies["username"],
    };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  const currentUserObject = getAllUrlsByUser(req.cookies["user_id"]);
  if (!loginState){
    res.send("Please login to use TinyApp")
  } else if (currentUserObject[req.params.id] === undefined) {
    res.send("You do not have permissions to view or change this URL")
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: currentUserObject[req.params.id],
      user: validateCookie(req.cookies["user_id"])
    };
    res.render("urls_show", templateVars); //200 level status code
  }
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id
  res.redirect(urlDatabase[id]); //300 level status code
});

app.get("/register", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  if (loginState) {
    res.redirect(`/urls`);
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id],
      user: validateCookie(req.cookies["user_id"])
    };
    res.render("urls_registration", templateVars);
  }
});

app.get("/login", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  if (loginState) {
    res.redirect(`/urls`);
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id],
      user: validateCookie(req.cookies["user_id"])
    };
    res.render("urls_login", templateVars);
  }
});

//Post request logic that handles how to process the users input that is submittted
app.post("/urls", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  if (!loginState) {
    res.send("You are unable to shorten the URL because you are either not logged in or are not a registered user.");
  } else {
    const tempId = generateRandomString();
    urlDatabase[tempId] = req.body.longURL;
    // console.log(urlDatabase);
    // console.log(req.body); // Log the POST request body to the console
    // console.log(req.body.longURL); // Log the POST request body to the console
    // console.log(urlDatabase, "Did it work?");
    res.redirect(`/urls/${tempId}`); // Respond with 'Ok' (we will replace this)
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const loginState = validateCookie(req.cookies["user_id"]);
  const currentUserObject = getAllUrlsByUser(req.cookies["user_id"]);
  if (!loginState){
    res.send("Please login to use TinyApp")
  } else if (currentUserObject[req.params.id] === undefined) {
    res.send("You do not have permissions to view or change this URL")
  } else {
    delete urlDatabase[req.params.id];
    // const templateVars = { urls: urlDatabase }
    res.redirect(`/urls`);
    // res.render(("urls_index", templateVars)); // Respond with 'Ok' (we will replace this)
  }
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  // console.log(req.body.longURL);
  // console.log(urlDatabase);
  // const templateVars = { urls: urlDatabase }
  res.redirect(`/urls`);
  // res.render(("urls_index", templateVars)); // Respond with 'Ok' (we will replace this)
});


app.post("/login", (req, res) => {
  if (!getUserByEmail(req.body.email.trim())) {
    res.status(403).send("This user does not exist.")
  } else if (!validPassword(req.body.password)) {
    res.status(403).send("The password you have entered is incorrect.")
  } else {
    res.cookie("user_id", getUserByEmail(req.body.email).id);
    res.redirect(`/urls`);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls")
});

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  if (!req.body.email.trim() || !req.body.password.trim()) {
    res.status(400).send("Please enter a valid email and password.")
  } else if (getUserByEmail(req.body.email)) {
    res.status(400).send("Sorry, but that email already exists!")
  } else {
    res.cookie("user_id", userId);
    users[userId] = {
      id: userId,
      email: req.body.email,
      password: req.body.password,
    }
  };
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});