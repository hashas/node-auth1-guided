const router = require("express").Router();

const Users = require("./users-model.js");

// import restricted middleware
const restricted = require("../auth/restricted-middleware.js")

// router.get("/", (req, res) => {
// 	// test if session object exists and 'user' property has been populated i.e. on
// 	// successful login this session object will have been populated by our middleware
// 	// with the session that's currently in memory, and it will have a list of these
// 	// sessions because for every request that comes back it will send an id(cookie value)
// 	// for a new session its created, so it can have multiple sessions in memory each with 
// 	// a unique id and then its  up to the client (e.g. postman) to send the correct
// 	// sessionId in
// 	if (req.session && req.session.user) {  
// 	  Users.find()
// 	    .then(users => {
// 	      res.json(users);
// 	    })
// 	    .catch(err => res.send(err));
// 	} else {
// 		// if user is not logged in, then req. does not contain cookie,
// 		// the response will have cookie value however, because our middleware 
// 		// took the session it created for our request, saved it to memory, then 
// 		// return the sessionId, however if we do request again it still won't
// 		// work because when we make the 2nd request we're sending in the new cookie
// 		// value, the server on our side is looking up the session that matches that
// 		// cookie value (encrypted id) and whilst its finding a session that session 
// 		// does not have 'user' property on it becuase our client has not yet gone 
// 		// through our POST login request code
// 		res.status(401).json({ message: 'not logged in' });
// 	}
// });

// extract login into some middleware and put in /auth folder
// to make our code DRY and resuable we can extract the logic and use it in many places.
// add the restricted middleware directly to this router.get call but would need to import
// at the top.
// we can add multiple middleware methods to any route handler inc. custom one we've created
// like here.
// 'restricted will check for 'req.session.user' object and if so call next() will which 
// move on to the custom method we've created (otherwise 'restricted-middleware.js' method 
// will handle the error response for us)
router.get("/", restricted, (req, res) => {

	  Users.find()
	    .then(users => {
	      res.json(users);
	    })
	    .catch(err => res.send(err));
});

module.exports = router;


