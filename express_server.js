const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

//setting the view engine as ejs
app.set("view engine", "ejs");

//generating a random unique short url id

function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/urls", (req, res) => {
//   const templateVars = { urls: urlDatabase };
//   res.render("urls_index", templateVars);
// });

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"],
    // ... any other vars
  };
  console.log("templateVars", templateVars);
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id
  const templateVars = { id, longURL: urlDatabase[id] };
  res.render("urls_show", templateVars); //200 level status code
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id
  res.redirect(urlDatabase[id]); //300 level status code
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//Post request logic that handles how to process the users input that is submittted
app.post("/urls", (req, res) => {
  const tempId = generateRandomString();
  urlDatabase[tempId] = req.body.longURL;
  // console.log(urlDatabase);
  // console.log(req.body); // Log the POST request body to the console
  // console.log(req.body.longURL); // Log the POST request body to the console
  // console.log(urlDatabase, "Did it work?");
  res.redirect(`/urls/${tempId}`); // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  // const templateVars = { urls: urlDatabase }
  res.redirect(`/urls`);
  // res.render(("urls_index", templateVars)); // Respond with 'Ok' (we will replace this)
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
  res.cookie("username", req.body.username);
    // urlDatabase[req.params.id] = req.body.longURL;
  // console.log(req.body.longURL);
  // console.log(urlDatabase);
  // const templateVars = { urls: urlDatabase }
  res.redirect(`/urls`);
  // res.render(("urls_index", templateVars)); // Respond with 'Ok' (we will replace this)
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls")
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});