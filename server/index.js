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
// Updated CORS to allow frontend to access the filename header
app.use(cors({
    origin: "*", 
    exposedHeaders: ['Content-Disposition'] 
}));

const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL;

// --- DB CONNECTION ---
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        console.log("MongoDB Connected Successfully");
        app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
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
app.post('/api/skill-groups', async (req, res) => {
  try {
    const newGroup = new SkillGroup(req.body);
    const saved = await newGroup.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Creation failed", details: err.message });
  }
});

app.get('/api/skill-groups', async (req, res) => {
  try {
    const groups = await SkillGroup.find();
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// --- 5. CODING PROFILES ---
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await CodingProfile.find();
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/sync', async (req, res) => {
  try {
    await CodingProfile.deleteMany({});
    const cleanedData = req.body.map(({ _id, ...rest }) => rest);
    const saved = await CodingProfile.insertMany(cleanedData);
    res.status(200).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Sync failed", details: err.message });
  }
});

// --- 6. RESUME ROUTES (LATEST UPDATED) ---

// Get all resumes for list
app.get('/api/resumes', async (req, res) => {
    try {
        const resumes = await Resume.find().sort({ uploadedAt: -1 });
        res.json(resumes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upload/Save resume
app.post('/api/resumes', async (req, res) => {
    try {
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

// Toggle Active
app.patch('/api/resumes/:id/active', async (req, res) => {
    try {
        await Resume.updateMany({}, { isActive: false });
        const updated = await Resume.findByIdAndUpdate(
            req.params.id, 
            { isActive: true }, 
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Resume ID not found" });
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

// Resume download 
app.get('/api/resume/download', async (req, res) => {
  try {
    const activeResume = await Resume.findOne({ isActive: true }) || await Resume.findOne().sort({ uploadedAt: -1 });

    if (!activeResume || !activeResume.fileData) {
      // Very important: If this fails, the frontend will catch it in the 'catch' block
      return res.status(404).send("No resume found"); 
    }

    // CLEANING LOGIC: Remove prefix if it exists, otherwise keep as is
    let base64String = activeResume.fileData;
    if (base64String.includes(',')) {
      base64String = base64String.split(',')[1];
    }

    const pdfBuffer = Buffer.from(base64String, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Resume.pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.end(pdfBuffer); // Use .end() for binary data buffers
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
