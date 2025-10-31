// === py_runner.js ===
// This file handles Python-based simulations via Pyodide.
// It loads the dataset, runs the scientific model, and returns simulated results.

let pyodideReadyPromise = loadPyodideAndPackages();

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" });
  await self.pyodide.loadPackage(["pandas", "numpy"]);
  return self.pyodide;
}

async function runPythonSimulation(dose, temp, time) {
  await pyodideReadyPromise;

  const code = `
import pandas as pd
import numpy as np

# Load dataset
df = pd.read_csv("dataset_extended.csv")

# Filter based on input conditions
dose = float(${dose})
temp = float(${temp})
time = float(${time})

# Base simulation logic
base_afm1 = np.maximum(0.05 * (1 + np.random.normal(0, 0.1)), 0.01)
reaction_rate = np.exp(-0.03 * dose) * np.exp(-0.02 * (temp - 25)**2 / 100)
afm1_values = [base_afm1 * np.exp(-reaction_rate * (t/10)) for t in range(0, int(time)+1, 10)]
efficiency = [100 * (1 - a / base_afm1) for a in afm1_values]

# Output structure
result = {
    "time": list(range(0, int(time)+1, 10)),
    "afm1": afm1_values,
    "efficiency": efficiency,
    "efficiency_avg": float(np.mean(efficiency)),
    "final_afm1": float(afm1_values[-1])
}
result
  `;
  const result = await self.pyodide.runPythonAsync(code);
  return result.toJs();
}
