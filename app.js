let pyReady = false;
let pyodideInstance = null;
let lastSimData = [];

async function loadPyodideAndPackages() {
  pyodideInstance = await loadPyodide();
  await pyodideInstance.loadPackage("numpy");
  pyReady = true;
}

loadPyodideAndPackages();

async function runAFM1Simulation(params) {
  const code = `
import numpy as np
conc0 = ${params.conc0}
curcumin = ${params.curcumin}
temp = ${params.temp}
time = ${params.time}
k = 0.01 * (1 + 0.1*curcumin) * (1 + 0.05*(temp-25))
t = np.linspace(0, time, 50)
c = conc0 * np.exp(-k*t)
list(zip(t.tolist(), c.tolist()))
  `;
  return await pyodideInstance.runPythonAsync(code);
}

document.getElementById('runSim').addEventListener('click', async () => {
  if (!pyReady) return alert("Initializing Python...");
  const params = {
    conc0: parseFloat(conc0.value),
    curcumin: parseFloat(curcumin.value),
    temp: parseFloat(temp.value),
    time: parseFloat(time.value)
  };
  const data = await runAFM1Simulation(params);
  lastSimData = data;
  const t = data.map(d => d[0]);
  const c = data.map(d => d[1]);
  Plotly.newPlot('plot', [{
    x: t, y: c, mode: 'lines', name: 'AFM1 Simulated', line:{color:'#2563eb'}
  }], {title: 'Concentration vs Time', xaxis:{title:'Time (h)'}, yaxis:{title:'Conc (mg/L)'}});
});

document.getElementById('downloadData').addEventListener('click', () => {
  if (!lastSimData.length) return alert("Run a simulation first!");
  let csv = "time,concentration\n" + lastSimData.map(d => d.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "simulation_data.csv";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('themeBtn').addEventListener('click', () => {
  document.body.classList.toggle('dark');
});
