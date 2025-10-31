let pyodideReadyPromise = null;

async function initPyodideRunner() {
    if (!pyodideReadyPromise) {
        pyodideReadyPromise = loadPyodide({
            indexURL : "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
        });
    }
    const pyodide = await pyodideReadyPromise;
    await pyodide.loadPackage('numpy');
    return pyodide;
}

async function runPythonSimulation(afm1, curcumin, temp, time, doseGroup, batches) {
    const pyodide = await initPyodideRunner();
    const code = `
import numpy as np
time_points = np.linspace(0, ${time}, 50)
curcumin_doses = [${curcumin} * (i+1) for i in range(${batches})]
afm1_values = ${afm1} * np.exp(-0.3 * time_points * np.array(curcumin_doses).mean() / 10 * (1 + ${temp}/30))
curcumin_values = np.linspace(curcumin_doses[0], 0, 50)
temps = [${temp}-5, ${temp}, ${temp}+5]
doses = curcumin_doses
afm1_matrix = np.array([[v*(1+i*0.1) for i,v in enumerate(afm1_values)] for _ in doses])
time_list = time_points.tolist()
afm1_list = afm1_values.tolist()
curcumin_list = curcumin_values.tolist()
doses_list = doses
temps_list = temps
afm1_matrix_list = afm1_matrix.tolist()
time_list, afm1_list, curcumin_list, doses_list, temps_list, afm1_matrix_list
`;
    const [time_list, afm1_list, curcumin_list, doses_list, temps_list, afm1_matrix_list] = await pyodide.runPythonAsync(code);
    return {
        time: time_list,
        afm1: afm1_list,
        curcumin: curcumin_list,
        doses: doses_list,
        temps: temps_list,
        afm1_matrix: afm1_matrix_list
    };
}
