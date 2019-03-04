/* Map of GeoJSON data from MegaCities.geojson */

//function to instantiate the Leaflet map
function createMap(){
    //create the map using the L.map method
    var map = L.map('mapid', {
        center: [20, 110],
        zoom: 4
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(map);

    //call getData function
    getData(map);
};

function onEachFeature(feature, layer) {
    //no property named popupContent; instead, create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties) {
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

function calcR(map,attrValue) {
	return Math.sqrt((attrValue * 0.5)/Math.PI) * 0.5
}

function createPropSymbols(data,map) {
	var attr = "gdp_2005"

	L.geoJson(data, {
		pointToLayer: function(feature,latlng) {
			var attrValue = Number(feature.properties[attr])
			console.log(feature.properties, attrValue);
			return L.circleMarker(latlng, 
			{
				fillColor: "#ff7800",
				color: "#00aa00",
				weight: 1,
				opacity: 1,
				fillOpacity: 0.8,
				radius: calcR(map,attrValue)
			})
		}
	}).addTo(map)
}

//function to retrieve the data and place it on the map
function getData(map){
    $.ajax("data/China_gdp.geojson", {
        /* specify the file format the ajax method is to call*/
        dataType: "json",
        success: function(response){
        	createPropSymbols(response,map)
        }
    })
}

$(document).ready(createMap);