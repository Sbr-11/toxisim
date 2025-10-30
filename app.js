// app.js
// Main UI logic. Waits for ml model + pyodide initialisation, handles events and plotting.

(async function main() {
  // DOM elements
  const initialEl = document.getElementById('initial');
  const curcuminEl = document.getElementById('curcumin');
  const tempEl = document.getElementById('temperature');
  const timeEl = document.getElementById('time');
  const runBtn = document.getElementById('runBtn');
  const mlBtn = document.getElementById('mlBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const metricsDiv = document.getElementById('metrics');
  const uploadResultDiv = document.getElementById('uploadResult');

  // Chart instance holder
  let chart = null;
  // last sim data
  let lastSim = null;

  // Wait until both ML model and Pyodide are ready (they begin loading on page load)
  // ml.js starts loading ml_model.json immediately; py_runner.js starts loading pyodide as window._pyodideReady
  async function ready() {
    if (window.predictEfficiency === undefined) {
      // small wait while ml.js loads
      await new Promise(r => setTimeout(r, 200));
    }
    await window._pyodideReady.catch(err => { throw err; });
    return true;
  }

  // Utility: draw chart using Chart.js
  function draw(sim) {
    const ctx = document.getElementById('afm1Chart').getContext('2d');
    const labels = sim.time;
    const values = sim.conc;

    if (chart) {
      chart.destroy();
      chart = null;
    }

    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Simulated AFM1 (ng/mL)',
            data: values,
            borderColor: 'rgba(6,78,75,0.9)',
            backgroundColor: 'rgba(6,78,75,0.08)',
            tension: 0.2,
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Time (h)' } },
          y: { title: { display: true, text: 'AFM1 (ng/mL)' }, beginAtZero: true }
        }
      }
    });
  }

  // Convert sim result to CSV and trigger download
  function downloadCSV(sim) {
    if (!sim || !sim.time) return;
    const header = ['time_h','afm1_ng_per_mL'];
    const rows = sim.time.map((t, i) => `${t},${sim.conc[i]}`);
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'toxisim_simulation.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Run simulation flow
  async function runSimulationFlow() {
    try {
      runBtn.disabled = true;
      runBtn.innerText = 'Running...';

      const initial = parseFloat(initialEl.value);
      const curcumin = parseFloat(curcuminEl.value);
      const temperature = parseFloat(tempEl.value);
      const timeHours = parseFloat(timeEl.value);

      // ML predicted efficiency (%)
      const efficiency = await window.predictEfficiency(curcumin, temperature, timeHours);

      // Convert efficiency (%) to a kinetic rate constant k (1/h)
      // The conversion here is empirical for the demo: k = baseline + scale * (efficiency/100)
      // baseline chosen small (e.g., 0.001 1/h), scale chosen to map to realistic half-lives
      const baseline_k = 0.002; // 1/h
      const scale_k = 0.12; // scale factor
      const kRate = baseline_k + scale_k * (efficiency / 100.0);

      // Run Python simulation (first-order)
      const sim = await window.runPythonSimulation(initial, kRate, timeHours);
      // sim: { time: [...], conc: [...] }
      lastSim = sim;

      // show plot
      draw(sim);

      // show metrics
      const finalConc = sim.conc[sim.conc.length - 1];
      const reduction = ((initial - finalConc) / initial) * 100;
      metricsDiv.innerHTML = `
        <b>ML predicted efficiency:</b> ${efficiency.toFixed(2)}%<br>
        <b>Derived rate constant k:</b> ${kRate.toExponential(3)} 1/h<br>
        <b>Final concentration after ${timeHours} h:</b> ${finalConc.toFixed(3)} ng/mL<br>
        <b>Observed reduction:</b> ${reduction.toFixed(2)}%
      `;
      uploadResultDiv.style.display = 'none';
    } catch (err) {
      console.error(err);
      alert('Error running simulation: ' + (err.message || err));
    } finally {
      runBtn.disabled = false;
      runBtn.innerText = '▶ Run Simulation';
    }
  }

  // ML-only: show predicted efficiency without running Python simulation
  async function runMLOnly() {
    try {
      mlBtn.disabled = true;
      mlBtn.innerText = 'Predicting...';

      const curcumin = parseFloat(curcuminEl.value);
      const temperature = parseFloat(tempEl.value);
      const timeHours = parseFloat(timeEl.value);
      const efficiency = await window.predictEfficiency(curcumin, temperature, timeHours);

      metricsDiv.innerHTML = `<b>ML predicted efficiency:</b> ${efficiency.toFixed(2)}%`;

    } catch (err) {
      console.error(err);
      alert('Error in ML prediction: ' + (err.message || err));
    } finally {
      mlBtn.disabled = false;
      mlBtn.innerText = '📈 ML Predict';
    }
  }

  // Handle file upload (CSV). We parse and overlay points on the chart.
  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      // Expect CSV with header: time,afm1 or time,afm1_concentration or similar
      const lines = text.trim().split(/\r?\n/).map(r => r.trim()).filter(Boolean);
      if (lines.length < 2) {
        alert('CSV appears empty or invalid.');
        return;
      }
      const header = lines[0].split(',').map(s => s.trim().toLowerCase());
      // find columns
      const timeIdx = header.findIndex(h => h.includes('time'));
      const concIdx = header.findIndex(h => h.includes('afm1') || h.includes('concentration') || h.includes('conc'));
      if (timeIdx === -1 || concIdx === -1) {
        alert('CSV header must include a time column and an AFM1 concentration column (e.g., time,afm1_concentration).');
        return;
      }

      const times = [];
      const concs = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        const t = Number(parts[timeIdx]);
        const c = Number(parts[concIdx]);
        if (!Number.isFinite(t) || !Number.isFinite(c)) continue;
        times.push(t);
        concs.push(c);
      }

      if (!times.length) {
        alert('No numeric rows parsed from CSV.');
        return;
      }

      // show on chart as scatter overlay
      if (!chart) {
        // if no sim chart yet, create scatter only
        const ctx = document.getElementById('afm1Chart').getContext('2d');
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: times,
            datasets: [{
              label: 'Uploaded AFM1 (ng/mL)',
              data: concs,
              borderColor: 'rgba(220, 38, 38, 0.9)',
              backgroundColor: 'rgba(220,38,38,0.08)',
              showLine: false,
              pointRadius: 4
            }]
          },
          options: { responsive: true }
        });
      } else {
        // add overlay dataset
        chart.data.datasets.push({
          label: 'Uploaded AFM1 (ng/mL)',
          data: concs,
          borderColor: 'rgba(220, 38, 38, 0.9)',
          backgroundColor: 'rgba(220,38,38,0.08)',
          showLine: false,
          pointRadius: 4,
          yAxisID: chart.options.scales?.y?.id || undefined
        });
        chart.update();
      }

      uploadResultDiv.style.display = 'block';
      uploadResultDiv.innerHTML = `<b>Uploaded CSV:</b> ${file.name} — ${times.length} data points plotted.`;
    };
    reader.onerror = (e) => {
      alert('Failed to read file: ' + e);
    };
    reader.readAsText(file);
  }

  // Wiring UI events
  runBtn.addEventListener('click', runSimulationFlow);
  mlBtn.addEventListener('click', runMLOnly);
  downloadCsvBtn.addEventListener('click', () => {
    if (!lastSim) {
      alert('Run a simulation first to download data.');
      return;
    }
    downloadCSV(lastSim);
  });

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
    // reset input for same-file re-upload
    fileInput.value = '';
  });

  // Ensure readiness (pyodide + ml model)
  try {
    await ready();
    // loaded
    console.log('App ready: ML model and Pyodide initialising complete.');
  } catch (err) {
    console.warn('One or more subsystems failed to load:', err);
  }

})(); // end main
