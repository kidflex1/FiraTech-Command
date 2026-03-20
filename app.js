// ==========================================
// 1. SPA NAVIGATION LOGIC (Tab Switching)
// ==========================================
const navItems = document.querySelectorAll('.nav-item');
const appViews = document.querySelectorAll('.app-view');
const pageTitle = document.getElementById('page-title');

navItems.forEach(item => {
    item.addEventListener('click', function() {
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        pageTitle.innerText = this.innerText;

        appViews.forEach(view => view.classList.remove('active-view'));
        const targetId = this.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active-view');

        // Fix Leaflet sizing bug when map tab becomes visible
        if (targetId === 'view-radar') {
            setTimeout(() => { map.invalidateSize(); }, 100);
        }
    });
});

// ==========================================
// 2. LEAFLET.JS MAP INIT & FLEET DATA
// ==========================================
const map = L.map('map').setView([6.5244, 3.3792], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

const fleetData = [
    { id: "Siana-Bot-01", dest: "Ikorodu Hub", status: "transit", coords: [6.6153, 3.5069] },
    { id: "Siana-Bot-02", dest: "Ikeja GRA", status: "transit", coords: [6.5918, 3.3515] },
    { id: "Cargo-TRK-X", dest: "Lekki Phase 1", status: "loading", coords: [6.4531, 3.4688] },
    { id: "AGV-Main", dest: "Repair Bay", status: "maintenance", coords: [6.4541, 3.3947] }
];

const tableBody = document.getElementById('fleet-data');
fleetData.forEach(unit => {
    let statusText = unit.status === "transit" ? "In Transit" : unit.status === "loading" ? "Loading" : "Maintenance";
    let row = `<tr>
        <td><strong>${unit.id}</strong></td>
        <td>${unit.dest}</td>
        <td><span class="badge ${unit.status}">${statusText}</span></td>
    </tr>`;
    tableBody.innerHTML += row;
});

const markers = [];
fleetData.forEach(unit => {
    let marker = L.marker(unit.coords).addTo(map);
    marker.bindPopup(`<b>${unit.id}</b><br>Status: ${unit.status}`);
    markers.push(marker);
});

// ==========================================
// 3. CHART.JS INIT (Telemetry Graph)
// ==========================================
const ctx = document.getElementById('batteryChart').getContext('2d');
let currentBattery = 84.0; // Starting battery %

const batteryChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [new Date().toLocaleTimeString()],
        datasets: [{
            label: 'Siana-Bot-01 Power Draw (%)',
            data: [currentBattery],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            pointBackgroundColor: '#10b981',
            fill: true,
            tension: 0.4 // Makes the line smooth/curvy
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 70, max: 90 } // Lock the Y axis to see the drop clearly
        }
    }
});

// ==========================================
// 4. THE LIVE SIMULATION LOOP
// ==========================================
// This runs every 2 seconds to move the bots AND update the chart
setInterval(() => {
    // A. Move the Maps
    fleetData.forEach((unit, index) => {
        if (unit.status === 'transit') {
            unit.coords[0] += (Math.random() - 0.5) * 0.002; 
            unit.coords[1] += (Math.random() - 0.5) * 0.002;
            markers[index].setLatLng(unit.coords);
        }
    });

    // B. Update the Telemetry Chart
    const timeNow = new Date().toLocaleTimeString();
    
    // Simulate slight battery drain (drop by 0.1 to 0.3%)
    currentBattery -= (Math.random() * 0.2 + 0.05); 
    
    // Add new data to chart
    batteryChart.data.labels.push(timeNow);
    batteryChart.data.datasets[0].data.push(currentBattery);
    
    // Keep only the last 10 data points on the screen so it scrolls
    if (batteryChart.data.labels.length > 10) {
        batteryChart.data.labels.shift();
        batteryChart.data.datasets[0].data.shift();
    }
    batteryChart.update();

    // C. Update Dashboard Texts
    document.getElementById('battery-text').innerText = currentBattery.toFixed(1) + '%';
    document.getElementById('latency-text').innerText = Math.floor(Math.random() * 10 + 10) + ' ms';

}, 2000);

// Topbar Clock
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);