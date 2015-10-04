var app = angular.module("osasg", []);

app.service("MatchService", require("./match_service")); 
app.controller("LobbyController", require("./lobby_controller"));
