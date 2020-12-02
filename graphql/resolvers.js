import User from '../models/user';
import Post from '../models/post';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import { clearImage } from '../util/file';

export default {
	createUser: async function (args) {
		const { userInput } = args;
		const { email, name, password } = userInput;
		const errors = [];
		if (!validator.isEmail(email)) {
			errors.push({ message: 'Email is invalid' });
		}

		if (
			validator.isEmpty(password) ||
			!validator.isLength(password, { min: 5 })
		) {
			errors.push({ message: 'Password too short!' });
		}

		if (errors.length > 0) {
			const error = setError('Invalid input', 422);
			error.data = errors;
			throw error;
		}

		//await will automatically return, use return User.findOne().then()
		const existingUser = await User.findOne({ email: email });
		if (existingUser) {
			const error = new Error('User Exists already!');
			throw error;
		}

		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email: email,
			password: hashedPassword,
			name: name
		});
		const createdUser = await user.save();
		return { ...createdUser._doc, _id: createdUser._id.toString() };
	},

	login: async function (args) {
		const { email, password } = args;
		const user = await User.findOne({ email: email });
		if (!user) {
			const error = setError('User not found', 401);
			throw error;
		}
		const isMatched = await bcrypt.compare(password, user.password);
		if (!isMatched) {
			throw setError('Password is incorrect', 401);
		}
		const token = jwt.sign(
			{
				userId: user._id.toString(),
				email: user.email
			},
			process.env.SKEY,
			{ expiresIn: '1h' }
		);
		return {
			token: token,
			userId: user._id.toString()
		};
	},

	createPost: async function (args, req) {
		if (!req.isAuth) {
			throw setError('Not authenticated!', 401);
		}

		const { postInput } = args;
		const { title, content, imageUrl } = postInput;
		const errors = [];
		if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
			errors.push({ message: 'Title is invalid' });
		}

		if (
			validator.isEmpty(content) ||
			!validator.isLength(content, { min: 5 })
		) {
			errors.push({ message: 'Content is invalid' });
		}

		if (errors.length > 0) {
			const error = new Error('Invalid input');
			error.data = errors;
			error.code = 422;
			throw error;
		}

		const user = await User.findById(req.userId);

		if (!user) {
			throw setError('Invalid user', 401);
		}

		const post = new Post({
			title: title,
			content: content,
			imageUrl: imageUrl,
			creator: user
		});

		const createdPost = await post.save();
		user.posts.push(createdPost);
		await user.save();
		return {
			...createdPost._doc,
			_id: createdPost._id.toString(),
			createdAt: createdPost.createdAt.toISOString(),
			updatedAt: createdPost.updatedAt.toISOString()
		};
	},

	posts: async function (args, req) {
		let { page } = args;
		if (!page) {
			page = 1;
		}
		const perPage = 2;

		if (!req.isAuth) {
			throw setError('Not authenticated!', 401);
		}

		const totalPosts = await Post.find().countDocuments();
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.skip((page - 1) * perPage)
			.limit(perPage)
			.populate('creator');
		return {
			posts: posts.map((p) => ({
				...p._doc,
				_id: p._id.toString(),
				createdAt: p.createdAt.toISOString(),
				updatedAt: p.updatedAt.toISOString()
			})),
			totalPosts: totalPosts
		};
	},

	post: async function (args, req) {
		if (!req.isAuth) {
			throw setError('Not authenticated!', 401);
		}

		let { id } = args;

		if (!req.isAuth) {
			throw setError('Not authenticated!', 401);
		}

		const post = await Post.findById(id).populate('creator');
		if (!post) {
			throw setError('No post found!', 404);
		}
		return {
			...post._doc,
			_id: post._id.toString(),
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString()
		};
	},

	updatePost: async function ({ id, postInput }, req) {
		if (!req.isAuth) {
			const error = new Error('Not authenticated!');
			error.code = 401;
			throw error;
		}
		const post = await Post.findById(id).populate('creator');
		if (!post) {
			const error = new Error('No post found!');
			error.code = 404;
			throw error;
		}
		if (post.creator._id.toString() !== req.userId.toString()) {
			const error = new Error('Not authorized!');
			error.code = 403;
			throw error;
		}
		const errors = [];
		if (
			validator.isEmpty(postInput.title) ||
			!validator.isLength(postInput.title, { min: 5 })
		) {
			errors.push({ message: 'Title is invalid.' });
		}
		if (
			validator.isEmpty(postInput.content) ||
			!validator.isLength(postInput.content, { min: 5 })
		) {
			errors.push({ message: 'Content is invalid.' });
		}
		if (errors.length > 0) {
			const error = new Error('Invalid input.');
			error.data = errors;
			error.code = 422;
			throw error;
		}
		post.title = postInput.title;
		post.content = postInput.content;
		if (postInput.imageUrl !== 'undefined') {
			post.imageUrl = postInput.imageUrl;
		}
		const updatedPost = await post.save();
		return {
			...updatedPost._doc,
			_id: updatedPost._id.toString(),
			createdAt: updatedPost.createdAt.toISOString(),
			updatedAt: updatedPost.updatedAt.toISOString()
		};
	},

	deletePost: async function ({ id }, req) {
		if (!req.isAuth) {
			const error = new Error('Not authenticated!');
			error.code = 401;
			throw error;
		}
		const post = await Post.findById(id);
		if (!post) {
			const error = new Error('No post found!');
			error.code = 404;
			throw error;
		}
		if (post.creator.toString() !== req.userId.toString()) {
			const error = new Error('Not authorized!');
			error.code = 403;
			throw error;
		}
		clearImage(post.imageUrl);
		await Post.findByIdAndRemove(id);
		const user = await User.findById(req.userId);
		user.posts.pull(id);
		await user.save();
		return true;
	},
	user: async function (args, req) {
		if (!req.isAuth) {
			const error = new Error('Not authenticated!');
			error.code = 401;
			throw error;
		}
		const user = await User.findById(req.userId);
		if (!user) {
			const error = new Error('No user found!');
			error.code = 404;
			throw error;
		}
		return { ...user._doc, _id: user._id.toString() };
	},
	updateStatus: async function ({ status }, req) {
		if (!req.isAuth) {
			const error = new Error('Not authenticated!');
			error.code = 401;
			throw error;
		}
		const user = await User.findById(req.userId);
		if (!user) {
			const error = new Error('No user found!');
			error.code = 404;
			throw error;
		}
		user.status = status;
		await user.save();
		return { ...user._doc, _id: user._id.toString() };
	}
};

const setError = (message, code) => {
	const error = new Error(message);
	error.code = code;
	return error;
};
