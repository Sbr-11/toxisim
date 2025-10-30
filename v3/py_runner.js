let pyodideReady = null;

async function initPyodide() {
  if (!pyodideReady) {
    pyodideReady = await loadPyodide();
  }
  return pyodideReady;
}

async function runPythonSimulation(init, curc, temp, time) {
  const pyodide = await initPyodide();

  const code = `
import math
import json

def simulate_afm1(init, curc, temp, time):
    k_base = 0.05
    k_temp = k_base * (1 + 0.02 * (temp - 25))
    k_curc = k_temp * (1 + 0.05 * curc)
    afm1 = []
    t_values = []
    for t in range(int(time)+1):
        c = init * math.exp(-k_curc * t)
        afm1.append(c)
        t_values.append(t)
    return {'time': t_values, 'afm1': afm1}

result = simulate_afm1(${init}, ${curc}, ${temp}, ${time})
json.dumps(result)
  `;

  const result = await pyodide.runPythonAsync(code);
  return JSON.parse(result);
}
