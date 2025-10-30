let model;

async function loadModel() {
  model = await tf.loadLayersModel("ml_model.json");
}

async function predictEfficiency(init, curc, temp, time) {
  if (!model) await loadModel();

  const input = tf.tensor2d([[init, curc, temp, time]]);
  const output = model.predict(input);
  const value = (await output.data())[0] * 100; // convert 0–1 → %
  return value;
}
