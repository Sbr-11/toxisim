let currentStep = 1;
const totalSteps = 6;

function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.innerText = msg;
    toast.className = "toast show";
    setTimeout(()=>{toast.className="toast"},2000);
}

function nextStep() { 
    if(currentStep<totalSteps) {
        document.getElementById("step"+currentStep).classList.remove("active");
        currentStep++;
        document.getElementById("step"+currentStep).classList.add("active");
        showToast("Ready");
        if(currentStep===5) runPlots();
    }
}
function prevStep() { 
    if(currentStep>1) {
        document.getElementById("step"+currentStep).classList.remove("active");
        currentStep--;
        document.getElementById("step"+currentStep).classList.add("active");
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
        x: result.time, y: result.afm1,
        type:'scatter', mode:'lines+markers', name:'AFM1'
    }], {title:'AFM1 Degradation Over Time'});

    // Spider plot example (multi-param comparison)
    let data = [{
        type: 'scatterpolar',
        r: [curcuminDose, temp, adsDose],
        theta: ['Curcumin Dose', 'Temperature','Adsorbent Dose'],
        fill: 'toself'
    }];
    Plotly.newPlot('spiderPlot', data, {polar:{radialaxis:{visible:true}}, showlegend:false, title:'Reaction Parameters'});
    
    // Recommendations
    let rec = document.getElementById("recommendations");
    let k = 0.05 + 0.001*curcuminDose + 0.0005*temp + (adsorbent==='none'?0:0.01*adsDose);
    let AFM1_final = initialAFM1*Math.exp(-k*hours);
    rec.innerHTML = `<p>Estimated AFM1 after reaction: <b>${AFM1_final.toFixed(4)} µg/L</b></p>
    <p>Optimal dose estimation: Increase curcumin to 1.5× if AFM1 > 0.05 µg/L</p>
    <p>Recommended temperature: ${temp} °C</p>
    <p>Reaction time sufficient for significant degradation: ${hours} h</p>
    <p>Adsorbent effect: ${adsorbent==='none'?'No adsorbent':'Using '+adsorbent+' at '+adsDose+' g/L'} </p>
    <p>Mechanism: Primarily binding + adsorption based on curcumin and adsorbent.</p>`;
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
