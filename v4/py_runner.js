async function runPythonSimulation(conc, dose, temp, time) {
  if (!window.pyodide) {
    window.pyodide = await loadPyodide();
  }

  const pythonCode = `
import math
def simulate(c0, dose, temp, tmax):
    k = 0.02 + (dose * 0.005) + ((temp - 25) * 0.001)
    data = {'time': [], 'conc': []}
    for t in range(0, int(tmax)+1):
        c = c0 * math.exp(-k * t)
        data['time'].append(t)
        data['conc'].append(round(c, 4))
    return data

simulate(${conc}, ${dose}, ${temp}, ${time})
  `;

  return await window.pyodide.runPythonAsync(pythonCode);
}
