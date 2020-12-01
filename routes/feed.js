import express from 'express';
import {body} from 'express-validator';
import { getPosts, getPost, createPost, updatePost, deletePost } from '../controllers/feed';
import isAuth from '../middleware/is-auth';
import isOwner from '../middleware/is-owner';

const router = express.Router();
//GET retrieve all posts
router.get('/posts', isAuth, getPosts)

//POST: create a post
router.post('/posts', isAuth, [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5})

] , createPost)
//GET: retrieve a post
router.get('/posts/:postId', isAuth, getPost);
//PUT: update a post
router.put('/posts/:postId', isAuth, isOwner, [
    body('title').trim().isLength({min:5}),
    body('content').trim().isLength({min:5})
], updatePost)
//DELETE: delete a post
router.delete('/posts/:postId', isAuth, isOwner, deletePost)

export default router;
