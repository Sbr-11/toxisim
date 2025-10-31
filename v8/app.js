let currentStep = 1;
const steps = document.querySelectorAll(".step-content");
const tabButtons = document.querySelectorAll(".tab-btn");

function showStep(step) {
    steps.forEach(s => s.classList.remove("active"));
    document.getElementById(`step-${step}`).classList.add("active");
    tabButtons.forEach(b => b.classList.remove("active"));
    document.querySelector(`.tab-btn[data-step="${step}"]`).classList.add("active");
}
showStep(currentStep);

// Next button functionality
document.querySelectorAll(".next-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentStep < 6) {
            currentStep++;
            showStep(currentStep);
            showAnimation("Done");
            if (currentStep === 5) runSimulation();
            if (currentStep === 6) generateRecommendations();
        }
    });
});

function showAnimation(msg) {
    const animDiv = document.createElement("div");
    animDiv.innerText = msg;
    animDiv.style.position = "fixed";
    animDiv.style.top = "20%";
    animDiv.style.left = "50%";
    animDiv.style.transform = "translateX(-50%)";
    animDiv.style.background = "#00cc66";
    animDiv.style.color = "white";
    animDiv.style.padding = "15px 30px";
    animDiv.style.borderRadius = "10px";
    animDiv.style.fontSize = "18px";
    animDiv.style.zIndex = 1000;
    document.body.appendChild(animDiv);
    setTimeout(() => animDiv.remove(), 1000);
}

// CSV Upload
let csvData = null;
document.getElementById("csv-upload").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
        const text = await file.text();
        csvData = parseCSV(text);
        console.log("CSV loaded:", csvData);
    }
});

function parseCSV(text) {
    const lines = text.split("\n").filter(l => l.trim() !== "");
    const headers = lines[0].split(",");
    const data = lines.slice(1).map(l => {
        const row = l.split(",");
        let obj = {};
        headers.forEach((h,i) => obj[h.trim()] = parseFloat(row[i]));
        return obj;
    });
    return data;
}

// Run simulation via py_runner
async function runSimulation() {
    const samples = csvData || [{sample:"Test", afm1:50, curcumin:100, temp:37, time:24, adsorbent:"None"}];
    const results = await runPythonSimulation(samples);
    runPlots(results);
}

// Plot results
function runPlots(results) {
    const plotDiv = document.getElementById("plots");
    plotDiv.innerHTML = "";
    results.forEach(r => {
        const div = document.createElement("div");
        div.style.width = "100%";
        div.style.height = "400px";
        plotDiv.appendChild(div);
        const trace = {
            x: r.time,
            y: r.afm1,
            mode: "lines+markers",
            name: r.sample
        };
        Plotly.newPlot(div, [trace], {title:`AFM1 degradation - ${r.sample}`});
    });
}
