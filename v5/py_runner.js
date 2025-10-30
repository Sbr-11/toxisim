// py_runner.js
// Integrates Pyodide (Python in the browser) for advanced simulations

let pyodideReadyPromise = loadPyodideAndPackages();

async function loadPyodideAndPackages() {
  const pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
  await pyodide.loadPackage(["numpy", "matplotlib"]);
  console.log("✅ Pyodide loaded successfully");
  return pyodide;
}

// Run AFM1 degradation simulation in Python
async function runPythonSimulation(initialConc, kRate, hours) {
  const pyodide = await pyodideReadyPromise;

  const code = `
import numpy as np

def simulate_afm1(initial, k, hours):
    time = np.linspace(0, hours, num=hours+1)
    conc = initial * np.exp(-k * time)
    return list(time), list(conc)
  
t, c = simulate_afm1(${initialConc}, ${kRate}, ${hours})
result = {"time": t, "conc": c}
`;

  await pyodide.runPythonAsync(code);
  const result = pyodide.globals.get("result").toJs();
  return result;
}
