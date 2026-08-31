const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
const exifr = require('exifr');

const { sql, poolPromise } = require('../db');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const securityFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    const forbiddenExts = ['.exe', '.sh', '.bat', '.php', '.js', '.html', '.py', '.pl', '.cmd', '.vbs', '.msi', '.dll', '.so'];

    if (forbiddenExts.includes(ext)) {
        return cb(new Error('Security Violation: Executable and script file formats are strictly forbidden.'), false);
    }
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Security Violation: Only secure image and video file formats are permitted.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max file size
    fileFilter: securityFileFilter
});

const classifyDepartment = (description) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('wire') || desc.includes('power') || desc.includes('electricity') || desc.includes('pole') || desc.includes('transformer') || desc.includes('blackout') || desc.includes('mescom') || desc.includes('electrical')) {
        return 'MESCOM';
    }
    if (desc.includes('sewage') || desc.includes('pipe') || desc.includes('leak') || desc.includes('burst') || desc.includes('manhole') || desc.includes('sewer') || desc.includes('water supply') || desc.includes('drinking water')) {
        return 'Water Supply & Sewage Board';
    }
    if (desc.includes('dog') || desc.includes('animal') || desc.includes('stray') || desc.includes('cow') || desc.includes('cattle') || desc.includes('rabies') || desc.includes('garbage') || desc.includes('trash') || desc.includes('dump') || desc.includes('litter') || desc.includes('pest') || desc.includes('mosquito')) {
        return 'Stray / Animal Welfare & Health Dept';
    }
    return 'MCC';
};

// AI auto-routing severity mapping
const classifySeverity = (description) => {
    const desc = (description || '').toLowerCase();
    if (desc.includes('danger') || desc.includes('hazard') || desc.includes('emergency') || desc.includes('sparking') || desc.includes('flooding') || desc.includes('immediate') || desc.includes('accident')) {
        return 'High (Immediate Public Safety Danger / Outage)';
    }
    if (desc.includes('pothole') || desc.includes('broken') || desc.includes('clogged') || desc.includes('smell') || desc.includes('leak')) {
        return 'Medium (Hinders Daily Routine / Minor Hazard)';
    }
    return 'Low (General Maintenance / Inquiry)';
};

// Urgency Matrix - severity calculated deterministically from location type and issue size
const determineSeverity = (locType, size) => {
    const l = (locType || '').toLowerCase();
    const s = (size || '').toLowerCase();
    
    if (l === 'main_road') {
        if (s === 'large' || s === 'medium') {
            return 'High (Immediate Public Safety Danger / Outage)';
        }
        return 'Medium (Hinders Daily Routine / Minor Hazard)';
    } else { // default or inner_road
        if (s === 'large') {
            return 'High (Immediate Public Safety Danger / Outage)';
        }
        if (s === 'medium') {
            return 'Medium (Hinders Daily Routine / Minor Hazard)';
        }
    }
};

const MANGALORE_WARD_ALIASES = {
    1: ['surathkal', 'nitk', 'surathkal west', 'beach', 'tadambail', 'idya'],
    2: ['surathkal', 'surathkal east', 'janatha colony', 'kana'],
    3: ['katipalla', 'katipalla east', 'kaikamba', 'ganeshpura'],
    4: ['katipalla', 'krishnapura', 'katipalla krishnapura'],
    5: ['katipalla', 'katipalla north', 'mrpl', 'kuthethoor'],
    6: ['idya', 'idya east', 'surathkal', 'hosabettu'],
    7: ['idya', 'idya west', 'surathkal'],
    8: ['hosabettu', 'kulai'],
    9: ['kulai', 'honnakatte'],
    10: ['baikampady', 'apmc', 'meenakaliya', 'industrial area'],
    11: ['panambur', 'bengre', 'nmpt', 'port', 'panambur bengre'],
    12: ['panjimogaru', 'kulur', 'vidyanagar'],
    13: ['kunjathbail', 'kunjathbail north', 'maravoor', 'airport road'],
    14: ['marakada', 'bondel', 'kavoor', 'airport road'],
    15: ['kunjathbail', 'kunjathbail south', 'bondel', 'surathkal'],
    16: ['bengre kulur', 'kulur', 'bengre'],
    17: ['derebail north', 'konchady'],
    // Note: 'bondel' spans Wards 14, 15 & 18 — handled separately
    18: ['kavoor', 'bondel', 'pacchanady', 'airport road'],
    19: ['pacchanady', 'vamanjoor', 'kudupu'],
    20: ['tiruvail', 'vamanjoor', 'st joseph'],
    21: ['padavu', 'padavu west', 'shakthinagar'],
    22: ['kadri', 'kadri padav', 'shakthinagar', 'padav'],
    23: ['derebail', 'derebail east', 'kuntikan', 'aj hospital'],
    24: ['derebail', 'derebail south', 'bejai', 'kapikad'],
    25: ['derebail', 'derebail west', 'kottara', 'kottara chowki'],
    26: ['derebail', 'derebail central', 'landlinks', 'urwa stores'],
    27: ['boloor', 'sultan battery', 'ladyhill'],
    28: ['mannagudda', 'urwa', 'canara high school'],
    29: ['kambla', 'alake', 'kudroli'],
    30: ['kodialbail', 'mg road', 'pvs', 'empire mall', 'sharada'],
    31: ['bejai', 'ksrtc', 'city centre', 'circuit house', 'museum'],
    32: ['kadri', 'kadri north', 'mallikatte', 'temple'],
    33: ['kadri', 'kadri south', 'shivbagh', 'nanthoor'],
    34: ['shivbagh', 'kadri', 'bikarnakatte'],
    35: ['padavu', 'padavu central', 'bikarnakatte', 'kulshekar'],
    36: ['padav', 'padav east', 'kulshekar', 'cordel'],
    37: ['maroli', 'kulashekara', 'nanthoor'],
    38: ['bendoor', 'bendoorwell', 'st agnes'],
    39: ['falnir', 'kmc', 'highland', 'avery'],
    40: ['court', 'hampankatta', 'ks rao road', 'light house hill'],
    41: ['central market', 'market', 'town hall', 'railway station'],
    42: ['donkarakery', 'dongerkery', 'car street', 'venkataramana'],
    43: ['kudroli', 'gokarnanatheshwara', 'alake'],
    44: ['bunder', 'old port', 'central market'],
    45: ['port', 'bunder', 'fisheries'],
    46: ['cantonment', 'clock tower', 'nehru maidan'],
    47: ['milagres', 'hampankatta', 'resaldar'],
    48: ['valencia', 'kankanady', 'kankanady valencia', 'father muller'],
    49: ['kankanady', 'pumpwell', 'mahaveer circle'],
    50: ['alape', 'alape south', 'padil'],
    51: ['alape', 'alape north', 'padil', 'shakthinagar'],
    52: ['kannur', 'adyar', 'bc road'],
    53: ['bajal', 'faisal nagar'],
    54: ['jeppinamogaru', 'pumpwell', 'netravathi bridge'],
    55: ['attavara', 'attavar', 'kmc hospital', 'chakrapani'],
    56: ['mangaladevi', 'bolar', 'temple'],
    57: ['hoigebazar', 'hoige bazaar', 'bolar', 'fisheries college'],
    58: ['bolara', 'bolar', 'tile factory'],
    59: ['jeppu', 'morgans gate', 'cascia'],
    60: ['bengre', 'kasba bengre', 'alive bagilu']
};

// AI Location Type & Issue Size Classification Engine
const determineAILocationAndSize = (description = '', landmark = '', resolvedAddr = '', category = '', aiResult = null) => {
    // 1. If Gemini Vision AI returned explicit classification, use it if valid
    if (aiResult) {
        let locType = (aiResult.location_type || '').toLowerCase().trim();
        let size = (aiResult.issue_size || '').toLowerCase().trim();
        
        if ((locType === 'main_road' || locType === 'inner_road') &&
            (size === 'small' || size === 'medium' || size === 'large')) {
            return { locationType: locType, issueSize: size };
        }
        if (locType === 'main_road' || locType === 'inner_road') {
            return { locationType: locType, issueSize: 'medium' };
        }
        if (size === 'small' || size === 'medium' || size === 'large') {
            return { locationType: 'inner_road', issueSize: size };
        }
    }

    // 2. Intelligent NLP / Telemetry classification from description, landmark, geocoding & category
    const descText = (description || '').toLowerCase();
    const fullText = `${description} ${landmark} ${resolvedAddr} ${category}`.toLowerCase();

    // Inner road indicators (checked first against description for explicit context)
    const innerRoadKeywords = [
        'inner road', 'inner residential', 'residential street', 'residential lane',
        'inner street', 'colony street', 'quiet lane', 'residential area', 'inner'
    ];
    
    // Main road indicators
    const mainRoadKeywords = [
        'main road', 'highway', 'national highway', 'expressway',
        'nh66', 'mg road', 'ksrtc', 'bypass', 'circle', 'junction', 'flyover',
        'avenue', 'arterial', 'main street', 'bus stand', 'commercial', 'market'
    ];

    let locationType = 'inner_road';
    if (innerRoadKeywords.some(kw => descText.includes(kw))) {
        locationType = 'inner_road';
    } else if (mainRoadKeywords.some(kw => fullText.includes(kw)) || fullText.includes('sh67')) {
        locationType = 'main_road';
    }

    // Issue Size / Scale (small vs medium vs large)
    const largeKeywords = [
        'large', 'huge', 'massive', 'severe', 'widespread', 'burst', 'collapsed',
        'flooding', 'flood', 'crater', 'outage', 'blackout', 'transformer', 'snapped',
        'blockage', 'dangerous', 'emergency', 'heavy', 'deep', 'entire', 'disaster'
    ];
    const smallKeywords = [
        'small', 'minor', 'isolated', 'little', 'single', 'tile', 'light',
        'scratch', 'slight', 'patch', 'crack'
    ];

    let issueSize = 'medium';
    if (largeKeywords.some(kw => fullText.includes(kw))) {
        issueSize = 'large';
    } else if (smallKeywords.some(kw => fullText.includes(kw))) {
        issueSize = 'small';
    }

    return { locationType, issueSize };
};

// OpenStreetMap Reverse Geocoding helper
const reverseGeocode = async (lat, lon) => {
    try {
        if (typeof fetch !== 'undefined') {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
                headers: { 'User-Agent': 'CivicSense-App/1.0' }
            });
            if (response.ok) {
                const data = await response.json();
                if (data && data.display_name) {
                    return data.display_name;
                }
            }
        }
    } catch (e) {
        console.error('Reverse geocoding error:', e);
    }
    return '';
};

// Coordinate-to-Ward lookup engine for Mangaluru zones mapping to 60 official municipal wards
const getMangaluruWard = (lat, lon, address = '') => {
    const addr = (address || '').toLowerCase();
    
    const WARD_LIST = {
        1: "Ward 1 - Surathkal West",
        2: "Ward 2 - Surathkal East",
        3: "Ward 3 - Katipalla East",
        4: "Ward 4 - Katipalla Krishnapura",
        5: "Ward 5 - Katipalla North",
        6: "Ward 6 - Idya East",
        7: "Ward 7 - Idya West",
        8: "Ward 8 - Hosabettu",
        9: "Ward 9 - Kulai",
        10: "Ward 10 - Baikampady",
        11: "Ward 11 - Panambur Bengre",
        12: "Ward 12 - Panjimogaru",
        13: "Ward 13 - Kunjathbail North",
        14: "Ward 14 - Marakada",
        15: "Ward 15 - Kunjathbail South",
        16: "Ward 16 - Bengre Kulur",
        17: "Ward 17 - Derebail North",
        18: "Ward 18 - Kavoor",
        19: "Ward 19 - Pacchanady",
        20: "Ward 20 - Tiruvail",
        21: "Ward 21 - Padavu West",
        22: "Ward 22 - Kadri Padav",
        23: "Ward 23 - Derebail East",
        24: "Ward 24 - Derebail South",
        25: "Ward 25 - Derebail West",
        26: "Ward 26 - Derebail Central",
        27: "Ward 27 - Boloor",
        28: "Ward 28 - Mannagudda",
        29: "Ward 29 - Kambla",
        30: "Ward 30 - Kodialbail",
        31: "Ward 31 - Bejai",
        32: "Ward 32 - Kadri North",
        33: "Ward 33 - Kadri South",
        34: "Ward 34 - Shivbagh",
        35: "Ward 35 - Padavu Central",
        36: "Ward 36 - Padav East",
        37: "Ward 37 - Maroli",
        38: "Ward 38 - Bendoor",
        39: "Ward 39 - Falnir",
        40: "Ward 40 - Court",
        41: "Ward 41 - Central Market",
        42: "Ward 42 - Donkarakery",
        43: "Ward 43 - Kudroli",
        44: "Ward 44 - Bunder",
        45: "Ward 45 - Port",
        46: "Ward 46 - Cantonment",
        47: "Ward 47 - Milagres",
        48: "Ward 48 - Kankanady Valencia",
        49: "Ward 49 - Kankanady",
        50: "Ward 50 - Alape South",
        51: "Ward 51 - Alape North",
        52: "Ward 52 - Kannur",
        53: "Ward 53 - Bajal",
        54: "Ward 54 - Jeppinamogaru",
        55: "Ward 55 - Attavara",
        56: "Ward 56 - Mangaladevi",
        57: "Ward 57 - Hoigebazar",
        58: "Ward 58 - Bolara",
        59: "Ward 59 - Jeppu",
        60: "Ward 60 - Bengre"
    };

    let matchesFound = [];
    const checkMatch = (keyword, wardName) => {
        const escaped = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('\\b' + escaped + '\\b', 'i');
        const matchResult = addr.match(regex);
        if (matchResult) {
            matchesFound.push({
                wardName,
                index: matchResult.index
            });
        }
    };

    // Text matching heuristics from geocoding address or landmarks using word boundaries
    checkMatch('surathkal west', WARD_LIST[1]);
    checkMatch('surathkal east', WARD_LIST[2]);
    const surathkalIndex = addr.match(/\bsurathkal\b/i)?.index;
    if (surathkalIndex !== undefined) {
        matchesFound.push({
            wardName: lon < 74.795 ? WARD_LIST[1] : WARD_LIST[2],
            index: surathkalIndex
        });
    }

    checkMatch('katipalla east', WARD_LIST[3]);
    checkMatch('katipalla krishnapura', WARD_LIST[4]);
    checkMatch('krishnapura', WARD_LIST[4]);
    checkMatch('katipalla north', WARD_LIST[5]);
    checkMatch('katipalla', WARD_LIST[5]);
    checkMatch('idya east', WARD_LIST[6]);
    checkMatch('idya west', WARD_LIST[7]);
    checkMatch('idya', WARD_LIST[7]);
    checkMatch('hosabettu', WARD_LIST[8]);
    checkMatch('kulai', WARD_LIST[9]);
    checkMatch('baikampady', WARD_LIST[10]);
    checkMatch('baikampadi', WARD_LIST[10]);
    checkMatch('panambur', WARD_LIST[11]);
    checkMatch('panjimogaru', WARD_LIST[12]);
    checkMatch('panjimogar', WARD_LIST[12]);
    checkMatch('kunjathbail north', WARD_LIST[13]);
    checkMatch('marakada', WARD_LIST[14]);
    checkMatch('kunjathbail south', WARD_LIST[15]);
    checkMatch('kunjathbail', WARD_LIST[15]);
    checkMatch('bengre kulur', WARD_LIST[16]);
    checkMatch('kulur', WARD_LIST[16]);
    checkMatch('derebail north', WARD_LIST[17]);
    checkMatch('konchady', WARD_LIST[17]);
    checkMatch('bondel', WARD_LIST[18]);
    checkMatch('kavoor', WARD_LIST[18]);
    checkMatch('pacchanady', WARD_LIST[19]);
    checkMatch('pachanady', WARD_LIST[19]);
    checkMatch('tiruvail', WARD_LIST[20]);
    checkMatch('padavu west', WARD_LIST[21]);
    checkMatch('kadri padav', WARD_LIST[22]);
    checkMatch('derebail east', WARD_LIST[23]);
    checkMatch('derebail south', WARD_LIST[24]);
    checkMatch('derebail west', WARD_LIST[25]);
    checkMatch('derebail central', WARD_LIST[26]);
    checkMatch('derebail', WARD_LIST[26]);
    checkMatch('boloor', WARD_LIST[27]);
    checkMatch('bolur', WARD_LIST[27]);
    checkMatch('mannagudda', WARD_LIST[28]);
    checkMatch('kambla', WARD_LIST[29]);
    checkMatch('kodialbail', WARD_LIST[30]);
    checkMatch('kodial bail', WARD_LIST[30]);
    checkMatch('bejai', WARD_LIST[31]);
    checkMatch('kadri north', WARD_LIST[32]);
    checkMatch('kadri south', WARD_LIST[33]);
    const generalKadri = addr.match(/\bkadri\b/i)?.index;
    if (generalKadri !== undefined && !addr.includes('kadri padav')) {
        matchesFound.push({ wardName: WARD_LIST[33], index: generalKadri });
    }
    checkMatch('shivbagh', WARD_LIST[34]);
    checkMatch('shivabagh', WARD_LIST[34]);
    checkMatch('padavu central', WARD_LIST[35]);
    checkMatch('padav east', WARD_LIST[36]);
    checkMatch('padavu east', WARD_LIST[36]);
    checkMatch('maroli', WARD_LIST[37]);
    checkMatch('bendoor', WARD_LIST[38]);
    checkMatch('bendore', WARD_LIST[38]);
    checkMatch('falnir', WARD_LIST[39]);
    checkMatch('court', WARD_LIST[40]);
    checkMatch('central market', WARD_LIST[41]);
    checkMatch('donkarakery', WARD_LIST[42]);
    checkMatch('dongerkery', WARD_LIST[42]);
    checkMatch('dongarkery', WARD_LIST[42]);
    checkMatch('kudroli', WARD_LIST[43]);
    checkMatch('bunder', WARD_LIST[44]);
    checkMatch('port', WARD_LIST[45]);
    checkMatch('cantonment', WARD_LIST[46]);
    checkMatch('milagres', WARD_LIST[47]);
    checkMatch('valencia', WARD_LIST[48]);
    checkMatch('kankanady valencia', WARD_LIST[48]);
    checkMatch('kankanady', WARD_LIST[49]);
    checkMatch('alape south', WARD_LIST[50]);
    checkMatch('alape north', WARD_LIST[51]);
    checkMatch('alape', WARD_LIST[51]);
    checkMatch('kannur', WARD_LIST[52]);
    checkMatch('bajal', WARD_LIST[53]);
    checkMatch('jeppinamogaru', WARD_LIST[54]);
    checkMatch('attavara', WARD_LIST[55]);
    checkMatch('attavar', WARD_LIST[55]);
    checkMatch('mangaladevi', WARD_LIST[56]);
    checkMatch('hoigebazar', WARD_LIST[57]);
    checkMatch('hoige bazar', WARD_LIST[57]);
    checkMatch('bolara', WARD_LIST[58]);
    checkMatch('jeppu', WARD_LIST[59]);
    checkMatch('bengre', WARD_LIST[60]);

    if (matchesFound.length > 0) {
        matchesFound.sort((a, b) => a.index - b.index);
        return matchesFound[0].wardName;
    }

    // Fallback spatial grid bounding tests based on Mangaluru GPS data
    if (lat > 12.97) {
        if (lon < 74.795) return WARD_LIST[1];
        if (lon < 74.810) return WARD_LIST[7];
        return WARD_LIST[2];
    }
    if (lat > 12.93) {
        if (lon < 74.80) return WARD_LIST[11];
        if (lon < 74.825) return WARD_LIST[10];
        if (lon < 74.845) return WARD_LIST[12];
        return WARD_LIST[15];
    }
    if (lat > 12.90) {
        if (lon < 74.835) return WARD_LIST[25];
        if (lon < 74.855) return WARD_LIST[26];
        if (lon < 74.875) return WARD_LIST[18];
        return WARD_LIST[19];
    }
    if (lat > 12.87) {
        if (lon < 74.825) return WARD_LIST[27];
        if (lon < 74.840) return WARD_LIST[31];
        if (lon < 74.855) return WARD_LIST[32];
        return WARD_LIST[36];
    }
    if (lat > 12.85) {
        if (lon < 74.835) return WARD_LIST[44];
        if (lon < 74.845) return WARD_LIST[41];
        return WARD_LIST[47];
    }
    
    // South of 12.85
    if (lon < 74.83) return WARD_LIST[59];
    if (lon < 74.855) return WARD_LIST[49];
    if (lon < 74.87) return WARD_LIST[53];
    return WARD_LIST[52];
};

// Gemini AI Multimodal analysis for grievance photos
// Model cascade: tries each model in order, skips on quota (429) or not-found (404)
// Priority: gemini-3.1-flash-lite (active & verified) → gemini-3.5-flash → gemini-2.0-flash → gemini-2.0-flash-lite
const GEMINI_MODELS = [
    'gemini-3.1-flash-lite',  // Confirmed working and has active quota
    'gemini-3.5-flash',       // High-demand fallback
    'gemini-2.0-flash',       // Standard model
    'gemini-2.0-flash-lite',  // Lite model
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const analyzePhotoWithAI = async (filePath, userDescription, userFeedback = '', previousSummary = '') => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.log('⚠️ GEMINI_API_KEY not set. Using rule-based local routing.');
        return null;
    }

    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const lowerPath = filePath.toLowerCase();
    let mimeType = 'image/jpeg';
    if (lowerPath.endsWith('.png'))  mimeType = 'image/png';
    if (lowerPath.endsWith('.webp')) mimeType = 'image/webp';
    if (lowerPath.endsWith('.heic')) mimeType = 'image/heic';
    if (lowerPath.endsWith('.heif')) mimeType = 'image/heif';

    let rejectionSection = '';
    if (userFeedback && userFeedback.trim() !== '') {
        rejectionSection = `
───────────────────────────────────────────
USER REJECTION & CORRECTION FEEDBACK (HIGH PRIORITY)
───────────────────────────────────────────
The user rejected the previous AI summary: "${previousSummary || 'Previous classification'}"
User's explanation of what was incorrect/missing: "${userFeedback}"

CRITICAL INSTRUCTION: Re-examine the photograph carefully taking the user's feedback into account. Adjust the category, department, severity, and factual description to correct any previous mistake and align with what is visible in the photo according to the user's correction.
`;
    }

    const prompt = `You are a trained civic-issue inspector and AI grievance classifier deployed for Mangaluru (Mangalore), Karnataka, India. Your job is to examine the photograph and classify the civic problem shown with precision.
${rejectionSection}

───────────────────────────────────────────
STEP 1 — VISUAL INSPECTION
───────────────────────────────────────────
Look carefully at every part of the image. Identify objects, infrastructure, surroundings, and visible damage. Do NOT rely on the user text alone — the image is the primary evidence.

───────────────────────────────────────────
STEP 2 — CATEGORY CLASSIFICATION
───────────────────────────────────────────
Pick EXACTLY ONE category from the list below. Output the category string verbatim.

MESCOM — Power Grid:
  "Damaged Utility Poles"             → leaning, cracked, or structurally unsafe electric poles (even if upright but visibly damaged; includes poles in grass, bushes, or trees)
  "Fallen or Low-Hanging Power Lines" → wires drooping to road level, snapped cables, broken overhead lines
  "Sparking Transformers / Substation Faults" → transformer boxes emitting sparks, smoke, or burning smell; substation faults
  "Frequent or Unannounced Power Outages" → dark streets/areas, offline grid; report of supply failure with no visible physical damage

MCC — Civil / Roads:
  "Potholes and Road Damage"          → craters, holes, broken asphalt, cave-ins on road surface
  "Footpath and Pedestrian Hazards"   → broken/missing pavement slabs, uneven tiles, debris blocking walkway
  "Open Drains and Stormwater Overflows" → uncovered roadside drains, blocked gutters, waterlogging on road
  "Public Parks and Playgrounds"      → damaged benches, broken swings, unkempt park infrastructure

Water Supply & Sewage Board:
  "Water Main Leaks / Pipe Bursts"    → water gushing from underground mains, burst pipes, flooded road from supply line
  "Contaminated Water Supply"         → discoloured, muddy, or foul-smelling tap supply
  "Overflowing or Blocked Manholes"   → sewage/black water spilling from manhole, blocked sewer pit
  "Missing Manhole Covers"            → open exposed manhole pit with no cover, dangerous to pedestrians/vehicles

Stray / Animal Welfare & Health Dept:
  "Stray Animal Menace"               → aggressive packs of stray dogs, animals blocking roads or creating hazard
  "Injured or Abandoned Cattle"       → injured cow/buffalo/bullock lying on or near road
  "Illegal Garbage Dumping"           → large illegal garbage heap, construction debris or domestic waste dumped on public land
  "Pest / Vector-Borne Outbreaks"     → mosquito breeding sites, stagnant water pools, visible fogging or pest activity

If nothing clearly matches, pick the closest option. Do NOT invent new categories.

───────────────────────────────────────────
STEP 3 — DEPARTMENT ROUTING
───────────────────────────────────────────
Based solely on the category above, assign the department:
  "MESCOM"                                 → for any of the 4 MESCOM categories
  "MCC"                                    → for any of the 4 MCC categories
  "Water Supply & Sewage Board"            → for any of the 4 Water Board categories
  "Stray / Animal Welfare & Health Dept"   → for any of the 4 Health/Animal categories

───────────────────────────────────────────
STEP 4 — SEVERITY ASSESSMENT
───────────────────────────────────────────
  "High (Immediate Public Safety Danger / Outage)"  → live/sparking wires, fallen poles blocking road, deep cave-in potholes, open manholes in traffic, sewage contamination, aggressive animal attack risk, severe flooding
  "Medium (Hinders Daily Routine / Minor Hazard)"   → moderate potholes, partial drain overflow, garbage accumulation, dim streetlight, minor water leak, stray cattle loitering
  "Low (General Maintenance / Inquiry)"             → cosmetic road cracks, minor footpath tile issues, slight park disrepair, general maintenance requests

───────────────────────────────────────────
STEP 5 — FACTUAL DESCRIPTION
───────────────────────────────────────────
Write a clear, factual 2-3 sentence official complaint description of exactly what is visible in the image. Mention the location type (road, footpath, junction, residential area) if discernible. Do not copy the user text verbatim — produce a polished municipal complaint.

User's additional comments (supplementary context only): "${userDescription || 'No additional comments provided.'}"

───────────────────────────────────────────
OUTPUT FORMAT — MANDATORY
───────────────────────────────────────────
Respond ONLY with a single raw JSON object. No markdown, no code fences, no extra text:
{
  "issue_detected": "<exact category string from STEP 2>",
  "description": "<2-3 sentence official complaint>",
  "department": "<exact department from STEP 3>",
  "location_type": "<'main_road' if located on main road/highway/arterial/junction, otherwise 'inner_road'>",
  "issue_size": "<'small' for minor/isolated, 'large' for severe/widespread/dangerous, otherwise 'medium'>",
  "severity": "<exact severity from STEP 4>"
}`;

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Image } }
            ]
        }],
        generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 0.9,
            maxOutputTokens: 512
        }
    };

    // ── Model cascade: try each model, skip on 429/quota, retry once on transient errors ──
    for (const model of GEMINI_MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        console.log(`🤖 Trying Gemini model: ${model} ...`);

        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
        } catch (networkErr) {
            console.error(`❌ Network error with ${model}:`, networkErr.message);
            continue;  // try next model
        }

        // ── 429 Quota Exhausted ──
        if (response.status === 429) {
            const errData = await response.json().catch(() => ({}));

            // If daily limit is 0, no point waiting — skip to next model instantly
            const isDailyExhausted = JSON.stringify(errData).includes('limit: 0') ||
                JSON.stringify(errData).includes('"limit":0') ||
                JSON.stringify(errData).includes('PerDay');

            if (isDailyExhausted) {
                console.warn(`⏭️  ${model} daily quota exhausted (limit:0). Skipping to next model instantly.`);
                continue;
            }

            // Otherwise honour the retry-delay for per-minute limits
            const retryAfterMs = (() => {
                try {
                    const delayStr = errData?.error?.details?.find(d => d.retryDelay)?.retryDelay || '10s';
                    return (parseInt(delayStr) || 10) * 1000;
                } catch { return 10000; }
            })();
            console.warn(`⏳ ${model} rate limited (429). Waiting ${retryAfterMs / 1000}s then trying next model...`);
            await sleep(Math.min(retryAfterMs, 15000));  // cap wait at 15s
            continue;
        }

        // ── 5xx Server Error: wait briefly and retry once ──
        if (response.status >= 500) {
            console.warn(`⚠️ ${model} returned ${response.status}. Retrying once after 5s...`);
            await sleep(5000);
            try {
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });
            } catch (retryErr) {
                console.error(`❌ Retry network error with ${model}:`, retryErr.message);
                continue;
            }
        }

        // ── Success ──
        if (response.ok) {
            try {
                const data = await response.json();
                const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (!rawText) {
                    console.warn(`⚠️ ${model} returned empty text. Trying next model.`);
                    continue;
                }
                // Strip markdown code fences if the model wraps output
                const jsonText = rawText.trim()
                    .replace(/^```(?:json)?\s*/i, '')
                    .replace(/\s*```$/, '')
                    .trim();
                const aiResult = JSON.parse(jsonText);
                console.log(`✅ [${model}] Classification: [${aiResult.issue_detected}] → ${aiResult.department} | ${aiResult.severity}`);
                return aiResult;
            } catch (parseErr) {
                console.error(`❌ Failed to parse ${model} response:`, parseErr.message);
                continue;
            }
        }

        // ── Other HTTP error (404 model not found, 400 bad request, etc.) → try next ──
        const errText = await response.text();
        console.error(`❌ ${model} error (${response.status}):`, errText.slice(0, 200));
        // Only hard-stop on auth errors — API key issues affect all models equally
        if (response.status === 401 || response.status === 403) {
            console.error('🔑 API key is invalid or unauthorized. Check GEMINI_API_KEY in .env');
            break;
        }
        // 404 = model not available on this API version → continue to next
        continue;
    }

    console.warn('⚠️ All Gemini models exhausted or failed. Using local fallback classifier.');
    return null;
};

// Local fallback routing logic if API key is not present or query fails

const localFallbackClassifier = (fileName, userDescription) => {
    console.log('⚠️ Running local fallback classifier.');
    const t = `${fileName} ${userDescription || ''}`.toLowerCase();

    let issue_detected = 'Potholes and Road Damage';  // safe MCC default
    let department = 'MCC';
    let severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
    let description = userDescription || 'A civic concern has been reported by a community member.';

    // ---- MESCOM — Power Grid ----
    if (
        t.includes('wire') || t.includes('electric') || t.includes('electricity') ||
        t.includes('pole') || t.includes('transformer') || t.includes('blackout') ||
        t.includes('mescom') || t.includes('streetlight') || t.includes('lamp') ||
        t.includes('spark') || t.includes('power') || t.includes('outage') || t.includes('voltage')
    ) {
        department = 'MESCOM';
        if (t.includes('spark') || t.includes('transformer') || t.includes('substation')) {
            issue_detected = 'Sparking Transformers / Substation Faults';
            severity = 'High (Immediate Public Safety Danger / Outage)';
            description = userDescription || 'A transformer or electrical substation is sparking or showing signs of fire risk. MESCOM emergency intervention required immediately.';
        } else if (t.includes('fallen') || t.includes('down') || t.includes('collapsed') || t.includes('leaning') || t.includes('damaged') || t.includes('pole')) {
            issue_detected = 'Damaged Utility Poles';
            severity = 'High (Immediate Public Safety Danger / Outage)';
            description = userDescription || 'A utility electric pole has fallen or is dangerously leaning, posing an immediate public safety risk. MESCOM must attend urgently.';
        } else if (t.includes('wire') || t.includes('low-hanging') || t.includes('snapped') || t.includes('hanging')) {
            issue_detected = 'Fallen or Low-Hanging Power Lines';
            severity = 'High (Immediate Public Safety Danger / Outage)';
            description = userDescription || 'Power lines are hanging at road level or have snapped, creating an electrocution hazard. MESCOM and Fire Rescue must respond immediately.';
        } else if (t.includes('streetlight') || t.includes('lamp') || t.includes('light')) {
            issue_detected = 'Damaged Utility Poles';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'Streetlight infrastructure is non-functional. Creates unsafe nighttime conditions for pedestrians and motorists.';
        } else if (t.includes('outage') || t.includes('blackout') || t.includes('power cut')) {
            issue_detected = 'Frequent or Unannounced Power Outages';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'A power outage or supply failure has been reported in the area. MESCOM grid inspection required.';
        } else {
            issue_detected = 'Damaged Utility Poles';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'Electrical infrastructure issue reported. MESCOM assessment and repair required.';
        }
    }

    // ---- Water Supply & Sewage Board ----
    else if (
        t.includes('sewage') || t.includes('sewer') || t.includes('manhole') ||
        t.includes('water main') || t.includes('pipe burst') || t.includes('burst pipe') ||
        t.includes('contaminated water') || t.includes('muddy water') || t.includes('water supply')
    ) {
        department = 'Water Supply & Sewage Board';
        if (t.includes('missing manhole') || t.includes('open manhole') || t.includes('no cover')) {
            issue_detected = 'Missing Manhole Covers';
            severity = 'High (Immediate Public Safety Danger / Outage)';
            description = userDescription || 'A manhole cover is missing or open, posing a serious hazard to pedestrians and vehicles. Requires emergency closure by the Water Board.';
        } else if (t.includes('manhole') || t.includes('sewage') || t.includes('sewer') || t.includes('overflow')) {
            issue_detected = 'Overflowing or Blocked Manholes';
            severity = 'High (Immediate Public Safety Danger / Outage)';
            description = userDescription || 'Raw sewage is overflowing from a blocked manhole creating a public health and safety hazard. Water Board intervention required immediately.';
        } else if (t.includes('contaminated') || t.includes('muddy') || t.includes('dirty water') || t.includes('foul')) {
            issue_detected = 'Contaminated Water Supply';
            severity = 'High (Immediate Public Safety Danger / Outage)';
            description = userDescription || 'The tap water supply appears contaminated or discoloured. This is a public health risk requiring immediate water quality inspection by the Water Board.';
        } else {
            issue_detected = 'Water Main Leaks / Pipe Bursts';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'A water main leak or pipe burst has been detected. Requires urgent repair by the Water Supply and Sewage Board to prevent road damage.';
        }
    }

    // ---- Stray / Animal Welfare & Health Dept ----
    else if (
        t.includes('dog') || t.includes('cow') || t.includes('animal') || t.includes('stray') ||
        t.includes('cattle') || t.includes('bite') || t.includes('rabies') || t.includes('buffalo') ||
        t.includes('monkey') || t.includes('pig') || t.includes('garbage') || t.includes('waste') ||
        t.includes('trash') || t.includes('litter') || t.includes('dump') || t.includes('pest') ||
        t.includes('mosquito') || t.includes('vector')
    ) {
        department = 'Stray / Animal Welfare & Health Dept';
        if (t.includes('cattle') || t.includes('cow') || t.includes('buffalo') || t.includes('injured animal') || t.includes('abandoned')) {
            issue_detected = 'Injured or Abandoned Cattle';
            severity = t.includes('injur') ? 'High (Immediate Public Safety Danger / Outage)' : 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'Stray or injured cattle are blocking or loitering near the road, posing a traffic hazard. Veterinary and traffic intervention required.';
        } else if (t.includes('garbage') || t.includes('waste') || t.includes('trash') || t.includes('dump') || t.includes('litter')) {
            issue_detected = 'Illegal Garbage Dumping';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'Illegal garbage dumping has been reported at this location. Solid Waste Management clearance by MCC Health Dept required.';
        } else if (t.includes('pest') || t.includes('mosquito') || t.includes('vector') || t.includes('stagnant')) {
            issue_detected = 'Pest / Vector-Borne Outbreaks';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'A pest breeding site or mosquito-prone stagnant water area has been identified. Health Dept fogging and vector control required.';
        } else {
            issue_detected = 'Stray Animal Menace';
            severity = t.includes('bite') || t.includes('attack') || t.includes('aggressive')
                ? 'High (Immediate Public Safety Danger / Outage)'
                : 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'Stray dogs or animals are creating a nuisance or safety hazard in a public area. Animal Welfare Control intervention required.';
        }
    }

    // ---- MCC — Civil / Roads (default) ----
    else {
        department = 'MCC';
        if (t.includes('pothole') || t.includes('crater') || t.includes('cave') || t.includes('asphalt') || t.includes('road damage')) {
            issue_detected = 'Potholes and Road Damage';
            severity = 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'A pothole or road surface damage has been reported. This poses risk to vehicles and two-wheelers. Road repair required by MCC.';
        } else if (t.includes('footpath') || t.includes('pavement') || t.includes('sidewalk') || t.includes('tiles') || t.includes('pedestrian')) {
            issue_detected = 'Footpath and Pedestrian Hazards';
            severity = 'Low (General Maintenance / Inquiry)';
            description = userDescription || 'Broken or uneven footpath tiles are creating a pedestrian hazard, especially for the elderly and visually impaired.';
        } else if (t.includes('tree') || t.includes('branch') || t.includes('uprooted')) {
            issue_detected = 'Potholes and Road Damage';  // MCC Horticulture handles trees
            severity = t.includes('block') || t.includes('fell') ? 'High (Immediate Public Safety Danger / Outage)' : 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'A fallen tree or large overhanging branch is blocking the road. MCC Horticulture Wing and Fire Rescue clearance required.';
        } else if (t.includes('drain') || t.includes('flood') || t.includes('waterlog') || t.includes('gutter') || t.includes('stormwater')) {
            issue_detected = 'Open Drains and Stormwater Overflows';
            severity = t.includes('flood') ? 'High (Immediate Public Safety Danger / Outage)' : 'Medium (Hinders Daily Routine / Minor Hazard)';
            description = userDescription || 'Clogged or open storm drains are causing waterlogging on the road. MCC drain clearance required.';
        } else if (t.includes('park') || t.includes('playground') || t.includes('bench') || t.includes('swing')) {
            issue_detected = 'Public Parks and Playgrounds';
            severity = 'Low (General Maintenance / Inquiry)';
            description = userDescription || 'Public park or playground infrastructure is damaged or in disrepair. MCC maintenance team inspection required.';
        } else {
            issue_detected = 'Potholes and Road Damage';
            severity = 'Low (General Maintenance / Inquiry)';
            description = userDescription || 'A general road or civic complaint has been submitted. MCC inspection and action required.';
        }
    }

    // Override severity for any explicitly urgent keywords
    if (
        t.includes('danger') || t.includes('emergency') || t.includes('accident') ||
        t.includes('immediate') || t.includes('urgent') || t.includes('critical') ||
        t.includes('injury') || t.includes('death') || t.includes('fire')
    ) {
        severity = 'High (Immediate Public Safety Danger / Outage)';
    }

    return { issue_detected, description, department, severity };

};

const dispatchGrievanceEmails = async (complaintNo, wardNumber, department, description, landmark, severity, createdAt, complaineeEmail, category, userSelectedDepartment) => {
    try {
        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // Query whitelisted officials
        const officialsResult = await pool.request().query(`
            SELECT email, role, department, ward_assignment 
            FROM ${targetDB}.dbo.APPROVED_OFFICIALS
        `);

        const extractWardNumber = (wardStr) => {
            if (!wardStr) return null;
            const match = String(wardStr).match(/Ward\s+(\d+)/i);
            return match ? parseInt(match[1], 10) : null;
        };

        const targetWardNum = extractWardNumber(wardNumber);
        const userSelectedDept = userSelectedDepartment || department;

        let corporatorEmails = [];
        let officerEmails = [];

        officialsResult.recordset.forEach(official => {
            const userWardStr = (official.ward_assignment || '').trim().toLowerCase();
            const userWardNum = extractWardNumber(official.ward_assignment);

            let isWardMatch = userWardStr === 'all wards' ||
                                (targetWardNum !== null && userWardNum !== null && targetWardNum === userWardNum) ||
                                (userWardStr === String(wardNumber).trim().toLowerCase());

            if (!isWardMatch && userWardNum !== null) {
                const userWardAliases = MANGALORE_WARD_ALIASES[userWardNum] || [];
                const fullText = `${landmark || ''} ${description || ''} ${wardNumber || ''}`.toLowerCase();
                if (userWardAliases.some(alias => fullText.includes(alias))) {
                    isWardMatch = true;
                }
            }

            if (!isWardMatch) return;

            if (official.role === 'Corporator') {
                corporatorEmails.push(official.email);
            } else {
                const normalizeDept = (dept) => {
                    const d = (dept || '').trim().toLowerCase();
                    if (d.includes('mcc') || d.includes('mangaluru city corporation')) return 'mcc';
                    if (d.includes('water supply') || d.includes('sewage') || d.includes('water board')) return 'water board';
                    if (d.includes('mescom') || d.includes('power')) return 'mescom';
                    if (d.includes('stray') || d.includes('animal') || d.includes('health')) return 'health dept';
                    return d;
                };
                if (normalizeDept(official.department) === normalizeDept(department) || normalizeDept(official.department) === normalizeDept(userSelectedDept)) {
                    officerEmails.push(official.email);
                }
            }
        });

        // Safe slugs for default emails
        const cleanSlug = (text) => (text || '')
            .toLowerCase()
            .replace(/ward\s*\d+\s*-\s*/, '') // remove "Ward 31 - " prefix
            .replace(/[^a-z0-9]/g, '_')       // replace special chars with underscores
            .replace(/_+/g, '_')             // deduplicate underscores
            .replace(/^_+|_+$/g, '');        // trim underscores

        const wardSlug = cleanSlug(wardNumber) || 'general';
        const deptSlug = cleanSlug(department) || 'civil';

        // Fallbacks if no database entries match yet
        if (corporatorEmails.length === 0) {
            corporatorEmails.push(`corporator.${wardSlug}@mangaluru.gov.in`);
        }
        if (officerEmails.length === 0) {
            officerEmails.push(`officer.${deptSlug}.${wardSlug}@mangaluru.gov.in`);
        }

        // ================================================================
        // PRECISE PER-CATEGORY INTER-AGENCY ROUTING
        // Based on Mangaluru municipal inter-agency specifications.
        // Each case maps to: specificEngineers[] and emergencyEmails[]
        // ================================================================
        const cat = (category || '').toLowerCase();
        const desc = (description || '').toLowerCase();
        const matches = (t) => cat.includes(t) || desc.includes(t);

        let specificEngineers = [];
        let emergencyEmails = [];
        let crossDeptEmails = [];   // secondary departments notified (e.g. MCC when water erodes road)

        // ---- MESCOM — Power Grid ----
        if (
            cat.includes('fallen') || cat.includes('leaning') || cat.includes('utility pole') ||
            cat.includes('damaged utility') || matches('utility pole') || matches('leaning pole')
        ) {
            // Fallen / Leaning Utility Pole
            // Primary: MESCOM Section Officer
            // Inter: Traffic Police (barriers/diversions) + Fire Rescue (if blocking highway / pinning vehicles)
            specificEngineers.push(`so.mescom.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`traffic.police.mangaluru@mangaluru.gov.in`);
            emergencyEmails.push(`fire.rescue.mangaluru@gov.in`);
        }

        if (
            cat.includes('hanging') || cat.includes('snapped') || cat.includes('live wire') ||
            cat.includes('power line') || cat.includes('fallen or low-hanging') ||
            matches('live wire') || matches('snapped wire') || matches('hanging wire')
        ) {
            // Hanging / Snapped Live Wires
            // Primary: MESCOM SO
            // Inter: Fire Rescue (electrocution/fire) + Traffic Police (cordon off street)
            specificEngineers.push(`so.mescom.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`fire.rescue.mangaluru@gov.in`);
            emergencyEmails.push(`traffic.police.mangaluru@mangaluru.gov.in`);
        }

        if (
            cat.includes('sparking') || cat.includes('transformer') || cat.includes('substation') ||
            cat.includes('exploding') || matches('sparking transformer') || matches('transformer fire')
        ) {
            // Sparking / Exploding Transformer
            // Primary: MESCOM EE / SO
            // Inter: Fire Rescue (transformer fire)
            specificEngineers.push(`ee.mescom.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`so.mescom.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`fire.rescue.mangaluru@gov.in`);
        }

        if (
            cat.includes('streetlight') || cat.includes('dead streetlight') || cat.includes('broken streetlight') ||
            cat.includes('lamp post') || matches('dead streetlight') || matches('broken streetlight')
        ) {
            // Dead / Broken Streetlights
            // Primary: MESCOM SO (grid connection) — MCC Electrical wing also notified
            specificEngineers.push(`so.mescom.${wardSlug}@mangaluru.gov.in`);
            crossDeptEmails.push(`electrical.mcc.${wardSlug}@mangaluru.gov.in`);
        }

        if (
            cat.includes('power outage') || cat.includes('frequent') || cat.includes('phase failure') ||
            cat.includes('unannounced') || matches('power outage') || matches('phase failure')
        ) {
            // Frequent Power Outages / Phase Failures
            // Primary: MESCOM EE / SO
            specificEngineers.push(`ee.mescom.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`so.mescom.${wardSlug}@mangaluru.gov.in`);
        }

        // ---- MCC — Civil / Roads ----
        if (
            cat.includes('pothole') || cat.includes('road cave') || cat.includes('severe pothole') ||
            cat.includes('potholes and road') || matches('pothole') || matches('road cave')
        ) {
            // Severe Potholes / Road Cave-ins
            // Primary: MCC JE + AE
            // Inter: Traffic Police (barriers on high-traffic stretches)
            specificEngineers.push(`je.mcc.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.mcc.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`traffic.police.mangaluru@mangaluru.gov.in`);
        }

        if (
            cat.includes('footpath') || cat.includes('pedestrian') || cat.includes('stormwater') ||
            cat.includes('open drain') || matches('broken footpath') || matches('open stormwater')
        ) {
            // Broken Footpaths / Open Stormwater Drains
            // Primary: MCC JE + AE (no inter-agency required)
            specificEngineers.push(`je.mcc.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.mcc.${wardSlug}@mangaluru.gov.in`);
        }

        if (
            cat.includes('drainage') || cat.includes('flooding') || cat.includes('clogged drain') ||
            cat.includes('street flood') || matches('street flooding') || matches('clogged drainage')
        ) {
            // Clogged Drainage / Street Flooding
            // Primary: MCC JE + AE
            // Inter: Fire Rescue (if severe flooding traps citizens in low-lying areas)
            specificEngineers.push(`je.mcc.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.mcc.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`fire.rescue.mangaluru@gov.in`);
        }

        if (
            cat.includes('tree') || cat.includes('branch') || cat.includes('uprooted') ||
            cat.includes('falling branch') || matches('fallen tree') || matches('uprooted tree')
        ) {
            // Dangerous / Uprooted Trees or Falling Branches
            // Primary: MCC Horticulture Wing
            // Inter: Fire Rescue (debris clearance) + MESCOM (if tree snapped overhead power lines)
            specificEngineers.push(`horticulture.mcc.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`fire.rescue.mangaluru@gov.in`);
            crossDeptEmails.push(`so.mescom.${wardSlug}@mangaluru.gov.in`);
        }

        if (
            cat.includes('public park') || cat.includes('playground') ||
            matches('public park') || matches('playground')
        ) {
            // Damaged Public Parks / Playgrounds
            // Primary: MCC JE + AE
            specificEngineers.push(`je.mcc.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.mcc.${wardSlug}@mangaluru.gov.in`);
        }

        // ---- Water Supply & Sewage Board ----
        if (
            cat.includes('water main') || cat.includes('pipe burst') || cat.includes('contaminated water') ||
            cat.includes('water supply') || cat.includes('muddy tap') || matches('pipe burst') || matches('water main')
        ) {
            // Water Main Leaks / Major Pipe Bursts / Contaminated Supply
            // Primary: WSSB AEE + AE
            // Inter: MCC Civil/Roads (if water pressure erodes asphalt)
            specificEngineers.push(`aee.water.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.water.${wardSlug}@mangaluru.gov.in`);
            crossDeptEmails.push(`ae.mcc.${wardSlug}@mangaluru.gov.in`);
        }

        if (
            cat.includes('sewer') || cat.includes('manhole') || cat.includes('sewage') ||
            cat.includes('overflowing') || matches('blocked manhole') || matches('overflowing sewer')
        ) {
            // Overflowing Sewers / Blocked Manholes
            // Primary: WSSB AEE + AE (no emergency for standard overflow)
            specificEngineers.push(`aee.water.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.water.${wardSlug}@mangaluru.gov.in`);
        }

        if (
            cat.includes('missing manhole') || cat.includes('open manhole') ||
            matches('missing manhole cover') || matches('open manhole')
        ) {
            // Missing Manhole Covers
            // Primary: WSSB AEE + AE
            // Inter: Traffic Police (emergency cone over open pit for night commuters)
            specificEngineers.push(`aee.water.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`ae.water.${wardSlug}@mangaluru.gov.in`);
            emergencyEmails.push(`traffic.police.mangaluru@mangaluru.gov.in`);
        }

        // ---- Stray / Animal Welfare & Health Dept ----
        if (
            cat.includes('stray dog') || cat.includes('rabid') || cat.includes('aggressive stray') ||
            cat.includes('stray animal') || matches('stray dog') || matches('rabid animal')
        ) {
            // Aggressive Stray Dog Packs / Rabid Animal Alert
            // Primary: Health Dept SHI + Chief Vet Officer
            specificEngineers.push(`shi.health.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`chief.vet.mangaluru@gov.in`);
        }

        if (
            cat.includes('cattle') || cat.includes('stray cattle') || cat.includes('injured') ||
            cat.includes('abandoned cattle') || matches('stray cattle') || matches('cattle traffic')
        ) {
            // Stray Cattle Causing Traffic Bottlenecks
            // Primary: Health Dept SHI + Chief Vet
            // Inter: Traffic Police (to safely clear animals off major junctions)
            specificEngineers.push(`shi.health.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`chief.vet.mangaluru@gov.in`);
            emergencyEmails.push(`traffic.police.mangaluru@mangaluru.gov.in`);
        }

        if (
            cat.includes('garbage') || cat.includes('illegal dump') || cat.includes('dumping') ||
            cat.includes('pest') || cat.includes('vector') || matches('illegal garbage') || matches('garbage dump')
        ) {
            // Illegal Garbage Dumping / Pest Outbreaks
            // Primary: Health Dept SHI (Solid Waste Management)
            specificEngineers.push(`shi.health.${wardSlug}@mangaluru.gov.in`);
            specificEngineers.push(`swm.health.${wardSlug}@mangaluru.gov.in`);
        }

        // Deduplicate all arrays
        specificEngineers = [...new Set(specificEngineers)];
        emergencyEmails   = [...new Set(emergencyEmails)];
        crossDeptEmails   = [...new Set(crossDeptEmails)];

        const { sendMail } = require('../utils/emailHelper');

        // ---- 1. Complainee Confirmation Copy ----
        if (complaineeEmail && complaineeEmail.trim()) {
            const complaineeText = `Dear Citizen,

Thank you for lodging a grievance on CivicSense Mangaluru. Your active civic responsibility helps make our community safer and cleaner.

A copy of your complaint #CS-${complaintNo} has been successfully logged and routed to the corresponding ward officials and public safety units.

Grievance Details:
  - Complaint Number: #CS-${complaintNo}
  - Ward: ${wardNumber}
  - Issue Category: ${category || 'General'}
  - Municipal Department: ${department}
  - Nearby Landmark: ${landmark || 'None specified'}
  - Severity Priority: ${severity || 'Medium'}
  - Filed Date: ${new Date(createdAt).toLocaleString('en-IN')}

Description:
${description}

You can log in at http://localhost:5173/login to track status updates and engineer remarks.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

            sendMail({
                to: complaineeEmail.trim(),
                subject: `Grievance Confirmation: #CS-${complaintNo} - ${department} (${wardNumber})`,
                text: complaineeText
            }).catch(err => console.error('Failed to send email to Complainee:', err));
        }

        // ---- 2. Ward Corporator Copy ----
        const corporatorText = `Dear Ward Corporator,

A new citizen grievance has been registered under your jurisdiction on the CivicSense Mangaluru Platform.

Grievance Details:
  - Complaint Number: #CS-${complaintNo}
  - Ward: ${wardNumber}
  - Issue Category: ${category || 'General'}
  - Municipal Department: ${department}
  - Nearby Landmark: ${landmark || 'None specified'}
  - Severity Priority: ${severity || 'Medium'}
  - Filed Date: ${new Date(createdAt).toLocaleString('en-IN')}

Description:
${description}

Please log in to the administrative portal at http://localhost:5173 to review and verify resolution logs for your ward's residents.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

        if (corporatorEmails.length > 0) {
            sendMail({
                to: corporatorEmails.join(', '),
                subject: `Grievance Dispatch Copy: #CS-${complaintNo} - ${department} (${wardNumber})`,
                text: corporatorText
            }).catch(err => console.error('Failed to send email to Corporator:', err));
        }

        // ---- 3. Primary Department Officers + Specific Area Engineers ----
        const combinedOfficers = [...new Set([...officerEmails, ...specificEngineers])];
        if (combinedOfficers.length > 0) {
            const officerText = `Dear Public Officer / Area Engineer,

A new citizen grievance has been assigned to your department's action queue. Please initiate inspection and assign a field handler as per SLA priority.

Grievance Details:
  - Complaint Number: #CS-${complaintNo}
  - Ward: ${wardNumber}
  - Issue Category: ${category || 'General'}
  - Municipal Department: ${department}
  - Nearby Landmark: ${landmark || 'None specified'}
  - Severity Priority: ${severity || 'Medium'}
  - Filed Date: ${new Date(createdAt).toLocaleString('en-IN')}

Description:
${description}

Please log in to http://localhost:5173 to post remarks, update workflow status, and upload resolution evidence.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

            sendMail({
                to: combinedOfficers.join(', '),
                subject: `Grievance Action Required: #CS-${complaintNo} - ${department} (${wardNumber})`,
                text: officerText
            }).catch(err => console.error('Failed to send email to Department Officers:', err));
        }

        // ---- 4. Cross-Department Secondary Notification ----
        if (crossDeptEmails.length > 0) {
            const crossDeptText = `Dear Officer,

You are receiving this notification as a secondary inter-agency alert. A civic grievance has been filed that may secondarily affect your department's area of responsibility.

Grievance Details:
  - Complaint Number: #CS-${complaintNo}
  - Ward: ${wardNumber}
  - Issue Category: ${category || 'General'}
  - Primary Department: ${department}
  - Nearby Landmark: ${landmark || 'None specified'}
  - Severity Priority: ${severity || 'Medium'}
  - Filed Date: ${new Date(createdAt).toLocaleString('en-IN')}

Description:
${description}

Please coordinate with the primary assigned department and take action within your scope as required.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

            sendMail({
                to: crossDeptEmails.join(', '),
                subject: `Inter-Agency Alert: #CS-${complaintNo} - ${department} (${wardNumber})`,
                text: crossDeptText
            }).catch(err => console.error('Failed to send inter-agency email:', err));
        }

        // ---- 5. Emergency & Public Safety Services ----
        if (emergencyEmails.length > 0) {
            const emergencyText = `Dear Public Safety Unit,

URGENT: A citizen grievance has been filed that requires immediate public safety intervention — barricading, traffic diversion, emergency rescue, or fire safety deployment.

Grievance Details:
  - Complaint Number: #CS-${complaintNo}
  - Ward: ${wardNumber}
  - Issue Category: ${category || 'General'}
  - Municipal Department: ${department}
  - Nearby Landmark: ${landmark || 'None specified'}
  - Severity Priority: ${severity || 'Medium'}
  - Filed Date: ${new Date(createdAt).toLocaleString('en-IN')}

Public Safety Hazard Description:
${description}

Please deploy jurisdictional units immediately to secure the area and protect public safety.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

            sendMail({
                to: emergencyEmails.join(', '),
                subject: `URGENT Public Safety Alert: #CS-${complaintNo} - ${category || department} (${wardNumber})`,
                text: emergencyText
            }).catch(err => console.error('Failed to send emergency alert email:', err));
        }

    } catch (err) {
        console.error('Failed to dispatch simulated grievance emails:', err);
    }
};

// POST: Pre-analysis route to generate AI problem summary for uploaded image
router.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image file uploaded.' });
        }

        const userDescription = req.body.description || '';
        const userFeedback = req.body.user_feedback || req.body.userFeedback || '';
        const previousSummary = req.body.previous_summary || req.body.previousSummary || '';

        let aiResult = await analyzePhotoWithAI(req.file.path, userDescription, userFeedback, previousSummary);
        if (!aiResult) {
            aiResult = localFallbackClassifier(req.file.originalname, userFeedback || userDescription);
        }

        // Delete temporary file after analysis
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error unlinking temp analysis image:', err);
        });

        res.status(200).json({
            success: true,
            aiResult
        });
    } catch (err) {
        console.error('AI image preview analysis failed:', err);
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ success: false, error: 'Failed to analyze image with AI.' });
    }
});

router.post('/submit', upload.array('media', 10), async (req, res) => {
    try {
        let { wardNumber, department, category, description, landmark, severity, altPhone, whatsappConsent, latitude, longitude, is_potential_duplicate, parent_complaint_id, ai_summary_status } = req.body;
        let isPotentialDuplicate = is_potential_duplicate === 'true' || is_potential_duplicate === '1' || is_potential_duplicate === 1 || is_potential_duplicate === 'true' ? 1 : 0;
        let parentComplaintId = parent_complaint_id && parent_complaint_id !== 'null' && parent_complaint_id !== 'undefined' ? parseInt(parent_complaint_id, 10) : null;
        
        let complaineeEmail = null;
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                complaineeEmail = decoded.email || decoded.EMAIL || null;
            } catch (jwtErr) {
                console.warn('Failed to parse token for complainee email:', jwtErr.message);
            }
        }

        const uploadedUrls = [];
        let extractedLat = null;
        let extractedLon = null;
        let extractedDate = null;
        let aiResult = null;

        if (req.files && req.files.length > 0) {
            // First file EXIF processing
            try {
                const meta = await exifr.parse(req.files[0].path).catch(() => null);
                if (meta) {
                    if (meta.latitude && meta.longitude) {
                        extractedLat = meta.latitude;
                        extractedLon = meta.longitude;
                        console.log(`📸 EXIF Geotag successfully parsed: ${extractedLat}, ${extractedLon}`);
                    }
                    const rawDate = meta.DateTimeOriginal || meta.CreateDate || meta.ModifyDate;
                    if (rawDate) {
                        const parsedDate = new Date(rawDate);
                        if (!isNaN(parsedDate.getTime())) {
                            extractedDate = parsedDate;
                            console.log(`📅 EXIF Creation Date successfully parsed: ${extractedDate}`);
                        }
                    }
                }
            } catch (exifErr) {
                console.warn('Metadata parsing failure:', exifErr);
            }

            // Run AI analysis on the file BEFORE unlinking it (unless user explicitly rejected AI prior)
            if (ai_summary_status !== 'rejected') {
                aiResult = await analyzePhotoWithAI(req.files[0].path, description);
                if (!aiResult) {
                    aiResult = localFallbackClassifier(req.files[0].originalname, description);
                }
            }
        }

        // If EXIF coordinates not found, check if device coordinates were supplied by req.body
        if (!extractedLat && !extractedLon && latitude && longitude) {
            extractedLat = parseFloat(latitude);
            extractedLon = parseFloat(longitude);
            console.log(`📍 Device coordinates supplied: ${extractedLat}, ${extractedLon}`);
        }

        // Apply AI classification details if retrieved and NOT rejected by user
        const userSelectedDepartment = department;
        if (aiResult && ai_summary_status !== 'rejected') {
            // Check for discrepancy between user selection and AI result
            const aiDept = aiResult.department;
            if (userSelectedDepartment && userSelectedDepartment !== 'Auto' && userSelectedDepartment !== '' && userSelectedDepartment !== aiDept) {
                console.warn(`⚠️ Classification discrepancy! User selected: "${userSelectedDepartment}", AI classified: "${aiDept}".`);
                const warningMsg = `[Classification Warning: Citizen categorized this under "${userSelectedDepartment}" ("${category}"), but CivicSense AI identified it as "${aiResult.issue_detected}" under "${aiDept}". Alerts have been routed to both departments for verification.]`;
                description = description 
                    ? `${warningMsg}\n\n${description}\n\n(AI Visual Analysis: ${aiResult.description})` 
                    : `${warningMsg}\n\n(AI Visual Analysis: ${aiResult.description})`;
            } else {
                description = description ? `${description} (AI Analysis: ${aiResult.description})` : aiResult.description;
            }
            department = aiDept;
            severity = aiResult.severity;
        } else {
            // User explicitly rejected AI summary or no AI result was returned
            if (!department || department === 'Auto' || department === '') {
                department = classifyDepartment(description);
            }
            if (!severity || severity === 'Auto' || severity === '') {
                severity = classifySeverity(description);
            }
            console.log(`ℹ️ User AI Summary Choice: "${ai_summary_status || 'custom'}". Using user's manual category & custom description.`);
        }

        let resolvedAddr = '';
        if (extractedLat && extractedLon) {
            resolvedAddr = await reverseGeocode(extractedLat, extractedLon);
            if (resolvedAddr) {
                if (!landmark || landmark.trim() === '') {
                    landmark = resolvedAddr;
                } else {
                    landmark = `${landmark} (${resolvedAddr})`;
                }
            }
            // Tag the proper ward based on coordinates & address (even if geocoding failed/empty)
            wardNumber = getMangaluruWard(extractedLat, extractedLon, `${landmark || ''} ${resolvedAddr}`);
        } else {
            // Mock Mangaluru-based coordinate fallback for map dashboard markers
            extractedLat = 12.91 + (Math.random() * 0.04 - 0.02);
            extractedLon = 74.85 + (Math.random() * 0.04 - 0.02);
            wardNumber = getMangaluruWard(extractedLat, extractedLon, landmark || wardNumber || '');
        }

        if (!landmark || landmark.trim() === '') {
            landmark = 'Near Lalbagh Circle, Mangaluru';
        }

        if (!wardNumber || wardNumber === 'Auto' || wardNumber === '') {
            wardNumber = 'Ward 31 - Bejai'; // Default fallback
        }

        // --- BACKEND PROXIMITY DUPLICATE CHECK ---
        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        if (!isPotentialDuplicate) {
            const dupResult = await pool.request()
                .input('department', sql.NVarChar, department)
                .query(`
                    SELECT complaint_no, ward_number, department, description, landmark, severity, media_attachments, status, vote_score, created_at, latitude, longitude
                    FROM ${targetDB}.dbo.COMPLAINTS
                    WHERE status <> 'Resolved' AND status <> 'Merged' AND merged_into_id IS NULL AND department = @department
                `);

            const calculateDistance = (lat1, lon1, lat2, lon2) => {
                const R = 6371e3; // meters
                const phi1 = lat1 * Math.PI / 180;
                const phi2 = lat2 * Math.PI / 180;
                const deltaPhi = (lat2 - lat1) * Math.PI / 180;
                const deltaLambda = (lon2 - lon1) * Math.PI / 180;

                const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                          Math.cos(phi1) * Math.cos(phi2) *
                          Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

                return R * c; // in meters
            };

            const duplicates = dupResult.recordset
                .map(ticket => {
                    const tLat = parseFloat(ticket.latitude);
                    const tLon = parseFloat(ticket.longitude);
                    if (isNaN(tLat) || isNaN(tLon)) return null;

                    const dist = calculateDistance(extractedLat, extractedLon, tLat, tLon);
                    return { ...ticket, distance: dist };
                })
                .filter(ticket => ticket !== null && ticket.distance <= 25.0) // 25m radius standard
                .sort((a, b) => a.distance - b.distance);

            if (duplicates.length > 0) {
                // Delete temp uploaded files to prevent leak
                if (req.files && req.files.length > 0) {
                    for (const file of req.files) {
                        try { fs.unlinkSync(file.path); } catch (e) {}
                    }
                }
                console.log(`⚠️ Proximity duplicate check caught duplicate: #CS-${duplicates[0].complaint_no} (${duplicates[0].distance.toFixed(1)}m). Returning soft lock.`);
                return res.status(200).json({
                    success: false,
                    duplicateDetected: true,
                    duplicates
                });
            }
        }

        // Proceed to Cloudinary Upload
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await cloudinary.uploader.upload(file.path, {
                    folder: 'civic_sense_grievances',
                    resource_type: 'auto'
                });
                uploadedUrls.push(result.secure_url);
                
                fs.unlink(file.path, (err) => {
                    if (err) console.error('Error deleting local temp file:', err);
                });
            }
        }

        const mediaUrlsString = uploadedUrls.join(',');

        const countResult = await pool.request().query(`SELECT COUNT(*) AS total FROM ${targetDB}.dbo.COMPLAINTS`);
        const totalCount = countResult.recordset[0].total;
        const newComplaintNumber = totalCount + 1;

        const sqlDate = extractedDate || new Date();

        // Automatically determine locationType and issueSize using AI model & NLP telemetry
        const { locationType: aiLocType, issueSize: aiSize } = determineAILocationAndSize(description, landmark, resolvedAddr, category, aiResult);
        const finalLocationType = aiLocType;
        const finalIssueSize = aiSize;
        severity = determineSeverity(finalLocationType, finalIssueSize);
        console.log(`🤖 AI Determined Location Type: "${finalLocationType}", Issue Size: "${finalIssueSize}" → Urgency Matrix Severity: "${severity}"`);

        await pool.request()
            .input('complaintNo', sql.Int, newComplaintNumber)
            .input('wardNumber', sql.NVarChar, wardNumber)
            .input('department', sql.NVarChar, department)
            .input('category', sql.NVarChar, category || aiResult?.issue_detected || 'General')
            .input('description', sql.NVarChar, description)
            .input('landmark', sql.NVarChar, landmark)
            .input('severity', sql.NVarChar, severity)
            .input('altPhone', sql.VarChar, altPhone)
            .input('whatsappConsent', sql.VarChar, whatsappConsent || 'false')
            .input('mediaAttachments', sql.NVarChar, mediaUrlsString)
            .input('createdAt', sql.DateTime, sqlDate)
            .input('latitude', sql.Decimal(9, 6), extractedLat)
            .input('longitude', sql.Decimal(9, 6), extractedLon)
            .input('complaineeEmail', sql.NVarChar, complaineeEmail || 'citizen@civicsense.in')
            .input('locationType', sql.NVarChar, finalLocationType)
            .input('issueSize', sql.NVarChar, finalIssueSize)
            .input('parentComplaintId', sql.Int, parentComplaintId)
            .input('isPotentialDuplicate', sql.Bit, isPotentialDuplicate)
            .query(`
                INSERT INTO ${targetDB}.dbo.COMPLAINTS (
                    complaint_no, ward_number, department, category, description, 
                    landmark, severity, alternate_phone, whatsapp_consent, media_attachments, status, vote_score, created_at, latitude, longitude, complainee_email, location_type, issue_size, parent_complaint_id, is_potential_duplicate
                ) VALUES (
                    @complaintNo, @wardNumber, @department, @category, @description, 
                    @landmark, @severity, @altPhone, @whatsappConsent, @mediaAttachments, 'Pending', 0, @createdAt, @latitude, @longitude, @complaineeEmail, @locationType, @issueSize, @parentComplaintId, @isPotentialDuplicate
                )
            `);

        // Dispatch copy of grievance by email to Corporator, Ward Officer, Complainee, and other authorities
        await dispatchGrievanceEmails(newComplaintNumber, wardNumber, department, description, landmark, severity, sqlDate, complaineeEmail, category, userSelectedDepartment);

        res.status(200).json({ 
            success: true, 
            message: 'Grievance registered securely!',
            complaintNumber: newComplaintNumber 
        });

    } catch (err) {
        console.error('Operation failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET: Fetch Tracking Log Grid Feed
router.get('/my-logs', async (req, res) => {
    try {
        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;
        
        const result = await pool.request().query(`
            SELECT TOP 50 
                complaint_no, ward_number, department, category, description, 
                landmark, severity, alternate_phone, whatsapp_consent, media_attachments, status, vote_score, created_at, latitude, longitude, complainee_email, location_type, issue_size, after_media_attachments, assigned_contractor, parent_complaint_id, merged_into_id, is_potential_duplicate 
            FROM ${targetDB}.dbo.COMPLAINTS 
            ORDER BY created_at DESC
        `);

        res.status(200).json({
            success: true,
            grievances: result.recordset
        });

    } catch (err) {
        console.error('Database read error:', err);
        res.status(500).json({ success: false, error: 'Failed to sync tracker logs.' });
    }
});

// GET: Fetch Public Grievance Map Feed
router.get('/public-feed', async (req, res) => {
    try {
        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // Decode email token safely to capture context history parameters
        let citizenEmail = '';
        try {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                citizenEmail = decoded.email || decoded.EMAIL;
            }
        } catch(e) { /* Fallback for unauthenticated token reads */ }
        
        // Fetch global telemetry rows
        const result = await pool.request().query(`
            SELECT TOP 200 
                id, complaint_no, ward_number, department, category, description, 
                landmark, severity, alternate_phone, whatsapp_consent, media_attachments, status, vote_score, created_at, latitude, longitude, complainee_email, location_type, issue_size, after_media_attachments, assigned_contractor, parent_complaint_id, merged_into_id, is_potential_duplicate 
            FROM ${targetDB}.dbo.COMPLAINTS 
            ORDER BY created_at DESC
        `);

        // Fetch user personal upvoted array map history
        let userBackedTickets = [];
        if (citizenEmail) {
            const userVotes = await pool.request()
                .input('email', sql.NVarChar, citizenEmail)
                .query(`SELECT complaint_no FROM ${targetDB}.dbo.VOTES_LEDGER WHERE citizen_email = @email`);
            userBackedTickets = userVotes.recordset.map(row => row.complaint_no);
        }

        res.status(200).json({
            success: true,
            grievances: result.recordset,
            userBacked: userBackedTickets // 👈 This maps straight onto your state logic below
        });

    } catch (err) {
        console.error('Database public feed read failure:', err);
        res.status(500).json({ success: false, error: 'Failed to synchronize public ledger.' });
    }
});

// PATCH: Increment Upvote Only
// ==========================================================================
// PATCH: Authenticated Upvote (Ensures One Unique Vote Per Citizen Profile)
// ==========================================================================
router.patch('/:id/upvote', async (req, res) => {
    try {
        const complaintId = parseInt(req.params.id, 10);
        if (isNaN(complaintId)) {
            return res.status(400).json({ success: true, error: 'Invalid identification argument parameters.' });
        }

        // 1. Authenticate user identity via incoming Bearer Token
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization header missing.' });
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const citizenEmail = decoded.email || decoded.EMAIL;

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // 2. Prevent complainant from backing their own ticket
        const checkComplainant = await pool.request()
            .input('complaintNo', sql.Int, complaintId)
            .query(`SELECT complainee_email FROM ${targetDB}.dbo.COMPLAINTS WHERE complaint_no = @complaintNo`);

        if (checkComplainant.recordset.length > 0) {
            const ticketOwner = (checkComplainant.recordset[0].complainee_email || '').toLowerCase().trim();
            if (ticketOwner === citizenEmail.toLowerCase().trim()) {
                return res.status(400).json({ success: false, error: 'You cannot back your own submitted grievance.' });
            }
        }

        // 3. Transaction Layer: Check if entry already exists in the ledger mapping
        const checkVote = await pool.request()
            .input('complaintNo', sql.Int, complaintId)
            .input('email', sql.NVarChar, citizenEmail)
            .query(`SELECT 1 FROM ${targetDB}.dbo.VOTES_LEDGER WHERE complaint_no = @complaintNo AND citizen_email = @email`);

        if (checkVote.recordset.length > 0) {
            return res.status(400).json({ success: false, alreadyVoted: true, error: 'You have already backed this community issue.' });
        }

        // 3. Atomically write the ledger token and step up the global score row counter
        await pool.request()
            .input('complaintNo', sql.Int, complaintId)
            .input('email', sql.NVarChar, citizenEmail)
            .query(`INSERT INTO ${targetDB}.dbo.VOTES_LEDGER (complaint_no, citizen_email) VALUES (@complaintNo, @email)`);

        const updateResult = await pool.request()
            .input('complaintNo', sql.Int, complaintId)
            .query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS
                SET vote_score = COALESCE(vote_score, 0) + 1
                OUTPUT inserted.vote_score
                WHERE complaint_no = @complaintNo
            `);

        res.status(200).json({
            success: true,
            newScore: updateResult.recordset[0].vote_score
        });

    } catch (err) {
        console.error('Database unique upvote verification exception:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Verify Resolved Issue (Submit verification photo to officially close complaint)
router.post('/:complaintNo/verify', upload.single('afterMedia'), async (req, res) => {
    try {
        const complaintNo = parseInt(req.params.complaintNo, 10);
        if (isNaN(complaintNo)) {
            return res.status(400).json({ success: false, error: 'Invalid complaint number.' });
        }

        let extractedLat = null;
        let extractedLon = null;
        let afterPhotoUrl = '';

        if (req.file) {
            // First file EXIF processing
            try {
                const gps = await exifr.gps(req.file.path).catch(() => null);
                if (gps) {
                    extractedLat = gps.latitude;
                    extractedLon = gps.longitude;
                    console.log(`📸 After-photo EXIF Geotag successfully parsed: ${extractedLat}, ${extractedLon}`);
                }
            } catch (exifErr) {
                console.warn('Metadata parsing failure on verification file:', exifErr);
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'civic_sense_resolutions',
                resource_type: 'auto'
            });
            afterPhotoUrl = result.secure_url;
            
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting temp verification file:', err);
            });
        } else {
            return res.status(400).json({ success: false, error: 'Verification photo is required.' });
        }

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // Query the database to retrieve the original coordinates of the ticket
        const origResult = await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .query(`SELECT latitude, longitude, landmark FROM ${targetDB}.dbo.COMPLAINTS WHERE complaint_no = @complaintNo`);

        if (origResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Grievance ticket not found.' });
        }

        const ticket = origResult.recordset[0];
        const origLat = ticket.latitude ? parseFloat(ticket.latitude) : null;
        const origLon = ticket.longitude ? parseFloat(ticket.longitude) : null;

        // Get coordinates (EXIF from photo or browser GPS)
        let checkLat = extractedLat;
        let checkLon = extractedLon;

        const { latitude, longitude } = req.body;
        if (!checkLat && !checkLon && latitude && longitude) {
            checkLat = parseFloat(latitude);
            checkLon = parseFloat(longitude);
            console.log(`📍 Using browser coordinates for verification check: ${checkLat}, ${checkLon}`);
        }

        if (!checkLat || !checkLon) {
            return res.status(400).json({
                success: false,
                error: 'Verification photo must be geotagged (taken with a GPS camera), or you must grant permission to use your current phone/device location.'
            });
        }

        // Calculate Haversine distance if original ticket has coordinates
        if (origLat && origLon) {
            const R = 6371e3; // meters
            const lat1Rad = origLat * Math.PI / 180;
            const lat2Rad = checkLat * Math.PI / 180;
            const deltaLatRad = (checkLat - origLat) * Math.PI / 180;
            const deltaLonRad = (checkLon - origLon) * Math.PI / 180;

            const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                      Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const d = R * c; // distance in meters

            console.log(`📏 Distance verification: Original coordinates (${origLat}, ${origLon}), Verification coordinates (${checkLat}, ${checkLon}). Distance = ${d.toFixed(1)} meters.`);

            if (d > 500) {
                return res.status(400).json({
                    success: false,
                    error: `Location mismatch error. The verification photo location is ${Math.round(d)} meters away from the original reported location. Please stand at the site of the complaint to verify.`
                });
            }
        }

        await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .input('afterMedia', sql.NVarChar, afterPhotoUrl)
            .query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS
                SET status = 'Resolved', after_media_attachments = @afterMedia
                WHERE complaint_no = @complaintNo
            `);

        res.status(200).json({
            success: true,
            message: 'Grievance officially verified and resolved by the community!',
            afterPhoto: afterPhotoUrl
        });

    } catch (err) {
        console.error('Verification closure failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST/PATCH: Municipal official resolution with mandatory completion photo upload
router.post('/:complaintNo/resolve-status', upload.single('afterMedia'), async (req, res) => {
    try {
        const complaintNo = parseInt(req.params.complaintNo, 10);
        if (isNaN(complaintNo)) {
            return res.status(400).json({ success: false, error: 'Invalid complaint number.' });
        }

        let afterPhotoUrl = '';
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'civic_sense_resolutions',
                resource_type: 'auto'
            });
            afterPhotoUrl = result.secure_url;
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting temp file:', err);
            });
        } else if (req.body.afterMediaUrl) {
            afterPhotoUrl = req.body.afterMediaUrl;
        }

        if (!afterPhotoUrl) {
            return res.status(400).json({ success: false, error: 'Completion photo is required to mark job as resolved.' });
        }

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .input('status', sql.NVarChar, 'Resolved')
            .input('afterMedia', sql.NVarChar, afterPhotoUrl)
            .query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS
                SET status = @status, after_media_attachments = @afterMedia
                WHERE complaint_no = @complaintNo
            `);

        res.status(200).json({
            success: true,
            message: 'Job successfully marked as Resolved with proof of completion photo.',
            afterPhoto: afterPhotoUrl
        });

    } catch (err) {
        console.error('Resolution status update error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Check for existing duplicate tickets within a 50m radius (Haversine Check)
router.post('/check-duplicates', async (req, res) => {
    try {
        const { latitude, longitude, department } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ success: false, error: 'Latitude and longitude coordinates are required.' });
        }

        const clientLat = parseFloat(latitude);
        const clientLon = parseFloat(longitude);
        if (isNaN(clientLat) || isNaN(clientLon)) {
            return res.status(400).json({ success: false, error: 'Invalid coordinate parameters.' });
        }

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // Fetch all active open tickets in the same department
        const result = await pool.request()
            .input('department', sql.NVarChar, department || 'MCC')
            .query(`
                SELECT complaint_no, ward_number, department, description, landmark, severity, media_attachments, status, vote_score, created_at, latitude, longitude
                FROM ${targetDB}.dbo.COMPLAINTS
                WHERE status <> 'Resolved' AND status <> 'Merged' AND merged_into_id IS NULL AND department = @department
            `);

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371e3; // meters
            const phi1 = lat1 * Math.PI / 180;
            const phi2 = lat2 * Math.PI / 180;
            const deltaPhi = (lat2 - lat1) * Math.PI / 180;
            const deltaLambda = (lon2 - lon1) * Math.PI / 180;

            const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
                      Math.cos(phi1) * Math.cos(phi2) *
                      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return R * c; // in meters
        };

        const duplicates = result.recordset
            .map(ticket => {
                const tLat = parseFloat(ticket.latitude);
                const tLon = parseFloat(ticket.longitude);
                if (isNaN(tLat) || isNaN(tLon)) return null;

                const dist = calculateDistance(clientLat, clientLon, tLat, tLon);
                return { ...ticket, distance: dist };
            })
            .filter(ticket => ticket !== null && ticket.distance <= 25.0) // 25-meter radius standard
            .sort((a, b) => a.distance - b.distance);

        res.status(200).json({ success: true, duplicates });
    } catch (err) {
        console.error('Proximity duplicate check error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH: Merge child duplicate ticket into parent master ticket (Admin/Official only)
router.patch('/:complaintNo/merge', async (req, res) => {
    try {
        const childNo = parseInt(req.params.complaintNo, 10);
        const { parentNo } = req.body;
        const targetParentNo = parseInt(parentNo, 10);

        if (isNaN(childNo) || isNaN(targetParentNo)) {
            return res.status(400).json({ success: false, error: 'Invalid complaint number inputs.' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization required.' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role === 'citizen') {
            return res.status(403).json({ success: false, error: 'Access denied. Officials only.' });
        }

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // Verify parent exists
        const parentResult = await pool.request()
            .input('parentNo', sql.Int, targetParentNo)
            .query(`SELECT status FROM ${targetDB}.dbo.COMPLAINTS WHERE complaint_no = @parentNo`);

        if (parentResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Target parent ticket does not exist.' });
        }

        // Get child votes
        const childResult = await pool.request()
            .input('childNo', sql.Int, childNo)
            .query(`SELECT vote_score, description FROM ${targetDB}.dbo.COMPLAINTS WHERE complaint_no = @childNo`);

        if (childResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Child ticket does not exist.' });
        }

        const childVotes = childResult.recordset[0].vote_score || 0;

        // Perform merge updates
        // 1. Update parent vote score
        await pool.request()
            .input('parentNo', sql.Int, targetParentNo)
            .input('votesToAdd', sql.Int, childVotes)
            .query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS
                SET vote_score = COALESCE(vote_score, 0) + @votesToAdd
                WHERE complaint_no = @parentNo
            `);

        // 2. Set child status to Merged, link IDs
        await pool.request()
            .input('childNo', sql.Int, childNo)
            .input('parentNo', sql.Int, targetParentNo)
            .query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS
                SET status = 'Merged', merged_into_id = @parentNo, parent_complaint_id = @parentNo
                WHERE complaint_no = @childNo
            `);

        // 3. Write updates logs to Comments thread
        const authorName = decoded.name || 'System Auto-Merge';
        const department = decoded.department || 'MCC';

        await pool.request()
            .input('complaintNo', sql.Int, targetParentNo)
            .input('authorName', sql.NVarChar, authorName)
            .input('department', sql.NVarChar, department)
            .input('commentText', sql.NVarChar, `[System Merge Action] Complaint #CS-${childNo} has been merged into this ticket. Transferred +${childVotes} backing votes.`)
            .query(`INSERT INTO ${targetDB}.dbo.COMPLAINT_COMMENTS (complaint_no, author_name, department, comment_text) VALUES (@complaintNo, @authorName, @department, @commentText)`);

        await pool.request()
            .input('complaintNo', sql.Int, childNo)
            .input('authorName', sql.NVarChar, authorName)
            .input('department', sql.NVarChar, department)
            .input('commentText', sql.NVarChar, `[System Merge Action] This ticket has been merged into Master Ticket #CS-${targetParentNo}. All updates will be coordinated there.`)
            .query(`INSERT INTO ${targetDB}.dbo.COMPLAINT_COMMENTS (complaint_no, author_name, department, comment_text) VALUES (@complaintNo, @authorName, @department, @commentText)`);

        res.status(200).json({
            success: true,
            message: `Ticket #CS-${childNo} successfully merged into #CS-${targetParentNo}.`,
            transferredVotes: childVotes
        });
    } catch (err) {
        console.error('Merge tickets error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET: Fetch Whitelisted Contractors / Field Workers from APPROVED_OFFICIALS
router.get('/whitelisted-contractors', async (req, res) => {
    try {
        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        const result = await pool.request().query(`
            SELECT id, email, role, department, ward_assignment 
            FROM ${targetDB}.dbo.APPROVED_OFFICIALS
            ORDER BY department ASC, email ASC
        `);

        res.status(200).json({ success: true, contractors: result.recordset });
    } catch (err) {
        console.error('Fetch whitelisted contractors error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH: Assign a Contractor to a Complaint
router.patch('/:complaintNo/assign-contractor', async (req, res) => {
    try {
        const complaintNo = parseInt(req.params.complaintNo, 10);
        if (isNaN(complaintNo)) return res.status(400).json({ success: false, error: 'Invalid complaint number.' });

        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization required.' });
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET);

        const { contractor_email } = req.body;
        if (!contractor_email) {
            return res.status(400).json({ success: false, error: 'Contractor email is required.' });
        }

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .input('contractorEmail', sql.NVarChar, contractor_email.trim().toLowerCase())
            .query(`
                UPDATE ${targetDB}.dbo.COMPLAINTS
                SET assigned_contractor = @contractorEmail
                WHERE complaint_no = @complaintNo
            `);

        // Send email notification to contractor
        const { sendMail } = require('../utils/emailHelper');
        sendMail({
            to: contractor_email.trim(),
            subject: `[CivicSense Assignment] Assigned to Complaint #CS-${complaintNo}`,
            text: `Hello,\n\nYou have been assigned as contractor / field worker for Complaint #CS-${complaintNo}.\n\nPlease log in at http://localhost:5173 to review complaint details and post progress updates.\n\nRegards,\nCivicSense Administration`
        }).catch(err => console.error('Contractor assignment email notification error:', err.message));

        res.status(200).json({
            success: true,
            message: `Contractor ${contractor_email} successfully assigned to Complaint #CS-${complaintNo}`,
            assignedContractor: contractor_email.trim().toLowerCase()
        });
    } catch (err) {
        console.error('Assign contractor error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET: Fetch all comments for a complaint
router.get('/:complaintNo/comments', async (req, res) => {
    try {
        const complaintNo = parseInt(req.params.complaintNo, 10);
        if (isNaN(complaintNo)) return res.status(400).json({ success: false, error: 'Invalid complaint number.' });

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        const result = await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .query(`
                SELECT id, complaint_no, author_name, department, comment_text, created_at
                FROM ${targetDB}.dbo.COMPLAINT_COMMENTS
                WHERE complaint_no = @complaintNo
                ORDER BY created_at ASC
            `);

        res.status(200).json({ success: true, comments: result.recordset });
    } catch (err) {
        console.error('Fetch comments error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Add a comment (department users & assigned contractors)
router.post('/:complaintNo/comments', async (req, res) => {
    try {
        const complaintNo = parseInt(req.params.complaintNo, 10);
        if (isNaN(complaintNo)) return res.status(400).json({ success: false, error: 'Invalid complaint number.' });

        // Authenticate via JWT
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ success: false, error: 'Authorization required.' });
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { comment_text } = req.body;
        if (!comment_text || !comment_text.trim()) {
            return res.status(400).json({ success: false, error: 'Comment text cannot be empty.' });
        }

        const authorName = decoded.name || decoded.NAME || decoded.email || 'Department Official';
        const authorEmail = (decoded.email || decoded.EMAIL || '').toLowerCase().trim();
        const commenterDepartment = decoded.department || (decoded.role !== 'citizen' ? decoded.role : 'Empanelled Contractor');

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // 1. Retrieve the corresponding complaint details
        const complaintResult = await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .query(`
                SELECT TOP 1 complaint_no, ward_number, department, description, landmark, severity, status, complainee_email, assigned_contractor
                FROM ${targetDB}.dbo.COMPLAINTS
                WHERE complaint_no = @complaintNo
            `);

        if (complaintResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Complaint ticket not found.' });
        }

        const ticket = complaintResult.recordset[0];
        const wardNumber = ticket.ward_number;
        const ticketDept = ticket.department;
        const complaineeEmail = ticket.complainee_email;

        // Check if user is whitelisted official OR assigned contractor
        const isAssignedContractor = ticket.assigned_contractor && ticket.assigned_contractor.toLowerCase().trim() === authorEmail;
        const whitelistCheck = await pool.request()
            .input('email', sql.NVarChar, authorEmail)
            .query(`SELECT role, department FROM ${targetDB}.dbo.APPROVED_OFFICIALS WHERE email = @email`);

        const isWhitelisted = whitelistCheck.recordset.length > 0 || decoded.role !== 'citizen';

        if (!isWhitelisted && !isAssignedContractor) {
            return res.status(403).json({ success: false, error: 'Only whitelisted officials, assigned contractors, and administrators can post comments.' });
        }

        // 2. Insert the comment record
        await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .input('authorName', sql.NVarChar, authorName)
            .input('department', sql.NVarChar, commenterDepartment)
            .input('commentText', sql.NVarChar, comment_text.trim())
            .query(`
                INSERT INTO ${targetDB}.dbo.COMPLAINT_COMMENTS (complaint_no, author_name, department, comment_text)
                VALUES (@complaintNo, @authorName, @department, @commentText)
            `);

        // 3. Find other responsible officials for this ward & department to notify
        const officialsResult = await pool.request().query(`
            SELECT email, role, department, ward_assignment 
            FROM ${targetDB}.dbo.APPROVED_OFFICIALS
        `);

        const extractWardNumber = (wardStr) => {
            if (!wardStr) return null;
            const match = String(wardStr).match(/Ward\s+(\d+)/i);
            return match ? parseInt(match[1], 10) : null;
        };

        const targetWardNum = extractWardNumber(wardNumber);

        const uniqueOfficialEmails = new Set();
        officialsResult.recordset.forEach(off => {
            const email = (off.email || '').toLowerCase().trim();
            if (!email || email === authorEmail) return;

            const userWardStr = (off.ward_assignment || '').trim().toLowerCase();
            const userWardNum = extractWardNumber(off.ward_assignment);

            let isWardMatch = userWardStr === 'all wards' ||
                                (targetWardNum !== null && userWardNum !== null && targetWardNum === userWardNum) ||
                                (userWardStr === String(wardNumber).trim().toLowerCase());

            if (!isWardMatch && userWardNum !== null) {
                const userWardAliases = MANGALORE_WARD_ALIASES[userWardNum] || [];
                const fullText = `${ticket.landmark || ''} ${ticket.description || ''} ${wardNumber || ''}`.toLowerCase();
                if (userWardAliases.some(alias => fullText.includes(alias))) {
                    isWardMatch = true;
                }
            }

            if (!isWardMatch) return;

            if (off.role === 'Corporator') {
                uniqueOfficialEmails.add(email);
            } else if (off.department === ticketDept) {
                uniqueOfficialEmails.add(email);
            }
        });
        console.log('📝 POST Comments Debug Info:', {
            complaintNo,
            wardNumber,
            ticketDept,
            complaineeEmail,
            isMatch: complaineeEmail && complaineeEmail.trim() !== 'citizen@civicsense.in'
        });

        const { sendMail } = require('../utils/emailHelper');

        // ---- A. Notify the Complainee (Citizen) ----
        if (complaineeEmail && complaineeEmail.trim() && complaineeEmail.trim() !== 'citizen@civicsense.in') {
            const complaineeMailText = `Dear Citizen,

An official update / remark has been added to your grievance complaint #CS-${complaintNo} on the CivicSense platform.

Update Details:
  - Official: ${authorName} (${commenterDepartment})
  - Date: ${new Date().toLocaleString('en-IN')}

Official Comment:
"${comment_text.trim()}"

Ticket Details:
  - Complaint Number: #CS-${complaintNo}
  - Ward: ${wardNumber}
  - Status: ${ticket.status}

You can log in at http://localhost:5173/login to track your active grievance or post verification notes.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

            sendMail({
                to: complaineeEmail.trim(),
                subject: `[CivicSense Update] Comment Added to Complaint #CS-${complaintNo}`,
                text: complaineeMailText
            }).catch(err => console.error('Failed to notify complainee of comment update:', err.message));
        }

        // ---- B. Notify other responsible officials ----
        const otherOfficialsList = [...uniqueOfficialEmails];
        if (otherOfficialsList.length > 0) {
            const officialsMailText = `Dear Officer,

A new administrative comment / progress update has been posted on Complaint #CS-${complaintNo} (Ward: ${wardNumber}, Department: ${ticketDept}) by a fellow department official.

Comment Details:
  - Posted By: ${authorName} (${commenterDepartment})
  - Date: ${new Date().toLocaleString('en-IN')}

Comment Text:
"${comment_text.trim()}"

Grievance Summary:
  - Landmark: ${ticket.landmark}
  - Severity: ${ticket.severity}
  - Status: ${ticket.status}

Please log in to http://localhost:5173 to coordinate action and monitor resolution workflow steps.

Warm regards,
CivicSense Administrator,
Mangaluru Municipal Administration`;

            sendMail({
                to: otherOfficialsList.join(', '),
                subject: `[CivicSense Coordinator Update] Comment Added to Complaint #CS-${complaintNo}`,
                text: officialsMailText
            }).catch(err => console.error('Failed to notify coordinator officials of comment:', err.message));
        }

        res.status(201).json({ success: true, message: 'Comment posted and notifications dispatched successfully.' });
    } catch (err) {
        console.error('Post comment error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// PATCH: Mark a Job as Completed by Contractor
router.patch('/:complaintNo/contractor-complete', async (req, res) => {
    try {
        const complaintNo = parseInt(req.params.complaintNo, 10);
        if (isNaN(complaintNo)) {
            return res.status(400).json({ success: false, error: 'Invalid complaint number.' });
        }

        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Authorization required.' });
        }
        const token = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtErr) {
            return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
        }

        const contractorEmail = decoded.email;
        const contractorRole = decoded.role || '';
        
        if (!contractorRole.toLowerCase().includes('contractor')) {
            return res.status(403).json({ success: false, error: 'Access denied. Only contractors can mark assigned jobs as complete.' });
        }

        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;

        // Fetch the ticket first to check details and ensure it's assigned to this contractor
        const ticketResult = await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .query(`SELECT * FROM ${targetDB}.dbo.COMPLAINTS WHERE complaint_no = @complaintNo`);

        if (ticketResult.recordset.length === 0) {
            return res.status(404).json({ success: false, error: 'Complaint not found.' });
        }

        const ticket = ticketResult.recordset[0];

        if (!ticket.assigned_contractor || ticket.assigned_contractor.toLowerCase().trim() !== contractorEmail.toLowerCase().trim()) {
            return res.status(403).json({ success: false, error: 'Access denied. You are not assigned to this job.' });
        }

        // Update ticket status to 'Pending Verification'
        await pool.request()
            .input('complaintNo', sql.Int, complaintNo)
            .query(`UPDATE ${targetDB}.dbo.COMPLAINTS SET status = 'Pending Verification' WHERE complaint_no = @complaintNo`);

        // Post a system comment indicating that the contractor has marked it as done
        const commentId = Math.floor(100000 + Math.random() * 900000);
        await pool.request()
            .input('id', sql.Int, commentId)
            .input('complaintNo', sql.Int, complaintNo)
            .input('authorEmail', sql.VarChar, contractorEmail)
            .input('authorName', sql.VarChar, decoded.name || 'Contractor')
            .input('department', sql.NVarChar, decoded.department || 'Contractor')
            .input('commentText', sql.NVarChar, 'System update: Contractor has marked this job as completed. Pending verification by municipal officials.')
            .query(`INSERT INTO ${targetDB}.dbo.TICKET_COMMENTS (id, complaint_no, author_email, author_name, department, comment_text) VALUES (@id, @complaintNo, @authorEmail, @authorName, @department, @commentText)`);

        // Notify complainee and concerned officials
        const complaineeEmail = ticket.complainee_email;

        // Fetch officials to notify
        const officialsResult = await pool.request().query(`
            SELECT email, role, department, ward_assignment 
            FROM ${targetDB}.dbo.APPROVED_OFFICIALS
        `);

        const extractWardNumber = (wardStr) => {
            if (!wardStr) return null;
            const match = String(wardStr).match(/Ward\s+(\d+)/i);
            return match ? parseInt(match[1], 10) : null;
        };

        const targetWardNum = extractWardNumber(ticket.ward_number);
        const ticketDept = ticket.department;

        let officialsToNotify = [];
        officialsResult.recordset.forEach(off => {
            const userWardStr = (off.ward_assignment || '').trim().toLowerCase();
            const userWardNum = extractWardNumber(off.ward_assignment);

            let isWardMatch = userWardStr === 'all wards' ||
                                (targetWardNum !== null && userWardNum !== null && targetWardNum === userWardNum) ||
                                (userWardStr === String(ticket.ward_number).trim().toLowerCase());

            if (isWardMatch) {
                const normalizeDept = (dept) => {
                    const d = (dept || '').trim().toLowerCase();
                    if (d.includes('mcc') || d.includes('mangaluru city corporation')) return 'mcc';
                    if (d.includes('water supply') || d.includes('sewage') || d.includes('water board')) return 'water board';
                    if (d.includes('mescom') || d.includes('power')) return 'mescom';
                    if (d.includes('stray') || d.includes('animal') || d.includes('health')) return 'health dept';
                    return d;
                };
                if (off.role === 'Corporator' || normalizeDept(off.department) === normalizeDept(ticketDept)) {
                    officialsToNotify.push(off.email);
                }
            }
        });

        // 1. Notify Complainee
        const { sendMail } = require('../utils/emailHelper');
        if (complaineeEmail) {
            const complaineeText = `Dear Citizen,

The assigned contractor (${contractorEmail}) has marked your grievance #CS-${complaintNo} as completed.

Complaint Details:
- Department: ${ticket.department}
- Category: ${ticket.category || 'General'}
- Landmark: ${ticket.landmark || 'Not provided'}
- Description: ${ticket.description || 'Not provided'}

Our municipal officials have been notified to inspect and verify the work. A completion proof photo will be uploaded to the portal once verified, and the ticket status will be marked as Resolved.

Thank you,
CivicSense Team`;

            sendMail({
                to: complaineeEmail,
                subject: `[CivicSense Update] Work Done on Complaint #CS-${complaintNo}`,
                text: complaineeText
            }).catch(err => console.error('Failed to send email to complainee:', err.message));
        }

        // 2. Notify Officials
        if (officialsToNotify.length > 0) {
            const officialsText = `Dear Official,

Contractor ${contractorEmail} has marked the grievance #CS-${complaintNo} (assigned to ${ticket.department}) as complete.

Grievance Details:
- Ward: ${ticket.ward_number || 'General'}
- Landmark: ${ticket.landmark || 'Not provided'}
- Description: ${ticket.description || 'Not provided'}

Action Required:
Please inspect the site and upload the completion proof photo on your CivicSense Department Portal to verify the work and officially resolve this ticket.

Warm regards,
CivicSense System Administrator`;

            sendMail({
                to: officialsToNotify.join(', '),
                subject: `[Action Required] Verify Contractor Work for Complaint #CS-${complaintNo}`,
                text: officialsText
            }).catch(err => console.error('Failed to notify officials:', err.message));
        }

        res.status(200).json({ success: true, message: 'Job completed by contractor. Verification notifications dispatched.' });
    } catch (err) {
        console.error('Contractor complete job error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// BLOCKCHAIN CRYPTOGRAPHIC AUDIT VERIFICATION
// ==========================================
const { recordTransaction, verifyComplaintIntegrity } = require('../utils/blockchainLedger');

router.get('/:id/blockchain-verify', async (req, res) => {
    try {
        const complaintId = req.params.id;
        const pool = await poolPromise;
        const targetDB = process.env.DB_NAME;
        
        const result = await pool.request()
            .input('id', sql.Int, complaintId)
            .query(`SELECT * FROM ${targetDB}.dbo.COMPLAINTS WHERE complaint_no = @id`);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Complaint not found.' });
        }

        const complaintData = result.recordset[0];
        
        const auditPayload = {
            complaint_no: complaintData.complaint_no,
            department: complaintData.department,
            description: complaintData.description,
            status: complaintData.status,
            media: complaintData.media_attachments,
            resolution_media: complaintData.after_media_attachments,
            created_at: complaintData.created_at
        };

        const verification = verifyComplaintIntegrity(complaintId, auditPayload);
        res.json({
            success: true,
            complaint_no: complaintId,
            verification
        });
    } catch (err) {
        console.error('Blockchain verification error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;