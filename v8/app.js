// app.js - Full Version with Plots and Spider/Heatmap

let pyodideReady = false;
let currentStep = 1;
let simulationResults = [];

// Initialize Pyodide
async function initPyodide() {
    pyodide = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
    });
    await pyodide.loadPackage("numpy");
    pyodideReady = true;
    console.log("Pyodide ready");
}

initPyodide();

// Step navigation buttons
document.querySelectorAll(".next-step").forEach(button => {
    button.addEventListener("click", async () => {
        currentStep++;
        updateTabs();
        showStep(currentStep);
        await runStepSimulation(currentStep);
        showAnimation("Ready");
    });
});

function updateTabs() {
    document.querySelectorAll(".tab").forEach((tab, idx) => {
        if (idx + 1 === currentStep) tab.classList.add("active");
        else tab.classList.remove("active");
    });
}

function showStep(step) {
    document.querySelectorAll(".step-content").forEach((el, idx) => {
        el.style.display = (idx + 1 === step) ? "block" : "none";
    });
}

function showAnimation(msg) {
    const anim = document.getElementById("step-animation");
    anim.innerText = msg;
    anim.style.opacity = 1;
    setTimeout(() => anim.style.opacity = 0, 1200);
}

// ----------------- Python Simulation -----------------
async function runStepSimulation(step) {
    if (!pyodideReady) return;

    // Clear previous plots
    document.getElementById("plots").innerHTML = "";

    try {
        let pythonCode = `
import numpy as np

time = np.linspace(0, 5, 50)
afm1_init = ${document.getElementById("afm1-conc")?.value || 1.0}
curcumin = ${document.getElementById("curcumin-dose")?.value || 10}
temp = ${document.getElementById("temp")?.value || 25}
adsorbent = ${document.getElementById("adsorbent")?.checked or False}

# Simple kinetic model: AFM1 reduction = f(curcumin, temp, time)
k = 0.1 * curcumin/10 * (temp/25) * (1.5 if adsorbent else 1.0)
afm1 = afm1_init * np.exp(-k * time)

time_list = time.tolist()
afm1_list = afm1.tolist()
`;

        await pyodide.runPythonAsync(pythonCode);
        const time = pyodide.globals.get("time_list").toJs();
        const afm1 = pyodide.globals.get("afm1_list").toJs();

        simulationResults = [{ time, afm1, curcumin, temp, adsorbent }];

        runPlots(simulationResults);
        runSpiderChart(simulationResults);
        runHeatmap(simulationResults);
        generateRecommendations(simulationResults);

    } catch (err) {
        console.error("Python simulation error:", err);
        alert("Simulation failed: " + err);
    }
}

// ----------------- Plot Functions -----------------
function runPlots(results) {
    const data = [{
        x: results[0].time,
        y: results[0].afm1,
        mode: 'lines+markers',
        name: 'AFM1 Conc. (mg/L)'
    }];

    const layout = { title: "AFM1 vs Time", xaxis: { title: "Time (h)" }, yaxis: { title: "AFM1 (mg/L)" } };

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "400px";
    document.getElementById("plots").appendChild(div);
    Plotly.newPlot(div, data, layout);
}

function runSpiderChart(results) {
    const data = [{
        type: 'scatterpolar',
        r: [results[0].curcumin, results[0].temp, results[0].time[results[0].time.length-1], results[0].adsorbent ? 1 : 0],
        theta: ['Curcumin Dose', 'Temperature', 'Time', 'Adsorbent'],
        fill: 'toself',
        name: 'Reaction Parameters'
    }];

    const layout = {
        polar: { radialaxis: { visible: true, range: [0, Math.max(results[0].curcumin, results[0].temp, results[0].time[results[0].time.length-1], 1)] }},
        showlegend: false,
        title: "Reaction Parameters Spider Chart"
    };

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "400px";
    document.getElementById("plots").appendChild(div);
    Plotly.newPlot(div, data, layout);
}

function runHeatmap(results) {
    const reduction = results[0].afm1.map(a => 100 - (a / results[0].curcumin) * 100);

    const data = [{
        z: [reduction],
        x: results[0].time,
        y: ['AFM1 Reduction (%)'],
        type: 'heatmap',
        colorscale: 'YlGnBu'
    }];

    const layout = { title: "AFM1 Reduction Heatmap", xaxis:{title:"Time (h)"}, yaxis:{title:""} };

    const div = document.createElement("div");
    div.style.width = "100%";
    div.style.height = "250px";
    document.getElementById("plots").appendChild(div);
    Plotly.newPlot(div, data, layout);
}

// ----------------- Recommendations -----------------
function generateRecommendations(results) {
    const div = document.getElementById("recommendations");
    const recs = `
    <ul>
        <li>Optimal Curcumin dose: ~${results[0].curcumin} mg/L for ${results[0].time[results[0].time.length-1]}h.</li>
        <li>Temperature: ${results[0].temp}°C gives faster AFM1 reduction.</li>
        <li>Adsorbent used: ${results[0].adsorbent ? "Yes, enhances removal" : "No"}.</li>
        <li>AFM1 reduction reaches ~${Math.round(100*(1 - results[0].afm1[results[0].afm1.length-1]/results[0].curcumin))}%.</li>
        <li>Reference: Khaneghah et al., 2019; Oliveira et al., 2020.</li>
    </ul>
    `;
    div.innerHTML = recs;
}
