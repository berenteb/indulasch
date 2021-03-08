const https = require("https");
const colors = require("colors");
const { URL } = require("url");
const fs = require("fs");
const express = require("express");
const config = require("./config.json");
const app = express();
const api_url = new URL("https://futar.bkk.hu/api/query/v1/ws/otp/api/where/arrivals-and-departures-for-location.json");
api_url.searchParams.append("lon", config.lon);
api_url.searchParams.append("lat", config.lat);
api_url.searchParams.append("clientLon", config.lon);
api_url.searchParams.append("clientLat", config.lat);
api_url.searchParams.append("minutesBefore", "0");
api_url.searchParams.append("limit", "30");
api_url.searchParams.append("groupLimit", "2");
api_url.searchParams.append("onlyDepartures", "true");
api_url.searchParams.append("radius", "150");

function getData() {
    return new Promise((resolve, reject) => {
        https.get(api_url, (res) => {
            var str = '';
            res.on('data', (chunk) => {
                str += chunk;
            })
            res.on('end', () => {
                var parsed = JSON.parse(str);
                var parsedData = parseData(parsed.data)
                // fs.writeFileSync("./result.json",str);
                parsedData.departures = sortData(parsedData.departures);
                if (parsedData !== false) {
                    resolve(parsedData);
                } else reject("Hiba");
            })
            res.on('error', (err) => {
                reject("Hiba");
            })
        });
    })
}

function sortData(array){
    let len = array.length;
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len-1; j++) {
            if (array[j].predicted > array[j + 1].predicted) {
                let tmp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = tmp;
            }
        }
    }
    return array;
}

function parseData(data) {
    var parsedData = {
        departures: []
    };
    try {
        data.list.forEach(element => {
            element.stopTimes.forEach(st=>{
                let record = {
                    type: data.references.routes[element.routeId].type,
                    line: data.references.routes[element.routeId].shortName,
                    headsign: st.stopHeadsign,
                    scheduled: st.departureTime,
                    predicted: st.predictedDepartureTime || st.departureTime,
                }
                parsedData.departures.push(record);
        })
            
        });
        return parsedData;
    } catch (error) {
        console.log("Nem sikerült formázni az adatot".red);
        return false;
    }
}

app.post("/data", (req, res) => {
    getData().then(result => {
        res.send(result);
    }).catch(err => {
        res.send(err);
    })
})

app.use(express.static("./client"));

app.listen(config.port, () => {
    console.log("Szerver elindult: " + config.port);
});
