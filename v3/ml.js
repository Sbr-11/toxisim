async function loadMLModel() {
  const response = await fetch("ml_model.json");
  return await response.json();
}

async function predictEfficiency() {
  const model = await loadMLModel();
  const afm1 = parseFloat(document.getElementById("afm1").value);
  const curcumin = parseFloat(document.getElementById("curcumin").value);
  const temp = parseFloat(document.getElementById("temp").value);
  const time = parseFloat(document.getElementById("time").value);

  // Simple linear weighted model (for demo)
  const w = model.weights;
  const pred = w[0] + w[1]*curcumin - w[2]*afm1/100 + w[3]*temp/30 + w[4]*time/24;
  return Math.min(Math.max(pred, 0), 100);
}
