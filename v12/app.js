// === GLOBAL STATE ===
let currentStep = 1;
let simulationData = [];

// === TAB HANDLING ===
function nextStep() {
  document.querySelector(`#step${currentStep}`).classList.remove("active");
  document.querySelector(`.tab-button[data-tab="step${currentStep}"]`).classList.remove("active");
  currentStep++;
  document.querySelector(`#step${currentStep}`).classList.add("active");
  document.querySelector(`.tab-button[data-tab="step${currentStep}"]`).classList.add("active");
  window.scrollTo(0, 0);
}

// === SIMULATION ===
async function runSimulation() {
  const status = document.getElementById("simulationStatus");
  status.textContent = "Simulation running... Please wait.";

  const dose = parseFloat(document.getElementById("curcuminDose").value) || 10;
  const temp = parseFloat(document.getElementById("temp").value) || 25;
  const time = parseFloat(document.getElementById("time").value) || 60;

  // Call Pyodide simulation
  try {
    const result = await runPythonSimulation(dose, temp, time);
    simulationData = result;
    status.textContent = "✅ Simulation complete!";
    setTimeout(() => nextStep(), 1000);
    renderPlots(result);
  } catch (e) {
    status.textContent = "Error running simulation. Check console.";
    console.error(e);
  }
}

// === PLOTTING ===
function renderPlots(data) {
  const container = document.getElementById("resultPlots");
  container.innerHTML = "";

  // Plot 1: AFM1 Kinetics
  const trace1 = {
    x: data.time,
    y: data.afm1,
    type: "scatter",
    mode: "lines+markers",
    name: "AFM1",
    line: { color: "#0078b7", width: 3 }
  };
  Plotly.newPlot(container.appendChild(document.createElement("div")), [trace1], {
    title: "AFM1 Reduction Over Time",
    xaxis: { title: "Time (min)" },
    yaxis: { title: "AFM1 Concentration (µg/L)" }
  });

  // Plot 2: Adsorption efficiency
  const trace2 = {
    x: data.time,
    y: data.efficiency,
    type: "bar",
    name: "Efficiency",
    marker: { color: "#00a37a" }
  };
  Plotly.newPlot(container.appendChild(document.createElement("div")), [trace2], {
    title: "Adsorption Efficiency",
    xaxis: { title: "Time (min)" },
    yaxis: { title: "Efficiency (%)" }
  });

  // Plot 3: Spider chart
  const trace3 = {
    type: "scatterpolar",
    r: [data.efficiency_avg, temp, dose, data.final_afm1],
    theta: ["Efficiency", "Temperature", "Dose", "Residual AFM1"],
    fill: "toself",
    name: "Performance"
  };
  Plotly.newPlot(container.appendChild(document.createElement("div")), [trace3], {
    polar: { radialaxis: { visible: true } },
    title: "Reaction Profile"
  });

  generateRecommendations(data);
}

// === REPORT DOWNLOAD ===
function downloadReport() {
  const blob = new Blob([document.getElementById("recommendationBox").innerText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "AFM1_Curcumin_Report.txt";
  link.click();
}
