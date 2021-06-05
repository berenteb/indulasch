const https = require("https");
const ejs = require("ejs");
const colors = require("colors");
const { URL } = require("url");
const fs = require("fs");
const express = require("express");
const config = require("./config.json");
const app = express();
const weather = require("./weather.js");
const path = require("path");
/**
 * Express settings
 */
app.set('view engine', 'ejs');
app.use(express.static("./client"));
/**
 *
 * @param {string} lat Latitude of location.
 * @param {string} lon Longitude of location.
 * @param {string} radius Radius for departures.
 * @returns The generated URL with query params.
 */
function getUrl(lat, lon, radius) {
    let api_url = new URL("https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-location.json");
    api_url.searchParams.append("lon", lon);
    api_url.searchParams.append("lat", lat);
    api_url.searchParams.append("clientLon", lon);
    api_url.searchParams.append("clientLat", lat);
    api_url.searchParams.append("minutesBefore", "0");
    api_url.searchParams.append("limit", "30");
    api_url.searchParams.append("groupLimit", "1");
    api_url.searchParams.append("onlyDepartures", "true");
    api_url.searchParams.append("radius", radius);
    return api_url;
}

/**
 *
 * @param {string} lat Latitude of location.
 * @param {string} lon Longitude of location.
 * @param {string} radius Radius for departures.
 * @returns Promise with the https request. Resolves if data is received and is in the correct format, rejects if any error happened.
 */
function getData(lat, lon, radius) {
    return new Promise((resolve, reject) => {
        https.get(getUrl(lat, lon, radius), { headers: { "Content-Type": "application/json; charset='utf-8'" } }, (res) => {
            var str = '';
            res.on('data', (chunk) => {
                str += chunk;
            })
            res.on('end', () => {
                var parsed = JSON.parse(str);
                var parsedData = parseData(parsed.data)
                if (parsedData !== false) {
                    parsedData.areaName = getAreaName(parsed);
                    // DEBUG Area
                    if (config.debug_api_response) fs.writeFileSync("./result.json", str);
                    //Sort data based on predicted departure
                    parsedData.departures.sort((x, y) => x.predicted > y.predicted ? 1 : -1);
                    resolve(parsedData);
                } else reject("Hiba");
            })
            res.on('error', (err) => {
                reject("Hiba");
            })
        });
    })
}
/**
 *
 * @param {object} data The received data from the API.
 * @returns The area name as string if available, else returns "Ismeretlen hely"
 */
function getAreaName(data) {
    try {
        let stopId = data.data.list[0].stopTimes[0].stopId;
        let junctionID = data.data.references.stops[stopId].parentStationId;
        return data.data.references.stops[junctionID].name;
    } catch (error) {
        return "Ismeretlen hely"
    }
}
/**
 *
 * @param {object} data The received data from the API.
 * @returns The object with the neccessary data for the front-end, returns false if it fails.
 */
function parseData(data) {
    var parsedData = {
        departures: []
    };
    try {
        data.list.forEach(element => {
            element.stopTimes.forEach(st => {
                let record = {
                    type: data.references.routes[element.routeId].type,
                    style: data.references.routes[element.routeId].style,
                    headsign: st.stopHeadsign,
                    scheduled: st.departureTime,
                    predicted: st.predictedDepartureTime || st.departureTime,
                    alert: st.alertIds !== undefined
                };
                record.isDelayed = record.predicted - record.scheduled > 180;
                let departureText = Math.floor(
                    (record.predicted * 1000 - Date.now()) / 60000
                );
                if (departureText < 1) {
                    departureText = "azonnal indul";
                } else departureText += " perc";
                record.departureText = departureText;
                parsedData.departures.push(record);
            })

        });
        return parsedData;
    } catch (error) {
        console.log("Nem sikerült formázni az adatot".red);
        return false;
    }
}

app.use(express.json());
/**
 * For API usability
 */
app.post("/data", (req, res) => {
    if (req.body.lat && req.body.lon && req.body.radius) {
        getData(req.body.lat, req.body.lon, req.body.radius).then(result => {
            res.send(result);
        }).catch(err => {
            console.log(err.red);
            res.send({ error: err });
        })
    } else {
        res.send({ error: "Rossz lekérdezés" })
    }
});
/**
 * For app usability, sends HTML code
 */
app.post("/htmldata", (req, res) => {
    if (req.body.lat && req.body.lon && req.body.radius) {
        getData(req.body.lat, req.body.lon, req.body.radius).then(result => {
            let html;
            try {
                html = ejs.render(fs.readFileSync(__dirname + "/views/field.ejs", "utf-8"), result, { views: ["./views"] });
            } catch (err) {
                throw "Mezőleképezési hiba";
            }
            res.send(html);
        }).catch(err => {
            console.log(err.red);
            res.send("<h2><i>Hiba történt, kérlek jelezd a fejlesztőknek!</i></h2>");
        })
    } else {
        res.send("<h2><i>Rossz lekérdezés</i></h2>")
    }
});
/**
 * Get area name
 */
 app.post("/area", (req, res) => {
    if (req.body.lat && req.body.lon && req.body.radius) {
        getData(req.body.lat, req.body.lon, req.body.radius).then(result => {
            res.send(result.areaName);
        }).catch(err => {
            console.log(err.red);
            res.send("Hibás hely");
        })
    } else {
        res.send("Hibás hely")
    }
});
app.get("/weather", (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.query.lat && req.query.lon) {
        weather.getWeather(req.query.lat, req.query.lon).then(result => {
            res.send(result);
        })
    } else {
        res.send({ error: "Latitude vagy Longitude hiányzik" });
    }
});

if (config.use_https) {
    const options = {
        key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
      };
    https.createServer(options, app).listen(config.port, () => {
        console.log("Szerver elindult: " + config.port);
    })
} else {
    app.listen(config.port, () => {
        console.log("Szerver elindult: " + config.port);
    });
}
