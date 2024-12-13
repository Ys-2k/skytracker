const db = require("../../db");

async function getUserFlights(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    // Updated the column name from arrival_iata to arr_iata
    const [userFlights] = await db.execute(
      `SELECT id, flight_id, flight_number, airline_name, status, 
              dep_iata, scheduled_departure, arr_iata,
              scheduled_arrival, airline_iata
       FROM saved_flights 
       WHERE user_id = ?`,
      [userId]
    );

    if (userFlights.length === 0) {
      return [];
    }

    return userFlights;
  } catch (error) {
    console.error("Error retrieving user flights:", error);
    throw new Error(`Failed to retrieve user flights: ${error.message}`);
  }
}

module.exports = getUserFlights;
