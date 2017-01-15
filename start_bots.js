const pathPrefix = "./ai/";
const bots = ["random", "simple"];//, "perfect_tictactoe"];

for (var i = 0; i < bots.length; ++i) {
  var Bot = require(pathPrefix + bots[i] + "_bot");
  var bot = new Bot();
  bot.start();
}
