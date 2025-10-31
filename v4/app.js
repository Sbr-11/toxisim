document.getElementById("runSim").addEventListener("click", runSimulationFlow);

async function runSimulationFlow() {
  const conc = parseFloat(document.getElementById("conc").value);
  const dose = parseFloat(document.getElementById("dose").value);
  const temp = parseFloat(document.getElementById("temp").value);
  const time = parseFloat(document.getElementById("time").value);

  document.getElementById("result").innerText = "Running simulation...";

  // Run Python simulation
  const simData = await runPythonSimulation(conc, dose, temp, time);

  // Run ML prediction
  const mlResult = await predictEfficiency(conc, dose, temp);

  drawChart(simData);
  document.getElementById("result").innerText =
    `Predicted Detox Efficiency: ${mlResult.toFixed(2)}%`;
}

function drawChart(simData) {
  const trace = {
    x: simData.time,
    y: simData.conc,
    mode: "lines+markers",
    line: { color: "#00ffcc" },
  };

  Plotly.newPlot("chart", [trace], {
    title: "AFM1 Concentration over Time",
    xaxis: { title: "Time (h)" },
    yaxis: { title: "Concentration (mg/L)" },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
  });
}
