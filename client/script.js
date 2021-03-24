var lat, lon, area, locationEnabled;
var settingsOpen = false;
/**
 * Gets data from the server.
 * @returns Data in JSON
 */
function getData() {
    return new Promise((resolve, reject) => {
        if (locationEnabled) {
            navigator.geolocation.getCurrentPosition(async (geodata) => {
                fetch(location.href + "data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ "lat": geodata.coords.latitude.toString(), "lon": geodata.coords.longitude.toString() }) }).then(result => {
                    resolve(result.json());
                }).catch(err => {
                    console.log(err);
                    reject("Lekérdezési hiba")
                });
            }, () => {
                locationEnabled = false;
                document.getElementById("locationCheckbox").checked = locationEnabled;
                localStorage.setItem("locationEnabled", locationEnabled);
                reject("Helymeghatározási hiba");
            });
        } else {
            fetch(location.href + "data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ "lat": lat, "lon": lon }) }).then(result => {
                resolve(result.json());
            }).catch(err => {
                console.log(err);
                reject("Lekérdezési hiba");
            });
        }    
    })
}
/**
 * Main functionality. Makes a request and generates the data fields (records), and then loads it to the HTML.
 */
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
        document.getElementById("mainTitle").innerHTML = `${
          area === "" || locationEnabled ? data.areaName : area
        } környéke`;
        content.innerHTML = '';
        if(data.departures.length>0){
            data.departures.forEach(row => {
                let departureTime = Math.floor((row.predicted * 1000 - Date.now()) / 60000);
                if(departureTime < 1){
                    departureTime = "azonnal indul";
                }else departureTime += " perc";
                let html = `<div class="field">
                <div class="line fieldElement">
                    <img class="lineImg" src="./svg/${
                      row.style.vehicleIcon.name
                    }.svg"></img>
                    <div class="${
                      row.style.icon.type.toLowerCase() || "box"
                    }" style="background-color: #${row.style.color}; color: #${
                  row.style.icon.textColor
                }">
                        <p>${row.style.icon.text || "?"}</p>
                    </div>
                    ${
                      row.alert
                        ? "<img class='lineImg' src='./svg/alert.svg'></img>"
                        : ""
                    }
                </div>
                <div class="destination fieldElement">
                    <p>${row.headsign}</p>
                </div>
                <div class="time fieldElement">
                    <p class="${
                      row.isDelayed ? "delayed" : "onTime"
                    }">${departureTime}</p>
                </div>
            </div>`;
            content.insertAdjacentHTML("beforeend", html);
            });
        }else{
            let html = `<p>Nincs a közelben indulás</p>`;
            content.insertAdjacentHTML("beforeend", html);
        }
    }).catch(err => {
        displayError(err);
    })
}
/**
 * Displays an error message. This message can be dismissed by script or by tapping/clicking the error message.
 * @param {string} error The error message to be displayed.
 */
function displayError(error) {
    document.getElementById("app").style.opacity="0.3;"
    document.getElementById("errorMessage").innerHTML = error;
    document.getElementById("errorContainer").style.display = "flex";
}
/**
 * Hides the error message.
 */
function dismissError() {
    document.getElementById("app").style.opacity="1;"
    document.getElementById("errorContainer").style.display = "none";
}
/**
 * Reads data from input fields and saves them to localStorage and global variables.
 */
function saveData() {
    lat = document.getElementById("latInput").value;
    lon = document.getElementById("lonInput").value;
    area = document.getElementById("areaInput").value;
    locationEnabled = document.getElementById("locationCheckbox").checked;
    localStorage.setItem("lat", lat.toString());
    localStorage.setItem("lon", lon.toString());
    localStorage.setItem("area", area);
    localStorage.setItem("locationEnabled", locationEnabled);
    createFields();
}
/**
 * Reads data from localStorage and initializes global variables.
 */
function restoreData() {
    lat = localStorage.getItem("lat") || "47.489612";
    lon = localStorage.getItem("lon") || "19.062144";
    area = localStorage.getItem("area") || "";
    locationEnabled = localStorage.getItem("locationEnabled");
    if (locationEnabled === undefined || locationEnabled === null || locationEnabled === "false") {
        locationEnabled = false;
    } else if(locationEnabled === "true"){
        disableLocationInput(true);
    }
    document.getElementById("latInput").value = lat;
    document.getElementById("lonInput").value = lon;
    document.getElementById("areaInput").value = area;
    document.getElementById("locationCheckbox").checked = locationEnabled;
}
/**
 * 
 * @param {boolean} bool 
 * Disabled or re-enables the location input fields.
 */
function disableLocationInput(bool) {
    document.getElementById("latInput").disabled = bool;
    document.getElementById("lonInput").disabled = bool;
    document.getElementById("areaInput").disabled = bool;
}
/**
 * Opens or hides settings
 */
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
/**
 * Is called when the user clicks the locationEnable checkbox.
 */
function handleLocationEnableChange() {
    var locationCheckbox = document.getElementById("locationCheckbox");
    var value = locationCheckbox.checked;
    if (value) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(console.log, console.log)
            disableLocationInput(true);
        } else {
            alert("Helymeghatározás nem lehetséges")
            locationEnabled = false;
            locationCheckbox.checked = false;
        }
    } else {
        disableLocationInput(false);
    }
}

window.onload = function () {
    restoreData();
    createFields();
    setInterval(createFields, 10000);
}