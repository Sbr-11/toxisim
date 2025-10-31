// recommendation.js

function generateRecommendations(simulationData) {
    const insights = [];
    const doseSteps = simulationData.dose_steps;
    const temperatures = simulationData.temperatures;
    const times = simulationData.time;

    // Simple analysis: find optimal dose and temperature
    let maxRemoval = 0;
    let optimalDose = 0;
    let optimalTemp = 0;
    for (let i = 0; i < doseSteps.length; i++) {
        for (let j = 0; j < temperatures.length; j++) {
            const removal = simulationData.removal[i][j]; // % removal
            if (removal > maxRemoval) {
                maxRemoval = removal;
                optimalDose = doseSteps[i];
                optimalTemp = temperatures[j];
            }
        }
    }

    insights.push(`✅ Maximum AFM1 reduction: ${maxRemoval.toFixed(2)}%`);
    insights.push(`💊 Optimal curcumin dose: ${optimalDose} mg/L`);
    insights.push(`🌡 Optimal reaction temperature: ${optimalTemp} °C`);
    insights.push(`⏱ Recommended reaction time: ${times[times.length - 1]} hours`);
    insights.push(
        `🧪 Observations: Higher curcumin doses increase AFM1 binding. Temperature affects kinetics, but very high temperatures may degrade curcumin.`
    );
    insights.push(
        `📌 Recommendation: Consider using additional adsorbents if required, follow proper assay selection, and optimize reaction parameters for each milk type.`
    );

    return insights;
}

// Generate downloadable report
function downloadReport(insights) {
    const content = insights.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "AFM1_simulation_report.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
