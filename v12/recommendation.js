// === recommendation.js ===
// Generates tailored suggestions after the simulation results are displayed.

function generateRecommendations(data) {
  const box = document.getElementById("recommendationBox");
  box.innerHTML = "";

  const avgEff = data.efficiency_avg;
  const finalAFM1 = data.final_afm1;

  let msg = `<h3>Simulation Summary</h3>
  <p><strong>Average Adsorption Efficiency:</strong> ${avgEff.toFixed(2)}%</p>
  <p><strong>Final AFM1 Concentration:</strong> ${finalAFM1.toFixed(3)} µg/L</p>`;

  let recs = [];

  if (avgEff < 60) {
    recs.push("Increase curcumin concentration or reaction time to enhance adsorption efficiency.");
  } else if (avgEff < 85) {
    recs.push("Current parameters yield moderate detoxification — consider optimizing pH or using an adsorbent such as activated carbon.");
  } else {
    recs.push("Excellent reduction achieved — parameters are near optimal for AFM1 detoxification.");
  }

  if (finalAFM1 > 0.05) {
    recs.push("AFM1 concentration remains above safe limits — reprocessing is recommended.");
  } else {
    recs.push("AFM1 concentration is within regulatory safety limits (EU: 0.05 µg/L).");
  }

  recs.push("Further validation via LC-MS/MS or HPLC recommended for quantification accuracy.");

  const listHTML = recs.map(r => `<li>${r}</li>`).join("");
  box.innerHTML = `${msg}<h3>Recommendations</h3><ul>${listHTML}</ul>`;
}
