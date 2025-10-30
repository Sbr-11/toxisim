// Load trained ML model from JSON
let mlModel;

async function loadModel() {
  const response = await fetch("ml_model.json");
  mlModel = await response.json();
  console.log("ML model loaded:", mlModel.name);
}

function predictEfficiency(afm1, curcumin, temperature, hours) {
  if (!mlModel) {
    console.error("Model not loaded");
    return null;
  }

  const { coef, intercept } = mlModel;
  const degradation =
    intercept +
    coef[0] * afm1 +
    coef[1] * curcumin +
    coef[2] * temperature +
    coef[3] * hours;

  const bounded = Math.max(0, Math.min(100, degradation));
  return bounded;
}

loadModel();
