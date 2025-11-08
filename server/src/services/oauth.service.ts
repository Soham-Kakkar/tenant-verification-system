// Unused for now.
// import passport from 'passport';
// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { config } from '../config';
// import User, { Role } from '../models/user.model';

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: config.googleClientId,
//       clientSecret: config.googleClientSecret,
//       callbackURL: '/auth/google/callback',
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id });
//         if (!user) {
//           // For new users, we need to determine role and scope
//           // This is a simplified version - in production, you'd have a registration flow
//           user = new User({
//             name: profile.displayName,
//             email: profile.emails?.[0].value || '',
//             googleId: profile.id,
//             role: Role.POLICE, // Default role, should be set properly
//           });
//           await user.save();
//         }
//         done(null, user);
//       } catch (error) {
//         done(error as Error, undefined);
//       }
//     }
//   )
// );

// passport.serializeUser((user: any, done) => {
//   done(null, user._id);
// });

// passport.deserializeUser(async (id: string, done) => {
//   try {
//     const user = await User.findById(id);
//     done(null, user);
//   } catch (error) {
//     done(error, null);
//   }
// });

// export default passport;
