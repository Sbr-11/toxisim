export function generateRecommendations(results) {
  let rec = '<ul>';
  rec += '<li>Curcumin doses reduce AFM1 exponentially with time.</li>';
  rec += '<li>Higher temperatures accelerate degradation.</li>';
  rec += '<li>Use multiple batches with increasing doses to optimize removal.</li>';
  rec += '<li>Adsorbents enhance removal in certain matrices.</li>';
  rec += '<li>Suggested assays: choose based on sample type for accuracy.</li>';
  rec += '<li>Consult literature for safety and maximum allowed residual AFM1 (Khaneghah et al., 2019).</li>';
  rec += '</ul>';
  return rec;
}
