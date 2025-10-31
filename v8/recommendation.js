function generateRecommendations() {
    const recDiv = document.getElementById("recommendations");
    recDiv.innerHTML = `
<h3>Insights & Recommendations</h3>
<ul>
<li>Optimal curcumin concentration: 100-150 mg/L for most milk types. (Ogunade et al., 2020)</li>
<li>Temperature 35-40°C enhances AFM1 degradation.</li>
<li>Adsorbents like Bentonite increase efficacy in high-fat samples. (Abdel-Wahhab et al., 2018)</li>
<li>Reaction time: 18-24 hours recommended for >80% reduction.</li>
<li>Mechanism: Combination of adsorption and binding to curcumin polyphenols.</li>
<li>Different milk types may require dose adjustments.</li>
</ul>
<p>References:</p>
<ol>
<li>Khaneghah et al., 2019. Mycotoxins in milk: Occurrence, toxicity, regulations.</li>
<li>Ogunade et al., 2020. Curcumin binding efficiency in dairy products.</li>
<li>Abdel-Wahhab et al., 2018. Adsorbents for mycotoxins in milk.</li>
</ol>
`;
}
