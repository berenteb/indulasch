var lat, lon, area;
var settingsOpen = false;

async function getData() {
    var result = await fetch(location.href+"data", { method: "POST", headers: {"Content-Type":"application/json"}, body:JSON.stringify({"lat":lat,"lon":lon}) });
    return result.json();
}

async function createFields() {
    var content = document.getElementById("content");
    getData().then(data => {
        if(data === "Hiba"){
            displayError("A szerver hibát dobott");
            return;
        }
        if (!Array.isArray(data.departures)){
            displayError("Érvénytelen adat érkezett");
            return;
        }
        dismissError();
        document.getElementById("mainTitle").innerHTML = `Közeli indulások: ${area === "" ? data.areaName : area} környéke`
        content.innerHTML = '';
        if(data.departures.length>0){
            data.departures.forEach(row => {
                let departureTime = Math.floor((row.predicted * 1000 - Date.now()) / 60000);
                if(departureTime < 1){
                    departureTime = "azonnal indul";
                }else departureTime += " perc";
                let html = `<div class="field">
                <div class="line fieldElement">
                    <img class="lineImg" src="./svg/${row.type}.svg"></img>
                    <div class="lineNumber ${row.type.toLowerCase()}Number ${row.type==="SUBWAY" || row.type==="RAIL"?row.line.toLowerCase()+'LineNumber':''}">
                        <p>${row.type === "SUBWAY" || row.type === "RAIL" ? row.line.charAt(1) : row.line}</p>
                    </div>
                </div>
                <div class="destination fieldElement">
                    <p>${row.headsign}</p>
                </div>
                <div class="time fieldElement">
                    <p>${departureTime}</p>
                </div>
            </div>`
            content.insertAdjacentHTML("beforeend", html);
            });
        }else{
            let html = `<p>Nincs a közelben indulás</p>`;
            content.insertAdjacentHTML("beforeend", html);
        }
    }).catch(err=>{
        displayError("Megszakadt a kapcsolat a szerverrel!");
    })
}

function displayError(error) {
    document.getElementById("app").style.opacity="0.3;"
    document.getElementById("errorMessage").innerHTML = error;
    document.getElementById("errorContainer").style.display = "flex";
}

function dismissError() {
    document.getElementById("app").style.opacity="1;"
    document.getElementById("errorContainer").style.display = "none";
}

function saveData() {
    lat = document.getElementById("latInput").value;
    lon = document.getElementById("lonInput").value;
    area = document.getElementById("areaInput").value;
    localStorage.setItem("lat", lat.toString());
    localStorage.setItem("lon", lon.toString());
    localStorage.setItem("area", area);
}

function restoreData() {
    lat = localStorage.getItem("lat") || "47.489612";
    lon = localStorage.getItem("lon") || "19.062144";
    area = localStorage.getItem("area") || "";
    document.getElementById("latInput").value = lat;
    document.getElementById("lonInput").value = lon;
    document.getElementById("areaInput").value = area;
}

function toggleSettings() {
    let node = document.getElementById("settingsPanelContainer");
    if(settingsOpen){
        settingsOpen = false;
        node.style.display = "none";
    }else{
        settingsOpen = true;
        node.style.display = "flex";
    }
}

window.onload = function () {
    restoreData();
    createFields();
    setInterval(createFields, 10000);
}