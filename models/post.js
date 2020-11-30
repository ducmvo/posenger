import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const postSchema = new Schema(
	{
		title: {
			type: String,
			required: true
		},
		imageUrl: {
			type: String || undefined,
			required: true
		},

		content: {
			type: String,
			required: true
		},

		creator: {
			type: Object,
			required: true
		}
	},
	{ timestamp: true }
);

export default mongoose.model('Post', postSchema)