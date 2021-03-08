async function getData() {
    var result = await fetch("http://localhost:3000/data", { method: "POST", headers: {"Content-Type":"application/json"} })
    return result.json();
}

async function createFields() {
    var content = document.getElementById("content");
    getData().then(data => {
        if (!Array.isArray(data.departures)) return;
        content.innerHTML = '';
        data.departures.forEach(row => {
            let departureTime = Math.floor((row.predicted * 1000 - Date.now()) / 60000);
            if(departureTime < 1){
                departureTime = "azonnal indul";
            }else departureTime += " perc";
            let html = `<div class="field">
            <div class="line fieldElement">
                <img class="lineImg" src="./svg/${row.type}.svg"></img>
                <div class="lineNumber ${row.type.toLowerCase()}Number ${row.type==="SUBWAY"?row.line.toLowerCase()+'LineNumber':''}">
                    <p>${row.type === "SUBWAY" ? row.line.charAt(1) : row.line}</p>
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
    });
}

window.onload = function () {
    createFields();
    setInterval(createFields, 10000);
}