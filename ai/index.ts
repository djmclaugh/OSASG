import { Bot } from "./bot"
import { RandomBot } from "./random_bot"
import { SimpleBot } from "./simple_bot"
import { TictacproBot } from "./tictacpro_bot"

let bots = require("./config.json").bots;

let randomBot: Bot = new RandomBot(bots.random.identifier, bots.random.password);
randomBot.start();

let simpleBot: Bot = new SimpleBot(bots.simple.identifier, bots.simple.password);
simpleBot.start();

let tictacproBot: Bot = new TictacproBot(bots.tictacpro.identifier, bots.tictacpro.password);
tictacproBot.start();

console.log("Bots started");
