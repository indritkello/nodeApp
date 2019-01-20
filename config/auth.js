module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    req.flash("errorMsg", "You have to log in to view that resource!");
    res.redirect("/users/login");
  }
};
