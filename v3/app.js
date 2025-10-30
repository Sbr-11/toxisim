async function runSimulationFlow() {
  const init = parseFloat(document.getElementById("initial_conc").value);
  const curc = parseFloat(document.getElementById("curcumin").value);
  const temp = parseFloat(document.getElementById("temperature").value);
  const time = parseFloat(document.getElementById("time").value);

  document.getElementById("output").innerText = "Running simulation...";
  const result = await runPythonSimulation(init, curc, temp, time);

  drawPlot(result.time, result.afm1);
  document.getElementById("output").innerText = "Simulation complete!";
}

async function runPredictionFlow() {
  const init = parseFloat(document.getElementById("initial_conc").value);
  const curc = parseFloat(document.getElementById("curcumin").value);
  const temp = parseFloat(document.getElementById("temperature").value);
  const time = parseFloat(document.getElementById("time").value);

  const eff = await predictEfficiency(init, curc, temp, time);
  document.getElementById("output").innerText =
    `Predicted AFM1 reduction efficiency: ${eff.toFixed(2)}%`;
}

function drawPlot(time, afm1) {
  const trace = {
    x: time,
    y: afm1,
    type: "scatter",
    mode: "lines+markers",
    line: { color: "#00796b", width: 3 },
  };

  const layout = {
    title: "AFM1 Concentration over Time",
    xaxis: { title: "Time (hours)" },
    yaxis: { title: "AFM1 (µg/L)" },
  };

  Plotly.newPlot("plot", [trace], layout);
}

document.getElementById("simulateBtn").addEventListener("click", runSimulationFlow);
document.getElementById("predictBtn").addEventListener("click", runPredictionFlow);
