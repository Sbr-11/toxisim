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
