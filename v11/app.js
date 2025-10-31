document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const step = tab.dataset.step;
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            contents.forEach(c => c.classList.remove("active"));
            document.getElementById(`tab-${step}`).classList.add("active");
        });
    });

    const nextButtons = document.querySelectorAll(".next-button");
    nextButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const nextStep = btn.dataset.next;
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelector(`.tab-button[data-step="${nextStep}"]`).classList.add("active");
            contents.forEach(c => c.classList.remove("active"));
            document.getElementById(`tab-${nextStep}`).classList.add("active");
        });
    });

    document.getElementById("runSimulationBtn").addEventListener("click", async () => {
        document.getElementById("simulationStatus").innerText = "Simulation running...";
        await runSimulation();
        document.getElementById("simulationStatus").innerText = "Simulation complete!";
    });

    document.getElementById("downloadReport").addEventListener("click", () => {
        generateReport();
    });
});
