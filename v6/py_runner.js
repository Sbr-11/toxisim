// py_runner.js (module-like; app.js will import runPythonSimulation)
// Uses global loadPyodide (from pyodide.js loaded in index.html)

let _pyReady = null;

export function initPyodideOnce() {
  if (!_pyReady) {
    _pyReady = (async () => {
      const py = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
      await py.loadPackage(['numpy']);
      console.log('Pyodide ready');
      window.pyodide = py;
      return py;
    })();
  }
  return _pyReady;
}

// Run first-order kinetics simulation with adjustable k mapping
// initial: ng/mL, curcumin: mg/L, temp: °C, hours: int
export async function runPythonSimulation(initial, curcumin, temp, hours, lightMode='dark') {
  const py = await initPyodideOnce();

  // Mapping: baseline + curcumin contribution + temp + light modifier
  // lightMode: 'dark' (no photostim), 'ambient' (small), 'uv' (strong photostim)
  const lightFactor = (lightMode==='uv') ? 1.6 : (lightMode==='ambient' ? 1.15 : 1.0);

  const code = `
import json, math
import numpy as np

def simulate(initial, curcumin, temp, hours, lightFactor):
    baseline = 0.002  # base k (1/h)
    cur_factor = 0.0006 * curcumin  # per mg/L
    temp_factor = 0.0008 * max(0, (temp - 20))
    k = (baseline + cur_factor + temp_factor) * lightFactor
    t = np.linspace(0, hours, num=hours+1)
    conc = initial * np.exp(-k * t)
    half_life = math.log(2)/k if k>0 else float('inf')
    return {'time': t.tolist(), 'conc': np.round(conc,6).tolist(), 'k': float(k), 'half_life': float(half_life)}

res = simulate(${Number(initial)}, ${Number(curcumin)}, ${Number(temp)}, ${Math.max(1,Math.floor(Number(hours)))}, ${lightFactor})
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
