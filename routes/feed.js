import express from 'express';
import {body} from 'express-validator';
import { getPosts, getPost, createPost, updatePost, deletePost } from '../controllers/feed';

const router = express.Router();
//GET retrieve all posts
router.get('/posts', getPosts)

//POST: create a post
router.post('/posts', [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5})

] , createPost)
//GET: retrieve a post
router.get('/posts/:postId', getPost);
//PUT: update a post
router.put('/posts/:postId', [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5})
], updatePost)
//DELETE: delete a post
router.delete('/posts/:postId', deletePost)

export default router;
