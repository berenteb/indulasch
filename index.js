const https = require("https");
const colors = require("colors");
const { URL } = require("url");
const fs = require("fs");
const express = require("express");
const config = require("./config.json");
const app = express();
/**
 *
 * @param {string} lat Latitude of location.
 * @param {string} lon Longitude of location.
 * @returns The generated URL with query params.
 */
function getUrl(lat, lon) {
    let api_url = new URL("https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-location.json");
    api_url.searchParams.append("lon", lon);
    api_url.searchParams.append("lat", lat);
    api_url.searchParams.append("clientLon", lon);
    api_url.searchParams.append("clientLat", lat);
    api_url.searchParams.append("minutesBefore", "0");
    api_url.searchParams.append("limit", "30");
    api_url.searchParams.append("groupLimit", "1");
    api_url.searchParams.append("onlyDepartures", "true");
    api_url.searchParams.append("radius", "150");
    return api_url;
}

/**
 *
 * @param {string} lat Latitude of location.
 * @param {string} lon Longitude of location.
 * @returns Promise with the https request. Resolves if data is received and is in the correct format, rejects if any error happened.
 */
function getData(lat, lon) {
    return new Promise((resolve, reject) => {
        https.get(getUrl(lat, lon), (res) => {
            var str = '';
            res.on('data', (chunk) => {
                str += chunk;
            })
            res.on('end', () => {
                var parsed = JSON.parse(str);
                var parsedData = parseData(parsed.data)
                if (parsedData !== false) {
                    parsedData.areaName = getAreaName(parsed);
                    // Uncomment the following line while debugging the API response!
                    // fs.writeFileSync("./result.json", str);
                    // Sort data based on predicted departure time
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

app.post("/data", (req, res) => {
    if (req.body.lat && req.body.lon) {
        getData(req.body.lat, req.body.lon).then(result => {
            res.send(result);
        }).catch(err => {
            res.send("Hiba");
        })
    } else {
        res.send("Koordinátákat nem kapott.")
    }
})

app.use(express.static("./client"));

app.listen(config.port, () => {
    console.log("Szerver elindult: " + config.port);
});
