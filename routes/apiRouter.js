const express = require("express");
const passport = require("passport");
const { check, validationResult } = require("express-validator");
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
  res.status(401).json({ error: "Unauthorized" });
};

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
      return res.status(400).json({
        error: errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      });
    }

    const { username, password, confirmPassword } = req.body;

    try {
      await registerAccount(username, password, confirmPassword);
      res
        .status(201)
        .json({ message: "Registration successful! Please log in." });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

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
  }),
  (req, res) => {
    res.status(200).json({ message: "Login successful", user: req.user });
  }
);

router.post("/logout", isAuthenticated, (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.status(200).json({ message: "Logout successful" });
  });
});

router.post("/track", isAuthenticated, async (req, res) => {
  const { from, to } = req.body;

  try {
    res.status(200).json({ from, to, message: "Track request received" });
  } catch (error) {
    console.error("Error validating airport codes:", error);
    res.status(400).json({ error: "Unable to validate airport codes." });
  }
});

router.get("/track-results", isAuthenticated, async (req, res) => {
  const { from, to } = req.query;

  try {
    const flightData = await getFlight(from, to);
    res.status(200).json(flightData);
  } catch (error) {
    console.error("Error fetching flight data:", error);
    res.status(500).json({ error: "Unable to fetch flight data." });
  }
});

router.post("/save-flight", isAuthenticated, async (req, res) => {
  const flightData = req.body;
  const userId = req.user.id;

  try {
    await saveFlightToDatabase(userId, flightData);
    res.status(201).json({ message: "Flight saved successfully!" });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Unable to save flight. Please try again.",
    });
  }
});

router.get("/user/flights", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user.id;
    const userFlights = await getUserFlights(userId);
    res.status(200).json({ flights: userFlights });
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
      res.status(400).json({ error: "Unable to delete flight." });
    } else {
      res.status(200).json({ message: "Successfully deleted flight." });
    }
  } catch (error) {
    console.error("Error deleting flight:", error);
    res.status(500).json({ error: "Error deleting flight." });
  }
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
      return res.status(400).json({
        error: errors
          .array()
          .map((err) => err.msg)
          .join(", "),
      });
    }

    const { flight_id } = req.body;

    try {
      const rows = await searchFlights(flight_id);
      res.status(200).json({ results: rows });
    } catch (error) {
      console.error("Error searching for flights:", error);
      res.status(500).json({ error: "Server error during search." });
    }
  }
);

module.exports = router;
