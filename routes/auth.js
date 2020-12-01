import express from 'express';
import { body } from 'express-validator';
import isAuth from '../middleware/is-auth';
import { signUp, logIn, getUserStatus, updateUserStatus } from '../controllers/auth';
import User from '../models/user';

const router = express.Router();

router.post(
	'/signup',
	[
		body('email')
			.isEmail()
			.withMessage('Please enter a valid email.')
			.custom((value, { req }) => {
				return User.findOne({ email: value }).then((userDoc) => {
					if (userDoc) {
						return Promise.reject('E-Mail address already exists!');
					}
				});
			})
			.normalizeEmail(),
		body('password').trim().isLength({ min: 5 }),
		body('name').trim().not().isEmpty()
	],
	signUp
);

router.post('/login', logIn);

router.get('/status', isAuth, getUserStatus);

router.patch(
  '/status',
  isAuth,
  [
    body('status')
      .trim()
      .not()
      .isEmpty()
  ],
  updateUserStatus
);

export default router;
