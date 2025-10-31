// py_runner.js

let pyodide = null;

// Initialize Pyodide
async function initPyodideEnvironment() {
    if (pyodide) return pyodide;

    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
    });

    // Load necessary Python packages
    await pyodide.loadPackage(["numpy", "pandas", "matplotlib"]);
    console.log("✅ Pyodide ready with numpy, pandas, and matplotlib loaded.");

    return pyodide;
}

// Run Python simulation
async function runPythonSimulation(params) {
    try {
        await initPyodideEnvironment();

        // Destructure simulation parameters
        const {
            sampleType,
            afm1Conc,
            curcuminDose,
            temperature,
            reactionTime,
            assayType
        } = params;

        // Python code to simulate AFM1 reduction kinetics
        const pythonCode = `
import numpy as np
import pandas as pd

# Parameters
sample_type = "${sampleType}"
afm1_conc = ${afm1Conc}
curcumin_dose = ${curcuminDose}
temperature = ${temperature}
reaction_time = ${reactionTime}

# Simulate time points (hours)
time = np.linspace(0, reaction_time, num=20)

# Empirical kinetics: pseudo-first-order degradation
k_base = 0.1  # base rate
temp_factor = 1 + (temperature - 25) * 0.02
dose_factor = 1 + curcumin_dose / 50
k = k_base * temp_factor * dose_factor

afm1_remaining = afm1_conc * np.exp(-k * time)
afm1_removed = afm1_conc - afm1_remaining

# Create DataFrame
df = pd.DataFrame({
    "Time_h": time,
    "AFM1_Remaining_mgL": afm1_remaining,
    "AFM1_Removed_mgL": afm1_removed
})

# Return as dictionary
df_dict = df.to_dict(orient='list')
df_dict
`;

        const result = await pyodide.runPythonAsync(pythonCode);
        console.log("✅ Python simulation completed.");
        return result;

    } catch (error) {
        console.error("Python simulation error:", error);
        alert("Python simulation failed. Check console for details.");
        return null;
    }
}
