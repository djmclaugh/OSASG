var path = require("path");
var express = require("express");
var app = express();
var http = require("http").Server(app);

var config = require("./config.json");

app.use(express.static(path.join(__dirname, 'public')));
app.get("**", function(req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

http.listen(config.clientPort, function() {
  console.log("OSASG client started on port " + config.clientPort);
});
