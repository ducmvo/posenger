import express from 'express';
import path from 'path';
import { clearImage } from './util/file';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';
import { graphqlHTTP } from 'express-graphql';
import graphqlSchema from './graphql/schema';
import graphqlResolver from './graphql/resolvers';
import Auth from './middleware/auth';

if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config();
}

const app = express();

const fileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'images');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	}
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

app.use(bodyParser.json());

app.use(
	multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
);

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader(
		'Access-Control-Allow-Methods',
		'GET, POST, PUT, PATCH, DELETE'
	);
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

app.use(Auth);

app.post('/post-image', (req, res) => {
	if (!req.isAuth) {
		throw new Error('Not Authenticated!');
	}
	if (!req.file) {
		return res.status(200).json({ message: 'No file provided' });
	}
	if (req.body.oldPath) {
		clearImage(req.body.oldPath);
	}
	return res
		.status(201)
		.json({ message: 'File stored', filePath: req.file.path });
});

app.use(
	'/graphql',
	graphqlHTTP({
		schema: graphqlSchema,
		rootValue: graphqlResolver,
		graphiql: true,
		customFormatErrorFn: (error) => {
			if (!error.originalError) {
				return error;
			}
			console.log('[error.originalError.data]: ', error.originalError.data);
			console.log('[error.originalError.code]: ', error.originalError.code);
			console.log('[error.originalError.code]: ', error.originalError.message);
			return {
				message: error.originalError.message || 'An error occur',
				code: error.originalError.code || 500,
				data: error.originalError.data
			};
		}
	})
);

app.use((err, req, res, next) => {
	console.log(err);
	const status = err.statusCode || 500;
	const message = err.message;
	const data = err.data;
    res.status(status).json({ message: message, data: data });
    next();
});

mongoose
	.connect(process.env.MGDB, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then(() => {
		app.listen(8080);
	})

	.catch((err) => console.log(err));
