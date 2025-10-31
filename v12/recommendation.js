// recommendation.js

function generateRecommendations(result) {
    if (!result || !result.data) {
        document.getElementById("recommendationContainer").innerHTML = "<p>Error: No simulation data found.</p>";
        return;
    }

    const avgAFM1 = result.data.reduce((sum, d) => sum + d["AFM1 (mg/L)"], 0) / result.data.length;
    const bindingEff = result.data[0]["Binding Efficiency (%)"];
    const adsorption = result.data[0]["Adsorption Rate"];

    let recommendationText = `
        <h3>Simulation Summary</h3>
        <p><strong>Sample:</strong> ${result.sample.replace(/([A-Z])/g, ' $1')}</p>
        <p><strong>Assay Type:</strong> ${result.assay}</p>
        <p><strong>Temperature:</strong> ${result.temperature} °C</p>
        <p><strong>Curcumin Dose:</strong> ${result.dose} mg/L</p>
        <p><strong>Mean AFM1 Concentration:</strong> ${avgAFM1.toFixed(3)} mg/L</p>
        <p><strong>Binding Efficiency:</strong> ${bindingEff.toFixed(2)}%</p>
        <p><strong>Adsorption Rate:</strong> ${adsorption.toFixed(2)}</p>

        <h3>Insights</h3>
        <ul>
            <li>Higher curcumin doses increase binding and adsorption rates significantly up to a plateau near 90% efficiency.</li>
            <li>Optimal temperature for curcumin reactivity is between 30–40°C; higher temperatures may lead to degradation of curcumin [<a href="https://doi.org/10.1016/j.foodchem.2020.127006" target="_blank">Anand et al., 2020</a>].</li>
            <li>Milk fat content can affect AFM1 binding — full-fat milk shows slightly lower efficiency than skimmed milk [<a href="https://doi.org/10.1016/j.foodcont.2018.04.024" target="_blank">Khaneghah et al., 2018</a>].</li>
            <li>For yogurt and cheese matrices, curcumin’s adsorption kinetics are slower but more stable during refrigerated storage.</li>
            <li>It is recommended to maintain treatment time between 2–4 hours for best detoxification outcomes.</li>
        </ul>

        <h3>Recommendations</h3>
        <ul>
            <li>Use curcumin concentrations between 40–60 mg/L for moderate AFM1 contamination levels (≤0.5 mg/L).</li>
            <li>Maintain controlled temperature at ~35°C for maximal activity.</li>
            <li>Additional adsorbents like β-cyclodextrin or chitosan may improve binding stability in liquid matrices.</li>
            <li>Validate results experimentally via HPLC or ELISA assay methods.</li>
        </ul>
    `;

    document.getElementById("recommendationContainer").innerHTML = recommendationText;
}

function downloadReport() {
    const content = document.getElementById("recommendationContainer").innerHTML;
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AFM1_Simulation_Report.html";
    link.click();
}
