var MarkdownIt = require('markdown-it'),
md = new MarkdownIt();

module.exports = ["$http", "$sce", function($http, $sce) {
  var self = this;

  var urlPrefix = null;
  self.identifier = null;
  self.bot = null;
  self.error = null;
  self.matches = {};
  self.matchError = null; 
  self.isEditingDescription = false;
  self.descriptionEdit = "";
  self.nameEdit;

  function onSuccess(response) {
    self.bot = response.data;
    self.error = null;
  }

  function onError(response) {
    self.error = new Error(response.data);
  }

  function onMatchSuccess(response) {
    var matchList = response.data;
    for (var i = 0; i < matchList.length; ++i) {
      var match = matchList[i];
      if (!(match.game in self.matches)) {
        self.matches[match.game] = {};
      }
      var gameSection = self.matches[match.game];
      if (!(match.timeControls in gameSection)) {
        gameSection[match.timeControls] = {};
      }
      var timeControlsSection = gameSection[match.timeControls];
      var other = self.identifier == match.p1._id ? match.p2.username : match.p1.username;
      if (!(other in timeControlsSection)) {
        timeControlsSection[other] = {
          win: 0,
          lose: 0,
          draw: 0
        };
      }
      if (match.result == "DRAW") {
        timeControlsSection[other].draw += 1;
      } else if ((match.result == "P1" && match.p1._id == self.identifier)
          || (match.result == "P2" && match.p2._id == self.identifier)) {
        timeControlsSection[other].win += 1;
      } else {
        timeControlsSection[other].lose += 1;
      }
    }
    self.matchError = null;
  }

  self.gameKeys = function() {
    return Object.keys(self.matches);
  };

  self.timeControlsKeys = function(game) {
    return Object.keys(self.matches[game]);
  };

  self.playerKeys = function(game, timeControls) {
    return Object.keys(self.matches[game][timeControls]);
  };

  function onMatchError(response) {
    self.matchError = new Error(response.data);
  }

  self.htmlFromMarkdown = function(markdown) {
    if (markdown) {
      return $sce.trustAsHtml(md.render(markdown));
    } else {
      return "";
    }
  };

  self.fetchBot = function(identifier) {
    self.identifier = identifier;
    urlPrefix = "/api/bots/" + identifier; 
    $http.get(urlPrefix).then(onSuccess, onError);
  };

  self.fetchMatches = function(identifier) {
    $http.get("/api/matches/player/" + identifier).then(onMatchSuccess, onMatchError);
  };

  self.submitName = function() {
    self.changeName(self.nameEdit);
    self.nameEdit = "";
  };

  self.startDescriptionEdit = function() {
    self.descriptionEdit = self.bot.description;
    self.isEditingDescription = true;
  };

  self.cancelDescriptionEdit = function() {
    self.isEditingDescription = false;
  };

  self.finishDescriptionEdit = function() {
    self.changeDescription(self.descriptionEdit);
    self.isEditingDescription = false;
  }

  self.changeName = function(newName) {
    var body = {desiredUsername: newName};
    var oldName = self.bot.username;
    self.bot.username = newName;
    function onNameChangeError(response) {
      self.error = new Error(response.data);
      self.nameEdit = newName;
      self.bot.username = oldName;
    }
    $http.post(urlPrefix + "/change_username", body).then(onSuccess, onNameChangeError);
  };

  self.changeDescription = function(newDescription) {
    var body = {desiredDescription: newDescription};
    self.bot.description = newDescription;
    $http.post(urlPrefix + "/change_description", body).then(onSuccess, onError);
  };

  self.changePassword = function() {
    self.bot.password = "generating new password...";
    $http.post(urlPrefix + "/change_password", {}).then(onSuccess, onError);
  };
}];
