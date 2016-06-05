var express = require("express");
var guest_names = require("./guest_names");
var gameManager = require("./matches/game_manager").prototype.getInstance();
var db = require("./db");
var passwordless = require("passwordless");
var https = require("https");

var router = express.Router();

function fetchUserInformation(req, res, next) {
  if (typeof(res.locals) == "undefined") {
    res.locals = {};
  }
  if (req.user) {
    db.User.findById(req.user, function(error, user) {
      res.locals.user = user;
      next();
    });
  } else {
    next();
  }
}

function checkCredentials(req, res, next) {
  if (res.locals.user) {
    req.session.username = res.locals.user.username;
    req.session.isGuest = false;
    next();
  } else if (!req.session.isGuest) {
    guest_names.getGuestName(function(username) {
      req.session.username = username;
      if (req.session.username == null) {
        req.session.username = req.session.id;
      }
      req.session.isGuest = true;
      next();
    });
  } else {
    next();
  }
}

router.use(fetchUserInformation);
router.use(checkCredentials);

router.get("/", function(req, res) {
  res.render("index", {
      title: "Open Source Abstract Strategy Games",
      username: req.session.username,
      isGuest: req.session.isGuest
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
  } else if (!res.locals.user) {
    res.status(403).send("You must be logged in to change your username.");
  } else {
    res.locals.user.changeUsername(req.body.desiredUsername, function(error, user) {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.send("Username successfully changed to " + user.username + ".");
      }
    });
  }
});

// Creates a new bot for the user.
// Will send a 403 response if no user is logged in.
// Will send a 500 response if this fails for any other reason.
router.post("/api/bots/create_bot", function(req, res) {
  if (!res.locals.user) {
    res.status(403).send("you must be logged in to create a bot.");
  } else {
    db.Bot.createBotForUser(res.locals.user, function(error, bot) {
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
  if (!res.locals.user) {
    res.status(403).send("you must be logged in to request your bots.");
  } else {
    db.Bot.find({owner: res.locals.user}, function(error, bots) {
      if (error) {
        res.status(500).send(error.message);
      } else {
        res.send(bots);
      }
    });
  }
});

function botData(bot, user) {
  var botData = {
    identifier: bot.id,
    owner: {
      identifier: bot.owner.id,
      username: bot.owner.username
    },
    username: bot.username,
    description: bot.description,
  };
  if (user && user.id == bot.owner.id) {
    botData.password = bot.password;
    botData.isMyBot = true;
  } else {
    botData.isMyBot = false;
  }
  return botData;
}

// Get information about the bot with the specified id.
// If the owner of the bot is the one making the request, the response will include the password.
// Will send a 500 response if this fails for any reason.
router.get("/api/bots/:botId", function(req, res) {
  db.Bot.findById(req.params.botId)
      .populate("owner")
      .exec(function(error, bot) {
        if (error) {
          res.status(500).send(error.message);
        } else {
          res.send(botData(bot, res.locals.user));
        }
      });
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
          res.status(500).send(error.message);
        } else if (!res.locals.user || res.locals.user.id != bot.owner.id) {
          res.status(403).send("You cannot change the name of a bot you don't own.");
        } else {
          bot.changeUsername(req.body.desiredUsername, function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(botData(bot, res.locals.user));
            }
          });
        }
      });
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
        } else if (!res.locals.user || res.locals.user.id != bot.owner.id) {
          res.status(403).send("You cannot change the password of a bot you don't own.");
        } else {
          bot.description = req.body.desiredDescription;
          bot.save(function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(botData(bot, res.locals.user));
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
        } else if (!res.locals.user || res.locals.user.id != bot.owner.id) {
          res.status(403).send("You cannot change the password of a bot you don't own.");
        } else {
          bot.generateNewPassword(function(error) {
            if (error) {
              res.status(500).send(error.message);
            } else {
              res.send(botData(bot, res.locals.user));
            }
          });
        }
      });
});

router.get("/api/creatematch/:gameTitle", function(req, res) {
  gameManager.createNewMatchup(req.params.gameTitle, {}, null);
  res.redirect("/");
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

router.get("/logout", passwordless.logout(), function(req, res) {
  res.redirect("/");
});

module.exports = router;
