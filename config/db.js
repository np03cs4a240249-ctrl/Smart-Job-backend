// mongodb atlas
// const mongoose = require("mongoose");

// mongoose.connect("mongodb+srv://smartjob_database:Tq7su6yt0EwIm0iq@smartjob.ozh5wdt.mongodb.net/?appName=smartjob_database&retryWrites=true&w=majority")
// .then(() => console.log("MongoDB Connected ✅"))
// .catch(err => console.log(err));

// module.exports = mongoose;



//locally
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/smartjob_db");
    console.log("MongoDB Connected ");
  } catch (error) {
    console.log("Database connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
