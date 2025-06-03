const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roles: {
    type: String,
    deafult: "User",  //User or Admin  case sensitive
  },
  contactNo: {
    type: String,
    required:true,
  },
});

module.exports = mongoose.model("User", userSchema);
