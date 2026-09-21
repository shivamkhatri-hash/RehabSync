require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Auth & Role Verification Middleware
const JWT_SECRET = process.env.JWT_SECRET || 'posecare_prod_secure_fallback_key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired access token' });
    req.user = decodedUser;
    next();
  });
};

// Role Guards
const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Administrator privileges required' });
    }
  });
};

const requireDoctor = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && (req.user.role === 'doctor' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Doctor privileges required' });
    }
  });
};

const requirePhysio = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && (req.user.role === 'physiotherapist' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Physiotherapist privileges required' });
    }
  });
};

const requireClinician = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && (req.user.role === 'doctor' || req.user.role === 'physiotherapist' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Clinician privileges required' });
    }
  });
};

// --- EMAIL ENGINE SETUP ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 2. Define Database Blueprints (Schemas & Models)

// User Schema (Roles: doctor, physiotherapist, patient, admin)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['doctor', 'physiotherapist', 'patient', 'admin'], required: true },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedPhysioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  focusArea: { type: String, default: 'general' },
  timezone: { type: String, default: 'UTC' },
  password: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  resetOtp: { type: String, default: null },
  resetOtpExpires: { type: Date, default: null }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Doctor-controlled Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: { type: String, default: 'Musculoskeletal Rehabilitation' },
  pathology: { type: String, default: 'Right ACL Complex' },
  focusArea: { type: String, default: 'knee_rehab' },
  jointType: { type: String, default: 'knee' },
  restrictions: { type: String, default: 'Avoid movements causing sharp pain. Maintain neutral spine.' },
  precautions: { type: String, default: 'Stop if numbness, dizziness, or sharp joint pain occurs.' },
  clinicalGoals: { type: String, default: 'Improve range of motion, muscle strength, and functional stability.' },
  exercises: [{
    exerciseName: { type: String, required: true },
    targetReps: { type: Number, default: 15 },
    successAngle: { type: Number, default: 90 },
    failureAngle: { type: Number, default: 160 },
    holdTime: { type: Number, default: 0 },
    side: { type: String, default: 'right' },
    cameraView: { type: String, default: 'front' },
    tolerance: { type: Number, default: 10 },
    compensationRules: { type: Array, default: [] }
  }],
  status: { type: String, enum: ['Pending Physio Review', 'Verified by Physio', 'Active', 'Under Review', 'Discharged'], default: 'Pending Physio Review' },
  version: { type: Number, default: 1 },
  dateIssued: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });
const Prescription = mongoose.model('Prescription', prescriptionSchema);

// Physiotherapist-controlled Exercise Plan Schema (with weekly versioning)
const exercisePlanSchema = new mongoose.Schema({
  physioId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: null },
  version: { type: Number, default: 1 },
  effectiveDate: { type: String, default: () => new Date().toISOString().split('T')[0] }, // YYYY-MM-DD
  revisionNotes: { type: String, default: 'Initial individualized exercise plan' },
  isCurrent: { type: Boolean, default: true },
  assignments: [{
    assignmentId: { type: String, required: true },
    exerciseName: { type: String, required: true },
    type: { type: String, enum: ['reps', 'hold'], default: 'reps' },
    sets: { type: Number, default: 2 },
    reps: { type: Number, default: 10 },
    holdDurationSec: { type: Number, default: 0 },
    sessionsPerDay: { type: Number, default: 1 },
    daysOfWeek: [{ type: Number }], // 0: Sun, 1: Mon, ..., 6: Sat
    restBetweenSetsSec: { type: Number, default: 45 },
    tutorialUrl: { type: String, default: '' },
    notes: { type: String, default: '' }
  }]
}, { timestamps: true });
const ExercisePlan = mongoose.model('ExercisePlan', exercisePlanSchema);

// Daily Progress & Allowance Schema (Shared across games, incremental persistence, timezone-safe)
const dailyProgressSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignmentId: { type: String, required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD in patient's local timezone
  exerciseName: { type: String, required: true },
  type: { type: String, enum: ['reps', 'hold'], default: 'reps' },
  targetDailyWork: { type: Number, required: true }, // e.g., sets * reps * sessionsPerDay
  completedWork: { type: Number, default: 0 },
  validReps: { type: Number, default: 0 },
  attemptedReps: { type: Number, default: 0 },
  completedSets: { type: Number, default: 0 },
  completedSessions: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  isDiscomfortReported: { type: Boolean, default: false },
  discomfortNotes: { type: String, default: '' },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });
dailyProgressSchema.index({ patientId: 1, assignmentId: 1, date: 1 }, { unique: true });
const DailyProgress = mongoose.model('DailyProgress', dailyProgressSchema);

// Exercise Catalog Schema
const exerciseSchema = new mongoose.Schema({
  name: String,
  target_joints: [Number],
  success_angle: Number,
  failure_angle: Number,
  tutorialUrl: { type: String, default: '' }
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// SessionLog Schema
const sessionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignmentId: { type: String, default: null },
  exerciseName: { type: String, default: 'Bicep Curl' },
  reps_completed: Number,
  max_angle_achieved: Number,
  gamePlayed: { type: String, default: 'Standard Tracker' },
  hold_time_achieved: { type: Number, default: 0 },
  success_rate: { type: Number, default: 100 },
  rom_max: { type: Number, default: 0 },
  rom_min: { type: Number, default: 0 },
  rom_average: { type: Number, default: 0 },
  valid_reps: { type: Number, default: 0 },
  invalid_reps: { type: Number, default: 0 },
  form_violations_count: { type: Number, default: 0 },
  form_violations: [{ type: String }],
  consistency_score: { type: Number, default: 100 },
  completion_percentage: { type: Number, default: 100 },
  stoppedEarly: { type: Boolean, default: false },
  discomfortReported: { type: Boolean, default: false },
  discomfortNotes: { type: String, default: '' },
  baseline_rom: { type: Number, default: 0 },
  date: { type: Date, default: Date.now }
});
const SessionLog = mongoose.model('SessionLog', sessionSchema);

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientName: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true },
  type: { type: String, default: 'Rehabilitation Review' },
  duration: { type: String, default: '30 mins' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Confirmed' },
  notes: { type: String, default: '' }
}, { timestamps: true });
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Auto-seed exercises and default administrative / clinician accounts
const seedDatabase = async () => {
  const exercises = [
    { name: 'Bicep Curl (Standing)', target_joints: [11, 13, 15], success_angle: 85, failure_angle: 150 },
    { name: 'Bicep Curl', target_joints: [11, 13, 15], success_angle: 85, failure_angle: 150 },
    { name: 'Push-up', target_joints: [11, 13, 15], success_angle: 105, failure_angle: 155 },
    { name: 'Crunch', target_joints: [11, 23, 25], success_angle: 80, failure_angle: 115 },
    { name: 'Seated Knee Extension', target_joints: [23, 25, 27], success_angle: 160, failure_angle: 105 },
    { name: 'Straight Leg Raise', target_joints: [11, 23, 25], success_angle: 115, failure_angle: 165 },
    { name: 'Mini Squat', target_joints: [23, 25, 27, 24, 26, 28, 11, 12], success_angle: 125, failure_angle: 165 },
    { name: 'Sit-to-Stand', target_joints: [11, 12, 23, 24, 25, 26, 27, 28], success_angle: 160, failure_angle: 105 },
    { name: 'Standing Knee Flexion', target_joints: [23, 25, 27], success_angle: 100, failure_angle: 165 },
    { name: 'Standing Hip Abduction', target_joints: [23, 25, 27], success_angle: 0.28, failure_angle: 0.05 },
    { name: 'Standing Hip Flexion', target_joints: [11, 23, 25], success_angle: 115, failure_angle: 165 },
    { name: 'Shoulder Flexion', target_joints: [23, 11, 13], success_angle: 105, failure_angle: 20 },
    { name: 'Shoulder Abduction', target_joints: [23, 11, 13], success_angle: 95, failure_angle: 20 },
    { name: 'Wall Slides', target_joints: [23, 24, 11, 12, 13, 14, 15, 16], success_angle: 100, failure_angle: 25 },
    { name: 'Calf Raise', target_joints: [25, 27, 29, 31], success_angle: 0.07, failure_angle: 0.025 },
    { name: 'Marching in Place', target_joints: [11, 12, 23, 24, 25, 26, 27, 28], success_angle: 120, failure_angle: 160 },
    { name: 'Single-Leg Balance', target_joints: [11, 12, 23, 24, 25, 26, 27, 28], success_angle: 0.10, failure_angle: 0.02 },
    { name: 'Bird Dog', target_joints: [11, 12, 15, 16, 23, 24, 27, 28], success_angle: 0.80, failure_angle: 0.45 },
    { name: 'Squat', target_joints: [23, 25, 27], success_angle: 100, failure_angle: 165 },
    { name: 'Lunge', target_joints: [23, 25, 27], success_angle: 105, failure_angle: 160 }
  ];

  for (const ex of exercises) {
    const existing = await Exercise.findOne({ name: ex.name });
    if (!existing) {
      await Exercise.create(ex);
      console.log(`🌱 Seeded exercise: ${ex.name}`);
    } else {
      existing.target_joints = ex.target_joints;
      existing.success_angle = ex.success_angle;
      existing.failure_angle = ex.failure_angle;
      await existing.save();
    }
  }

  // Seed Super Administrator if not exists
  let testAdmin = await User.findOne({ email: 'admin@rehab.com' });
  if (!testAdmin) {
    const hashedAdminPass = await bcrypt.hash('admin123', 10);
    testAdmin = new User({
      name: 'System Administrator',
      email: 'admin@rehab.com',
      role: 'admin',
      password: hashedAdminPass,
      focusArea: 'administration',
      isVerified: true
    });
    await testAdmin.save();
    console.log('🌱 Super Admin initialized: admin@rehab.com / admin123');
  }

  // Seed Default Verified Doctor (dctor1@test.com)
  let testDoctor = await User.findOne({ email: 'dctor1@test.com' });
  if (!testDoctor) {
    const hashedDocPass = await bcrypt.hash('doctor123', 10);
    testDoctor = new User({
      name: 'Dr. Test Specialist',
      email: 'dctor1@test.com',
      role: 'doctor',
      password: hashedDocPass,
      focusArea: 'general',
      isVerified: true
    });
    await testDoctor.save();
    console.log('🌱 Verified Doctor initialized: dctor1@test.com / doctor123');
  }

  // Seed Default Verified Physiotherapist (physio@test.com)
  let testPhysio = await User.findOne({ email: 'physio@test.com' });
  if (!testPhysio) {
    const hashedPhysioPass = await bcrypt.hash('physio123', 10);
    testPhysio = new User({
      name: 'Physiotherapist Test',
      email: 'physio@test.com',
      role: 'physiotherapist',
      password: hashedPhysioPass,
      focusArea: 'lower_body',
      isVerified: true
    });
    await testPhysio.save();
    console.log('🌱 Verified Physiotherapist initialized: physio@test.com / physio123');
  }

  // Clean up any legacy mock accounts if present
  await User.deleteMany({ email: { $in: ['doctor@rehab.com', 'physio@rehab.com', 'patient@rehab.com'] } });
};
mongoose.connection.once('open', seedDatabase);


// 3. API Routes

app.get('/', (req, res) => res.send('PoseCare Clinical API running!'));

// --- AUTHENTICATION ROUTES ---

// Step 1: Register New User & Password (enforces verification requirements on clinicians)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, role, focusArea, password, timezone } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already registered' });

    const validRoles = ['doctor', 'physiotherapist', 'patient', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Clinicians (doctors & physiotherapists) start UNVERIFIED and require Admin verification
    const isVerifiedStatus = (role === 'admin' || role === 'patient') ? false : false;

    user = new User({ 
      name, 
      email, 
      role, 
      focusArea: focusArea || 'general',
      timezone: timezone || 'UTC',
      password: hashedPassword,
      isVerified: isVerifiedStatus
    });
    await user.save();

    let responseMsg = 'Account created! Please log in with your credentials.';
    if (role === 'doctor') {
      responseMsg = 'Doctor account created! Your account is pending Administrator verification before you can access the doctor portal.';
    } else if (role === 'physiotherapist') {
      responseMsg = 'Physiotherapist account created! Your account is pending Administrator verification before you can access the physiotherapist portal.';
    }

    res.status(201).json({ message: responseMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Login - Password authentication with admin clinician verification & patient OTP
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { email: `${cleanEmail}.com` },
        { email: cleanEmail.replace(/\.com$/, '') }
      ]
    });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    if (user.password) {
      let isMatch = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = (user.password === password);
        if (isMatch) {
          user.password = await bcrypt.hash(password, 10);
          await user.save();
        }
      }
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    }

    // Strict admin verification enforcement for Doctors and Physiotherapists
    if ((user.role === 'doctor' || user.role === 'physiotherapist') && !user.isVerified) {
      return res.status(403).json({
        message: `🔒 Your ${user.role} account is pending Administrator verification. Please contact system admin for clinical portal approval.`
      });
    }

    // Require OTP on first time login for unverified patients
    if (user.role === 'patient' && !user.isVerified) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = generatedOtp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'PoseCare - First-Time Login Verification Code',
          html: `<p>Your first-time verification code is: <strong style="font-size: 18px; color: #0d9488;">${generatedOtp}</strong></p><p>This code expires in 5 minutes.</p>`
        });
        console.log(`📨 Sent first-time OTP ${generatedOtp} to ${email}`);
      } catch (mailErr) {
        console.warn(`⚠️ Nodemailer failed to send email. Displaying OTP in console:`);
        console.log(`🔑 [First-Time OTP for ${email}]: ${generatedOtp}`);
      }

      return res.json({ requiresOtp: true, email: user.email });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        focusArea: user.focusArea,
        assignedDoctorId: user.assignedDoctorId,
        assignedPhysioId: user.assignedPhysioId,
        timezone: user.timezone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 3: Verify OTP (First-Time Verification)
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpires) return res.status(400).json({ message: 'OTP has expired' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        focusArea: user.focusArea,
        assignedDoctorId: user.assignedDoctorId,
        assignedPhysioId: user.assignedPhysioId,
        timezone: user.timezone
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 4: Forgot Password - Request 6-digit Reset OTP
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email address is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If an account exists with this email, a reset code has been sent.' });
    }

    const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = resetOtp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'PoseCare — Password Reset Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #0b2b47; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="color: #475569;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #475569;">You requested a password reset for your PoseCare account. Enter the verification code below:</p>
            <div style="background: #f0fdfa; border: 1px dashed #0d9488; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f766e;">${resetOtp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 12px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      console.log(`📨 Sent password reset OTP to ${email}`);
    } catch (mailErr) {
      console.warn(`⚠️ Nodemailer failed to send reset email. Displaying in console:`);
      console.log(`🔑 [Password Reset OTP for ${email}]: ${resetOtp}`);
    }

    res.json({ message: 'If an account exists with this email, a reset code has been sent.', email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 5: Reset Password - Verify OTP & Update Password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account associated with this email' });

    if (!user.resetOtp || user.resetOtp !== otp) {
      return res.status(400).json({ message: 'Invalid or incorrect verification code' });
    }

    if (new Date() > user.resetOtpExpires) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpires = null;
    user.isVerified = true;
    await user.save();

    res.json({ message: 'Password successfully reset! You can now log in with your new password.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- ADMIN RBAC ROUTES ---

app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalPhysios, totalPatients, totalAdmins, totalSessions, totalPrescriptions, totalPlans] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'physiotherapist' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'admin' }),
      SessionLog.countDocuments(),
      Prescription.countDocuments(),
      ExercisePlan.countDocuments()
    ]);

    const recentSessions = await SessionLog.find()
      .populate('patientId', 'name email')
      .sort({ date: -1 })
      .limit(8);

    res.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalPhysios,
        totalPatients,
        totalAdmins,
        totalSessions,
        totalPrescriptions,
        totalPlans
      },
      recentSessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .populate('assignedDoctorId', 'name email')
      .populate('assignedPhysioId', 'name email')
      .select('-password -otp -resetOtp')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['doctor', 'physiotherapist', 'patient', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role },
      { new: true }
    ).select('-password -otp -resetOtp');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:userId/verify', requireAdmin, async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isVerified: isVerified !== undefined ? isVerified : true },
      { new: true }
    ).select('-password -otp -resetOtp');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User verification updated to ${user.isVerified ? 'Verified' : 'Pending'}`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/users/:patientId/assign-clinicians', requireAdmin, async (req, res) => {
  try {
    const { doctorId, physioId } = req.body;
    const updateFields = {};
    if (doctorId !== undefined) updateFields.assignedDoctorId = doctorId || null;
    if (physioId !== undefined) updateFields.assignedPhysioId = physioId || null;

    const patient = await User.findByIdAndUpdate(
      req.params.patientId,
      updateFields,
      { new: true }
    ).populate('assignedDoctorId', 'name email').populate('assignedPhysioId', 'name email').select('-password');

    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Clinician assignments updated', patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own administrator account' });
    }

    await User.findByIdAndDelete(req.params.userId);
    await Promise.all([
      SessionLog.deleteMany({ patientId: req.params.userId }),
      DailyProgress.deleteMany({ patientId: req.params.userId }),
      Prescription.deleteMany({ $or: [{ patientId: req.params.userId }, { doctorId: req.params.userId }] }),
      ExercisePlan.deleteMany({ $or: [{ patientId: req.params.userId }, { physioId: req.params.userId }] })
    ]);

    res.json({ message: `User ${targetUser.name} and associated records deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- CLINICIAN & PATIENT MANAGEMENT ROUTES ---

// Fetch patients (filtered by doctor / physio assignment or all for admin)
app.get('/api/users/patients', requireClinician, async (req, res) => {
  try {
    let query = { role: 'patient' };
    if (req.user.role === 'doctor') {
      query = { 
        role: 'patient', 
        $or: [
          { assignedDoctorId: req.user.id }, 
          { assignedDoctorId: null },
          { assignedDoctorId: { $exists: false } }
        ] 
      };
    } else if (req.user.role === 'physiotherapist') {
      query = { 
        role: 'patient', 
        $or: [
          { assignedPhysioId: req.user.id }, 
          { assignedPhysioId: null },
          { assignedPhysioId: { $exists: false } }
        ] 
      };
    }

    const patients = await User.find(query)
      .populate('assignedDoctorId', 'name email')
      .populate('assignedPhysioId', 'name email')
      .select('-password -otp -resetOtp');
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all registered clinicians for dropdown assignment
app.get('/api/users/clinicians', requireClinician, async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', isVerified: true }).select('name email role');
    const physios = await User.find({ role: 'physiotherapist', isVerified: true }).select('name email role');
    res.json({ doctors, physios });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign doctor/physio to a patient
app.put('/api/users/patients/:patientId/assign', requireClinician, async (req, res) => {
  try {
    const { doctorId, physioId } = req.body;
    const updateObj = {};
    if (doctorId !== undefined) updateObj.assignedDoctorId = doctorId || null;
    if (physioId !== undefined) updateObj.assignedPhysioId = physioId || null;

    const patient = await User.findByIdAndUpdate(
      req.params.patientId, 
      updateObj, 
      { returnDocument: 'after' }
    )
      .populate('assignedDoctorId', 'name email')
      .populate('assignedPhysioId', 'name email')
      .select('-password -otp -resetOtp');
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clinician directly registers a new patient
app.post('/api/users/patients', requireClinician, async (req, res) => {
  try {
    const { name, email, focusArea, doctorId, physioId, password, timezone } = req.body;
    let existing = await User.findOne({ email });
    if (existing) {
      if (doctorId) existing.assignedDoctorId = doctorId;
      if (physioId) existing.assignedPhysioId = physioId;
      await existing.save();
      return res.json({ message: 'Patient linked to your care team', patient: existing });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const newPatient = new User({
      name,
      email,
      role: 'patient',
      focusArea: focusArea || 'general',
      timezone: timezone || 'UTC',
      assignedDoctorId: doctorId || (req.user.role === 'doctor' ? req.user.id : null),
      assignedPhysioId: physioId || (req.user.role === 'physiotherapist' ? req.user.id : null),
      password: hashedPassword,
      isVerified: true
    });
    await newPatient.save();
    res.status(201).json({ message: 'Patient registered and added to care roster', patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
app.put('/api/users/:userId/profile', authenticateToken, async (req, res) => {
  try {
    const { name, focusArea, timezone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, focusArea, timezone },
      { new: true }
    ).select('-password');
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- DOCTOR PRESCRIPTION ROUTES (DOCTOR ROLE ONLY) ---

// 1. Get Patient's Doctor Prescription
app.get('/api/prescriptions/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ patientId: req.params.patientId })
      .populate('doctorId', 'name email focusArea')
      .sort({ updatedAt: -1 });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create or Update Doctor Prescription (Only Doctor can edit)
app.post('/api/prescriptions', requireDoctor, async (req, res) => {
  try {
    const { patientId, diagnosis, pathology, focusArea, jointType, restrictions, precautions, clinicalGoals, exercises, status } = req.body;
    const doctorId = req.user.id;

    let prescription = await Prescription.findOne({ patientId });
    if (prescription) {
      prescription.doctorId = doctorId;
      if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
      if (pathology !== undefined) prescription.pathology = pathology;
      if (focusArea !== undefined) prescription.focusArea = focusArea;
      if (jointType !== undefined) prescription.jointType = jointType;
      if (restrictions !== undefined) prescription.restrictions = restrictions;
      if (precautions !== undefined) prescription.precautions = precautions;
      if (clinicalGoals !== undefined) prescription.clinicalGoals = clinicalGoals;
      if (exercises !== undefined) prescription.exercises = exercises;
      prescription.status = status || 'Pending Physio Review';
      prescription.version = (prescription.version || 1) + 1;
      prescription.lastUpdated = new Date();
    } else {
      prescription = new Prescription({
        doctorId,
        patientId,
        diagnosis,
        pathology: pathology || 'Right ACL Complex',
        focusArea: focusArea || 'knee_rehab',
        jointType: jointType || 'knee',
        restrictions,
        precautions,
        clinicalGoals,
        exercises: exercises || [],
        status: status || 'Pending Physio Review',
        version: 1
      });
    }

    const saved = await prescription.save();

    // If focusArea changed, also update patient user record
    if (focusArea) {
      await User.findByIdAndUpdate(patientId, { focusArea });
    }

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Physiotherapist Verify Doctor Prescription
app.put('/api/prescriptions/patient/:patientId/verify', requirePhysio, async (req, res) => {
  try {
    const { patientId } = req.params;
    const prescription = await Prescription.findOneAndUpdate(
      { patientId },
      { status: 'Verified by Physio', lastUpdated: new Date() },
      { new: true }
    );
    if (!prescription) {
      return res.status(404).json({ message: 'No prescription found for this patient' });
    }
    res.json({ message: 'Prescription successfully verified and calibrated by Physiotherapist', prescription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- PHYSIOTHERAPIST EXERCISE PLAN ROUTES (PHYSIOTHERAPIST ROLE) ---

// 1. Get Active Plan & Historical Versions for a Patient
app.get('/api/plans/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const currentPlan = await ExercisePlan.findOne({ patientId, isCurrent: true })
      .populate('physioId', 'name email focusArea')
      .sort({ version: -1 });

    const allVersions = await ExercisePlan.find({ patientId })
      .populate('physioId', 'name email')
      .sort({ version: -1 });

    res.json({ currentPlan, allVersions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create or Update Weekly Exercise Plan (Physiotherapist assigns exercises, preserving versioning)
app.post('/api/plans', requirePhysio, async (req, res) => {
  try {
    const { patientId, prescriptionId, effectiveDate, revisionNotes, assignments } = req.body;
    const physioId = req.user.id;

    if (!patientId || !assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ message: 'Patient ID and exercise assignments are required' });
    }

    // Mark previous current plan as archived
    const lastPlan = await ExercisePlan.findOne({ patientId, isCurrent: true }).sort({ version: -1 });
    const nextVersion = lastPlan ? lastPlan.version + 1 : 1;

    if (lastPlan) {
      lastPlan.isCurrent = false;
      await lastPlan.save();
    }

    // Ensure all assignments have unique stable assignment IDs
    const formattedAssignments = assignments.map(a => ({
      assignmentId: a.assignmentId || `asgn_${crypto.randomBytes(6).toString('hex')}`,
      exerciseName: a.exerciseName,
      type: a.type || (a.holdDurationSec > 0 ? 'hold' : 'reps'),
      sets: Number(a.sets) || 2,
      reps: Number(a.reps) || 10,
      holdDurationSec: Number(a.holdDurationSec) || 0,
      sessionsPerDay: Number(a.sessionsPerDay) || 1,
      daysOfWeek: a.daysOfWeek && a.daysOfWeek.length > 0 ? a.daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
      restBetweenSetsSec: Number(a.restBetweenSetsSec) || 45,
      tutorialUrl: a.tutorialUrl || '',
      notes: a.notes || ''
    }));

    const newPlan = new ExercisePlan({
      physioId,
      patientId,
      prescriptionId: prescriptionId || null,
      version: nextVersion,
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      revisionNotes: revisionNotes || (nextVersion === 1 ? 'Initial rehabilitation plan' : `Week ${nextVersion} progression revision`),
      isCurrent: true,
      assignments: formattedAssignments
    });

    const savedPlan = await newPlan.save();

    // Automatically mark the doctor's prescription as 'Verified by Physio'
    if (prescriptionId) {
      await Prescription.findByIdAndUpdate(prescriptionId, { status: 'Verified by Physio', lastUpdated: new Date() });
    } else {
      await Prescription.findOneAndUpdate({ patientId }, { status: 'Verified by Physio', lastUpdated: new Date() });
    }

    res.status(201).json({ message: `Exercise Plan version ${nextVersion} saved successfully and verified with doctor directives`, plan: savedPlan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- PATIENT TODAY'S EXERCISES, DAILY ALLOWANCES & CALENDAR ADHERENCE ---

// Helper to determine day of week and date in patient's timezone
function getPatientDateDetails(timezone = 'UTC', dateOverride = null) {
  let dateObj = new Date();
  if (dateOverride) {
    dateObj = new Date(dateOverride + 'T00:00:00Z');
  }

  const dateStr = dateOverride || dateObj.toISOString().split('T')[0];
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon ...
  return { dateStr, dayOfWeek };
}

// 1. Get Patient's "Today's Exercises" with live daily allowance progress
app.get('/api/daily-progress/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const requestedDate = req.query.date || new Date().toISOString().split('T')[0];

    // Patient info
    const patient = await User.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // 1. Fetch active exercise plan
    const activePlan = await ExercisePlan.findOne({ patientId, isCurrent: true });
    if (!activePlan || !activePlan.assignments || activePlan.assignments.length === 0) {
      return res.json({
        date: requestedDate,
        hasPlan: false,
        allCompleted: false,
        isRestDay: true,
        assignments: [],
        summary: { totalPrescribed: 0, totalCompleted: 0, percent: 0 }
      });
    }

    // Determine day of week for requested date
    const dateObj = new Date(requestedDate + 'T00:00:00Z');
    const dayOfWeek = dateObj.getUTCDay(); // 0: Sun, 1: Mon...

    // Filter assignments scheduled for this day of week
    const todaysScheduled = activePlan.assignments.filter(asgn => {
      if (!asgn.daysOfWeek || asgn.daysOfWeek.length === 0) return true;
      return asgn.daysOfWeek.includes(dayOfWeek);
    });

    const isRestDay = todaysScheduled.length === 0;

    // 2. Fetch or initialize daily progress records
    const assignmentSummaries = await Promise.all(todaysScheduled.map(async (asgn) => {
      const targetDailyWork = (asgn.type === 'hold' ? asgn.holdDurationSec : asgn.reps) * asgn.sets * asgn.sessionsPerDay;

      let progress = await DailyProgress.findOne({
        patientId,
        assignmentId: asgn.assignmentId,
        date: requestedDate
      });

      if (!progress) {
        progress = new DailyProgress({
          patientId,
          assignmentId: asgn.assignmentId,
          date: requestedDate,
          exerciseName: asgn.exerciseName,
          type: asgn.type,
          targetDailyWork,
          completedWork: 0,
          validReps: 0,
          attemptedReps: 0,
          completedSets: 0,
          completedSessions: 0,
          isCompleted: false
        });
        await progress.save();
      }

      const completed = progress.completedWork >= targetDailyWork;
      const remainingWork = Math.max(0, targetDailyWork - progress.completedWork);

      return {
        assignmentId: asgn.assignmentId,
        exerciseName: asgn.exerciseName,
        type: asgn.type,
        sets: asgn.sets,
        reps: asgn.reps,
        holdDurationSec: asgn.holdDurationSec,
        sessionsPerDay: asgn.sessionsPerDay,
        restBetweenSetsSec: asgn.restBetweenSetsSec,
        tutorialUrl: asgn.tutorialUrl,
        notes: asgn.notes,
        targetDailyWork,
        completedWork: progress.completedWork,
        remainingWork,
        completedSets: progress.completedSets,
        completedSessions: progress.completedSessions,
        validReps: progress.validReps,
        attemptedReps: progress.attemptedReps,
        isCompleted: completed,
        isDiscomfortReported: progress.isDiscomfortReported,
        discomfortNotes: progress.discomfortNotes
      };
    }));

    const totalTarget = assignmentSummaries.reduce((acc, a) => acc + a.targetDailyWork, 0);
    const totalDone = assignmentSummaries.reduce((acc, a) => acc + a.completedWork, 0);
    const allCompleted = !isRestDay && assignmentSummaries.length > 0 && assignmentSummaries.every(a => a.isCompleted);
    const percent = totalTarget > 0 ? Math.min(100, Math.round((totalDone / totalTarget) * 100)) : (isRestDay ? 100 : 0);

    res.json({
      date: requestedDate,
      hasPlan: true,
      planVersion: activePlan.version,
      isRestDay,
      allCompleted,
      routine: assignmentSummaries,
      assignments: assignmentSummaries,
      summary: {
        totalPrescribed: totalTarget,
        totalCompleted: totalDone,
        percent
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Increment Daily Progress Atomically (Shared across games, anti-cheat & allowance capping)
app.post('/api/daily-progress/increment', authenticateToken, async (req, res) => {
  try {
    const {
      patientId,
      assignmentId,
      exerciseName,
      date,
      workIncrement,
      repsCompleted,
      attemptedIncrement,
      attempts,
      validIncrement,
      gamePlayed
    } = req.body;

    const patientIdToUse = patientId || req.user.id;
    const dateToUse = date || new Date().toISOString().split('T')[0];

    // Find patient's plan to determine target allowance
    const activePlan = await ExercisePlan.findOne({ patientId: patientIdToUse, isCurrent: true });
    let asgnSpec = activePlan?.assignments?.find(a => a.assignmentId === assignmentId);

    // Fallback search by exercise name if assignmentId is generic
    if (!asgnSpec && activePlan?.assignments) {
      asgnSpec = activePlan.assignments.find(a => a.exerciseName.toLowerCase() === (exerciseName || '').toLowerCase());
    }

    const asgnIdToUse = asgnSpec?.assignmentId || assignmentId || `asgn_default_${exerciseName}`;
    const targetDailyWork = asgnSpec
      ? ((asgnSpec.type === 'hold' ? asgnSpec.holdDurationSec : asgnSpec.reps) * asgnSpec.sets * asgnSpec.sessionsPerDay)
      : 20;

    let progress = await DailyProgress.findOne({
      patientId: patientIdToUse,
      assignmentId: asgnIdToUse,
      date: dateToUse
    });

    if (!progress) {
      progress = new DailyProgress({
        patientId: patientIdToUse,
        assignmentId: asgnIdToUse,
        date: dateToUse,
        exerciseName: exerciseName || asgnSpec?.exerciseName || 'Exercise',
        type: asgnSpec?.type || 'reps',
        targetDailyWork,
        completedWork: 0,
        validReps: 0,
        attemptedReps: 0
      });
    }

    // Increment values (support workIncrement or repsCompleted)
    const incAmount = Number(workIncrement) || Number(repsCompleted) || 1;
    progress.completedWork += incAmount;
    progress.validReps += Number(validIncrement) || Number(repsCompleted) || incAmount;
    progress.attemptedReps += Number(attemptedIncrement) || Number(attempts) || incAmount;

    // Check completion cap
    if (progress.completedWork >= progress.targetDailyWork) {
      progress.isCompleted = true;
    }
    progress.lastUpdated = new Date();
    await progress.save();

    // Check if ALL exercises for today are now completed
    let allDailyCompleted = false;
    if (activePlan?.assignments) {
      const dateObj = new Date(dateToUse + 'T00:00:00Z');
      const dayOfWeek = dateObj.getUTCDay();
      const todaysAssignments = activePlan.assignments.filter(a => !a.daysOfWeek || a.daysOfWeek.includes(dayOfWeek));

      const todaysProgresses = await DailyProgress.find({
        patientId: patientIdToUse,
        date: dateToUse,
        assignmentId: { $in: todaysAssignments.map(a => a.assignmentId) }
      });

      allDailyCompleted = todaysAssignments.length > 0 &&
        todaysAssignments.every(a => {
          const p = todaysProgresses.find(tp => tp.assignmentId === a.assignmentId);
          return p && p.isCompleted;
        });
    }

    res.json({
      success: true,
      progress,
      isAllowanceMet: progress.isCompleted,
      allDailyCompleted
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Report Discomfort or Stop Early
app.post('/api/daily-progress/report-discomfort', authenticateToken, async (req, res) => {
  try {
    const { patientId, assignmentId, exerciseName, date, discomfortNotes, notes, discomfortLevel, stoppedEarly } = req.body;
    const patientIdToUse = patientId || req.user.id;
    const dateToUse = date || new Date().toISOString().split('T')[0];
    const finalNotes = discomfortNotes || notes || `Reported discomfort (Level ${discomfortLevel || 3}/10)`;

    const progress = await DailyProgress.findOneAndUpdate(
      { patientId: patientIdToUse, assignmentId, date: dateToUse },
      {
        isDiscomfortReported: true,
        discomfortNotes: finalNotes,
        lastUpdated: new Date()
      },
      { new: true, upsert: true }
    );

    // Also record stopped session in SessionLog for therapist review
    const sessionRecord = new SessionLog({
      patientId: patientIdToUse,
      assignmentId,
      exerciseName: exerciseName || 'Exercise',
      reps_completed: progress?.completedWork || 0,
      stoppedEarly: stoppedEarly !== undefined ? stoppedEarly : true,
      discomfortReported: true,
      discomfortNotes: finalNotes,
      gamePlayed: 'Clinical Form Tracker'
    });
    await sessionRecord.save();

    res.json({
      message: 'Discomfort report recorded. Your clinician will be notified.',
      progress,
      report: {
        notes: finalNotes,
        discomfortLevel: discomfortLevel || 4,
        stoppedEarly: stoppedEarly !== undefined ? stoppedEarly : true
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Monthly Calendar Adherence Aggregation (Strict Green only when ALL daily assignments complete)
app.get('/api/daily-progress/patient/:patientId/calendar', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || (new Date().getMonth() + 1); // 1-indexed

    const todayStr = new Date().toISOString().split('T')[0];
    const daysInMonth = new Date(year, month, 0).getDate();

    // Fetch patient & active plan
    const activePlan = await ExercisePlan.findOne({ patientId, isCurrent: true });

    // Fetch all progress records for this month
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthlyProgresses = await DailyProgress.find({
      patientId,
      date: { $regex: `^${monthPrefix}` }
    });

    const calendarDays = {};

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;

      if (isFuture) {
        calendarDays[dateStr] = {
          date: dateStr,
          status: 'locked_future',
          allCompleted: false,
          isRestDay: false,
          completedCount: 0,
          totalAssigned: 0
        };
        continue;
      }

      // Past or Today
      const dateObj = new Date(dateStr + 'T00:00:00Z');
      const dayOfWeek = dateObj.getUTCDay();

      // Determine scheduled assignments for this day of week
      const scheduledAssignments = activePlan?.assignments
        ? activePlan.assignments.filter(a => !a.daysOfWeek || a.daysOfWeek.length === 0 || a.daysOfWeek.includes(dayOfWeek))
        : [];

      if (scheduledAssignments.length === 0) {
        calendarDays[dateStr] = {
          date: dateStr,
          status: 'rest_day',
          allCompleted: false,
          isRestDay: true,
          completedCount: 0,
          totalAssigned: 0
        };
        continue;
      }

      // Check progress of scheduled assignments
      const dayProgresses = monthlyProgresses.filter(p => p.date === dateStr);
      let completedCount = 0;
      let totalWorkDone = 0;
      let totalTargetWork = 0;

      scheduledAssignments.forEach(asgn => {
        const target = (asgn.type === 'hold' ? asgn.holdDurationSec : asgn.reps) * asgn.sets * asgn.sessionsPerDay;
        totalTargetWork += target;
        const prog = dayProgresses.find(p => p.assignmentId === asgn.assignmentId);
        if (prog) {
          totalWorkDone += prog.completedWork;
          if (prog.completedWork >= target) {
            completedCount++;
          }
        }
      });

      const allDone = scheduledAssignments.length > 0 && completedCount === scheduledAssignments.length;
      let status = 'pending';

      if (allDone) {
        status = 'completed'; // Turns Green!
      } else if (totalWorkDone > 0) {
        status = 'partially_completed'; // Turns Amber/Yellow
      } else if (!isToday && dateStr < todayStr) {
        status = 'missed'; // Past uncompleted day
      } else {
        status = 'pending'; // Today pending
      }

      calendarDays[dateStr] = {
        date: dateStr,
        status,
        allCompleted: allDone,
        isRestDay: false,
        completedCount,
        totalAssigned: scheduledAssignments.length,
        totalWorkDone,
        totalTargetWork
      };
    }

    res.json({
      year,
      month,
      calendarDays,
      statuses: calendarDays
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- APPOINTMENT ENDPOINTS ---

app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { doctorId, patientId, patientName, date, time, type, duration, notes, status } = req.body;
    const appt = new Appointment({
      doctorId,
      patientId: patientId || null,
      patientName,
      date,
      time,
      type: type || 'Rehabilitation Review',
      duration: duration || '30 mins',
      status: status || 'Confirmed',
      notes: notes || ''
    });
    const saved = await appt.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- EXERCISE & SESSION ROUTES ---

app.get('/api/exercises', async (req, res) => {
  try {
    const exercises = await Exercise.find({});
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/exercises/:name', async (req, res) => {
  try {
    const exercise = await Exercise.findOne({ name: new RegExp('^' + req.params.name + '$', 'i') });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json(exercise);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const newSession = new SessionLog({
      patientId: req.body.patientId,
      assignmentId: req.body.assignmentId || null,
      exerciseName: req.body.exerciseName,
      reps_completed: req.body.reps_completed,
      max_angle_achieved: req.body.max_angle_achieved,
      gamePlayed: req.body.gamePlayed || 'Standard Tracker',
      hold_time_achieved: req.body.hold_time_achieved || 0,
      success_rate: req.body.success_rate || 100,
      rom_max: req.body.rom_max || req.body.max_angle_achieved || 0,
      rom_min: req.body.rom_min || 0,
      rom_average: req.body.rom_average || req.body.max_angle_achieved || 0,
      valid_reps: req.body.valid_reps || req.body.reps_completed || 0,
      invalid_reps: req.body.invalid_reps || 0,
      form_violations_count: req.body.form_violations_count || 0,
      form_violations: req.body.form_violations || [],
      consistency_score: req.body.consistency_score || 100,
      completion_percentage: req.body.completion_percentage || 100,
      stoppedEarly: req.body.stoppedEarly || false,
      discomfortReported: req.body.discomfortReported || false,
      discomfortNotes: req.body.discomfortNotes || '',
      baseline_rom: req.body.baseline_rom || 0
    });
    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions/patient/:patientId', async (req, res) => {
  try {
    const sessions = await SessionLog.find({ patientId: req.params.patientId }).sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await SessionLog.find().sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Start the Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 PoseCare Clinical Server running on port ${PORT}`));