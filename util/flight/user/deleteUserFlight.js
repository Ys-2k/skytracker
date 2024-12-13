const db = require("../../db");

const deleteFlight = async (userId, flightId) => {
  const deleteQuery = `
    DELETE FROM saved_flights 
    WHERE user_id = ? AND id = ?
  `;

  const [result] = await db.execute(deleteQuery, [userId, flightId]);

  return result;
};

module.exports = deleteFlight;
