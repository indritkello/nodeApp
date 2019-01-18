require("dotenv").config();
const express = require("express");
const app = express();
const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const session = require("express-session");
const request = require("request");
const randomString = require("randomstring");
const path = require("path");

app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  session({
    secret: randomString.generate(),
    cookie: {
      maxAge: 60000
    },
    resave: false,
    saveUninitialized: false
  })
);

let userAccessToken = "";
passport.use(new GitHubStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "/auth/github/callback"
  },
  (accessToken, refreshToken, profile, cb) => {
    userAccessToken = accessToken;
    return cb(null, profile);
  }
));

app.get("/", (req, res, next) => {
  res.render("Index");
});

app.get('/auth/github',
  passport.authenticate('github'));

app.get('/auth/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/'
  }),
  (req, res) => {
    res.redirect('/user');
  });

app.get("/user", (req, res) => {
  request.get({
      url: "https://api.github.com/user/repos",
      headers: {
        Authorization: "token " + userAccessToken,
        "User-Agent": "Kello"
      }
    },
    (error, response, body) => {
      res.render("user", {
        repos: JSON.parse(body)
      });
    }
  );
});

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

const port = process.env.PORT || 9000;

app.listen(port, () => {
  console.log("Server listening at port " + port);
});