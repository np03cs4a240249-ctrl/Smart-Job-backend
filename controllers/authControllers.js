const bcrypt = require("bcryptjs");
const User = require("../models/User");

// register user
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    console.log("Register body:", req.body);

    // check empty fields
    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields",
      });
    }

    // check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword);

    // create user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    // SAVE TO DATABASE
    await newUser.save();

    console.log("Saved user:", newUser);

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login body:", req.body);

    // 1. check empty fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields"
      });
    }

    // 2. find user in DB
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3. compare plain password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);

    // IMPORTANT:
    // password = what user typed
    // user.password = hashed password stored in DB

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 4. success
    return res.status(200).json({
      success: true,
      message: "Login successful",
      id: user._id,
      fullName: user.fullName,
      email: user.email
    });

  } catch (error) {
    console.log("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

module.exports = { registerUser, loginUser };