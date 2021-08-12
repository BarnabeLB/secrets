//jshint esversion:6
require('dotenv').config();                                                                  // Doit être mis le plus haut possible dans le fichier
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");                                                           // bcrypt permet un hashage avec des rounds de salt (c'est à dire que le hash se retrouve "salé" un certain nombre de fois de suite)
const saltRounds = 10;                                                                      // nombre de round de salt


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
  
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {                      // la méthode .hash() transforme l'input de l'user et retourne un hash avec un certain nombre de round de salt
    const newUser = new User({
      email: req.body.username,
      password: hash,                                                                   // on stock dans la database le hash retourné par la méthode .hash() de bcrypt
    });
  
    newUser.save(function (err) {                                                   
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  })
  
});

app.post("/login", function (req, res) {
  const username = req.body.username;
  const password = req.body.password;                                             

  User.findOne({ email: username},function (err, foundUser) {                      
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          bcrypt.compare(password, foundUser.password, function(err, result) {        // la méthode .compare() l'input de l'user et le hash stocké dans la database. La méthode retourne un booléén
            if (result === true) {                                                    // si, ça valeur est true, c'est que le hash de l'input correspond au hash enregistré
              res.render("secrets");                                                  // on donne donc accès à la page secrète.
            } else {
              console.log(err);
            }
          });
          
        }
      }
    }
  );
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
