function GameGUI(game, canvas) {
  this.game = game;
  this.canvas = canvas
  this.context = canvas.getContext("2d");
  this.onChangeCallbacks = [];
}

// Adds a callback to be triggered whenever a significant change happens in the GUI.
GameGUI.prototype.onChange = function(callback) {
  this.onChangeCallbacks.push(callback);
};

// The GUI should call this whenever a significant change happens.
GameGUI.prototype.changeHappened = function() {
  for (var i = 0; i < this.onChangeCallbacks.length; ++i) {
    this.onChangeCallbacks[i]();
  }
};

// Utitlity method to get the mouse's coordinates even if the canvas gets resized.
GameGUI.prototype.getMouseCoordinates = function(e) {
  var rect = this.canvas.getBoundingClientRect();
  var actualX = e.clientX - rect.left;
  var actualY = e.clientY - rect.top;
  var ratio = 500 / (rect.right - rect.left);
  return {x: actualX * ratio, y: actualY * ratio};
};

// This is called to enable/disable the mouse.
// Mostly used to disabled the GUI when it's not the users turn.
GameGUI.prototype.setMouseDisabled = function(mouseDisabled) {
  throw new Error("This method needs to be implemented by the subclass.");
};

// Remove all extra markings and just display the game as is.
GameGUI.prototype.clean = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

// Get the move the user wants to submit.
GameGUI.prototype.getMove = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

// Draw the game on the canvas.
GameGUI.prototype.draw = function() {
  throw new Error("This method needs to be implemented by the subclass.");
};

module.exports = GameGUI;
