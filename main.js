/* Wetterstationen Tirol Beispiel */

let innsbruck = {
    lat: 47.267222,
    lng: 11.392778,
    zoom: 11
};

// WMTS Hintergrundlayer von https://lawinen.report (CC BY avalanche.report) als Startlayer
let startLayer = L.tileLayer("https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
    attribution: '&copy; <a href="https://lawinen.report">CC BY avalanche.report</a>'
})

// Overlays Objekt für die thematischen Layer
let overlays = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    humidity: L.featureGroup(),
    snowheight: L.featureGroup(),
    wind: L.featureGroup(),
};

// Karte initialisieren
let map = L.map("map", {
    center: [innsbruck.lat, innsbruck.lng],
    zoom: innsbruck.zoom,
    layers: [
        startLayer
    ],
});

// Layer control mit WMTS Hintergründen und Overlays
let layerControl = L.control.layers({
    "Relief avalanche.report": startLayer,
    "Esri World Imagery": L.tileLayer.provider("Esri.WorldImagery"),
}, {
    "Wetterstationen": overlays.stations,
    "Temperatur": overlays.temperature,
    "Relative Luftfeuchtigkeit": overlays.humidity,
    "Schneehöhe": overlays.snowheight,
    "Wind": overlays.wind
}).addTo(map);

// Layer control ausklappen
layerControl.expand();

// Maßstab control
L.control.scale({
    imperial: false
}).addTo(map);

// Fullscreen control
L.control.fullscreen().addTo(map);

// diesen layer beim Laden anzeigen
overlays.stations.addTo(map);

// Farben nach Wert und Schwellen ermitteln
let getColor = function (value, ramp) {
    // console.log(ramp); 
    for (let rule of ramp) {
        // console.log(rule)
        if (value >= rule.min && value <= rule.max) {
            return rule.color;
        }
    }
};
// console.log(getColor(-40, COLORS.temperature));

// undefined Werte aussortieren


// Wetterstationen mit Icons und Popup
let drawStations = function (geojson) {
    L.geoJson(geojson, {
        pointToLayer: function (geoJsonPoint, latlng) {
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
            // console.log(typeof (geoJsonPoint.properties.LT));

            let temp = ``
            if (typeof (geoJsonPoint.properties.LT) == "number") {
                temp = `Temperatur: ${geoJsonPoint.properties.LT}°C<br>`
            };
            let snow = ``
            if (typeof (geoJsonPoint.properties.HS) == "number") {
                snow = `Schneehöhe: ${geoJsonPoint.properties.HS}cm<br>`
            }
            let windspeed = ``
            if (typeof (geoJsonPoint.properties.WG) == "number") {
                windspeed = `Windgeschwindigkeit: ${geoJsonPoint.properties.WG * 3.6}km/h<br>`
            }
            let winddirection = ``
            if (typeof (geoJsonPoint.properties.WR) == "number") {
                winddirection = `Windrichtung: ${geoJsonPoint.properties.WR}°<br>`
            }
            let humidity = ``
            if (typeof (geoJsonPoint.properties.RH) == "number") {
                humidity = `Relative Luftfeuchtigkeit: ${geoJsonPoint.properties.RH}%<br>`
            }

            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong> (${geoJsonPoint.geometry.coordinates[2]}m ü.d.M.)<br>
                ${temp}
                ${snow}
                ${windspeed}
                ${winddirection}
                ${humidity}
                <a href="https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/dreitage/${geoJsonPoint.properties.plot}.png"  target="_blank">Wetterverlaufsgrafik</a>
                `;

            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: `icons/wifi.png`,
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.stations);
};

// Temperaturdaten
let drawTemperature = function (geojson) {
    L.geoJson(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.LT > -50 && geoJsonPoint.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.LT, COLORS.temperature);

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.LT.toFixed(1)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.temperature);
}

// Schneehöhen
let drawSnowheight = function (geojson) {
    L.geoJson(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.HS >= 0 && geoJsonPoint.properties.HS < 2000) {
                return true;
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.HS, COLORS.snowheight);

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}">${geoJsonPoint.properties.HS.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.snowheight);
}

// Windgeschwindigkeit
let drawWind = function (geojson) {
    L.geoJson(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.WG >= 0 && geoJsonPoint.properties.WR >= 0 /*&& geoJsonPoint.properties.WG < 300*/ ) {
                return true;
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.WG, COLORS.wind);
            let deg = geoJsonPoint.properties.WR

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}; transform: rotate(${deg}deg)"><i class="fa-solid fa-circle-arrow-up"></i>${geoJsonPoint.properties.WG.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.wind);
}

// relative Luftfeuchtigkeit
let drawHumidity = function (geojson) {
    L.geoJson(geojson, {
        filter: function (geoJsonPoint) {
            if (geoJsonPoint.properties.RH >= 0) {
                return true;
            }
        },
        pointToLayer: function (geoJsonPoint, latlng) {
            // L.marker(latlng).addTo(map)
            // console.log(geoJsonPoint.geometry.coordinates[2]);
            let popup = `
                <strong>${geoJsonPoint.properties.name}</strong><br>
                (${geoJsonPoint.geometry.coordinates[2]} m ü.d.M.)
            `;
            let color = getColor(geoJsonPoint.properties.RH, COLORS.humidity);

            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color}"> ${geoJsonPoint.properties.RH.toFixed(0)}</span>`
                })
            }).bindPopup(popup);
        }
    }).addTo(overlays.humidity);
}

// Wetterstationen
async function loadData(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    drawStations(geojson)
    drawTemperature(geojson)
    drawSnowheight(geojson)
    drawWind(geojson)
    drawHumidity(geojson)
}
loadData("https://static.avalanche.report/weather_stations/stations.geojson");

// Rainviewer
L.control.rainviewer({ 
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Stunde:",
    opacitySliderLabelText: "Transparenz:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);