import { runPythonSimulation } from './py_runner.js';
import { generateRecommendations } from './recommendation.js';

let currentStep = 1;
const steps = document.querySelectorAll('.step-content');
const tabBtns = document.querySelectorAll('.tab-btn');

function showStep(step) {
  steps.forEach(s => s.style.display = 'none');
  tabBtns.forEach(b => b.classList.remove('active'));
  document.querySelector(`.step-content[data-step="${step}"]`).style.display = 'block';
  document.querySelector(`.tab-btn[data-step="${step}"]`).classList.add('active');
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const step = btn.getAttribute('data-step');
    currentStep = parseInt(step);
    showStep(currentStep);
  });
});

document.getElementById('step1Next').onclick = () => { currentStep = 2; showStep(2); };
document.getElementById('step2Next').onclick = () => { currentStep = 3; showStep(3); };
document.getElementById('step3Next').onclick = () => { currentStep = 4; showStep(4); };
document.getElementById('step5Next').onclick = () => { currentStep = 6; showStep(6); };

// Run simulation button
document.getElementById('runSimulationBtn').onclick = async () => {
  const sampleType = document.getElementById('sampleType').value;
  const afm1Dose = parseFloat(document.getElementById('afm1Dose').value);
  const doseGroup = document.getElementById('doseGroup').value.split(',').map(Number);
  const curcuminDose = document.getElementById('curcuminDose').value.split(',').map(Number);
  const temp = parseFloat(document.getElementById('reactionTemp').value);
  const time = parseFloat(document.getElementById('reactionTime').value);
  const assay = document.getElementById('assayType').value;
  const adsorbent = document.getElementById('adsorbent').value;

  const statusEl = document.getElementById('simulationStatus');
  statusEl.textContent = 'Simulation running...';

  const results = await runPythonSimulation({
    sampleType, afm1Dose, doseGroup, curcuminDose, temp, time, assay, adsorbent
  });

  statusEl.textContent = `Simulation completed!`;

  // Plot results
  const traces = results.map(r => ({
    x: r.time,
    y: r.afm1,
    mode: 'lines+markers',
    name: `${r.curcuminDose} mg/L`
  }));
  Plotly.newPlot('plotArea', traces, { title: 'AFM1 vs Time', xaxis: {title:'Time (h)'}, yaxis: {title:'AFM1 % remaining'} });

  // Generate recommendations
  const recText = generateRecommendations(results);
  document.getElementById('recommendationsText').innerHTML = recText;
};
