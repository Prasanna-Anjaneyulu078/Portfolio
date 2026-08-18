/**
 * seed.js — One-time Admin user setup script.
 * Run once from admin/server/ directory:
 *   node seed.js
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env,
 * hashes the password with bcrypt, and upserts the Admin
 * record in MongoDB. Idempotent — safe to run multiple times.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Admin = require('./Models/admin.js');

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGO_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: Missing required env vars: MONGO_URL, ADMIN_EMAIL, ADMIN_PASSWORD');
  process.exit(1);
}

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('Connected.');

    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);

    const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existing) {
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log(`Admin updated: ${ADMIN_EMAIL}`);
    } else {
      await Admin.create({ email: ADMIN_EMAIL.toLowerCase(), passwordHash });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
    }

    console.log('Seed complete. You can now log in.');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
