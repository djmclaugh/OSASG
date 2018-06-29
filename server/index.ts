var config = require("./config.json");

import * as Path from "path";
import * as BodyParser from "body-parser";
import * as Express from "express";
import * as ExpressSession from "express-session";
import * as HTTP from "http";
import * as HTTPS from "https";
import * as fs from "fs";

import { MatchManager } from "./modules/matches/match_manager";
import { SocketServer } from "./modules/sockets/socket_server";
import { PlayerInfoCallback, SocketAuthenticator } from "./modules/sockets/socket_authenticator";
import * as DB from "./modules/db";

let app: Express.Application = Express();

let webServer: HTTP.Server|HTTPS.Server;
if (config.certs && config.certs.length > 0) {
  var credentials = {
    key: fs.readFileSync(config.certs + "/privkey.pem"),
    cert: fs.readFileSync(config.certs + "/cert.pem"),
    ca: fs.readFileSync(config.certs + "/chain.pem")
  };
  webServer = HTTPS.createServer(credentials, app);
} else {
  console.log("No SSL certificates specified. Starting http server instead of https");
  webServer = HTTP.createServer(app);
}

let matchManager: MatchManager = new MatchManager();

if (config.mongoURI.length > 0) {
  DB.connectToDatabase(config.mongoURI);
} else {
  console.log("Starting server without a database. Some features will be unavailable");
}

app.use(Express.static(Path.join(__dirname, 'public')));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));

// Setup session

let sessionStore: ExpressSession.Store;
let options: ExpressSession.SessionOptions = {
  secret: config.secret,
  saveUninitialized: true,
  resave: false,
  rolling: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000},
  store: null
}
let router: Express.Router;
if (config.mongoURI.length > 0) {
  const MongoStore = require('connect-mongo')(ExpressSession);
  options.store = new MongoStore({ mongooseConnection: DB.connection });
  router = require("./modules/router").getRouter(null, matchManager);
} else {
  console.log("Starting OSASG with memory store for sessions. (Should not be used in prod)");
  options.store = new ExpressSession.MemoryStore();
  router = require("./modules/router").getRouter(options.store, matchManager);
}
let session: Express.RequestHandler = ExpressSession(options);
app.use(session);

// Setup router
app.use(router);

let authenticateRequest: (request: HTTP.IncomingMessage, callback: PlayerInfoCallback) => void =
    function(request: HTTP.IncomingMessage, callback: PlayerInfoCallback) {
        // Requests will be express requests because they will come from HTTPServer which serves the
        // express app.
        let expressRequest: Express.Request = <Express.Request>request;
        let emptyResponse: Express.Response = Object.create(require("express").response);
        session(expressRequest, emptyResponse, () => {
            let currentSession = expressRequest.session;
            if (currentSession.identifier) {
              callback(null, {
                  identifier: currentSession.identifier,
                  username: currentSession.username
              });
            } else {
              callback(null, null);
            }
        });
    };

let authenticateInfo = function(info, callback) {
  // If no database is provided, assume the authentication info is correct.
  if (config.mongoURI.length == 0) {
    callback(null, {
      identifier: info.identifier,
      username: info.identifier + "[bot]",
    });
    return;
  }

  DB.BotModel.findById(info.identifier).select("+password").exec(function(error, bot) {
    if (error) {
      callback(error, null);
    } else if (!bot) {
      callback(null, null);
    } else if (!info.password || bot.password != info.password) {
      callback(new Error("Wrong password"), null);
    } else {
      callback(null, {
        identifier: info.identifier,
        username: bot.username
      });
    }
  });
};
let authenticator: SocketAuthenticator =
    new SocketAuthenticator(authenticateRequest, authenticateInfo, 5000);
let socketServer: SocketServer = new SocketServer(webServer, authenticator);

const matchLobby = new (require("./modules/match_lobby").MatchLobby)(socketServer, matchManager);

webServer.listen(config.port, function(){
  console.log("OSASG started on port " + config.port);
});
