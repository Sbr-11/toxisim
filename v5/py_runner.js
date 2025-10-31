// py_runner.js
// Exports initPyodide() and runPythonSimulation()
// Uses loadPyodide() global loaded from index.html

let pyodideReadyPromise = null;

export function initPyodideOnce() {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = (async () => {
      const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
      await py.loadPackage(['numpy']);
      console.log('Pyodide ready');
      window.pyodide = py;
      return py;
    })();
  }
  return pyodideReadyPromise;
}

// simulate AFM1 first-order decay with k derived from curcumin & temp
export async function runPythonSimulation(initial_ng_per_mL, curcumin_mgL, temperature_C, hours) {
  const py = await initPyodideOnce();

  const init = Number(initial_ng_per_mL);
  const cur = Number(curcumin_mgL);
  const temp = Number(temperature_C);
  const hrs = Math.max(1, Math.floor(Number(hours)));

  const code = `
import json
import math
import numpy as np

def simulate(initial, curcumin, temp, hours):
    baseline = 0.002
    cur_factor = 0.0006 * curcumin
    temp_factor = 0.0008 * max(0, (temp - 20))
    k = baseline + cur_factor + temp_factor
    t = np.linspace(0, hours, num=hours+1)
    conc = initial * np.exp(-k * t)
    return {'time': t.tolist(), 'conc': np.round(conc,6).tolist(), 'k': float(k)}

res = simulate(${init}, ${cur}, ${temp}, ${hrs})
json.dumps(res)
  `;

  try {
    const jsonStr = await py.runPythonAsync(code);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Python simulation error:', err);
    throw err;
  }
}
