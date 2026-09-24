// Analytic Hierarchy Process (AHP) for ER triage prioritization.
// Criteria order must stay in sync with COMPARISON_MATRIX rows/columns.
const CRITERIA = ['consciousness', 'spo2', 'bloodPressure', 'heartRate', 'pain'];

// Saaty pairwise comparison matrix encoding clinical priority ranking:
// consciousness > spo2 > bloodPressure > heartRate > pain.
const COMPARISON_MATRIX = [
  [1, 2, 3, 4, 6],
  [1 / 2, 1, 2, 3, 5],
  [1 / 3, 1 / 2, 1, 2, 4],
  [1 / 4, 1 / 3, 1 / 2, 1, 2],
  [1 / 6, 1 / 5, 1 / 4, 1 / 2, 1],
];

const RANDOM_INDEX = {
  1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

// Normalized-column / averaged-row method: a standard closed-form
// approximation of the principal eigenvector, avoiding an eigen-solver dependency.
function computeAHPWeights(matrix) {
  const n = matrix.length;

  const colSums = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) colSums[j] += matrix[i][j];
  }

  const normalized = matrix.map((row) => row.map((val, j) => val / colSums[j]));
  const weights = normalized.map((row) => row.reduce((a, b) => a + b, 0) / n);

  const weightedSums = matrix.map((row) => row.reduce((sum, val, j) => sum + val * weights[j], 0));
  const lambdaMax = weightedSums.reduce((sum, ws, i) => sum + ws / weights[i], 0) / n;

  const CI = (lambdaMax - n) / (n - 1);
  const RI = RANDOM_INDEX[n] ?? 1.49;
  const CR = RI === 0 ? 0 : CI / RI;

  return { weights, lambdaMax, CI, CR, isConsistent: CR < 0.1 };
}

function rangeRisk(value, normalLow, normalHigh, criticalLow, criticalHigh) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0.3;
  if (value >= normalLow && value <= normalHigh) return 0;
  if (value < normalLow) {
    if (value <= criticalLow) return 1;
    return (normalLow - value) / (normalLow - criticalLow);
  }
  if (value >= criticalHigh) return 1;
  return (value - normalHigh) / (criticalHigh - normalHigh);
}

function lowIsBadRisk(value, normalLow, criticalLow) {
  if (value === null || value === undefined || Number.isNaN(value)) return 0.3;
  if (value >= normalLow) return 0;
  if (value <= criticalLow) return 1;
  return (normalLow - value) / (normalLow - criticalLow);
}

const CONSCIOUSNESS_RISK = { alert: 0, verbal: 0.4, pain: 0.7, unresponsive: 1 };

function computeCriterionRisks(vitals) {
  const { heartRate, systolicBP, spo2, painScore, consciousnessLevel } = vitals;

  return {
    consciousness: CONSCIOUSNESS_RISK[consciousnessLevel] ?? 0.3,
    spo2: lowIsBadRisk(spo2, 95, 85),
    bloodPressure: rangeRisk(systolicBP, 90, 140, 60, 200),
    heartRate: rangeRisk(heartRate, 60, 100, 40, 140),
    pain: painScore === null || painScore === undefined ? 0.3 : Math.min(Math.max(painScore, 0), 10) / 10,
  };
}

function computeTriagePriority(vitals) {
  const { weights, CR, isConsistent } = computeAHPWeights(COMPARISON_MATRIX);
  const risks = computeCriterionRisks(vitals);

  const rawScore = CRITERIA.reduce((sum, criterion, i) => sum + weights[i] * risks[criterion], 0) * 100;
  const score = Math.round(rawScore * 100) / 100;

  let priorityLevel;
  if (score >= 75) priorityLevel = 'critical';
  else if (score >= 50) priorityLevel = 'urgent';
  else if (score >= 25) priorityLevel = 'moderate';
  else priorityLevel = 'low';

  return {
    score,
    priorityLevel,
    weights: Object.fromEntries(CRITERIA.map((c, i) => [c, Math.round(weights[i] * 10000) / 10000])),
    risks,
    consistencyRatio: Math.round(CR * 10000) / 10000,
    isConsistent,
  };
}

export { CRITERIA, COMPARISON_MATRIX, computeAHPWeights, computeCriterionRisks, computeTriagePriority };
