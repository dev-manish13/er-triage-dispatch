import { computeAHPWeights, computeTriagePriority, COMPARISON_MATRIX, CRITERIA } from './src/utils/ahp.js';
import { hungarianAlgorithm } from './src/utils/hungarian.js';

console.log('=== AHP Consistency Check ===');
const { weights, CR, isConsistent } = computeAHPWeights(COMPARISON_MATRIX);
CRITERIA.forEach((c, i) => console.log(`  ${c}: ${weights[i].toFixed(4)}`));
console.log(`Consistency Ratio: ${CR.toFixed(4)} | Consistent (CR < 0.1): ${isConsistent}`);

console.log('\n=== AHP Priority Scoring (mock patients) ===');
const mockPatients = [
  { name: 'Patient A', vitals: { heartRate: 135, systolicBP: 82, spo2: 88, painScore: 9, consciousnessLevel: 'pain' } },
  { name: 'Patient B', vitals: { heartRate: 105, systolicBP: 135, spo2: 96, painScore: 5, consciousnessLevel: 'alert' } },
  { name: 'Patient C', vitals: { heartRate: 78, systolicBP: 118, spo2: 99, painScore: 2, consciousnessLevel: 'alert' } },
];

const scored = mockPatients
  .map((p) => ({ ...p, priority: computeTriagePriority(p.vitals) }))
  .sort((a, b) => b.priority.score - a.priority.score);

scored.forEach((p) => console.log(`  ${p.name}: score=${p.priority.score} level=${p.priority.priorityLevel}`));

console.log('\n=== Hungarian Assignment (3 patients x 3 doctors) ===');
const squareCost = [
  [2, 9, 7],
  [5, 3, 8],
  [9, 6, 1],
];
const squareMatches = hungarianAlgorithm(squareCost);
let squareTotal = 0;
squareMatches.forEach(({ row, col, cost }) => {
  squareTotal += cost;
  console.log(`  patient[${row}] -> doctor[${col}] (cost=${cost})`);
});
console.log(`Total minimized cost: ${squareTotal}`);

console.log('\n=== Hungarian Assignment (4 patients x 2 doctors, rectangular) ===');
const rectCost = [
  [4, 9],
  [2, 7],
  [8, 3],
  [5, 6],
];
const rectMatches = hungarianAlgorithm(rectCost);
rectMatches.forEach(({ row, col, cost }) => console.log(`  patient[${row}] -> doctor[${col}] (cost=${cost})`));
const unmatched = rectCost.map((_, i) => i).filter((i) => !rectMatches.some((m) => m.row === i));
console.log(`Unmatched patients (no doctor available): [${unmatched.join(', ')}]`);
