// Global variables
let map;
let service;
let currentInfoWindow = null;

function initMap() {
    console.log('initMap called');
    //default Location is Boston
    let location = {
        lat: 42.3770,
        lng: -71.1167,
    };

    let mapOptions = {
        center: location,
        zoom: 12,
    }

    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
        console.error('Map container not found');
        return;
    }

    try {
        //create the map 
        map = new google.maps.Map(mapContainer, mapOptions);
        service = new google.maps.places.PlacesService(map);

        const icon = "https://img.icons8.com/plasticine/100/000000/user-location.png";

        //createMarker function, which takes in 2 inputs: (location, map)
        function createMarker(location, map) {
            let marker = new google.maps.Marker({
                position: location,
                map: map,
                icon: icon,
            });
        }

        // create a marker centered at BU
        createMarker(location, map);

        // get location of the use using the user's browser geolocation
        if (navigator.geolocation) {
            console.log("Geolocation is supported!");

            navigator.geolocation.getCurrentPosition(
                (currentPosition) => {
                    location = {
                        lat: currentPosition.coords.latitude,
                        lng: currentPosition.coords.longitude
                    };
                    map.setCenter(location);
                    createMarker(location, map);
                },
                (err) => {
                    console.warn("Geolocation error:", err);
                    createMarker(location, map);
                }
            );
        } else {
            console.log("Geolocation is not supported by the browser!");
            console.log("Map is centered at the default location");
            createMarker(location, map);
        }

        // add Autocomplete feature of the places library
        let autocomplete = new google.maps.places.Autocomplete(
            document.getElementById("search-input"),
            {
                type: ["establishment"],
                fields: ["geometry", "name"],
            }
        );

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();

            if (!place.geometry) {
                alert(`No details available for input: '${place.name}' \n
                        Please select a location from the dropdown!`);
            } else {
                location = place.geometry.location;
                map.setCenter(location);
                map.setZoom(13);
                console.log("location entered:", location.toString());
                createMarker(location, map);
            }
        });

        // Set up event listeners
        setupEventListeners();

    } catch (error) {
        console.error('Error in initMap:', error);
    }
}

function setupEventListeners() {
    const keywordInput = document.getElementById('keyword');
    const priceFilter = document.getElementById('price-filter');

    if (keywordInput) {
        keywordInput.addEventListener('change', performSearch);
    } else {
        console.error('Keyword input element not found');
    }

    if (priceFilter) {
        priceFilter.addEventListener('change', performSearch);
    } else {
        console.error('Price filter element not found');
    }
}

function performSearch() {
    console.log('Performing search...');
    const keywordInput = document.getElementById('keyword');
    if (!keywordInput) {
        console.error('Keyword input not found');
        return;
    }

    const keyword = keywordInput.value;
    console.log('Search keyword:', keyword);

    const restContainer = document.getElementById('restaurants-cont');
    if (restContainer) {
        restContainer.innerHTML = '<h2>Searching for restaurants...</h2>';
    } else {
        console.error('Restaurants container not found');
        return;
    }

    const request = {
        location: map.getCenter(),
        radius: '5000',
        type: 'restaurant',
        keyword: keyword
    };

    service.nearbySearch(request, (results, status) => {
        console.log('Nearby search status:', status);
        console.log('Results:', results);
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            displayResults(results);
        } else {
            restContainer.innerHTML = '<h2>No restaurants found</h2>';
        }
    });
}

function displayResults(results) {
    const restContainer = document.getElementById('restaurants-cont');
    restContainer.innerHTML = '<h2>Restaurants Near You</h2>';

    let filteredResults = filterByPriceRange(results);
    console.log('Filtered results:', filteredResults);

    if (filteredResults.length === 0) {
        restContainer.innerHTML += '<p>No restaurants found matching the criteria.</p>';
        return;
    }

    let qty = Math.min(5, filteredResults.length);
    for (let i = 0; i < qty; i++) {
        getPlaceDetails(filteredResults[i]);
    }
}

function getPlaceDetails(result) {
    console.log('Getting details for:', result.name);
    let request = {
        placeId: result.place_id,
        fields: ['name', 'formatted_phone_number', 'vicinity', 'price_level', 'rating', 'photos', 'geometry', 'opening_hours', 'reviews']
    };
    
    service.getDetails(request, (place, status) => {
        console.log('Get details status:', status);
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkerAndInfo(place);
        } else {
            console.error('Get place details failed:', status);
        }
    });
}

function createMarkerAndInfo(place) {
    console.log('Creating marker and info for:', place.name);
    let openingHoursText = 'Opening Hours: Not available';
    if (place.opening_hours && place.opening_hours.weekday_text) {
        openingHoursText = '<strong>Opening Hours:</strong> <br>' + place.opening_hours.weekday_text.join('<br>');
    }

    let sentimentHtml = '';
    if (place.reviews && place.reviews.length > 0) {
        const sentiments = analyzeRestaurantSentiment(place.reviews);
        sentimentHtml = `
            <div>
                <h4 style="margin-bottom: 10px; font-size: 1.5rem;">Restaurant Aspects:</h4>
                <div style="display: flex; flex-direction: column; gap: 15px;">
        `;
        
        ['food', 'service', 'ambience'].forEach(aspect => {
            const total = sentiments[aspect].positive + sentiments[aspect].negative;
            if (total > 0) {
                const positivePercentage = (sentiments[aspect].positive / total) * 100;
                sentimentHtml += `
                    <div>
                        <p><strong>${aspect.charAt(0).toUpperCase() + aspect.slice(1)}:</strong></p>
                        <div style="background-color: #ddd; height: 20px; width: 100%;">
                            <div style="background-color: #4CAF50; height: 100%; width: ${positivePercentage}%;">
                            </div>
                        </div>
                        <p>${Math.round(positivePercentage)}% Positive</p>
                    </div>
                `;
            }
        });

        sentimentHtml += '</div></div>';
    }

    let priceLevel = '<strong>Price: </strong>';
    if (place.price_level) {
        priceLevel += '$'.repeat(place.price_level);
    } else {
        priceLevel += 'N/A';
    }

    let contentString = `
        <div class="restaurant-info">
            <div class="column column-1">
                <h3>${place.name}</h3>
                ${place.photos && place.photos.length > 0 
                    ? `<img src="${place.photos[0].getUrl()}" alt="${place.name}">`
                    : ''}
            </div>
            <div class="column column-2">
                <p><strong>Address:</strong> ${place.vicinity}</p>
                <p><strong>Contact:</strong> ${place.formatted_phone_number || 'N/A'}</p>
                <p>${priceLevel}</p>
                <p><strong>Rating:</strong> ${place.rating ? place.rating + '/5' : 'N/A'}</p>
            </div>
            <div class="column column-3">
                <p>${openingHoursText}</p>
            </div>
            <div class="column column-4">
                ${sentimentHtml}
            </div>
        </div>
    `;

    let infoWindow = new google.maps.InfoWindow({
        content: contentString
    });

    let marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        label: place.name,
    });

    marker.addListener('click', () => {
        if (currentInfoWindow != null) {
            currentInfoWindow.close();
        }
        infoWindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
        });
        currentInfoWindow = infoWindow;
    });

    // Display Restaurants
    let newDiv = document.createElement('div');
    newDiv.classList.add('restaurant');
    newDiv.innerHTML = contentString;
    document.querySelector('#restaurants-cont').appendChild(newDiv);
}

function analyzeRestaurantSentiment(reviews) {
    const aspects = {
        food: { positive: 0, negative: 0, keywords: ['food', 'dish', 'taste', 'flavor', 'delicious', 'bland'] },
        service: { positive: 0, negative: 0, keywords: ['service', 'staff', 'waiter', 'waitress', 'friendly', 'rude'] },
        ambience: { positive: 0, negative: 0, keywords: ['ambience', 'atmosphere', 'decor', 'noise', 'comfortable', 'crowded'] },
        value: { positive: 0, negative: 0, keywords: ['price', 'value', 'expensive', 'cheap', 'worth', 'overpriced'] }
    };
    const positiveWords = ['great', 'good', 'excellent', 'amazing', 'fantastic', 'delicious', 'friendly', 'comfortable', 'worth'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'disgusting', 'disappointing', 'rude', 'crowded', 'overpriced'];

    reviews.forEach(review => {
        const text = review.text.toLowerCase();
        
        for (let aspect in aspects) {
            const relevantText = aspects[aspect].keywords.some(keyword => text.includes(keyword));
            if (relevantText) {
                const positiveCount = positiveWords.filter(word => text.includes(word)).length;
                const negativeCount = negativeWords.filter(word => text.includes(word)).length;
                
                if (positiveCount > negativeCount) {
                    aspects[aspect].positive++;
                } else if (negativeCount > positiveCount) {
                    aspects[aspect].negative++;
                }
            }
        }
    });

    return aspects;
}

function filterByPriceRange(results) {
    console.log('Filtering results:', results);
    const priceFilter = document.getElementById('price-filter');
    console.log('Price filter element:', priceFilter);
    if (!priceFilter) return results;
    
    const selectedPrice = priceFilter.value;
    console.log('Selected price:', selectedPrice);
    if (!selectedPrice) return results;
    
    return results.filter(place => place.price_level === parseInt(selectedPrice));
}

function initializeMapWhenReady() {
    if (typeof google !== 'undefined' && google.maps) {
        console.log('Google Maps API loaded, initializing map');
        initMap();
    } else {
        console.log('Google Maps API not yet loaded, retrying...');
        setTimeout(initializeMapWhenReady, 100);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    initializeMapWhenReady();
});