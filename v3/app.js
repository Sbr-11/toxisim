const ctx = document.getElementById("chart").getContext("2d");
let chart;

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

document.getElementById("runSim").addEventListener("click", async () => {
  const afm1 = parseFloat(document.getElementById("afm1").value);
  const curcumin = parseFloat(document.getElementById("curcumin").value);
  const temp = parseFloat(document.getElementById("temp").value);
  const time = parseFloat(document.getElementById("time").value);

  const results = await runPythonSimulation(afm1, curcumin, temp, time);
  drawChart(results);
});

function drawChart(data) {
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.time,
      datasets: [{
        label: "AFM1 Concentration (ng/L)",
        data: data.afm1,
        borderColor: "#00cc99",
        fill: false
      }]
    },
    options: { responsive: true }
  });
}

document.getElementById("downloadCSV").addEventListener("click", () => {
  const csv = "Time,AFM1\n" + chart.data.labels.map((t,i)=>`${t},${chart.data.datasets[0].data[i]}`).join("\n");
  const blob = new Blob([csv], {type:"text/csv"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "simulation_results.csv";
  link.click();
});

document.getElementById("fileInput").addEventListener("change", (e)=>{
  document.getElementById("uploadMsg").innerText = `Loaded: ${e.target.files[0].name}`;
});

document.getElementById("runML").addEventListener("click", async ()=>{
  const res = await predictEfficiency();
  document.getElementById("mlResult").innerText = `Prediction: ${res.toFixed(2)}% AFM1 reduction`;
});
