const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
// import sessions management module/package
const session = require("express-session");
// get instance of knex session store, we get back a method to pass above session object into it
// to give us a configured knexSessionStore object for storing sessions to db
const knexSessionStore = require('connect-session-knex')(session);


const usersRouter = require("../users/users-router.js");
const authRouter = require("../auth/auth-router.js");

const server = express();

// create session config object that we'll pass into session object that we get
// from express-session
const sessionConfig = {
	name: 'chocolate-chip',
	secret: 'myspeshulsecret',
	cookie: {
		maxAge: 3600 * 1000,
		// using http (not https) only for this application for simplicity, should be true
		// in production
		secure: false, 
		// don't provide access to the cookies from a javascript application
		// running in the browsers memory
		// provides access only to the server that created the cookie rather
		// than have javascript application have access to it
		httpOnly: true,
	},
	// when it comes to storing info in db this is good to set to false
	resave: false,
	// whether or not it can save a cookie before it gets user permission e.g. GDPR
	saveUninitialized: false,

	// create a new object from our knexSessionStore that we got from export, and pass in
	// a configuration object
	// so our store is a result of a call to knexSessionStore method, inside we specify how to 
	// connect to database
	// this method is returned from a call to higher order function above that takes our 'session'
	// object as a parameter passed into it
	store: new knexSessionStore(
		{
			// bring in our database configuration, which contains a configured instance of knex
			// from our knexfile.js, which containts the location of our database amongst other things
			// needed to interact with it
			knex: require("../database/dbConfig.js"),
			//specify which table will contain our session data
			tablename: "sessions",
			// specify the name of the column in that table that will contain the session id's
			sidfieldname: "sid", // short for 'session id'
			// this parameter tells the system to create the table if it doesn't already exist
			createtable: true,
			// a property that will specify how often to remove from db sessions that have expired 
			// i.e. clean up
			clearInterval: 3600 * 1000, // once per hour
		}
	)
}

// global middleware stack
server.use(helmet());
server.use(express.json());
server.use(cors());
// the .use() method means its global i.e. its replying to every request
// no matter what the HTTP request is or what the path is
// every single request is going to go through this session middleware
// which will add a session object to the request object that will contain info about
// the session
// so when info comes in either session object will be prepopulated with actual session
// info, assuming the user has the cookie that has a valid id OR it will be a brand new
// session object that doesn't have valid session info in it until we populate it, and
// populating it means putting whatever values/data we want in our session and that data will 
// be stored in the SESSION STORE,
// the only thing that gets sent back to the browser is the sessionId, so there's
// nothing on the browser that is useful to anyone other than sessionId, and its encrypted in the cookie
// contents and only accessible by the server that created it (might be vulnerable 
// to man-in-the-middle attacks, if they're able to look at HTTP requests which is possible but hard) 
// when we end the request (calling .json() or .end())that session info will be committed to store/memory 
// and sessionId will be sent in the cookie back to the browser
server.use(session(sessionConfig));

// by placing 'restricted' method here, every request to the corresponding url 
// will go through 'restricted' method before being passed to the router
// this implementation is 'more global' than just passing it in 'user-router.js'
// this is good if everything in usersRouter needs to be restricted
server.use("/api/users", usersRouter);
server.use("/api/auth", authRouter);

server.get("/", (req, res) => {
  res.json({ api: "up" });
});

module.exports = server;
