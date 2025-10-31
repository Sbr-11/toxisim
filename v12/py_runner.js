// py_runner.js
let pyodideReadyPromise = loadPyodideAndPackages();

async function loadPyodideAndPackages() {
    let pyodide = await loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/" });
    console.log("Pyodide loaded successfully.");
    await pyodide.loadPackage("numpy");
    await pyodide.loadPackage("pandas");
    await pyodide.loadPackage("matplotlib");
    return pyodide;
}

async function runPythonSimulation(params) {
    const pyodide = await pyodideReadyPromise;

    const pythonCode = `
import numpy as np
import pandas as pd
import json

# Generate pseudo experimental data for AFM1 decay
time = np.linspace(0, ${params.time}, 30)
decay_rate = 0.1 + (${params.curcuminDose} / 500) - (${params.temperature} / 3000)
afm1 = ${params.afm1Concentration} * np.exp(-decay_rate * time)
binding_eff = min(95, (${params.curcuminDose} * 0.5 + ${params.temperature} * 0.2))
adsorption_rate = np.clip(binding_eff / 100, 0, 1)

data = pd.DataFrame({
    "Time (h)": time,
    "AFM1 (mg/L)": afm1,
    "Binding Efficiency (%)": binding_eff,
    "Adsorption Rate": adsorption_rate
})

result = {
    "sample": "${params.sampleType}",
    "assay": "${params.assay}",
    "temperature": ${params.temperature},
    "dose": ${params.curcuminDose},
    "data": data.to_dict(orient="records")
}

json.dumps(result)
    `;

    try {
        const result = await pyodide.runPythonAsync(pythonCode);
        return JSON.parse(result);
    } catch (err) {
        console.error("Python simulation error:", err);
        return null;
    }
}
