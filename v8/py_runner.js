let pyodideReady = false;
let pyodide = null;

async function initPyodideRunner() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage("numpy");
    pyodideReady = true;
    console.log("Pyodide ready");
}
initPyodideRunner();

async function runPythonSimulation(samples) {
    if (!pyodideReady) {
        alert("Pyodide not ready");
        return [];
    }
    let results = [];
    for (let s of samples) {
        let code = `
import numpy as np
sample = "${s.sample}"
dose = ${s.curcumin}
temp = ${s.temp}
time_hours = ${s.time}
afm1_initial = ${s.afm1}

k = 0.05 + 0.002*(dose/100) + 0.001*(temp/37)
time = np.linspace(0, time_hours, 50)
afm1 = afm1_initial * np.exp(-k * time)
afm1_list = afm1.tolist()
time_list = time.tolist()
`;
        await pyodide.runPythonAsync(code);
        const afm1_list = pyodide.globals.get("afm1_list").toJs();
        const time_list = pyodide.globals.get("time_list").toJs();
        results.push({sample:s.sample, afm1:afm1_list, time:time_list});
    }
    return results;
}
