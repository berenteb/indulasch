# InduláSch for BKK FUTÁR
A responsive, minimalist and clean app to display nearby bus, tram, subway etc. departures. Made for Budapest.
## Config
```json
{
    "port": "webserver port"
}
```
## API
The server is using the BKK FUTÁR API through [Apiary](https://bkkfutar.docs.apiary.io/)
It might be unofficial!
**Update!**
BKK said that its official API will be published around Q3, 2021.
## Images
**Most images found in the client/svg folder belong to BKK!**
Some icons were found on Tabler Icons and they were free.
## Location
The app can determine your location, which is NOT saved on the server or in the browser. If you enable location in the app settings, you won't be able to manually edit the location or area fields. It can be turned off at the same place.
**Safari** does not allow location over HTTP, it needs HTTPS!