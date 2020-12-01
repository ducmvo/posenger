import express from 'express';
import path from 'path';
import feedRoutes from './routes/feed';
import authRoutes from './routes/auth';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import multer from 'multer';

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
	next();
});

// ROUTES
app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
	console.log(err);
	const status = err.statusCode || 500;
    const message = err.message;
    const data = err.data;
	res.status(status).json({ message: message, data:data });
});

mongoose
	.connect(process.env.MGDB, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	})
	.then((result) => {
		app.listen(8080);
	})

	.catch((err) => console.log(err));
