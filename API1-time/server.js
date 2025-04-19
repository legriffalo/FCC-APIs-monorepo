// index.js
// where your node app starts

// init project
var express = require("express");
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require("cors");
app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/views/index.html");
});

// // your first API endpoint...
// app.get("/api/hello", function (req, res) {
//   res.json({ greeting: "hello API" });
// });

app.get("/api", function (req, res) {
  const date = new Date(Date.now());
  const unix = date.getTime();
  const utc = date.toUTCString();
  res.json({
    unix: unix,
    utc: utc,
  });
});

app.get("/api/:s", function (req, res) {
  input = req.params.s;
  try {
    const timestamp = Number(input);
    if (!isNaN(timestamp)) {
      date = new Date(timestamp);
    } else {
      date = new Date(input);
    }
    console.log(date);
    const unix = date.getTime();
    const utc = date.toUTCString();

    if (date != "Invalid Date") {
      res.json({
        unix: unix,
        utc: utc,
      });
    } else {
      res.json({
        error: "Invalid Date",
      });
    }
  } catch (e) {
    res.json({
      error: e,
    });
  }
});

// Listen on port set in environment variable or default to 3000
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log("Your app is listening on port " + listener.address().port);
});
