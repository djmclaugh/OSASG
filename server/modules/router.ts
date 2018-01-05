import * as express from "express";
import { Router, Request, Response } from "express";
import * as guest_names from "./guest_names";
import { BotModel, UserDocument, UserModel } from "./db";
import { MatchManager } from "./matches/match_manager";

let matchManager: MatchManager;
let config: any = require("../config.json");

let router: Router = express.Router();

router.use(function(req: Request, res: Response, next) {
  res.header("Access-Control-Allow-Origin", <string>req.headers.origin);
  res.header("Access-Control-Allow-Methods: GET, POST");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

function fetchUserInformation(req, res, next) {
  if (req.session.userID) {
    UserModel.findById(req.session.userID, function(error, user) {
      if (error) {
        console.log(error);
        req.session.user = null;
        req.session.username = null;
      } else {
        req.session.user = user;
        req.session.identifier = user.id;
        req.session.username = user.username;
      }
      next();
    });
  } else {
    req.session.user = null;
    req.session.isGuest = true;
    if (!req.session.username || !req.session.username.includes("[guest]")) {
      guest_names.getGuestName(function(username) {
        req.session.username = username;
        var date = new Date();
        req.session.identifier = "guest-" + Math.floor(Math.random() * 1000) + "-" + date.getTime();
	      if (req.session.username == null) {
	        req.session.username = req.session.identifier;
	      }
        next();
      });
    } else {
      next();
    }
  }
}

router.use(fetchUserInformation);

// Simple response to set cookies.
// When the browser establishes the websocket connection, the browser might not have cookies yet.
// The clien should call this endpoint so that browser cookies are set.
// This is a temporary solution until I figure out a better way or rethink authentication.
// TODO(djmclaugh): figure this out.
router.get("/ping", function(req, res) {
  res.send("pong");
});

router.post("/login", function(req, res, next) {
  UserModel.getOrCreateWithUsername(req.body.username, req.body.password, function(error, user) {
    if (error) {
      res.status(500).send({message: error.message});
    } else {
      req.session.userID = user;
      res.send({message: "Successfully logged in"});
    }
  });
});

router.get("/logout", function(req, res) {
  req.session.userID = null;
  res.sendStatus(200);
});

// Changes the username of the currently logged in user.
// Will send a 400 response if the body is missing "desiredUsername".
// Will send a 403 response if no user is logged in.
// Will send a 500 response if this fails for any other reason.
// body - {
//     desiredUsername: The desired username.
// }
router.post("/api/settings/change_username", function(req, res) {
  if (!req.body.desiredUsername) {
    res.status(400).send("Please enter your desired username.");
  } else if (!req.session.user) {
    res.status(403).send("You must be logged in to change your username.");
  } else {
    req.session.user.changeUsername(req.body.desiredUsername, function(error, user) {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.send(user.username);
      }
    });
  }
});

// Creates a new bot for the user.
// Will send a 403 response if no user is logged in.
// Will send a 500 response if this fails for any other reason.
router.post("/api/bots/create_bot", function(req, res) {
  if (!req.session.user) {
    res.status(403).send("you must be logged in to create a bot.");
  } else {
    BotModel.createBotForUser(req.session.user, function(error, bot) {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.send(bot._id);
      }
    });
  }
});

// Sends a list of all bots belonging to the currently signed in user.
// Will send a 403 response if no user is logged in.
// Will send a 500 response if this fails for any other reason.
router.get("/api/bots", function(req, res) {
  if (!req.session.user) {
    res.status(403).send("you must be logged in to request your bots.");
  } else {
    BotModel.find({owner: req.session.user}, function(error, bots) {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.send(bots);
      }
    });
  }
});

// Change the username of the bot.
// Will send a 403 response if someone other than the owner is making the request.
// Will send a 500 response if this fails for any other reason.
// body - {
//     desiredUsername: The desired username.
// }
router.post("/api/bots/:botId/change_username", function(req, res) {
  BotModel.findById(req.params.botId)
      .populate("owner")
      .exec(function(error, bot) {
        let owner: UserDocument = <UserDocument>bot.owner;
        if (error) {
          console.log(error);
          res.status(500).send(error.message);
        } else if (!req.session.user || req.session.user.id != owner.id) {
          res.status(403).send("You cannot change the name of a bot you don't own.");
        } else {
          bot.changeUsername(req.body.desiredUsername, function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(bot.username);
            }
          });
        }
      });
});

// Get information about the bot with the specified id.
// If the owner of the bot is the one making the request, the response will include the password.
// Will send a 500 response if this fails for any reason.
router.get("/api/bots/:botId", function(req, res) {
  BotModel.findById(req.params.botId)
      // We select the password because there is no way of knowing before fetching the bot if it
      // belongs to the user making the request. We need to delete this field if the bot doesn't
      // belong to the currently logged in user.
      .select("+password")
      .populate("owner")
      .exec(function(error, bot) {
        let owner: UserDocument = <UserDocument>bot.owner;
        if (error) {
          console.log(error);
          res.status(500).send(error.message);
        } else if(!bot) {
          res.status(404).send("Bot not found.");
        } else {
          if (!req.session.user || owner.id != req.session.user.id) {
            bot.password = "";
          }
          res.send(bot);
        }
      });
});

// Get information about the user with the specified id.
// The response will contain more information if the user themself is making the request.
// Will send a 500 response if this fails for any reason.
router.get("/api/users/:userId", function(req, res) {
  let response: any = {};
  function onUserFind(error, user) {
    if (error) {
      console.log(error);
      res.status(500).send(error.message);
    } else if (!user) {
      res.status(404).send("User not found.");
    } else {
      response.user = user;
      BotModel.find({owner: user})
          .select("-description -owner")
          .exec(onBotsFind);
    }
  }

  function onBotsFind(error, bots) {
    if (error) {
      res.status(500).send(error.message);
    } else {
      response.bots = bots;
      res.send(response);
    }
  }

  UserModel.findById(req.params.userId).exec(onUserFind);
});

// Change the description of the bot.
// Will send a 403 response if someone other than the owner is making the request.
// Will send a 500 response if this fails for any other reason.
// body - {
//     desiredDescription: The desired description.
// }
router.post("/api/bots/:botId/change_description", function(req, res) {
  BotModel.findById(req.params.botId)
      .exec(function(error, bot) {
        let owner: string = <string>bot.owner;
        if (error) {
          res.status(500).send(error.message);
        } else if (!req.session.user || req.session.user.id != owner) {
          res.status(403).send("You cannot change the password of a bot you don't own.");
        } else {
          bot.description = req.body.desiredDescription;
          bot.save(function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(bot);
            }
          });
        }
      });
});

// Generate and assing a new password for the bot.
// Will send a 403 response if someone other than the owner is making the request.
// Will send a 500 response if this fails for any other reason.
// body - {}
router.post("/api/bots/:botId/change_password", function(req, res) {
  BotModel.findById(req.params.botId)
      .select("+password")
      .exec(function(error, bot) {
        if (error) {
          res.status(500).send(error.message);
        } else if (!req.session.user || req.session.user.id != bot.owner) {
          res.status(403).send("You cannot change the password of a bot you don't own.");
        } else {
          bot.generateNewPassword(function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(bot.password);
            }
          });
        }
      });
});

router.post("/api/create_match", function(req, res) {
  try {
    var options = {
      gameName: req.body.gameName,
      gameOptions: req.body.gameOptions,
      isRated: false
    }
    var match = matchManager.createNewMatch(options);
    res.send(match.identifier);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

router.get("/api/matches/player/:playerId", function(req, res) {
  res.status(404).send("Not yet implemented");
});

router.get("/api/server_time", function(req, res) {
  res.send({time: Date.now()});
});

router.get("/api/activeMatches", function(req, res) {
  res.send(matchManager.getMatchesUserCanJoin(req.session.identifer));
});

module.exports.getRouter = function(sessionStore, manager) {
  matchManager = manager;
  guest_names.setStore(sessionStore);
  return router;
};
