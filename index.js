var express = require("express");
var path = require("path");
var router = require("./router");
var client_sessions = require("client-sessions");

var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(client_sessions({cookieName:'session_data', secret:'not_secret'}));

app.use(router);

app.listen(8880);