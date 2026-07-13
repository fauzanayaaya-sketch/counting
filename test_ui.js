
const document = { getElementById: (id) => ({ id, style: {}, classList: { add:()=>{}, remove:()=>{} }, addEventListener: ()=>{}, innerHTML: '' }), addEventListener: ()=>{} };
const window = { localStorage: { getItem: () => null, setItem: () => {} }, innerWidth: 1000, addEventListener: ()=>{} };
const localStorage = window.localStorage;

// ===================================================================
//  ROULETTE STRATEGY AI — Analysis Engine (REAL-TIME VERSION)
//  Data disimpan di localStorage, bisa ditambah secara live.
// ===================================================================

const STORAGE_KEY = 'roulette_results_v3';

// ---- DEFAULT DATA: 265 angka (diurutkan: dari terlama ke terbaru) ----
const DEFAULT_RESULTS = [
    17, 15, 7, 16, 1, 6, 9, 3, 24, 19, 24, 26, 27, 17, 20, 0, 3, 18, 27, 26, 4, 19, 10, 21, 1, 23, 16, 23, 9, 18, 13, 2, 22, 6, 0, 25, 0, 3, 27, 2, 25, 27, 10, 26, 10, 16, 18, 32, 11, 36, 25, 28, 12, 21, 31, 7, 17, 14, 16, 29, 13, 20, 22, 14, 3, 10, 29, 24, 29, 0, 24, 12, 9, 26, 12, 11, 20, 29, 11, 22, 30, 24, 3, 8, 0, 33, 3, 17, 19, 14, 10, 21, 21, 5, 5, 11, 32, 24, 34, 9, 36, 28, 11, 19, 36, 3, 18, 3, 16, 35, 18, 0, 17, 7, 25, 6, 25, 21, 9, 26, 5, 1, 12, 2, 11, 2, 3, 12, 12, 24, 13, 4, 21, 12, 6, 23, 10, 19, 7, 2, 25, 20, 2, 20, 17, 35, 9, 16, 22, 14, 14, 18, 28, 10, 28, 3, 20, 12, 20, 31, 18, 26, 33, 19, 13, 21, 7, 14, 8, 2, 0, 29, 34, 23, 13, 7, 0, 11, 13, 30, 4, 35, 20, 9, 20, 10, 12, 36, 33, 2, 0, 28, 35, 25, 36, 36, 17, 33, 29, 28, 33, 1, 16, 8, 28, 15, 0, 4, 17, 31, 27, 2, 21, 14, 19, 33, 18, 4, 31, 16, 7, 23, 29, 10, 19, 35, 27, 28, 5, 25, 20, 28, 18, 7, 28, 36, 9, 24, 27, 1, 33, 9, 13, 23, 18, 22, 12, 35, 14, 15, 21, 33, 15, 32, 7, 10, 1, 2, 24, 23, 23, 5, 22, 13, 0, 3, 34, 31, 5, 32, 25, 8
];

// ---- DYNAMIC RESULTS (loaded from localStorage) ----
let RESULTS = loadFromStorage();

function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
    } catch(e) { /* ignore */ }
    // First time: use default data and save it
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RESULTS));
    return [...DEFAULT_RESULTS];
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(RESULTS));
}

// ---- TRACKER STATE ----
const TRACKER_KEY = 'roulette_tracker_v3';
let PREDICTION_TRACKER = loadTracker();

function loadTracker() {
    let defaultTracker = {
        safe: { wins: 0, total: 0 },
        sektor: { wins: 0, total: 0 },
        medium: { wins: 0, total: 0 },
        agresif: { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 },
        murni: { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 },
        history: []
    };
    try {
        const saved = localStorage.getItem(TRACKER_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Ensure all properties exist to prevent crashes from old/corrupt saves
            if (!parsed.sektor) parsed.sektor = { wins: 0, total: 0 };
            if (!parsed.safe) parsed.safe = { wins: 0, total: 0 };
            if (!parsed.medium) parsed.medium = { wins: 0, total: 0 };
            if (!parsed.agresif) {
                parsed.agresif = { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 };
            } else {
                if (typeof parsed.agresif.currentStreak === 'undefined') parsed.agresif.currentStreak = 0;
                if (typeof parsed.agresif.maxWinStreak === 'undefined') parsed.agresif.maxWinStreak = 0;
                if (typeof parsed.agresif.maxLoseStreak === 'undefined') parsed.agresif.maxLoseStreak = 0;
            }
            if (!parsed.history) parsed.history = [];
            
            if (!parsed.murni) {
                parsed.murni = { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 };
            }

            return parsed;
        }
    } catch(e) {}
    return defaultTracker;
}

function saveTracker() {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(PREDICTION_TRACKER));
}

// ---- ROULETTE COLOR MAP (European) ----
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACK_NUMBERS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);

function getColor(n) {
    if (n === 0) return 'green';
    if (RED_NUMBERS.has(n)) return 'red';
    return 'black';
}

function getColorClass(n) {
    const c = getColor(n);
    return c === 'red' ? 'r' : c === 'green' ? 'g' : 'b';
}

// ---- COLUMNS (roulette table) ----
const COL1 = new Set([1,4,7,10,13,16,19,22,25,28,31,34]);
const COL2 = new Set([2,5,8,11,14,17,20,23,26,29,32,35]);
const COL3 = new Set([3,6,9,12,15,18,21,24,27,30,33,36]);

function getDozen(n) {
    if (n === 0) return null;
    if (n <= 12) return 1;
    if (n <= 24) return 2;
    return 3;
}

function getColumn(n) {
    if (n === 0) return null;
    if (COL1.has(n)) return 1;
    if (COL2.has(n)) return 2;
    return 3;
}

// ---- EUROPEAN WHEEL SEQUENCE (clockwise from 0) ----
const WHEEL_SEQ = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];

// Physical wheel sectors
const VOISINS = new Set([22,18,29,7,28,12,35,3,26,0,32,15,19,4,21,2,25]); // 17 numbers
const TIERS = new Set([27,13,36,11,30,8,23,10,5,24,16,33]);              // 12 numbers
const ORPHELINS = new Set([1,20,14,31,9,17,34,6]);                        // 8 numbers

function getWheelNeighbors(num, range = 2) {
    const idx = WHEEL_SEQ.indexOf(num);
    if (idx === -1) return [];
    const neighbors = [];
    for (let i = -range; i <= range; i++) {
        const ni = (idx + i + WHEEL_SEQ.length) % WHEEL_SEQ.length;
        neighbors.push(WHEEL_SEQ[ni]);
    }
    return neighbors;
}

// ===================================================================
//  ADVANCED ANALYSIS ENGINE (6 Methods)
// ===================================================================

// Method 1: Recency-Weighted Frequency (recent spins count more)
function computeWeightedFreq(decayFactor = 0.97) {
    const wf = {};
    for (let i = 0; i <= 36; i++) wf[i] = 0;
    for (let i = 0; i < RESULTS.length; i++) {
        const weight = Math.pow(decayFactor, RESULTS.length - 1 - i);
        wf[RESULTS[i]] += weight;
    }
    return wf;
}

// Method 2: Gap Analysis — how many spins since each number appeared
function computeGapAnalysis() {
    const gaps = {};
    for (let i = 0; i <= 36; i++) {
        const lastIdx = RESULTS.lastIndexOf(i);
        gaps[i] = lastIdx === -1 ? RESULTS.length + 37 : RESULTS.length - 1 - lastIdx;
    }
    return gaps;
}

// Method 3: Transition Matrix — what follows the last few numbers
function computeTransitions() {
    const trans = {};
    for (let i = 0; i < RESULTS.length - 1; i++) {
        const from = RESULTS[i];
        const to = RESULTS[i + 1];
        if (!trans[from]) trans[from] = {};
        trans[from][to] = (trans[from][to] || 0) + 1;
    }
    return trans;
}

function getTransitionPredictions(lastN = 3) {
    if (RESULTS.length < 2) return [];
    const trans = computeTransitions();
    const scores = {};
    const recent = RESULTS.slice(-lastN);
    
    recent.forEach((num, idx) => {
        const weight = (idx + 1) / lastN; // more recent = higher weight
        const t = trans[num];
        if (t) {
            for (const [next, count] of Object.entries(t)) {
                scores[next] = (scores[next] || 0) + count * weight;
            }
        }
    });
    
    return Object.entries(scores)
        .map(([n, s]) => ({ num: +n, score: s }))
        .sort((a, b) => b.score - a.score);
}

// Method 4: Chi-Square Bias Detection
function computeChiSquare() {
    if (RESULTS.length < 10) return { value: 0, isBiased: false, pValue: 1 };
    const freq = computeFrequency();
    const expected = RESULTS.length / 37;
    let chiSq = 0;
    for (let i = 0; i <= 36; i++) {
        chiSq += Math.pow(freq[i] - expected, 2) / expected;
    }
    // df=36, critical at 0.05 = 50.998, at 0.10 = 47.212
    const isBiased = chiSq > 50.998;
    const maybeBiased = chiSq > 47.212;
    return { value: chiSq, isBiased, maybeBiased, expected };
}

// Method 5: Wheel Sector Distribution
function computeSectorDist() {
    let voisins = 0, tiers = 0, orphelins = 0;
    RESULTS.forEach(n => {
        if (VOISINS.has(n)) voisins++;
        else if (TIERS.has(n)) tiers++;
        else if (ORPHELINS.has(n)) orphelins++;
    });
    const total = RESULTS.length;
    // Expected proportions: Voisins 17/37, Tiers 12/37, Orphelins 8/37
    return {
        voisins, tiers, orphelins, total,
        voisinsPct: total > 0 ? (voisins/total*100) : 0,
        tiersPct: total > 0 ? (tiers/total*100) : 0,
        orphelinsPct: total > 0 ? (orphelins/total*100) : 0,
        voisinsExpected: 45.9, tiersExpected: 32.4, orphelinsExpected: 21.6
    };
}

// Method 6: Short-term vs Long-term Divergence
function computeShortLongDivergence(shortWindow = 20) {
    if (RESULTS.length < shortWindow) return {};
    const longFreq = computeFrequency();
    const shortResults = RESULTS.slice(-shortWindow);
    const shortFreq = {};
    for (let i = 0; i <= 36; i++) shortFreq[i] = 0;
    shortResults.forEach(n => shortFreq[n]++);
    
    const divergence = {};
    for (let i = 0; i <= 36; i++) {
        const longRate = longFreq[i] / RESULTS.length;
        const shortRate = shortFreq[i] / shortWindow;
        // Positive = trending up recently, Negative = cooling down
        divergence[i] = { 
            long: longRate, short: shortRate, 
            diff: shortRate - longRate,
            trending: shortRate > longRate ? 'up' : 'down'
        };
    }
    return divergence;
}

// ===================================================================
//  COMPOSITE SCORING — combines all 6 methods
// ===================================================================

function computeCompositeScores() {
    if (RESULTS.length < 5) return [];
    
    const total = RESULTS.length;
    const rawFreq = computeFrequency();
    const weightedFreq = computeWeightedFreq(0.97);
    const gaps = computeGapAnalysis();
    const transPredictions = getTransitionPredictions(3);
    const sectorDist = computeSectorDist();

    // Normalize each method to 0–1 range, then combine with weights
    const scores = {};
    
    for (let i = 0; i <= 36; i++) {
        // 1. Raw frequency score (higher = better)
        const freqScore = rawFreq[i] / Math.max(...Object.values(rawFreq), 1);
        
        // 2. Recency-weighted score
        const wfMax = Math.max(...Object.values(weightedFreq), 0.001);
        const recencyScore = weightedFreq[i] / wfMax;
        
        // 3. Gap score (longer gap = higher score — "overdue")
        const maxGap = Math.max(...Object.values(gaps), 1);
        const gapScore = gaps[i] / maxGap;
        
        // 4. Transition score (from last numbers)
        const transEntry = transPredictions.find(t => t.num === i);
        const transMax = transPredictions.length > 0 ? transPredictions[0].score : 1;
        const transScore = transEntry ? transEntry.score / transMax : 0;
        
        // 5. Wheel neighbor boost (if physical neighbors are hot)
        const neighbors = getWheelNeighbors(i, 2);
        let neighborHeat = 0;
        neighbors.forEach(n => { neighborHeat += rawFreq[n] || 0; });
        const maxNeighborHeat = 5 * Math.max(...Object.values(rawFreq), 1);
        const neighborScore = neighborHeat / maxNeighborHeat;
        
        // 6. Short-term momentum
        let momentumScore = 0.5;
        if (total >= 20) {
            const last20 = RESULTS.slice(-20);
            const recent = last20.filter(n => n === i).length;
            momentumScore = Math.min(recent / 3, 1); // cap at 3 appearances in last 20
        }
        
        // Weighted combination
        scores[i] = {
            num: i,
            total: (
                freqScore     * 0.15 +  // 15% overall frequency
                recencyScore  * 0.20 +  // 20% recency weight
                gapScore      * 0.20 +  // 20% gap/overdue
                transScore    * 0.20 +  // 20% transition pattern
                neighborScore * 0.10 +  // 10% wheel neighbors
                momentumScore * 0.15    // 15% short-term momentum
            ),
            breakdown: {
                freq: freqScore,
                recency: recencyScore,
                gap: gapScore,
                transition: transScore,
                neighbor: neighborScore,
                momentum: momentumScore
            }
        };
    }
    
    return Object.values(scores).sort((a, b) => b.total - a.total);
}

// Compute confidence level based on data quality
function computeConfidence() {
    const n = RESULTS.length;
    const chi = computeChiSquare();
    
    let level = 'low';
    let text = 'Data Kurang';
    let score = 0;
    
    if (n < 20) {
        level = 'low'; text = `Data Kurang (${n}/50)`; score = n/50*100;
    } else if (n < 50) {
        level = 'medium'; text = `Cukup (${n} data)`; score = 40 + (n-20)/30*30;
    } else if (n < 100) {
        level = 'medium'; text = `Baik (${n} data)`; score = 70 + (n-50)/50*15;
    } else {
        level = 'high'; text = `Sangat Baik (${n} data)`; score = 85 + Math.min((n-100)/200*15, 15);
    }
    
    if (chi.isBiased && n >= 50) {
        text += ' • Bias Terdeteksi!';
        score = Math.min(score + 10, 100);
    }
    
    return { level, text, score: Math.round(score) };
}

// ===================================================================
//  PREDICTION TRACKER LOGIC
// ===================================================================

function getTableNeighborsForDigit(lastDigit) {
    const anchors = [];
    for (let i = 0; i <= 36; i++) {
        if (i % 10 === lastDigit) anchors.push(i);
    }
    
    const numsSet = new Set();
    anchors.forEach(anchor => {
        if (anchor === 0) {
            numsSet.add(0);
            numsSet.add(1);
            numsSet.add(2);
            numsSet.add(3);
            return;
        }
        const r = Math.ceil(anchor / 3);
        const c = ((anchor - 1) % 3) + 1;
        
        for (let rr = r - 1; rr <= r + 1; rr++) {
            if (rr < 1 || rr > 12) continue;
            for (let cc = c - 1; cc <= c + 1; cc++) {
                if (cc < 1 || cc > 3) continue;
                const neighborNum = (rr - 1) * 3 + cc;
                numsSet.add(neighborNum);
            }
        }
    });
    return Array.from(numsSet).sort((a, b) => a - b);
}

function getAggressivePrediction() {
    if (RESULTS.length === 0) return { nums: [], label: '', type: 'none' };
    const lastNum = RESULTS[RESULTS.length - 1];
    const lastDigit = lastNum % 10;
    
    const nums = getTableNeighborsForDigit(lastDigit);
    
    return { 
        nums, 
        label: `Area Ekor ${lastDigit}`,
        type: 'tail_table',
        lastNum,
        lastDigit
    };
}

function getAggressiveColorPrediction(targetColor) {
    if (RESULTS.length === 0) return { nums: [], label: '', type: 'none' };
    const lastNum = RESULTS[RESULTS.length - 1];
    const lastDigit = lastNum % 10;
    
    let nums = getTableNeighborsForDigit(lastDigit);
    nums = nums.filter(n => getColor(n) === targetColor);
    
    return { 
        nums, 
        label: `Area Ekor ${lastDigit} (${targetColor === 'red' ? 'Merah' : 'Hitam'})`,
        type: 'tail_table_color',
        lastNum,
        lastDigit
    };
}

function getAggressiveOddEvenPrediction(targetType) {
    if (RESULTS.length === 0) return { nums: [], label: '', type: 'none' };
    const lastNum = RESULTS[RESULTS.length - 1];
    const lastDigit = lastNum % 10;
    
    let nums = getTableNeighborsForDigit(lastDigit);
    nums = nums.filter(n => {
        if (n === 0) return false;
        return targetType === 'odd' ? (n % 2 !== 0) : (n % 2 === 0);
    });
    
    return { 
        nums, 
        label: `Area Ekor ${lastDigit} (${targetType === 'odd' ? 'Ganjil' : 'Genap'})`,
        type: 'tail_table_oe',
        lastNum,
        lastDigit
    };
}

function getAggressiveHighLowPrediction(targetType) {
    if (RESULTS.length === 0) return { nums: [], label: '', type: 'none' };
    const lastNum = RESULTS[RESULTS.length - 1];
    const lastDigit = lastNum % 10;
    
    let nums = getTableNeighborsForDigit(lastDigit);
    nums = nums.filter(n => {
        if (n === 0) return false;
        return targetType === 'high' ? (n >= 19) : (n <= 18);
    });
    
    return { 
        nums, 
        label: `Area Ekor ${lastDigit} (${targetType === 'high' ? 'Besar' : 'Kecil'})`,
        type: 'tail_table_hl',
        lastNum,
        lastDigit
    };
}

// --- SIGNAL DETECTION ---
function checkBlockScannerSignal(type) {
    if (RESULTS.length < 5) return null;
    
    // Convert history into generic 'A' or 'B' depending on type
    let r = RESULTS.slice().reverse().map(n => {
        if (n === 0) return 'G';
        if (type === 'color') return getColor(n) === 'red' ? 'A' : 'B'; 
        if (type === 'oddeven') return n % 2 !== 0 ? 'A' : 'B'; 
        if (type === 'highlow') return n >= 19 ? 'A' : 'B'; 
        return 'G';
    });
    
    const getTargetString = (val) => {
        if (type === 'color') return val === 'A' ? 'red' : 'black';
        if (type === 'oddeven') return val === 'A' ? 'odd' : 'even';
        if (type === 'highlow') return val === 'A' ? 'high' : 'low';
    };

    const getPatternName = (name) => {
        const typeName = type === 'color' ? 'Warna' : (type === 'oddeven' ? 'Ganjil/Genap' : 'Besar/Kecil');
        return `${name} (${typeName})`;
    }

    // 1. The Double Mirror (X,X,Y,Y,X,X -> Target X) (100% win rate)
    if (r.length >= 6 && r[0] !== 'G' && r[1] !== 'G' && r[2] !== 'G' && r[3] !== 'G' && r[4] !== 'G' && r[5] !== 'G') {
        if (r[0] === r[1] && r[1] !== r[2] && r[2] === r[3] && r[3] !== r[4] && r[4] === r[5] && r[4] === r[0]) {
            return { target: getTargetString(r[0]), pattern: getPatternName('The Double Mirror VIP') };
        }
    }
    
    // 2. The Monster Pullback 4:2 (X,X,X,X,Y,Y -> Target X) (66.7% win rate)
    if (r.length >= 6 && r[0] !== 'G' && r[1] !== 'G' && r[2] !== 'G' && r[3] !== 'G' && r[4] !== 'G' && r[5] !== 'G') {
        if (r[0] === r[1] && r[1] !== r[2] && r[2] === r[3] && r[3] === r[4] && r[4] === r[5]) {
            let X = r[2];
            return { target: getTargetString(X), pattern: getPatternName('Monster Pullback VIP') };
        }
    }
    
    // 3. The Pullback 3:2 (X,X,X,Y,Y -> Target X) 
    if (r.length >= 5 && r[0] !== 'G' && r[1] !== 'G' && r[2] !== 'G' && r[3] !== 'G' && r[4] !== 'G') {
        if (r[0] === r[1] && r[1] !== r[2] && r[2] === r[3] && r[3] === r[4]) {
            let X = r[2];
            return { target: getTargetString(X), pattern: getPatternName('Pullback VIP') };
        }
    }

    // 4. The Extreme Pullback 5:3 (X,X,X,X,X,Y,Y,Y -> Target X)
    if (r.length >= 8 && r.slice(0,8).every(x => x !== 'G')) {
        if (r[0]===r[1] && r[1]===r[2] && r[2]!==r[3] && r[3]===r[4] && r[4]===r[5] && r[5]===r[6] && r[6]===r[7]) {
            let X = r[3];
            return { target: getTargetString(X), pattern: getPatternName('Extreme Pullback VIP') };
        }
    }

    // 5. The Stutter Step (X, Y>1, X, Y>1, X, Y -> Target Y)
    if (r.length >= 8 && r[0] !== 'G') {
        let Y = r[0];
        let X = r[1];
        if (X !== 'G' && X !== Y) {
            let idx = 2;
            let countY1 = 0;
            while (idx < r.length && r[idx] === Y) { countY1++; idx++; }
            if (countY1 >= 2 && idx < r.length && r[idx] === X) {
                idx++;
                let countY2 = 0;
                while (idx < r.length && r[idx] === Y) { countY2++; idx++; }
                if (countY2 >= 2 && idx < r.length && r[idx] === X) {
                    return { target: getTargetString(Y), pattern: getPatternName('Stutter Step VIP') };
                }
            }
        }
    }
    
    return null;
}


function checkDozenSignal() {
    if (RESULTS.length < 4) return null;
    let r = RESULTS.slice().reverse().map(n => n === 0 ? 'G' : getDozen(n));
    
    if (r.length >= 4 && r[0] !== 'G' && r[1] !== 'G' && r[2] !== 'G' && r[3] !== 'G') {
        // 1. Sinyal Terjepit Lelah (A, A, B, A) -> Target: !A
        if (r[3] === r[2] && r[2] === r[0] && r[1] !== r[0]) {
            let targetDozens = [1, 2, 3].filter(d => d !== r[0]);
            return { target: targetDozens, pattern: `Terjepit Lelah VIP (${r[3]}-${r[2]}-${r[1]}-${r[0]})` };
        }
        // 2. Sinyal Transisi Ganda (A, A, B, B) -> Target: !B
        if (r[3] === r[2] && r[1] === r[0] && r[2] !== r[1]) {
            let targetDozens = [1, 2, 3].filter(d => d !== r[0]);
            return { target: targetDozens, pattern: `Transisi Ganda VIP (${r[3]}-${r[2]}-${r[1]}-${r[0]})` };
        }
        // 3. Sinyal Ping-Pong Lelah (A, B, A, B) -> Target: !B
        if (r[3] === r[1] && r[2] === r[0] && r[1] !== r[0]) {
            let targetDozens = [1, 2, 3].filter(d => d !== r[0]);
            return { target: targetDozens, pattern: `Ping-Pong Lelah VIP (${r[3]}-${r[2]}-${r[1]}-${r[0]})` };
        }
        // 4. Sinyal Double Terjepit (A, B, B, A) -> Target: !A
        if (r[3] === r[0] && r[2] === r[1] && r[1] !== r[0]) {
            let targetDozens = [1, 2, 3].filter(d => d !== r[0]);
            return { target: targetDozens, pattern: `Double Terjepit VIP (${r[3]}-${r[2]}-${r[1]}-${r[0]})` };
        }
        
        // Max Streak VIP (A, A, A, A) -> Target: !A
        if (r[0] === r[1] && r[1] === r[2] && r[2] === r[3]) {
            let targetDozens = [1, 2, 3].filter(d => d !== r[0]);
            return { target: targetDozens, pattern: `Max Streak VIP (Dozen ${r[0]} 4x)` };
        }
    }
    
    if (r.length >= 7) {
        let window7 = r.slice(0, 7);
        for (let d = 1; d <= 3; d++) {
            let count = window7.filter(x => x === d).length;
            if (count >= 5) {
                let targetDozens = [1, 2, 3].filter(x => x !== d);
                return { target: targetDozens, pattern: `Overbought VIP (Dozen ${d} dominan)` };
            }
        }
    }
    
    if (r.length >= 3 && r[0] === r[1] && r[1] === r[2] && r[0] !== 'G') {
        let targetDozens = [1, 2, 3].filter(d => d !== r[0]);
        return { target: targetDozens, pattern: `Pemutus Streak (Dozen ${r[0]} 3x)` };
    }
    if (r.length >= 5) {
        let last5 = r.slice(0, 5);
        let missing = [1, 2, 3].filter(d => !last5.includes(d));
        if (missing.length === 1) {
            let targetDozens = [1, 2, 3].filter(d => d !== missing[0]);
            return { target: targetDozens, pattern: `Dozen Tertidur (Dozen ${missing[0]} absen 5x)` };
        }
    }
    if (r.length >= 4 && r[0] !== 'G' && r[1] !== 'G' && r[0] !== r[1] && r[2] === r[0] && r[3] === r[1]) {
        return { target: [r[0], r[1]].sort(), pattern: `Pola Zig-Zag Dozen (${r[1]}-${r[0]}-${r[1]}-${r[0]})` };
    }
    if (r.length >= 3 && r[0] !== 'G' && r[1] !== 'G' && r[2] !== 'G' && r[1] === r[2] && r[0] !== r[1]) {
        return { target: [r[0], r[1]].sort(), pattern: `Pola Transisi Dozen (${r[2]}-${r[1]}-${r[0]})` };
    }
    return null;
}

function capturePredictions() {
    if (RESULTS.length < 1) return null;
    
    const colorDist = computeColorDist();
    const dozenDist = computeDozenDist();
    const colDist = computeColumnDist();
    const sectorDist = computeSectorDist();
    const scores = computeCompositeScores();
    
    const domColor = colorDist.red > colorDist.black ? 'red' : 'black';
    const domColorLabel = domColor === 'red' ? 'Merah' : 'Hitam';
    
    // Double Dozen / Double Column Logic
    const dozenArr = Object.entries(dozenDist).sort((a, b) => b[1] - a[1]);
    const bestDozen1 = parseInt(dozenArr[0][0]);
    const bestDozen2 = parseInt(dozenArr[1][0]);
    const dozenHits = dozenArr[0][1] + dozenArr[1][1];

    const colArr = Object.entries(colDist).sort((a, b) => b[1] - a[1]);
    const bestCol1 = parseInt(colArr[0][0]);
    const bestCol2 = parseInt(colArr[1][0]);
    const colHits = colArr[0][1] + colArr[1][1];

    let mediumLabel, mediumCheck;
    if (dozenHits >= colHits) {
        mediumLabel = `Dozen ${bestDozen1} & ${bestDozen2}`;
        mediumCheck = n => getDozen(n) === bestDozen1 || getDozen(n) === bestDozen2;
    } else {
        mediumLabel = `Kolom ${bestCol1} & ${bestCol2}`;
        mediumCheck = n => getColumn(n) === bestCol1 || getColumn(n) === bestCol2;
    }

    // Sector Logic
    const sectors = [
        { name: 'Voisins', pct: sectorDist.voisinsPct, exp: 45.9, check: n => VOISINS.has(n) },
        { name: 'Tiers', pct: sectorDist.tiersPct, exp: 32.4, check: n => TIERS.has(n) },
        { name: 'Orphelins', pct: sectorDist.orphelinsPct, exp: 21.6, check: n => ORPHELINS.has(n) }
    ];
    const hottestSector = sectors.reduce((a, b) => (a.pct - a.exp > b.pct - b.exp) ? a : b);
    
    const agresifPred = getAggressivePrediction();
    
    const colorSig = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('color') : null;
    const oeSig = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('oddeven') : null;
    const hlSig = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('highlow') : null;
    const dozenSig = typeof checkDozenSignal === 'function' ? checkDozenSignal() : null;
    
    const colorTargetNums = colorSig ? getAggressiveColorPrediction(colorSig.target).nums : [];
    const oeTargetNums = oeSig ? getAggressiveOddEvenPrediction(oeSig.target).nums : [];
    const hlTargetNums = hlSig ? getAggressiveHighLowPrediction(hlSig.target).nums : [];
    
    return {
        safe: { 
            label: `Pasang ${domColorLabel}`, 
            check: n => getColor(n) === domColor 
        },
        sektor: {
            label: hottestSector.name,
            check: hottestSector.check
        },
        medium: { 
            label: mediumLabel, 
            check: mediumCheck 
        },
        agresif: { 
            label: agresifPred.label, 
            nums: agresifPred.nums,
            check: n => agresifPred.nums.includes(n) 
        },
        signals: {
            color: colorSig ? { target: colorSig.target, check: n => colorTargetNums.includes(n) } : null,
            oe: oeSig ? { target: oeSig.target, check: n => oeTargetNums.includes(n) } : null,
            hl: hlSig ? { target: hlSig.target, check: n => hlTargetNums.includes(n) } : null,
            dozen: dozenSig ? { target: dozenSig.target, check: n => dozenSig.target.includes(getDozen(n)) } : null
        },
        murni: {
            color: colorSig ? { target: colorSig.target, check: n => {
                if (n === 0) return false;
                if (colorSig.target === 'red') return getColor(n) === 'red';
                return getColor(n) === 'black';
            }} : null,
            oe: oeSig ? { target: oeSig.target, check: n => {
                if (n === 0) return false;
                let isOdd = n % 2 !== 0;
                return oeSig.target === 'odd' ? isOdd : !isOdd;
            }} : null,
            hl: hlSig ? { target: hlSig.target, check: n => {
                if (n === 0) return false;
                let isHigh = n >= 19;
                return hlSig.target === 'high' ? isHigh : !isHigh;
            }} : null,
            dozen: dozenSig ? { target: dozenSig.target, check: n => {
                if (n === 0) return false;
                return dozenSig.target.includes(getDozen(n));
            }} : null,
            lawanDozen: dozenSig ? { target: [1, 2, 3].filter(d => !dozenSig.target.includes(d)), check: n => {
                if (n === 0) return false;
                return [1, 2, 3].filter(d => !dozenSig.target.includes(d)).includes(getDozen(n));
            }} : null
        }
    };
}

function evaluatePredictions(num, snap) {
    const isSafeWin = snap.safe.check(num);
    const isSektorWin = snap.sektor.check(num);
    const isMediumWin = snap.medium.check(num);
    const isAgresifWin = snap.agresif.check(num);
    
    PREDICTION_TRACKER.safe.total++;
    PREDICTION_TRACKER.sektor.total++;
    PREDICTION_TRACKER.medium.total++;
    PREDICTION_TRACKER.agresif.total++;
    
    if (isSafeWin) PREDICTION_TRACKER.safe.wins++;
    if (isSektorWin) PREDICTION_TRACKER.sektor.wins++;
    if (isMediumWin) PREDICTION_TRACKER.medium.wins++;
    if (isAgresifWin) {
        PREDICTION_TRACKER.agresif.wins++;
        if (PREDICTION_TRACKER.agresif.currentStreak > 0) {
            PREDICTION_TRACKER.agresif.currentStreak++;
        } else {
            PREDICTION_TRACKER.agresif.currentStreak = 1;
        }
        if (PREDICTION_TRACKER.agresif.currentStreak > PREDICTION_TRACKER.agresif.maxWinStreak) {
            PREDICTION_TRACKER.agresif.maxWinStreak = PREDICTION_TRACKER.agresif.currentStreak;
        }
    } else {
        if (PREDICTION_TRACKER.agresif.currentStreak < 0) {
            PREDICTION_TRACKER.agresif.currentStreak--;
        } else {
            PREDICTION_TRACKER.agresif.currentStreak = -1;
        }
        if (Math.abs(PREDICTION_TRACKER.agresif.currentStreak) > PREDICTION_TRACKER.agresif.maxLoseStreak) {
            PREDICTION_TRACKER.agresif.maxLoseStreak = Math.abs(PREDICTION_TRACKER.agresif.currentStreak);
        }
    }
    
    // Add to history log (keep last 50)
    let sigWarna = null;
    let sigOE = null;
    let sigHL = null;
    
    if (snap.signals) {
        if (snap.signals.color) sigWarna = { target: snap.signals.color.target, isWin: snap.signals.color.check(num) };
        if (snap.signals.oe) sigOE = { target: snap.signals.oe.target, isWin: snap.signals.oe.check(num) };
        if (snap.signals.hl) sigHL = { target: snap.signals.hl.target, isWin: snap.signals.hl.check(num) };
    }
    
    let murniWarna = null;
    let murniOE = null;
    let murniHL = null;
    let murniDozen = null;
    let murniLawanDozen = null;
    let murniPlayed = false;
    let murniWon = false;

    if (snap.murni) {
        if (snap.murni.color) {
            murniWarna = { target: snap.murni.color.target, isWin: snap.murni.color.check(num) };
            murniPlayed = true;
            if (murniWarna.isWin) murniWon = true;
        }
        if (snap.murni.oe) {
            murniOE = { target: snap.murni.oe.target, isWin: snap.murni.oe.check(num) };
            murniPlayed = true;
            if (murniOE.isWin) murniWon = true;
        }
        if (snap.murni.hl) {
            murniHL = { target: snap.murni.hl.target, isWin: snap.murni.hl.check(num) };
            murniPlayed = true;
            if (murniHL.isWin) murniWon = true;
        }
        if (snap.murni.dozen) {
            murniDozen = { target: snap.murni.dozen.target, isWin: snap.murni.dozen.check(num) };
            murniPlayed = true;
            if (murniDozen.isWin) murniWon = true;
        }
        if (snap.murni.lawanDozen) {
            murniLawanDozen = { target: snap.murni.lawanDozen.target, isWin: snap.murni.lawanDozen.check(num) };
            // LawanDozen doesn't count towards the primary murni win rate to keep it separate.
        }
    }

    if (murniPlayed) {
        PREDICTION_TRACKER.murni.total++;
        if (murniWon) {
            PREDICTION_TRACKER.murni.wins++;
            if (PREDICTION_TRACKER.murni.currentStreak > 0) PREDICTION_TRACKER.murni.currentStreak++;
            else PREDICTION_TRACKER.murni.currentStreak = 1;
            if (PREDICTION_TRACKER.murni.currentStreak > PREDICTION_TRACKER.murni.maxWinStreak) {
                PREDICTION_TRACKER.murni.maxWinStreak = PREDICTION_TRACKER.murni.currentStreak;
            }
        } else {
            if (PREDICTION_TRACKER.murni.currentStreak < 0) PREDICTION_TRACKER.murni.currentStreak--;
            else PREDICTION_TRACKER.murni.currentStreak = -1;
            if (Math.abs(PREDICTION_TRACKER.murni.currentStreak) > PREDICTION_TRACKER.murni.maxLoseStreak) {
                PREDICTION_TRACKER.murni.maxLoseStreak = Math.abs(PREDICTION_TRACKER.murni.currentStreak);
            }
        }
    }
    
    PREDICTION_TRACKER.history.unshift({
        spinIndex: RESULTS.length,
        actualNumber: num,
        safeLabel: snap.safe.label,
        safeWin: isSafeWin,
        sektorLabel: snap.sektor.label,
        sektorWin: isSektorWin,
        mediumLabel: snap.medium.label,
        mediumWin: isMediumWin,
        agresifLabel: snap.agresif.label,
        agresifNums: snap.agresif.nums,
        agresifWin: isAgresifWin,
        sigWarna: sigWarna,
        sigOE: sigOE,
        sigHL: sigHL,
        murniWarna: murniWarna,
        murniOE: murniOE,
        murniHL: murniHL,
        murniDozen: murniDozen,
        murniLawanDozen: murniLawanDozen
    });
    
    if (PREDICTION_TRACKER.history.length > 50) {
        PREDICTION_TRACKER.history.pop();
    }
    
    saveTracker();
}

// ===================================================================
//  REAL-TIME INPUT FUNCTIONS
// ===================================================================

function addNumber(num) {
    if (num < 0 || num > 36 || isNaN(num)) return;
    
    const snap = capturePredictions();
    
    RESULTS.push(num);
    saveToStorage();
    
    if (snap) {
        evaluatePredictions(num, snap);
    }
    
    // Flash the button
    const allBtns = document.querySelectorAll('.np-btn');
    allBtns.forEach(btn => {
        if (parseInt(btn.textContent) === num) {
            btn.classList.remove('flash');
            void btn.offsetWidth; // reflow to restart animation
            btn.classList.add('flash');
        }
    });

    showToast(`+${num} ditambahkan (${getColor(num)})`, 'success');
    refreshAll();
}

function addManualNumber() {
    const input = document.getElementById('manual-num');
    const num = parseInt(input.value);
    if (isNaN(num) || num < 0 || num > 36) {
        showToast('Masukkan angka 0–36 yang valid!', 'warn');
        return;
    }
    addNumber(num);
    input.value = '';
    input.focus();
}

function undoLast() {
    if (RESULTS.length === 0) {
        showToast('Data sudah kosong!', 'warn');
        return;
    }
    const removed = RESULTS.pop();
    saveToStorage();
    showToast(`Angka ${removed} dihapus`, 'info');
    refreshAll();
}

function clearAllData() {
    if (RESULTS.length === 0) return;
    if (!confirm(`Anda yakin ingin menghapus semua ${RESULTS.length} data?`)) return;
    RESULTS.length = 0;
    
    // Reset tracker
    PREDICTION_TRACKER = {
        safe: { wins: 0, total: 0 },
        sektor: { wins: 0, total: 0 },
        medium: { wins: 0, total: 0 },
        agresif: { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 },
        murni: { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 },
        history: []
    };
    saveTracker();
    
    saveToStorage();
    showToast('Semua data dihapus', 'warn');
    refreshAll();
}

function exportData() {
    if (RESULTS.length === 0) {
        showToast('Tidak ada data untuk di-export!', 'warn');
        return;
    }
    const text = RESULTS.join(', ');
    navigator.clipboard.writeText(text).then(() => {
        showToast(`${RESULTS.length} angka di-copy ke clipboard!`, 'success');
    });
}

function showImportModal() {
    document.getElementById('import-modal').classList.remove('hidden');
    document.getElementById('import-textarea').focus();
}

function hideImportModal() {
    document.getElementById('import-modal').classList.add('hidden');
    document.getElementById('import-textarea').value = '';
}

function importData() {
    const raw = document.getElementById('import-textarea').value.trim();
    if (!raw) {
        showToast('Tidak ada data untuk di-import!', 'warn');
        return;
    }
    // Parse: split by comma, space, newline, semicolon
    const nums = raw.split(/[\s,;\n]+/)
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n >= 0 && n <= 36);
    
    if (nums.length === 0) {
        showToast('Tidak ditemukan angka valid (0–36)!', 'warn');
        return;
    }

    const mode = confirm(
        `Ditemukan ${nums.length} angka valid.\n\nOK = Tambahkan ke data yang ada\nCancel = Ganti semua data`
    );

    if (mode) {
        // Append
        RESULTS.push(...nums);
    } else {
        // Replace
        RESULTS.length = 0;
        RESULTS.push(...nums);
        
        // Reset tracker on replace
        PREDICTION_TRACKER = {
            safe: { wins: 0, total: 0 },
            sektor: { wins: 0, total: 0 },
            medium: { wins: 0, total: 0 },
            agresif: { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 },
            murni: { wins: 0, total: 0, currentStreak: 0, maxWinStreak: 0, maxLoseStreak: 0 },
            history: []
        };
        saveTracker();
    }

    saveToStorage();
    hideImportModal();
    showToast(`${nums.length} angka berhasil di-import!`, 'success');
    refreshAll();
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function renderRecentNumbers() {
    const container = document.getElementById('recent-numbers');
    const last10 = RESULTS.slice(-10);
    container.innerHTML = last10.length > 0
        ? last10.map((n, i) => `<div class="recent-num ${getColorClass(n)}" style="animation-delay:${i*0.03}s">${n}</div>`).join('')
        : '<span style="color:var(--text-dim);font-size:0.85rem;">Belum ada data. Klik angka di atas untuk memulai.</span>';
}

// ===================================================================
//  ANALYSIS
// ===================================================================

function computeFrequency() {
    const freq = {};
    for (let i = 0; i <= 36; i++) freq[i] = 0;
    RESULTS.forEach(n => freq[n]++);
    return freq;
}

function getHotCold(freq, count = 5) {
    const arr = Object.entries(freq).map(([n, f]) => ({ num: +n, freq: f }));
    arr.sort((a, b) => b.freq - a.freq || a.num - b.num);
    return { hot: arr.slice(0, count), cold: arr.slice(-count).reverse() };
}

function computeColorDist() {
    let r = 0, b = 0, g = 0;
    RESULTS.forEach(n => {
        const c = getColor(n);
        if (c === 'red') r++;
        else if (c === 'black') b++;
        else g++;
    });
    return { red: r, black: b, green: g };
}

function computeOddEven() {
    let odd = 0, even = 0;
    RESULTS.forEach(n => {
        if (n === 0) return;
        n % 2 === 0 ? even++ : odd++;
    });
    return { odd, even };
}

function computeHighLow() {
    let high = 0, low = 0;
    RESULTS.forEach(n => {
        if (n === 0) return;
        n >= 19 ? high++ : low++;
    });
    return { high, low };
}

function computeDozenDist() {
    const d = { 1: 0, 2: 0, 3: 0 };
    RESULTS.forEach(n => { const dz = getDozen(n); if (dz) d[dz]++; });
    return d;
}

function computeColumnDist() {
    const c = { 1: 0, 2: 0, 3: 0 };
    RESULTS.forEach(n => { const col = getColumn(n); if (col) c[col]++; });
    return c;
}

function computeStreaks() {
    const categories = {
        'Merah': n => getColor(n) === 'red',
        'Hitam': n => getColor(n) === 'black',
        'Ganjil': n => n !== 0 && n % 2 === 1,
        'Genap': n => n !== 0 && n % 2 === 0,
        'Tinggi (19–36)': n => n >= 19,
        'Rendah (1–18)': n => n >= 1 && n <= 18,
    };

    const streakData = {};

    for (const [name, predicate] of Object.entries(categories)) {
        let maxStreak = 0, current = 0, currentStreak = 0;
        for (let i = 0; i < RESULTS.length; i++) {
            if (predicate(RESULTS[i])) {
                current++;
                if (current > maxStreak) maxStreak = current;
            } else {
                current = 0;
            }
        }
        // Current streak from the end
        currentStreak = 0;
        for (let i = RESULTS.length - 1; i >= 0; i--) {
            if (predicate(RESULTS[i])) currentStreak++;
            else break;
        }
        streakData[name] = { max: maxStreak, current: currentStreak };
    }
    return streakData;
}

// ===================================================================
//  CHART DRAWING (Pure Canvas)
// ===================================================================

function drawFreqChart(sortBy = 'number') {
    const canvas = document.getElementById('freq-chart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = (rect.width - 48) * dpr;
    canvas.height = 280 * dpr;
    canvas.style.width = (rect.width - 48) + 'px';
    canvas.style.height = '280px';
    ctx.scale(dpr, dpr);

    const W = rect.width - 48;
    const H = 280;
    const freq = computeFrequency();

    let data = Object.entries(freq).map(([n, f]) => ({ num: +n, freq: f }));
    if (sortBy === 'freq') data.sort((a, b) => b.freq - a.freq);
    else data.sort((a, b) => a.num - b.num);

    ctx.clearRect(0, 0, W, H);

    const pad = { top: 30, bottom: 35, left: 10, right: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barW = chartW / 37 - 2;
    const maxFreq = Math.max(...data.map(d => d.freq), 1);

    data.forEach((d, i) => {
        const x = pad.left + i * (chartW / 37) + 1;
        const barH = (d.freq / maxFreq) * chartH;
        const y = pad.top + chartH - barH;

        const col = getColor(d.num);
        ctx.fillStyle = col === 'red' ? '#ff2a55' : col === 'green' ? '#00e676' : '#5a6070';
        
        // Rounded top
        const r = Math.min(3, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + barW, y, r);
        ctx.arcTo(x + barW, y, x + barW, y + barH, r);
        ctx.lineTo(x + barW, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.closePath();
        ctx.fill();

        // Freq label
        if (d.freq > 0) {
            ctx.fillStyle = '#f0f2f8';
            ctx.font = '600 9px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText(d.freq, x + barW / 2, y - 5);
        }

        // Number label
        ctx.fillStyle = '#7a8ba8';
        ctx.font = '500 8px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(d.num, x + barW / 2, H - pad.bottom + 14);
    });
}

function drawDonutChart(canvasId, segments, colors, labels) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 240 * dpr;
    canvas.height = 240 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 120, cy = 120, outerR = 100, innerR = 55;
    const total = segments.reduce((a, b) => a + b, 0);
    
    if (total === 0) {
        ctx.fillStyle = '#7a8ba8';
        ctx.font = '400 14px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Belum ada data', cx, cy);
        return;
    }

    let startAngle = -Math.PI / 2;

    segments.forEach((val, i) => {
        const sliceAngle = (val / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
        ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = colors[i];
        ctx.fill();

        // % label inside slice
        const midAngle = startAngle + sliceAngle / 2;
        const labelR = (outerR + innerR) / 2;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        const pct = ((val / total) * 100).toFixed(1);
        ctx.fillStyle = '#fff';
        ctx.font = '700 11px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (val / total > 0.05) ctx.fillText(pct + '%', lx, ly);

        startAngle += sliceAngle;
    });

    // Center text
    ctx.fillStyle = '#f0f2f8';
    ctx.font = '700 22px Outfit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(total, cx, cy - 6);
    ctx.fillStyle = '#7a8ba8';
    ctx.font = '400 11px Outfit';
    ctx.fillText('TOTAL', cx, cy + 14);
}

function drawBarChart(canvasId, values, labels, colors) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width - 48;
    canvas.width = W * dpr;
    canvas.height = 200 * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = '200px';
    ctx.scale(dpr, dpr);

    const H = 200;
    const pad = { top: 30, bottom: 35, left: 10, right: 10 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;
    const barW = Math.min(80, chartW / values.length - 30);
    const maxVal = Math.max(...values, 1);
    const gap = (chartW - barW * values.length) / (values.length + 1);

    ctx.clearRect(0, 0, W, H);

    values.forEach((val, i) => {
        const x = pad.left + gap * (i + 1) + barW * i;
        const barH = (val / maxVal) * chartH;
        const y = pad.top + chartH - barH;

        ctx.fillStyle = colors[i];
        const r = Math.min(5, barW / 2);
        ctx.beginPath();
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + barW, y, r);
        ctx.arcTo(x + barW, y, x + barW, y + barH, r);
        ctx.lineTo(x + barW, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.closePath();
        ctx.fill();

        // Value
        ctx.fillStyle = '#f0f2f8';
        ctx.font = '700 14px Outfit';
        ctx.textAlign = 'center';
        ctx.fillText(val, x + barW / 2, y - 8);

        // Label
        ctx.fillStyle = '#7a8ba8';
        ctx.font = '500 11px Outfit';
        ctx.fillText(labels[i], x + barW / 2, H - pad.bottom + 16);
    });
}

// ===================================================================
//  RENDERING
// ===================================================================

function updateCounters() {
    const count = RESULTS.length;
    const el1 = document.getElementById('header-count');
    const el2 = document.getElementById('total-count');
    const el3 = document.getElementById('data-count');
    if (el1) el1.textContent = count;
    if (el2) el2.textContent = count;
    if (el3) el3.textContent = count;
}

function renderHotCold() {
    const freq = computeFrequency();
    const { hot, cold } = getHotCold(freq, 7);

    if (RESULTS.length === 0) {
        document.getElementById('hottest-num').textContent = '—';
        document.getElementById('coldest-num').textContent = '—';
        document.getElementById('hot-numbers').innerHTML = '<span style="color:var(--text-dim)">—</span>';
        document.getElementById('cold-numbers').innerHTML = '<span style="color:var(--text-dim)">—</span>';
        return;
    }

    document.getElementById('hottest-num').textContent = hot[0].num;
    document.getElementById('coldest-num').textContent = cold[0].num;

    const hotContainer = document.getElementById('hot-numbers');
    const coldContainer = document.getElementById('cold-numbers');
    hotContainer.innerHTML = '';
    coldContainer.innerHTML = '';

    hot.forEach(d => {
        const el = document.createElement('div');
        el.className = `num-badge bg-${getColor(d.num) === 'red' ? 'red' : getColor(d.num) === 'green' ? 'green' : 'black'}`;
        el.innerHTML = `${d.num}<span class="badge-count">${d.freq}×</span>`;
        hotContainer.appendChild(el);
    });

    cold.forEach(d => {
        const el = document.createElement('div');
        el.className = `num-badge bg-${getColor(d.num) === 'red' ? 'red' : getColor(d.num) === 'green' ? 'green' : 'black'}`;
        el.innerHTML = `${d.num}<span class="badge-count">${d.freq}×</span>`;
        coldContainer.appendChild(el);
    });
}

function renderColorChart() {
    const dist = computeColorDist();
    drawDonutChart('color-chart',
        [dist.red, dist.black, dist.green],
        ['#ff2a55', '#5a6070', '#00e676'],
        ['Merah', 'Hitam', 'Hijau']
    );

    const legend = document.getElementById('color-legend');
    legend.innerHTML = [
        { label: `Merah: ${dist.red}`, color: '#ff2a55' },
        { label: `Hitam: ${dist.black}`, color: '#5a6070' },
        { label: `Hijau: ${dist.green}`, color: '#00e676' },
    ].map(l => `<div class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</div>`).join('');
}

function renderHorizontalBar(containerId, items) {
    const container = document.getElementById(containerId);
    const total = items.reduce((s, it) => s + it.value, 0);
    if (total === 0) {
        container.innerHTML = '<span style="color:var(--text-dim);font-size:0.85rem;">Belum ada data.</span>';
        return;
    }
    container.innerHTML = items.map(it => {
        const pct = ((it.value / total) * 100).toFixed(1);
        return `
            <div class="h-bar-row">
                <div class="h-bar-label"><span>${it.label}</span><span>${it.value} (${pct}%)</span></div>
                <div class="h-bar-track">
                    <div class="h-bar-fill" style="width:${pct}%;background:${it.color}">${pct}%</div>
                </div>
            </div>`;
    }).join('');
}

function renderOddEven() {
    const { odd, even } = computeOddEven();
    renderHorizontalBar('oddeven-bars', [
        { label: 'Ganjil', value: odd, color: '#b388ff' },
        { label: 'Genap', value: even, color: '#448aff' },
    ]);
}

function renderHighLow() {
    const { high, low } = computeHighLow();
    renderHorizontalBar('highlow-bars', [
        { label: 'Rendah (1–18)', value: low, color: '#00e5ff' },
        { label: 'Tinggi (19–36)', value: high, color: '#ff9100' },
    ]);
}

function renderDozenChart() {
    const d = computeDozenDist();
    drawBarChart('dozen-chart',
        [d[1], d[2], d[3]],
        ['Dozen 1 (1–12)', 'Dozen 2 (13–24)', 'Dozen 3 (25–36)'],
        ['#ff9100', '#b388ff', '#00e5ff']
    );
    const legend = document.getElementById('dozen-legend');
    legend.innerHTML = [
        { label: `D1: ${d[1]}`, color: '#ff9100' },
        { label: `D2: ${d[2]}`, color: '#b388ff' },
        { label: `D3: ${d[3]}`, color: '#00e5ff' },
    ].map(l => `<div class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</div>`).join('');
}

function renderColumnChart() {
    const c = computeColumnDist();
    drawBarChart('column-chart',
        [c[1], c[2], c[3]],
        ['Kolom 1', 'Kolom 2', 'Kolom 3'],
        ['#ffc107', '#00e676', '#ff2a55']
    );
    const legend = document.getElementById('column-legend');
    legend.innerHTML = [
        { label: `K1: ${c[1]}`, color: '#ffc107' },
        { label: `K2: ${c[2]}`, color: '#00e676' },
        { label: `K3: ${c[3]}`, color: '#ff2a55' },
    ].map(l => `<div class="legend-item"><span class="legend-dot" style="background:${l.color}"></span>${l.label}</div>`).join('');
}

function renderStreaks() {
    const streaks = computeStreaks();
    const grid = document.getElementById('streak-grid');

    if (RESULTS.length === 0) {
        grid.innerHTML = '<span style="color:var(--text-dim)">Belum ada data.</span>';
        document.getElementById('current-streak').textContent = '—';
        return;
    }

    const colorMap = {
        'Merah': '#ff2a55',
        'Hitam': '#5a6070',
        'Ganjil': '#b388ff',
        'Genap': '#448aff',
        'Tinggi (19–36)': '#ff9100',
        'Rendah (1–18)': '#00e5ff',
    };

    grid.innerHTML = Object.entries(streaks).map(([name, data]) => `
        <div class="streak-item">
            <div class="streak-number" style="color:${colorMap[name]}">${data.max}</div>
            <div class="streak-info">
                <strong>${name}</strong><br>
                Streak terpanjang: ${data.max}×<br>
                Streak sekarang: ${data.current}×
            </div>
        </div>
    `).join('');

    // Current streak for quick stats
    const lastNum = RESULTS[RESULTS.length - 1];
    const lastColor = getColor(lastNum);
    const streakKey = lastColor === 'red' ? 'Merah' : lastColor === 'black' ? 'Hitam' : 'Merah';
    const currentColorStreak = streaks[streakKey] ? streaks[streakKey].current : 0;
    const currentStreakEl = document.getElementById('current-streak');
    if (currentStreakEl) {
        currentStreakEl.textContent = `${currentColorStreak}× ${lastColor === 'red' ? 'Merah' : lastColor === 'black' ? 'Hitam' : 'Hijau'}`;
    }
}

// ===================================================================
//  PREDICTION HERO RENDERING
// ===================================================================

function renderPredictionHero() {
    const predNums = document.getElementById('pred-top-numbers');
    const predBets = document.getElementById('pred-smart-bets');
    const predMethods = document.getElementById('pred-methods');
    const confBadge = document.getElementById('confidence-badge');
    const confText = document.getElementById('confidence-text');

    if (RESULTS.length < 5) {
        predNums.innerHTML = '<span style="color:var(--text-dim)">Minimal 5 angka untuk prediksi.</span>';
        predBets.innerHTML = '<span style="color:var(--text-dim)">—</span>';
        predMethods.innerHTML = '';
        confText.textContent = 'Butuh data';
        confBadge.className = 'confidence-badge low';
        return;
    }

    // Confidence
    const conf = computeConfidence();
    confText.textContent = `${conf.text} (${conf.score}%)`;
    confBadge.className = `confidence-badge ${conf.level}`;

    // Composite scores
    const scores = computeCompositeScores();
    const top8 = scores.slice(0, 8);
    const maxScore = top8[0].total;

    // Aggressive prediction (Ekor logic)
    const agresifPred = getAggressivePrediction();

    // Render top predicted numbers (replaced with aggressive numbers)
    predNums.innerHTML = agresifPred.nums.map(num => {
        return `
            <div class="pred-num-card" style="width: auto; padding: 0 5px; flex-shrink: 0;">
                <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 40px; height: 40px; font-size: 1.2rem; line-height: 40px;">${num}</div>
            </div>`;
    }).join('');

    // Ekor Warna (Black & Red)
    const predEkorHitamEl = document.getElementById('pred-ekor-hitam');
    const predEkorMerahEl = document.getElementById('pred-ekor-merah');
    const containerHitam = document.getElementById('container-ekor-hitam');
    const containerMerah = document.getElementById('container-ekor-merah');
    const titleHitam = document.getElementById('title-ekor-hitam');
    const titleMerah = document.getElementById('title-ekor-merah');
    
    if (predEkorHitamEl && predEkorMerahEl) {
        const agresifHitam = getAggressiveColorPrediction('black');
        const agresifMerah = getAggressiveColorPrediction('red');
        
        predEkorHitamEl.innerHTML = agresifHitam.nums.length > 0 ? agresifHitam.nums.map(num => {
            return `
                <div class="pred-num-card" style="width: auto; padding: 0 2px; flex-shrink: 0; margin-bottom: 5px;">
                    <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 32px; height: 32px; font-size: 1rem; line-height: 32px;">${num}</div>
                </div>`;
        }).join('') : '<span style="color:var(--text-dim); font-size: 0.9rem;">-</span>';
        
        predEkorMerahEl.innerHTML = agresifMerah.nums.length > 0 ? agresifMerah.nums.map(num => {
            return `
                <div class="pred-num-card" style="width: auto; padding: 0 2px; flex-shrink: 0; margin-bottom: 5px;">
                    <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 32px; height: 32px; font-size: 1rem; line-height: 32px;">${num}</div>
                </div>`;
        }).join('') : '<span style="color:var(--text-dim); font-size: 0.9rem;">-</span>';
        
        // Signal Detection Application
        const colorSignal = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('color') : null;
        
        // Reset styles first
        if (containerHitam && containerMerah) {
            containerHitam.style.opacity = '1';
            containerMerah.style.opacity = '1';
            containerHitam.style.boxShadow = 'none';
            containerMerah.style.boxShadow = 'none';
            titleHitam.innerHTML = '<i class="fa-solid fa-circle" style="color:#222; border:1px solid #666; border-radius:50%;"></i> Ekor Hitam';
            titleMerah.innerHTML = '<i class="fa-solid fa-circle" style="color:#ff3333;"></i> Ekor Merah';
            
            if (colorSignal) {
                if (colorSignal.target === 'red') {
                    containerHitam.style.opacity = '0.3';
                    containerMerah.style.boxShadow = '0 0 15px rgba(255, 50, 50, 0.8)';
                    titleMerah.innerHTML = '<i class="fa-solid fa-circle" style="color:#ff3333;"></i> Ekor Merah <span style="background:#ff3333; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; animation: pulseGlow 1.5s infinite;">🎯 SIGNAL BET</span>';
                } else if (colorSignal.target === 'black') {
                    containerMerah.style.opacity = '0.3';
                    containerHitam.style.boxShadow = '0 0 15px rgba(255, 255, 255, 0.5)';
                    titleHitam.innerHTML = '<i class="fa-solid fa-circle" style="color:#222; border:1px solid #666; border-radius:50%;"></i> Ekor Hitam <span style="background:#fff; color:#000; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; animation: pulseGlow 1.5s infinite;">🎯 SIGNAL BET</span>';
                }
            }
        }
    }

    // Ekor Ganjil Genap
    const predEkorGanjilEl = document.getElementById('pred-ekor-ganjil');
    const predEkorGenapEl = document.getElementById('pred-ekor-genap');
    const containerGanjil = document.getElementById('container-ekor-ganjil');
    const containerGenap = document.getElementById('container-ekor-genap');
    const titleGanjil = document.getElementById('title-ekor-ganjil');
    const titleGenap = document.getElementById('title-ekor-genap');
    
    if (predEkorGanjilEl && predEkorGenapEl) {
        const agresifGanjil = getAggressiveOddEvenPrediction('odd');
        const agresifGenap = getAggressiveOddEvenPrediction('even');
        
        predEkorGanjilEl.innerHTML = agresifGanjil.nums.length > 0 ? agresifGanjil.nums.map(num => {
            return `<div class="pred-num-card" style="width: auto; padding: 0 2px; flex-shrink: 0; margin-bottom: 5px;">
                        <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 32px; height: 32px; font-size: 1rem; line-height: 32px;">${num}</div>
                    </div>`;
        }).join('') : '<span style="color:var(--text-dim); font-size: 0.9rem;">-</span>';
        
        predEkorGenapEl.innerHTML = agresifGenap.nums.length > 0 ? agresifGenap.nums.map(num => {
            return `<div class="pred-num-card" style="width: auto; padding: 0 2px; flex-shrink: 0; margin-bottom: 5px;">
                        <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 32px; height: 32px; font-size: 1rem; line-height: 32px;">${num}</div>
                    </div>`;
        }).join('') : '<span style="color:var(--text-dim); font-size: 0.9rem;">-</span>';
        
        const oeSignal = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('oddeven') : null;
        
        if (containerGanjil && containerGenap) {
            containerGanjil.style.opacity = '1';
            containerGenap.style.opacity = '1';
            containerGanjil.style.boxShadow = 'none';
            containerGenap.style.boxShadow = 'none';
            titleGanjil.innerHTML = 'Ekor Ganjil (Odd)';
            titleGenap.innerHTML = 'Ekor Genap (Even)';
            
            if (oeSignal) {
                if (oeSignal.target === 'odd') {
                    containerGenap.style.opacity = '0.3';
                    containerGanjil.style.boxShadow = '0 0 15px rgba(0, 176, 255, 0.8)';
                    titleGanjil.innerHTML = 'Ekor Ganjil (Odd) <span style="background:#00b0ff; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; animation: pulseGlow 1.5s infinite;">🎯 SIGNAL BET</span>';
                } else if (oeSignal.target === 'even') {
                    containerGanjil.style.opacity = '0.3';
                    containerGenap.style.boxShadow = '0 0 15px rgba(255, 171, 0, 0.8)';
                    titleGenap.innerHTML = 'Ekor Genap (Even) <span style="background:#ffab00; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; animation: pulseGlow 1.5s infinite;">🎯 SIGNAL BET</span>';
                }
            }
        }
    }

    // Ekor Besar Kecil
    const predEkorBesarEl = document.getElementById('pred-ekor-besar');
    const predEkorKecilEl = document.getElementById('pred-ekor-kecil');
    const containerBesar = document.getElementById('container-ekor-besar');
    const containerKecil = document.getElementById('container-ekor-kecil');
    const titleBesar = document.getElementById('title-ekor-besar');
    const titleKecil = document.getElementById('title-ekor-kecil');
    
    if (predEkorBesarEl && predEkorKecilEl) {
        const agresifBesar = getAggressiveHighLowPrediction('high');
        const agresifKecil = getAggressiveHighLowPrediction('low');
        
        predEkorBesarEl.innerHTML = agresifBesar.nums.length > 0 ? agresifBesar.nums.map(num => {
            return `<div class="pred-num-card" style="width: auto; padding: 0 2px; flex-shrink: 0; margin-bottom: 5px;">
                        <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 32px; height: 32px; font-size: 1rem; line-height: 32px;">${num}</div>
                    </div>`;
        }).join('') : '<span style="color:var(--text-dim); font-size: 0.9rem;">-</span>';
        
        predEkorKecilEl.innerHTML = agresifKecil.nums.length > 0 ? agresifKecil.nums.map(num => {
            return `<div class="pred-num-card" style="width: auto; padding: 0 2px; flex-shrink: 0; margin-bottom: 5px;">
                        <div class="pred-num-circle ${getColorClass(num)}" style="margin: 0 auto; width: 32px; height: 32px; font-size: 1rem; line-height: 32px;">${num}</div>
                    </div>`;
        }).join('') : '<span style="color:var(--text-dim); font-size: 0.9rem;">-</span>';
        
        const hlSignal = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('highlow') : null;
        
        if (containerBesar && containerKecil) {
            containerBesar.style.opacity = '1';
            containerKecil.style.opacity = '1';
            containerBesar.style.boxShadow = 'none';
            containerKecil.style.boxShadow = 'none';
            titleBesar.innerHTML = 'Ekor Besar (19-36)';
            titleKecil.innerHTML = 'Ekor Kecil (1-18)';
            
            if (hlSignal) {
                if (hlSignal.target === 'high') {
                    containerKecil.style.opacity = '0.3';
                    containerBesar.style.boxShadow = '0 0 15px rgba(224, 64, 251, 0.8)';
                    titleBesar.innerHTML = 'Ekor Besar (19-36) <span style="background:#e040fb; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; animation: pulseGlow 1.5s infinite;">🎯 SIGNAL BET</span>';
                } else if (hlSignal.target === 'low') {
                    containerBesar.style.opacity = '0.3';
                    containerKecil.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.8)';
                    titleKecil.innerHTML = 'Ekor Kecil (1-18) <span style="background:#00e676; color:#fff; padding:2px 6px; border-radius:4px; font-size:0.7rem; margin-left:5px; animation: pulseGlow 1.5s infinite;">🎯 SIGNAL BET</span>';
                }
            }
        }
    }

    // UPDATE LIVE SIGNALS INDICATOR
    const liveSignalsEl = document.getElementById('live-signals-content');
    if (liveSignalsEl) {
        let hasSignal = false;
        let signalsHtml = '';
        
        const renderBadge = (sig) => {
            let color = '#fff';
            let icon = '<i class="fa-solid fa-circle"></i>';
            
            // Handle array targets (like Dozen) safely
            let text = Array.isArray(sig.target) ? 'DOZEN ' + sig.target.join(' & ') : String(sig.target).toUpperCase();
            
            if (sig.target === 'red') { color = '#ff3333'; text = 'MERAH'; icon = `<i class="fa-solid fa-circle" style="color:#ff3333;"></i>`; }
            if (sig.target === 'black') { color = '#fff'; text = 'HITAM'; icon = `<i class="fa-solid fa-circle" style="color:#222; border:1px solid #666; border-radius:50%;"></i>`; }
            if (sig.target === 'odd') { color = '#00b0ff'; text = 'GANJIL'; icon = `<i class="fa-solid fa-circle" style="color:#00b0ff;"></i>`; }
            if (sig.target === 'even') { color = '#ffab00'; text = 'GENAP'; icon = `<i class="fa-solid fa-circle" style="color:#ffab00;"></i>`; }
            if (sig.target === 'high') { color = '#e040fb'; text = 'BESAR'; icon = `<i class="fa-solid fa-circle" style="color:#e040fb;"></i>`; }
            if (sig.target === 'low') { color = '#00e676'; text = 'KECIL'; icon = `<i class="fa-solid fa-circle" style="color:#00e676;"></i>`; }
            if (Array.isArray(sig.target)) { color = '#00e676'; icon = `<i class="fa-solid fa-layer-group" style="color:#00e676;"></i>`; }
            
            return `<div style="background: rgba(255,255,255,0.05); border: 1px solid ${color}; padding: 4px 10px; border-radius: 6px; color: ${color}; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 10px ${color}40; animation: pulseGlow 2s infinite;">
                ${icon} ${text}
            </div>`;
        };

        const currentWarnaSig = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('color') : null;
        const currentOeSig = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('oddeven') : null;
        const currentHlSig = typeof checkBlockScannerSignal === 'function' ? checkBlockScannerSignal('highlow') : null;
        const currentDozenSig = typeof checkDozenSignal === 'function' ? checkDozenSignal() : null;

        if (currentWarnaSig) { signalsHtml += renderBadge(currentWarnaSig); hasSignal = true; }
        if (currentOeSig) { signalsHtml += renderBadge(currentOeSig); hasSignal = true; }
        if (currentHlSig) { signalsHtml += renderBadge(currentHlSig); hasSignal = true; }
        if (currentDozenSig) { 
            let badgeHtml = `<div style="background: rgba(255,255,255,0.05); border: 1px solid #00e676; padding: 4px 10px; border-radius: 6px; color: #00e676; font-weight: bold; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; box-shadow: 0 0 10px #00e67640; animation: pulseGlow 2s infinite;">
                <i class="fa-solid fa-layer-group"></i> DOZEN ${currentDozenSig.target.join(' & ')}
            </div>`;
            signalsHtml += badgeHtml;
            hasSignal = true;
        }

        if (hasSignal) {
            liveSignalsEl.innerHTML = signalsHtml;
        } else {
            liveSignalsEl.innerHTML = `<span class="input-hint">Belum ada sinyal aktif.</span>`;
        }
    }

    // UPDATE ANGKA JITU (HEDGE & STRIKE)
    const angkaJituEl = document.getElementById('angka-jitu-content');
    if (angkaJituEl && typeof getAggressivePrediction === 'function' && typeof checkDozenSignal === 'function') {
        const dSig = checkDozenSignal();
        const aPred = getAggressivePrediction();
        
        if (dSig && aPred && aPred.nums && aPred.nums.length > 0) {
            // Find intersection
            const jituNums = aPred.nums.filter(n => {
                if (n === 0) return false;
                return dSig.target.includes(getDozen(n));
            });
            
            if (jituNums.length > 0) {
                angkaJituEl.innerHTML = jituNums.map(num => `
                    <div style="background: rgba(224, 64, 251, 0.1); border: 1px dashed #e040fb; border-radius: 50%; padding: 3px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(224,64,251,0.4); animation: pulseGlow 1.5s infinite;">
                        <div class="pred-num-circle ${getColorClass(num)}" style="width: 36px; height: 36px; font-size: 1.1rem; line-height: 36px; margin: 0; box-shadow: none;">${num}</div>
                    </div>
                `).join('') + `<div style="font-size:0.8rem; color:var(--text-dim); margin-left:10px;">${jituNums.length} Angka VIP (Ekor ${aPred.lastDigit} & Dozen ${dSig.target.join(',')})</div>`;
            } else {
                angkaJituEl.innerHTML = `<span class="input-hint">Tidak ada angka ekor yang masuk ke dalam Dozen target saat ini.</span>`;
            }
        } else {
            angkaJituEl.innerHTML = `<span class="input-hint">Menunggu persilangan sinyal Dozen & Ekor aktif...</span>`;
        }
    }
    
    // UPDATE LAWAN SIGNAL (SINGLE DOZEN VIP)
    const lawanSignalEl = document.getElementById('lawan-signal-content');
    if (lawanSignalEl && typeof getAggressivePrediction === 'function' && typeof checkDozenSignal === 'function') {
        const dSig = checkDozenSignal();
        const aPred = getAggressivePrediction();
        
        if (dSig && aPred && aPred.nums && aPred.nums.length > 0) {
            const lawanDozens = [1, 2, 3].filter(d => !dSig.target.includes(d));
            
            // Find intersection for lawan
            const lawanJituNums = aPred.nums.filter(n => {
                if (n === 0) return false;
                return lawanDozens.includes(getDozen(n));
            });
            
            if (lawanJituNums.length > 0) {
                // Calculate frequency for Top 3 Hot Numbers
                let freqs = {};
                lawanJituNums.forEach(n => freqs[n] = 0);
                RESULTS.forEach(n => { if (freqs[n] !== undefined) freqs[n]++; });
                let sortedLawan = [...lawanJituNums].sort((a, b) => freqs[b] - freqs[a]);
                let top3 = sortedLawan.slice(0, 3);
                
                let trapWarning = lawanDozens.includes(2) && lawanDozens.length === 1
                    ? `<div style="margin-top:5px; font-size:0.75rem; color:#ffab00; font-weight:bold; width:100%;"><i class="fa-solid fa-triangle-exclamation"></i> ⚠️ RISKAN: Zona Jebakan Dozen 2</div>` 
                    : (lawanDozens.length === 1 ? `<div style="margin-top:5px; font-size:0.75rem; color:#00e676; font-weight:bold; width:100%;"><i class="fa-solid fa-fire"></i> 🔥 TREND MURNI (Aman)</div>` : '');

                lawanSignalEl.innerHTML = lawanJituNums.map(num => {
                    let isHot = top3.includes(num);
                    let borderStyle = isHot ? 'border: 2px solid gold; box-shadow: 0 0 15px gold;' : 'border: 1px dashed #ff5252; box-shadow: 0 0 15px rgba(255,82,82,0.4);';
                    let star = isHot ? '<i class="fa-solid fa-star" style="position:absolute; top:-8px; right:-8px; color:gold; font-size:0.8rem; text-shadow: 0 0 5px black;"></i>' : '';
                    
                    return `
                    <div style="position:relative; background: rgba(255, 82, 82, 0.1); border-radius: 50%; padding: 3px; display: flex; align-items: center; justify-content: center; animation: pulseGlow 1.5s infinite; ${borderStyle}">
                        ${star}
                        <div class="pred-num-circle ${getColorClass(num)}" style="width: 36px; height: 36px; font-size: 1.1rem; line-height: 36px; margin: 0; box-shadow: none;">${num}</div>
                    </div>
                `}).join('') + `<div style="font-size:0.8rem; color:var(--text-dim); margin-left:10px;">${lawanJituNums.length} Angka VIP (Lawan Dozen ${lawanDozens.join(',')})</div>` + trapWarning;
            } else {
                lawanSignalEl.innerHTML = `<span class="input-hint">Tidak ada angka ekor yang masuk ke Single Dozen Lawan.</span>`;
            }
        } else {
            lawanSignalEl.innerHTML = `<span class="input-hint">Menunggu persilangan Lawan Dozen & Ekor...</span>`;
        }
    }

    // UPDATE TARGET SINYAL MURNI (OUTSIDE BETS)
    const murniWarnaEl = document.getElementById('container-murni-warna');
    const murniWarnaTarget = document.getElementById('murni-target-warna');
    const murniOeEl = document.getElementById('container-murni-oe');
    const murniOeTarget = document.getElementById('murni-target-oe');
    const murniHlEl = document.getElementById('container-murni-hl');
    const murniHlTarget = document.getElementById('murni-target-hl');
    const murniDozenEl = document.getElementById('container-murni-dozen');
    const murniDozenTarget = document.getElementById('murni-target-dozen');
    const murniEmptyEl = document.getElementById('murni-empty-state');
    
    let anyMurni = false;

    if (murniWarnaEl) {
        if (typeof checkBlockScannerSignal === 'function') {
            const sig = checkBlockScannerSignal('color');
            if (sig) {
                murniWarnaEl.style.display = 'block';
                anyMurni = true;
                if (sig.target === 'red') {
                    murniWarnaEl.style.background = 'rgba(255, 0, 0, 0.1)';
                    murniWarnaEl.style.border = '1px solid rgba(255,50,50,0.5)';
                    murniWarnaTarget.style.color = '#ff3333';
                    murniWarnaTarget.innerHTML = '<i class="fa-solid fa-circle" style="color:#ff3333;"></i> PASANG MERAH (18 Angka)';
                } else {
                    murniWarnaEl.style.background = 'rgba(0, 0, 0, 0.4)';
                    murniWarnaEl.style.border = '1px solid rgba(255,255,255,0.3)';
                    murniWarnaTarget.style.color = '#fff';
                    murniWarnaTarget.innerHTML = '<i class="fa-solid fa-circle" style="color:#222; border:1px solid #666; border-radius:50%;"></i> PASANG HITAM (18 Angka)';
                }
            } else {
                murniWarnaEl.style.display = 'none';
            }
        }
    }

    if (murniOeEl) {
        if (typeof checkBlockScannerSignal === 'function') {
            const sig = checkBlockScannerSignal('oddeven');
            if (sig) {
                murniOeEl.style.display = 'block';
                anyMurni = true;
                if (sig.target === 'odd') {
                    murniOeEl.style.background = 'rgba(0, 176, 255, 0.1)';
                    murniOeEl.style.border = '1px solid rgba(0,176,255,0.5)';
                    murniOeTarget.style.color = '#00b0ff';
                    murniOeTarget.innerHTML = '<i class="fa-solid fa-circle" style="color:#00b0ff;"></i> PASANG GANJIL (18 Angka)';
                } else {
                    murniOeEl.style.background = 'rgba(255, 171, 0, 0.1)';
                    murniOeEl.style.border = '1px solid rgba(255,171,0,0.5)';
                    murniOeTarget.style.color = '#ffab00';
                    murniOeTarget.innerHTML = '<i class="fa-solid fa-circle" style="color:#ffab00;"></i> PASANG GENAP (18 Angka)';
                }
            } else {
                murniOeEl.style.display = 'none';
            }
        }
    }

    if (murniHlEl) {
        if (typeof checkBlockScannerSignal === 'function') {
            const sig = checkBlockScannerSignal('highlow');
            if (sig) {
                murniHlEl.style.display = 'block';
                anyMurni = true;
                if (sig.target === 'high') {
                    murniHlEl.style.background = 'rgba(224, 64, 251, 0.1)';
                    murniHlEl.style.border = '1px solid rgba(224,64,251,0.5)';
                    murniHlTarget.style.color = '#e040fb';
                    murniHlTarget.innerHTML = '<i class="fa-solid fa-circle" style="color:#e040fb;"></i> PASANG BESAR (19-36)';
                } else {
                    murniHlEl.style.background = 'rgba(0, 230, 118, 0.1)';
                    murniHlEl.style.border = '1px solid rgba(0,230,118,0.5)';
                    murniHlTarget.style.color = '#00e676';
                    murniHlTarget.innerHTML = '<i class="fa-solid fa-circle" style="color:#00e676;"></i> PASANG KECIL (1-18)';
                }
            } else {
                murniHlEl.style.display = 'none';
            }
        }
    }

    if (murniDozenEl) {
        if (typeof checkDozenSignal === 'function') {
            const sig = checkDozenSignal();
            if (sig) {
                murniDozenEl.style.display = 'block';
                anyMurni = true;
                murniDozenEl.style.background = 'rgba(0, 230, 118, 0.1)';
                murniDozenEl.style.border = '1px solid rgba(0,230,118,0.5)';
                murniDozenTarget.style.color = '#00e676';
                murniDozenTarget.innerHTML = `<i class="fa-solid fa-layer-group" style="color:#00e676;"></i> PASANG DOZEN ${sig.target.join(' & ')}<div style="font-size:0.75rem; font-weight:normal; opacity:0.8; margin-top:4px;">${sig.pattern}</div>`;
            } else {
                murniDozenEl.style.display = 'none';
            }
        }
    }

    if (murniEmptyEl) {
        if (anyMurni) murniEmptyEl.style.display = 'none';
        else murniEmptyEl.style.display = 'block';
    }


    // Smart bets section
    const colorDist = computeColorDist();
    const { odd, even } = computeOddEven();
    const { high, low } = computeHighLow();
    const dozenDist = computeDozenDist();
    const sectorDist = computeSectorDist();
    const streaks = computeStreaks();
    const total = RESULTS.length;

    // Determine best even-money bet based on multiple factors
    const domColor = colorDist.red > colorDist.black ? 'Merah' : 'Hitam';
    const domColorPct = (Math.max(colorDist.red, colorDist.black) / total * 100).toFixed(1);
    
    // Determine if we should bet with or against streak
    const lastColor = getColor(RESULTS[RESULTS.length - 1]);
    const colorStreakKey = lastColor === 'red' ? 'Merah' : 'Hitam';
    const currentStreak = streaks[colorStreakKey] ? streaks[colorStreakKey].current : 0;
    
    // Double Dozen / Double Column
    const dozenArr = Object.entries(dozenDist).sort((a, b) => b[1] - a[1]);
    const bestDozen1 = parseInt(dozenArr[0][0]);
    const bestDozen2 = parseInt(dozenArr[1][0]);
    const dozenHits = dozenArr[0][1] + dozenArr[1][1];

    const colDist = computeColumnDist();
    const colArr = Object.entries(colDist).sort((a, b) => b[1] - a[1]);
    const bestCol1 = parseInt(colArr[0][0]);
    const bestCol2 = parseInt(colArr[1][0]);
    const colHits = colArr[0][1] + colArr[1][1];

    let mediumName, mediumDetail, mediumPct;
    if (dozenHits >= colHits) {
        mediumName = `Dozen ${bestDozen1} & ${bestDozen2}`;
        mediumDetail = `${dozenHits}× muncul — cover 24 angka (2:1)`;
        mediumPct = (dozenHits / total * 100).toFixed(1) + '%';
    } else {
        mediumName = `Kolom ${bestCol1} & ${bestCol2}`;
        mediumDetail = `${colHits}× muncul — cover 24 angka (2:1)`;
        mediumPct = (colHits / total * 100).toFixed(1) + '%';
    }
    
    // Best sector
    const sectors = [
        { name: 'Voisins du Zéro', count: sectorDist.voisins, pct: sectorDist.voisinsPct, exp: 45.9 },
        { name: 'Tiers du Cylindre', count: sectorDist.tiers, pct: sectorDist.tiersPct, exp: 32.4 },
        { name: 'Orphelins', count: sectorDist.orphelins, pct: sectorDist.orphelinsPct, exp: 21.6 }
    ];
    const hottestSector = sectors.reduce((a, b) => (a.pct - a.exp > b.pct - b.exp) ? a : b);
    
    // (agresifPred already defined above)

    const bets = [
        {
            icon: 'safe', fa: 'fa-shield',
            name: `Pasang ${domColor}`,
            detail: `Dominan ${domColorPct}% dari ${total} spin`,
            pct: domColorPct + '%'
        },
        {
            icon: 'sector', fa: 'fa-circle-notch',
            name: `Sektor: ${hottestSector.name}`,
            detail: `${hottestSector.pct.toFixed(1)}% vs expected ${hottestSector.exp}%`,
            pct: (hottestSector.pct - hottestSector.exp > 0 ? '+' : '') + (hottestSector.pct - hottestSector.exp).toFixed(1) + '%'
        },
        {
            icon: 'medium', fa: 'fa-layer-group',
            name: mediumName,
            detail: mediumDetail,
            pct: mediumPct
        },
        {
            icon: 'hot', fa: 'fa-fire',
            name: agresifPred.label,
            detail: `Mencakup 4 tetangga dari semua angka ber-ekor ${agresifPred.lastDigit}`,
            pct: `${agresifPred.nums.length} angka`
        }
    ];

    // Add streak-based advice
    if (currentStreak >= 3) {
        bets.push({
            icon: 'medium', fa: 'fa-rotate',
            name: `Anti-streak: Lawan ${colorStreakKey}`,
            detail: `Streak ${currentStreak}× — peluang reversal naik`,
            pct: `${currentStreak}× streak`
        });
    }

    predBets.innerHTML = bets.map(b => `
        <div class="smart-bet">
            <div class="smart-bet-icon ${b.icon}"><i class="fa-solid ${b.fa}"></i></div>
            <div class="smart-bet-info">
                <div class="smart-bet-name">${b.name}</div>
                <div class="smart-bet-detail">${b.detail}</div>
            </div>
            <div class="smart-bet-pct">${b.pct}</div>
        </div>
    `).join('');

    // Method tags
    predMethods.innerHTML = [
        { icon: 'fa-chart-simple', label: 'Raw Frequency (15%)' },
        { icon: 'fa-clock', label: 'Recency Weight (20%)' },
        { icon: 'fa-hourglass', label: 'Gap/Overdue (20%)' },
        { icon: 'fa-route', label: 'Transition Matrix (20%)' },
        { icon: 'fa-circle-notch', label: 'Wheel Neighbors (10%)' },
        { icon: 'fa-bolt', label: 'Momentum (15%)' }
    ].map(m => `<div class="method-tag"><i class="fa-solid ${m.icon}"></i> ${m.label}</div>`).join('');
}

// ===================================================================
//  WHEEL SECTOR & GAP ANALYSIS RENDERING
// ===================================================================

function renderSectorAnalysis() {
    const container = document.getElementById('sector-bars');
    if (RESULTS.length === 0) {
        container.innerHTML = '<span style="color:var(--text-dim)">Belum ada data.</span>';
        return;
    }
    const s = computeSectorDist();
    const items = [
        { label: `Voisins du Zéro (17 angka)`, value: s.voisins, color: '#448aff', expected: s.voisinsExpected },
        { label: `Tiers du Cylindre (12 angka)`, value: s.tiers, color: '#b388ff', expected: s.tiersExpected },
        { label: `Orphelins (8 angka)`, value: s.orphelins, color: '#ff9100', expected: s.orphelinsExpected }
    ];
    const total = s.total;
    container.innerHTML = items.map(it => {
        const pct = total > 0 ? ((it.value / total) * 100).toFixed(1) : '0.0';
        const diff = (parseFloat(pct) - it.expected).toFixed(1);
        const diffSign = diff > 0 ? '+' : '';
        const diffColor = diff > 2 ? 'var(--green)' : diff < -2 ? 'var(--red)' : 'var(--text-dim)';
        return `
            <div class="h-bar-row">
                <div class="h-bar-label">
                    <span>${it.label}</span>
                    <span>${it.value} (${pct}%) <span style="color:${diffColor};font-weight:700;">${diffSign}${diff}%</span></span>
                </div>
                <div class="h-bar-track">
                    <div class="h-bar-fill" style="width:${pct}%;background:${it.color}">${pct}%</div>
                </div>
            </div>`;
    }).join('');
}

function renderGapAnalysis() {
    const container = document.getElementById('gap-numbers');
    if (RESULTS.length < 5) {
        container.innerHTML = '<span style="color:var(--text-dim)">Minimal 5 data.</span>';
        return;
    }
    const gaps = computeGapAnalysis();
    const sorted = Object.entries(gaps)
        .map(([n, g]) => ({ num: +n, gap: g }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 7);
    
    container.innerHTML = sorted.map(d => {
        const col = getColor(d.num);
        const cls = col === 'red' ? 'bg-red' : col === 'green' ? 'bg-green' : 'bg-black';
        return `
            <div class="num-badge ${cls}" title="Terakhir muncul ${d.gap} spin lalu">
                ${d.num}<span class="badge-count">${d.gap} spin</span>
            </div>`;
    }).join('');
}

// ===================================================================
//  AI RECOMMENDATIONS (UPGRADED — 5 strategies)
// ===================================================================

function renderAIRecommendations() {
    const container = document.getElementById('ai-recommendations');

    if (RESULTS.length < 10) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:2rem;">
                <i class="fa-solid fa-brain" style="font-size:2rem;margin-bottom:0.5rem;display:block;color:var(--neon)"></i>
                Minimal 10 angka untuk menghasilkan strategi akurat.<br>
                Saat ini: <strong>${RESULTS.length}</strong> angka.
            </div>`;
        return;
    }

    const freq = computeFrequency();
    const { hot } = getHotCold(freq, 5);
    const colorDist = computeColorDist();
    const { odd, even } = computeOddEven();
    const { high, low } = computeHighLow();
    const dozenDist = computeDozenDist();
    const columnDist = computeColumnDist();
    const streaks = computeStreaks();
    const gaps = computeGapAnalysis();
    const sectorDist = computeSectorDist();
    const chi = computeChiSquare();
    const scores = computeCompositeScores();
    const total = RESULTS.length;
    const totalNoZero = total - (freq[0] || 0);

    const domColor = colorDist.red > colorDist.black ? 'Merah' : 'Hitam';
    const domColorPct = (Math.max(colorDist.red, colorDist.black) / total * 100).toFixed(1);
    const domOE = odd > even ? 'Ganjil' : 'Genap';
    const domOEPct = totalNoZero > 0 ? (Math.max(odd, even) / totalNoZero * 100).toFixed(1) : '0';
    const domHL = high > low ? 'Tinggi (19–36)' : 'Rendah (1–18)';
    const domHLPct = totalNoZero > 0 ? (Math.max(high, low) / totalNoZero * 100).toFixed(1) : '0';

    const dozenArr = Object.entries(dozenDist).sort((a, b) => b[1] - a[1]);
    const bestDozen1 = parseInt(dozenArr[0][0]);
    const bestDozen2 = parseInt(dozenArr[1][0]);
    const dozenHits = dozenArr[0][1] + dozenArr[1][1];

    const colArr = Object.entries(columnDist).sort((a, b) => b[1] - a[1]);
    const bestCol1 = parseInt(colArr[0][0]);
    const bestCol2 = parseInt(colArr[1][0]);
    const colHits = colArr[0][1] + colArr[1][1];

    let recMediumTitle, recMediumDetail, recMediumTags;
    if (dozenHits >= colHits) {
        recMediumTitle = `Coverage ~65%: Dozen ${bestDozen1} & Dozen ${bestDozen2}`;
        recMediumDetail = `
            <strong>Dozen ${bestDozen1}</strong>: ${dozenArr[0][1]}× (${(dozenArr[0][1]/totalNoZero*100).toFixed(1)}%)<br>
            <strong>Dozen ${bestDozen2}</strong>: ${dozenArr[1][1]}× (${(dozenArr[1][1]/totalNoZero*100).toFixed(1)}%)<br><br>
            Pasang Double Dozen — cover 24 angka. Win rate tinggi, net profit 0.5x total modal.
        `;
        recMediumTags = `<span class="rec-bet-tag">Dozen ${bestDozen1}</span> <span class="rec-bet-tag">Dozen ${bestDozen2}</span>`;
    } else {
        recMediumTitle = `Coverage ~65%: Kolom ${bestCol1} & Kolom ${bestCol2}`;
        recMediumDetail = `
            <strong>Kolom ${bestCol1}</strong>: ${colArr[0][1]}× (${(colArr[0][1]/totalNoZero*100).toFixed(1)}%)<br>
            <strong>Kolom ${bestCol2}</strong>: ${colArr[1][1]}× (${(colArr[1][1]/totalNoZero*100).toFixed(1)}%)<br><br>
            Pasang Double Kolom — cover 24 angka. Win rate tinggi, net profit 0.5x total modal.
        `;
        recMediumTags = `<span class="rec-bet-tag">Kolom ${bestCol1}</span> <span class="rec-bet-tag">Kolom ${bestCol2}</span>`;
    }

    // Top overdue numbers
    const overdueNums = Object.entries(gaps)
        .map(([n, g]) => ({ num: +n, gap: g }))
        .sort((a, b) => b.gap - a.gap)
        .slice(0, 5);

    // Wheel neighbor cluster (find hottest cluster of 5 consecutive wheel numbers)
    let bestClusterStart = 0, bestClusterScore = 0;
    for (let s = 0; s < WHEEL_SEQ.length; s++) {
        let clusterScore = 0;
        for (let o = 0; o < 5; o++) {
            const idx = (s + o) % WHEEL_SEQ.length;
            clusterScore += freq[WHEEL_SEQ[idx]] || 0;
        }
        if (clusterScore > bestClusterScore) {
            bestClusterScore = clusterScore;
            bestClusterStart = s;
        }
    }
    const hotCluster = [];
    for (let o = 0; o < 5; o++) {
        hotCluster.push(WHEEL_SEQ[(bestClusterStart + o) % WHEEL_SEQ.length]);
    }

    // Chi-square info
    const biasText = chi.isBiased 
        ? '⚠️ Chi-Square mendeteksi <strong>bias signifikan</strong> — distribusi TIDAK uniform. Ada peluang!'
        : chi.maybeBiased 
            ? '⚡ Chi-Square mendeteksi <strong>kemungkinan bias</strong> (p < 0.10).'
            : '✓ Distribusi mendekati uniform — belum ada bias signifikan terdeteksi.';

    const agresifPred = getAggressivePrediction();
    const agresifHitam = getAggressiveColorPrediction('black');
    const agresifMerah = getAggressiveColorPrediction('red');

    container.innerHTML = `
        <div class="rec-card safe">
            <div class="rec-risk">🛡️ Low Risk — Even Money</div>
            <div class="rec-title">Taruhan Aman: Cover Dominan</div>
            <div class="rec-detail">
                Dari ${total} spin, tren dominan:<br>
                <strong>${domColor}</strong> ${domColorPct}% &bull;
                <strong>${domOE}</strong> ${domOEPct}% &bull;
                <strong>${domHL}</strong> ${domHLPct}%<br><br>
                Pasang <strong>${domColor}</strong> + <strong>${domOE}</strong> bersamaan. Jika keduanya hit, profit 2×. Jika satu hit, break even.
            </div>
            <div class="rec-bets">
                <span class="rec-bet-tag">${domColor}</span>
                <span class="rec-bet-tag">${domOE}</span>
                <span class="rec-bet-tag">${domHL}</span>
            </div>
        </div>

        <div class="rec-card medium">
            <div class="rec-risk">⚡ Medium Risk — Double Dozen/Kolom</div>
            <div class="rec-title">${recMediumTitle}</div>
            <div class="rec-detail">
                ${recMediumDetail}
            </div>
            <div class="rec-bets">
                ${recMediumTags}
            </div>
        </div>

        <div class="rec-card aggressive">
            <div class="rec-risk">🔥 Pola Ekor (Last Digit)</div>
            <div class="rec-title">Ekor ${agresifPred.lastDigit}: Area Tabel Layout</div>
            <div class="rec-detail">
                Angka terakhir adalah <strong>${agresifPred.lastNum}</strong> (Ekor ${agresifPred.lastDigit}).<br>
                Mencakup 3x3 blok di sekeliling semua angka yang berakhiran ${agresifPred.lastDigit} pada tabel layout roulette.<br><br>
                Spread bet pada <strong>${agresifPred.nums.length} angka</strong>. Probabilitas ~${(agresifPred.nums.length/37*100).toFixed(1)}%.
            </div>
            <div class="rec-bets">
                ${agresifPred.nums.map(n => `<span class="rec-bet-tag">${n}</span>`).join('')}
            </div>
        </div>

        <div class="rec-card aggressive">
            <div class="rec-risk" style="color:#00e676;">🔥 Pola Ekor Warna (Hitam / Merah)</div>
            <div class="rec-title">Ekor ${agresifPred.lastDigit} (Disaring Berdasarkan Warna)</div>
            <div class="rec-detail">
                Mirip dengan Pola Ekor biasa, namun menyaring tetangga tabel terdekat yang <strong>hanya berwarna Merah</strong> atau <strong>hanya berwarna Hitam</strong>.<br><br>
                <strong>Hitam (${agresifHitam.nums.length} angka):</strong> Probabilitas ~${(agresifHitam.nums.length/37*100).toFixed(1)}%<br>
                <strong>Merah (${agresifMerah.nums.length} angka):</strong> Probabilitas ~${(agresifMerah.nums.length/37*100).toFixed(1)}%
            </div>
            <div class="rec-bets">
                <div style="font-size:0.85rem; color:#aaa; margin-bottom: 5px;">Hanya Hitam:</div>
                ${agresifHitam.nums.map(n => `<span class="rec-bet-tag" style="background:#222; border-color:#666; color:#fff;">${n}</span>`).join('')}
                <div style="font-size:0.85rem; color:#aaa; margin-top: 8px; margin-bottom: 5px;">Hanya Merah:</div>
                ${agresifMerah.nums.map(n => `<span class="rec-bet-tag" style="background:#421111; border-color:#ff3333; color:#ff5252;">${n}</span>`).join('')}
            </div>
        </div>

        <div class="rec-card aggressive">
            <div class="rec-risk" style="color:#00b0ff;">🔥 Pola Ekor Ganjil Genap</div>
            <div class="rec-title">Ekor ${agresifPred.lastDigit} (Disaring Ganjil/Genap)</div>
            <div class="rec-detail">
                Menyaring tetangga tabel terdekat yang <strong>hanya Ganjil</strong> atau <strong>hanya Genap</strong>.
            </div>
        </div>

        <div class="rec-card aggressive">
            <div class="rec-risk" style="color:#e040fb;">🔥 Pola Ekor Besar Kecil</div>
            <div class="rec-title">Ekor ${agresifPred.lastDigit} (Disaring Besar/Kecil)</div>
            <div class="rec-detail">
                Menyaring tetangga tabel terdekat yang <strong>hanya Besar (19-36)</strong> atau <strong>hanya Kecil (1-18)</strong>.
            </div>
        </div>

        <div class="rec-card medium">
            <div class="rec-risk">🎯 Overdue — Gap Strategy</div>
            <div class="rec-title">Angka Tertunda: Lama Tidak Muncul</div>
            <div class="rec-detail">
                Angka yang paling lama tidak muncul (kandidat "overdue"):<br><br>
                ${overdueNums.map(d => `<strong>${d.num}</strong> (${d.gap} spin lalu)`).join(' &bull; ')}<br><br>
                Teori: semakin lama tidak muncul, distribusi cenderung "mengejar". Bayaran 35:1.
            </div>
            <div class="rec-bets">
                ${overdueNums.map(d => `<span class="rec-bet-tag">${d.num}</span>`).join('')}
            </div>
        </div>

        <div class="rec-card aggressive">
            <div class="rec-risk">🌀 Wheel — Neighbor Cluster</div>
            <div class="rec-title">Hot Zone di Roda: ${hotCluster.join(', ')}</div>
            <div class="rec-detail">
                5 angka bersebelahan di roda fisik roulette dengan frekuensi tertinggi 
                (total ${bestClusterScore}× dari ${total} spin).<br><br>
                Ini bisa mengindikasikan dealer signature atau bias roda. Pasang sebagai "voisins" bet.
            </div>
            <div class="rec-bets">
                ${hotCluster.map(n => `<span class="rec-bet-tag">${n}</span>`).join('')}
            </div>
        </div>

        <div class="rec-card safe" style="grid-column:1/-1;">
            <div class="rec-risk">📊 Chi-Square Test</div>
            <div class="rec-title">Uji Bias Statistik (χ² = ${chi.value.toFixed(2)})</div>
            <div class="rec-detail">
                ${biasText}<br>
                Expected per angka: ${chi.expected.toFixed(1)}× | Critical value (α=0.05, df=36): 50.998
            </div>
        </div>
    `;
}

function renderDataGrid() {
    const grid = document.getElementById('data-grid');
    if (RESULTS.length === 0) {
        grid.innerHTML = '<span style="color:var(--text-dim)">Belum ada data.</span>';
        return;
    }
    grid.innerHTML = RESULTS.map(n =>
        `<div class="data-num ${getColorClass(n)}">${n}</div>`
    ).join('');
}

function renderTracker() {
    const safeRate = PREDICTION_TRACKER.safe.total > 0 
        ? Math.round(PREDICTION_TRACKER.safe.wins / PREDICTION_TRACKER.safe.total * 100) : 0;
    const sektorRate = PREDICTION_TRACKER.sektor.total > 0
        ? Math.round(PREDICTION_TRACKER.sektor.wins / PREDICTION_TRACKER.sektor.total * 100) : 0;
    const mediumRate = PREDICTION_TRACKER.medium.total > 0 
        ? Math.round(PREDICTION_TRACKER.medium.wins / PREDICTION_TRACKER.medium.total * 100) : 0;
    const agresifRate = PREDICTION_TRACKER.agresif.total > 0 
        ? Math.round(PREDICTION_TRACKER.agresif.wins / PREDICTION_TRACKER.agresif.total * 100) : 0;
        
    document.getElementById('track-medium-rate').textContent = mediumRate + '%';
    document.getElementById('track-agresif-rate').textContent = agresifRate + '%';
    
    // Add colors based on rates
    document.getElementById('track-medium-rate').style.color = mediumRate >= 60 ? 'var(--green)' : 'var(--red)';
    document.getElementById('track-agresif-rate').style.color = agresifRate >= 10 ? 'var(--green)' : 'var(--red)';
    
    const tbody = document.getElementById('tracker-log-body');
    if (PREDICTION_TRACKER.history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-dim);">Belum ada histori prediksi (masukkan angka untuk memulai).</td></tr>`;
        return;
    }
    
    tbody.innerHTML = PREDICTION_TRACKER.history.slice(0, 10).map(log => {
        const agresifNumsHtml = log.agresifNums ? `<div style="font-size:0.75rem; color:var(--text-dim); margin-top:4px;">[${log.agresifNums.join(', ')}]</div>` : '';
        return `
            <tr class="track-row">
                <td>#${log.spinIndex}</td>
                <td><div class="track-num-badge ${getColorClass(log.actualNumber)}">${log.actualNumber}</div></td>
                <td>
                    <div class="track-result">
                        ${log.mediumWin ? '<i class="fa-solid fa-circle-check track-win"></i>' : '<i class="fa-solid fa-circle-xmark track-loss"></i>'}
                        <span style="color:${log.mediumWin ? 'var(--text)' : 'var(--text-dim)'}">${log.mediumLabel}</span>
                    </div>
                </td>
                <td>
                    <div class="track-result">
                        ${log.agresifWin ? '<i class="fa-solid fa-circle-check track-win"></i>' : '<i class="fa-solid fa-circle-xmark track-loss"></i>'}
                        <span style="color:${log.agresifWin ? 'var(--text)' : 'var(--text-dim)'}">${log.agresifLabel}</span>
                    </div>
                    ${agresifNumsHtml}
                </td>
            </tr>
        `;
    }).join('');
}

function renderMiniTracker() {
    const miniTracker = document.getElementById('mini-tracker-content');
    if (!miniTracker) return;

    if (PREDICTION_TRACKER.history.length === 0) {
        miniTracker.innerHTML = `<span class="input-hint">Belum ada histori (Masukkan angka).</span>`;
        return;
    }

    // Get last 25 history (recent ones at index 0)
    const recent = PREDICTION_TRACKER.history.slice(0, 25);
    
    const renderTrack = (sig) => {
        if (!sig) return `<span style="color:var(--text-dim);">-</span>`;
        let color = '#fff';
        if (sig.target === 'red') color = '#ff3333';
        if (sig.target === 'black') color = '#222';
        if (sig.target === 'odd') color = '#00b0ff';
        if (sig.target === 'even') color = '#ffab00';
        if (sig.target === 'high') color = '#e040fb';
        if (sig.target === 'low') color = '#00e676';
        if (Array.isArray(sig.target)) color = '#00e676';
        
        const icon = sig.isWin ? `<i class="fa-solid fa-check"></i>` : `<i class="fa-solid fa-xmark"></i>`;
        const targetStr = Array.isArray(sig.target) ? sig.target.join(' & ') : sig.target;
        return `<div style="background:${color}; color:${color === '#222' ? '#fff' : '#000'}; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.55rem; border:1px solid rgba(255,255,255,0.2);" title="Sinyal: ${targetStr}">${icon}</div>`;
    };
    
    // We remove the old Warna/OE/HL tracker from the agresif mini tracker
    // Instead we just hide this section if it has nothing, but for now we leave it empty or remove it.
    miniTracker.innerHTML = `
        <div style="display:flex; align-items:center; gap: 1rem; width:100%; color:var(--text-dim);">
            <em>Mini Tracker Agresif Dinonaktifkan</em>
        </div>
    `;
}

function renderMurniTracker() {
    const trackerEl = document.getElementById('mini-tracker-murni-content');
    if (!trackerEl) return;

    if (PREDICTION_TRACKER.history.length === 0) {
        trackerEl.innerHTML = `<span class="input-hint">Belum ada histori Sinyal Murni (Masukkan angka).</span>`;
        return;
    }

    const recent = PREDICTION_TRACKER.history.slice(0, 25);
    
    const renderTrack = (sig) => {
        if (!sig) return `<span style="color:var(--text-dim);">-</span>`;
        let color = '#fff';
        if (sig.target === 'red') color = '#ff3333';
        if (sig.target === 'black') color = '#222';
        if (sig.target === 'odd') color = '#00b0ff';
        if (sig.target === 'even') color = '#ffab00';
        if (sig.target === 'high') color = '#e040fb';
        if (sig.target === 'low') color = '#00e676';
        if (Array.isArray(sig.target)) color = '#00e676';
        
        if (!sig.isWin) {
            color = '#ff2a55'; // Merah untuk loss
        }
        
        const textColor = (color === '#222' || color === '#ff2a55' || color === '#ff3333') ? '#fff' : '#000';
        const icon = sig.isWin ? `<i class="fa-solid fa-check"></i>` : `<i class="fa-solid fa-xmark"></i>`;
        const targetStr = Array.isArray(sig.target) ? sig.target.join(' & ') : sig.target;
        return `<div style="background:${color}; color:${textColor}; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.55rem; border:1px solid rgba(255,255,255,0.2);" title="Sinyal Murni: ${targetStr}">${icon}</div>`;
    };
    
    const columns = recent.map(log => `
        <div style="display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 6px; margin: 0 2px; flex-shrink:0;" title="Putaran #${log.spinIndex}">
            <span style="font-size:0.55rem; color:var(--text-dim);">#${log.spinIndex}</span>
            <div style="height:16px; display:flex; align-items:center;">${renderTrack(log.murniDozen)}</div>
        </div>
    `).join('');

    trackerEl.innerHTML = `
        <div style="display:flex; align-items:center; gap: 1rem; width:100%;">
            <div style="display:flex; gap: 1rem; border-right:1px solid var(--border); padding-right:1rem; flex-shrink:0;">
                <div style="text-align:center;">
                    <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Total Win (Dozen)</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--green);"><i class="fa-solid fa-check"></i> ${PREDICTION_TRACKER.murni.wins}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.65rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Total Lose (Dozen)</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--red);"><i class="fa-solid fa-xmark"></i> ${PREDICTION_TRACKER.murni.total - PREDICTION_TRACKER.murni.wins}</div>
                </div>
            </div>
            
            <div style="flex:1; overflow-x:auto; white-space:nowrap; display:flex; align-items:center; padding-bottom:4px; gap:2px;">
                <div style="display:flex; flex-direction:column; gap:4px; margin-right:8px; flex-shrink:0;">
                    <span style="font-size:0.55rem; color:transparent; height:12px;">#</span>
                    <span style="font-size:0.6rem; color:var(--text-dim); height:16px; display:flex; align-items:center;">Dozen Murni &raquo;</span>
                </div>
                ${columns}
            </div>
        </div>
    `;
}

function renderJituTracker() {
    const trackerEl = document.getElementById('mini-tracker-jitu');
    if (!trackerEl) return;

    if (PREDICTION_TRACKER.history.length === 0) {
        trackerEl.innerHTML = `<span class="input-hint" style="font-size:0.7rem;">Belum ada histori Sinyal Jitu.</span>`;
        return;
    }

    // calculate total stats from all history
    let totalJitu = 0;
    let winsJitu = 0;
    
    PREDICTION_TRACKER.history.forEach(log => {
        if (log.agresifNums && log.murniDozen && log.murniDozen.target) {
            const jituNums = log.agresifNums.filter(n => {
                if (n === 0) return false;
                return log.murniDozen.target.includes(getDozen(n));
            });
            if (jituNums.length > 0) {
                totalJitu++;
                if (jituNums.includes(log.actualNumber)) {
                    winsJitu++;
                }
            }
        }
    });

    const recent = PREDICTION_TRACKER.history.slice(0, 25);
    const columns = recent.map(log => {
        let hasJitu = false;
        let isWin = false;
        if (log.agresifNums && log.murniDozen && log.murniDozen.target) {
            const jituNums = log.agresifNums.filter(n => {
                if (n === 0) return false;
                return log.murniDozen.target.includes(getDozen(n));
            });
            if (jituNums.length > 0) {
                hasJitu = true;
                if (jituNums.includes(log.actualNumber)) isWin = true;
            }
        }
        
        if (!hasJitu) return `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 6px; margin: 0 2px; flex-shrink:0;" title="Putaran #${log.spinIndex}">
                <span style="font-size:0.55rem; color:var(--text-dim);">#${log.spinIndex}</span>
                <div style="height:16px; display:flex; align-items:center;"><span style="color:var(--text-dim); font-size:0.55rem;">-</span></div>
            </div>
        `;

        let color = isWin ? '#e040fb' : '#ff2a55';
        const icon = isWin ? `<i class="fa-solid fa-check"></i>` : `<i class="fa-solid fa-xmark"></i>`;
        
        return `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(224,64,251,0.05); border:1px solid rgba(224,64,251,0.2); padding: 4px 6px; border-radius: 6px; margin: 0 2px; flex-shrink:0;" title="Putaran #${log.spinIndex}">
                <span style="font-size:0.55rem; color:var(--text-dim);">#${log.spinIndex}</span>
                <div style="height:16px; display:flex; align-items:center;">
                    <div style="background:${color}; color:#fff; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.55rem; border:1px solid rgba(255,255,255,0.2); box-shadow: 0 0 5px ${color};">${icon}</div>
                </div>
            </div>
        `;
    }).join('');

    trackerEl.innerHTML = `
        <div style="display:flex; align-items:center; gap: 1rem; width:100%;">
            <div style="display:flex; gap: 1rem; border-right:1px solid rgba(224,64,251,0.2); padding-right:1rem; flex-shrink:0;">
                <div style="text-align:center;">
                    <div style="font-size:0.6rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Jitu Win</div>
                    <div style="font-size:1.1rem; font-weight:800; color:#e040fb;"><i class="fa-solid fa-crosshairs"></i> ${winsJitu}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.6rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Jitu Lose</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--red);"><i class="fa-solid fa-xmark"></i> ${totalJitu - winsJitu}</div>
                </div>
            </div>
            
            <div style="flex:1; overflow-x:auto; white-space:nowrap; display:flex; align-items:center; padding-bottom:4px; gap:2px;">
                <div style="display:flex; flex-direction:column; gap:4px; margin-right:8px; flex-shrink:0;">
                    <span style="font-size:0.55rem; color:transparent; height:12px;">#</span>
                    <span style="font-size:0.55rem; color:#e040fb; height:16px; display:flex; align-items:center; font-weight:bold;">Histori Jitu &raquo;</span>
                </div>
                ${columns}
            </div>
        </div>
    `;
}

function renderLawanTracker() {
    const trackerEl = document.getElementById('mini-tracker-lawan');
    if (!trackerEl) return;

    if (PREDICTION_TRACKER.history.length === 0) {
        trackerEl.innerHTML = `<span class="input-hint" style="font-size:0.7rem;">Belum ada histori Lawan Signal.</span>`;
        return;
    }

    let totalLawan = 0;
    let winsLawan = 0;
    
    PREDICTION_TRACKER.history.forEach(log => {
        if (log.agresifNums && log.murniLawanDozen && log.murniLawanDozen.target) {
            const lawanJituNums = log.agresifNums.filter(n => {
                if (n === 0) return false;
                return log.murniLawanDozen.target.includes(getDozen(n));
            });
            if (lawanJituNums.length > 0) {
                totalLawan++;
                if (lawanJituNums.includes(log.actualNumber)) {
                    winsLawan++;
                }
            }
        }
    });

    const recent = PREDICTION_TRACKER.history.slice(0, 25);
    const columns = recent.map(log => {
        let hasLawan = false;
        let isWin = false;
        if (log.agresifNums && log.murniLawanDozen && log.murniLawanDozen.target) {
            const lawanJituNums = log.agresifNums.filter(n => {
                if (n === 0) return false;
                return log.murniLawanDozen.target.includes(getDozen(n));
            });
            if (lawanJituNums.length > 0) {
                hasLawan = true;
                if (lawanJituNums.includes(log.actualNumber)) isWin = true;
            }
        }
        
        if (!hasLawan) return `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05); padding: 4px 6px; border-radius: 6px; margin: 0 2px; flex-shrink:0;" title="Putaran #${log.spinIndex}">
                <span style="font-size:0.55rem; color:var(--text-dim);">#${log.spinIndex}</span>
                <div style="height:16px; display:flex; align-items:center;"><span style="color:var(--text-dim); font-size:0.55rem;">-</span></div>
            </div>
        `;

        let color = isWin ? '#ff5252' : '#ff2a55';
        const icon = isWin ? `<i class="fa-solid fa-check"></i>` : `<i class="fa-solid fa-xmark"></i>`;
        
        return `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; background:rgba(255,82,82,0.05); border:1px solid rgba(255,82,82,0.2); padding: 4px 6px; border-radius: 6px; margin: 0 2px; flex-shrink:0;" title="Putaran #${log.spinIndex}">
                <span style="font-size:0.55rem; color:var(--text-dim);">#${log.spinIndex}</span>
                <div style="height:16px; display:flex; align-items:center;">
                    <div style="background:${color}; color:#fff; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.55rem; border:1px solid rgba(255,255,255,0.2); box-shadow: 0 0 5px ${color};">${icon}</div>
                </div>
            </div>
        `;
    }).join('');

    trackerEl.innerHTML = `
        <div style="display:flex; align-items:center; gap: 1rem; width:100%;">
            <div style="display:flex; gap: 1rem; border-right:1px solid rgba(255,82,82,0.2); padding-right:1rem; flex-shrink:0;">
                <div style="text-align:center;">
                    <div style="font-size:0.6rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Lawan Win</div>
                    <div style="font-size:1.1rem; font-weight:800; color:#ff5252;"><i class="fa-solid fa-bolt"></i> ${winsLawan}</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:0.6rem; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Lawan Lose</div>
                    <div style="font-size:1.1rem; font-weight:800; color:var(--red);"><i class="fa-solid fa-xmark"></i> ${totalLawan - winsLawan}</div>
                </div>
            </div>
            
            <div style="flex:1; overflow-x:auto; white-space:nowrap; display:flex; align-items:center; padding-bottom:4px; gap:2px;">
                <div style="display:flex; flex-direction:column; gap:4px; margin-right:8px; flex-shrink:0;">
                    <span style="font-size:0.55rem; color:transparent; height:12px;">#</span>
                    <span style="font-size:0.55rem; color:#ff5252; height:16px; display:flex; align-items:center; font-weight:bold;">Histori Lawan &raquo;</span>
                </div>
                ${columns}
            </div>
        </div>
    `;
}

// ===================================================================
//  MARTINGALE SIMULATOR
// ===================================================================

function runMartingale() {
    if (RESULTS.length < 3) {
        showToast('Minimal 3 data diperlukan untuk simulasi!', 'warn');
        return;
    }

    const capital = parseFloat(document.getElementById('sim-capital').value) || 1000000;
    const baseBet = parseFloat(document.getElementById('sim-bet').value) || 10000;
    const betType = document.getElementById('sim-type').value;

    const predicate = {
        red:   n => getColor(n) === 'red',
        black: n => getColor(n) === 'black',
        odd:   n => n !== 0 && n % 2 === 1,
        even:  n => n !== 0 && n % 2 === 0,
        high:  n => n >= 19,
        low:   n => n >= 1 && n <= 18,
    }[betType];

    let balance = capital;
    let currentBet = baseBet;
    let wins = 0, losses = 0;
    let maxBalance = balance;
    let minBalance = balance;
    let peakBet = baseBet;
    const history = [balance];

    for (const num of RESULTS) {
        if (balance < currentBet) {
            currentBet = baseBet;
            if (balance < currentBet) break;
        }

        if (predicate(num)) {
            balance += currentBet;
            currentBet = baseBet;
            wins++;
        } else {
            balance -= currentBet;
            losses++;
            currentBet *= 2;
            if (currentBet > peakBet) peakBet = currentBet;
        }
        if (balance > maxBalance) maxBalance = balance;
        if (balance < minBalance) minBalance = balance;
        history.push(balance);
    }

    const profit = balance - capital;
    const resultsEl = document.getElementById('sim-results');
    resultsEl.classList.remove('hidden', 'profit', 'loss');
    resultsEl.classList.add(profit >= 0 ? 'profit' : 'loss');
    resultsEl.innerHTML = `
        <strong>${profit >= 0 ? '✅ PROFIT' : '❌ RUGI'}</strong><br>
        Modal Awal: Rp ${capital.toLocaleString('id')}<br>
        Saldo Akhir: <strong>Rp ${balance.toLocaleString('id')}</strong><br>
        Profit/Loss: <strong style="color:${profit >= 0 ? '#00e676' : '#ff2a55'}">
            ${profit >= 0 ? '+' : ''}Rp ${profit.toLocaleString('id')}</strong><br>
        Menang: ${wins} &bull; Kalah: ${losses}<br>
        Saldo Maks: Rp ${maxBalance.toLocaleString('id')}<br>
        Saldo Min: Rp ${minBalance.toLocaleString('id')}<br>
        Taruhan Tertinggi: Rp ${peakBet.toLocaleString('id')}
    `;

    drawMartingaleChart(history, capital);
}

function drawMartingaleChart(history, capital) {
    const canvas = document.getElementById('martingale-chart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const W = rect.width;
    const H = 300;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    if (history.length < 2) return;

    const pad = { top: 20, bottom: 30, left: 70, right: 20 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const minVal = Math.min(...history);
    const maxVal = Math.max(...history);
    const range = maxVal - minVal || 1;

    const getX = i => pad.left + (i / (history.length - 1)) * chartW;
    const getY = v => pad.top + chartH - ((v - minVal) / range) * chartH;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = pad.top + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(W - pad.right, y);
        ctx.stroke();

        const val = maxVal - (range / 4) * i;
        ctx.fillStyle = '#7a8ba8';
        ctx.font = '400 10px Outfit';
        ctx.textAlign = 'right';
        ctx.fillText((val / 1000).toFixed(0) + 'k', pad.left - 8, y + 4);
    }

    // Capital line
    const capitalY = getY(capital);
    ctx.strokeStyle = 'rgba(255,193,7,0.4)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, capitalY);
    ctx.lineTo(W - pad.right, capitalY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffc107';
    ctx.font = '500 10px Outfit';
    ctx.textAlign = 'left';
    ctx.fillText('Modal', pad.left + 4, capitalY - 6);

    // Line chart with gradient fill
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(history[0]));
    for (let i = 1; i < history.length; i++) {
        ctx.lineTo(getX(i), getY(history[i]));
    }
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Gradient fill under the line
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.2)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');

    ctx.lineTo(getX(history.length - 1), pad.top + chartH);
    ctx.lineTo(getX(0), pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // End point
    const lastX = getX(history.length - 1);
    const lastY = getY(history[history.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = history[history.length - 1] >= capital ? '#00e676' : '#ff2a55';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ===================================================================
//  SORT TOGGLE
// ===================================================================

let currentSort = 'number';

function sortFreqChart(sortBy) {
    currentSort = sortBy;
    document.querySelectorAll('.chip[data-sort]').forEach(c => c.classList.remove('active'));
    document.querySelector(`.chip[data-sort="${sortBy}"]`).classList.add('active');
    drawFreqChart(sortBy);
}

// ===================================================================
//  COPY DATA
// ===================================================================

function copyAllData() {
    if (RESULTS.length === 0) {
        showToast('Tidak ada data!', 'warn');
        return;
    }
    const text = RESULTS.map(n => `${n} (${getColor(n)})`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('#data-section .btn-ghost');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = original, 2000);
    });
}

// ===================================================================
//  REFRESH ALL (called after every data change)
// ===================================================================

function refreshAll() {
    updateCounters();
    renderRecentNumbers();
    renderPredictionHero();
    // drawFreqChart(currentSort);
    // renderHotCold();
    // renderColorChart();
    // renderSectorAnalysis();
    // renderGapAnalysis();
    // renderOddEven();
    // renderHighLow();
    // renderDozenChart();
    // renderColumnChart();
    renderStreaks();
    renderAIRecommendations();
    renderDataGrid();
    renderTracker();
    renderMiniTracker();
    renderMurniTracker();
    renderJituTracker();
    renderLawanTracker();
}

// ===================================================================
//  INIT
// ===================================================================

function init() {
    // Listen for Enter key on manual input
    document.getElementById('manual-num').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addManualNumber();
    });

    // Listen for Escape to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('import-modal');
            if (!modal.classList.contains('hidden')) hideImportModal();
        }
    });

    // Close modal on overlay click
    document.getElementById('import-modal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) hideImportModal();
    });

    refreshAll();
}

document.addEventListener('DOMContentLoaded', init);

// Redraw charts on resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // drawFreqChart(currentSort);
        // renderDozenChart();
        // renderColumnChart();
    }, 200);
});


RESULTS = [17, 17, 17, 18, 18, 4, 15, 15, 15, 15];
try {
    refreshAll();
    console.log("Live Signals HTML:");
    console.log(document.getElementById('live-signals-content').innerHTML);
    console.log("Success");
} catch(e) {
    console.error("Error:", e);
}
