export async function runPythonSimulation(params) {
  if (!window.pyodide) {
    window.pyodide = await loadPyodide();
    await pyodide.loadPackage('numpy');
  }

  const { sampleType, afm1Dose, doseGroup, curcuminDose, temp, time, assay, adsorbent } = params;

  const pyCode = `
import numpy as np

time_points = np.linspace(0, ${time}, 10)
results = []
for dose in ${JSON.stringify(curcuminDose)}:
    afm1 = ${afm1Dose} * np.exp(-0.1 * dose * time_points)
    results.append({'curcuminDose': dose, 'time': time_points.tolist(), 'afm1': afm1.tolist()})
results
`;

  try {
    const pyResults = await pyodide.runPythonAsync(pyCode);
    return pyResults.toJs ? pyResults.toJs() : pyResults;
  } catch (e) {
    console.error('Python simulation error:', e);
    return [];
  }
}
