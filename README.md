# Hostel Complaint Management System (HostelCMS)

A full-stack web application designed for educational institutions to manage student complaints efficiently. Built with the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

### For Students
- **Secure Authentication:** Register and Login with strict role enforcement.
- **Raise Complaints:** Submit issues with categories (Water, Internet, etc.) and descriptions.
- **Track Status:** View the real-time status (Open, In Progress, Resolved) of submitted complaints.
- **Validation:** Room numbers are automatically linked to student profiles.

### For Caretakers (Admins)
- **Central Dashboard:** View complaints from all students in a paginated table.
- **Advanced Filtering:** Filter by status, category, or search by Room Number (Debounced).
- **Status Management:** Update complaint status instantly.
- **Throttled Refresh:** Safe manual refresh to prevent server overload.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Redux Toolkit, Tailwind CSS v4, Axios, Framer Motion.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose).
- **Security:** - JWT Authentication (stored in HTTPOnly Cookies).
  - Password Hashing (Bcrypt).
  - Rate Limiting (Express-Rate-Limit).
  - Role-Based Access Control (RBAC).

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas URL)

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm start
2. Frontend Setup
Bash
cd frontend
npm install
# Create a .env file (VITE_API_URL=http://localhost:5000/api)
npm run dev
🧠 Approach & Assumptions
Authentication: I chose HTTPOnly Cookies over localStorage for JWT storage to prevent XSS attacks and ensure better security.

Pagination: Implemented Server-Side Pagination to handle large datasets efficiently, rather than loading all data at once.

Debouncing: The search functionality waits 500ms after typing stops before triggering an API call to reduce server load.

Room Numbers: Assumed that a student's room number doesn't change frequently, so it is stored in their profile during registration.

📂 Folder Structure
The project follows a feature-first architecture:

/backend/src/controllers: Business logic.

/backend/src/middlewares: Auth and error handling.

/frontend/src/features: Redux slices (Auth).

/frontend/src/pages: Individual view components.


---

### **Final Checklist: Are we 100% done?**

* [x] **Folder Structure:** Modular and clean.
* [x] **Global Error Boundary:** Implemented.
* [x] **Custom 404:** Implemented.
* [x] **Redux Toolkit:** Implemented.
* [x] **Axios + HTTPS:** Configured with credentials.
* [x] **Tailwind + Vite:** Configured.
* [x] **Mobile First:** Checked responsive classes.
* [x] **Validation:** Regex for email, masked passwords.
* [x] **Debouncing:** Implemented (500ms).
* [x] **Protected Routes:** Implemented.
* [x] **Shimmer UI:** **ADDED NOW.**
* [x] **Throttled Refresh:** **ADDED NOW.**
* [x] **README:** **ADDED NOW.**

You are ready to submit. Good luck, Tejeswar! You have built a production-grade ass