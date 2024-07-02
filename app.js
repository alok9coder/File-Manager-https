import express from "express";
import bodyParser from "body-parser";
import https from "https";
import multer from "multer";
import fs from "node:fs";
import env from "dotenv";
import bcrypt from "bcrypt";
import session from "express-session";
import pg from "pg";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth2";
import DirectoryPath from "./Directory.js";
import { readDir } from "./Directory.js";
import { downloadRoute } from "./DownloadFiles.js";
import DownloadStream from "./DownloadFiles.js";
import { searchFiles } from "./Search.js";

const app = express();
const port = 7777;
const saltRounds = 15;

//const Environment = "Linux";
const Environment = "Windows";

var homeDir = "";

// Default Home Directory for the File Manager.
if (Environment === "Windows") {
    homeDir = "D:/";
} else {
    homeDir = "/home/pi/";
}

var Directory = homeDir;
var uploadDir = Directory;

env.config();

app.use(downloadRoute);

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

const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

db.query(
    `CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY, 
        email VARCHAR(100) UNIQUE NOT NULL, 
        password VARCHAR(1000) NOT NULL
    );`
);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// HTTPS .key and .cert files
const options = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.cert"),
};



app.get("/", async (req, res) => {
    const content = {
        pageTitle: "pi NAS",
        filesAndFolders: readDir(Directory),
        dirPath: `${Directory}`,
    }

    if (req.isAuthenticated()) {
        res.render("index.ejs", content);
    } else {
        res.redirect("/login");
    }
});

app.get("/home", (req, res) => {
    res.redirect("/");
});

app.get("/home/pi", (req, res) => {
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
        pageTitle: "Sign Up",
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
                        "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *;",
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

app.post("/search", async (req, res) => {
    const searchPattern = req.body.search;
    let currDir = req.body.directoryPath;
    
    if (currDir[currDir.length - 1] === "/") {
            currDir = currDir;
    } else {    
            currDir = currDir + "/";
    }

    if (!currDir) {
        currDir = homeDir;
    }

    let searchResults = await searchFiles(searchPattern, currDir);

    const content = {
        pageTitle: "Search Results",
        filesAndFolders: searchResults,
        dirPath: currDir,
        pattern: searchPattern,
        searchResults: true,
        }    

    res.render("index.ejs", content);
});

app.post("/open-folder", (req, res) => {
    let folder = "";
    if (req.body.folderName) {
        folder = req.body.folderName;
    }
    console.log("folder --> ", folder);
    
    let dirPath = req.body.directoryPath;
    console.log("dirPath --> ", dirPath);

    if (dirPath.length < 3 && Environment === "Windows") {
        dirPath = homeDir;
    } else {
        if (dirPath.length < 1) {
            dirPath = homeDir;
        }
    }

    if (req.body.Navigation) {
        const dirPathSplit = dirPath.split("/");
        
        for (let i = dirPathSplit.length - 1; i >= 0; i--) {
            if (dirPathSplit[i] === req.body.Navigation) {
                dirPath = "";
                for (let j = 0; j <= i; j++) {
                    dirPath += dirPathSplit[j] + "/";
                }
                break;
            }
        }
    } else if (folder) {
        dirPath = req.body.directoryPath + folder;
    }

    uploadDir = dirPath;

    const randomNumber = Math.floor(Math.random() * 1 * 1e9) + Math.floor(Math.random() * 1 * 1e9);
    var directory = new DirectoryPath(randomNumber, dirPath, folder);
    directory.printPath();
    const content = directory.readDirectory();
    res.render("index.ejs", content);
});

app.post("/download-file", (req, res) => {
    const uniqueDownloadID = Math.floor(Math.random() * 1 * 1e9) + Math.floor(Math.random() * 1 * 1e9);
    const fileName = req.body.fileName; console.log("Download fileName - ", fileName);
    const filePath = req.body.directoryPath; console.log("Download filePath - ", filePath);

    let count = 0;
    for (let i = fileName.length; i >= 0; i--) {
        if (fileName[i] === ".") {
            break;
        }
        count++;
    }
    const fileFormat = fileName.slice(fileName.length - count);


    res.redirect(`/download/${uniqueDownloadID}`);

    var download = new DownloadStream(uniqueDownloadID, fileFormat, filePath, fileName);
    download.printStream();
    download.createStream();
});

app.post("/upload-files", upload.array("newFiles"), (req, res) => {

    uploadDir = req.body.directoryPath;
    let dirPath = req.body.directoryPath;
    try {
        if (req.files.length > 1) {
            console.log("req.files --> ", req.files);
            console.log("req.body --> ", req.body);
            req.files.forEach((file) => { 
                console.log("req.files.originalname --> ", file.originalname);
                console.log("req.files.size --> ", file.size);
                console.log("req.files.destination --> ", file.destination);
            });

            dirPath = req.files[0].destination;
        } else {
            console.log("req.file --> ", req.files);
            console.log("req.body --> ", req.body);
            console.log("req.file.originalname --> ", req.files[0].originalname);
            console.log("req.file.size --> ", req.files[0].size);
            console.log("req.file.destination --> ", req.files[0].destination);

            dirPath = req.files[0].destination;
        }

        if (req.isAuthenticated()) {
            
            const content = {
                pageTitle: "Pi NAS",
                filesAndFolders: readDir(dirPath),
                dirPath: dirPath + "/",
                }
            
            res.render("index.ejs", content);
        } else {
            res.redirect("/login");
        }
    } catch (error) {
        console.log(error);
        res.json(`Error occured while Uploading the File!\n${error}`);
    }
});

app.post("/create-folder", (req, res) => {
    const folderName = req.body.newFolder;
    const dirPath = req.body.directoryPath;
    console.log("folderName ---> ", folderName);
    console.log("dirPath ---> ", dirPath);

    try {
        if (!fs.existsSync(dirPath + folderName)) {
            fs.mkdirSync(dirPath + folderName);
        }

        const content = {
            pageTitle: "Pi NAS",
            filesAndFolders: readDir(dirPath),
            dirPath: dirPath,
        }

        res.render("index.ejs", content);
    } catch (error) {
        console.log(error);
        res.json(`Error Creating the Folder!\n${error}`);
    }
});

app.post("/delete", (req, res) => {

    fs.rm(dir, { recursive: true, force: true }, error => {
        if (error) {
            console.log(error);
            res.json(`Error Deleting the Folder!\n${error}`);
        } else {
            console.log(`${dir} is Deleted!`);
        }
    });

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

passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: `https://localhost:${port}/auth/google/home/pi`,
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        async (accessToken, refreshToken, profile, cb) => {
            try {
                console.log(profile);
                const result = await db.query(
                    "SELECT * FROM users WHERE email = $1;",
                    [profile.email,]
                );

                if (result.rows.length === 0) {
                    const newUser = await db.query(
                        "INSERT INTO users (email, password) VALUES ($1, $2);",
                        [profile.email, "google"]
                    );
                    return cb(null, newUser.rows[0]);
                } else {
                    return cb(null, result.rows[0]);
                }
            } catch (error) {
                return cb(error);
            }
        }
    )
);

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

https.createServer(options, app).listen(port, (req, res) => {
    console.log(`HTTPS Server is Listening on port: ${port}`);
});

