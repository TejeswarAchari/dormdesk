const express = require('express');
const router = express.Router();
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes here require being logged in
router.use(protect);

// GET /api/complaints - Available to both (Logic inside controller handles scoping)
// POST /api/complaints - Students only
router
  .route('/')
  .get(getComplaints)
  .post(authorize('student'), createComplaint);

// PATCH /api/complaints/:id/status - Caretakers only
router
  .route('/:id/status')
  .patch(authorize('caretaker'), updateComplaintStatus);

module.exports = router;