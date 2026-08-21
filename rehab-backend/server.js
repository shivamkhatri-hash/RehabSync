require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// User Schema with OTP Support
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['doctor', 'patient'], required: true },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  focusArea: { type: String, default: 'general' },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null }
});
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

// Auto-seed exercises
const seedDatabase = async () => {
  const count = await Exercise.countDocuments();
  if (count === 0) {
    await Exercise.insertMany([
      { name: 'Bicep Curl', target_joints: [11, 13, 15], success_angle: 160, failure_angle: 90 },
      { name: 'Push-up', target_joints: [11, 13, 15], success_angle: 160, failure_angle: 80 },
      { name: 'Crunch', target_joints: [11, 23, 25], success_angle: 110, failure_angle: 60 }
    ]);
    console.log('🌱 Database seeded with exercises!');
  }
};
mongoose.connection.once('open', seedDatabase);


// 3. API Routes

app.get('/', (req, res) => res.send('API running!'));

// --- AUTHENTICATION ROUTES ---

// Step 1: Register New User & Send Initial OTP
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, role, focusArea } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already registered' });

    // Generate a 6-digit code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the new user with the OTP
    user = new User({ 
      name, 
      email, 
      role, 
      focusArea,
      otp: generatedOtp,
      otpExpires: new Date(Date.now() + 5 * 60 * 1000)
    });
    await user.save();

    // Send the Real Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to RehabSync - Verify Your Email',
      html: `<h3>Hello ${name},</h3><p>Your verification code is: <strong style="font-size: 18px; color: #0d9488;">${generatedOtp}</strong></p><p>This code expires in 5 minutes.</p>`
    });

    res.status(201).json({ message: 'Account created! Please check your email for the OTP.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 2: Login - Request OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // Generate a 6-digit code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with a 5-minute expiry
    user.otp = generatedOtp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    // Send the Real Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'RehabSync - Login Code',
      html: `<p>Your secure login code is: <strong style="font-size: 18px; color: #0d9488;">${generatedOtp}</strong></p><p>This code expires in 5 minutes.</p>`
    });

    res.json({ message: 'OTP sent to your email!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 3: Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpires) return res.status(400).json({ message: 'OTP has expired' });

    // Clear OTP after successful use
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Generate session token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'hackathon_secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, focusArea: user.focusArea }
    });
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

// --- EXERCISE & SESSION ROUTES ---

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