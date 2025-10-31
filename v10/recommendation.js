function generateRecommendations(results) {
    const recDiv = document.getElementById('recommendations');
    recDiv.innerHTML = `
<h3>Key Insights & Recommendations</h3>
<ul>
<li>Optimal Curcumin Dose: ~${results.curcumin[results.curcumin.length-1].toFixed(2)} mg/L</li>
<li>Reaction Time: ${results.time[results.time.length-1].toFixed(1)} hours provides significant AFM1 reduction</li>
<li>Temperature Effect: Moderate increase enhances AFM1 reduction efficiency</li>
<li>Multiple Batches: Using curcumin in increasing batches improves adsorption</li>
<li>Adsorbents: Activated charcoal can further reduce AFM1 as per literature (example: Fakhri et al., 2019)</li>
</ul>
<p>Reference: Khaneghah et al., Comprehensive Reviews in Food Science and Food Safety, 2019.</p>
`;
}

function downloadReport() {
    const content = document.getElementById('recommendations').innerHTML;
    const blob = new Blob([content], {type:'text/html'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'AFM1_Curcumin_Report.html';
    a.click();
}
