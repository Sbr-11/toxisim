// ml.js (module-style functions used by app.js)
// Loads ml_model.json and exposes predictEfficiency()
// Use fetch + simple deterministic equation (explainable)

export async function loadMlModel() {
  try {
    const res = await fetch('ml_model.json', {cache:'no-store'});
    if (!res.ok) throw new Error('ml_model.json not found');
    const json = await res.json();
    window.ToxiSim_ml = json;
    console.log('ML model loaded:', json.model_name);
    return json;
  } catch (err) {
    console.warn('ml_model.json load failed, using defaults', err);
    const defaultModel = { parameters: { a_curcumin:0.12, b_temperature:0.045, c_interaction:0.015, d_offset:5.0 } };
    window.ToxiSim_ml = defaultModel;
    return defaultModel;
  }
}

export async function predictEfficiency(curcumin_mgL, temperature_C, time_h = 24) {
  if (!window.ToxiSim_ml) await loadMlModel();
  const p = window.ToxiSim_ml.parameters;
  const cur = Number(curcumin_mgL) || 0;
  const temp = Number(temperature_C) || 0;
  const t = Number(time_h) || 0;
  const eff = p.d_offset
            + p.a_curcumin * cur * Math.log1p(t)
            + p.b_temperature * temp
            + p.c_interaction * cur * temp / 10;
  return Math.max(0, Math.min(100, eff));
}
