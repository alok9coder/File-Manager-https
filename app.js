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
const port = 7777;
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

/*
// HTTPS .key and .cert files
const options = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert"),
};
*/


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

app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

app.get("/auth/google/home/pi",
    passport.authenticate("google", {
        successRedirect: "/home/pi",
        failureRedirect: "/login",
    })
);

app.post("/login",
    passport.authenticate("local", {
        successRedirect: "/home/pi",
        failureRedirect: "/login",
    })
)

app.post("/register-account", async (req, res) => {
    const email = req.body.username;
    const password = req.body.password;

    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1;",
            [email]
        );

        if (checkResult.rows.length > 0) {
            req.redirect("/login");
        } else {
            bcrypt.hash(password, saltRounds, async (error, hash) => {
                if (error) {
                    console.log("Error hashing password: ", error);
                } else {
                    const result = await db.query(
                        "INSERT INTO USERS (email, password) VALUES ($1, $2) RETURNING *;",
                        [email, hash]
                    );
                    const user = result.rows[0];
                    req.login(user, (error) => {
                        console.log("Success");
                        res.redirect("/home/pi");
                    })
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
});

passport.use(
    "local",
    new Strategy(async function verify(username, password, cb) {
        try {
            const result = await db.query("SELECT * FROM users WHERE email = $1;",
                [username]
            );
            if (result.rows.length > 0) {
                const user = result.rows[0];
                const storedHashedPassword = user.password;
                bcrypt.compare(password, storedHashedPassword, (error, valid) => {
                    if (error) {
                        console.log("Error comparing passwords: ", error);
                        return cb(error);
                    } else {
                        if (valid) {
                            return cb(null, user);
                        } else {
                            return cb(null, false);
                        }
                    }
                });
            } else {
                return cb("User not Found!");
            }
        } catch (error) {
            console.log(error);
        }
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

app.listen(port, () => {
    console.log(`HTTP Server Listening on port ${port}`);
});

/*
https.createServer(options, app).listen(port, (req, res) => {
    console.log(`HTTPS Server is Listening on port: ${port}`);
});
*/
