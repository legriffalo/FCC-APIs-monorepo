// index.js
// where your node app starts

// init project
var express = require("express");
// get proxy ips
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

// create a random string of n chars
function Str_Random(length) {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";

  // Loop to generate characters for the specified length
  for (let i = 0; i < length; i++) {
    const randomInd = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomInd);
  }
  return result;
}

//create instance of express
var app = express();
//// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204
// allow proxy addresses
app.set("trust proxy", true);
// set middleware to parse forms
app.use(express.urlencoded({ extended: false }));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// app.get("/api/shorturl/", async function (req, res) {
// });

app.post("/api/shorturl", async function (req, res) {});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
