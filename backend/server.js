require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss');
const authRoutes = require('./routes/auth');
const grievancesRoutes = require('./routes/grievances');
const { poolPromise } = require('./db');

const app = express();

const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME', 'DB_INSTANCE', 'JWT_SECRET', 'PORT', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ STARTUP ERROR: Missing environment variables:', missingVars);
  console.error('Please check your .env file has:', requiredEnvVars.join(', '));
  process.exit(1);
}

console.log('✅ Environment validation passed');

// 1. Cyber Security: Helmet HTTP Hardening
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// 2. Cyber Security: Anti Brute-Force & DoS Rate Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Security Alert: Too many authentication attempts. Try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Cyber Security: CORS Policy
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 4. Cyber Security: Request Body Size Caps (Prevents Buffer Overflow & Payload DoS)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Cyber Security: SQL Injection & Path Traversal Defensive Inspection Middleware
const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|XP_CMDSHELL|TRUNCATE)\b)|(--|\bOR\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|;\s*--)/i;
const pathTraversalPattern = /(\.\.[\/\\])/;

app.use((req, res, next) => {
  const checkSecurity = (val, keyName = '') => {
    if (typeof val === 'string') {
      // Path traversal protection
      if (pathTraversalPattern.test(val)) {
        console.warn(`🚨 CYBER THREAT DETECTED: Path traversal attempt blocked from IP ${req.ip} in parameter ${keyName}`);
        return 'BLOCKED_PATH_TRAVERSAL';
      }
      // SQL injection signature detection
      if (sqlInjectionPattern.test(val)) {
        console.warn(`🚨 CYBER THREAT DETECTED: SQL Injection signature blocked from IP ${req.ip} in parameter ${keyName}`);
        return 'BLOCKED_SQL_INJECTION';
      }
      // XSS Sanitization
      return xss(val);
    }
    return val;
  };

  let threatDetected = false;

  if (req.body && typeof req.body === 'object') {
    for (let key in req.body) {
      const sanitized = checkSecurity(req.body[key], key);
      if (sanitized === 'BLOCKED_PATH_TRAVERSAL' || sanitized === 'BLOCKED_SQL_INJECTION') {
        threatDetected = true;
      } else {
        req.body[key] = sanitized;
      }
    }
  }

  if (req.query && typeof req.query === 'object') {
    for (let key in req.query) {
      const sanitized = checkSecurity(req.query[key], key);
      if (sanitized === 'BLOCKED_PATH_TRAVERSAL' || sanitized === 'BLOCKED_SQL_INJECTION') {
        threatDetected = true;
      }
    }
  }

  if (threatDetected) {
    return res.status(400).json({
      success: false,
      message: 'Security Violation: Malicious payload pattern detected and blocked by CyberShield.'
    });
  }

  next();
});

// 6. Cyber Security: Slowloris DoS Connection Timeout (30s)
app.use((req, res, next) => {
  res.setTimeout(30000, () => {
    console.warn(`⚠️ Request timeout (30s) triggered for ${req.originalUrl} from IP ${req.ip}`);
    res.status(408).send('Request Timeout - Connection Closed.');
  });
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply Security Rate Limiters to Auth and API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/grievances', apiLimiter, grievancesRoutes);

// Public feed endpoint with parameterized queries
app.get('/api/public/complaints', apiLimiter, async (req, res) => {
  try {
    const pool = await poolPromise;
    const targetDB = process.env.DB_NAME;
    const result = await pool.request().query(`
      SELECT 
        complaint_no, ward_number, department, description, landmark, 
        severity, alternate_phone, media_attachments, status, vote_score, 
        created_at, latitude, longitude, after_media_attachments, complainee_email, location_type, issue_size
      FROM ${targetDB}.dbo.COMPLAINTS
      ORDER BY created_at DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Failed to fetch public complaints:', err);
    res.json([]);
  }
});

// Global Fallback Error Handler - prevents stack trace and sensitive internal leaks
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: 'An unexpected internal error occurred. Request halted safely.'
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🔒 CivicSense OWASP-Hardened Secure Backend online and listening on port ${PORT}`);
});