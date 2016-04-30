var GameGUIs = require("../games/gui/game_guis");

var app = angular.module("osasg", []);

app.service("BotService", require("./bot_service"));
app.service("LobbyService", require("./lobby_service"));
app.service("MatchService", require("./match_service"));
app.service("SocketService", require("./socket_service"));
app.controller("LobbyController", require("./lobby_controller"));
app.controller("LoginFormController", require("./login_form_controller"));
app.controller("MatchControlPanelController", require("./match_control_panel_controller"));

app.directive("asgMatch", ["MatchService", function(MatchService) {
  return {
    restrict: "E",
    template: "<asg-game-canvas class=game-container></asg-game-canvas>\n" +
        "<asg-match-control-panel class=control-panel></asg-match-control-panel>",
    link: function(scope, element, attrs) {
      scope.match = MatchService.getMatch(attrs.matchId);
    }
  };
}]);

app.directive("asgGameCanvas", ["$window", function($window) {
  return {
    restrict: "E",
    template: "<canvas width=500 height=500></canvas>",
    link: function(scope, element, attrs) {
      var canvas = element.find("canvas")[0];
      var ctx = canvas.getContext("2d");
      var gameGUI = null;
      
      scope.$watch("match", function(match) {
        gameGUI = GameGUIs.newGameGUI(match.game, canvas);
        gameGUI.setMouseDisabled(!match.isMyTurn());
        gameGUI.onChange(function() {
          scope.$apply();
        });
        match.onChange(function() {
          gameGUI.clean();
          gameGUI.setMouseDisabled(!match.isMyTurn());
        });
        match.getMoveDelegate = gameGUI;
      });
      
      tick();
      
      function tick() {
        $window.requestAnimationFrame(tick);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (gameGUI) {
          gameGUI.draw();
        }
      }
    }
  };
}]);

app.directive("asgMatchControlPanel", function() {
  return {
    restrict: "E",
    controller: "MatchControlPanelController",
    controllerAs: "cpCtrl",
    templateUrl: "/templates/control_panel.html"
  };
});

app.directive("asgLogin", function($window) {
  return {
    restrict: "E",
    templateUrl: "/templates/login_form.html",
    scope: {username: "@username"},
    link: function (scope, element, attrs) {
      var s = document.createElement('script');
      s.src = "https://www.google.com/recaptcha/api.js";
      document.body.appendChild(s);
    }
  };
});

app.filter("isGuest", function() {
  return function(username) {
    return username.indexOf("[guest]") != -1;
  };
});
