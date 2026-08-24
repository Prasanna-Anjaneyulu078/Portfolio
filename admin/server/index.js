const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore DNS override errors
}

// --- MODELS ---
const personalDetailsModel = require('./Models/personalDetails.js');
const educationModel = require('./Models/educationalDetails.js');
const projectModel = require('./Models/projectDetails.js');
const SkillGroup = require('./Models/skillGroup.js');
const CodingProfile = require('./Models/codingProfile.js');
const Resume = require('./Models/resume.js');
const Certification = require('./Models/certification.js');
const Experience = require('./Models/experience.js');
const Admin = require('./Models/admin.js');
const FileModel = require('./Models/file.js');
const {
  normalizeText,
  normalizeUrl,
  calculateSHA256,
  checkProjectUniqueness,
  checkCertificateUniqueness,
  checkResumeUniqueness
} = require('./utils/uniqueness.js');
const { connectRedis, getCache, setCache, deleteCache, deleteCacheByPattern, closeRedis } = require('./utils/redis.js');

dotenv.config();

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadBase64ToCloudinary = async (base64String, folder = 'portfolio') => {
  if (!base64String || !base64String.startsWith('data:image/')) return base64String;
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folder
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
};

const app = express();

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

// --- MIDDLEWARE ---
app.use(express.json({ limit: '50mb' })); 
// Updated CORS to allow frontend to access the filename header
app.use(cors({
    origin: "*", 
    exposedHeaders: ['Content-Disposition'] 
}));

const PORT = process.env.PORT || 3002;
const MONGO_URL = process.env.MONGO_URL;

const compactFeaturedOrders = async () => {
  try {
    const featuredProjects = await projectModel.find({ isFeatured: true }).sort({ featuredOrder: 1, createdAt: -1 });
    for (let i = 0; i < featuredProjects.length; i++) {
      featuredProjects[i].featuredOrder = i + 1;
      await featuredProjects[i].save();
    }
    return featuredProjects;
  } catch (e) {
    console.error("compactFeaturedOrders error:", e.message);
  }
};

let certificationOrderReady = false;

const normalizeCertificationOrder = async () => {
  certificationOrderReady = false;
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    console.error("Auto-normalization error: MongoDB transactions not supported. Normalization skipped.");
    certificationOrderReady = true;
    return;
  }
  const opts = { session };
  try {
    const certs = await Certification.find().sort({ displayOrder: 1, createdAt: 1, _id: 1 }).session(session);
    let expectedOrder = 1;
    let madeChanges = false;
    for (const cert of certs) {
      if (cert.displayOrder !== expectedOrder || cert.order !== expectedOrder) {
        cert.displayOrder = expectedOrder;
        cert.order = expectedOrder;
        await cert.save(opts);
        madeChanges = true;
      }
      expectedOrder++;
    }
    await session.commitTransaction();
    session.endSession();
    
    if (madeChanges) {
      try { await deleteCache('portfolio:certifications'); } catch(e) { console.error("Cache clear error:", e.message); }
      console.log("Normalized certification orders.");
    }
    certificationOrderReady = true;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Auto-normalization of certifications error:", err.message);
  }
};

const initFeaturedProjects = async () => {
  try {
    const count = await projectModel.countDocuments({ isFeatured: true });
    if (count === 0) {
      const topProjects = await projectModel.find().sort({ createdAt: -1 }).limit(3);
      for (let i = 0; i < topProjects.length; i++) {
        topProjects[i].isFeatured = true;
        topProjects[i].featuredOrder = i + 1;
        await topProjects[i].save();
      }
    }
  } catch (err) {
    console.error("Auto-initialization of featured projects error:", err.message);
  }
};

// --- DB CONNECTION ---
// Lazy cached connection — works for both local server and Vercel serverless
let dbConnected = false;
const connectDB = async () => {
    if (dbConnected && mongoose.connection.readyState === 1) return;
    try {
        await mongoose.connect(MONGO_URL);
        dbConnected = true;
        console.log("MongoDB Connected Successfully");
        await initFeaturedProjects();
        normalizeCertificationOrder().catch(console.error);
        await connectRedis();
        await Certification.syncIndexes().catch(e => console.log("Cert syncIndexes notice:", e.message));
    } catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        throw error;
    }
};

// Middleware to ensure DB is connected before every request
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(503).json({ message: 'Database unavailable' });
    }
});

// --- AUTH MIDDLEWARE ---
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

// --- 0. AUTH ROUTES ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect email or password.' });
    }
    const token = jwt.sign(
      { adminId: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, email: admin.email });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

app.get('/api/auth/verify', requireAuth, (req, res) => {
  res.json({ valid: true, email: req.admin.email });
});

// --- FILE UPLOAD ROUTES ---
app.post('/api/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const newFile = new FileModel({
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      data: req.file.buffer
    });

    const savedFile = await newFile.save();
    
    // Return a persistent URL path relative to the backend
    return res.status(201).json({
      success: true,
      fileUrl: `/api/files/${savedFile._id}`,
      filename: savedFile.filename
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: 'File upload failed', error: err.message });
  }
});

// Public route to access uploaded files
app.get('/api/files/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ message: 'Invalid file ID' });
    }

    const fileDocument = await FileModel.findById(fileId);
    if (!fileDocument) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.set('Content-Type', fileDocument.contentType);
    res.set('Content-Disposition', `inline; filename="${fileDocument.filename}"`);
    res.send(fileDocument.data);
  } catch (err) {
    console.error("File Fetch Error:", err);
    res.status(500).json({ message: 'Server error retrieving file' });
  }
});

// --- ONE-TIME ADMIN SETUP ENDPOINT ---
// Securely creates the admin user in the database.
// Protected by SETUP_SECRET env var — only works once if no admin exists.
// Call via browser: GET /api/auth/setup?secret=YOUR_SETUP_SECRET
app.get('/api/auth/setup', async (req, res) => {
  try {
    const setupSecret = process.env.SETUP_SECRET;
    if (!setupSecret) {
      return res.status(403).json({ message: 'Setup is disabled (SETUP_SECRET not configured).' });
    }
    if (req.query.secret !== setupSecret) {
      return res.status(403).json({ message: 'Invalid setup secret.' });
    }

    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password) {
      return res.status(500).json({ message: 'ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.' });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      // Update the hash (idempotent — safe to re-run)
      const passwordHash = await bcrypt.hash(password, 12);
      existing.passwordHash = passwordHash;
      await existing.save();
      return res.json({ message: `Admin updated successfully: ${email}` });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await Admin.create({ email: email.toLowerCase(), passwordHash });
    return res.json({ message: `Admin created successfully: ${email}. You can now log in.` });
  } catch (err) {
    res.status(500).json({ message: 'Setup failed', error: err.message });
  }
});

// --- 1. PERSONAL DETAILS ROUTES ---
app.get('/api/user', async (req, res) => {
  try {
    const cached = await getCache('portfolio:profile');
    if (cached) return res.json(cached);

    const user = await personalDetailsModel.findOne(); 
    const result = user || {};
    await setCache('portfolio:profile', result, 1800); // 30 mins
    res.json(result); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/user/update', requireAuth, async (req, res) => {
  try {
    if (req.body.avatarUrl) {
      req.body.avatarUrl = await uploadBase64ToCloudinary(req.body.avatarUrl, 'portfolio/avatars');
    }

    const updatedUser = await personalDetailsModel.findOneAndUpdate(
      {}, 
      req.body, 
      { upsert: true, new: true }
    );
    await deleteCache('portfolio:profile');
    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- 2. EDUCATION ROUTES ---
app.get('/api/education', async (req, res) => {
  try {
    const cached = await getCache('portfolio:education');
    if (cached) return res.json(cached);

    let data = await educationModel.findOne();
    const result = data || { academic: [] };
    await setCache('portfolio:education', result, 1800); // 30 mins
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

app.post('/api/update/education', requireAuth, async (req, res) => {
  try {
    const updatedProfile = await educationModel.findOneAndUpdate(
      {}, 
      { academic: req.body.academic }, 
      { new: true, upsert: true, runValidators: true }
    );
    await deleteCache('portfolio:education');
    res.status(200).json(updatedProfile);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
});

// --- 3. PROJECT ROUTES ---
const ALLOWED_CATEGORIES = ['Full Stack', 'Frontend', 'Backend', 'AI / ML', 'Other'];

app.get('/api/projects', async (req, res) => {
  try {
    const { category, featured } = req.query;

    const cacheKey = `portfolio:projects:cat_${category || 'all'}:feat_${featured || 'false'}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    let query = {};
    if (category && category !== 'All' && category !== 'All Types') {
      query.category = category;
    }

    const projects = await projectModel.find(query).sort({ displayPriority: 1, createdAt: -1 });

    let result;
    if (featured === 'true') {
      const featuredProjects = projects.filter(p => p.displayPriority >= 1 && p.displayPriority <= 3);
      result = featuredProjects.length > 0 ? featuredProjects : projects.slice(0, 3);
    } else {
      result = projects;
    }

    await setCache(cacheKey, result, 600); // 10 mins
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err.message });
  }
});

app.post('/api/projects/save', requireAuth, async (req, res) => {
  try {
    const targetId = (req.body._id && mongoose.Types.ObjectId.isValid(req.body._id)) ? req.body._id : null;
    
    if (req.body.imageUrl) {
      req.body.imageUrl = await uploadBase64ToCloudinary(req.body.imageUrl, 'portfolio/projects');
    }
    
    const { _id, title, description, imageUrl, category, codeUrl, demoUrl, techStack, displayPriority, isVisible } = req.body;

    // Field Validation
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    if (!cleanTitle) {
      return res.status(400).json({ success: false, message: "Project title is required", field: "title" });
    }
    if (cleanTitle.length > 120) {
      return res.status(400).json({ success: false, message: "Project title cannot exceed 120 characters", field: "title" });
    }

    const cleanCategory = typeof category === 'string' ? category.trim() : 'Full Stack';
    if (!ALLOWED_CATEGORIES.includes(cleanCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`,
        field: "category"
      });
    }

    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    if (!cleanDescription) {
      return res.status(400).json({ success: false, message: "Summary description is required", field: "description" });
    }
    if (cleanDescription.length > 2000) {
      return res.status(400).json({ success: false, message: "Description cannot exceed 2000 characters", field: "description" });
    }

    // Display Priority Validation
    const numericPriority = Math.max(1, parseInt(displayPriority, 10) || 1);

    // Normalize Tech Stack
    let parsedTechStack = [];
    if (Array.isArray(techStack)) {
      parsedTechStack = techStack.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof techStack === 'string') {
      parsedTechStack = techStack.split(',').map(t => t.trim()).filter(Boolean);
    }
    // Remove duplicates preserving order
    parsedTechStack = [...new Set(parsedTechStack)];

    // Uniqueness Duplicate Check
    const dupCheck = await checkProjectUniqueness(
      projectModel,
      { title: cleanTitle, codeUrl, demoUrl, imageUrl },
      targetId
    );

    if (dupCheck.isDuplicate) {
      return res.status(409).json({
        success: false,
        message: dupCheck.message,
        field: dupCheck.field
      });
    }

    const payload = {
      title: cleanTitle,
      normalizedTitle: dupCheck.normalizedTitle,
      description: cleanDescription,
      imageUrl: imageUrl || '',
      imageHash: dupCheck.imageHash,
      category: cleanCategory,
      codeUrl: codeUrl ? codeUrl.trim() : '',
      normalizedCodeUrl: dupCheck.normalizedCodeUrl,
      demoUrl: demoUrl ? demoUrl.trim() : '',
      normalizedDemoUrl: dupCheck.normalizedDemoUrl,
      techStack: parsedTechStack,
      displayPriority: numericPriority,
      isVisible: typeof isVisible === 'boolean' ? isVisible : true
    };

    let result;
    if (targetId) {
      result = await projectModel.findByIdAndUpdate(targetId, payload, { new: true, runValidators: true });
    } else {
      result = new projectModel(payload);
      await result.save();
    }

    // Normalize all project priorities into a clean 1..N sequence
    const allProjectsList = await projectModel.find().sort({ displayPriority: 1, createdAt: 1 });
    const targetIdStr = result._id.toString();
    const otherProjects = allProjectsList.filter(p => p._id.toString() !== targetIdStr);
    
    const insertIdx = Math.min(Math.max(0, numericPriority - 1), otherProjects.length);
    otherProjects.splice(insertIdx, 0, result);

    for (let i = 0; i < otherProjects.length; i++) {
      if (otherProjects[i].displayPriority !== i + 1) {
        await projectModel.findByIdAndUpdate(otherProjects[i]._id, { displayPriority: i + 1 });
      }
    }

    const updatedResult = await projectModel.findById(result._id);
    await deleteCacheByPattern('portfolio:projects*');
    res.status(200).json(updatedResult);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Project already exists. Please use a unique title."
      });
    }
    res.status(400).json({ success: false, message: "Operation failed", error: err.message });
  }
});

app.delete('/api/projects/:id', requireAuth, async (req, res) => {
  try {
    await projectModel.findByIdAndDelete(req.params.id);
    // Normalize remaining project priorities into clean 1..N sequence
    const remaining = await projectModel.find().sort({ displayPriority: 1, createdAt: 1 });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].displayPriority !== i + 1) {
        await projectModel.findByIdAndUpdate(remaining[i]._id, { displayPriority: i + 1 });
      }
    }
    await deleteCacheByPattern('portfolio:projects*');
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/projects/reorder', requireAuth, async (req, res) => {
  try {
    const { projectId, newPriority } = req.body;
    if (!projectId || !newPriority) {
      return res.status(400).json({ success: false, message: 'projectId and newPriority required' });
    }

    const allProjectsList = await projectModel.find().sort({ displayPriority: 1, createdAt: 1 });
    const targetProject = allProjectsList.find(p => p._id.toString() === projectId.toString());

    if (!targetProject) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const otherProjects = allProjectsList.filter(p => p._id.toString() !== projectId.toString());
    const targetPriorityNum = Math.min(Math.max(1, parseInt(newPriority, 10) || 1), allProjectsList.length);

    otherProjects.splice(targetPriorityNum - 1, 0, targetProject);

    for (let i = 0; i < otherProjects.length; i++) {
      if (otherProjects[i].displayPriority !== i + 1) {
        await projectModel.findByIdAndUpdate(otherProjects[i]._id, { displayPriority: i + 1 });
      }
    }

    const updatedProjects = await projectModel.find().sort({ displayPriority: 1, createdAt: 1 });
    await deleteCacheByPattern('portfolio:projects*');
    res.status(200).json({ success: true, projects: updatedProjects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to update project order', error: err.message });
  }
});

// --- 4. SKILL GROUPS (FULL CRUD) ---
app.post('/api/skill-groups', requireAuth, async (req, res) => {
  try {
    const newGroup = new SkillGroup(req.body);
    const saved = await newGroup.save();
    await deleteCache('portfolio:skills');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Creation failed", details: err.message });
  }
});

app.get('/api/skill-groups', async (req, res) => {
  try {
    const cached = await getCache('portfolio:skills');
    if (cached) return res.json(cached);

    const groups = await SkillGroup.find();
    await setCache('portfolio:skills', groups, 1800);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/skill-groups/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) 
      ? { _id: id } 
      : { title: { $regex: new RegExp(`^${id}$`, "i") } };

    const updated = await SkillGroup.findOneAndUpdate(filter, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Group not found' });
    await deleteCache('portfolio:skills');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/skill-groups/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { title: id };
    await SkillGroup.findOneAndDelete(filter);
    await deleteCache('portfolio:skills');
    res.status(200).json({ message: "Skill group deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- 5. CODING PROFILES ---
app.get('/api/profiles', async (req, res) => {
  try {
    const cached = await getCache('portfolio:coding_profiles');
    if (cached) return res.json(cached);

    const profiles = await CodingProfile.find();
    await setCache('portfolio:coding_profiles', profiles, 1800);
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/sync', requireAuth, async (req, res) => {
  try {
    await CodingProfile.deleteMany({});
    const cleanedData = req.body.map(({ _id, ...rest }) => rest);
    const saved = await CodingProfile.insertMany(cleanedData);
    await deleteCache('portfolio:coding_profiles');
    res.status(200).json(saved);
  } catch (err) {
    res.status(400).json({ error: "Sync failed", details: err.message });
  }
});

// --- 6. RESUME ROUTES (LATEST UPDATED) ---

// Get all resumes for list
app.get('/api/resumes', async (req, res) => {
    try {
        const cached = await getCache('portfolio:resumes');
        if (cached) return res.json(cached);

        const resumes = await Resume.find().sort({ uploadedAt: -1 });
        await setCache('portfolio:resumes', resumes, 600);
        res.json(resumes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Upload/Save resume
app.post('/api/resumes', requireAuth, async (req, res) => {
    try {
        const { fileName, url, isActive } = req.body;
        const dupCheck = await checkResumeUniqueness(Resume, url);

        if (dupCheck.isDuplicate) {
            return res.status(409).json({
                success: false,
                message: dupCheck.message
            });
        }

        if (isActive) {
            await Resume.updateMany({}, { isActive: false });
        }

        const newResume = new Resume({
            fileName,
            url,
            fileHash: dupCheck.fileHash,
            isActive: Boolean(isActive)
        });
        const saved = await newResume.save();
        await deleteCache('portfolio:resumes');
        res.status(201).json(saved);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "This resume file has already been uploaded."
            });
        }
        res.status(400).json({ success: false, message: err.message });
    }
});

// Toggle Active
app.patch('/api/resumes/:id/active', requireAuth, async (req, res) => {
    try {
        await Resume.updateMany({}, { isActive: false });
        const updated = await Resume.findByIdAndUpdate(
            req.params.id, 
            { isActive: true }, 
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Resume ID not found" });
        await deleteCache('portfolio:resumes');
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete Resume
app.delete('/api/resumes/:id', requireAuth, async (req, res) => {
    try {
        await Resume.findByIdAndDelete(req.params.id);
        await deleteCache('portfolio:resumes');
        res.json({ message: "Deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 7. CERTIFICATION ROUTES ---
const handleCertSaveRequest = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    return res.status(503).json({ success: false, message: "MongoDB transactional support is required but unavailable." });
  }
  const opts = { session };

  try {
    const body = req.body || {};
    const titleClean = (body.title || '').trim();
    if (!titleClean) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Certification title is required",
        errors: [{ field: "title", message: "Certification title is required" }]
      });
    }

    const orgClean = (body.issuingOrganization || body.issuer || '').trim();
    const dateClean = (body.issueDate || '').trim();
    const filePayload = body.certificateFileUrl || body.imageUrl || '';
    const rawId = body._id || req.params.id;
    const targetId = (rawId && mongoose.Types.ObjectId.isValid(rawId)) ? rawId : null;
    const finalVis = body.isVisible !== undefined ? Boolean(body.isVisible) : (body.isActive !== undefined ? Boolean(body.isActive) : true);
    
    let totalCerts = await Certification.countDocuments().session(session);
    let maxOrder = targetId ? totalCerts : totalCerts + 1;
    
    let requestedOrder;
    if (body.displayOrder !== undefined && body.displayOrder !== null && body.displayOrder !== "") {
      requestedOrder = parseInt(body.displayOrder, 10);
    } else if (body.order !== undefined && body.order !== null && body.order !== "") {
      requestedOrder = parseInt(body.order, 10);
    } else {
      requestedOrder = maxOrder;
    }

    if (isNaN(requestedOrder)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Display order must be a valid number." });
    }
    
    if (requestedOrder > maxOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: `Display order cannot exceed ${maxOrder}.` });
    }
    if (requestedOrder < 1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: "Display order must be at least 1." });
    }
    
    const parsedOrder = requestedOrder;

    const payload = {
      title: titleClean,
      issuingOrganization: orgClean,
      issuer: orgClean,
      issueDate: dateClean,
      credentialId: (body.credentialId || '').trim(),
      verificationUrl: (body.verificationUrl || '').trim(),
      certificateFileUrl: filePayload,
      imageUrl: filePayload,
      displayOrder: parsedOrder,
      order: parsedOrder,
      isVisible: finalVis,
      isActive: finalVis
    };

    let result;
    if (targetId) {
      const existingCert = await Certification.findById(targetId).session(session);
      if (!existingCert) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ success: false, message: "Certification not found" });
      }
      const currentOrder = existingCert.displayOrder;
      
      if (currentOrder !== parsedOrder) {
        // Temp safe order to avoid unique constraints
        await Certification.findByIdAndUpdate(targetId, { displayOrder: -1, order: -1 }, opts);

        if (parsedOrder < currentOrder) {
          await Certification.updateMany(
            { displayOrder: { $gte: parsedOrder, $lt: currentOrder }, _id: { $ne: targetId } },
            { $inc: { displayOrder: 1, order: 1 } },
            opts
          );
        } else {
          await Certification.updateMany(
            { displayOrder: { $gt: currentOrder, $lte: parsedOrder }, _id: { $ne: targetId } },
            { $inc: { displayOrder: -1, order: -1 } },
            opts
          );
        }
      }
      result = await Certification.findByIdAndUpdate(targetId, payload, { new: true, ...opts });
    } else {
      await Certification.updateMany(
        { displayOrder: { $gte: parsedOrder } },
        { $inc: { displayOrder: 1, order: 1 } },
        opts
      );
      const newCert = new Certification(payload);
      result = await newCert.save(opts);
    }

    await session.commitTransaction();
    session.endSession();
    
    try { await deleteCache('portfolio:certifications'); } catch (ce) { console.error("Cache invalidation failed:", ce.message); }
    return res.status(200).json(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Certification Save Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Failed to save certification",
      errors: [{ field: "general", message: err.message || "Operation failed" }]
    });
  }
};

app.get('/api/certifications', async (req, res) => {
  if (!certificationOrderReady) {
    return res.status(503).json({ message: "Certification ordering is currently being verified. Please try again in a few moments." });
  }
  try {
    const cached = await getCache('portfolio:certifications');
    if (cached) return res.json(cached);

    const certs = await Certification.find().sort({ displayOrder: 1, order: 1, createdAt: -1, _id: 1 });
    await setCache('portfolio:certifications', certs, 600);
    res.json(certs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching certifications", error: err.message });
  }
});

app.post('/api/certifications/save', requireAuth, handleCertSaveRequest);
app.post('/api/certifications', requireAuth, handleCertSaveRequest);
app.put('/api/certifications/save', requireAuth, handleCertSaveRequest);
app.put('/api/certifications/:id', requireAuth, handleCertSaveRequest);

app.delete('/api/certifications/:id', requireAuth, async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (err) {
    return res.status(503).json({ message: "MongoDB transactional support is required but unavailable." });
  }
  const opts = { session };

  try {
    const cert = await Certification.findById(req.params.id).session(session);
    if (!cert) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Certification not found" });
    }
    const deletedOrder = cert.displayOrder;
    await Certification.findByIdAndDelete(req.params.id, opts);
    await Certification.updateMany(
      { displayOrder: { $gt: deletedOrder } },
      { $inc: { displayOrder: -1, order: -1 } },
      opts
    );
    await session.commitTransaction();
    session.endSession();
    
    try { await deleteCache('portfolio:certifications'); } catch (ce) { console.error("Cache invalidation failed:", ce.message); }
    res.json({ message: "Certification deleted successfully" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: err.message });
  }
});

app.patch('/api/certifications/:id/status', requireAuth, async (req, res) => {
  try {
    const cert = await Certification.findById(req.params.id);
    if (!cert) return res.status(404).json({ message: "Certification not found" });
    const newStatus = !(cert.isVisible !== false && cert.isActive !== false);
    cert.isVisible = newStatus;
    cert.isActive = newStatus;
    await cert.save();
    await deleteCache('portfolio:certifications');
    res.json(cert);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- 8. EXPERIENCE ROUTES ---
const validateExperienceData = (data) => {
  const errors = [];
  if (!data.jobTitle || typeof data.jobTitle !== 'string' || !data.jobTitle.trim()) {
    errors.push("Job title is required.");
  }
  if (!data.company || typeof data.company !== 'string' || !data.company.trim()) {
    errors.push("Company name is required.");
  }
  if (!data.startDate || typeof data.startDate !== 'string' || !data.startDate.trim()) {
    errors.push("Start date is required.");
  }
  const isOngoing = Boolean(data.currentlyWorking || data.isCurrentlyWorking);
  if (!isOngoing) {
    if (!data.endDate || typeof data.endDate !== 'string' || !data.endDate.trim()) {
      errors.push("End date is required when not currently working.");
    } else if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        errors.push("End date cannot be earlier than start date.");
      }
    }
  }
  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.push("Description is required.");
  }
  return errors;
};

// GET /api/experiences (Public)
app.get('/api/experiences', async (req, res) => {
  try {
    const cached = await getCache('portfolio:experience');
    if (cached) return res.json(cached);

    const experiences = await Experience.find().sort({
      currentlyWorking: -1,
      startDate: -1,
      createdAt: -1
    });
    await setCache('portfolio:experience', experiences, 600);
    res.json(experiences);
  } catch (err) {
    res.status(500).json({ message: "Error fetching experiences", error: err.message });
  }
});

// GET /api/experiences/:id (Public)
app.get('/api/experiences/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid experience ID" });
    }
    const experience = await Experience.findById(req.params.id);
    if (!experience) {
      return res.status(404).json({ message: "Experience record not found" });
    }
    res.json(experience);
  } catch (err) {
    res.status(500).json({ message: "Error fetching experience details", error: err.message });
  }
});

// Save Experience Handler
const handleSaveExperience = async (req, res) => {
  try {
    const validationErrors = validateExperienceData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ message: validationErrors.join(" ") });
    }

    const { _id, ...expData } = req.body;

    const rawTech = expData.technologies || expData.techStack || expData.technologyStack || expData.tech || expData.tags || expData.skills || [];
    const techArray = Array.isArray(rawTech)
      ? rawTech.flatMap(t => typeof t === 'string' ? t.split(',') : (t?.name || String(t))).map(s => typeof s === 'string' ? s.trim() : '').filter(Boolean)
      : typeof rawTech === 'string'
      ? rawTech.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    expData.technologies = techArray;
    expData.techStack = techArray;

    const rawTargetId = _id || req.params.id;
    const targetId = (rawTargetId && mongoose.Types.ObjectId.isValid(rawTargetId)) ? rawTargetId : null;

    let result;
    if (targetId) {
      result = await Experience.findByIdAndUpdate(targetId, expData, { new: true, runValidators: true });
      if (!result) {
        result = new Experience(expData);
        await result.save();
      }
    } else {
      result = new Experience(expData);
      await result.save();
    }
    await deleteCache('portfolio:experience');
    res.status(200).json(result);
  } catch (err) {
    console.error("Experience Save Error:", err);
    res.status(400).json({ message: "Operation failed", error: err.message });
  }
};

app.post('/api/experiences/save', requireAuth, handleSaveExperience);
app.post('/api/experiences', requireAuth, handleSaveExperience);
app.put('/api/experiences/save', requireAuth, handleSaveExperience);
app.put('/api/experiences/:id', requireAuth, handleSaveExperience);

// DELETE /api/experiences/:id (Protected - Admin)
app.delete('/api/experiences/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid experience ID" });
    }
    const deleted = await Experience.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Experience record not found" });
    await deleteCache('portfolio:experience');
    res.json({ message: "Experience deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Resume download 
// app.get('/api/resume/download', async (req, res) => {
//   try {
//     const activeResume = await Resume.findOne({ isActive: true }) || await Resume.findOne().sort({ uploadedAt: -1 });

//     if (!activeResume || !activeResume.fileData) {
//       // Very important: If this fails, the frontend will catch it in the 'catch' block
//       return res.status(404).send("No resume found"); 
//     }

//     // CLEANING LOGIC: Remove prefix if it exists, otherwise keep as is
//     let base64String = activeResume.fileData;
//     if (base64String.includes(',')) {
//       base64String = base64String.split(',')[1];
//     }

//     const pdfBuffer = Buffer.from(base64String, 'base64');

//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', 'attachment; filename=Resume.pdf');
//     res.setHeader('Content-Length', pdfBuffer.length);
    
//     return res.end(pdfBuffer); // Use .end() for binary data buffers
//   } catch (err) {
//     res.status(500).send("Server Error");
//   }
// });

app.get('/api/resume/download', async (req, res) => {
  try {
    // 1. Get the resume (Active one first, otherwise the latest uploaded one)
    let activeResume = await Resume.findOne({ isActive: true });
    if (!activeResume) {
      activeResume = await Resume.findOne().sort({ uploadedAt: -1 });
    }

    const resumeSource = activeResume ? (activeResume.url || activeResume.fileData) : null;

    // 2. If absolutely no resume exists, return 404
    if (!activeResume || !resumeSource) {
      return res.status(404).json({ message: "No resume found" });
    }

    // 3. Handle HTTP/HTTPS file URLs
    if (typeof resumeSource === 'string' && (resumeSource.startsWith('http://') || resumeSource.startsWith('https://'))) {
      return res.redirect(resumeSource);
    }

    // 4. Clean the Base64 String (Removes 'data:application/pdf;base64,' if present)
    const rawData = resumeSource;
    const base64Data = rawData.includes(',') ? rawData.split(',')[1] : rawData;

    // 5. Convert to Buffer
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    const downloadFileName = activeResume.fileName || 'Resume.pdf';

    // 6. Set explicit headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${downloadFileName}"`,
      'Content-Length': pdfBuffer.length,
    });

    // 7. Send the raw buffer
    return res.status(200).send(pdfBuffer);

  } catch (err) {
    console.error("Download error:", err);
    return res.status(500).json({ message: "Server error during download" });
  }
});

// Start server when run directly (Render, Railway, Heroku, local dev)
if (require.main === module) {
    const http = require('http');
    const server = http.createServer(app).listen(PORT, () =>
        console.log(`Server running on port ${PORT}`)
    );

    const shutdown = async () => {
        console.log('Shutting down server...');
        await closeRedis();
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed.');
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

// For Vercel serverless: export the app
module.exports = app;
