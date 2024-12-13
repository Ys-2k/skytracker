const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const db = require("../util/db");

(async () => {
  try {
    const [result] = await db.query("SELECT 1");
    console.log(
      "Database connection established for Passport configuration:",
      result
    );
  } catch (error) {
    console.error(
      "Error while connecting to the database for Passport:",
      error
    );
  }
})();

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const [userRows] = await db.query(
          "SELECT * FROM users WHERE username = ?",
          [username]
        );

        if (userRows.length === 0) {
          return done(null, false, { message: "Username not found." });
        }

        const isValidPassword = await bcrypt.compare(
          password,
          userRows[0].password
        );
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid password." });
        }

        return done(null, userRows[0]);
      } catch (error) {
        console.error("Error during database query:", error);
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [userRows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (userRows.length === 0) {
      return done(new Error("User not found"));
    }
    done(null, userRows[0]);
  } catch (error) {
    console.error("Error during user deserialization:", error);
    done(error);
  }
});

module.exports = passport;
