const https = require("https");
const colors = require("colors");
const { URL } = require("url");
const fs = require("fs");
const express = require("express");
const config = require("./config.json");
const app = express();


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
                  // fs.writeFileSync("./result.json", str);
                  parsedData.departures = sortData(parsedData.departures);
                  resolve(parsedData);
                } else reject("Hiba");
            })
            res.on('error', (err) => {
                reject("Hiba");
            })
        });
    })
}

function sortData(array) {
    let len = array.length;
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len - 1; j++) {
            if (array[j].predicted > array[j + 1].predicted) {
                let tmp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = tmp;
            }
        }
    }
    return array;
}

function getAreaName(data) {
    try {
        let stopId = data.data.list[0].stopTimes[0].stopId;
        let junctionID = data.data.references.stops[stopId].parentStationId;
        return data.data.references.stops[junctionID].name;
    } catch (error) {
        return "Ismeretlen hely"
    }
}

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
