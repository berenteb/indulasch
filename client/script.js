var lat, lon, radius, area, locationEnabled, weatherBackgroundEnabled;
var settingsOpen = false;
// SCH
// const default_lat = "47.473443";
// const default_lon = "19.052844";
//Széll Kálmán tér
const default_lat = "47.506854";
const default_lon = "19.024788";
const default_radius = "150";
/**
 * Gets data from the server.
 * @returns Data in JSON
 */
function getData() {
    return new Promise((resolve, reject) => {
        if (locationEnabled) {
            navigator.geolocation.getCurrentPosition(async (geodata) => {
                fetch(location.href + "data", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ "lat": geodata.coords.latitude.toString(), "lon": geodata.coords.longitude.toString(), "radius": radius }) }).then(result => {
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
            fetch(location.href + "data", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify({ "lat": lat, "lon": lon, "radius": radius }) }).then(result => {
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
        if (data === "Hiba") {
            displayError("A szerver hibát dobott");
            return;
        }
        if (!Array.isArray(data.departures)) {
            displayError("Érvénytelen adat érkezett");
            return;
        }
        dismissError();
        document.getElementById("mainTitle").innerHTML = `${area === "" || locationEnabled ? data.areaName : area
            } környéke`;
        content.innerHTML = "";
        if (data.departures.length > 0) {
            data.departures.forEach((row) => {
                let departureTime = Math.floor(
                    (row.predicted * 1000 - Date.now()) / 60000
                );
                if (departureTime < 1) {
                    departureTime = "azonnal indul";
                } else departureTime += " perc";
                let html = `<div class="field">
                <div class="line fieldElement">
                    <img class="lineElement lineImg" src="./svg/${row.style.vehicleIcon.name}.svg"></img>
                    <div class="lineElement lineNumber ${row.style.icon.type.toLowerCase() || "box"}" style="background-color: #${row.style.color}; color: #${row.style.icon.textColor}">
                        <h3>${row.style.icon.text || "?"}</h3>
                    </div>
                    ${row.alert ? "<img class='lineElement lineImg' src='./svg/alert.svg'></img>" : ""}
                </div>
                <div class="destination fieldElement">
                    <p>${row.headsign}</p>
                </div>
                <div class="time fieldElement">
                    <p class="${row.isDelayed ? "delayed" : "onTime"}">${departureTime}</p>
                </div>
            </div>`;
                content.insertAdjacentHTML("beforeend", html);
            });
        } else {
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
    document.getElementById("app").style.opacity = "0.3;"
    document.getElementById("errorMessage").innerHTML = error;
    document.getElementById("errorContainer").style.display = "flex";
}
/**
 * Hides the error message.
 */
function dismissError() {
    document.getElementById("app").style.opacity = "1;"
    document.getElementById("errorContainer").style.display = "none";
}
/**
 * Reads data from input fields and saves them to localStorage and global variables.
 */
function saveData() {
    lat = document.getElementById("latInput").value;
    lon = document.getElementById("lonInput").value;
    radius = document.getElementById("radiusInput").value;
    area = document.getElementById("areaInput").value;
    locationEnabled = document.getElementById("locationCheckbox").checked;
    weatherBackgroundEnabled = document.getElementById("weatherBackgroundCheckbox").checked;
    if (lat == "" || lon == "") {
        lat = default_lat;
        lon = default_lon;
        document.getElementById("latInput").value = lat;
        document.getElementById("lonInput").value = lon;
    }
    if (radius == "") {
        radius = default_radius
        document.getElementById("radiusInput").value = radius;
    }
    localStorage.setItem("lat", lat.toString());
    localStorage.setItem("lon", lon.toString());
    localStorage.setItem("radius", radius.toString());
    localStorage.setItem("area", area);
    localStorage.setItem("locationEnabled", locationEnabled);
    localStorage.setItem("weatherBackgroundEnabled", weatherBackgroundEnabled);
    createFields();
}
/**
 * Reads data from localStorage and initializes global variables.
 */
function restoreData() {
    lat = localStorage.getItem("lat") || default_lat;
    lon = localStorage.getItem("lon") || default_lon;
    radius = localStorage.getItem("radius") || default_radius;
    area = localStorage.getItem("area") || "";
    locationEnabled = localStorage.getItem("locationEnabled") === "true";
    weatherBackgroundEnabled = localStorage.getItem("weatherBackgroundEnabled") === "true";
    if (locationEnabled) {
        disableLocationInput(true);
    }
    document.getElementById("latInput").value = lat;
    document.getElementById("lonInput").value = lon;
    document.getElementById("radiusInput").value = radius;
    document.getElementById("areaInput").value = area;
    document.getElementById("locationCheckbox").checked = locationEnabled;
    document.getElementById("weatherBackgroundCheckbox").checked = weatherBackgroundEnabled;
    if (weatherBackgroundEnabled) {
        handleWeatherBackgroundEnable();
    }
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
    if (settingsOpen) {
        settingsOpen = false;
        node.style.display = "none";
    } else {
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

/**
 * Weather Api
 */
function fetchWeather(){
    let url = new URL(location.href + "weather");
    url.search = new URLSearchParams({
        "lat" : lat,
        "lon" : lon,
    }).toString();
    (new Promise((resolve, reject) => {
        fetch(url, { method: "GET", headers: { "Content-Type": "application/json; charset='utf-8'" }}).then(result => {
            resolve(result.json());
        }).catch(err => {
            reject(err);
        });
    })).then(data => {
        //Weather Id names: https://openweathermap.org/weather-conditions
        renderWeather(String(data.weather[0].id));
        document.getElementById("titleTemp").innerText = Math.round(data.main.temp) + "°C";
    }).catch(err => {
        //TODO: proper error handle at weather client side
        console.log(err);
    });
}

function renderWeather(weatherId){
    //Weather Id names: https://openweathermap.org/weather-conditions
    let idMaps = [
        //800 -> Clear sky
        { regex: "800", url: "https://images.unsplash.com/photo-1464660439080-b79116909ce7?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1978&q=80" },
        //8xx -> Clouds
        { regex: "8\\d{2}", url: "https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1567&q=80" },
        //7xx -> Atmosphere
        { regex: "7\\d{2}", url: "https://images.unsplash.com/photo-1491824989090-cc2d0b57eb0d?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2764&q=80" },
        //6xx -> Snow
        { regex: "6\\d{2}", url: "https://images.unsplash.com/photo-1485594050903-8e8ee7b071a8?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80" },
        //5xx -> Rain
        { regex: "5\\d{2}", url: "https://images.unsplash.com/photo-1437624155766-b64bf17eb2ce?ixlib=rb-1.2.1&ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&auto=format&fit=crop&w=1950&q=80" },
        //3xx -> Drizzle
        { regex: "3\\d{2}", url: "https://images.unsplash.com/photo-1599738874797-d1632738da20?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" },
        //2xx -> Thunderstorm
        { regex: "2\\d{2}", url: "https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1951&q=80" },
    ];
    idMaps.some((id) => {
        if(weatherId.match(id.regex)){
            document.documentElement.style.setProperty('--weather-image', `url("${id.url}")`);
        }
        return weatherId.match(id.regex);
    });
}

function handleWeatherBackgroundEnable() {
    var weatherBackgroundCheckbox = document.getElementById("weatherBackgroundCheckbox");
    document.body.className = weatherBackgroundCheckbox.checked ? "weatherEnabled" : "";
}

window.onload = function () {
    restoreData();
    createFields();
    fetchWeather();
    setInterval(createFields, 1000 * 10);       //Fetch bkk info every 10s
    setInterval(fetchWeather, 1000 * 60 * 60);  //Fetch weather every hour
}