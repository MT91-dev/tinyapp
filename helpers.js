//generating a random unique short url id
function generateRandomString() {
  return Math.random().toString(36).substr(2, 6);
}

//function to check if cookie with user_id exists
const validateCookie = (cookieID, userDatabase) => {
  for (let user in userDatabase) {
    if (userDatabase[user].id === cookieID) {
      return userDatabase[user];
    }
  }
  return undefined;
};

//function to check if user exists in user object with email entered
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

//function to check if password is correct based on users object for user logging in
const validPassword = (password, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].password === password) {
      return true;
    }
  }
  return false;
};

//function to get all URLs by user_id
const getAllUrlsByUser = (cookie, database) => {
  let currentUserObject = {};
  let currentUser = cookie;
  for (const url in database) {
    if (database[url].userID === currentUser) {
      let key = url;
      let value = database[url]["longURL"];
      currentUserObject[key] = value;
    }
  }
  return currentUserObject;
};

module.exports = {
  generateRandomString,
  validateCookie,
  getUserByEmail,
  validPassword,
  getAllUrlsByUser
};