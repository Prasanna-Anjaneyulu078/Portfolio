const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// --- MODELS ---
const personalDetailsModel = require('./Models/personalDetails.js');
const educationModel = require('./Models/educationalDetails.js');
const projectModel = require('./Models/projectDetails.js');
const SkillGroup = require('./Models/skillGroup.js'); 
const CodingProfile = require('./Models/codingProfile.js');
const Resume = require('./Models/resume.js');

dotenv.config();
const app = express();

// --- MIDDLEWARE ---
app.use(express.json({ limit: '50mb' })); 
app.use(cors());

const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL;

// --- DB CONNECTION ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("MongoDB Connected Successfully");
        app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    } catch (error) {
        console.log("MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};
connectDB();

// --- 1. PERSONAL DETAILS ROUTES ---
app.get('/api/user', async (req, res) => {
  try {
    const user = await personalDetailsModel.findOne(); 
    res.json(user || {}); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/user/update', async (req, res) => {
  try {
    const updatedUser = await personalDetailsModel.findOneAndUpdate(
      {}, 
      req.body, 
      { upsert: true, new: true }
    );
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- 2. EDUCATION & ABOUT ME ROUTES ---
app.get('/api/education', async (req, res) => {
  try {
    let data = await educationModel.findOne();
    if (!data) return res.json({ coreObjective: '', academic: [] });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.post('/api/update/education', async (req, res) => {
  try {
    const updatedProfile = await educationModel.findOneAndUpdate(
      {}, 
      req.body, 
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(updatedProfile);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
});

// --- 3. PROJECT ROUTES ---
app.get('/api/projects', async (req, res) => {
  try {
    const { category } = req.query;
    let query = (category && category !== 'All') ? { category } : {};
    const projects = await projectModel.find(query).sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err.message });
  }
});

app.post('/api/projects/save', async (req, res) => {
  try {
    const { _id, ...projectData } = req.body;
    let result;
    if (_id && mongoose.Types.ObjectId.isValid(_id)) {
      result = await projectModel.findByIdAndUpdate(_id, projectData, { new: true });
    } else {
      result = new projectModel(projectData);
      await result.save();
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: "Operation failed", error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await projectModel.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- 4. SKILL GROUPS (FULL CRUD) ---

// Create New Skill Category
app.post('/api/skill-groups', async (req, res) => {
  try {
    const newGroup = new SkillGroup(req.body);
    const saved = await newGroup.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Creation failed", details: err.message });
  }
});

// Get All Skill Categories
app.get('/api/skill-groups', async (req, res) => {
  try {
    const groups = await SkillGroup.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Skill Category (Flexible ID or Title slug)
app.put('/api/skill-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) 
      ? { _id: id } 
      : { title: { $regex: new RegExp(`^${id}$`, "i") } };

    const updated = await SkillGroup.findOneAndUpdate(filter, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Group not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Skill Category
app.delete('/api/skill-groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { title: id };
    await SkillGroup.findOneAndDelete(filter);
    res.status(200).json({ message: "Skill group deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- 5. CODING PROFILES (SYNC FEATURE) ---

// Get All Profiles
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await CodingProfile.find();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk Sync: Add, Update, and Remove by overwriting collection
app.post('/api/profiles/sync', async (req, res) => {
  try {
    // 1. Remove all old profiles
    await CodingProfile.deleteMany({});
    
    // 2. Prepare new data (remove _id from objects to avoid collision if re-pasting)
    const cleanedData = req.body.map(({ _id, ...rest }) => rest);
    
    // 3. Save the new array
    const saved = await CodingProfile.insertMany(cleanedData);
    res.status(200).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Sync failed", details: err.message });
  }
});

// --- 4. RESUME (FULL CRUD) ---

// Get all resumes
app.get('/api/resumes', async (req, res) => {
    try {
        const resumes = await Resume.find().sort({ uploadedAt: -1 });
        res.json(resumes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upload/Save new resume
app.post('/api/resumes', async (req, res) => {
    try {
        // If this is the first resume, or it's marked active, 
        // deactivate others first
        if (req.body.isActive) {
            await Resume.updateMany({}, { isActive: false });
        }

        const newResume = new Resume(req.body);
        const saved = await newResume.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Toggle Active Status
app.patch('/api/resumes/:id/active', async (req, res) => {
    try {
        // Set all to false
        await Resume.updateMany({}, { isActive: false });
        // Set target to true
        const updated = await Resume.findByIdAndUpdate(
            req.params.id, 
            { isActive: true }, 
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Resume
app.delete('/api/resumes/:id', async (req, res) => {
    try {
        await Resume.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add this to your main server.js
app.get('/api/resume/download', async (req, res) => {
  try {
    const user = await User.findOne(); // Fetches your profile
    if (!user || !user.resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // Assuming user.resume is a Base64 string from your Admin Panel
    // We remove the data URL prefix if it exists
    const base64Data = user.resume.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(base64Data, 'base64');

    // Set headers to tell the browser it's a file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${user.name.replace(/\s+/g, '_')}_Resume.pdf`);
    
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
