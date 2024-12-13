require("dotenv").config();
const express = require("express");
const flash = require("connect-flash");
const passport = require("passport");
const session = require("express-session");
const initDatabase = require("./util/setupDb");
const mainRouter = require("./routes/mainRouter");
const apiRouter = require("./routes/apiRouter");

const app = express();
const PORT = process.env.SERVER_PORT || 8000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SECRET_KEY || "defaultsecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.locals.user = req.isAuthenticated() ? req.user : null;
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("error");
  next();
});

app.use((req, res, next) => {
  const redirector = res.redirect;
  res.redirect = function (url) {
    url = process.env.BASE_URL + url;
    redirector.call(this, url);
  };
  next();
});

initDatabase();

require("./auth/passportConfig");

app.use("/", mainRouter);
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("SIGINT", () => {
  console.log("Server is shutting down...");
  app.close(() => {
    console.log("Server successfully closed.");
    process.exit(0);
  });
});
