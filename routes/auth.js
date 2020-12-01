import express from 'express';
import { body } from 'express-validator';
import { signUp, logIn } from '../controllers/auth';
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

export default router;
