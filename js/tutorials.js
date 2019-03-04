/* Example from Leaflet Quick Start Guide*/

/* declare the map layer as mymap, link it to 'mapid' in index.html, and set the initial coordinates and zoom level of the map */
var mymap = L.map('mapid').setView([51.48, -0.09], 13);

//add tile layer...replace project id and accessToken with your own
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoidi12bGFzdG9rIiwiYSI6ImNqczk4NXUybjEzajg0NHFjbTEwa2c0djAifQ.1J0BWmkLlB5n1iOFfuQ1Uw'
}).addTo(mymap);

/* set up a marker on the map with the variable marker, define a coordinates and add the marker to the map */
var marker = L.marker([51.5, -0.09]).addTo(mymap);

/* set up a circle on the map with the parameter circle, format the circle, and add it to the map */ 
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(mymap);

/* coordinates of three points form a trianglular polygon */
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(mymap);

/* add popup info to the marker, circle, polygon when the user clicks on each feature */
marker.bindPopup("<strong>Hello world!</strong><br />I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

/* format a standalone popup that is not binded to any feature */
var popup = L.popup()
.setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(mymap);

var popup = L.popup();

/* print the information of clicked location on the map */
function onMapClick(e) {
    popup
        /* set attributes of popup: setLatLng sets the latitude and longitude of the popup to be the coordinates of the point clicked by user */
        .setLatLng(e.latlng)
        /* set the content of the popup as the info displaying coordinates of the click point */
        .setContent("You clicked the map at " + e.latlng.toString())
        /* enables popup on the map */
        .openOn(mymap);
}

/* call the .on method */
mymap.on('click', onMapClick);