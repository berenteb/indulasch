const https = require("https");

/*
  Get the weather data from a latitude and longitude position
 */

exports.getWeather = (lat, lon) => {
  const apiKey = "4d8fb5b93d4af21d66a2948710284366";
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  return new Promise((resolve, reject) => {
    https.request(url, { headers: { "Content-Type": "application/json; charset='utf-8'" } },  (res) => {
      var str = '';
      res.on('data', (chunk) => {
        str += chunk;
      });
      res.on('end', () => {
        resolve(str);
      });
      res.on('error', () => {
        reject("Error while fetching weather api");
      });
    }).end();
  });
};

