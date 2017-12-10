import { Bot } from "./bot"
import { RandomBot } from "./random_bot"
import { SimpleBot } from "./simple_bot"
import { TictacproBot } from "./tictacpro_bot"

let config = require("./config.json");

let randomBot: Bot = new RandomBot(config.randomBot.identifier, config.randomBot.password);
randomBot.start();

let simpleBot: Bot = new SimpleBot(config.simpleBot.identifier, config.simpleBot.password);
simpleBot.start();

let tictacproBot: Bot =
    new TictacproBot(config.tictacpro.identifier, config.tictacpro.password);
tictacproBot.start();

console.log("Bots started");
