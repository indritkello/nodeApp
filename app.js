require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const flash = require("connect-flash");
const request = require("request");
const qs = require("querystring");
const randomString = require("randomstring");
const path = require("path");

const port = parseInt(process.env.PORT, 10) || 9000;

// DB Config
const db = require("./config/keys").MongoURI;

// Passport Config
require("./config/passport")(passport);

// Connect to Mongo
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.info("MongoDB connected!"))
  .catch(err => console.error(err));

app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false })); // bodyParser
app.use(flash()); // Connect flash

// let isAuthenticated = false;

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

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sess.cookie.secure = true; // serve secure cookies
}

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Global vars
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.successMsg = req.flash("successMsg");
  res.locals.errorMsg = req.flash("errorMsg");
  res.locals.error = req.flash("error");
  next();
});

app.get("/auth/github", (req, res, next) => {
  req.session.csrf_string = randomString.generate();
  const githubAuthUrl =
    "https://github.com/login/oauth/authorize?" +
    qs.stringify({
      client_id: process.env.CLIENT_ID,
      // redirect_uri: redirect_uri,
      state: req.session.csrf_string
      // scope: 'user:email'
    });
  res.redirect(githubAuthUrl);
});

app.all("/auth/github/callback", (req, res) => {
  const code = req.query.code;
  const returnedState = req.query.state;
  if (req.session.csrf_string === returnedState) {
    request.post(
      {
        url:
          "https://github.com/login/oauth/access_token?" +
          qs.stringify({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: code,
            //redirect_uri: redirect_uri,
            state: req.session.csrf_string
          })
      },
      (error, response, body) => {
        req.session.access_token = qs.parse(body).access_token;
        isAuthenticated = true;
        res.redirect("/user");
      }
    );
  } else {
    res.redirect("/");
  }
});

app.get("/user", (req, res) => {
  request.get(
    {
      url: "https://api.github.com/user/repos",
      headers: {
        Authorization: "token " + req.session.access_token,
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

// app.get("/logout", (req, res) => {
//   req.session.destroy();
//   isAuthenticated = false;
//   res.redirect("/");
// });

// function isLoggedIn(req, res, next) {
//   if (req.session.access_token) return next();
//   res.redirect("/");
// }

// const redirect_uri = process.env.HOST + "/redirect";

// Routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));

app.listen(port, () => {
  console.log("Server listening at port " + port);
});
