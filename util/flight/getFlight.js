const { default: axios } = require("axios");

async function getFlight(from, to) {
  try {
    const LIMIT = 10;
    const response = await axios.get(
      "http://api.aviationstack.com/v1/flights",
      {
        params: {
          access_key: process.env.API_KEY,
          dep_iata: from,
          arr_iata: to,
          limit: LIMIT,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error fetching flight data:", error);
    throw new Error("Unable to fetch flight data.");
  }
}

module.exports = getFlight;
