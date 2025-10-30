let pyodideReady = false;
let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();
  pyodideReady = true;
}
initPyodide();

async function runPythonSimulation(afm1, curcumin, temp, time) {
  if (!pyodideReady) await initPyodide();

  const pyCode = `
import math
import json

def simulate(afm1, curcumin, temp, time):
    k = 0.01 * (curcumin/20) * (temp/25)
    times = [i for i in range(int(time)+1)]
    afm1_vals = [afm1 * math.exp(-k*t) for t in times]
    return json.dumps({"time": times, "afm1": afm1_vals})

simulate(${afm1}, ${curcumin}, ${temp}, ${time})
  `;
  const result = await pyodide.runPythonAsync(pyCode);
  return JSON.parse(result);
}
