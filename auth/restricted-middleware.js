// extracting the logic out of user-router.js and into its own
// file so it can be resuable

module.exports = (req, res, next) => {
	if (req.session && req.session.user) {
		next();
	} else {
		res.status(401).json({ message: 'not logged in'});
	}
}