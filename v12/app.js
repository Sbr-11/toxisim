// === app.js ===
// Controls UI navigation, simulation logic, and plotting

// --- Step navigation ---
function openStep(stepId) {
  const steps = document.querySelectorAll(".step");
  steps.forEach(s => s.style.display = "none");
  document.getElementById(stepId).style.display = "block";

  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(t => t.classList.remove("active"));
  document.querySelector(`[data-step='${stepId}']`).classList.add("active");
}

// --- Run Simulation ---
async function runSimulation() {
  const dose = document.getElementById("dose").value;
  const temp = document.getElementById("temp").value;
  const time = document.getElementById("time").value;

  const status = document.getElementById("status");
  status.innerHTML = "Simulation running...";
  status.classList.add("loading");

  try {
    const result = await runPythonSimulation(dose, temp, time);
    status.innerHTML = "✅ Simulation complete!";
    status.classList.remove("loading");

    // Show Next button to proceed
    const nextBtn = document.getElementById("nextToResults");
    nextBtn.style.display = "block";

    // Store results
    window.simResult = result;
  } catch (err) {
    console.error("Simulation failed:", err);
    status.innerHTML = "❌ Error during simulation.";
  }
}

// --- Plotting the results ---
function showResults() {
  const data = window.simResult;
  if (!data) {
    alert("Please run the simulation first!");
    return;
  }

  openStep('results');

  // Plot AFM1 vs time
  const trace1 = {
    x: data.time,
    y: data.afm1,
    mode: "lines+markers",
    name: "AFM1 concentration (µg/L)"
  };

  const trace2 = {
    x: data.time,
    y: data.efficiency,
    mode: "lines+markers",
    name: "Adsorption efficiency (%)",
    yaxis: "y2"
  };

  const layout = {
    title: "AFM1 Reduction Kinetics",
    yaxis: { title: "AFM1 (µg/L)" },
    yaxis2: {
      title: "Efficiency (%)",
      overlaying: "y",
      side: "right"
    },
    legend: { orientation: "h" },
    margin: { t: 40, l: 50, r: 50, b: 40 }
  };

  Plotly.newPlot("resultGraph", [trace1, trace2], layout);

  // Generate recommendations
  generateRecommendations(data);
}
