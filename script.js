const mapContainer = document.getElementById("map-container");
const placeSearch = document.querySelector("gmp-place-search");
const placeSearchQuery = document.querySelector("gmp-place-nearby-search-request");
const typeSelect = document.querySelector("select");

let gMap;
let markers = {};
let LatLngBounds;
let LatLng;

async function initMap() {
    const { Map } = await google.maps.importLibrary("maps");
    const {AdvancedMarkerElement} = await google.maps.importLibrary("marker");
    ({LatLngBounds, LatLng} = await google.maps.importLibrary("core"));
    gMap = new Map(mapContainer, {
        center: {lat: 39.8283, lng: -98.5795},
        zoom: 4,
        mapTypeControl: false,
    });
    
    placeDetailsPopup = new AdvancedMarkerElement({
        map: null,
        content: placeDetails,
        zIndex: 100
    });
    
    findCurrentLocation();
    
    marker = new AdvancedMarkerElement({ map: gMap });
    // Hide the map type control.
    gMap.setOptions({ mapTypeControl: false });
    // Set up map, marker, and infowindow once widget is loaded.
    placeDetails.style.visibility = 'visible';
    placeDetails.addEventListener('gmp-load', (event) => {
        console.log("placeDetails initialized!");
        updateMapAndMarker();
    });
    // Add an event listener to handle clicks.
    gMap.addListener("click", async (event) => {
        event.stop();
        // Fire when the user clicks on a POI.
        if (event.placeId) {
            console.log("clicked on POI");
            console.log(event.placeId);
            placeDetailsRequest.place = event.placeId;
            updateMapAndMarker();
        }
        else {
            // Fire when the user clicks the map (not on a POI).
            console.log('No place was selected.');
        }
        ;
    });
    
    typeSelect.addEventListener('change', (event) => {
        event.preventDefault();
        searchPlaces();
    });
    
    // Function to update map, marker, and infowindow based on place details
    const updateMapAndMarker = () => {
        console.log("function called");
        if (placeDetails.place && placeDetails.place.location) {
            marker.gMap = null;
            let adjustedCenter = offsetLatLngRight(placeDetails.place.location, 0.002);
            gMap.panTo(adjustedCenter);
            gMap.setZoom(16); // Set zoom after panning if needed
            marker.content = placeDetails;
            marker.position = placeDetails.place.location;
            marker.map = gMap
        }
        else {
            console.log("else");
        }
    };
}

// Helper function to offset marker placement for better visual appearance.
function offsetLatLngRight(latLng, latitudeOffset) {
    const newLat = latLng.lat() + latitudeOffset;
    return new google.maps.LatLng(newLat, latLng.lng());
}
initMap();

async function getPlaceDetails() {
    const { Place } = await google.maps.importLibrary("places");
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
    // Use place ID to create a new Place instance.
    const place = new Place({
        id: 'ChIJN5Nz71W3j4ARhx5bwpTQEGg',
        requestedLanguage: 'en', // optional
    });
    // Call fetchFields, passing the desired data fields.
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
    // Log the result
    console.log(place.displayName);
    console.log(place.formattedAddress);
    // Add an Advanced Marker
    const marker = new AdvancedMarkerElement({
        map,
        position: place.location,
        title: place.displayName,
    });
}

async function findCurrentLocation(){
    const { LatLng } = await google.maps.importLibrary("core");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const pos = new LatLng(position.coords.latitude,position.coords.longitude);
                gMap.panTo(pos);
                gMap.setZoom(16);
            },
            () => {
                console.log('The Geolocation service failed.');
                gMap.setZoom(16);
            },
        );
    } else {
        console.log("Your browser doesn't support geolocation");
        gMap.setZoom(16);
    }
}

function searchPlaces(){
    const bounds = gMap.getBounds();
    const cent = gMap.getCenter();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const diameter = spherical.computeDistanceBetween(ne, sw);
    const cappedRadius = Math.min((diameter / 2 ), 50000);
    
    placeDetailsPopup.map = null;
    
    for(const markerId in markers){
        if (Object.prototype.hasOwnProperty.call(markers, markerId)) {
            markers[markerId].map = null;
        }
    }
    
    markers = {};
    if (typeSelect.value) {
        placeSearch.style.display = 'block';
        placeSearchQuery.maxResultCount = 10;
        placeSearchQuery.locationRestriction = { center: cent, radius: cappedRadius };
        placeSearchQuery.includedTypes = [typeSelect.value];
        
        placeSearch.addEventListener('gmp-load', addMarkers, { once: true });
    }
}

async function addMarkers(){
    const bounds = new LatLngBounds();
    placeSearch.style.display = 'block';
    
    if(placeSearch.places.length > 0){
        placeSearch.places.forEach((place) => {
            let marker = new AdvancedMarkerElement({
                map: gMap,
                position: place.location
            });
            
            marker.metadata = {id: place.id};
            markers[place.id] = marker;
            bounds.extend(place.location);
            
            marker.addListener('click',(event) => {
                placeRequest.place = place;
                placeDetails.style.display = 'block';
                
                placeDetailsPopup.position = place.location;
                placeDetailsPopup.map = gMap;
                
                gMap.fitBounds(place.viewport, {top: 0, left: 400});
                
                placeDetails.addEventListener('gmp-load',() => {
                    gMap.fitBounds(place.viewport, {top: 0, right: 450});
                }, { once: true });
                
            });
            gMap.setCenter(bounds.getCenter());
            gMap.fitBounds(bounds);
        });
    }
}
function openModal(){
    document.getElementById("modal").style.display = "block";
    
}
function closeModal(){
    document.getElementById("modal").style.display = "none";
    document.getElementById("form").reset();
}
function getCategoryIcon(category){
    const icons = {
        food:'🍽️', houseing: '🏠', health: '🏥'
    }
    return icons[category] || '📍';
}
const newResources = {
    id:resources.length + 1,
    name: place.displayName || "New Place",
    category: category,
    address: place.formattedAddress || "Address Not Available",
    phone: place.nationalPhoneNumber || "Phone Not Available",
    isFromMaps: true
}