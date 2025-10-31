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
    setTimeout(()=> animDiv.remove(), 1000);
}

// Plotting functions
function runPlots(results) {
    if(!results || !results.time) return;

    const afm1Trace = {
        x: results.time,
        y: results.afm1,
        type: 'scatter',
        name: 'AFM1 Degradation'
    };

    Plotly.newPlot('afm1-time-graph', [afm1Trace], {title:'AFM1 vs Time'});

    const curcuminTrace = {
        x: results.time,
        y: results.curcumin,
        type: 'scatter',
        name: 'Curcumin Concentration'
    };

    Plotly.newPlot('curcumin-kinetics-graph', [curcuminTrace], {title:'Curcumin Kinetics'});

    const spiderData = [{
        type: 'scatterpolar',
        r: [results.afm1[results.afm1.length-1], results.curcumin[results.curcumin.length-1], results.temp],
        theta: ['AFM1 remaining','Curcumin remaining','Temp °C'],
        fill: 'toself'
    }];
    Plotly.newPlot('spider-graph', spiderData, {title:'Simulation Overview'});

    const heatmapData = [{
        z: results.afm1_matrix,
        x: results.doses,
        y: results.temps,
        type: 'heatmap'
    }];
    Plotly.newPlot('heatmap-graph', heatmapData, {title:'AFM1 Degradation Heatmap'});
}

// Simulation trigger
async function runSimulation() {
    const afm1Conc = parseFloat(document.getElementById('afm1-concentration').value);
    const curcuminDose = parseFloat(document.getElementById('curcumin-dose').value);
    const temp = parseFloat(document.getElementById('temperature').value);
    const time = parseFloat(document.getElementById('reaction-time').value);

    try {
        const results = await runPythonSimulation(afm1Conc, curcuminDose, temp, time);
        runPlots(results);
        generateRecommendations(results);
    } catch(err) {
        console.error("Simulation error:", err);
    }
}

document.querySelectorAll('.tablink').forEach(btn => btn.addEventListener('click', ()=> {}));
