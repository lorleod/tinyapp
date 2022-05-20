const getUserByEmail = function(email, database) {
  for (const user in database) {
    console.log(user);
    if (database[user].email === email) {
      return database[user];
    }
  }
};

module.exports = { getUserByEmail };