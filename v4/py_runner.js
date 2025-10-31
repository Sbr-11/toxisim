// py_runner.js
window._pyReady = (async () => {
  try {
    const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
    await py.loadPackage(['numpy']);
    console.log('Pyodide ready');
    window.pyodide = py;
    return py;
  } catch (err) {
    console.error('Pyodide load failed', err);
    throw err;
  }
})();

async function runPythonSimulation(initial_ng_per_mL, curcumin_mgL, temperature_C, hours) {
  const py = await window._pyReady;
  const init = Number(initial_ng_per_mL);
  const cur = Number(curcumin_mgL);
  const temp = Number(temperature_C);
  const hrs = Math.max(1, Math.floor(Number(hours)));

  // Define safe Python code string — compute k from a physically plausible param
  const pycode = `
import json
import math
import numpy as np

def simulate(initial, curcumin, temp, hours):
    # base rate (1/h) plus contributions
    baseline = 0.002  # baseline slow decay
    cur_factor = 0.0006 * curcumin  # per mg/L
    temp_factor = 0.0008 * max(0, (temp - 20))  # temperature effect
    k = baseline + cur_factor + temp_factor
    t = np.linspace(0, hours, num=hours+1)
    conc = (initial) * np.exp(-k * t)
    return {'time': t.tolist(), 'conc': np.round(conc, 6).tolist(), 'k': float(k)}

res = simulate(${init}, ${cur}, ${temp}, ${hrs})
json.dumps(res)
`;

  try {
    const jsonStr = await py.runPythonAsync(pycode);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Python simulation error:', err);
    throw err;
  }
}

// expose global
window.runPythonSimulation = runPythonSimulation;
