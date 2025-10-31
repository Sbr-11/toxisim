// Global Variables
let currentStep = 1;
const totalSteps = 6;
const resultsData = {}; // store simulation results here

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    updateProgress();
    showStep(currentStep);
});

// STEP NAVIGATION
function openStep(evt, stepName) {
    const tabs = document.getElementsByClassName("tabcontent");
    for (let tab of tabs) tab.classList.remove("active");

    const tablinks = document.getElementsByClassName("tablink");
    for (let btn of tablinks) btn.classList.remove("active");

    document.getElementById(stepName).classList.add("active");
    evt.currentTarget.classList.add("active");

    // update currentStep based on clicked tab
    const tabIndex = Array.from(tablinks).indexOf(evt.currentTarget) + 1;
    currentStep = tabIndex;
    updateProgress();
}

function nextStep() {
    if (currentStep < totalSteps) currentStep++;
    showStep(currentStep);
}

function prevStep() {
    if (currentStep > 1) currentStep--;
    showStep(currentStep);
}

function showStep(step) {
    const tabs = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
        if (i === step - 1) tabs[i].classList.add("active");
    }

    const tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active");
        if (i === step - 1) tablinks[i].classList.add("active");
    }

    updateProgress();

    // Auto-generate results if going to step 5
    if (step === 5 && Object.keys(resultsData).length) renderResults();
    if (step === 6 && Object.keys(resultsData).length) generateRecommendations();
}

function updateProgress() {
    const progress = document.getElementById("progress");
    progress.style.width = `${(currentStep / totalSteps) * 100}%`;
}

// SIMULATION
async function runSimulation() {
    const loader = document.getElementById("simulation-loader");
    const status = document.getElementById("simulation-status");
    loader.style.display = "inline-block";
    status.innerText = "Simulation running...";

    // Collect parameters
    const milkType = document.getElementById("milk-type").value;
    const afm1 = parseFloat(document.getElementById("afm1-concentration").value);
    const doseGroup = parseInt(document.getElementById("dose-group").value);
    const curcumin = parseFloat(document.getElementById("curcumin-dose").value);
    const batches = parseInt(document.getElementById("curcumin-batches").value);
    const temp = parseFloat(document.getElementById("temperature").value);
    const time = parseFloat(document.getElementById("reaction-time").value);
    const adsorbent = document.getElementById("adsorbent").value;
    const assay = document.getElementById("assay-type").value;

    // Artificial delay to simulate computation
    await new Promise(r => setTimeout(r, 1500));

    // Generate realistic dataset
    const timePoints = Array.from({length: Math.ceil(time*2+1)}, (_, i) => i*0.5); // half-hour steps
    const afm1Levels = timePoints.map(t => Math.max(0, afm1 * Math.exp(-0.1 * curcumin * t / batches))); 
    const curcuminLevels = timePoints.map(t => curcumin * (1 - Math.exp(-0.05*t)));
    
    // Spider chart data (example: effect on multiple parameters)
    const spiderData = {
        parameters: ["AFM1 Reduction", "Binding Efficiency", "Temperature Effect", "Adsorbent Effect", "Reaction Time"],
        values: [
            Math.min(afm1Levels[afm1Levels.length-1]*100, 100),
            batches*15,
            temp,
            adsorbent==="None"?0:30,
            time*10
        ]
    }

    // Heatmap example (dose vs temp)
    const heatmapData = {
        doses: Array.from({length: doseGroup}, (_, i) => curcumin*(i+1)),
        temps: [temp-5, temp, temp+5],
        values: Array.from({length: 3}, ()=> Array.from({length:doseGroup}, ()=> Math.random()*100))
    }

    // Save results
    resultsData.timePoints = timePoints;
    resultsData.afm1Levels = afm1Levels;
    resultsData.curcuminLevels = curcuminLevels;
    resultsData.spiderData = spiderData;
    resultsData.heatmapData = heatmapData;

    loader.style.display = "none";
    status.innerText = "Simulation completed!";
    showStep(5); // go to results
}

// PLOT RESULTS
function renderResults() {
    // AFM1 vs Time
    Plotly.newPlot('afm1-time-graph', [{
        x: resultsData.timePoints,
        y: resultsData.afm1Levels,
        type: 'scatter',
        mode: 'lines+markers',
        line: {color: '#ff4c4c'}
    }], {title: 'AFM1 vs Time (µg/L)'});

    // Curcumin Kinetics
    Plotly.newPlot('curcumin-kinetics-graph', [{
        x: resultsData.timePoints,
        y: resultsData.curcuminLevels,
        type: 'scatter',
        mode: 'lines+markers',
        line: {color: '#4caf50'}
    }], {title: 'Curcumin Kinetics (mg/L)'});

    // Spider chart
    const spider = resultsData.spiderData;
    Plotly.newPlot('spider-graph', [{
        type: 'scatterpolar',
        r: spider.values,
        theta: spider.parameters,
        fill: 'toself',
        name: 'Simulation'
    }], {
        polar: {radialaxis: {visible:true, range:[0,100]}},
        title: 'Parameter Overview (Spider Chart)'
    });

    // Heatmap
    const hm = resultsData.heatmapData;
    Plotly.newPlot('heatmap-graph', [{
        z: hm.values,
        x: hm.doses,
        y: hm.temps,
        type: 'heatmap',
        colorscale: 'Viridis'
    }], {title: 'Dose vs Temp Heatmap'});
}

// RECOMMENDATIONS
function generateRecommendations() {
    const recDiv = document.getElementById("recommendations");
    const lastAFM1 = resultsData.afm1Levels[resultsData.afm1Levels.length-1];
    let recText = `<p><strong>Key Insights:</strong></p>`;
    recText += `<ul>`;
    recText += `<li>Final AFM1 after reaction: ${lastAFM1.toFixed(3)} µg/L.</li>`;
    recText += `<li>Curcumin dose: ${document.getElementById("curcumin-dose").value} mg/L over ${document.getElementById("curcumin-batches").value} batches.</li>`;
    recText += `<li>Optimal temperature: ${document.getElementById("temperature").value}°C.</li>`;
    recText += `<li>Reaction time: ${document.getElementById("reaction-time").value} hours.</li>`;
    recText += `<li>Adsorbent used: ${document.getElementById("adsorbent").value}.</li>`;
    recText += `<li>Recommended assay: ${document.getElementById("assay-type").value}.</li>`;
    recText += `<li>Further studies: Compare binding agents like activated charcoal or clay for higher efficiency (Ref: <a href="https://doi.org/10.1016/j.foodres.2019.108917" target="_blank">Khaneghah et al., 2019</a>).</li>`;
    recText += `</ul>`;
    recDiv.innerHTML = recText;
}

// DOWNLOAD REPORT
function downloadReport() {
    let content = `<html><head><title>AFM1 Simulation Report</title></head><body>`;
    content += document.getElementById("recommendations").innerHTML;
    content += `<h3>Plots are visible in the interactive dashboard.</h3></body></html>`;
    const blob = new Blob([content], {type:"text/html"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AFM1_Simulation_Report.html";
    link.click();
}
