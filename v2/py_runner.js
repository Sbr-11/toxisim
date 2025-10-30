let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();
  await pyodide.loadPackage("numpy");
  console.log("Pyodide loaded");
}

async function runPythonSimulation(afm1, curcumin, temperature, hours) {
  if (!pyodide) await initPyodide();

  const code = `
import numpy as np

def simulate_afm1_decay(afm1, curcumin, temperature, hours):
    k = 0.02 + (curcumin * 0.001) + ((temperature - 25) * 0.0005)
    t = np.linspace(0, hours, num=hours+1)
    afm1_levels = afm1 * np.exp(-k * t)
    return t.tolist(), afm1_levels.tolist()

t, levels = simulate_afm1_decay(${afm1}, ${curcumin}, ${temperature}, ${hours})
result = {'time': t, 'levels': levels}
result
  `;
  try {
    const result = await pyodide.runPythonAsync(code);
    return result;
  } catch (err) {
    console.error("Python simulation error:", err);
    return null;
  }
}

initPyodide();
