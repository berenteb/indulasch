# InduláSch for BKK FUTÁR (DEPRECATED, 2.0 is on the way)
![Version](https://img.shields.io/github/package-json/v/berenteb/bkk-nearby-departures?style=flat-square) ![Issues](https://img.shields.io/github/issues/berenteb/bkk-nearby-departures?style=flat-square)  
A responsive, minimalist and clean app to display nearby bus, tram, subway etc. departures. Made for Budapest.
Try it here: [InduláSch](https://indula.sch.bme.hu)
## Config
A config.json file is required with the following field(s):
```json
{
    "port": "webserver port",
    "debug_api_response": "bool, whether to save the API response to file"
}
```
## API
The server is using the BKK FUTÁR API through [Apiary](https://bkkfutar.docs.apiary.io/). It might be unofficial!  
**Update!**
BKK said that its official API will be published around Q3, 2021.
## Images
**Most images found in the client/svg folder belong to BKK!**
Some icons were found on Tabler Icons and they were free.
## Location
The app can determine your location, which is NOT saved on the server or in the browser. If you enable location in the app settings, you won't be able to manually edit the location or area fields. It can be turned off at the same place.
**Safari** does not allow location over HTTP, it needs HTTPS!
