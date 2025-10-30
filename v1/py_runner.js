// py_runner.js
// Loads Pyodide and exposes runPythonSimulation(initialConc, kRate, hours)
// Returns { time: [...], conc: [...] } as plain JS arrays.

window._pyodideReady = (async () => {
  try {
    // load Pyodide (version pinned)
    const pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
    // load numpy package
    await pyodide.loadPackage(['numpy']);
    console.log("Pyodide loaded");
    // store globally
    window.pyodide = pyodide;
    return pyodide;
  } catch (err) {
    console.error("Failed to load Pyodide:", err);
    throw err;
  }
})();

// run a first-order kinetics AFM1 simulation in Python and return JS arrays
// initialConc: numeric (ng/mL), kRate: numeric (1/h), hours: integer
async function runPythonSimulation(initialConc, kRate, hours) {
  // ensure pyodide loaded
  const pyodide = await window._pyodideReady;
  // protect inputs
  const initial = Number(initialConc);
  const k = Number(kRate);
  const hrs = Math.max(1, Math.floor(Number(hours)));

  // Python code: compute arrays using numpy and return a dict assigned to 'sim_result'
  const pyCode = `
import json
import numpy as np
def simulate_first_order(initial, k, hours, steps=hours+1):
    t = np.linspace(0, hours, steps)
    conc = initial * np.exp(-k * t)
    return t.tolist(), conc.tolist()

t, c = simulate_first_order(${initial}, ${k}, ${hrs})
sim_result = {"time": t, "conc": c}
`;

  try {
    await pyodide.runPythonAsync(pyCode);
    const sim_result = pyodide.globals.get('sim_result');
    const jsResult = sim_result.toJs({ dict_converter: Object.fromEntries });
    // cleanup python global to avoid memory growth
    pyodide.runPython(`del sim_result`);
    return jsResult;
  } catch (err) {
    console.error("Python simulation error:", err);
    throw err;
  }
}

// expose globally
window.runPythonSimulation = runPythonSimulation;
