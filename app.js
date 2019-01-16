require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const request = require("request");
const qs = require("querystring");
const randomString = require("randomstring");
const path = require("path");

app.set("view engine", "ejs");
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: randomString.generate(),
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
  })
);

app.get("/", (req, res, next) => {
  res.render("Index");
});

app.get("/login", (req, res, next) => {
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

app.all("/redirect", (req, res) => {
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
      // htmlContent = '<div style="float:center"><ol>';
      // var tabela = JSON.parse(body);

      // for (i = 0; i < tabela.length; i++) {
      //   htmlContent += "<li>" + tabela[i].full_name + "</li>";
      // }
      // htmlContent += "</ol></div>";
      // res.send(
      //   "<center><h2>You're logged in! Here's all your repositories on GitHub: </h2></center>" +
      //     htmlContent +
      //     '<center><p>Go back to <a href="./">log in page</a>.</p><center>' +
      //     "<h4>JSON Format Response</h4>" +
      //     body
      // );

      let htmlContent = `<div class="container"><div id="profile"></div></div>`;
      res.send(body);
    }
  );
});

const port = process.env.PORT || 9000;
const redirect_uri = process.env.HOST + "/redirect";

app.listen(port, () => {
  console.log("Server listening at port " + port);
});