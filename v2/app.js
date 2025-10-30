import { initPyodide, runAFM1Simulation } from './py_runner.js';
import { predictEfficiency, fitUserData } from './ml.js';

let pyReady = false;
(async () => {
  await initPyodide();
  pyReady = true;
})();

document.getElementById('runSim').addEventListener('click', async () => {
  if (!pyReady) return alert("Initializing Python...");
  const params = {
    conc0: parseFloat(conc0.value),
    curcumin: parseFloat(curcumin.value),
    temp: parseFloat(temp.value),
    time: parseFloat(time.value)
  };
  const data = await runAFM1Simulation(params);
  const t = data.map(d => d[0]);
  const c = data.map(d => d[1]);
  Plotly.newPlot('plot', [{
    x: t, y: c, mode: 'lines', name: 'AFM1 Simulated'
  }], {title: 'Concentration vs Time', xaxis:{title:'Time (h)'}, yaxis:{title:'Conc (mg/L)'}});
});

document.getElementById('mlPredict').addEventListener('click', async () => {
  const eff = await predictEfficiency({
    temp: parseFloat(temp.value),
    ph: parseFloat(ph.value),
    curcumin: parseFloat(curcumin.value)
  });
  document.getElementById('metrics').innerHTML = `<b>ML predicted reduction:</b> ${eff.toFixed(2)}%`;
});

document.getElementById('uploadCsv').addEventListener('change', async e => {
  const file = e.target.files[0];
  const {k, times, conc} = await fitUserData(file);
  Plotly.addTraces('plot', {x: times, y: conc, mode: 'markers', name: `User Data (k=${k.toFixed(3)})`});
});


async function loadMLModel() {
  const response = await fetch("ml_model.json");
  return await response.json();
}

async function predictEfficiency() {
  const model = await loadMLModel();
  const afm1 = parseFloat(document.getElementById("afm1").value);
  const curcumin = parseFloat(document.getElementById("curcumin").value);
  const temp = parseFloat(document.getElementById("temp").value);
  const time = parseFloat(document.getElementById("time").value);

  // Simple linear weighted model (for demo)
  const w = model.weights;
  const pred = w[0] + w[1]*curcumin - w[2]*afm1/100 + w[3]*temp/30 + w[4]*time/24;
  return Math.min(Math.max(pred, 0), 100);
}

let pyodideReady = false;
let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();
  pyodideReady = true;
}
initPyodide();

async function runPythonSimulation(afm1, curcumin, temp, time) {
  if (!pyodideReady) await initPyodide();

  const pyCode = `
import math
import json

def simulate(afm1, curcumin, temp, time):
    k = 0.01 * (curcumin/20) * (temp/25)
    times = [i for i in range(int(time)+1)]
    afm1_vals = [afm1 * math.exp(-k*t) for t in times]
    return json.dumps({"time": times, "afm1": afm1_vals})

simulate(${afm1}, ${curcumin}, ${temp}, ${time})
  `;
  const result = await pyodide.runPythonAsync(pyCode);
  return JSON.parse(result);
}
