const Complaint = require("../models/Complaint");

// @desc    Create a new complaint
// @route   POST /api/complaints
// @access  Private (Student only)

const createComplaint = async (req, res) => {
  try {
    const { category, description } = req.body;

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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints (with filter, search, pagination)
// @route   GET /api/complaints
// @access  Private

const getComplaints = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search } = req.query;

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

    // Search by Room Number (Regex for partial match)
    if (search) {
      query.roomNumber = { $regex: search, $options: "i" };
    }

    // 2. Server-side Pagination
    // Converting to integers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id/status
// @access  Private (Caretaker only)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    complaint.status = status;
    await complaint.save();

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
};
