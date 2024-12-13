const express = require("express");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
const db = require("../util/db");
const router = express.Router();
const registerAccount = require("../util/user/registerAccount");
const getFlight = require("../util/flight/getFlight");
const getUserFlights = require("../util/flight/user/getUserFlights");
const saveFlightToDatabase = require("../util/flight/user/saveUserFlight");
const deleteFlight = require("../util/flight/user/deleteUserFlight");
const searchFlights = require("../util/flight/user/searchUserFlight");

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

router.get("/", async (req, res) => {
  if (req.user) {
    return res.redirect("/track");
  }

  res.render("pages/index");
});

router.get("/register", (req, res) => {
  res.render("pages/register");
});

router.post(
  "/register",
  [
    check("username").not().isEmpty().withMessage("Username is required"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    check("confirmPassword")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords must match"),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors
          .array()
          .map((err) => err.msg)
          .join(", ")
      );
      return res.redirect("/register");
    }

    const { username, password, confirmPassword } = req.body;

    try {
      await registerAccount(username, password, confirmPassword);

      req.flash("success", "Registration successful! Please log in.");
      res.redirect("/login");
    } catch (error) {
      console.error("Error during registration:", error);
      req.flash("error", error.message);
      res.redirect("/register");
    }
  }
);

router.get("/login", (req, res) => {
  res.render("pages/login");
});

router.post(
  "/login",
  [
    check("username").not().isEmpty().withMessage("Username is required"),
    check("password").not().isEmpty().withMessage("Password is required"),
  ],
  passport.authenticate("local", {
    successRedirect: "/track",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have been logged out.");
    res.redirect("/");
  });
});

router.get(
  "/track",
  passport.authenticate("session", { failureRedirect: "/login" }),
  (req, res, next) => {
    res.render("pages/track");
  }
);

router.post("/track", isAuthenticated, async (req, res) => {
  const { from, to } = req.body;

  try {
    res.redirect(`/track-results?from=${from}&to=${to}`);
  } catch (error) {
    console.error("Error validating airport codes:", error);
    req.flash("error", "Unable to validate airport codes.");
    res.redirect("/track");
  }
});

router.get("/track-results", isAuthenticated, async (req, res) => {
  const { from, to } = req.query;

  try {
    const flightData = await getFlight(from, to);

    res.render("pages/track-results", { from, to, data: flightData });
  } catch (error) {
    console.error("Error fetching flight data:", error);
    req.flash("error", "Unable to fetch flight data.");
    res.redirect("/track");
  }
});

router.post("/save-flight", isAuthenticated, async (req, res) => {
  const flightData = req.body;
  const userId = req.user.id;

  try {
    await saveFlightToDatabase(userId, flightData);
    req.flash("success", "Flight saved successfully!");
    res.redirect("/track-results");
  } catch (error) {
    req.flash(
      "error",
      error.message || "Unable to save flight. Please try again."
    );
    res.redirect("/track-results");
  }
});

router.get("/user/flights", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const userFlights = await getUserFlights(userId);
    res.render("pages/user-flights", { flights: userFlights });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/user/flights", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.body;

    console.log(`Deleting flight with id: ${id}`);

    const result = await deleteFlight(userId, id);

    if (result.affectedRows === 0) {
      req.flash("error", "Unable to delete flight.");
      res.redirect("/user/flights");
    } else {
      req.flash("success", "Successfully deleted flight.");
      res.redirect("/user/flights");
    }
  } catch (error) {
    console.error("Error deleting flight:", error);
    req.flash("error", "Error deleting flight.");
    res.redirect("/user/flights");
  }
});

router.get("/search", (req, res) => {
  res.render("pages/search", {
    query: "",
    results: [],
  });
});

router.get("/search", (req, res) => {
  res.render("pages/search", {
    query: "",
    results: [],
  });
});

router.post(
  "/search-results",
  [
    check("flight_id")
      .not()
      .isEmpty()
      .withMessage("Flight ID is required")
      .trim()
      .escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors
          .array()
          .map((err) => err.msg)
          .join(", ")
      );
      return res.redirect("/search");
    }

    const { flight_id } = req.body;

    try {
      const rows = await searchFlights(flight_id);

      res.render("pages/search", {
        results: rows,
        query: flight_id,
      });
    } catch (error) {
      console.error("Error searching for flights:", error);
      req.flash("error", "Server error during search.");
      res.redirect("/search");
    }
  }
);

module.exports = router;
