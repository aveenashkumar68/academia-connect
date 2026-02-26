import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    authorDepartment: { type: String },

    // Post type
    postType: {
        type: String,
        enum: ['industry', 'academic', 'event', 'job', 'general'],
        default: 'general',
    },

    // Basic fields
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    department: { type: String },
    targetAudience: {
        type: String,
        enum: ['all', 'faculty', 'students', 'both'],
        default: 'all',
    },
    location: { type: String },
    isUrgent: { type: Boolean, default: false },

    // Company / Industry fields
    companyName: { type: String },
    industryName: { type: String },
    contactPerson: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
    website: { type: String },

    // Job specific
    requirements: { type: String },
    experience: { type: String },
    compensation: { type: String },
    duration: { type: String },
    registrationDeadline: { type: Date },

    // Event specific
    eventDate: { type: Date },
    eventTime: { type: String },

    // Tags & engagement
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Post', postSchema);
