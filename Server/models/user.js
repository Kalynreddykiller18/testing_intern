const mongoose = require("mongoose");
const uuid = require("uuid");

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        default: uuid.v4(),
    },
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: String,
        default: null,
    },
});

module.exports = mongoose.model("User", userSchema);
