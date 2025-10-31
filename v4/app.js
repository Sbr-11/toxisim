// app.js
// Ensure ML model + Pyodide started
(async function(){

  // UI refs
  const initialEl = document.getElementById('initial');
  const curcuminEl = document.getElementById('curcumin');
  const tempEl = document.getElementById('temperature');
  const hoursEl = document.getElementById('hours');
  const runBtn = document.getElementById('runBtn');
  const mlBtn = document.getElementById('mlBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileIn = document.getElementById('fileIn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const downloadReportBtn = document.getElementById('downloadReportBtn');
  const plotMain = document.getElementById('plot-main');
  const plotSensitivity = document.getElementById('plot-sensitivity');
  const plotBar = document.getElementById('plot-bar');
  const insightsDiv = document.getElementById('insights');
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  const modalClose = document.getElementById('modalClose');

  // state
  let lastSim = null;
  let uploadedData = null;

  // helper UI functions
  function setBusy(isBusy, txt){
    runBtn.disabled = isBusy;
    mlBtn.disabled = isBusy;
    if (isBusy) runBtn.innerText = txt || 'Running...'; else runBtn.innerText = '▶ Run simulation';
  }

  // open info modals
  document.querySelectorAll('.info-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const which = b.dataset.info;
      if (which==='model') showModal(`
        <h3>Model details</h3>
        <p>This app runs a first-order kinetics simulation (AFM1 decay) and an empirical ML-derived efficiency predictor.</p>
        <pre>eff = d + a*curcumin*ln(1+time) + b*temperature + c*curcumin*temperature/10</pre>
        <p>Parameters are stored in <code>ml_model.json</code>. Python simulation computes a rate constant k from curcumin & temperature, then simulates exponential decay C(t)=C0*exp(-k*t).</p>
      `);
      if (which==='howto') showModal(`
        <h3>How to use ToxiSim</h3>
        <ol>
          <li>Set initial concentration, curcumin dose, temperature, and simulation time.</li>
          <li>Click <b>Run simulation</b> to compute decay curves.</li>
          <li>Upload your experimental CSV (time,conc) to overlay results.</li>
          <li>Click <b>Download report</b> to save an HTML report containing plots and recommendations.</li>
        </ol>
      `);
    });
  });

  modalClose?.addEventListener('click', ()=>modal.classList.add('hidden'));
  function showModal(html){ modal.classList.remove('hidden'); modalBody.innerHTML = html; }

  // parse CSV (simple)
  function parseCsvText(text){
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(l=>l);
    if (lines.length<2) return null;
    const header = lines[0].split(',').map(h=>h.trim().toLowerCase());
    const timeIdx = header.findIndex(h=>h.includes('time'));
    const concIdx = header.findIndex(h=>h.includes('conc') || h.includes('afm1') || h.includes('concentration'));
    if (timeIdx<0 || concIdx<0) return null;
    const times=[]; const concs=[];
    for (let i=1;i<lines.length;i++){
      const parts = lines[i].split(',').map(p=>p.trim());
      const t=Number(parts[timeIdx]); const c=Number(parts[concIdx]);
      if (isFinite(t) && isFinite(c)){ times.push(t); concs.push(c); }
    }
    return { times, concs };
  }

  // file upload event
  uploadBtn.addEventListener('click', ()=>fileIn.click());
  fileIn.addEventListener('change', async (e)=>{
    const f = e.target.files[0];
    if (!f) return;
    const text = await f.text();
    const parsed = parseCsvText(text);
    if (!parsed){ alert('CSV parsing failed — must include time and concentration columns'); return; }
    uploadedData = parsed;
    overlayUploadedData(parsed);
    insightsDiv.prepend(createInsight(`Uploaded CSV <b>${f.name}</b> — ${parsed.times.length} points`));
  });

  // overlay uploaded data onto main plot
  function overlayUploadedData(parsed){
    if (!lastSim){
      // create standalone scatter
      Plotly.newPlot(plotMain, [{x: parsed.times, y: parsed.concs, mode:'markers', name:'Uploaded data', marker:{color:'#ff4d4f'}}], {title:'Uploaded data (no simulation yet)'});
      return;
    }
    // add to existing main plot
    Plotly.addTraces(plotMain, {x: parsed.times, y: parsed.concs, mode:'markers', name:'Uploaded data', marker:{color:'#ff4d4f',size:6}});
  }

  // create insight block
  function createInsight(html){ const d=document.createElement('div'); d.className='insight-item'; d.innerHTML=html; return d; }

  // compute recommendations text
  function buildRecommendations(sim, efficiency, kRate, initial){
    const final = sim.conc[sim.conc.length-1];
    const reduction = ((initial - final)/initial)*100;
    const halfLife = Math.log(2)/kRate;
    let rec = `<b>Summary:</b><br>`;
    rec += `Predicted efficiency: <b>${efficiency.toFixed(2)}%</b>. Derived rate constant k = <b>${kRate.toExponential(3)}</b> 1/h. Estimated half-life ≈ <b>${halfLife.toFixed(2)} h</b>.<br>`;
    rec += `<b>Ending concentration after ${sim.time[sim.time.length-1]} h:</b> ${final.toFixed(4)} ng/mL (${reduction.toFixed(1)}% reduction).<br><br>`;

    // actionable suggestions
    if (efficiency < 30) {
      rec += `<b>Recommendation:</b> Current curcumin dose/temp produce low degradation. Consider increasing curcumin dose or applying photodegradation (curcumin photosensitization) or using complementary removal (adsorption/biobinders).`;
    } else if (efficiency < 60) {
      rec += `<b>Recommendation:</b> Moderate degradation. Optimize temperature (+2–5°C) or increase exposure time. Validate reduction products for safety via LC-MS.`;
    } else {
      rec += `<b>Recommendation:</b> High degradation predicted. Validate empirically and monitor breakdown products to ensure non-toxicity.`;
    }

    return rec;
  }

  // draw sensitivity chart: effect of curcumin doses
  function drawSensitivity(initial, temp, hours, curRange=[0,5,10,20,50]){
    const traces = [];
    const efficiencies = [];
    const ks = [];
    const doses = curRange;
    doses.forEach(d => {
      // local predicted efficiency
      const eff = predictEfficiency(d, temp, hours); // uses ML param
      efficiencies.push(eff);
      // k mapping (same as main mapping in simulation run below)
      const baseline_k = 0.002;
      const scale_k = 0.0006 * d + 0.0008 * Math.max(0,(temp-20));
      ks.push(baseline_k + 0.0006*d + 0.0008*Math.max(0,(temp-20)));
    });

    // bar for efficiency
    const tr = { x:doses, y:efficiencies, type:'bar', name:'Predicted efficiency (%)', marker:{color:'#0ea5a4'} };
    Plotly.newPlot(plotSensitivity, [tr], {title:'Predicted efficiency vs Curcumin dose', xaxis:{title:'Curcumin (mg/L)'}, yaxis:{title:'Efficiency (%)'}});

    // small bar of k in plotBar
    Plotly.newPlot(plotBar, [{x:doses,y:ks,type:'bar',marker:{color:'#2563eb'}}], {title:'Derived k (1/h) vs Curcumin dose', xaxis:{title:'Curcumin (mg/L)'}, yaxis:{title:'k (1/h)'}});
  }

  // main run
  runBtn.addEventListener('click', async ()=>{
    try{
      setBusy(true,'Running simulation...');
      const initial = Number(initialEl.value);
      const curcumin = Number(curcuminEl.value);
      const temp = Number(tempEl.value);
      const hours = Number(hoursEl.value);

      // ML efficiency
      const efficiency = await predictEfficiency(curcumin, temp, hours);

      // map efficiency -> kRate (empirical mapping)
      const baseline_k = 0.002;
      const kRate = baseline_k + 0.0006 * curcumin + 0.0008 * Math.max(0,(temp-20));

      // run python sim
      const sim = await runPythonSimulation(initial, curcumin, temp, hours); // returns {time,conc,k}
      lastSim = sim;

      // plot main
      Plotly.newPlot(plotMain, [{x:sim.time, y:sim.conc, type:'scatter', mode:'lines', name:'Simulated AFM1', line:{color:'#0ea5a4',width:3}}], {title:'Simulated AFM1 decay', xaxis:{title:'Time (h)'},yaxis:{title:'AFM1 (ng/mL)'}});

      // overlay uploaded if present
      if (uploadedData) {
        Plotly.addTraces(plotMain,{x:uploadedData.times,y:uploadedData.concs,mode:'markers',name:'Uploaded data',marker:{color:'#ff4d4f',size:6}});
      }

      // sensitivity
      drawSensitivity(initial, temp, hours, [0,1,2.5,5,10,20]);

      // insights
      const rec = buildRecommendations(sim, efficiency, kRate, initial);
      insightsDiv.innerHTML = '';
      insightsDiv.appendChild(createInsight(`<b>Efficiency:</b> ${efficiency.toFixed(2)}%`));
      insightsDiv.appendChild(createInsight(`<b>Derived k:</b> ${kRate.toExponential(3)} 1/h`));
      insightsDiv.appendChild(createInsight(rec));

      lastSim._metadata = { efficiency, kRate };

    }catch(e){
      console.error(e);
      alert('Simulation failed: '+(e.message||e));
    }finally{
      setBusy(false);
    }
  });

  // ML-only button
  mlBtn.addEventListener('click', async ()=>{
    const curcumin = Number(curcuminEl.value);
    const temp = Number(tempEl.value);
    const hours = Number(hoursEl.value);
    const eff = await predictEfficiency(curcumin, temp, hours);
    insightsDiv.prepend(createInsight(`<b>ML predicted efficiency:</b> ${eff.toFixed(2)}%`));
  });

  // download CSV
  downloadCsvBtn.addEventListener('click', ()=>{
    if (!lastSim) { alert('Run a simulation first'); return; }
    const rows = ['time_h,afm1_ng_per_mL', ...lastSim.time.map((t,i)=>`${t},${lastSim.conc[i]}`)];
    const csv = rows.join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download = 'toxisim_simulation.csv'; a.click(); URL.revokeObjectURL(url);
  });

  // download report (HTML)
  downloadReportBtn.addEventListener('click', ()=>{
    if (!lastSim) { alert('Run a simulation first'); return; }
    const efficiency = lastSim._metadata?.efficiency ?? await predictEfficiency(Number(curcuminEl.value), Number(tempEl.value), Number(hoursEl.value));
    const kRate = lastSim._metadata?.kRate ?? (0.002 + 0.0006*Number(curcuminEl.value) + 0.0008*Math.max(0,(Number(tempEl.value)-20)));
    // build HTML report
    const chartDataUrl = null; // we will embed plotly as image via toImage
    Plotly.toImage(plotMain, {format:'png',height:400,width:700}).then(imgUrl=>{
      const html = `
        <!doctype html><html><head><meta charset="utf-8"><title>ToxiSim report</title></head><body>
        <h2>ToxiSim Report</h2>
        <p><b>Inputs:</b> initial=${initialEl.value} ng/mL, curcumin=${curcuminEl.value} mg/L, temp=${tempEl.value} °C, hours=${hoursEl.value}</p>
        <p><b>ML predicted efficiency:</b> ${efficiency.toFixed(2)}%</p>
        <p><b>Derived k:</b> ${kRate.toExponential(3)} 1/h</p>
        <h3>Simulated decay</h3>
        <img src="${imgUrl}" alt="decay plot" />
        <h3>Insights</h3>
        <p>${buildRecommendations(lastSim,efficiency,kRate,Number(initialEl.value)).replace(/\n/g,'<br>')}</p>
        </body></html>`;
      const blob = new Blob([html],{type:'text/html'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='toxisim_report.html'; a.click(); URL.revokeObjectURL(url);
    }).catch(err=>{
      console.warn('Report image generation failed, fallback to text report',err);
      const text = `ToxiSim Report\nInputs: initial=${initialEl.value}, curcumin=${curcuminEl.value}, temp=${tempEl.value}, hours=${hoursEl.value}\nML predicted efficiency: ${efficiency}\n...`;
      const blob = new Blob([text],{type:'text/plain'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href=url; a.download='toxisim_report.txt'; a.click(); URL.revokeObjectURL(url);
    });
  });

  // small helper to add top insight
  function createInsight(html){
    const el = document.createElement('div'); el.className = 'insight-item'; el.innerHTML = html; return el;
  }

  // expose for debugging
  window.ToxiSim = { runPythonSimulation, predictEfficiency };

  // ready indicator
  const readyNote = document.createElement('div'); readyNote.style.fontSize='12px'; readyNote.style.color='#075'; readyNote.style.marginTop='8px';
  readyNote.innerText = 'ML model + Pyodide loading in background (first visit may take ~10–20s)';
  document.querySelector('.controls-panel').appendChild(readyNote);

})();
