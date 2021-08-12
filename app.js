//jshint esversion:6
require('dotenv').config();                                                                  // Doit être mis le plus haut possible dans le fichier
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");                                                  // on require express-session, passport et passport-local-mongoose
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

                                                      


const app = express();



app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.use(session({                                                                             // on setup le package session, avec les options que l'on désire
  secret: process.env.SECRET,                                                                 // la clef de cryptage est dans le fichier des variable d'environnement
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());                                                               // initialisation de passport
app.use(passport.session());                                                                  // et utilisation de passport pour manager notre session

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);                                                       // ce plugin hash et salt pour nous ce qui sera créée avec userSchema



const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());                                                            // utilisation de passport local mongoose pour crééer un identifiant local dans Strategy

passport.serializeUser(User.serializeUser());                                                   // et création d'un passport pour sérialiser et désérialiser les users.
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {                                                                  // méthode qui check s'il existe un cookie d'authentification pour notre browser, si oui l'accès est donné
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

app.post("/register", function (req, res) {
  
    User.register({username: req.body.username}, req.body.password, function(err, user) {       // .register() s'occupe de crééer un élément de liste User pour nous
      if(err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {                                  // "local" est la stratégie d'authentification utilisée, c'est la manière qu'authentifier la request. Envoie un cookie qui permet l'authentification sur les pages requierant une authentification.
          res.redirect("/secrets");
        })
      }
    });
  
  
});

app.post("/login", function (req, res) {

  const user = new User({
    username : req.body.username,
    password : req.body.password
  });

  req.login(user, function(err){                                                                  // .login() est une méthode inclue dans passport, elle se place sur le req de app.post()
    if(err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {                                      // "local" est la stratégie d'authentification utilisée, c'est la manière qu'authentifier la request. Envoie un cookie qui permet l'authentification sur les pages requierant une authentification.
        res.redirect("/secrets");                                                                     
      })
    }
  });
 
});

app.listen(3000, function () {
  console.log("Server started on port 3000.");
});
