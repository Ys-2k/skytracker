const db = require("../../db");

const searchFlights = async (flightId) => {
  const query = `SELECT * FROM saved_flights WHERE flight_id LIKE ?`;
  const [rows] = await db.execute(query, [`%${flightId}%`]);

  return rows;
};

module.exports = searchFlights;
