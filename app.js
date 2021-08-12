//jshint esversion:6
require('dotenv').config();                                                                  // Doit être mis le plus haut possible dans le fichier
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");                                                  // on require express-session, passport et passport-local-mongoose
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');                                       // method évitant d'avoir à chercher dans la db un user et si seulement il n'y est pas le crééer

                                                      


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
  password: String,
  googleId: String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);                                                       // ce plugin hash et salt pour nous ce qui sera créée avec userSchema
userSchema.plugin(findOrCreate);


const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());                                                            // les strategy sont les différentes façon d'utiliser passport (ces dernières peuvent être "local", "facebook", "google", "instagram")

passport.serializeUser(function(user, done) {                                                   // utilisation de passport mongoose pour crééer un identifiant dans Strategy
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {                                                   // et création d'un passport pour sérialiser et désérialiser les users.
  User.findById(id, function(err, user) {
    done(err, user);
  });
});                                                                                                 


passport.use(new GoogleStrategy({                                                               // on appelle la stratégy google
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets",                                     // url vers laquelle l'user est redirigé une fois authentifier ( doit matcher avec le manager d'api de google)
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"                               // permet d'éviter une erreur dans la transition avec google+
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {                           // une fois l'autorisation donné par google, on enregistre la DB le nouvel user
    return cb(err, user);
  });
}
));

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })                                      // une fois autorisé par google l'accès au profile, google redirect vers /auth/google/secrets
);

app.get("/auth/google/secrets",                                                                // de cette manière la requête google trouve une page
  passport.authenticate("google", { failureRedirect: "/login" }), 
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/secrets", function (req, res) {
  User.find({"secret": {$ne: null}}, function (err, foundUsers) {                               // rechercher dans la liste User, les champs "secret" qui sont {$ne: null} "not equal to null"
      if(err) {
        console.log(err);
      } else {
        if(foundUsers) {
          res.render("secrets", {userWithSecrets: foundUsers});                                 // on affiche la page "secrets" et on envoit à la variable userWithSecrets (présente dans le fichier secrets.ejs la valeur trouvée à l'issu de la recherche dans la DB)
        }
      }
  })                                                            
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {                                                                  // méthode qui check s'il existe un cookie d'authentification pour notre browser, si oui l'accès est donné
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res) {
  const submittedSecret = req.body.secret;

  console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser) {
    if(err) {
      console.log(err);
    } else {
      if(foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
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
