var express = require("express");
var guest_names = require("./guest_names");
var gameManager = require("./game_manager").prototype.getInstance();
var db = require("./db");
var passwordless = require("passwordless");
var https = require("https");

var router = express.Router();

function fetchUserInformation(req, res, next) {
  if (typeof(res.locals) == "undefined") {
    res.locals = {};
  }
  db.User.findById(req.user, function(error, user) {
    res.locals.user = user;
    next();
  });
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

router.get("/login", function(req, res) {
  res.render("login", {
      username: req.session.username,
      isGuest: req.session.isGuest
  });
});

router.get("/creatematch/:gameTitle", function(req, res) {
  gameManager.createNewMatchup(req.params.gameTitle, {}, null);
  res.redirect("/");
});

router.get("/match/:gameId", function(req, res) {
  res.render("match", {
      title: req.params.gameId,
      username: req.session.username,
      id: req.params.gameId
  });
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

  https.get(require("../config").recaptchaURL + key, onReCaptchaResponse);

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
      callback(error, user._id);
    });
  }

  function onEmailSent() {
    res.send("An email has been sent to " + req.body.user + "." );
  }
});

router.get("/logout", passwordless.logout(), function(req, res) {
  res.redirect("/");
});

module.exports = router;
