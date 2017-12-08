"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var random_bot_1 = require("./random_bot");
var simple_bot_1 = require("./simple_bot");
var tictacpro_bot_1 = require("./tictacpro_bot");
//let bot_config: any = require("../bot_config.json");
var bot_config = {
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
};
var randomBot = new random_bot_1.RandomBot(bot_config.random.identifier, bot_config.random.password);
randomBot.start();
var simpleBot = new simple_bot_1.SimpleBot(bot_config.simple.identifier, bot_config.simple.password);
simpleBot.start();
var tictacproBot = new tictacpro_bot_1.TictacproBot(bot_config.tictacpro.identifier, bot_config.tictacpro.password);
tictacproBot.start();
console.log("Bots started");
