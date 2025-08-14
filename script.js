const mapContainer = document.getElementById("map-container");
const placeSearch = document.querySelector("gmp-place-search");
const placeSearchQuery = document.querySelector("gmp-place-text-search-request");
const placeDetails = document.querySelector("gmp-place-details-compact");
const placeRequest = document.querySelector("gmp-place-details-place-request");
const querySelect = document.querySelector(".query-select");
const textInput = document.querySelector("#text-input");

let gMap;
let markers = {};
let spherical;
let AdvancedMarkerElement;
let placeDetailsPopup;
let LatLngBounds;
let LatLng;
let previousSearchQuery = '';

async function init() {
    ({ spherical } = await google.maps.importLibrary('geometry'));
    const { Map } = await google.maps.importLibrary("maps");
    await google.maps.importLibrary("places");
    ({AdvancedMarkerElement} = await google.maps.importLibrary("marker"));
    ({LatLngBounds, LatLng} = await google.maps.importLibrary("core"));
    gMap = new Map(mapContainer, {
        center: {lat: 39.8283, lng: -98.5795},
        zoom: 4,
        mapTypeControl: false,
        mapId: 'DEMO_MAP_ID'
    });
    
    placeDetailsPopup = new AdvancedMarkerElement({
        map: null,
        content: placeDetails,
        zIndex: 100
    });
    
    findCurrentLocation();
    
    marker = new AdvancedMarkerElement({ map: gMap });

    querySelect.addEventListener('change', (event) => {
            event.preventDefault();
            searchPlacesBySelect();
    });

    textInput.addEventListener("keydown", (event) => {
        if (event.key == 'Enter') {
            event.preventDefault();
            searchPlacesByText();
        }
    });

    placeSearch.addEventListener("gmp-select", ({ place }) => {
        if (markers[place.id]) {
            markers[place.id].click();
        }
    });
}

function offsetLatLngRight(latLng, latitudeOffset) {
    const newLat = latLng.lat() + latitudeOffset;
    return new google.maps.LatLng(newLat, latLng.lng());
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
            },
        );
    } else {
        console.log("Your browser doesn't support geolocation");
    }
}

function searchPlacesBySelect() {
    for(const markerId in markers){
        if (Object.prototype.hasOwnProperty.call(markers, markerId)) {
                markers[markerId].map = null;
            }
    }
    markers = {};
    if (querySelect.value) {
        placeSearch.style.display = 'block';
        placeSearchQuery.textQuery = querySelect.value;
        placeSearchQuery.locationBias = gMap.getBounds();
        placeSearch.addEventListener('gmp-load', addMarkers, { once: true });
    }
}

function searchPlacesByText() {
    if (textInput.value.trim() === previousSearchQuery) {
        return;
    }
    previousSearchQuery = textInput.value.trim();
    placeDetailsPopup.map = null;

    for(const markerId in markers){
        if (Object.prototype.hasOwnProperty.call(markers, markerId)) {
                markers[markerId].map = null;
            }
    }
    markers = {};
    if (textInput.value) {
        mapContainer.style.height = '75vh';
        placeSearch.style.display = 'block';
        placeSearchQuery.textQuery = textInput.value;
        placeSearchQuery.locationBias = gMap.getBounds();
        placeSearch.addEventListener('gmp-load', addMarkers, { once: true });
    }
}

async function addMarkers(){
    const bounds = new LatLngBounds();

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

                gMap.fitBounds(place.viewport, {top: 200, right: 450});

            });

            gMap.setCenter(bounds.getCenter());
            gMap.fitBounds(bounds);
        });
    }
}

function hidePlaceDetailsPopup() {
    if (placeDetailsPopup.map) {
        placeDetailsPopup.map = null;
        placeDetails.style.display = 'none';
    }
}

init();

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
// Quick list of resources 
// const resources = [
//     {
//         id: 1,
//         name: "Downtown Food Bank",
//         category: "food",  // This will match our filter buttons
//         desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
//         address: "123 Main St",
//         phone: "(555) 123-4567",
//         icon: "🍽️"
//     },
//     {
//         id: 2,
//         name: "Hope Shelter",
//         category: "housing", 
//         desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
//         address: "456 Oak Ave",
//         phone: "(555) 234-5678",
//         icon: "🏠"
//     },
//     {
//         id: 3,
//         name: "Community Health Center",
//         category: "health",
//         desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
//         address: "789 Pine St",
//         phone: "(555) 345-6789",
//         icon: "🏥"
//     },
//     { 
//     id: 4, 
//     name: "Sunrise Soup Kitchen", 
//     category: "food", 
//     desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
//     address: "245 Elm Street", 
//     phone: "(555) 456-7890", 
//     icon: "🍽️" 
//     },
//     { 
//     id: 5, 
//     name: "Safe Haven Housing", 
//     category: "housing", 
//     desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
//     address: "567 Maple Drive", 
//     phone: "(555) 567-8901", 
//     icon: "🏠" 
//     },
//     { 
//     id: 6, 
//     name: "Westside Medical Clinic", 
//     category: "health", 
//     desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
//     address: "890 Cedar Lane", 
//     phone: "(555) 678-9012", 
//     icon: "🏥" 
//     },
//     { 
//     id: 7, 
//     name: "Fresh Start Pantry", 
//     category: "food", 
//     desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
//     address: "321 Birch Road", 
//     phone: "(555) 789-0123", 
//     icon: "🍽️" 
//     },
//     { 
//     id: 8, 
//     name: "Unity Emergency Housing", 
//     category: "housing", 
//     desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
//     address: "654 Willow Court", 
//     phone: "(555) 890-1234", 
//     icon: "🏠" 
//     },
//     { 
//     id: 9, 
//     name: "Northside Family Clinic", 
//     category: "health", 
//     desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", 
//     address: "987 Spruce Avenue", 
//     phone: "(555) 901-2345", 
//     icon: "🏥" 
//     }
// ];

// function render(){
//     const filtered = resources.filter(r =>
//     (filter == "all" || r.category == filter)&&
//     (search == " "|| r.name.toLowerCase().includes(search.toLowerCase()))
//     );
//     document.getElementById("results").innerHTML = filtered.map((r,i) =>'').join(" ")
// }
// document.addEventListener("DOMContentLoaded", function(){
// render();
// initMap();
// });