function openStep(evt, stepName) {
    const tabs = document.getElementsByClassName("tabcontent");
    for (let tab of tabs) tab.style.display = "none";

    const tablinks = document.getElementsByClassName("tablink");
    for (let link of tablinks) link.classList.remove("active");

    document.getElementById(stepName).style.display = "block";
    evt.currentTarget.classList.add("active");
}

function nextStep(stepName) {
    const tablinks = document.getElementsByClassName("tablink");
    for (let link of tablinks) {
        if (link.textContent.includes(stepName.split("Step")[1])) {
            link.click();
            break;
        }
    }
}

async function runSimulation() {
    document.getElementById("simulationStatus").textContent = "Simulation running...";
    let progressBar = document.getElementById("progressBar");
    progressBar.style.width = "0%";

    const params = {
        sampleType: document.getElementById("sampleType").value,
        afm1Concentration: parseFloat(document.getElementById("afm1Concentration").value),
        curcuminDose: parseFloat(document.getElementById("curcuminDose").value),
        temperature: parseFloat(document.getElementById("temperature").value),
        time: parseFloat(document.getElementById("time").value),
        assay: document.getElementById("assayType").value
    };

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 95) clearInterval(interval);
        progressBar.style.width = Math.min(progress, 95) + "%";
    }, 200);

    const result = await runPythonSimulation(params);

    progressBar.style.width = "100%";
    document.getElementById("simulationStatus").textContent = "Simulation complete!";
    document.getElementById("graphContainer").innerHTML = "";
    document.getElementById("spiderContainer").innerHTML = "";
    plotResults(result);
    plotSpider(result);
    generateRecommendations(result);
}
