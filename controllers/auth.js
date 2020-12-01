import User from '../models/user';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';

export const signUp = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const error = new Error('Validation failed');
		error.statusCode = 422;
		error.data = errors.array();
		throw error;
	}
	const { email, name, password } = req.body;
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email: email,
			password: hashedPassword,
			name: name
		});
		const result = await user.save();
		res.status(201).json({ message: 'User created', userId: result._id });
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const logIn = async (req, res, next) => {
	const email = req.body.email;
	const password = req.body.password;
	let loadedUser;
	try {
		const user = await User.findOne({ email: email });

		if (!user) {
			const error = new Error('A user with this email could not be found.');
			error.statusCode = 401;
			throw error;
		}
		loadedUser = user;
		const isEqual = await bcrypt.compare(password, user.password);

		if (!isEqual) {
			const error = new Error('Wrong password!');
			setError(error, 401);
			throw error;
		}

		const token = jwt.sign(
			{
				email: loadedUser.email,
				userId: loadedUser._id.toString()
			},
			process.env.SKEY,
			{ expiresIn: '1h' }
		);
		res.status(200).json({ token: token, userId: loadedUser._id.toString() });
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const getUserStatus = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		if (!user) {
			const error = new Error('User not found.');
			error.statusCode = 404;
			throw error;
		}
		res.status(200).json({ status: user.status });
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const updateUserStatus = async (req, res, next) => {
	const newStatus = req.body.status;
	try {
		const user = await User.findById(req.userId);
		if (!user) {
			const error = new Error('User not found.');
			error.statusCode = 404;
			throw error;
		}
		user.status = newStatus;
		await user.save();
		res.status(200).json({ message: 'User updated.' });
	} catch (err) {
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

const setError = (err, code) => {
	if (!err.statusCode) {
		err.statusCode = code;
	}
};
