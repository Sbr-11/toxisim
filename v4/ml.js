let model;

async function loadModel() {
  model = await tf.loadLayersModel("ml_model.json");
  console.log("✅ ML model loaded");
}

async function predictEfficiency(conc, dose, temp) {
  if (!model) await loadModel();
  const input = tf.tensor2d([[conc, dose, temp]]);
  const output = model.predict(input);
  const value = output.dataSync()[0] * 100;
  return value;
}

loadModel();
