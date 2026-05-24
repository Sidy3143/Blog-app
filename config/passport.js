// config/passport.js
const passport = require('passport');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma.js');

var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

var opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey : process.env.JWT_SECRET
}

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: jwt_payload.sub } });
        return user ? done(null, user) : done(null, false);
    } catch (err) {
        return done(err, false);
    }
}));


module.exports = passport;
