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

console.log(Str_Random(5));
// Call this function to perform database operations for testing purposes
// DBoperation((retries = 1), (SQLquery = "SELECT * FROM urls"))
//   .then((data) => console.log("Query result:", data))
//   .catch((error) => console.error("Final database error:", error));

//create instance of express
var app = express();

// allow proxy addresses
app.set("trust proxy", true);

// set middleware to parse forms
app.use(express.urlencoded({ extended: false }));

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

app.get("/api/shorturl/:shortened", function (req, res) {
  // query db and redirect
  const query = `
  SELECT long_url 
  FROM urls 
  WHERE short_url = '${req.params.shortened}'
  `;

  DBoperation((retries = 1), (SQLquery = query))
    .then((data) => {
      console.log("Query result:", data);
      // Immediate redirect
      const url = data[0].long_url;
      console.log("redirecting to this URL", url);
      return res.redirect(`${url}`);
    })
    .catch((error) => console.error("Final database error:", error));
});

app.post("/api/shorturl", async function (req, res) {
  // check url format
  const long_url = req.body.url;
  const regTest = /^https:\/\/www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/?$/.test(
    long_url
  );
  if (regTest == false) {
    return res.json({
      error: "invalid url",
    });
  }

  let match = 1;
  let short_url = "";
  // check if shortening already exists
  const checkLongQuery = `
    SELECT short_url,long_url FROM urls WHERE long_url = '${req.body.url}';
  `;
  // send query and return early if existing
  // const data = await DBoperation((retries = 1), (SQLquery = checkLongQuery));
  // try {
  //   if (data[0].short_url) {
  //     console.log("returning early");
  //     return res.json({
  //       original_url: req.body.url,
  //       short_url: data[0].short_url,
  //     });
  //   }
  // } catch {}

  //ensure no duplicate shortenings are used
  do {
    console.log("your early return failed");
    short_url = Str_Random(5);
    console.log(short_url);
    const query = `
    SELECT short_url FROM urls WHERE short_url = '${short_url}';
    `;
    // check not duplicate
    await DBoperation((retries = 2), (SQLquery = query))
      .then((data) => {
        console.log("Query result:", data[0] ? "exists" : "not yet");
        console.log(data);
        if (!data[0]) {
          match = 0;
        }
      })
      .catch((error) => console.error("Final database error:", error));
  } while (match);

  // send new data to the table
  const insertQuery = `
  INSERT INTO urls (short_url,long_url)
  VALUES('${short_url}','${req.body.url}');
  `;

  await DBoperation((retries = 2), (SQLquery = insertQuery))
    .then((data) => {
      console.log("insert successful");
    })
    .catch((error) => console.error("Final database error:", error));

  res.json({
    original_url: req.body.url,
    short_url: short_url,
  });
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
