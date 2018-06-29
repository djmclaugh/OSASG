var path = require("path");
var express = require("express");
var app = express();
var https = require("https");
var fs = require("fs");

var config = require("./config.json");

app.use(express.static(path.join(__dirname, 'public')));
app.get("**", function(req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

var credentials = {
  key: fs.readFileSync(config.certs + "/privkey.pem"),
  cert: fs.readFileSync(config.certs + "/cert.pem"),
  ca: fs.readFileSync(config.certs + "/chain.pem")
};
var httpsServer = https.createServer(credentials, app);

httpsServer.listen(config.clientPort, function() {
  console.log("OSASG client started on port " + config.clientPort);
});
