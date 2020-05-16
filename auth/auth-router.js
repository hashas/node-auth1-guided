// import bcrypt so we can create the hash
const bcrypt = require("bcryptjs")

const router = require("express").Router();
const Users = require("../users/users-model.js");

// POST method that will allow us to register a user, i.e. allow a user to create
// their user account and store to db
router.post("/register", (req, res) => {
  
  // we're going to pass a username and passowrd in the body
  const user = req.body
  // once we have the user object we're going to create the hash. 
  // using the bcrypt module, there's a method called "hash" (which is async,
  // meaning returns promise so need to use try/catch or then/catch) and 
  // ".hashSync" (which is sync, we'll use this now for simplicity).
  //  we're going to hash "user.password" object and specify "8" rounds, 
  // meaning we're hashing the hash of the password, then hash of the hash 2^8 times
  // (this is how bcrypt make hashing longer and more "costly" for an attacker)
  const hash = bcrypt.hashSync(user.password, 8);

  // replace the password we receive in req.body user object with the generated hash
  user.password = hash

  // add the user
  // without the above hash we'd be adding both username and password to our database,
  // instead we're replacing our password with our new hash before it's saved to the db so
  // we save the hash and not the password
  Users.add(user)
  	.then(saved => {
  		res.status(201).json({saved});
  	})
  	.catch(err => {
  		res.status(500).json({message:`problem with db`, error: err})
  	})
});

// POST login
// write a request which takes the username/password guess from the user who's trying to login,
// and compares it to the hash we already have in our db which was generated from the original password
router.post("/login", (req, res) => {
	// take the username and password from the body
	const {username, password} = req.body

	// .findBy() take the username from the req.body and checks if that username exists in our db,
	// if it does exist it will return the username AND hash we have stored for that username,  
	// then we'll use that hash to confirm if the password guess is the same as the original password 
	// that was used

	// .findBy() method (through knex) returns an array because there could be more than one thing
	// that matches which would be a problem for us in this case, so technically we should have a 
	// constraint that says the username is unique

	// the long form way of passing {username} object is "const queryObject = {username: username}"
	Users.findBy({username})
		// for now we'll assume if a user is found its going to come back as the only element in the
		// array, therefore we'll destructure that array to get that object into a variable for us
		.then(([user]) => {
			// check if user is true (i.e. that it exists and is define), AND if it is we're going to 
			// add to our test a call from brcypt called ".compareSync" (we're comparing a hash, 
			// rather than generating) passing the password guess which was sent by the user in the
			// body, and the (hashed) password value that comes from our database
			if (user && bcrypt.compareSync(password, user.password)) {
				// keep track of user's logged-in state, if there's successfully logged in then on the 
				// request object there should already be a "session" object because we're adding it to 
				// every single request that comes in through the global middleware in server.js
				// let's add a 'user' property and assign a username to it (we can put whatever we want
				// in the session object and it will be stored in the store how we've created it using
				// json). if above conditional passes, then this 'user' property will be added to session object  
				// and saved to store so the next time a request comes in with the Id of this session, 
				// our express session middleware will lookup the data and will populate req.session using that
				// which will include our custom data 'user' which we added. This now means every other request
				// that comes in, we have the ability to check for that 'user' object. this 
				// session object on the request object will be populated from the db/memory (depending where
				// our store is)
				req.session.user = username;
				res.status(200).json({message: "welcome!"}); 
			} else {
				res.status(401).json({message: 'invalid creds' });
			}
		})
		// if username does not exist or is not returned
		.catch(err => {
			res.status(500).json({message:`problem with db`, error: err})
		})

})

// GET or DELETE log out
// HTTP method often used for logging out is DELETE because its used for removing session information
// but essentially we don't need to pass anything in to logout, we just need to pass along a cookie so the 
// system knows what session we're using to log out so in our case we can use GET it doesn't matter (in some 
// instances some users can have multiple sessions so it might make sense to use DELETE) ultimately it depends
// on how you design your api/architecture
router.get("/logout", (req, res) => {
	// some requests might include a check to see if session object exists, but in our case
	// every single request that comes in will have a session object because we've added
	// server.use(session(sessionConfig)) as global middleware in server.js that will add session object
	// to every request
	// .destroy() causes session to be removed from memory AND the store so anyone with a cookie with an id
	// for that session who sends that id in, the new session that'll be created for that request will not be
	// populated with what that id represented because it doesn't exist anymore, instead a new session will be
	// created and initialised like any request that doesn't have a cookie (or an invalid cookie), and then
	// the response will contain new session's id in a cookie back to the browser
	req.session.destroy((err) => {
		if (err) {
			res.send("unable to logout");
		} else {
			res.send("logged out");
		}
	})
})

module.exports = router;