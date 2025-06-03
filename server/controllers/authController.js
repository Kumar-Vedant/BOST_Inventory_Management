const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

/* Register user
return status 409: user already exist
      status 201: success
      status 409: Registration Failed
*/
exports.registerUser = async (req, res) => {
  try {
    const { username, password, roles, contactNo } = req.body;

    // Check if user already exists by username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, roles, contactNo });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};


/* Login user
return status 401: Authentication failed
       status 200.json(json token): success
       status 500: Login Failed
*/
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
