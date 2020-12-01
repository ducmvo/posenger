import { validationResult } from 'express-validator';
import fs from 'fs';
import path from 'path';
import Post from '../models/post';
import User from '../models/user';

export const getPosts = async (req, res, next) => {
	const currentPage = req.query.page || 1;
	const perPage = 2;
	let totalItems;
	try {
		const count = await Post.find().countDocuments();
		totalItems = count;
		const posts = await Post.find().populate('creator')
			.skip((currentPage - 1) * perPage)
			.limit(perPage);
		res
			.status(200)
			.json({
				message: 'Posts fetched successfully',
				posts: posts,
				totalItems: totalItems
			});
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const getPost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			const error = new Error('Could not find post');
			setError(error, 404);
			throw err;
		}
		res.status(200).json({ message: 'Post fetched', post: post });
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const createPost = async (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = new Error('Validation failed, entered data is incorrect');
		setError(err, 404);
		throw err;
	}

	if (!req.file) {
		const err = new Err('No image provided');
		setError(err, 404);
		throw err;
	}

	const imageUrl = req.file.path;

	const post = new Post({
		title: req.body.title,
		content: req.body.content,
		imageUrl: imageUrl,
		creator: req.userId
	});

	try {
		await post.save();
		const user = await User.findById(req.userId);
		user.posts.push(post);
		await user.save();
		res.status(201).json({
			message: 'Post created successfully',
			post: post,
			creator: { _id: user._id, name: user.name }
		});
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const updatePost = async (req, res, next) => {
	console.log('post from updatePost', req.post)
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		const err = new Error('Validation failed, entered data is incorrect');
		setError(err, 422);
	}
	const postId = req.params.postId;
	const title = req.body.title;
	const content = req.body.content;

	let imageUrl = req.body.image;
	if (req.file) {
		imageUrl = req.file.path;
	}
	if (!imageUrl) {
		const err = new Error('No file picked');
		setError(err, 422);
		throw err;
	}
	const post = req.post

	if (imageUrl !== post.imageUrl) {
		clearImage(post.imageUrl);
	}
	post.title = title;
	post.imageUrl = imageUrl;
	post.content = content;

	try {
		const result = await post.save();
		res.status(200).json({ message: 'Post updated', post: result });
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

export const deletePost = async (req, res, next) => {
	const postId = req.params.postId;
	try {
		const post = await Post.findById(postId);
		if (!post) {
			const error = new Error('Could not find post');
			setError(error, 404);
			throw error;
		}
		clearImage(post.imageUrl);
		await Post.findByIdAndRemove(postId);
		const user = await User.findById(req.userId)
		user.posts.pull(postId)
		await user.save()
		res.status(200).json({ message: 'Post successfully deleted' });
	} catch (err) {
		setError(err, 500);
		next(err);
	}
};

const setError = (err, code) => {
	if (!err.statusCode) {
		err.statusCode = code;
	}
};

const clearImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => {
		console.log(err);
	});
};
