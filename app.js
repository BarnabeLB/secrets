//jshint esversion:6
require('dotenv').config();                                                                  // Doit être mis le plus haut possible dans le fichier
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");


const app = express();



app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});




const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/register", function (req, res) {
  const newUser = new User({
    email: req.body.username,
    password: md5(req.body.password),                                                  // on stock dans la database un hash du password entré par l'user
  });

  newUser.save(function (err) {                                                   
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = md5(req.body.password);                                              // on transforme l'input grace à la méthode md5()

  User.findOne({ email: username},function (err, foundUser) {                      
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          if (foundUser.password === password) {                                        // si les hashs correspondent
            res.render("secrets");                                                      // on donne accès à la page secrète.
          }
        }
      }
    }
  );
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
