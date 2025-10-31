// app.js (ES module) — main controller
import { initPyodideOnce, runPythonSimulation } from './py_runner.js';

// start pyodide loading in background
initPyodideOnce();

// DOM helpers & elements
const steps = Array.from(document.querySelectorAll('.step-btn'));
const panels = Array.from(document.querySelectorAll('.step-panel'));
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

function showStep(n){
  panels.forEach(p => p.classList.toggle('active', p.id === `step-${n}`));
  steps.forEach(b => b.classList.toggle('active', Number(b.dataset.step)===n));
}
steps.forEach(b => b.addEventListener('click', ()=> showStep(Number(b.dataset.step))));

// guide button
document.getElementById('openGuide').addEventListener('click', ()=>{
  showModal(`<h3>Quick guide</h3><ol><li>Step 1: choose sample matrix.</li><li>Step 2: set spiking doses.</li><li>Step 3: set reaction conditions and run simulation.</li><li>Step 4: pick assay.</li><li>Step 5: inspect plots and overlay experimental data if you have it.</li><li>Step 6: download recommendations/report.</li></ol>`);
});

// modal
document.getElementById('modalClose').addEventListener('click', ()=> modal.classList.add('hidden'));
function showModal(html){ modal.classList.remove('hidden'); modalBody.innerHTML = html; }

// Step navigation buttons
document.getElementById('nextTo2').addEventListener('click', ()=> showStep(2));
document.getElementById('backTo1').addEventListener('click', ()=> showStep(1));
document.getElementById('nextTo3').addEventListener('click', ()=> showStep(3));
document.getElementById('backTo2').addEventListener('click', ()=> showStep(2));
document.getElementById('nextTo5').addEventListener('click', ()=> showStep(5));
document.getElementById('backTo3').addEventListener('click', ()=> showStep(3));
document.getElementById('backTo5').addEventListener('click', ()=> showStep(5));

// load example dataset button
document.getElementById('loadExample').addEventListener('click', loadExampleDataset);

// run simulation button (Step 3)
document.getElementById('runSim').addEventListener('click', async ()=>{
  const initial = Number(document.getElementById('initialAFM1').value || document.getElementById('initial').value);
  const curcumin = Number(document.getElementById('curcuminDose').value);
  const temp = Number(document.getElementById('reactionTemp').value);
  const hours = Number(document.getElementById('totalTime').value);
  const light = document.getElementById('light').value;

  // basic validation
  if (!isFinite(initial) || !isFinite(curcumin) || !isFinite(temp) || !isFinite(hours)){
    alert('Please enter valid numerical inputs.');
    return;
  }

  setBusy(true, 'Simulating...');
  try {
    const sim = await runPythonSimulation(initial, curcumin, temp, hours, light);
    window.lastSimulation = sim;
    renderPlots(sim);
    summarizeResults(sim, initial, curcumin);
    showStep(5);
  } catch (err) {
    alert('Simulation failed: ' + (err.message || err));
  } finally {
    setBusy(false);
  }
});

function setBusy(flag, text){
  const btn = document.getElementById('runSim');
  btn.disabled = flag;
  btn.innerText = flag ? text : 'Run simulation';
}

// file upload (Step 5) — overlay experimental CSV
document.getElementById('fileUpload').addEventListener('change', async (e)=>{
  const f = e.target.files[0];
  if (!f) return;
  const txt = await f.text();
  const parsed = parseCsv(txt);
  if (!parsed) { alert('CSV parse failed. Must have header with "time" and "afm1" columns.'); return; }
  window.uploadedData = parsed;
  Plotly.addTraces('plotMain', { x: parsed.time, y: parsed.conc, mode:'markers', name:'Experimental', marker:{color:'#ff6b6b',size:7} });
  addInsight(`Uploaded ${f.name} — ${parsed.time.length} points`);
});

// parse CSV helper
function parseCsv(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const header = lines[0].split(',').map(h => h.toLowerCase());
  const timeIdx = header.findIndex(h => h.includes('time'));
  const concIdx = header.findIndex(h => h.includes('afm1') || h.includes('conc') || h.includes('concentration'));
  if (timeIdx < 0 || concIdx < 0) return null;
  const t = [], c = [];
  for (let i=1;i<lines.length;i++){
    const parts = lines[i].split(',').map(p=>p.trim());
    const ti = Number(parts[timeIdx]); const ci = Number(parts[concIdx]);
    if (isFinite(ti) && isFinite(ci)){ t.push(ti); c.push(ci); }
  }
  return { time: t, conc: c };
}

// rendering plots
function renderPlots(sim){
  const time = sim.time;
  const conc = sim.conc;

  const mainTrace = { x: time, y: conc, mode: 'lines+markers', name: 'Simulated', line:{color:'#0ea5a4'} };
  const layout = { title: 'AFM1 concentration vs time', xaxis:{title:'Time (h)'}, yaxis:{title:'AFM1 (ng/mL)'} };
  Plotly.newPlot('plotMain', [mainTrace], layout, {responsive:true});

  // dose sensitivity: vary curcumin doses
  const doses = [0, 1, 2.5, 5, 10, 20];
  const doseTraces = doses.map(d => {
    const k = 0.002 + 0.0006*d + 0.0008*Math.max(0, (Number(document.getElementById('reactionTemp').value)-20));
    const t = time;
    const y = t.map(tt => Number((sim.conc[0] * Math.exp(-k*tt)).toFixed(6)));
    return { x: t, y, name: `${d} mg/L`, visible: d===Number(document.getElementById('curcuminDose').value) ? true : 'legendonly' };
  });
  Plotly.newPlot('plotDose', doseTraces, { title:'Dose sensitivity (select doses from legend)' });

  // k vs temp plot
  const temps = [15,20,25,30,35,40];
  const ks = temps.map(tm => 0.002 + 0.0006*Number(document.getElementById('curcuminDose').value) + 0.0008*Math.max(0,(tm-20)));
  Plotly.newPlot('plotKvsTemp', [{x:temps,y:ks,mode:'lines+markers',line:{color:'#2563eb'}}], {title:'Derived k vs Temperature', xaxis:{title:'Temp (°C)'}, yaxis:{title:'k (1/h)'}});
}

// summarize results & compute recommendations
function summarizeResults(sim, initial, curcumin){
  const final = sim.conc[sim.conc.length-1];
  const reduction = ((initial - final)/initial)*100;
  const k = sim.k;
  const half = sim.half_life;

  const resultsDiv = document.getElementById('resultsSummary');
  resultsDiv.innerHTML = '';
  resultsDiv.appendChild(makeInsight(`<b>Derived rate constant (k)</b>: ${k.toExponential(3)} 1/h`));
  resultsDiv.appendChild(makeInsight(`<b>Half-life (t½)</b>: ${half.toFixed(2)} h`));
  resultsDiv.appendChild(makeInsight(`<b>Final concentration after ${sim.time[sim.time.length-1]} h</b>: ${final.toFixed(4)} ng/mL (${reduction.toFixed(1)}% reduction)`));

  // specific recommendations
  const recDiv = document.getElementById('recommendations');
  recDiv.innerHTML = '';
  // Rule-based recommendations
  if (reduction < 30) {
    recDiv.appendChild(makeInsight('<b>Recommendation:</b> Low removal. Increase curcumin dose, extend reaction time, consider photostimulation (UV) or adding adsorbents (activated carbon).'));
  } else if (reduction < 60) {
    recDiv.appendChild(makeInsight('<b>Recommendation:</b> Moderate removal. Optimize temperature upwards slightly (+2–5°C), consider longer incubation or mild photostimulation.'));
  } else {
    recDiv.appendChild(makeInsight('<b>Recommendation:</b> Strong removal predicted. Validate breakdown products (LC-MS), ensure safety of by-products.'));
  }
  // learning points
  recDiv.appendChild(makeInsight('<b>Learning points:</b> Kinetics here are first-order approximations. Matrix effects (fat, proteins) can slow removal — always validate with actual assays.'));
}

// small ui helpers
function makeInsight(html){
  const d = document.createElement('div'); d.className = 'insight-item'; d.innerHTML = html; return d;
}
function addInsight(txt){ const ins = document.getElementById('resultsSummary'); ins.prepend(makeInsight(txt)); }

// download CSV of last simulation
document.getElementById('downloadCsv').addEventListener('click', ()=>{
  const sim = window.lastSimulation;
  if (!sim){ alert('Run simulation first'); return; }
  const rows = ['time_h,afm1_ng_per_mL', ...sim.time.map((t,i)=>`${t},${sim.conc[i]}`)];
  const blob = new Blob([rows.join('\n')], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'toxisim_simulation.csv'; a.click(); URL.revokeObjectURL(a.href);
});

// download report (HTML) with embedded plot image (Plotly.toImage)
document.getElementById('downloadReport').addEventListener('click', async ()=>{
  if (!window.lastSimulation){ alert('Run simulation first'); return; }
  try {
    const imgData = await Plotly.toImage('plotMain', {format:'png',height:480,width:800});
    const md = window.lastSimulation;
    const initial = Number(document.getElementById('initialAFM1').value || document.getElementById('initial').value);
    const curcumin = Number(document.getElementById('curcuminDose').value);
    const temp = Number(document.getElementById('reactionTemp').value);
    const hours = Number(document.getElementById('totalTime').value);
    const html = `
      <!doctype html><html><head><meta charset="utf-8"><title>ToxiSim report</title></head>
      <body style="font-family:Arial;">
      <h2>ToxiSim Report</h2>
      <p><b>Inputs:</b> initial ${initial} ng/mL; curcumin ${curcumin} mg/L; temp ${temp} °C; time ${hours} h</p>
      <p><b>Derived k:</b> ${md.k.toExponential(3)} 1/h; <b>half-life:</b> ${md.half_life.toFixed(2)} h</p>
      <h3>Simulated decay</h3>
      <img src="${imgData}" alt="plot" />
      <h3>Recommendations</h3>
      <p>${document.getElementById('recommendations').innerText}</p>
      </body></html>`;
    const blob = new Blob([html], { type:'text/html' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'toxisim_report.html'; a.click(); URL.revokeObjectURL(a.href);
  } catch (err) {
    alert('Report generation failed: ' + err.message);
  }
});

// final download of complete HTML report (Step 6)
document.getElementById('downloadFinalReport').addEventListener('click', ()=> document.getElementById('downloadReport').click());

// load example dataset into CSV upload & table
function loadExampleDataset(){
  const sampleCsv = `time,afm1
0,100
2,92
4,84
6,76
8,69
12,58
16,48
24,36
36,25
48,18
72,10`;
  const parsed = parseCsv(sampleCsv);
  window.uploadedData = parsed;
  Plotly.newPlot('plotMain', [{x:parsed.time,y:parsed.conc,mode:'markers',name:'Example experimental',marker:{color:'#ff6b6b'}}], {title:'Example experimental data'});
  addInsight('Loaded example experimental dataset.');
}

// small UX touches
document.getElementById('fileInput').addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if (!f) return;
  const text = await f.text();
  const parsed = parseCsv(text);
  if (!parsed){ alert('CSV parse failed. Ensure headers include "time" and "afm1" or "conc".'); return; }
  window.uploadedData = parsed;
  // show in main plot
  Plotly.newPlot('plotMain', [{x:parsed.time,y:parsed.conc,mode:'markers',name:'Uploaded experimental',marker:{color:'#ff6b6b'}}], {title:'Uploaded experimental data'});
  addInsight(`Uploaded ${f.name}`);
});

// init: show step 1 by default
showStep(1);
