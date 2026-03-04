const Complaint = require("../models/Complaint");
const { VALID_CATEGORIES, VALID_STATUSES } = require('../config/constants');

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student only)
const createComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;

    // Validate inputs
    if (!category || !description) {
      return res.status(400).json({ message: 'Category and description are required' });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({ message: 'Description must be at least 10 characters' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Room number comes from the user profile
    const roomNumber = req.user.roomNumber;

    if (!roomNumber) {
      return res
        .status(400)
        .json({ message: "User profile missing room number" });
    }

    const complaint = await Complaint.create({
      student: req.user.id,
      roomNumber,
      category,
      description,
      status: "open",
    });

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ message: 'Failed to create complaint. Please try again.' });
  }
};

// @desc    Get all complaints (with filter, search, pagination)
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (!Number.isInteger(pageNum) || pageNum < 1 || !Number.isInteger(limitNum) || limitNum < 1 || limitNum > 50) {
      return res.status(400).json({ message: 'Invalid pagination values' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status filter' });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category filter' });
    }

    // 1. Building Query Object
    let query = {};

    // Role-based logic: Students only see their own
    if (req.user.role === "student") {
      query.student = req.user.id;
    }

    // Filter by Status
    if (status) {
      query.status = status;
    }

    // Filter by Category
    if (category) {
      query.category = category;
    }

    // --- FIXED SEARCH LOGIC ---
    if (search) {
      if (req.user.role === "student") {
        // Students search by DESCRIPTION (e.g. "internet not working")
        query.description = { $regex: search, $options: "i" };
      } else {
        // Caretakers search by ROOM NUMBER (e.g. "A-101")
        query.roomNumber = { $regex: search, $options: "i" };
      }
    }

    // 2. Server-side Pagination
    const skip = (pageNum - 1) * limitNum;

    // 3. Executing Query with Mongoose
    const complaints = await Complaint.find(query)
      .sort({ createdAt: -1 }) // Sorting by most recent first
      .skip(skip)
      .limit(limitNum)
      .populate("student", "name email"); // Joining user data to show name

    // Get total count for frontend pagination UI
    const total = await Complaint.countDocuments(query);

    res.json({
      complaints,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error) {
    console.error('Fetch complaints error:', error);
    res.status(500).json({ message: 'Failed to fetch complaints. Please try again.' });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private (Caretaker only)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status is valid enum value
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;
    await complaint.save();

    res.json(complaint);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status. Please try again.' });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
};