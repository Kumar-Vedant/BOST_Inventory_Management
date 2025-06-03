const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// registration
exports.registerUser = async (req, res) => {
  try {
    const { username, password, roles } = req.body;
    // hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, roles });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

// login
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // find user and verify if exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    // pass signed token for authenticated access
    const token = jwt.sign({ userId: user._id, userRoles: user.roles }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};
