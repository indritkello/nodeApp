const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

const User = require("../models/User");

router.get("/login", (req, res) => {
  res.render("login");
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })(req, res, next);
});

router.get("/register", (req, res) => {
  res.render("register");
});

router.post("/register", (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({ msg: "Please, fill in all fields!" });
  }
  if (password.length < 6) {
    errors.push({ msg: "Password should be atleast 6 characters!" });
  }
  if (password !== password2) {
    errors.push({ msg: "Passwords do not match!" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password });
  } else {
    User.findOne({ email }).then(user => {
      if (user) {
        errors.push({ msg: "Something went wrong! Please, try again!" });
        res.render("register", { errors, name, email, password, password });
      } else {
        const newUser = new User({
          name,
          email,
          password
        });

        var salt = bcrypt.genSalt(10, (err, salt) =>
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;

            newUser.password = hash;

            newUser
              .save()
              .then(user => {
                req.flash(
                  "successMsg",
                  "Woohoo! You are now successfully registered and can log in!"
                );
                res.redirect("/users/login");
              })
              .catch(err => console.error(err));
          })
        );
      }
    });
  }
});

router.get("/logout", (req, res) => {
  req.logout();
  req.flash("successMsg", "You have been successfully log out!");
  res.redirect("/");
});

module.exports = router;
