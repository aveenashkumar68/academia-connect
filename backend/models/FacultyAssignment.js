import mongoose from 'mongoose';

const facultyAssignmentSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  domain: {
    type: String,
    default: '',
    trim: true,
  },
}, { timestamps: true });

// Prevent duplicate (faculty + department + domain) combinations
facultyAssignmentSchema.index({ faculty: 1, department: 1, domain: 1 }, { unique: true });

// Index for fast lookups by faculty
facultyAssignmentSchema.index({ faculty: 1 });

// Index for lookups by department + domain (finding faculty for a student)
facultyAssignmentSchema.index({ department: 1, domain: 1 });

export default mongoose.model('FacultyAssignment', facultyAssignmentSchema);
