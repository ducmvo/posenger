import Post from '../models/post';

export default async (req, res, next) => {
    const postId = req.params.postId;
    try {
        const post = await Post.findById(postId).populate('creator');
		if (!post) {
			const error = new Error('Could not find post');
			error.statusCode = 401;
			throw error;
        }
        if(req.userId !== post.creator._id.toString()) {
            const error = new Error('Not Authenticated')
            error.statusCode = 401;
            throw error;
        }
        req.post = post
    } catch (err) {
        setError(err, 500)
        next(err);
    }
    next();
    
}

const setError = (err, code) => {
	if (!err.statusCode) {
		err.statusCode = code;
	}
};