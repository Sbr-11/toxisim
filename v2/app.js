async function runSimulationFlow() {
  const afm1 = parseFloat(document.getElementById("afm1").value);
  const curcumin = parseFloat(document.getElementById("curcumin").value);
  const temperature = parseFloat(document.getElementById("temperature").value);
  const hours = parseFloat(document.getElementById("hours").value);

  const efficiency = predictEfficiency(afm1, curcumin, temperature, hours);
  document.getElementById(
    "output"
  ).innerText = `Predicted degradation efficiency: ${efficiency.toFixed(2)}%`;

  const result = await runPythonSimulation(afm1, curcumin, temperature, hours);

  if (result) {
    const trace = {
      x: result.time,
      y: result.levels,
      type: "scatter",
      mode: "lines",
      name: "AFM1 Concentration",
    };
    const layout = {
      title: "AFM1 Decay Simulation",
      xaxis: { title: "Time (hours)" },
      yaxis: { title: "AFM1 (µg/L)" },
    };
    Plotly.newPlot("chart", [trace], layout);
  }
}

document.getElementById("run").addEventListener("click", runSimulationFlow);
console.log("App ready: ML model and Pyodide initialising complete.");
