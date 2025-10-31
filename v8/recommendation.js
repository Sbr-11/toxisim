export function generateRecommendations() {
    const container = document.getElementById("recommendations");
    container.innerHTML = `
    <ul>
        <li>Optimal curcumin dose for AFM1 reduction: 10–15 mg/L (based on simulated kinetics).</li>
        <li>Temperature: Room temperature (~25°C) is effective; higher temperatures accelerate reaction but may affect milk proteins.</li>
        <li>Time: 2–4 hours sufficient for binding/adsorption of AFM1.</li>
        <li>Adsorbents (activated charcoal, β-cyclodextrin) enhance AFM1 removal.</li>
        <li>Assays such as ELISA, HPLC are recommended for quantification.</li>
        <li>Reference: Khaneghah et al., 2019; Oliveira et al., 2020; Barua et al., 2025.</li>
    </ul>
    `;
}
