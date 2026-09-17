require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

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

// Admin Only Role Guard
const requireAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Administrator privileges required' });
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

// User Schema with OTP & Password Support
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['doctor', 'patient', 'admin'], required: true },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  focusArea: { type: String, default: 'general' },
  password: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  resetOtp: { type: String, default: null },
  resetOtpExpires: { type: Date, default: null }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Prescription Schema
const prescriptionSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  exercises: [{
    exerciseName: String,
    targetReps: Number,
    successAngle: Number,
    failureAngle: Number,
    holdTime: Number // in seconds
  }],
  dateIssued: { type: Date, default: Date.now }
});
const Prescription = mongoose.model('Prescription', prescriptionSchema);

// Exercise Schema
const exerciseSchema = new mongoose.Schema({
  name: String,
  target_joints: [Number],
  success_angle: Number,
  failure_angle: Number
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

// SessionLog Schema
const sessionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  exerciseName: { type: String, default: 'Bicep Curl' },
  reps_completed: Number,
  max_angle_achieved: Number,
  gamePlayed: { type: String, default: 'Standard Tracker' },
  hold_time_achieved: { type: Number, default: 0 },
  success_rate: { type: Number, default: 100 },
  date: { type: Date, default: Date.now }
});
const SessionLog = mongoose.model('SessionLog', sessionSchema);

// Appointment Schema for Doctor Scheduling
const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientName: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  time: { type: String, required: true }, // e.g. "09:00 AM"
  type: { type: String, default: 'Rehabilitation Review' },
  duration: { type: String, default: '30 mins' },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'], default: 'Confirmed' },
  notes: { type: String, default: '' }
}, { timestamps: true });
const Appointment = mongoose.model('Appointment', appointmentSchema);

// Auto-seed exercises and test users
const seedDatabase = async () => {
  const exercises = [
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
      // Overwrite/update existing defaults to correct angles
      existing.target_joints = ex.target_joints;
      existing.success_angle = ex.success_angle;
      existing.failure_angle = ex.failure_angle;
      await existing.save();
    }
  }

  // Seed Super Administrator
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
    console.log('🌱 Super Admin seeded: admin@rehab.com / admin123');
  }

  // Seed test Doctor
  let testDoctor = await User.findOne({ email: 'doctor@test.com' });
  if (!testDoctor) {
    testDoctor = new User({
      name: 'Dr. John Smith',
      email: 'doctor@test.com',
      role: 'doctor',
      password: 'password123',
      focusArea: 'general'
    });
    await testDoctor.save();
    console.log('🌱 Test doctor seeded: doctor@test.com / password123');
  }

  // Seed test Patient
  let testPatient = await User.findOne({ email: 'patient@test.com' });
  if (!testPatient) {
    testPatient = new User({
      name: 'Jane Doe',
      email: 'patient@test.com',
      role: 'patient',
      password: 'password123',
      focusArea: 'upper_body',
      assignedDoctorId: testDoctor._id
    });
    await testPatient.save();
    console.log('🌱 Test patient seeded: patient@test.com / password123');
  }

  // Seed extra patients to match mockup
  const mockPatients = [
    { name: 'John Doe', email: 'john@test.com', role: 'patient', password: 'password123', focusArea: 'general', assignedDoctorId: testDoctor._id },
    { name: 'Shivam', email: 'shivam@test.com', role: 'patient', password: 'password123', focusArea: 'general', assignedDoctorId: testDoctor._id },
    { name: 'test 1', email: 'test1@test.com', role: 'patient', password: 'password123', focusArea: 'general', assignedDoctorId: null },
    { name: 'Vaibhav Mamgain', email: 'vaibhav@test.com', role: 'patient', password: 'password123', focusArea: 'general', assignedDoctorId: null }
  ];

  for (const mp of mockPatients) {
    let existing = await User.findOne({ email: mp.email });
    if (!existing) {
      existing = new User(mp);
      await existing.save();
      console.log(`🌱 Mock patient seeded: ${mp.name}`);
    }
  }

  // Seed test session logs for Jane Doe to populate charts
  const testPatientObj = await User.findOne({ email: 'patient@test.com' });
  if (testPatientObj) {
    const existingSessions = await SessionLog.findOne({ patientId: testPatientObj._id });
    if (!existingSessions) {
      const baseDate = new Date();
      const mockSessions = [
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 6,
          max_angle_achieved: 110,
          gamePlayed: 'Standard Tracker',
          hold_time_achieved: 8,
          success_rate: 80,
          date: new Date(baseDate.getTime() - 6 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 12,
          max_angle_achieved: 135,
          gamePlayed: 'Flappy Rehab',
          hold_time_achieved: 10,
          success_rate: 90,
          date: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 6,
          max_angle_achieved: 138,
          gamePlayed: 'Zen Bloom',
          hold_time_achieved: 10,
          success_rate: 85,
          date: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 11,
          max_angle_achieved: 163,
          gamePlayed: 'Shadow Match',
          hold_time_achieved: 10,
          success_rate: 95,
          date: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 10,
          max_angle_achieved: 160,
          gamePlayed: 'Standard Tracker',
          hold_time_achieved: 10,
          success_rate: 100,
          date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 8,
          max_angle_achieved: 160,
          gamePlayed: 'Flappy Rehab',
          hold_time_achieved: 9,
          success_rate: 90,
          date: new Date(baseDate.getTime() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: testPatientObj._id,
          exerciseName: 'Mini Squat',
          reps_completed: 5,
          max_angle_achieved: 152,
          gamePlayed: 'Shadow Match',
          hold_time_achieved: 8,
          success_rate: 88,
          date: baseDate
        }
      ];
      await SessionLog.insertMany(mockSessions);
      console.log('🌱 Seeded mock session logs for Jane Doe');
    }
  }

  // Seed test session logs for John Doe to populate charts
  const johnPatientObj = await User.findOne({ email: 'john@test.com' });
  if (johnPatientObj) {
    const existingJohnSessions = await SessionLog.findOne({ patientId: johnPatientObj._id });
    if (!existingJohnSessions) {
      const baseDate = new Date();
      const mockSessions = [
        {
          patientId: johnPatientObj._id,
          exerciseName: 'Bicep Curl',
          reps_completed: 4,
          max_angle_achieved: 120,
          gamePlayed: 'Standard Tracker',
          hold_time_achieved: 0,
          success_rate: 80,
          date: new Date(baseDate.getTime() - 5 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: johnPatientObj._id,
          exerciseName: 'Bicep Curl',
          reps_completed: 8,
          max_angle_achieved: 100,
          gamePlayed: 'Flappy Rehab',
          hold_time_achieved: 0,
          success_rate: 85,
          date: new Date(baseDate.getTime() - 4 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: johnPatientObj._id,
          exerciseName: 'Bicep Curl',
          reps_completed: 10,
          max_angle_achieved: 92,
          gamePlayed: 'Shadow Match',
          hold_time_achieved: 0,
          success_rate: 90,
          date: new Date(baseDate.getTime() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: johnPatientObj._id,
          exerciseName: 'Bicep Curl',
          reps_completed: 12,
          max_angle_achieved: 85,
          gamePlayed: 'Flappy Rehab',
          hold_time_achieved: 0,
          success_rate: 95,
          date: new Date(baseDate.getTime() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          patientId: johnPatientObj._id,
          exerciseName: 'Bicep Curl',
          reps_completed: 15,
          max_angle_achieved: 85,
          gamePlayed: 'Shadow Match',
          hold_time_achieved: 0,
          success_rate: 100,
          date: baseDate
        }
      ];
      await SessionLog.insertMany(mockSessions);
      console.log('🌱 Seeded mock session logs for John Doe');
    }
  }

  // Seed sample appointments for test doctor
  if (testDoctor) {
    const existingAppts = await Appointment.findOne({ doctorId: testDoctor._id });
    if (!existingAppts) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const appts = [
        {
          doctorId: testDoctor._id,
          patientName: 'Jane Doe',
          date: todayStr,
          time: '09:00 AM',
          type: 'Upper Body Review',
          duration: '30 mins',
          status: 'Completed',
          notes: 'Reviewed shoulder flexion range. Progressing well.'
        },
        {
          doctorId: testDoctor._id,
          patientName: 'Shivam',
          date: todayStr,
          time: '11:30 AM',
          type: 'Biceps Curl Evaluation',
          duration: '45 mins',
          status: 'Confirmed',
          notes: 'Assess elbow extension mobility and prescribe 15 reps.'
        },
        {
          doctorId: testDoctor._id,
          patientName: 'Vaibhav Mamgain',
          date: todayStr,
          time: '03:00 PM',
          type: 'Initial Consultation',
          duration: '60 mins',
          status: 'Pending',
          notes: 'New patient intake for knee joint rehab.'
        }
      ];
      await Appointment.insertMany(appts);
      console.log('🌱 Seeded sample appointments for test doctor');
    }
  }
};
mongoose.connection.once('open', seedDatabase);


// 3. API Routes

app.get('/', (req, res) => res.send('API running!'));

// --- AUTHENTICATION ROUTES ---

// Step 1: Register New User & Password
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, role, focusArea, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already registered' });

    // Securely hash password with bcrypt
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    user = new User({ 
      name, 
      email, 
      role, 
      focusArea,
      password: hashedPassword
    });
    await user.save();

    res.status(201).json({ message: 'Account created! Please log in with your credentials.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Login - Password authentication with first-time OTP verification
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // Verify password (supports bcrypt hashes with safe backward-compatibility)
    if (user.password) {
      let isMatch = false;
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text backward compatibility -> verify and upgrade hash
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

    // Only require OTP on FIRST TIME login for unverified patients
    if (user.role === 'patient' && !user.isVerified) {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = generatedOtp;
      user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();

      // Send email (gracefully caught to prevent blocking login on config gaps)
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

    // Doctors and already verified patients log in directly with password
    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, focusArea: user.focusArea }
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role, focusArea: user.focusArea }
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
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
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

    // Hash the new password with bcrypt
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

// 1. Get System Statistics for Admin Portal
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAdmins, totalSessions, totalPrescriptions] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      User.countDocuments({ role: 'admin' }),
      SessionLog.countDocuments(),
      Prescription.countDocuments()
    ]);

    // Recent activity logs
    const recentSessions = await SessionLog.find()
      .populate('patientId', 'name email')
      .sort({ date: -1 })
      .limit(8);

    res.json({
      stats: {
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAdmins,
        totalSessions,
        totalPrescriptions
      },
      recentSessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Users (Admin User Directory)
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .populate('assignedDoctorId', 'name email')
      .select('-password -otp -resetOtp')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update User Role (Admin Promotion/Demotion)
app.put('/api/admin/users/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['doctor', 'patient', 'admin'].includes(role)) {
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

// 4. Update User Verification Status (Admin Verify / Approve Doctor)
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

// 4. Assign Doctor to Patient (Admin Override)
app.put('/api/admin/users/:patientId/assign-doctor', requireAdmin, async (req, res) => {
  try {
    const { doctorId } = req.body;
    const patient = await User.findByIdAndUpdate(
      req.params.patientId,
      { assignedDoctorId: doctorId || null },
      { new: true }
    ).populate('assignedDoctorId', 'name email').select('-password');

    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Doctor assignment updated', patient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Delete User Account (Admin Delete)
app.delete('/api/admin/users/:userId', requireAdmin, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Prevent deleting own account
    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own administrator account' });
    }

    await User.findByIdAndDelete(req.params.userId);
    // Cleanup associated session logs & prescriptions
    await Promise.all([
      SessionLog.deleteMany({ patientId: req.params.userId }),
      Prescription.deleteMany({ $or: [{ patientId: req.params.userId }, { doctorId: req.params.userId }] })
    ]);

    res.json({ message: `User ${targetUser.name} and associated records deleted.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- DOCTOR DASHBOARD ROUTES ---

// Fetch all registered patients
app.get('/api/users/patients', async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept a patient (Assign doctor)
app.put('/api/users/patients/:patientId/assign', async (req, res) => {
  try {
    const { doctorId } = req.body;
    const patient = await User.findByIdAndUpdate(
      req.params.patientId, 
      { assignedDoctorId: doctorId }, 
      { new: true }
    );
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Doctor registers a new patient directly
app.post('/api/users/patients', async (req, res) => {
  try {
    const { name, email, focusArea, doctorId, password } = req.body;
    let existing = await User.findOne({ email });
    if (existing) {
      // If already exists, assign to this doctor if not already assigned
      existing.assignedDoctorId = doctorId || existing.assignedDoctorId;
      await existing.save();
      return res.json({ message: 'Patient linked to your clinic', patient: existing });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const newPatient = new User({
      name,
      email,
      role: 'patient',
      focusArea: focusArea || 'general',
      assignedDoctorId: doctorId || null,
      password: hashedPassword,
      isVerified: true
    });
    await newPatient.save();
    res.status(201).json({ message: 'Patient registered and added to roster', patient: newPatient });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Doctor profile & preferences
app.put('/api/users/:userId/profile', async (req, res) => {
  try {
    const { name, focusArea } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { name, focusArea },
      { new: true }
    ).select('-password');
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- APPOINTMENT ENDPOINTS ---

// Fetch all appointments for a doctor
app.get('/api/appointments/doctor/:doctorId', async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.params.doctorId }).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new appointment
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

// Update appointment status
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

// Delete appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- EXERCISE & SESSION ROUTES ---

// Fetch all seeded exercises
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
      exerciseName: req.body.exerciseName,
      reps_completed: req.body.reps_completed,
      max_angle_achieved: req.body.max_angle_achieved,
      gamePlayed: req.body.gamePlayed || 'Standard Tracker',
      hold_time_achieved: req.body.hold_time_achieved || 0,
      success_rate: req.body.success_rate || 100
    });
    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PRESCRIPTION ENDPOINTS ---

// Fetch patient's active prescription
app.get('/api/prescriptions/patient/:patientId', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ patientId: req.params.patientId }).sort({ dateIssued: -1 });
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update patient's prescription
app.post('/api/prescriptions', async (req, res) => {
  try {
    const { doctorId, patientId, exercises } = req.body;
    let prescription = await Prescription.findOne({ patientId });
    if (prescription) {
      prescription.doctorId = doctorId;
      prescription.exercises = exercises;
      prescription.dateIssued = new Date();
    } else {
      prescription = new Prescription({ doctorId, patientId, exercises });
    }
    const saved = await prescription.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch sessions log for specific patient
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));