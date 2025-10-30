// ml.js
// Loads ml_model.json and exports a predictEfficiency function (attached to window).

window.mlModel = null;

async function loadMLModel() {
  try {
    const resp = await fetch('ml_model.json', {cache: "no-store"});
    if (!resp.ok) throw new Error('Failed to fetch ml_model.json: ' + resp.status);
    const json = await resp.json();
    window.mlModel = json;
    console.log('ML model loaded:', json.model_name || 'unnamed');
    return json;
  } catch (err) {
    console.error('Error loading ML model:', err);
    // fallback default parameters if file missing
    window.mlModel = {
      parameters: { a_curcumin: 0.12, b_temperature: 0.045, c_interaction: 0.015, d_offset: 5.0 }
    };
    return window.mlModel;
  }
}

// predictEfficiency uses model parameters from mlModel (nonlinear regression)
async function predictEfficiency(curcumin_mgL, temperature_C, time_h = 24) {
  if (!window.mlModel) await loadMLModel();
  const p = window.mlModel.parameters;
  // ensure numeric
  const cur = Number(curcumin_mgL) || 0;
  const temp = Number(temperature_C) || 0;
  const t = Number(time_h) || 0;

  // Equation from ml_model.json:
  // eff = d + a*curcumin*ln(1+time) + b*temperature + c*curcumin*temperature/10
  const eff = p.d_offset
            + p.a_curcumin * cur * Math.log1p(t)
            + p.b_temperature * temp
            + p.c_interaction * cur * temp / 10;

  const effClamped = Math.max(window.mlModel.bounds?.min ?? 0, Math.min(window.mlModel.bounds?.max ?? 100, eff));
  return effClamped;
}

// Immediately begin loading model so predictEfficiency is fast later
loadMLModel();

// export to global
window.predictEfficiency = predictEfficiency;
