let pyodideReadyPromise = (async () => {
    let pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
    });
    await pyodide.loadPackage("numpy");
    return pyodide;
})();

async function runSimulation({initialAFM1, curcuminDose, temperature, hours, adsorbentType, adsorbentDose}) {
    let pyodide = await pyodideReadyPromise;
    try {
        let code = `
import numpy as np

initial = ${initialAFM1}
dose = ${curcuminDose}
temp = ${temperature}
hours = ${hours}
adsorbent = '${adsorbentType}'
adsDose = ${adsorbentDose}

# Basic decay constant
k = 0.05 + 0.001*dose + 0.0005*temp
if adsorbent != 'none':
    k += 0.01 * adsDose

time_points = np.linspace(0, hours, num=100)
AFM1 = initial * np.exp(-k * time_points)
(time_points.tolist(), AFM1.tolist())
        `;
        let [time, afm1] = await pyodide.runPythonAsync(code);
        return { time, afm1 };
    } catch (err) {
        console.error("Python simulation error:", err);
        return { time: [], afm1: [] };
    }
}
