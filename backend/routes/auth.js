const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { poolPromise } = require('../db');

// Database configuration bridge pulling from your safe .env parameters
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,     // This will now look for 'localhost'
  database: process.env.DB_NAME,
  options: {
    instanceName: process.env.DB_INSTANCE, // Crucial for SQLEXPRESS setups!
    encrypt: true,
    trustServerCertificate: true
  }
};

const { sendMail } = require('../utils/emailHelper');

const dispatchInvitationEmail = (email, role, department, wardAssignment) => {
  const mailText = `Hello,

You have been whitelisted as an administrative official on the CivicSense platform.
Your credentials have been validated with the following privileges:

  - System Role: ${role}
  - Municipal Department: ${department || 'All Departments'}
  - Ward Assignment: ${wardAssignment}

Please use your email address (${email.trim()}) to register or log in at:
  http://localhost:5173/register

Once registered, your dashboard will automatically unlock your department tracking queue and administrative workflows.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

  sendMail({
    to: email.trim(),
    subject: 'Welcome to CivicSense Mangaluru - Access Whitelisted!',
    text: mailText
  }).catch(err => console.error('Failed to dispatch whitelisting invitation email:', err));
};

// ==========================================
// MIDDLEWARE: Verify JWT and require a role
// ==========================================
const requireRole = (role) => (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Authorization header missing.' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== role) {
      return res.status(403).json({ message: `Access denied. Requires role: ${role}` });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// ==========================================
// 1. CITIZEN REGISTRATION ENDPOINT
// ==========================================
router.post('/register', async (req, res) => {
  const { name, email, phone, password, role, department } = req.body;

  try {
    console.log('📝 Register attempt:', { email, name });

    // Cybersecurity: Password complexity & email format enforcement
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Security Alert: Invalid email address format.' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Security Alert: Password must be at least 6 characters long.' });
    }
    
    const pool = await sql.connect(dbConfig);

    // Check if the user email already exists in our database matrix
    const userCheck = await pool.request()
      .input('email', sql.VarChar, String(email).trim())
      .query('SELECT * FROM USERS WHERE EMAIL = @email');

    if (userCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Hash password to prevent raw text leaking if the database is intercepted
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert record straight into USERS table using uppercase syntax standard tokens
    // Citizens always register as 'citizen' — engineers are promoted via APPROVED_OFFICIALS
    await pool.request()
      .input('name', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('phone', sql.VarChar, phone)
      .input('password', sql.VarChar, hashedPassword)
      .input('role', sql.VarChar, 'citizen')
      .input('department', sql.NVarChar, null)
      .query('INSERT INTO USERS (NAME, EMAIL, PHONE, PASSWORD, role, department) VALUES (@name, @email, @phone, @password, @role, @department)');

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Registration processing malfunction:', err);
    res.status(500).json({ message: 'Database server error during enrollment.' });
  }
});

// ==========================================
// 2. LOGIN ENDPOINT (with whitelist check)
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const targetDB = process.env.DB_NAME;
    const pool = await poolPromise;

    // Lookup user profile by unique email key signature
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`SELECT * FROM ${targetDB}.dbo.USERS WHERE EMAIL = @email`);

    if (result.recordset.length === 0) {
      return res.status(400).json({ message: 'Invalid Email or Password.' });
    }

    const user = result.recordset[0];

    // Evaluate incoming plaintext string against the hashed sequence inside SQL
    const isMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Email or Password.' });
    }

    // ================================================================
    // ROLE RESOLUTION LOGIC
    // Priority 1: Hard-coded Super Admin email always wins
    // Priority 2: Check the APPROVED_OFFICIALS whitelist table
    // Priority 3: Fall back to whatever is in the USERS table
    // ================================================================
    let resolvedRole = user.role || 'citizen';
    let resolvedDepartment = user.department || null;
    let resolvedWardAssignment = null;

    const SUPER_ADMIN_EMAILS = [
      'amithcolaco@gmail.com',
      'admin@civicsense.in',
      'admin@mangaluru.gov.in'
    ];

    if (SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === email.trim().toLowerCase())) {
      // Hard-coded override — this person is ALWAYS the Super Admin
      resolvedRole = 'super_admin';
      resolvedDepartment = null;
      resolvedWardAssignment = 'All Wards';
    } else {
      // Check if this email is on the APPROVED_OFFICIALS whitelist
      const officialCheck = await pool.request()
        .input('email', sql.NVarChar, email)
        .query(`SELECT role, department, ward_assignment FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email`);

      if (officialCheck.recordset.length > 0) {
        const official = officialCheck.recordset[0];
        resolvedRole = official.role || 'engineer';
        resolvedDepartment = official.department || null;
        resolvedWardAssignment = official.ward_assignment || 'All Wards';
        console.log(`🔑 Whitelist match for ${email} → promoted to role: ${resolvedRole}, ward: ${resolvedWardAssignment}`);
      }
    }

    // Sign a secure JWT transmission payload token valid for 24 hours
    const token = jwt.sign(
      {
        id: user.ID,
        name: user.NAME,
        email: user.EMAIL,
        role: resolvedRole,
        department: resolvedDepartment,
        ward_assignment: resolvedWardAssignment
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Hand back token profile packet safely to frontend storage cells
    res.json({
      token,
      user: {
        id: user.ID,
        name: user.NAME,
        email: user.EMAIL,
        role: resolvedRole,
        department: resolvedDepartment,
        ward_assignment: resolvedWardAssignment
      }
    });
  } catch (err) {
    console.error('Authentication engine fault:', err);
    res.status(500).json({ message: 'Internal server error processing login identity.' });
  }
});

// ================================================================
// 3. INVITE OFFICIAL (Super Admin only)
//    POST /api/auth/invite-official
//    Body: { email, role, department }
// ================================================================
router.post('/invite-official', requireRole('super_admin'), async (req, res) => {
  const { email, role, department, wardAssignment } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'A valid email address is required.' });
  }

  const inviteRole = role || 'engineer';
  const inviteWard = wardAssignment || 'All Wards';
  const validRoles = [
    'engineer',
    'department',
    'Corporator',
    'Commissioner',
    'Executive Engineer (EE)',
    'Assistant Executive Engineer (AEE)',
    'Assistant Engineer (AE) / Junior Engineer (JE)',
    'Empanelled Contractor / Ward Inspector',
    'Executive Engineer (EE) / Assistant Executive Engineer (AEE)',
    'Section Officer (SO) / Assistant Engineer (AE)',
    'Lineman / Junior Lineman (JLM)',
    'Health Officer / Chief Veterinary Officer',
    'Senior Health Inspector (SHI) / Junior Health Inspector (JHI)',
    'Animal Catching Squad / Field Handler',
    'MCC Contractor',
    'Water Board Contractor',
    'MESCOM Contractor',
    'Health Dept Contractor',
    'Assistant Executive Engineer (AEE — Water Supply)'
  ];
  if (!validRoles.includes(inviteRole)) {
    return res.status(400).json({ message: `Role must be one of the department-specific roles.` });
  }

  try {
    const targetDB = process.env.DB_NAME;
    const pool = await poolPromise;

    // Check if already invited
    const existing = await pool.request()
      .input('email', sql.NVarChar, email.trim())
      .query(`SELECT id FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email`);

    if (existing.recordset.length > 0) {
      // Update existing record
      await pool.request()
        .input('email', sql.NVarChar, email.trim())
        .input('role', sql.VarChar, inviteRole)
        .input('department', sql.NVarChar, department || null)
        .input('wardAssignment', sql.NVarChar, inviteWard)
        .input('invitedBy', sql.NVarChar, req.user.email)
        .query(`
           UPDATE ${targetDB}.dbo.APPROVED_OFFICIALS
          SET role = @role, department = @department, ward_assignment = @wardAssignment, invited_by = @invitedBy, invited_at = GETDATE()
          WHERE email = @email
        `);
      dispatchInvitationEmail(email, inviteRole, department, inviteWard);
      return res.status(200).json({ message: `Official updated: ${email}` });
    }

    // Insert new whitelist entry
    await pool.request()
      .input('email', sql.NVarChar, email.trim())
      .input('role', sql.VarChar, inviteRole)
      .input('department', sql.NVarChar, department || null)
      .input('wardAssignment', sql.NVarChar, inviteWard)
      .input('invitedBy', sql.NVarChar, req.user.email)
      .query(`
        INSERT INTO ${targetDB}.dbo.APPROVED_OFFICIALS (email, role, department, ward_assignment, invited_by)
        VALUES (@email, @role, @department, @wardAssignment, @invitedBy)
      `);

    dispatchInvitationEmail(email, inviteRole, department, inviteWard);
    console.log(`🎫 Official invited: ${email} → role: ${inviteRole} by ${req.user.email} for ${inviteWard}`);
    res.status(201).json({ message: `Successfully invited ${email} as ${inviteRole}.` });
  } catch (err) {
    console.error('Invite official error:', err);
    res.status(500).json({ message: 'Database error while creating invitation.' });
  }
});

// ================================================================
// 4. LIST ALL APPROVED OFFICIALS (Super Admin only)
//    GET /api/auth/officials
// ================================================================
router.get('/officials', requireRole('super_admin'), async (req, res) => {
  try {
    const targetDB = process.env.DB_NAME;
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT id, email, role, department, ward_assignment, invited_by, invited_at
      FROM ${targetDB}.dbo.APPROVED_OFFICIALS
      ORDER BY invited_at DESC
    `);

    res.json({ officials: result.recordset });
  } catch (err) {
    console.error('List officials error:', err);
    res.status(500).json({ message: 'Failed to retrieve officials list.' });
  }
});

// ================================================================
// 5. REVOKE OFFICIAL (Super Admin only)
//    DELETE /api/auth/officials/:email
// ================================================================
router.delete('/officials/:email', requireRole('super_admin'), async (req, res) => {
  const email = decodeURIComponent(req.params.email);

  try {
    const targetDB = process.env.DB_NAME;
    const pool = await poolPromise;

    await pool.request()
      .input('email', sql.NVarChar, email)
      .query(`DELETE FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email`);

    console.log(`🗑️ Official revoked: ${email} by ${req.user.email}`);
    res.json({ message: `Access revoked for ${email}.` });
  } catch (err) {
    console.error('Revoke official error:', err);
    res.status(500).json({ message: 'Failed to revoke official access.' });
  }
});

module.exports = router;