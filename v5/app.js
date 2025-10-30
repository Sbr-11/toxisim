document.getElementById('runSim').addEventListener('click', runSimulation);
document.getElementById('uploadCsv').addEventListener('click', () => {
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', handleFileUpload);

function runSimulation() {
  const initial = parseFloat(document.getElementById('initial').value);
  const curcumin = parseFloat(document.getElementById('curcumin').value);
  const temp = parseFloat(document.getElementById('temperature').value);
  const hours = parseFloat(document.getElementById('time').value);

  const predicted = predictEfficiency(curcumin, temp);
  const result = simulateDegradation(initial, predicted, hours);
  drawChart(result);
}

function drawChart(simData) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (window.chartInstance) window.chartInstance.destroy();

  window.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: simData.time,
      datasets: [{
        label: 'AFM1 Concentration (mg/L)',
        data: simData.values,
        borderColor: 'rgba(0,150,136,1)',
        fill: false,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time (hours)' } },
        y: { title: { display: true, text: 'AFM1 (mg/L)' } }
      }
    }
  });

  document.getElementById('summary').innerText =
    `Predicted degradation efficiency: ${simData.efficiency.toFixed(2)}%`;
}

function simulateDegradation(initial, efficiency, hours) {
  const values = [];
  const time = [];

  for (let t = 0; t <= hours; t++) {
    const remaining = initial * Math.exp(-efficiency/100 * t / hours);
    time.push(t);
    values.push(remaining);
  }

  return { time, values, efficiency };
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    alert("CSV uploaded successfully. (Parsing feature can be added later.)");
  };
  reader.readAsText(file);
}
