// ml.js
window.MLModel = null;

async function loadMlModel() {
  try {
    const r = await fetch('ml_model.json', {cache:'no-store'});
    if (!r.ok) throw new Error('ml_model.json not found');
    window.MLModel = await r.json();
    console.log('ML model loaded:', window.MLModel.model_name);
  } catch (e) {
    console.warn('Could not load ml_model.json, falling back to defaults.', e);
    window.MLModel = { parameters: { a_curcumin:0.12, b_temperature:0.045, c_interaction:0.015, d_offset:5.0 } };
  }
}
loadMlModel();

async function predictEfficiency(curcumin_mgL, temperature_C, time_h = 24) {
  if (!window.MLModel) await loadMlModel();
  const p = window.MLModel.parameters;
  const cur = Number(curcumin_mgL) || 0;
  const temp = Number(temperature_C) || 0;
  const t = Number(time_h) || 0;

  const eff = p.d_offset
            + p.a_curcumin * cur * Math.log1p(t)
            + p.b_temperature * temp
            + p.c_interaction * cur * temp / 10;

  const clamped = Math.max(0, Math.min(100, eff));
  return clamped;
}

// expose globally
window.predictEfficiency = predictEfficiency;
