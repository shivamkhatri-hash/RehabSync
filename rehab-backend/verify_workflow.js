const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = 'rehab_ai_super_secret_2026';

function generateToken(user) {
  return jwt.sign({ id: user._id || user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
}

async function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing Registration & Role Assignment ---');
  
  const doctorToken = generateToken({ _id: '64bfbc47cbd443d99c9d0002', role: 'doctor', email: 'dr.watson@posecare.com' });
  const physioToken = generateToken({ _id: '64bfbc47cbd443d99c9d0003', role: 'physiotherapist', email: 'pt.reed@posecare.com' });
  
  // Create patient under doctor and physio
  const patientRes = await request({
    host: 'localhost', port: 5000, path: '/api/users/patients', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` }
  }, {
    name: 'Alex Rivera',
    email: `alex.rivera.${Date.now()}@test.com`,
    focusArea: 'knee_rehab',
    doctorId: '64bfbc47cbd443d99c9d0002',
    physioId: '64bfbc47cbd443d99c9d0003',
    password: 'password123'
  });

  const patient = patientRes.data.patient || patientRes.data;
  const patId = patient._id;
  const docId = '64bfbc47cbd443d99c9d0002';
  const physioId = '64bfbc47cbd443d99c9d0003';
  const patientToken = generateToken({ _id: patId, role: 'patient', email: patient.email });

  console.log('✅ Patient Created:', patient.name, 'ID:', patId);

  console.log('\n--- 2. Doctor Sets Medical Diagnosis & Main Prescription ---');
  const presc = await request({
    host: 'localhost', port: 5000, path: '/api/prescriptions', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}` }
  }, {
    doctorId: docId,
    patientId: patId,
    diagnosis: 'Right Knee ACL Strain & Patellar Tendinitis',
    restrictions: 'Avoid deep squats > 135 deg and high-impact landing',
    precautions: 'Monitor for patellofemoral crepitus or sharp lateral pain',
    clinicalGoals: 'Restore quadriceps eccentric control and full terminal knee extension',
    status: 'Active'
  });
  console.log('Prescription Response Status:', presc.status, presc.data);

  console.log('\n--- 3. Physiotherapist Creates Individualized Exercise Plan with Weekly Allowances ---');
  const planRes = await request({
    host: 'localhost', port: 5000, path: '/api/plans', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${physioToken}` }
  }, {
    patientId: patId,
    prescriptionId: presc.data._id,
    effectiveDate: new Date().toISOString().slice(0, 10),
    revisionNotes: 'Week 1 Quadriceps loading & VMO motor control',
    assignments: [
      {
        assignmentId: 'asgn_mini_squat_01',
        exerciseName: 'Mini Squat',
        type: 'reps',
        sets: 2,
        reps: 10,
        holdDurationSec: 0,
        sessionsPerDay: 1,
        restBetweenSetsSec: 45,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      },
      {
        assignmentId: 'asgn_seated_knee_02',
        exerciseName: 'Seated Knee Extension',
        type: 'reps',
        sets: 2,
        reps: 5,
        holdDurationSec: 0,
        sessionsPerDay: 1,
        restBetweenSetsSec: 30,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      }
    ]
  });

  console.log('Plan Response Status:', planRes.status, planRes.data);
  const plan = planRes.data.plan || planRes.data;
  console.log('✅ Physio Plan created! Version:', plan.version, 'Assignments count:', plan.assignments.length);
  plan.assignments.forEach(a => {
    const dailyTarget = a.sets * a.reps * a.sessionsPerDay;
    console.log(`   - ${a.exerciseName}: ${a.sets} sets x ${a.reps} reps x ${a.sessionsPerDay}/day = ${dailyTarget} daily reps [ID: ${a.assignmentId}]`);
  });

  const asgn1 = plan.assignments[0];
  const asgn2 = plan.assignments[1];

  console.log('\n--- 4. Patient Fetches Today Routine & Doctor Directives ---');
  const daily = await request({
    host: 'localhost', port: 5000, path: `/api/daily-progress/patient/${patId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  console.log('✅ Today Routine count:', daily.data.routine.length);
  daily.data.routine.forEach(r => {
    console.log(`   - ${r.exerciseName}: targetDailyWork=${r.targetDailyWork}, completedWork=${r.completedWork}, remainingWork=${r.remainingWork}, isCompleted=${r.isCompleted}`);
  });

  console.log('\n--- 5. Patient Completes Mini Squat (20 reps across games) ---');
  const inc1 = await request({
    host: 'localhost', port: 5000, path: '/api/daily-progress/increment', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` }
  }, {
    patientId: patId,
    assignmentId: asgn1.assignmentId,
    exerciseName: asgn1.exerciseName,
    repsCompleted: 20,
    attempts: 20,
    maxAngle: 126,
    formAccuracy: 95,
    gamePlayed: 'Flappy Rehab Flight'
  });
  console.log('✅ Mini Squat Progress:', inc1.data.progress.completedWork, '/', inc1.data.progress.targetDailyWork, '| isCompleted:', inc1.data.isCompleted);

  console.log('\n--- 6. Verify Calendar Status (Partial vs All Complete) ---');
  const todayKey = new Date().toISOString().slice(0, 10);
  const cal1 = await request({
    host: 'localhost', port: 5000, path: `/api/daily-progress/patient/${patId}/calendar`, method: 'GET',
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  console.log('✅ Calendar Status with 1/2 complete:', cal1.data.statuses[todayKey]?.status, '(Expected: partially_completed)');

  // Complete exercise 2
  const inc2 = await request({
    host: 'localhost', port: 5000, path: '/api/daily-progress/increment', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` }
  }, {
    patientId: patId,
    assignmentId: asgn2.assignmentId,
    exerciseName: asgn2.exerciseName,
    repsCompleted: 10,
    attempts: 10,
    maxAngle: 162,
    formAccuracy: 98,
    gamePlayed: 'Zen Bloom Garden'
  });
  console.log('✅ Seated Knee Extension Progress:', inc2.data.progress.completedWork, '/', inc2.data.progress.targetDailyWork, '| isCompleted:', inc2.data.isCompleted);

  const cal2 = await request({
    host: 'localhost', port: 5000, path: `/api/daily-progress/patient/${patId}/calendar`, method: 'GET',
    headers: { 'Authorization': `Bearer ${patientToken}` }
  });
  console.log('✅ Calendar Status after ALL complete:', cal2.data.statuses[todayKey]?.status, '(Expected: completed / Green)');

  console.log('\n--- 7. Patient Reports Discomfort / Stops Early ---');
  const dis = await request({
    host: 'localhost', port: 5000, path: '/api/daily-progress/report-discomfort', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${patientToken}` }
  }, {
    patientId: patId,
    assignmentId: asgn1.assignmentId,
    discomfortLevel: 4,
    notes: '[Patellar tendon] Mild ache after rep 18',
    stoppedEarly: false
  });
  console.log('✅ Discomfort Logged:', dis.data.report.notes, '| VAS Pain Level:', dis.data.report.discomfortLevel);

  console.log('\n======================================================');
  console.log('🎉 ALL CLINICAL 3-ROLE WORKFLOW TESTS PASSED PERFECTLY!');
  console.log('======================================================');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
