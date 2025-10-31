function generateRecommendations(results) {
    const recDiv = document.getElementById('recommendations');
    const afm1_final = results.afm1[results.afm1.length-1];
    const curcumin_final = results.curcumin[results.curcumin.length-1];

    recDiv.innerHTML = `
    <h3>Simulation Insights:</h3>
    <ul>
        <li>Final AFM1 concentration: ${afm1_final.toFixed(4)} µg/L</li>
        <li>Curcumin remaining: ${curcumin_final.toFixed(2)} mg/L</li>
        <li>Optimal reaction temperature observed: ${results.temps[1]} °C</li>
        <li>Higher curcumin doses accelerate AFM1 degradation. Consider dose folds for stronger effect.</li>
        <li>Degradation kinetics suggests a binding/adsorption mechanism similar to literature (Fakhri et al., 2019; Khaneghah et al., 2019).</li>
    </ul>`;
}

function downloadReport() {
    const content = document.getElementById('recommendations').innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'AFM1_Simulation_Report.html';
    a.click();
}
