const mapContainer = document.getElementById("map-container");
const placeSearch = document.querySelector("gmp-place-search");
const placeSearchQuery = document.querySelector("gmp-place-nearby-search-request");
const placeDetails = document.querySelector("gmp-place-details-compact");
const placeRequest = document.querySelector("gmp-place-details-place-request");
const typeSelect = document.querySelector(".type-select");

let gMap;
let markers = {};
let spherical;
let AdvancedMarkerElement;
let placeDetailsPopup;
let LatLngBounds;
let LatLng;

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

    // gMap.addListener("click", async (event) => {
    //     event.stop();
    //     // Fire when the user clicks on a POI.
    //     if (event.placeId) {
    //         console.log("clicked on POI");
    //         console.log(event.placeId);
    //         placeDetailsRequest.place = event.placeId;
    //         updateMapAndMarker();
    //     }
    //     else {
    //         // Fire when the user clicks the map (not on a POI).
    //         console.log('No place was selected.');
    //     }
    //     ;
    // });
    
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

function searchPlaces() {
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

function hidePlaceDetailsPopup() {
    if (placeDetailsPopup.map) {
        placeDetailsPopup.map = null;
        placeDetails.style.display = 'none';
    }
}

init();

function setFilter(filter) {
    typeSelect.value = filter;
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
// Quick list of resources 
const resources = [
    {
        id: 1,
        name: "Downtown Food Bank",
        category: "food",  // This will match our filter buttons
        desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        address: "123 Main St",
        phone: "(555) 123-4567",
        icon: "🍽️"
    },
    {
        id: 2,
        name: "Hope Shelter",
        category: "housing", 
        desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        address: "456 Oak Ave",
        phone: "(555) 234-5678",
        icon: "🏠"
    },
    {
        id: 3,
        name: "Community Health Center",
        category: "health",
        desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
        address: "789 Pine St",
        phone: "(555) 345-6789",
        icon: "🏥"
    }
];
function render(){
    const filtered = resources.filter(r =>
    (filter == "all" || r.category == filter)&&
    (search == " "|| r.name.toLowerCase().includes(search.toLowerCase()))
    );
    document.getElementById("results").innerHTML = filtered.map((r,i))
}