// index.js
// where your node app starts

// init project
var express = require("express");
const proxyAddr = require("proxy-addr");
require("dotenv").config(); // Load .env variables
const pool = require("./db"); // Adjust the path if db.js is in a different folder

// make a query to the database test
async function DBoperation(retries = 3, SQLquery) {
  // use a client in connection pool
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(SQLquery);
    return result.rows;
  } catch (err) {
    console.error("Database operation failed:", err);
    if (
      retries > 0 &&
      err.code === "XX000" &&
      err.message.includes("terminating connection")
    ) {
      console.log(`Retrying connection (attempts left: ${retries})...`);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before retrying
      return performDatabaseOperationWithRetry(retries - 1);
    } else {
      throw err; // Re-throw the error if no more retries or not a termination error
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Call this function to perform database operations
DBoperation((retries = 1), (SQLquery = "SELECT * FROM urls"))
  .then((data) => console.log("Query result:", data))
  .catch((error) => console.error("Final database error:", error));

var app = express();
app.set("trust proxy", true);

//// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/:shortened", function (req, res) {
  // query db and redirect

  res.json({
    ipaddress: ipaddress,
    language: language,
    software: software,
  });
});

app.post("/api", function (req, res) {
  // post to db
  //respond with shortened url
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
