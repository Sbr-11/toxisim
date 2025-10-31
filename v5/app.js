// app.js (module) — main controller for tabbed dashboard
import { loadMlModel, predictEfficiency } from './ml.js';
import { initPyodideOnce, runPythonSimulation } from './py_runner.js';

// top-level await: ensure ml model loaded and pyodide starts loading
await loadMlModel();
initPyodideOnce(); // start background loading (don't await long here)

//
// DOM helpers & tabbing
//
const tabs = document.querySelectorAll('.tab-btn');
const panels = {
  simulate: document.getElementById('tab-simulate'),
  results: document.getElementById('tab-results'),
  data: document.getElementById('tab-data'),
  report: document.getElementById('tab-report')
};
tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const tab = btn.dataset.tab;
  for (const k in panels) panels[k].classList.toggle('active', k===tab);
}));

// UI elements
const initialEl = document.getElementById('initial');
const curcuminEl = document.getElementById('curcumin');
const tempEl = document.getElementById('temperature');
const hoursEl = document.getElementById('hours');
const runBtn = document.getElementById('runSim');
const mlBtn = document.getElementById('mlPredict');
const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const downloadCSVBtn = document.getElementById('downloadCSV');
const downloadReportMain = document.getElementById('downloadReport');
const downloadReportBtn = document.getElementById('downloadReportBtn');

const metricEff = document.getElementById('metric-eff');
const metricK = document.getElementById('metric-k');
const metricFinal = document.getElementById('metric-final');
const metricHalf = document.getElementById('metric-half');

const plotMain = document.getElementById('plotMain');
const plotSensitivity = document.getElementById('plotSensitivity');
const plotK = document.getElementById('plotK');
const insightsList = document.getElementById('insightsList');
const dataBody = document.getElementById('dataBody');
const reportPreview = document.getElementById('reportPreview');

const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');

document.querySelectorAll('.info').forEach(b=>{
  b.addEventListener('click', ()=> {
    const key = b.dataset.info;
    if (key==='model') showModal(`<h3>Model details</h3><p>The simulator uses a first-order kinetics model. The ML predictor is an explainable regression (see <code>ml_model.json</code>) that estimates percent degradation for summary insights.</p>`);
    if (key==='howto') showModal(`<h3>How to use</h3><ol><li>Set inputs</li><li>Run simulation</li><li>Inspect plots</li><li>Download report</li></ol>`);
  });
});

function showModal(html){ modal.classList.remove('hidden'); modalContent.innerHTML = html; }
closeModal?.addEventListener('click', ()=> modal.classList.add('hidden'));

// state
let lastSim = null;
let uploaded = null;

// parse CSV
function parseCSV(text){
  const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  if (lines.length<2) return null;
  const header = lines[0].split(',').map(h=>h.trim().toLowerCase());
  const timeIdx = header.findIndex(h=>h.includes('time'));
  const concIdx = header.findIndex(h=>h.includes('afm1') || h.includes('conc') || h.includes('concentration'));
  if (timeIdx<0 || concIdx<0) return null;
  const times=[]; const concs=[];
  for (let i=1;i<lines.length;i++){
    const parts = lines[i].split(',').map(p=>p.trim());
    const t = Number(parts[timeIdx]); const c=Number(parts[concIdx]);
    if (isFinite(t) && isFinite(c)){ times.push(t); concs.push(c); }
  }
  return { times, concs };
}

// upload flow
uploadBtn.addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', async (e)=>{
  const f = e.target.files[0]; if (!f) return;
  const text = await f.text();
  const parsed = parseCSV(text);
  if (!parsed){ alert('CSV required: header with time and concentration columns'); return; }
  uploaded = parsed;
  renderUploadedTable(parsed);
  addInsight(`Uploaded dataset: ${f.name} — ${parsed.times.length} points`);
  overlayUploaded(parsed);
});

// render uploaded table
function renderUploadedTable(parsed){
  dataBody.innerHTML = '';
  for (let i=0;i<parsed.times.length;i++){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${parsed.times[i]}</td><td>${parsed.concs[i]}</td>`;
    dataBody.appendChild(tr);
  }
}

// overlay uploaded onto main plot
function overlayUploaded(parsed){
  if (!lastSim){
    Plotly.newPlot(plotMain, [{ x: parsed.times, y: parsed.concs, mode:'markers', name:'Experimental', marker:{color:'#ff6b6b'} }], {title:'Uploaded experimental data'});
    return;
  }
  Plotly.addTraces(plotMain, { x: parsed.times, y: parsed.concs, mode:'markers', name:'Experimental', marker:{color:'#ff6b6b',size:7} });
}

// run simulation
runBtn.addEventListener('click', async ()=>{
  setBusy(true,'Running simulation...');
  try{
    const initial = Number(initialEl.value);
    const curcumin = Number(curcuminEl.value);
    const temp = Number(tempEl.value);
    const hours = Number(hoursEl.value);

    // ML predicted efficiency
    const efficiency = await predictEfficiency(curcumin, temp, hours);

    // derive k (same mapping used in py_runner)
    const baseline = 0.002;
    const kRate = baseline + 0.0006 * curcumin + 0.0008 * Math.max(0, (temp - 20));

    // run Python sim (await Pyodide)
    const sim = await runPythonSimulation(initial, curcumin, temp, hours);
    lastSim = sim;

    // plot main
    Plotly.newPlot(plotMain, [{ x: sim.time, y: sim.conc, mode:'lines', name:'Simulated', line:{color:'#0ea5a4',width:3} }], { title:'AFM1 decay (simulated)', xaxis:{title:'Time (h)'}, yaxis:{title:'AFM1 (ng/mL)'} });

    // overlay uploaded
    if (uploaded) overlayUploaded(uploaded);

    // sensitivity and k-vs-dose
    drawSensitivity(initial, temp, hours);

    // metrics & insights
    const final = sim.conc[sim.conc.length-1];
    const halfLife = Math.log(2)/kRate;
    metricEff.innerText = `Efficiency: ${efficiency.toFixed(2)}%`;
    metricK.innerText = `k (1/h): ${kRate.toExponential(3)}`;
    metricFinal.innerText = `Final conc: ${final.toFixed(4)} ng/mL`;
    metricHalf.innerText = `Half-life: ${halfLife.toFixed(2)} h`;

    addInsight(`<b>ML predicted efficiency:</b> ${efficiency.toFixed(2)}%`);
    addInsight(`<b>Derived k:</b> ${kRate.toExponential(3)} 1/h`);
    addInsight(suggestAction(efficiency));

    // prepare report preview (small summary)
    reportPreview.innerHTML = `<strong>Summary:</strong> Efficiency ${efficiency.toFixed(2)}%, final ${final.toFixed(3)} ng/mL.`;
    // store metadata
    lastSim.metadata = { initial, curcumin, temp, hours, efficiency, kRate };
    // switch to results tab for immediate viewing
    document.querySelector('.tab-btn[data-tab="results"]').click();

  } catch(err){
    console.error(err);
    alert('Simulation failed: ' + (err.message || err));
  } finally {
    setBusy(false);
  }
});

function setBusy(flag, text){
  runBtn.disabled = flag;
  mlBtn.disabled = flag;
  if (flag) runBtn.innerText = text || 'Running...'; else runBtn.innerText = '▶ Run simulation';
}

// ML-only predict
mlBtn.addEventListener('click', async ()=>{
  const curcumin = Number(curcuminEl.value);
  const temp = Number(tempEl.value);
  const hours = Number(hoursEl.value);
  const eff = await predictEfficiency(curcumin, temp, hours);
  addInsight(`<b>ML predicted efficiency:</b> ${eff.toFixed(2)}%`);
});

// draw sensitivity
function drawSensitivity(initial, temp, hours){
  const doses = [0,1,2.5,5,10,20,40];
  const effs = doses.map(d => predictEfficiency(d, temp, hours));
  const ks = doses.map(d => 0.002 + 0.0006*d + 0.0008*Math.max(0,(temp-20)));

  Plotly.newPlot(plotSensitivity, [{ x:doses, y:effs, type:'bar', marker:{color:'#0ea5a4'} }], { title:'Predicted efficiency vs curcumin dose', xaxis:{title:'curcumin (mg/L)'}, yaxis:{title:'efficiency (%)'}});
  Plotly.newPlot(plotK, [{ x:doses, y:ks, type:'scatter', mode:'lines+markers', line:{color:'#2563eb'} }], { title:'Derived k vs curcumin dose', xaxis:{title:'curcumin (mg/L)'}, yaxis:{title:'k (1/h)'}});
}

// simple suggestion generator
function suggestAction(eff){
  if (eff < 30) return 'Recommendation: low predicted degradation — raise curcumin dose, increase exposure time or combine with adsorption/biobinders.';
  if (eff < 60) return 'Recommendation: moderate degradation — optimize dose/temp, validate degradation products via LC-MS.';
  return 'Recommendation: high predicted degradation — validate experimentally and inspect degradation products for safety.';
}

// insights helper
function addInsight(html){
  const el = document.createElement('div'); el.className='insight-item'; el.innerHTML = html;
  insightsList.prepend(el);
}

// download CSV of lastSim
downloadCSVBtn.addEventListener('click', ()=>{
  if (!lastSim) return alert('Run a simulation first');
  const rows = ['time_h,afm1_ng_per_mL', ...lastSim.time.map((t,i)=>`${t},${lastSim.conc[i]}`)];
  const blob = new Blob([rows.join('\n')], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='toxisim_simulation.csv'; a.click(); URL.revokeObjectURL(url);
});

// download report (two places trigger same action)
async function downloadReport(){
  if (!lastSim) return alert('Run a simulation first');
  const md = lastSim.metadata;
  // export main plot image
  try{
    const img = await Plotly.toImage(plotMain, {format:'png',height:480,width:800});
    const html = `
      <!doctype html><html><head><meta charset="utf-8"><title>ToxiSim report</title></head><body>
      <h2>ToxiSim Report</h2>
      <p><b>Inputs:</b> initial=${md.initial} ng/mL, curcumin=${md.curcumin} mg/L, temp=${md.temp} °C, hours=${md.hours}</p>
      <p><b>ML predicted efficiency:</b> ${md.efficiency.toFixed(2)}%</p>
      <p><b>Derived k:</b> ${md.kRate.toExponential(3)} 1/h</p>
      <h3>Simulated decay</h3>
      <img src="${img}" alt="decay plot" />
      <h3>Insights</h3>
      <p>${suggestAction(md.efficiency)}</p>
      </body></html>
    `;
    const blob = new Blob([html], { type:'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='toxisim_report.html'; a.click(); URL.revokeObjectURL(url);
  } catch(err){
    console.warn('Report generation failed', err);
    alert('Report generation failed: ' + err.message);
  }
}
downloadReportMain.addEventListener('click', downloadReport);
downloadReportBtn.addEventListener('click', downloadReport);

// small helper: overlay uploaded data on main plot (already implemented above)

// initial sample data fill
(function loadExampleData(){
  const sample = [
    [0,100],[2,92],[4,84],[6,76],[8,69],[12,58],[16,48],[24,36],[36,25],[48,18],[72,10]
  ];
  dataBody.innerHTML = '';
  for (const r of sample){
    const tr = document.createElement('tr'); tr.innerHTML=`<td>${r[0]}</td><td>${r[1]}</td>`; dataBody.appendChild(tr);
  }
})();

// expose for console debugging
window.ToxiSim = { runPythonSimulation, predictEfficiency };

// UX: small first-run note appended to controls
const note = document.createElement('div'); note.className='muted'; note.style.marginTop='10px'; note.innerText='Note: Pyodide downloads ~20–40MB on first load. Wait for "Run simulation" to finish.';
document.querySelector('.card-panel').appendChild(note);
