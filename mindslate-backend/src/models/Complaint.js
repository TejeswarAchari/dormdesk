const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Please add a room number'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: ['water', 'electricity', 'internet', 'cleaning', 'furniture', 'other'],
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxLength: 500,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'], 
      default: 'open',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexing for faster queries
complaintSchema.index({ roomNumber: 1 });
complaintSchema.index({ student: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);

