// 
// Sheetsu API url: https://sheetsu.com/apis/v1.0/4fa7b323dcb0

const podApp = {}
const googleKey = "AIzaSyDREesQzQn5zk7SCQIRvnJnMfx0Xci2ayE";
podApp.parksArray = [];
podApp.topPodArray = [];


// User chooses a genre 
podApp.events = function () {
	$("li").on("click", function(){
		$(this).removeClass("genreSelection_item");
		$(this).toggleClass("selectedGenre");
		$("li").not(this).css("display", "none");
		var podGenreChoice = $(this).find("p").text();
		podApp.getPodcasts(podGenreChoice);
		podApp.displayPods(podGenreChoice);
	});
}

// Get the location (lat/long) of the user (geolocation)
podApp.getLocation = function() {
	if("geolocation" in navigator){
	   navigator.geolocation.getCurrentPosition(success, error, options);
	   $('.locator').hide();
	   $('.loadIcon').delay(500).show();
		} else {
			alert(`Your browser does not support geolocation :(`)
		}
		var options = {
			// enableHighAccuracy = should the device take extra time or power to return a really accurate result, or should it give you the quick (but less accurate) answer?  
			enableHighAccuracy: false, 
			// timeout = how long does the device have, in milliseconds to return a result?
			timeout: 5000,  
			// maximumAge = maximum age for a possible previously-cached position. 0 = must return the current position, not a prior cached position
			maximumAge: 0 
			};
		function success(pos){
			var latitude = pos.coords.latitude;
			var longitude = pos.coords.longitude;
			// Need array to pass to leaflet
			podApp.latLong = [latitude, longitude];
			// hide spinning wheel and show map
			$('.loadIcon').hide();
			// $('#mapid').removeClass("mapHide");
			// $('#mapid').toggleClass("mapShow");
	
			// Pass user coordinates to leaflet to render map
			podApp.myMap.panTo(podApp.latLong); 
			// make a marker for user location and add to marker layer
			podApp.marker = L.marker(podApp.latLong).addTo(podApp.myMap);
			// Bring in Google places results for nearby parks
			podApp.getParks();

		}
		function error(err){
			if (err.code == 0) {
			    // Unknown error
			    alert('Unknown error');
			}
			if (err.code == 1) {
			    // Access denied by user
			    alert('Your settings do not allow Geolocation. Please manually enter your address. Or reset location settings.');
			}
			if (err.code == 2) {
			    // Position unavailable
			    alert('Position unavailable');
			}
			if (err.code == 3) {
			    // Timed out
			    alert('Timed out');
			}
		}
	};

// Create Leaflet map
podApp.myMap = L.map("mapid", {
	center: [43.6482035, -79.397869],
	zoom: 13,
	scrollWheelZoom: false
});

// Add tile layer to map
L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZXN0ZWxhdGhvbXNvbiIsImEiOiJjajM0djdidnIwMGF4MzJxdTZjOW92MGozIn0.XpuJtCuIx85zUn6Eci0b0w', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
}).addTo(podApp.myMap);

// Request podcast data from Sheetsu API
podApp.getPodcasts = (podChoice) => {
	$.ajax({
		url: "https://sheetsu.com/apis/v1.0/da64080bff9b",
		method: "GET"
		}).then(function(res){
			let podData = res;
			//Here is all data 
			//We want to filter based on what the user selected and only show that genre
			podData = podData.map(function(singlePod){
				singlePod.Genre = singlePod.Genre.split(',');
				// this will remove the spaces between genres 
				singlePod.Genre = singlePod.Genre.map(function(podcast){
					return podcast.trim();
				});
				return singlePod;
			});
			podApp.filterPodcasts(podData, podChoice)
		});
	}

// Filter returned podcast data so that only podcasts that include the chosen genre appear
podApp.filterPodcasts = function(podList, podChoice) {
	const filteredPodList = podList.filter(function(singlePod){
		return singlePod.Genre.includes(podChoice);
	}); 
	podApp.randomPodcasts(filteredPodList);
};


// get three random podcasts from the list generated from the selected genre
podApp.randomPodcasts = function(filteredPodList) {
	const randomPodList = _.shuffle(filteredPodList);
	for (var i = 0; i < 3; i++) {
		const randomPod = randomPodList.pop();
		podApp.topPodArray.push(randomPod);
	};
	podApp.displayPods(podApp.topPodArray);
};

// Make request to Google for locations of parks
podApp.getParks = function(){
	$.ajax({
		url: 'https://proxy.hackeryou.com',
		method: "GET",
		dataType: "json",
		data: {
			reqUrl: "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
			params: {
				key: googleKey,
				location: `${podApp.latLong[0]},${podApp.latLong[1]}`,    //must be    latitude,longitude
				radius: "1500",
				types: "park"
			}
		}
	}).then(function(parks){
		parks.results.forEach(function(park){
			var marker = L.marker([park.geometry.location.lat, park.geometry.location.lng], {icon: podApp.leafIcon}, {title: park.name}).bindPopup(park.name);
				// lat: park.geometry.location.lat,
				// lng: park.geometry.location.lng
				podApp.parksArray.push(marker);
				marker.addTo(podApp.myMap);
		})
		var boundGroup = L.featureGroup(podApp.parksArray);
		podApp.myMap.fitBounds(boundGroup.getBounds());
	});
};

// Create custom icon for parks
podApp.leafIcon = L.icon({
    iconUrl: 'assets/leaf.svg', 
    iconSize: [55, 55], // dimensions of the icon
    iconAnchor: [15, -5], // point of the icon which will correspond to marker's location
    popupAnchor: [0, 14] // point from which the popup should open relative to the anchor
});


// Display podcasts
podApp.displayPods = function(topPodArray) {
	$('<p>').text(`A few podcasts about ${podGenreChoice} to check out:`).append(".results");
	podApp.topPodArray.forEach(function(podItem){
			var titleEL = $("<h3>").text(podItem.Name);
			var imageEl = $("<img>").attr("src", podItem.Photo_URL);
			var descriptEl = $("<p>").text(podItem.Description);
			var infoEl = $("<a>").attr("href", podItem.URL).text("More info");
			var textContainer = $('<div>').addClass('textContainer').append(descriptEl, infoEl)	
			// this will create a container to contain the title & image
			var podSuggestionContainer = $("<div>").addClass("podGallery clearfix").append(titleEL, imageEl, textContainer);
			$("#podSuggest").append(podSuggestionContainer);
	});

}

// function to initialize app
podApp.init = function(){
	// podApp.getPodcasts();
	podApp.events();
	$(".locator").on("click", function(){
		podApp.getLocation();
	});
}

// doc ready
$(function (){
	podApp.init();
});






