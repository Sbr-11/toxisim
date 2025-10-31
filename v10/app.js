let currentStep = 1;
const totalSteps = 6;

function openStep(evt, stepId) {
    document.querySelectorAll('.tabcontent').forEach(tc => tc.classList.remove('active'));
    document.querySelectorAll('.tablink').forEach(tl => tl.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
    evt.currentTarget.classList.add('active');
    currentStep = parseInt(stepId.replace('Step',''));
}

function nextStep() {
    if(currentStep < totalSteps) {
        currentStep++;
        document.querySelector(`.tablink:nth-child(${currentStep})`).click();
        animateMessage("Ready");
    }
}

function prevStep() {
    if(currentStep > 1) {
        currentStep--;
        document.querySelector(`.tablink:nth-child(${currentStep})`).click();
        animateMessage("Ready");
    }
}

function animateMessage(msg) {
    const animDiv = document.createElement('div');
    animDiv.innerText = msg;
    animDiv.style.position = 'fixed';
    animDiv.style.top = '50%';
    animDiv.style.left = '50%';
    animDiv.style.transform = 'translate(-50%, -50%)';
    animDiv.style.background = '#2a5298';
    animDiv.style.color = 'white';
    animDiv.style.padding = '20px 40px';
    animDiv.style.borderRadius = '12px';
    animDiv.style.zIndex = 1000;
    document.body.appendChild(animDiv);
    setTimeout(()=> animDiv.remove(), 1200);
}

// Run simulation button
async function runSimulation() {
    const afm1Conc = parseFloat(document.getElementById('afm1-concentration').value);
    const curcuminDose = parseFloat(document.getElementById('curcumin-dose').value);
    const temp = parseFloat(document.getElementById('temperature').value);
    const time = parseFloat(document.getElementById('reaction-time').value);
    const doseGroup = parseInt(document.getElementById('dose-group').value);
    const batches = parseInt(document.getElementById('curcumin-batches').value);

    document.getElementById('simulation-status').innerText = "Running simulation...";
    const startTime = Date.now();
    try {
        const results = await runPythonSimulation(afm1Conc, curcuminDose, temp, time, doseGroup, batches);
        runPlots(results);
        generateRecommendations(results);
        const elapsed = ((Date.now()-startTime)/1000).toFixed(2);
        document.getElementById('simulation-status').innerText = `Simulation complete in ${elapsed} seconds`;
        document.querySelector(`.tablink:nth-child(5)`).click();
    } catch(err) {
        console.error("Simulation error:", err);
        document.getElementById('simulation-status').innerText = "Simulation failed!";
    }
}

// Plotting function
function runPlots(results) {
    if(!results || !results.time) return;

    Plotly.newPlot('afm1-time-graph', [{ x: results.time, y: results.afm1, type: 'scatter', name: 'AFM1 Degradation' }], {title:'AFM1 vs Time'});
    Plotly.newPlot('curcumin-kinetics-graph', [{ x: results.time, y: results.curcumin, type: 'scatter', name: 'Curcumin Kinetics' }], {title:'Curcumin Kinetics'});
    Plotly.newPlot('spider-graph', [{ type:'scatterpolar', r:[results.afm1[results.afm1.length-1], results.curcumin[results.curcumin.length-1], results.temps[1]], theta:['AFM1 remaining','Curcumin remaining','Temp °C'], fill:'toself' }], {title:'Simulation Overview'});
    Plotly.newPlot('heatmap-graph', [{ z: results.afm1_matrix, x: results.doses, y: results.temps, type:'heatmap' }], {title:'AFM1 Degradation Heatmap'});
}
