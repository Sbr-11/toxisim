let pyodideReady = false;
let pyodide = null;

export async function initPyodideEnv() {
    if (!pyodideReady) {
        pyodide = await loadPyodide({ indexURL : "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/" });
        await pyodide.loadPackage(["numpy", "scipy"]);
        pyodideReady = true;
        console.log("Pyodide ready");
    }
}

export async function runPythonSimulation(dose, temp, time, adsorbent) {
    if (!pyodideReady) await initPyodideEnv();
    const code = `
import numpy as np
time_points = np.linspace(0, ${time}, 20)
afm1 = ${dose} * np.exp(-0.2 * time_points)
results = [{"time": time_points.tolist(), "afm1": afm1.tolist(), "curcumin": ${dose}, "temp": ${temp}, "time": ${time}, "adsorbent": ${adsorbent}}]
results
`;
    try {
        const results = await pyodide.runPythonAsync(code);
        return results;
    } catch (err) {
        console.error("Python simulation error:", err);
        alert("Simulation error: " + err);
        return [];
    }
}
