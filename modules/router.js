var config = require("../config.json");
var express = require("express");
var guest_names = require("./guest_names");
var gameManager = require("./matches/game_manager").prototype.getInstance();
var db = require("./db");
var passwordless = require("passwordless");
var https = require("https");

var router = express.Router();

router.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://" + config.clientURL);
  res.header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Credentials", "true");
  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.send(200);
  } else {
    next();
  }
});

function fetchUserInformation(req, res, next) {
  if (req.user) {
    db.User.findById(req.user, function(error, user) {
      if (error) {
        console.log(error);
        req.session.user = null;
        req.session.username = req.session.id;
      } else {
        req.session.user = user;
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
	      if (req.session.username == null) {
	        req.session.username = req.session.id;
	      }
	      next();
      });
    } else {
      next();
    }
  }
}

router.use(fetchUserInformation);

router.get("/", function(req, res) {
  res.render("index", {
      title: "Open Source Abstract Strategy Games",
      username: req.session.username,
      isGuest: !req.session.user
  });
});

router.get("/settings", function(req, res) {
  res.render("settings", {
      username: req.session.username
  });
});

router.get("/bot/:botId", function(req, res) {
  res.render("bot", {
      botId: req.params.botId
  });
});

router.get("/match/:gameId", function(req, res) {
  res.render("match", {
      title: req.params.gameId,
      username: req.session.username,
      id: req.params.gameId
  });
});

// Returns info about the currently logged in user.
// No known reason for failures.
// res - {
//   username: The username of the currently logged in user.
//   userId: The userId of the currently logged in user, null if the user is a guest.
// }
router.get("/user_info", function(req, res) {
  res.send({
    username: req.session.username,
    userId: req.session.user ? req.session.user.id : null
  });
});

// TODO(djmclaugh): This currently only outputs the email to the console. Need to hook up to
// actual email service an protect this endpoint against bots (with a recaptcha or something).
//
// Sends a login email to the specified address and returns a message describing the action.
// req - {
//   user: The email address of the user that wants to login.
// }
// res - {
//   message: message
// }
router.post("/send_login_email", function(req, res) {
  var response = {};
  if (typeof req.body.user != "string") {
    response.message = "No valid email provided";
    res.status(400).send(response);
    return;
  }

  passwordless.requestToken(getUserId)(req, res, onEmailSent);

  function getUserId(email, delivery, callback, req) {
    db.User.getOrCreateWithEmail(email, function(error, user) {
      if (error) {
        callback(error, null);
      } else if (!user) {
        callback(new Error("No user found"), null);
      } else {
        callback(null, user._id);
      }
    });
  }

  function onEmailSent(error) {
    if (error) {
      response.message = error.message;
      res.status(500).send(response);
    } else {
      response.message = "An email has been sent to " + req.body.user + ".\n";
      res.send(response);
    }
  }
});

router.get("/logout", passwordless.logout(), function(req, res) {
  res.redirect("/");
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
    db.Bot.createBotForUser(req.session.user, function(error, bot) {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.send(bot);
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
    db.Bot.find({owner: req.session.user}, function(error, bots) {
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
  db.Bot.findById(req.params.botId)
      .populate("owner")
      .exec(function(error, bot) {
        if (error) {
          console.log(error);
          res.status(500).send(error.message);
        } else if (!req.session.user || req.session.user.id != bot.owner.id) {
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
  db.Bot.findById(req.params.botId)
      // We select the password because there is no way of knowing before fetching the bot if it
      // belongs to the user making the request. We need to delete this field if the bot doesn't
      // belong to the currently logged in user.
      .select("+password")
      .populate("owner")
      .exec(function(error, bot) {
        if (error) {
          console.log(error);
          res.status(500).send(error.message);
        } else if(!bot) {
          res.status(404).send("Bot not found.");
        } else {
          if (!req.session.user || bot.owner.id != req.session.user.id) {
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
  var response = {};
  function onUserFind(error, user) {
    if (error) {
      console.log(error);
      res.status(500).send(error.message);
    } else if (!user) {
      res.status(404).send("User not found.");
    } else {
      response.user = user;
      db.Bot.find({owner: user})
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

  if (req.session.user && req.params.userId == req.session.user.id) {
    db.User.findById(req.params.userId).select("+email").exec(onUserFind);
  } else {
    db.User.findById(req.params.userId).exec(onUserFind);
  }
});

// Change the description of the bot.
// Will send a 403 response if someone other than the owner is making the request.
// Will send a 500 response if this fails for any other reason.
// body - {
//     desiredDescription: The desired description.
// }
router.post("/api/bots/:botId/change_description", function(req, res) {
  db.Bot.findById(req.params.botId)
      .populate("owner")
      .exec(function(error, bot) {
        if (error) {
          res.status(500).send(error.message);
        } else if (!req.session.user || req.session.user.id != bot.owner.id) {
          res.status(403).send("You cannot change the password of a bot you don't own.");
        } else {
          bot.description = req.body.desiredDescription;
          bot.save(function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(botData(bot, req.session.user));
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
  db.Bot.findById(req.params.botId)
      .populate("owner")
      .exec(function(error, bot) {
        if (error) {
          res.status(500).send(error.message);
        } else if (!req.session.user || req.session.user.id != bot.owner.id) {
          res.status(403).send("You cannot change the password of a bot you don't own.");
        } else {
          bot.generateNewPassword(function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(botData(bot, req.session.user));
            }
          });
        }
      });
});

router.get("/api/creatematch/:gameTitle", function(req, res) {
  gameManager.createNewMatchup(req.params.gameTitle, {
    gameSettings: {},
    p1Timer: {
      type: "Bronstein",
      initialTime: 99 * 60 * 60 * 1000,
      bonusTime: 99 * 60 * 60 * 1000
    },
    p2Timer: {
      type: "Bronstein",
      initialTime: 99 * 60 * 60 * 1000,
      bonusTime: 99 * 60 * 60 * 1000
    },
    isRated: true
  });
  res.redirect("/");
});

router.get("/api/matches/player/:playerId", function(req, res) {
  db.Match.getMatchesForPlayer(req.params.playerId, function(error, matches) {
    if (error) {
      res.status(500).send(error.message);
    } else {
      res.send(matches);
    }
  });
});

router.get("/api/server_time", function(req, res) {
  res.send({time: Date.now()});
});

router.get("/api/activeMatches", function(req, res) {
  res.send(gameManager.getMatchesUserCanJoin(req.session.username));
});

// Sends a login email to the specified address and returns a message describing the action.
// Will send a 400 response if the body is missing either "g-recaptcha-response" or "user".
// Will send a 403 response if the recaptcha verification fails.
// Will send a 500 response if this fails for any other reason.
// body - {
//     user: The email address of the user that wants to login.
//     g-recaptcha-response: The recaptcha token generated by the recaptcha widget.
// }
router.post("/sendToken", function(req, res) {
  var key = req.body["g-recaptcha-response"];
  if (key == null) {
    res.status(400).send("No ReCaptcha information received.");
    return;
  }
  if (req.body.user == null) {
    res.status(400).send("No email received.");
    return;
  }

  https.get(require("../config.json").recaptchaURL + key, onReCaptchaResponse);

  function onReCaptchaResponse(response) {
    var data = "";
    response.on("data", function(chunk) {
      data += chunk.toString();
    });
    response.on("end", function() {
      try {
        var recaptchaResult = JSON.parse(data);
        if (!recaptchaResult.success) {
          res.status(403).send("ReCAPTCHA verification failed.");
          return;
        } else {
          onReCaptchaSuccess();
        }
      } catch(error) {
        res.status(500).send("Unable to parse ReCAPTCHA results.");
        return;
      }
    });
  }

  function onReCaptchaSuccess() {
    passwordless.requestToken(getUserId)(req, res, onEmailSent);
  }

  function getUserId(email, delivery, callback, req) {
    db.User.getOrCreateWithEmail(email, function(error, user) {
      if (error) {
        callback(error, null);
      } else if (!user) {
        callback(new Error("No user found"), null);
      } else {
        console.log(user);
        callback(null, user._id);
      }
    });
  }

  function onEmailSent(error) {
    if (error) {
      res.status(500).send(error.message);
    } else {
      res.send("An email has been sent to " + req.body.user + ".\n"
          + "It might take a few seconds before you receive it.\n"
          + "Remember to check your spam folder." );
    }
  }
});

module.exports = router;
