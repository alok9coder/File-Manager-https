import express from "express";
import bodyParser from "body-parser";
import fs from "node:fs";
import https from "https";
import multer from "multer";
import ejs from "ejs";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import pg from "pg";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";

const app = express();
const port = 7000;
const saltRounds = 15;

// Default Home Directory for the File Manager.
const homeDir = "/home/pi/";
var uploadDir = homeDir;

env.config();

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(passport.initialize());
app.use(passport.session());

const db = new pg.client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

const options = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert"),
};


app.get("/", async (req, res) => {
    const content = {
        pageTitle: "pi-NAS",
    }
    res.render("index.ejs", content);
});

app.get("/home", (req, res) => {
    res.redirect("/");
});

app.get("/login", (req, res) => {
    const content = {
        pageTitle: "Login",
    }
    res.render("login.ejs", content);
});

app.get("/register", (req, res) => {
    const content = {
        pageTitle: "Register Account",
    }
    res.render("register.ejs", content);
});




