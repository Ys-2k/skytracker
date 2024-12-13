require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

(async () => {
  try {
    console.log("Attempting to connect to MySQL for database setup...");
    const connection = await pool.getConnection();
    console.log("MySQL connection established for setup");

    const usersTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      );
    `;

    const flightsTableSql = `
    CREATE TABLE IF NOT EXISTS saved_flights (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      flight_id VARCHAR(255) NOT NULL,  -- Flight ID (can be composed of flight_number + dep_iata + arr_iata)
      flight_number VARCHAR(10) NOT NULL,  -- Flight number (e.g., B6523)
      dep_iata VARCHAR(3) NOT NULL,  -- Departure airport IATA code (e.g., JFK)
      arr_iata VARCHAR(3) NOT NULL,  -- Arrival airport IATA code (e.g., LAX)
      scheduled_departure DATETIME NOT NULL,  -- Scheduled departure time
      estimated_departure DATETIME,  -- Estimated departure time (nullable)
      actual_departure DATETIME,  -- Actual departure time (nullable)
      scheduled_arrival DATETIME NOT NULL,  -- Scheduled arrival time
      estimated_arrival DATETIME,  -- Estimated arrival time (nullable)
      actual_arrival DATETIME,  -- Actual arrival time (nullable)
      status VARCHAR(20) NOT NULL,  -- Flight status (e.g., 'scheduled', 'delayed', etc.)
      airline_name VARCHAR(255),  -- Airline name (e.g., 'JetBlue Airways')
      airline_iata VARCHAR(3),  -- Airline IATA code (e.g., 'B6')
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When the flight was saved
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- Last update time
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    `;

    await pool.query(usersTableSql);
    console.log("User accounts table is ready");

    await pool.query(flightsTableSql);
    console.log("Flights saving table is set up");
  } catch (err) {
    console.error("An error occurred during the database initialization:", err);
  } finally {
    pool.end();
  }
})();

module.exports = () => pool;
