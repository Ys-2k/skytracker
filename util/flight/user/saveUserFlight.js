const db = require("../../db");

const saveFlightToDatabase = async (userId, flightData) => {
  const {
    flight_id,
    flight_number,
    dep_iata,
    arr_iata,
    scheduled_departure,
    estimated_departure,
    actual_departure,
    scheduled_arrival,
    estimated_arrival,
    actual_arrival,
    status,
    airline_name,
    airline_iata,
  } = flightData;

  const formatDatetime = (datetime) => {
    const date = new Date(datetime);
    return !isNaN(date.getTime())
      ? date.toISOString().slice(0, 19).replace("T", " ")
      : null;
  };

  try {
    const formattedScheduledDeparture = formatDatetime(scheduled_departure);
    const formattedEstimatedDeparture = formatDatetime(estimated_departure);
    const formattedActualDeparture = formatDatetime(actual_departure);
    const formattedScheduledArrival = formatDatetime(scheduled_arrival);
    const formattedEstimatedArrival = formatDatetime(estimated_arrival);
    const formattedActualArrival = formatDatetime(actual_arrival);

    const sql = `
      INSERT INTO saved_flights (
        user_id,
        flight_id,
        flight_number,
        dep_iata,
        arr_iata,
        scheduled_departure,
        estimated_departure,
        actual_departure,
        scheduled_arrival,
        estimated_arrival,
        actual_arrival,
        status,
        airline_name,
        airline_iata
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      userId,
      flight_id,
      flight_number,
      dep_iata,
      arr_iata,
      formattedScheduledDeparture,
      formattedEstimatedDeparture,
      formattedActualDeparture,
      formattedScheduledArrival,
      formattedEstimatedArrival,
      formattedActualArrival,
      status,
      airline_name,
      airline_iata,
    ]);
  } catch (error) {
    console.error("Error saving flight:", error);
    throw new Error("Unable to save flight to the database.");
  }
};

module.exports = saveFlightToDatabase;
