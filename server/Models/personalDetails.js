const mongoose = require('mongoose')

const personalDetialsSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    bio: { type: String },
    avatarUrl: { type: String }, // Stores the Base64 string or image URL
    githubUrl: { type: String },
    linkedinUrl: { type: String }
})

const personalDetialsModel = new mongoose.model("PersonalDetails", personalDetialsSchema)

module.exports = personalDetialsModel;