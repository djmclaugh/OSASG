import { Bot } from "./bot"
import { RandomBot } from "./random_bot"
import { SimpleBot } from "./simple_bot"
import { TictacproBot } from "./tictacpro_bot"

//let bot_config: any = require("../bot_config.json");
let bot_config = {
  random: {
    identifier: "random",
    password: "random_password"
  },
  simple: {
    identifier: "simple",
    password: "simple_password"
  },
  tictacpro: {
    identifier: "tictacpro",
    password: "tictacpro_password"
  },
}

let randomBot: Bot = new RandomBot(bot_config.random.identifier, bot_config.random.password);
randomBot.start();

let simpleBot: Bot = new SimpleBot(bot_config.simple.identifier, bot_config.simple.password);
simpleBot.start();

let tictacproBot: Bot =
    new TictacproBot(bot_config.tictacpro.identifier, bot_config.tictacpro.password);
tictacproBot.start();

console.log("Bots started");
