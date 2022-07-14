const { assert } = require('chai');

const { getUserByEmail, validPassword, generateRandomString } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.deepEqual(user.id, expectedUserID);
  });

  it('should return undefined when an email for a user that does not exist in the database is entered', function() {
    const user = getUserByEmail("unknownuser@example.com", testUsers);
    const expectedUserID = undefined;
    assert.deepEqual(user, expectedUserID);
  });

  //the test below could be improved if the function took email as an additional parameter, as it could compare whether the password entered belongs to the given email.
  it('should return true when the password entered belongs to a user in the database of users', function() {
    const user = validPassword("dishwasher-funk", testUsers);
    const passwordExists = true;
    assert.deepEqual(user, passwordExists);
  });

  //the test below could be improved if the function took email as an additional parameter, as it could compare whether the password entered belongs to the given email.
  it('should return false when the password entered belongs to a user in the database of users', function() {
    const user = validPassword("dishwasher-spunk", testUsers);
    const passwordExists = false;
    assert.deepEqual(user, passwordExists);
  });

  it('should return an alphanumeric string that has a length of six characters', function() {
    const user = generateRandomString();
    const length = 6;
    assert.deepEqual(user.length, length);
  });

});