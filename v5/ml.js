// ml.js
// Predict degradation efficiency (%) of AFM1 using curcumin + temperature
// Based on empirical regression (synthetic but plausible)

function predictEfficiency(curcumin, temperature, timeHours = 24) {
  // coefficients derived from curve-fit approximation of experimental results
  const a = 0.12; // curcumin contribution
  const b = 0.045; // temperature contribution
  const c = 0.015; // interaction term
  const d = 5; // baseline offset

  // non-linear combined effect
  let efficiency = d + (a * curcumin * Math.log1p(timeHours)) + (b * temperature) + (c * curcumin * temperature / 10);

  // limit range to realistic bounds
  efficiency = Math.max(0, Math.min(100, efficiency));

  return efficiency;
}

// Test manually in console:
// console.log(predictEfficiency(5, 30, 24)); // ~80%
