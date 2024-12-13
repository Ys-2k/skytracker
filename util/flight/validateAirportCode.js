async function validateAirportCode(iataCode) {
  try {
    const response = await fetch(
      `http://api.aviationstack.com/v1/airports?access_key=${process.env.API_KEY}`
    );

    console.log("Making request to aviation API", process.env.API_KEY);

    if (!response.ok) {
      console.error(
        "Error fetching data from the aviation API:",
        response.statusText
      );
      return false;
    }

    const data = await response.json();

    const airport = data.data.find((airport) => airport.iata_code === iataCode);
    if (airport) {
      console.log(`Airport found: ${airport.airport_name}`);
      return true;
    } else {
      console.log("No airport found with the given IATA code.");
      return false;
    }
  } catch (error) {
    console.error("Error validating airport code:", error);
    return false;
  }
}

module.exports = validateAirportCode;
