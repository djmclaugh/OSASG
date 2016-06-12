var GameGUIs = require("../matches/games/gui/game_guis");

var app = angular.module("osasg", []);

app.service("BotService", require("./bot_service"));
app.service("LobbyService", require("./lobby_service"));
app.service("MatchService", require("./match_service"));
app.service("SocketService", require("./socket_service"));
app.controller("BotController", require("./bot_controller"));
app.controller("BotSettingsController", require("./bot_settings_controller"));
app.controller("LobbyController", require("./lobby_controller"));
app.controller("LoginFormController", require("./login_form_controller"));
app.controller("UsernameChangeFromController", require("./username_change_form_controller"));
app.controller("MatchControlPanelController", require("./match_control_panel_controller"));

app.directive("asgMatch", ["MatchService", function(MatchService) {
  return {
    restrict: "E",
    template: "<asg-game-canvas class=game-container></asg-game-canvas>\n" +
        "<asg-match-control-panel class=control-panel></asg-match-control-panel>",
    link: function(scope, element, attrs) {
      scope.match = MatchService.getMatch(attrs.matchId);
      scope.p1TimeRemaining = function() {
        return scope.match.p1Timer.timeLeft(Date.now() - MatchService.clockOffset);
      };
      scope.p2TimeRemaining = function() {
        return scope.match.p2Timer.timeLeft(Date.now() - MatchService.clockOffset);
      };
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

app.directive("asgLogin", function() {
  return {
    restrict: "E",
    templateUrl: "/templates/login_form.html",
    scope: {username: "@username"},
    link: function(scope, element, attrs) {
      var s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js";
      document.body.appendChild(s);
    }
  };
});

app.directive("asgUsernameChange", function() {
  return {
    restrict: "E",
    templateUrl: "/templates/username_change_form.html",
    scope: {username: "@username"},
  };
});

app.directive("asgMyBots", function() {
  return {
    restrict: "E",
    templateUrl: "/templates/bots_settings.html",
    scope: {username: "@username"},
  };
});

app.directive("asgBotInfo", function() {
  return {
    restrict: "E",
    templateUrl: "/templates/bot_info.html",
    controller: "BotController",
    controllerAs: "botCtrl",
    link: function(scope, element, attrs) {
      scope.botCtrl.fetchBot(attrs.identifier);
    }
  };
});

app.directive("asgTimer", ["$interval", function($interval) {
  return {
    restrict: "E",
    link: function(scope, element, attrs) {
      var timeSource = scope[attrs.timeSource];
      var timeoutId;

      function stringForSeconds(seconds) {
        return (seconds < 10 ? "0" : "") + seconds;
      }

      function stringForTime(time) {
        if (time <= 0) {
          return "0:00";
        }
        var numberOfSeconds = Math.floor(time / 1000);
        var numberOfMinutes = Math.floor(numberOfSeconds / 60);
        return numberOfMinutes + ":" + stringForSeconds(numberOfSeconds % 60);
      }

      function updateTime() {
        element.text(stringForTime(timeSource()));
      }

      element.on("$destroy", function() {
        $interval.cancel(timeoutId);
      });

      timeoutId = $interval(function() {
        updateTime();
      }, 1000);

      updateTime();
    }
  };
}]);

app.filter("isGuest", function() {
  return function(username) {
    return username.indexOf("[guest]") != -1;
  };
});
