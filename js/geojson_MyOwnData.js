/* Map of GeoJSON data from MegaCities.geojson */
// WARNING: 1. Do not use the 'select again' button. Data cannot be successfully retrieved after clicking this button, and 
// I have not yet found out where the bug is. Please triple click the image to reset selection.

// Declare global variables
var yrSelectedArr = new Array
var circle2
var markerG = new Array
var data2Yrs = new Array

//function to instantiate the Leaflet map
function createMap() {
    //create the map using the L.map method
    var map = L.map('map', {
    	center: [35, 110],
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
	// calculate
	return Math.sqrt((attrValue * 0.5)/Math.PI) * 0.8
}

function processData(data) {
	var attributes = new Array
	
	// get properties in geojson
	var properties = data.features[0].properties

	// from the properties dict get all items with keys having word 'gdp' and add it to 'attributes' list
	for (var attribute in properties) {
		if (attribute.includes('gdp')) {
			attributes.push(attribute)
		}
	}
	//return a list of key names as titles of gdp value
	return attributes
}

function pointToLayer(map, feature,latlng,attributes) {
	// get the key name of the first item: gdp for 1980
	var attr = attributes[0]

	// get actual value of gdp of 1980
	var attrValue = Number(feature.properties[attr])

	// formatting circle marker
	var options = {
		fillColor: "#ff7800",
		color: "#00aa00",
		weight: 1,
		opacity: 1,
		fillOpacity: 0.6,
		radius: calcR(map,attrValue)
	}


	// "Circle-Marker" layer is added as a leaflet layer
	var cmLayer = L.circleMarker(latlng,options)

	// initial popup content only shows names of administrative divisions
	var popupCntnt = feature.properties.Admin_division

	// popup is bindeed to "Circle Marker" layer, with an offset to the position on screen that is clicked by the user
	cmLayer.bindPopup(popupCntnt, {
		offset: new L.Point(0, -options.radius),
		closeButton: false
	})

	// "Circle Marker" layer opens and closes popup per different input event
	cmLayer.on({
		mouseover: function() {
			this.openPopup()
		},
		mouseout: function() {
			this.closePopup()
		},
	})
	// return "Circle Marker" layer to createPropSymbols
	return cmLayer
}

function createPropSymbols(data, map, attributes) {
	L.geoJson(data, {
		pointToLayer: function(feature,latlng) {
			// In order to set Layer as the only parametre, pointToLayer function is used to add the "Circle Marker" layer
			// as a parameter
			return pointToLayer(map, feature, latlng, attributes)
		}	
	}).addTo(map)
}

function updatePanelContent(admin, year, gdp) {
	// display information of the administrative division clicked by the user and display the information on panel
	$('#updatable').remove()
	var panelCntnt = '<div id="updatable"><p id="updatable-admin"><b>Administrative division: </b><br>' + admin + 
		'</p>' + '<p id="updatable-gdp"><b>GDP(ppp) per capita in year ' + year + ': </b><br>' + gdp + 
		' USD<br></p>' + '</div>'
	$('#panel').append(panelCntnt)
}

function updatePropSymbols(map, attribute) {
	// map.eachLayer is used to iterate through each single Circle Marker
	map.eachLayer(function(layer) {
		// proceed if feature, and properties with the name of attribute(the column name that starts with "gdp_") exist
		// in this layer (represented by this Circle Marker)
		if (layer.feature && layer.feature.properties[attribute]) {
			// get all properties -- all gdp data under this layer)
			var proprts = layer.feature.properties

			// calculate radius of the reset Circle Marker
			var radius = calcR(map, proprts[attribute])

			// set radius
			layer.setRadius(radius)

			// add newer, more detailed popup to each layer and bind the popup
			var admin = proprts.Admin_division
			var popupCntnt = "<p><b>Administrative division:</b>" + admin + "</p>"
			var year = attribute.split('_')[1]
			var gdpThisYr = proprts[attribute]
			popupCntnt += "<p><b>GDP(ppp) per capita in year " + year +  " :</b> $" + gdpThisYr + "</p>"
			layer.bindPopup(popupCntnt, {
				offset: new L.Point(0, -radius)
			})

			$(layer).click(function() {
				// upon click, the popup will still remain on the screen even after mouseout; this popup will close and a
				// new popup will open -- only after the user mouses over a new Circle Marker
				updatePanelContent(admin, year, gdpThisYr)
				this.on({
					mouseout: function(){	
						this.openPopup()
					}
				})
			})
		}
	})
}

function createSeqCtrl(map,attributes) {
	// add range slider to the <div> with the id of "panel"
	/*map.eachLayer(function(layer) {
		layer.feature*/
	$('#updatable').empty()
	$('#panel').append('<input class="range-slider" type="range">')
	$('.range-slider').attr({
		max: 8,
		min: 0,
		value: 0,
		step: 1
	})
	// add reverse and forward buttons
	$('#panel').append("<button class='skip' id='reverse'>Reverse</button>")
	$('#panel').append("<button class='skip' id='forward'>Forward</button>")

	// use image to represent the butons
	$('#reverse').html('<img src="data/icon/new_backward.png">')
	$('#forward').html('<img src="data/icon/new_forward.png">')

	// Reset range slider value upon clicking the buttons
	$('.skip').click(function(){
		// remove the notification upon a new click
		$('#notif').remove()
		var index = $('.range-slider').val()

		// retrive index upon click
		if ($(this).attr('id') == 'forward') {
			index ++
			index = index > 8 ? 0 : index
		} else if ($(this).attr('id') == 'reverse') {
			index --
			index = index < 0 ? 8 : index
		}
		// update range-slider per index retrived 
		$('.range-slider').val(index)

		// add a notification that shows current year the slider is on
		// If index of the slider is greater than 5, use a different equation, because 2008, 2009, and 2010 does not 
		// follow the previous pattern of intervals of 5 (1980, 1985, 1990, 1995, 2000 and 2005).
        var year = (index > 5) ? (2002 + index): (1980 + 5 * index)
		var notif = '<div id="notif">Showing GDP of year ' + year + '</div>'

		// If '#updatable'(the info panel that shows data of clicked layer in the '#panel') is still empty (still initial value in index.html), 
		// append notification at the end of the panel, otherwise append before '#updatable'
		// This ensure that the relative position of "#updatable" and "#notif" remains unchanged when the user performs any
		// clicking or sliding 
        if (!$('#updatable').is(':empty')) {
       		$(notif).insertBefore('#updatable')
        } else {
        	$('#panel').append(notif)
        }
       	// update the symbols upon clicking
		updatePropSymbols(map, attributes[index])
	});

    // Event handler upon input to the range-slider
    $('.range-slider').on('input', function(){
    	// similar idea to the previous click event handler
        $('#notif').remove()
        var index = $(this).val()
        iNum = parseInt(index)
        var year = (iNum > 5) ? (2002 + iNum): (1980 + 5 * iNum)
        var notif = '<div id="notif">Showing GDP of year ' + year + '</div>'
        if (!$('#updatable').is(':empty')) {
       		$(notif).insertBefore('#updatable')
        } else {
        	$('#panel').append(notif)
        }
        // update the symbols upon sliding
        updatePropSymbols(map, attributes[index])

    });
}

function enableComparisonButtons(map) {
	// append a series of buttons to '#panel', '#compare' and '#compareResult' interfaces
	$('#panel').append("<br><button id='start_comparison'>Start comparison</button>")
	$('#compare').append("&nbsp&nbsp<button class='compareButton' id='end_comparison'> <img class='arrow' src='data/icon/left_arrow2.png'>&nbsp&nbsp&nbspEnd comparison</button>")
	$('#compare').append("&nbsp&nbsp&nbsp&nbsp&nbsp<button class='compareButton' id='to_comparison'> To compare&nbsp&nbsp&nbsp<img class='arrow' src='data/icon/right_arrow2.png'></button>")
	$('#compare').append("<p>&nbsp&nbspSELECT TWO YEARS TO COMPARE: </p>")
	$('#compare').append("&nbsp&nbsp<button id='select_again'>Select again</button><br><br><br>")
	$('#compareResult').append("&nbsp&nbsp<button class='compareButton' id='exit_result'> <img class='arrow' src='data/icon/left_arrow2.png'>&nbsp&nbsp&nbspBack to selection</button>")

	// Only shows '#panel' at the inital stage, '#compare' and '#compareResult' interfaces are fired later upon clicking
	// certain buttons.
	$('#compare').hide()
	$('#compareResult').hide()
}

function createYrButtons(map) {
	// Create buttons representing years with images as background, for years 1980, 1985, 1990, 1995, 2000, 2005
	for (i = 0; i < 6; i ++) {
		// retrive the currect images as background of buttons
		yr = (1980 + i * 5).toString()
		var buttonNameId = 'chooseYr' + yr
		var buttonNameId_selector = '#' + buttonNameId
		if (i == 0) {
			var background_path = '<div class="image_button"><img class="jpg" src="data/yr_background/' + yr + '_v2.jpg"><div class="yr_text">' + yr + '</div></div>'
		} else {
			var background_path = '<div class="image_button"><img class="jpg" src="data/yr_background/' + yr + '_v2.jpg"><div class="yr_text">' + yr + '</div></div>'
		}

		// append clickable images to the "#compare" interface
		$('#compare').append(background_path)
	}
	// Same idea as the previous for loop, adding images for years 1008, 1009, 2010
	for (i = 0; i < 3; i ++) {
		var yr = (2008 + i).toString()
		var buttonNameId = 'chooseYr' + yr
		var buttonNameId_selector = '#' + buttonNameId

		if (i % 2 == 0) {
			var background_path = '<div class="image_button"><img class="jpg" src="data/yr_background/' + yr + '_v2.jpg"><div class="yr_text">' + yr + '</div></div>'		} else if (i != 2) {
				var background_path = '<div class="image_button"><img class="jpg" src="data/yr_background/' + yr + '_v2.jpg"><div class="yr_text">' + yr + '</div></div>'
			} else {
				var background_path = '<div class="image_button"><img class="jpg" src="data/yr_background/' + yr + '_v2.jpg"><div class="yr_text">' + yr + '</div></div>'
			}

			$('#compare').append(background_path)
		}
	}
/////

function compareInterface(map,attributes) {
	// add functionalities to the "#compare" interface, making it interact-able
	var numSelected = 0
	var yrSelectedArr = new Array

	// End comparison button, click to go back to "#panel". Also re-fires updatePropSymbol and panelInterface functions
	$('#end_comparison').click(function() {
		$('#compare').hide()
		$('#panel').show()

		// re-fires updatePropSymbols and panelInterface functions after clicked "end comparison"
		updatePropSymbols(map, [index])
		panelInterface(map,attributes)
	})
	// As a feedback, the clickable image opacity is changed upon mouseover
	$('.image_button').mouseover(function() {
		console.log('mouseovered image')
		$(this).css({'opacity':'0.25'})
	})

	// The clickable image opacity changes back after mouseout
	$('.image_button').mouseout(function() {
		console.log('mouseouted image')
		$(this).css({'opacity':'0.6'})
	})

	// The clickable image reformats after the user clicks it, giving a feedback that it is selected
	$('.image_button').click(function() {
		// Retrive years selected by user
		yrSelectedArr.push(parseInt($(this).find('.yr_text').html()))
		console.log("YR SELECTED: ", yrSelectedArr)
		console.log('clicked image')
		$(this).find('.jpg').css({'border': '2.5px solid red'})
		$(this).css({'opacity':'1'})
		$(this).mouseout(function() {
			$(this).css('opacity','1')
		})
		// Count the number of clicks, judge whether to reset image_buttons or proceed to comparison
		numSelected += 1
		if (numSelected < 2) {
			// User cannot click to_comparison if they have not selected two year buttons
			$('#to_comparison').css({'background-color': '#a3a3a3'})
			$('#to_comparison').off('click')
		} else if (numSelected == 2) {
			// After user has selected two image-buttons, to_comparison button will light up and fire up click event
			$('#to_comparison').css({'background-color': '#4CAF50'})
			$('#to_comparison').click(function() {
				$('#compare').hide()
				$('#compareResult').show()
				// Get attributes of thw two selected years
				var data2Yrs = new Array
				var index1 = yrSelectedArr[0] > 2005 ? (yrSelectedArr[0] - 2002) : ((yrSelectedArr[0] - 1980) / 5)
				var index2 = yrSelectedArr[1] > 2005 ? (yrSelectedArr[1] - 2002) : ((yrSelectedArr[1] - 1980) / 5)
				if (index1 < index2) {
					data2Yrs.push(attributes[index1])
					data2Yrs.push(attributes[index2])
				} else {
					data2Yrs.push(attributes[index2])
					data2Yrs.push(attributes[index1])
				}

				// fires compareResult function with formatted parameters
				compareResult(map, attributes, numSelected, yrSelectedArr, data2Yrs)
			})
		} else if (numSelected > 2) {
			// If number of selection exceeds 2, gray-out "To compare" button and disable click-ability
			// re-fire image-buttons and this same function
			startOver(map, attributes)
		}
		// If user clicked select again, then re-fire image-buttons and this same function [OK]
		// WARNING: This part still contains bug, DO NOT use this button. Rather, triple click on the image to reset selection.
		$('#select_again').click(function(map) {
			startOver(map, attributes)
		})
	})
}
function startOver(map,attributes) {
	// Reset the "#compare" interface for new selection
	$(".image_button").remove()
	$('#to_comparison').css({'background-color': '#a3a3a3'})
	$('#to_comparison').off('click')
	$('.image_button').find('.jpg').css('all','initial')
	createYrButtons(map)
	compareInterface(map,attributes)
}	
/////

function panelInterface(map,attributes) {
	// panel interface (home page)
	$('#start_comparison').click(function() {
		$('#panel').hide()
		$('#compare').show()
		$('#compareResult').hide()
		compareInterface(map,attributes)
	})
}
//////

function compareResult(map,attributes,numSelected,yrSelectedArr,data2Yrs) {
	// Check if the gdp data passed contains n/a data (actually only Hainan GDP of year 1980 is n/a)
	var hasNA = false

	// clear previous data displayed
	$('#compareInfo').remove()
	$('#compareRanking').remove()
	// "percentage-justified"
	$('#perc_j').remove()
	// "administrative division-justified"
	$('#admin_j').remove(0)
	if (yrSelectedArr[0] > yrSelectedArr[1]) {
		var interm = yrSelectedArr[0]
		yrSelectedArr[0] = yrSelectedArr[1]
		yrSelectedArr[1] = interm
	}

	// Intro part of compare info panel
	var compareInfo = '<div id="compareInfo"><br>GDP(ppp) change rates per year, per administrative division between ' 
	+ yrSelectedArr[0] + ' and ' + yrSelectedArr[1] + ' are: <br><br>' + '</div>'
	// append the intro to '#compareResult' panel
	$('#compareResult').append(compareInfo)
	
	// The passedBack contains a list of gdp increase percentage of all administrative districts 
	// and a list of administrative district names
	var passedBack = createCompareSymbols(map,attributes, numSelected, yrSelectedArr, data2Yrs)
	var perc_incr_L = passedBack[0]
	var admin_L = passedBack[1]

	var perc_sorted = []
	var admin_sorted = []

	//	rank the two lists from largest to smalles
	while (perc_incr_L.length > 0) {
		console.log("LEN",perc_incr_L)
		var max = 0
		var max_admin = ''
		var ind_max = 0

		for (i = 0; i < perc_incr_L.length; i ++) {

			if (perc_incr_L[i] > max) {
				max = perc_incr_L[i]
				max_admin = admin_L[i]
				var ind_max = i
				console.log('maxxxxxxx',max)
			}
		}
		perc_incr_L.splice(ind_max, 1)
		admin_L.splice(ind_max, 1)

		console.log("MIDDLLLLL", i, perc_incr_L, max)
		perc_sorted.push(max)
		admin_sorted.push(max_admin)
	}

	// Deal with exception: those whose data is n/a
	if (admin_sorted[30].length == 0) {
		admin_sorted[30] = 'Hainan'
		hasNA = true
	}
	
	// declare <div> for displaying the data
	var ranking = '<div id="compareRanking"><br><b>Rank&nbsp | &nbspAdministrative division&nbsp | &nbspChange rate per year</b><br>'
	var perc_j = '<div id="perc_j">'
	var admin_j = '<div id="admin_j">'
	console.log('1--------')

	// displaying data
	for (i = 0; i < perc_sorted.length; i ++) {

		if (i < 9) {
			var spacing = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'
		} else {
			var spacing = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp'
		}
		
		// when all data of selected year is available
		if (!hasNA) {
			if (i % 2 == 1) {
					var admin_j = '<div class="admin_j" style="color:#aaaaaa">' + (i + 1) + spacing + admin_sorted[i] + '</div>'
					var perc_j = '<div class="perc_j" style="color:#aaaaaa">+' + perc_sorted[i] + '%</div>'
				} else {
					var admin_j = '<div class="admin_j">' + (i + 1) + spacing + admin_sorted[i] + '</div>'
					var perc_j = '<div class="perc_j">+' + perc_sorted[i] + '%</div>'
				}
			
			// when the data list has one n/a item
			} else {
				if (i < 30) {
					if (i % 2 == 1) {
						var admin_j = '<div class="admin_j" style="color:#aaaaaa">' + (i + 1) + spacing + admin_sorted[i] + '</div>'
					var perc_j = '<div class="perc_j" style="color:#aaaaaa">+' + perc_sorted[i] + '%</div>'
					} else {
						var admin_j = '<div class="admin_j">' + (i + 1) + spacing + admin_sorted[i] + '</div>'
						var perc_j = '<div class="perc_j">+' + perc_sorted[i] + '%</div>'
					}
				} if ((i == 30) && hasNA) {
					if (i % 2 == 1) {
						var admin_j = '<div class="admin_j" style="color:#aaaaaa">' + (i + 1) + spacing + admin_sorted[i] + '</div>'
						var perc_j = '<div class="perc_j" style="color:#aaaaaa"> No data for year 1980 </div>'
					} else {
						var admin_j = '<div class="admin_j">' + (i + 1) + spacing + admin_sorted[i] + '</div>'
						var perc_j = '<div class="perc_j_NA">No data for year 1980 </div>'
					}
				}
			}

		ranking += perc_j + admin_j
	}

	console.log('RANKING',ranking)
	$('#compareResult').append(ranking)
}

function createCompareSymbols(map, attributes, numSelected, yrSelectedArr, data2Yrs) {
	console.log('DATA2YR',data2Yrs)
	var markerG = new Array
	var perc_incr_L = new Array
	var admin_L = []
	var passBack = new Array
	for (i = 0; i < 2; i ++) {
		map.eachLayer(function(layer) {
			if (layer.feature && layer.feature.properties[data2Yrs[i]]) {

				var proprts = layer.feature.properties
				console.log('PROPERTIES',proprts)

				var radius = calcR(map, proprts[data2Yrs[i]])

				var coord = [layer.feature.geometry.coordinates[1], layer.feature.geometry.coordinates[0]]
				console.log(typeof(coord), coord)

				var yr1 = yrSelectedArr[0]
				var yr2 = yrSelectedArr[1]

				var gdpYr1 = proprts[data2Yrs[0]]
				var gdpYr2 = proprts[data2Yrs[1]]

				var perc_incr = ((Math.pow(gdpYr2  / gdpYr1, 1/(yr2 - yr1)) - 1) * 100).toFixed(2)

				// Hover to view details of comparison
				var popupCntnt = "<ul id='compare_popup'><li class='c_p_basic'><b>GDP(ppp) per capita in year " + yr1 +  " :</b> $" + gdpYr1 + "</li>" +
				"<li class='c_p_basic'><b>GDP(ppp) per capita in year " + yr2 + " :</b> $" + gdpYr2 + "</li>" + 
				"<li class='c_p_detail'> In this <b>" + (yr2 - yr1) + "-year</b> period from <b>" + yr1 + " </b>to<b> " + yr2 + "</b>," + 
				"<br>In the administrative division of <b>" + proprts.Admin_division + ",</b>" + 
				"<br>The average GDP(ppp) per capita increase per year is <b>" + ((gdpYr2 - gdpYr1) / (yr2 - yr1)).toFixed(1) + "</b> USD," + 
				"<br>Or an increase rate of <b>" + perc_incr + "</b> percent per year." + 
				"<br>In this peroid, the GDP(ppp) of this administrative division has increased for <b>" + (gdpYr2 / gdpYr1).toFixed(2) + "</b> times.</li></ul>"

				// The data of the earlier year will be displayed using another circle marker group
				if (i == 0) {

					perc_incr_L.push(Number(perc_incr))
					admin_L.push(String(proprts.Admin_division))
					passBack.push(perc_incr_L,admin_L)

					circle2 = L.circleMarker(coord, {
						radius: radius,
 						stroke: true, 
  						color: 'red', 
  						opacity: 1, 
  						weight: 0.3, 
  						fill: true, 
  						fillColor: '#6677ee', 
  						fillOpacity: 0.5
  					}).addTo(map);
					circle2.bindPopup(popupCntnt, {
						offset: new L.Point(0, -radius * 0.8),
						opacity:0.8
					})
					markerG.push(circle2)
					$(circle2).on({
						mouseover: function() {
							this.openPopup()
						},
						mouseout: function() {
							this.closePopup()
						},
						click: function() {
							this.openPopup()
							this.on({
								mouseout: function(){	
									this.openPopup()
								}
							})
						}
					})
				}

				layer.setRadius(radius)

				// bind popups
				layer.bindPopup(popupCntnt, {
					offset: new L.Point(0, -radius * 0.8),
					opacity: 0.8
				})
			}
		})
	}

	// Reset the additional circle marker group when user clicks exit result, and prepare for a new comparison
	$('#exit_result').click(function() {
		for (i = 0; i < markerG.length; i ++) {
			map.removeLayer(markerG[i])
		}
		map.eachLayer(function(layer) {
			layer.unbindPopup()
		})
		$('#compareResult').hide()
		$('#compare').show()
		startOver(map,attributes)
	})
	return passBack
}


//function to retrieve the data and place it on the map
function getData(map) {
	$.ajax("data/China_gdp.geojson", {
		/* specify the file format the ajax method is to call*/
		dataType: "json",
		success: function(response) {
			var attributes = processData(response)

			createSeqCtrl(map,attributes)
			createPropSymbols(response,map,attributes)
			
			// The fifth operator: re-expression
			enableComparisonButtons(map)
			createYrButtons(map)
			panelInterface(map,attributes)
			/* The fifth operator: compare*/
		}
	})
}

$(document).ready(createMap);