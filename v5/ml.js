function predictEfficiency(curcumin, temp) {
  // Simple ML-inspired placeholder function
  const base = 40;
  const curcuminEffect = 0.9 * curcumin;
  const tempEffect = 1.2 * (temp - 20);
  return Math.min(100, base + curcuminEffect + tempEffect);
}
