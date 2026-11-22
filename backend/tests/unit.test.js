/**
 * CivicSense Backend Unit Tests
 * Run with: node --test tests/unit.test.js
 *
 * Uses Node.js built-in test runner (node:test) — no extra dependencies needed.
 */
'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// ─── Inline copies of pure utility functions under test ───────────────────────
// (Extracted from grievances.js so we can test without requiring Express/mssql)

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function determineSeverity(locType, size) {
  const l = (locType || '').toLowerCase();
  const s = (size || '').toLowerCase();
  if (l === 'main_road') {
    if (s === 'large' || s === 'medium') return 'High (Immediate Public Safety Danger / Outage)';
    return 'Medium (Hinders Daily Routine / Minor Hazard)';
  } else {
    if (s === 'large') return 'High (Immediate Public Safety Danger / Outage)';
    if (s === 'medium') return 'Medium (Hinders Daily Routine / Minor Hazard)';
  }
  return 'Low (General Maintenance / Inquiry)';
}

function classifyDepartment(description) {
  const desc = (description || '').toLowerCase();
  if (desc.includes('wire') || desc.includes('power') || desc.includes('electricity') || desc.includes('pole') || desc.includes('transformer') || desc.includes('blackout') || desc.includes('mescom') || desc.includes('electrical')) return 'MESCOM';
  if (desc.includes('sewage') || desc.includes('pipe') || desc.includes('leak') || desc.includes('burst') || desc.includes('manhole') || desc.includes('sewer') || desc.includes('water supply') || desc.includes('drinking water')) return 'Water Supply & Sewage Board';
  if (desc.includes('dog') || desc.includes('animal') || desc.includes('stray') || desc.includes('cow') || desc.includes('cattle') || desc.includes('rabies') || desc.includes('garbage') || desc.includes('trash') || desc.includes('dump') || desc.includes('litter') || desc.includes('pest') || desc.includes('mosquito')) return 'Stray / Animal Welfare & Health Dept';
  return 'MCC';
}

// Blockchain utility (extracted from blockchainLedger.js)
function calculateBlockHash(block) {
  const payload = `${block.index}_${block.timestamp}_${block.action}_${block.dataHash}_${block.previousHash}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateDistance (Haversine)', () => {
  test('same coordinates returns 0', () => {
    const d = calculateDistance(12.9141, 74.8560, 12.9141, 74.8560);
    assert.ok(d < 1, `Expected < 1m, got ${d}`);
  });

  test('known distance: Mangaluru city centre to ~1km north', () => {
    // Approx 1km north of Lalbagh
    const d = calculateDistance(12.9141, 74.8560, 12.9231, 74.8560);
    assert.ok(d > 900 && d < 1100, `Expected ~1000m, got ${d.toFixed(0)}m`);
  });

  test('25-metre proximity threshold', () => {
    // Shift ~0.00022 degrees latitude ≈ 24.5m
    const d = calculateDistance(12.9141, 74.8560, 12.9143, 74.8560);
    assert.ok(d < 25, `Expected < 25m, got ${d.toFixed(1)}m`);
  });
});

describe('determineSeverity (Urgency Matrix)', () => {
  test('main_road + large → High', () => {
    assert.equal(determineSeverity('main_road', 'large'), 'High (Immediate Public Safety Danger / Outage)');
  });

  test('main_road + medium → High', () => {
    assert.equal(determineSeverity('main_road', 'medium'), 'High (Immediate Public Safety Danger / Outage)');
  });

  test('main_road + small → Medium', () => {
    assert.equal(determineSeverity('main_road', 'small'), 'Medium (Hinders Daily Routine / Minor Hazard)');
  });

  test('inner_road + large → High', () => {
    assert.equal(determineSeverity('inner_road', 'large'), 'High (Immediate Public Safety Danger / Outage)');
  });

  test('inner_road + medium → Medium', () => {
    assert.equal(determineSeverity('inner_road', 'medium'), 'Medium (Hinders Daily Routine / Minor Hazard)');
  });

  test('inner_road + small → Low (was undefined before fix)', () => {
    assert.equal(determineSeverity('inner_road', 'small'), 'Low (General Maintenance / Inquiry)');
  });

  test('empty inputs → Low', () => {
    assert.equal(determineSeverity('', ''), 'Low (General Maintenance / Inquiry)');
  });

  test('null inputs → Low', () => {
    assert.equal(determineSeverity(null, null), 'Low (General Maintenance / Inquiry)');
  });
});

describe('classifyDepartment (keyword NLP routing)', () => {
  test('electricity keywords → MESCOM', () => {
    assert.equal(classifyDepartment('Sparking transformer near pole'), 'MESCOM');
  });

  test('water supply keywords → Water Supply & Sewage Board', () => {
    assert.equal(classifyDepartment('Burst water pipe leaking on road'), 'Water Supply & Sewage Board');
  });

  test('garbage keywords → Stray / Animal Welfare & Health Dept', () => {
    assert.equal(classifyDepartment('Illegal garbage dump near school'), 'Stray / Animal Welfare & Health Dept');
  });

  test('road keywords → MCC', () => {
    assert.equal(classifyDepartment('Large pothole on main road'), 'MCC');
  });

  test('empty string → MCC (default)', () => {
    assert.equal(classifyDepartment(''), 'MCC');
  });
});

describe('calculateBlockHash (blockchain integrity)', () => {
  test('hash is deterministic', () => {
    const block = {
      index: 1,
      timestamp: '2026-01-01T00:00:00.000Z',
      action: 'COMPLAINT_FILED',
      dataHash: 'abc123',
      previousHash: '000'
    };
    const h1 = calculateBlockHash(block);
    const h2 = calculateBlockHash(block);
    assert.equal(h1, h2, 'Same inputs must produce same hash');
  });

  test('changing one field changes the hash', () => {
    const block = {
      index: 1,
      timestamp: '2026-01-01T00:00:00.000Z',
      action: 'COMPLAINT_FILED',
      dataHash: 'abc123',
      previousHash: '000'
    };
    const h1 = calculateBlockHash(block);
    const h2 = calculateBlockHash({ ...block, dataHash: 'tampered' });
    assert.notEqual(h1, h2, 'Tampered block must produce different hash');
  });

  test('hash is a valid 64-char hex string', () => {
    const block = { index: 0, timestamp: 'ts', action: 'GENESIS', dataHash: 'd', previousHash: '0' };
    const h = calculateBlockHash(block);
    assert.match(h, /^[0-9a-f]{64}$/, 'Hash must be a 64-char hex string');
  });
});
