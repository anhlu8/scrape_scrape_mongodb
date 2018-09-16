require('dotenv').config();
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var request = require("request");
var cheerio = require("cheerio");

var PORT = 3000;
var db = require("./models");
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/techcrunchdb";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true
})
.then(connection => {
    console.log('Connected to MongoDB');
})
.catch(error => {
  console.log(error.message);
 });

// Routes
app.get("/", function(req, res) {
    db.Article.find({})
    .then(function(articles) {
        res.render("index", { articles: articles });
    })
    .catch(function(err) {
        res.json(err);
    })
    
})

app.get("/scrape", (req,res) => {
    request("https://techcrunch.com/", function (error, response, html) {
        var $ = cheerio.load(html);
        $(".post-block").each((i, element) => { 
            let result = {};
            let a = $(element).find(".post-block__title__link");
            result.url =  a.attr("href");
            result.title =  a.text().trim();
            let p = $(element).find(".post-block__content");
            result.summary =  p.text().trim();
            db.Article.create(result)
            .then((dbArticle) => {
                console.log(dbArticle);
            })
            .catch(function (err) {
                return res.json(err);
            });
        });
        res.send("Scrape Complete");       
    });
});

// Route for retrieving all populated Articles from the db
app.get("/articles/populated", function (req, res) {
    db.Article.find({})
    .populate("note")
    .then(function (dbArticles) {
        res.json(dbArticles);
    })
    .catch(function (err) {
        res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
    db.Article.findOne({
            _id: req.params.id
        })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({
                _id: req.params.id
            }, {
                note: dbNote._id
            }, {
                new: true
            });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for delete a Note
app.post("/delete/:id/:articleId", function (req, res) {
    db.Note.deleteOne({_id: req.params.id})
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({
                _id: req.params.articleId
            }, {
                note: ''
            }, {
                new: true
            });
        })
        .then(function (dbNote) {
            res.json(dbNote);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});