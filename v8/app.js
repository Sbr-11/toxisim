let currentStep = 1;
const totalSteps = 6;

function updateTabs() {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelector(`.tab[data-step='${currentStep}']`).classList.add("active");
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.className = "toast show";
    setTimeout(()=>toast.className="toast",2000);
}

function nextStep() {
    if (currentStep < totalSteps) {
        document.getElementById("step" + currentStep).classList.remove("active");
        currentStep++;
        document.getElementById("step" + currentStep).classList.add("active");
        updateTabs();
        showToast("Ready");
        if (currentStep === 5) runPlots();
    }
}

function prevStep() {
    if (currentStep > 1) {
        document.getElementById("step" + currentStep).classList.remove("active");
        currentStep--;
        document.getElementById("step" + currentStep).classList.add("active");
        updateTabs();
        showToast("Done");
    }
}

async function runPlots() {
    let initialAFM1 = parseFloat(document.getElementById("initialAFM1").value);
    let curcuminDose = parseFloat(document.getElementById("curcuminDose").value);
    let temp = parseFloat(document.getElementById("temperature").value);
    let hours = parseFloat(document.getElementById("timeHours").value);
    let adsorbent = document.getElementById("adsorbentType").value;
    let adsDose = parseFloat(document.getElementById("adsorbentDose").value);

    const result = await runSimulation({initialAFM1, curcuminDose, temperature: temp, hours, adsorbentType: adsorbent, adsorbentDose: adsDose});

    Plotly.newPlot('afm1Plot',[{
        x: result.time, y: result.afm1, type:'scatter', mode:'lines+markers',
        name:'AFM1 Level', line:{color:'#32cd32'}
    }], {title:'AFM1 Degradation Over Time', xaxis:{title:'Time (h)'}, yaxis:{title:'AFM1 (µg/L)'}});

    // Dose–Response Graph
    let doses = [10, 25, 50, 75, 100];
    let reduction = doses.map(d => 1 - Math.exp(-0.001*d*hours));
    Plotly.newPlot('dosePlot',[{
        x:doses, y:reduction, type:'bar', marker:{color:'#1e90ff'}
    }], {title:'Dose-Response Efficiency', xaxis:{title:'Curcumin Dose (mg/L)'}, yaxis:{title:'Degradation Fraction'}});

    // Spider plot
    let data = [{
        type: 'scatterpolar',
        r: [curcuminDose/100, temp/50, adsDose/2],
        theta: ['Curcumin', 'Temperature', 'Adsorbent'],
        fill: 'toself',
        line:{color:'#ff7f50'}
    }];
    Plotly.newPlot('spiderPlot', data, {polar:{radialaxis:{visible:true, range:[0,1]}}, title:'Parameter Balance'});

    let rec = document.getElementById("recommendations");
    let k = 0.05 + 0.001*curcuminDose + 0.0005*temp + (adsorbent==='none'?0:0.01*adsDose);
    let AFM1_final = initialAFM1*Math.exp(-k*hours);
    rec.innerHTML = `
    <p><b>Estimated Final AFM1:</b> ${AFM1_final.toFixed(4)} µg/L</p>
    <p><b>Mechanism:</b> Likely combination of chemical binding and adsorption.</p>
    <p><b>Optimal Parameters:</b> ${curcuminDose} mg/L Curcumin, ${temp} °C, ${hours} h</p>
    <p><b>Additional Suggestion:</b> Using ${adsorbent} may enhance AFM1 removal by ${(adsorbent==='none'?'0':(adsDose*10).toFixed(1))}%</p>
    <p><b>Analytical Insight:</b> Choose high-sensitivity assay (LC–MS/MS or ELISA) for validation.</p>`;
}

function downloadReport() {
    let content = document.getElementById("recommendations").innerHTML;
    let blob = new Blob([content], {type: "text/html"});
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url; a.download = "toxisim_report.html";
    a.click();
    URL.revokeObjectURL(url);
}
