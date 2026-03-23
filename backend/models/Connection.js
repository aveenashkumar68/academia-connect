import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    industryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['contacted', 'accepted', 'declined'],
        default: 'contacted',
    },
    message: {
        type: String,
    }
}, { timestamps: true });

// Prevent duplicate connections between the same student and partner
connectionSchema.index({ student: 1, industryPartner: 1 }, { unique: true });

export default mongoose.model('Connection', connectionSchema);
