const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./src/models/User");


dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect DB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Database connected");

    const email =  process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    // Remove old admin if exists
    await User.findOneAndDelete({ email });
    console.log("🗑️ Old admin removed");

  
    const admin = await User.create({
      name: "Hostel Admin",
      email,
      password,     
      role: "caretaker",
    });

    console.log("✅ Admin created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedAdmin();
