import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userImage: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    date: { type: Number, required: true, default: Date.now }
});

const Review = mongoose.models.review || mongoose.model('review', reviewSchema);
export default Review;
