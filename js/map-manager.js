// map-manager.js - Google Maps functionality

// Initialize the Google Map
function initMap() {
    // Get map container element
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container not found');
        return;
    }
    
    // Create map with default settings
    map = new google.maps.Map(mapElement, {
        center: { lat: 48.2082, lng: 16.3738 }, // Default center (Vienna, Austria)
        zoom: 13,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        fullscreenControl: false
    });
    
    // Initialize geocoder
    geocoder = new google.maps.Geocoder();
    
    // Create custom map controls
    addMapControls();
    
    // Create markers for existing data
    createMarkersForExistingData();
    
    // Add click listener for adding markers
    map.addListener('click', handleMapClick);
    
    // Set up search box
    setupSearchBox();
}

// Add custom controls to the map
function addMapControls() {
    // Create map controls container
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'map-controls';
    
    // Add control to center map to show all markers
    const centerButton = document.createElement('button');
    centerButton.className = 'map-control-button';
    centerButton.title = 'Show all markers';
    centerButton.innerHTML = '🔍';
    centerButton.onclick = fitMapToMarkers;
    
    // Add control to toggle person markers
    const togglePersonsButton = document.createElement('button');
    togglePersonsButton.className = 'map-control-button';
    togglePersonsButton.title = 'Toggle people markers';
    togglePersonsButton.innerHTML = '👤';
    togglePersonsButton.onclick = togglePersonMarkers;
    
    // Add control to toggle meeting markers
    const toggleMeetingsButton = document.createElement('button');
    toggleMeetingsButton.className = 'map-control-button';
    toggleMeetingsButton.title = 'Toggle meeting point markers';
    toggleMeetingsButton.innerHTML = '📍';
    toggleMeetingsButton.onclick = toggleMeetingMarkers;
    
    // Add control to add person at current center
    const addPersonButton = document.createElement('button');
    addPersonButton.className = 'map-control-button';
    addPersonButton.title = 'Add person at map center';
    addPersonButton.innerHTML = '➕';
    addPersonButton.onclick = addPersonAtCenter;
    
    // Add controls to the container
    controlsDiv.appendChild(centerButton);
    controlsDiv.appendChild(togglePersonsButton);
    controlsDiv.appendChild(toggleMeetingsButton);
    controlsDiv.appendChild(addPersonButton);
    
    // Add the control container to the map
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(controlsDiv);
}

// Set up search box functionality
function setupSearchBox() {
    const input = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    
    // Create autocomplete object
    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.bindTo('bounds', map);
    
    // Set up search button click handler
    searchButton.addEventListener('click', () => {
        searchLocation();
    });
    
    // Set up enter key to trigger search
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchLocation();
        }
    });
    
    // Handle place selection
    autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
            showNotification('No location found for this search', 'warning');
            return;
        }
        
        // Center map on the selected place
        map.setCenter(place.geometry.location);
        map.setZoom(15);
        
        // Create a temporary marker
        const marker = new google.maps.Marker({
            position: place.geometry.location,
            map: map,
            animation: google.maps.Animation.DROP,
            title: place.name,
            icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
            }
        });
        
        // Show info window with options
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="marker-info-window">
                    <div class="marker-info-title">${place.name || 'Selected Location'}</div>
                    <div class="marker-info-actions">
                        <button id="add-person-here">Add Person</button>
                        <button id="add-meeting-here">Add Meeting Point</button>
                        <button id="cancel-marker">Cancel</button>
                    </div>
                </div>
            `
        });
        
        infoWindow.open(map, marker);
        
        // Add event listeners to info window buttons
        google.maps.event.addListener(infoWindow, 'domready', () => {
            document.getElementById('add-person-here').addEventListener('click', () => {
                addPersonAtLocation(place.geometry.location, place.name || 'New Person');
                marker.setMap(null);
                infoWindow.close();
            });
            
            document.getElementById('add-meeting-here').addEventListener('click', () => {
                addMeetingPointAtLocation(place.geometry.location, place.name || 'New Meeting Point');
                marker.setMap(null);
                infoWindow.close();
            });
            
            document.getElementById('cancel-marker').addEventListener('click', () => {
                marker.setMap(null);
                infoWindow.close();
            });
        });
        
        // Remove marker when info window is closed
        google.maps.event.addListener(infoWindow, 'closeclick', () => {
            marker.setMap(null);
        });
    });
}

// Search for a location
function searchLocation() {
    const input = document.getElementById('search-input');
    const address = input.value.trim();
    
    if (!address) {
        showNotification('Please enter a location to search', 'warning');
        return;
    }
    
    geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
            if (results[0]) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
                
                // Create a temporary marker
                const marker = new google.maps.Marker({
                    position: results[0].geometry.location,
                    map: map,
                    animation: google.maps.Animation.DROP,
                    title: results[0].formatted_address,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    }
                });
                
                // Show info window with options
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div class="marker-info-window">
                            <div class="marker-info-title">${results[0].formatted_address}</div>
                            <div class="marker-info-actions">
                                <button id="add-person-here">Add Person</button>
                                <button id="add-meeting-here">Add Meeting Point</button>
                                <button id="cancel-marker">Cancel</button>
                            </div>
                        </div>
                    `
                });
                
                infoWindow.open(map, marker);
                
                // Add event listeners to info window buttons
                google.maps.event.addListener(infoWindow, 'domready', () => {
                    document.getElementById('add-person-here').addEventListener('click', () => {
                        addPersonAtLocation(results[0].geometry.location, address);
                        marker.setMap(null);
                        infoWindow.close();
                    });
                    
                    document.getElementById('add-meeting-here').addEventListener('click', () => {
                        addMeetingPointAtLocation(results[0].geometry.location, address);
                        marker.setMap(null);
                        infoWindow.close();
                    });
                    
                    document.getElementById('cancel-marker').addEventListener('click', () => {
                        marker.setMap(null);
                        infoWindow.close();
                    });
                });
                
                // Remove marker when info window is closed
                google.maps.event.addListener(infoWindow, 'closeclick', () => {
                    marker.setMap(null);
                });
            } else {
                showNotification('No results found', 'warning');
            }
        } else {
            showNotification(`Geocoding error: ${status}`, 'error');
        }
    });
}

// Handle map click for adding markers
function handleMapClick(event) {
    // Create a temporary marker
    const marker = new google.maps.Marker({
        position: event.latLng,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
    });
    
    // Show info window with options
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div class="marker-info-window">
                <div class="marker-info-title">Selected Location</div>
                <div class="marker-info-actions">
                    <button id="add-person-here">Add Person</button>
                    <button id="add-meeting-here">Add Meeting Point</button>
                    <button id="cancel-marker">Cancel</button>
                </div>
            </div>
        `
    });
    
    infoWindow.open(map, marker);
    
    // Add event listeners to info window buttons
    google.maps.event.addListener(infoWindow, 'domready', () => {
        document.getElementById('add-person-here').addEventListener('click', () => {
            addPersonAtLocation(event.latLng, 'New Person');
            marker.setMap(null);
            infoWindow.close();
        });
        
        document.getElementById('add-meeting-here').addEventListener('click', () => {
            addMeetingPointAtLocation(event.latLng, 'New Meeting Point');
            marker.setMap(null);
            infoWindow.close();
        });
        
        document.getElementById('cancel-marker').addEventListener('click', () => {
            marker.setMap(null);
            infoWindow.close();
        });
    });
    
    // Remove marker when info window is closed
    google.maps.event.addListener(infoWindow, 'closeclick', () => {
        marker.setMap(null);
    });
}

// Create markers for existing data
function createMarkersForExistingData() {
    // Create markers for people
    persons.forEach(person => {
        if (person.lat && person.lng) {
            const position = new google.maps.LatLng(person.lat, person.lng);
            person.marker = createPersonMarker(position, person);
        }
    });
    
    // Create markers for meeting points
    meetingPoints.forEach(meeting => {
        if (meeting.lat && meeting.lng) {
            const position = new google.maps.LatLng(meeting.lat, meeting.lng);
            meeting.marker = createMeetingMarker(position, meeting);
        }
    });
    
    // Center map to show all markers
    fitMapToMarkers();
}

// Create a person marker
function createPersonMarker(position, person) {
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
    
    // Get marker color based on person's roles and group
    let markerColor = settings.personColor || '#ff0000';
    
    if (person.group) {
        const group = groups.find(g => g.id === person.group);
        if (group) {
            markerColor = group.color || markerColor;
        }
    } else if (person.elder && settings.elderColor) {
        markerColor = settings.elderColor;
    }
    
    // Create marker with custom icon
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: person.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 10
        }
    });
    
    // Add click listener
    marker.addListener('click', () => {
        showPersonInfoWindow(person, marker);
    });
    
    // Add drag end listener to update person's position
    marker.addListener('dragend', () => {
        const newPosition = marker.getPosition();
        person.lat = newPosition.lat();
        person.lng = newPosition.lng();
        saveData();
    });
    
    // Add label if enabled
    if (settings.showNamesOnMarkers) {
        const label = new google.maps.InfoWindow({
            content: `<div class="marker-label">${person.name}</div>`,
            disableAutoPan: true
        });
        
        label.open(map, marker);
        
        // Store label reference for later use
        marker.label = label;
    }
    
    return marker;
}

// Create a meeting point marker
function createMeetingMarker(position, meeting) {
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
    
    // Get marker color based on meeting's group
    let markerColor = settings.meetingColor || '#0000ff';
    
    if (meeting.group) {
        const group = groups.find(g => g.id === meeting.group);
        if (group) {
            markerColor = group.color || markerColor;
        }
    }
    
    // Create marker with custom icon
    const marker = new google.maps.Marker({
        position: position,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: meeting.name,
        icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 6
        }
    });
    
    // Add click listener
    marker.addListener('click', () => {
        showMeetingInfoWindow(meeting, marker);
    });
    
    // Add drag end listener to update meeting's position
    marker.addListener('dragend', () => {
        const newPosition = marker.getPosition();
        meeting.lat = newPosition.lat();
        meeting.lng = newPosition.lng();
        saveData();
    });
    
    // Add label if enabled
    if (settings.showNamesOnMarkers) {
        const label = new google.maps.InfoWindow({
            content: `<div class="marker-label">${meeting.name}</div>`,
            disableAutoPan: true
        });
        
        label.open(map, marker);
        
        // Store label reference for later use
        marker.label = label;
    }
    
    return marker;
}

// Show info window for a person
function showPersonInfoWindow(person, marker) {
    // Close any open info windows
    if (window.activeInfoWindow) {
        window.activeInfoWindow.close();
    }
    
    // Get person's group if any
    let groupInfo = '';
    if (person.group) {
        const group = groups.find(g => g.id === person.group);
        if (group) {
            groupInfo = `<div class="info-group">Group: <strong>${group.name}</strong></div>`;
        }
    }
    
    // Get person's family if any
    let familyInfo = '';
    if (person.familyId) {
        const family = families.find(f => f.id === person.familyId);
        if (family) {
            const roleLabel = person.familyRole === 'head' ? 'Head' :
                              person.familyRole === 'spouse' ? 'Spouse' :
                              person.familyRole === 'child' ? 'Child' : '';
            familyInfo = `<div class="info-family">Family: <strong>${family.name}</strong> (${roleLabel})</div>`;
        }
    }
    
    // Build roles string
    let rolesArray = [];
    if (person.elder) rolesArray.push('Elder');
    if (person.servant) rolesArray.push('Servant');
    if (person.pioneer) rolesArray.push('Pioneer');
    if (person.leader) rolesArray.push('Leader');
    if (person.helper) rolesArray.push('Helper');
    if (person.publisher) rolesArray.push('Publisher');
    
    const rolesInfo = rolesArray.length > 0 ? 
        `<div class="info-roles">Roles: <strong>${rolesArray.join(', ')}</strong></div>` : '';
    
    // Create info window content
    const content = `
        <div class="marker-info-window">
            <div class="marker-info-title">${person.name}</div>
            <div class="marker-info-content">
                ${rolesInfo}
                ${groupInfo}
                ${familyInfo}
            </div>
            <div class="marker-info-actions">
                <button id="edit-person-btn">Edit</button>
                <button id="delete-person-btn">Delete</button>
                <button id="view-travel-times-btn">Travel Times</button>
            </div>
        </div>
    `;
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: content
    });
    
    // Store as active info window
    window.activeInfoWindow = infoWindow;
    
    // Add listeners when the DOM is ready
    google.maps.event.addListener(infoWindow, 'domready', () => {
        document.getElementById('edit-person-btn').addEventListener('click', () => {
            editPerson(person);
            infoWindow.close();
        });
        
        document.getElementById('delete-person-btn').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete ${person.name}?`)) {
                deletePerson(person);
                infoWindow.close();
            }
        });
        
        document.getElementById('view-travel-times-btn').addEventListener('click', () => {
            showTravelTimes(person);
            infoWindow.close();
        });
    });
    
    // Open the info window
    infoWindow.open(map, marker);
}

// Show info window for a meeting point
function showMeetingInfoWindow(meeting, marker) {
    // Close any open info windows
    if (window.activeInfoWindow) {
        window.activeInfoWindow.close();
    }
    
    // Get meeting's group if any
    let groupInfo = '';
    if (meeting.group) {
        const group = groups.find(g => g.id === meeting.group);
        if (group) {
            groupInfo = `<div class="info-group">Group: <strong>${group.name}</strong></div>`;
        }
    }
    
    // Create info window content
    const content = `
        <div class="marker-info-window">
            <div class="marker-info-title">${meeting.name}</div>
            <div class="marker-info-content">
                ${meeting.description ? `<div class="info-description">${meeting.description}</div>` : ''}
                ${groupInfo}
            </div>
            <div class="marker-info-actions">
                <button id="edit-meeting-btn">Edit</button>
                <button id="delete-meeting-btn">Delete</button>
                <button id="view-nearby-people-btn">Nearby People</button>
            </div>
        </div>
    `;
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: content
    });
    
    // Store as active info window
    window.activeInfoWindow = infoWindow;
    
    // Add listeners when the DOM is ready
    google.maps.event.addListener(infoWindow, 'domready', () => {
        document.getElementById('edit-meeting-btn').addEventListener('click', () => {
            editMeeting(meeting);
            infoWindow.close();
        });
        
        document.getElementById('delete-meeting-btn').addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete ${meeting.name}?`)) {
                deleteMeeting(meeting);
                infoWindow.close();
            }
        });
        
        document.getElementById('view-nearby-people-btn').addEventListener('click', () => {
            showNearbyPeople(meeting);
            infoWindow.close();
        });
    });
    
    // Open the info window
    infoWindow.open(map, marker);
}

// Add a person at the current map center
function addPersonAtCenter() {
    const center = map.getCenter();
    addPersonAtLocation(center, 'New Person');
}

// Add a person at a specific location
function addPersonAtLocation(location, name = 'New Person') {
    // Navigate to the add person form
    setActivePage('person-add-section');
    
    // Populate the form with the location
    document.getElementById('person-name').value = name;
    document.getElementById('person-lat').value = location.lat();
    document.getElementById('person-lng').value = location.lng();
    
    // Update the mini-map in the form
    updatePersonMiniMap(location);
    
    // Show notification
    showNotification('Form pre-filled with location. Complete the form to add the person.', 'info');
}

// Add a meeting point at a specific location
function addMeetingPointAtLocation(location, name = 'New Meeting Point') {
    // Navigate to the add meeting form
    setActivePage('meeting-add-section');
    
    // Populate the form with the location
    document.getElementById('meeting-name').value = name;
    document.getElementById('meeting-lat').value = location.lat();
    document.getElementById('meeting-lng').value = location.lng();
    
    // Update the mini-map in the form
    updateMeetingMiniMap(location);
    
    // Show notification
    showNotification('Form pre-filled with location. Complete the form to add the meeting point.', 'info');
}

// Update the mini-map in the person form
function updatePersonMiniMap(location) {
    const miniMapElement = document.getElementById('person-mini-map');
    if (!miniMapElement) return;
    
    // Create mini-map if it doesn't exist
    if (!window.personMiniMap) {
        window.personMiniMap = new google.maps.Map(miniMapElement, {
            center: location,
            zoom: 15,
            mapTypeId: 'roadmap',
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControl: false
        });
        
        // Create marker
        window.personMiniMarker = new google.maps.Marker({
            position: location,
            map: window.personMiniMap,
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        
        // Add drag end listener to update coordinates
        window.personMiniMarker.addListener('dragend', () => {
            const newPosition = window.personMiniMarker.getPosition();
            document.getElementById('person-lat').value = newPosition.lat();
            document.getElementById('person-lng').value = newPosition.lng();
        });
        
        // Add click listener to mini-map
        window.personMiniMap.addListener('click', (event) => {
            window.personMiniMarker.setPosition(event.latLng);
            document.getElementById('person-lat').value = event.latLng.lat();
            document.getElementById('person-lng').value = event.latLng.lng();
        });
    } else {
        // Update existing mini-map and marker
        window.personMiniMap.setCenter(location);
        window.personMiniMarker.setPosition(location);
    }
    
    // Update form fields
    document.getElementById('person-lat').value = location.lat();
    document.getElementById('person-lng').value = location.lng();
}

// Update the mini-map in the meeting form
function updateMeetingMiniMap(location) {
    const miniMapElement = document.getElementById('meeting-mini-map');
    if (!miniMapElement) return;
    
    // Create mini-map if it doesn't exist
    if (!window.meetingMiniMap) {
        window.meetingMiniMap = new google.maps.Map(miniMapElement, {
            center: location,
            zoom: 15,
            mapTypeId: 'roadmap',
            streetViewControl: false,
            mapTypeControl: false,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            },
            fullscreenControl: false
        });
        
        // Create marker
        window.meetingMiniMarker = new google.maps.Marker({
            position: location,
            map: window.meetingMiniMap,
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        
        // Add drag end listener to update coordinates
        window.meetingMiniMarker.addListener('dragend', () => {
            const newPosition = window.meetingMiniMarker.getPosition();
            document.getElementById('meeting-lat').value = newPosition.lat();
            document.getElementById('meeting-lng').value = newPosition.lng();
        });
        
        // Add click listener to mini-map
        window.meetingMiniMap.addListener('click', (event) => {
            window.meetingMiniMarker.setPosition(event.latLng);
            document.getElementById('meeting-lat').value = event.latLng.lat();
            document.getElementById('meeting-lng').value = event.latLng.lng();
        });
    } else {
        // Update existing mini-map and marker
        window.meetingMiniMap.setCenter(location);
        window.meetingMiniMarker.setPosition(location);
    }
    
    // Update form fields
    document.getElementById('meeting-lat').value = location.lat();
    document.getElementById('meeting-lng').value = location.lng();
}

// Toggle visibility of person markers
function togglePersonMarkers() {
    const areVisible = persons.length > 0 ? persons[0].marker.getVisible() : true;
    persons.forEach(person => {
        if (person.marker) {
            person.marker.setVisible(!areVisible);
            if (person.marker.label) {
                if (!areVisible) {
                    person.marker.label.open(map, person.marker);
                } else {
                    person.marker.label.close();
                }
            }
        }
    });
}

// Toggle visibility of meeting markers
function toggleMeetingMarkers() {
    const areVisible = meetingPoints.length > 0 ? meetingPoints[0].marker.getVisible() : true;
    meetingPoints.forEach(meeting => {
        if (meeting.marker) {
            meeting.marker.setVisible(!areVisible);
            if (meeting.marker.label) {
                if (!areVisible) {
                    meeting.marker.label.open(map, meeting.marker);
                } else {
                    meeting.marker.label.close();
                }
            }
        }
    });
}

// Fit map to show all markers
function fitMapToMarkers() {
    // Check if there are any markers
    if (persons.length === 0 && meetingPoints.length === 0) {
        return;
    }
    
    const bounds = new google.maps.LatLngBounds();
    
    // Add person markers to bounds
    persons.forEach(person => {
        if (person.marker) {
            bounds.extend(person.marker.getPosition());
        }
    });
    
    // Add meeting markers to bounds
    meetingPoints.forEach(meeting => {
        if (meeting.marker) {
            bounds.extend(meeting.marker.getPosition());
        }
    });
    
    // Fit map to bounds
    map.fitBounds(bounds);
    
    // If we only have one marker, zoom out a bit
    if (persons.length + meetingPoints.length === 1) {
        map.setZoom(15);
    }
}

// Update marker colors based on group membership
function updateMarkerColors() {
    // Get settings
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
    
    // Update person markers
    persons.forEach(person => {
        if (!person.marker) return;
        
        let markerColor = settings.personColor || '#ff0000';
        
        if (person.group) {
            const group = groups.find(g => g.id === person.group);
            if (group) {
                markerColor = group.color || markerColor;
            }
        } else if (person.elder && settings.elderColor) {
            markerColor = settings.elderColor;
        }
        
        // Update marker icon
        person.marker.setIcon({
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 10
        });
    });
    
    // Update meeting markers
    meetingPoints.forEach(meeting => {
        if (!meeting.marker) return;
        
        let markerColor = settings.meetingColor || '#0000ff';
        
        if (meeting.group) {
            const group = groups.find(g => g.id === meeting.group);
            if (group) {
                markerColor = group.color || markerColor;
            }
        }
        
        // Update marker icon
        meeting.marker.setIcon({
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: markerColor,
            fillOpacity: 0.9,
            strokeWeight: 1,
            strokeColor: '#ffffff',
            scale: 6
        });
    });
}

// Update marker labels based on settings
function updateMarkerLabels() {
    // Get settings
    const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
    const showLabels = settings.showNamesOnMarkers;
    
    // Update person markers
    persons.forEach(person => {
        if (!person.marker) return;
        
        // Remove existing label if any
        if (person.marker.label) {
            person.marker.label.close();
            person.marker.label = null;
        }
        
        // Add new label if enabled
        if (showLabels) {
            const label = new google.maps.InfoWindow({
                content: `<div class="marker-label">${person.name}</div>`,
                disableAutoPan: true
            });
            
            label.open(map, person.marker);
            person.marker.label = label;
        }
    });
    
    // Update meeting markers
    meetingPoints.forEach(meeting => {
        if (!meeting.marker) return;
        
        // Remove existing label if any
        if (meeting.marker.label) {
            meeting.marker.label.close();
            meeting.marker.label = null;
        }
        
        // Add new label if enabled
        if (showLabels) {
            const label = new google.maps.InfoWindow({
                content: `<div class="marker-label">${meeting.name}</div>`,
                disableAutoPan: true
            });
            
            label.open(map, meeting.marker);
            meeting.marker.label = label;
        }
    });
}

// Show travel times from a person to all meeting points
function showTravelTimes(person) {
    // Create modal if it doesn't exist
    if (!document.getElementById('travel-times-modal')) {
        createTravelTimesModal();
    }
    
    // Update modal title
    document.getElementById('travel-times-title').textContent = `Travel Times for ${person.name}`;
    
    // Clear previous content
    const travelTimesContent = document.getElementById('travel-times-content');
    travelTimesContent.innerHTML = '<div class="loading-spinner"></div>';
    
    // Show modal
    document.getElementById('travel-times-modal').style.display = 'flex';
    
    // Calculate travel times to all meeting points
    calculateTravelTimes(person);
}

// Create travel times modal
function createTravelTimesModal() {
    const modal = document.createElement('div');
    modal.id = 'travel-times-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="travel-times-title">Travel Times</h3>
                <button class="close-modal" id="close-travel-times">&times;</button>
            </div>
            <div class="modal-body">
                <div id="travel-times-content"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close button handler
    document.getElementById('close-travel-times').addEventListener('click', () => {
        document.getElementById('travel-times-modal').style.display = 'none';
    });
}

// Calculate travel times from a person to all meeting points
function calculateTravelTimes(person) {
    // Check if there are any meeting points
    if (meetingPoints.length === 0) {
        document.getElementById('travel-times-content').innerHTML = `
            <div class="alert alert-info">
                No meeting points available. Please add some meeting points first.
            </div>
        `;
        return;
    }
    
    // Get person position
    const personPosition = person.marker.getPosition();
    
    // Calculate distances and travel times to all meeting points
    const travelTimes = meetingPoints.map(meeting => {
        const meetingPosition = meeting.marker.getPosition();
        
        // Calculate straight-line distance in meters
        const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
            personPosition, meetingPosition
        );
        
        // Convert to kilometers
        const distanceInKm = (distanceInMeters / 1000).toFixed(2);
        
        // Estimate driving time (rough estimate)
        let drivingMinutes;
        if (distanceInMeters < 100) {
            drivingMinutes = 0;
        } else if (distanceInMeters < 500) {
            drivingMinutes = Math.max(2, Math.round(distanceInMeters / 1000 / (25/60)));
        } else {
            drivingMinutes = Math.round((distanceInMeters / 1000 / 0.417) + 2);
        }
        
        // Estimate walking time (5 km/h = 0.083 km/min)
        const walkingMinutes = Math.max(1, Math.round(distanceInMeters / 1000 / 0.083));
        
        return {
            meeting: meeting,
            distance: distanceInKm,
            drivingMinutes: drivingMinutes,
            walkingMinutes: walkingMinutes
        };
    });
    
    // Sort by driving time
    travelTimes.sort((a, b) => a.drivingMinutes - b.drivingMinutes);
    
    // Generate HTML table
    const table = `
        <table class="travel-times-table">
            <thead>
                <tr>
                    <th>Meeting Point</th>
                    <th>Distance</th>
                    <th>Driving</th>
                    <th>Walking</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${travelTimes.map(item => `
                    <tr>
                        <td>${item.meeting.name}</td>
                        <td>${item.distance} km</td>
                        <td>${formatTime(item.drivingMinutes)}</td>
                        <td>${formatTime(item.walkingMinutes)}</td>
                        <td><button class="show-on-map-btn" data-id="${item.meeting.id}">Show on Map</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    // Update content
    document.getElementById('travel-times-content').innerHTML = table;
    
    // Add event listeners to "Show on Map" buttons
    document.querySelectorAll('.show-on-map-btn').forEach(button => {
        button.addEventListener('click', () => {
            const meetingId = button.getAttribute('data-id');
            const meeting = meetingPoints.find(m => m.id === meetingId);
            
            if (meeting) {
                // Close the modal
                document.getElementById('travel-times-modal').style.display = 'none';
                
                // Center map on the meeting point
                map.setCenter(meeting.marker.getPosition());
                map.setZoom(15);
                
                // Show a line connecting person and meeting point
                showConnectionLine(person, meeting);
            }
        });
    });
}

// Format time in minutes to hours and minutes
function formatTime(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours} h ${mins} min`;
    }
}

// Show a line connecting person and meeting point
let connectionLine;

function showConnectionLine(person, meeting) {
    // Remove existing line if any
    if (connectionLine) {
        connectionLine.setMap(null);
    }
    
    // Create a new line
    connectionLine = new google.maps.Polyline({
        path: [
            person.marker.getPosition(),
            meeting.marker.getPosition()
        ],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map: map
    });
    
    // Remove the line after a delay
    setTimeout(() => {
        if (connectionLine) {
            connectionLine.setMap(null);
            connectionLine = null;
        }
    }, 10000);
}

// Show nearby people to a meeting point
function showNearbyPeople(meeting) {
    // Create modal if it doesn't exist
    if (!document.getElementById('nearby-people-modal')) {
        createNearbyPeopleModal();
    }
    
    // Update modal title
    document.getElementById('nearby-people-title').textContent = `People Near ${meeting.name}`;
    
    // Clear previous content
    const nearbyPeopleContent = document.getElementById('nearby-people-content');
    nearbyPeopleContent.innerHTML = '<div class="loading-spinner"></div>';
    
    // Show modal
    document.getElementById('nearby-people-modal').style.display = 'flex';
    
    // Find nearby people
    findNearbyPeople(meeting);
}

// Create nearby people modal
function createNearbyPeopleModal() {
    const modal = document.createElement('div');
    modal.id = 'nearby-people-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="nearby-people-title">Nearby People</h3>
                <button class="close-modal" id="close-nearby-people">&times;</button>
            </div>
            <div class="modal-body">
                <div id="nearby-people-content"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close button handler
    document.getElementById('close-nearby-people').addEventListener('click', () => {
        document.getElementById('nearby-people-modal').style.display = 'none';
    });
}

// Find people near a meeting point
function findNearbyPeople(meeting) {
    // Get meeting position
    const meetingPosition = meeting.marker.getPosition();
    
    // Calculate distances from all people to the meeting point
    const peopleWithDistances = persons.map(person => {
        const personPosition = person.marker.getPosition();
        
        // Calculate straight-line distance in meters
        const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
            personPosition, meetingPosition
        );
        
        // Convert to kilometers
        const distanceInKm = (distanceInMeters / 1000).toFixed(2);
        
        return {
            person: person,
            distance: distanceInKm,
            distanceInMeters: distanceInMeters
        };
    });
    
    // Sort by distance
    peopleWithDistances.sort((a, b) => a.distanceInMeters - b.distanceInMeters);
    
    // Generate HTML table
    const table = `
        <table class="nearby-people-table">
            <thead>
                <tr>
                    <th>Person</th>
                    <th>Distance</th>
                    <th>Group</th>
                    <th>Roles</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${peopleWithDistances.map(item => {
                    // Get person's group if any
                    let groupName = 'None';
                    if (item.person.group) {
                        const group = groups.find(g => g.id === item.person.group);
                        if (group) {
                            groupName = group.name;
                        }
                    }
                    
                    // Build roles string
                    let rolesArray = [];
                    if (item.person.elder) rolesArray.push('Elder');
                    if (item.person.servant) rolesArray.push('Servant');
                    if (item.person.pioneer) rolesArray.push('Pioneer');
                    if (item.person.leader) rolesArray.push('Leader');
                    if (item.person.helper) rolesArray.push('Helper');
                    if (item.person.publisher) rolesArray.push('Publisher');
                    
                    const roles = rolesArray.length > 0 ? rolesArray.join(', ') : 'None';
                    
                    return `
                        <tr>
                            <td>${item.person.name}</td>
                            <td>${item.distance} km</td>
                            <td>${groupName}</td>
                            <td>${roles}</td>
                            <td><button class="show-on-map-btn" data-id="${item.person.id}">Show on Map</button></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // Update content
    document.getElementById('nearby-people-content').innerHTML = table;
    
    // Add event listeners to "Show on Map" buttons
    document.querySelectorAll('.show-on-map-btn').forEach(button => {
        button.addEventListener('click', () => {
            const personId = button.getAttribute('data-id');
            const person = persons.find(p => p.id === personId);
            
            if (person) {
                // Close the modal
                document.getElementById('nearby-people-modal').style.display = 'none';
                
                // Center map on the person
                map.setCenter(person.marker.getPosition());
                map.setZoom(15);
                
                // Show a line connecting meeting point and person
                showConnectionLine(person, meeting);
            }
        });
    });
}

// ################################## from travel-time.js ##################################

// Travel time estimation functionality with improved distance-based calculations

// Calculate travel times from a person to all meeting points
function calculateTravelTimes(personData) {
    // If no meeting points exist, return
    if (meetingPoints.length === 0) {
        showNoMeetingPointsMessage();
        return;
    }
    
    // Show loading indicator
    showTravelTimeLoadingIndicator();
    
    // Use improved distance-based estimates
    calculateWithImprovedEstimates(personData);
}

// Calculate using improved distance-based estimates
function calculateWithImprovedEstimates(personData) {
    const origin = personData.marker.getPosition();
    
    // Results object to store all travel times
    const travelResults = {
        person: personData,
        meetingPoints: []
    };
    
    // Calculate straight-line distance and estimate travel times for each meeting point
    meetingPoints.forEach(meeting => {
        const destination = meeting.marker.getPosition();
        
        // Calculate straight-line distance in meters
        const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
            origin, destination
        );
        
        // Convert to kilometers for display
        const distanceInKm = (distanceInMeters / 1000).toFixed(1);
        
        // More realistic average speeds in urban environments
        // Driving: ~25 km/h average (accounting for traffic lights, stops, etc.)
        // For very short distances (< 500m), add a minimum time of 2 minutes for parking, etc.
        let drivingMinutes;
        if (distanceInMeters < 100) {
            // If distance is very small (same location), minimum time is still 0
            drivingMinutes = 0;
        } else if (distanceInMeters < 500) {
            // Short distances have a minimum time
            drivingMinutes = Math.max(2, Math.round(distanceInMeters / 1000 / (25/60)));
        } else {
            // Urban driving is slower than highway
            // 25 km/h = 0.417 km/min
            // Add 2 minutes for getting in/out of the car
            drivingMinutes = Math.round((distanceInMeters / 1000 / 0.417) + 2);
        }
        
        // Transit: ~15 km/h average (accounting for stops and waiting)
        // Minimum 5 minutes for very short distances (waiting for transit)
        let transitMinutes;
        if (distanceInMeters < 100) {
            // If distance is very small (same location), minimum time is still walk time
            transitMinutes = 2;
        } else if (distanceInMeters < 800) {
            // For short distances, walking might be faster than transit
            transitMinutes = Math.max(5, Math.round(distanceInMeters / 1000 / 0.08));
        } else {
            // 15 km/h = 0.25 km/min
            // Add 5 minutes for waiting and transfers
            transitMinutes = Math.round((distanceInMeters / 1000 / 0.25) + 5);
        }
        
        // Walking: ~5 km/h average
        // 5 km/h = 0.083 km/min
        let walkingMinutes;
        if (distanceInMeters < 100) {
            walkingMinutes = 0;
        } else {
            walkingMinutes = Math.max(1, Math.round(distanceInMeters / 1000 / 0.083));
        }
        
        // Format durations
        const formatDuration = (minutes) => {
            if (minutes < 60) {
                return `${minutes} mins`;
            } else {
                const hours = Math.floor(minutes / 60);
                const mins = minutes % 60;
                return `${hours} h ${mins} mins`;
            }
        };
        
        // Add to results
        travelResults.meetingPoints.push({
            id: meeting.id,
            name: meeting.name,
            travelTimes: {
                'Driving': {
                    duration: formatDuration(drivingMinutes),
                    durationValue: drivingMinutes * 60, // convert to seconds
                    distance: `${distanceInKm} km`,
                    isEstimate: true
                },
                'Transit': {
                    duration: formatDuration(transitMinutes),
                    durationValue: transitMinutes * 60,
                    distance: `${distanceInKm} km`,
                    isEstimate: true
                },
                'Walking': {
                    duration: formatDuration(walkingMinutes),
                    durationValue: walkingMinutes * 60,
                    distance: `${distanceInKm} km`,
                    isEstimate: true
                }
            }
        });
    });
    
    // Display the results
    displayTravelResults(travelResults, true);
}

// Show travel time loading indicator
function showTravelTimeLoadingIndicator() {
    const modal = document.getElementById('travel-time-modal');
    const resultsContainer = document.getElementById('travel-time-results');
    
    modal.style.display = 'flex';
    resultsContainer.innerHTML = `
        <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Calculating travel times...</p>
        </div>
    `;
}

// Show message when no meeting points exist
function showNoMeetingPointsMessage() {
    const modal = document.getElementById('travel-time-modal');
    const resultsContainer = document.getElementById('travel-time-results');
    
    modal.style.display = 'flex';
    resultsContainer.innerHTML = `
        <div class="no-results-message">
            <p>No meeting points available to calculate travel times.</p>
            <p>Please add meeting points to the map first.</p>
        </div>
    `;
}

// Display travel time results in the modal
function displayTravelResults(results, isEstimate = false) {
    const modal = document.getElementById('travel-time-modal');
    const modalTitle = document.getElementById('travel-time-modal-title');
    const resultsContainer = document.getElementById('travel-time-results');
    
    // Set the modal title with the person's name
    modalTitle.textContent = `Travel Times for ${results.person.name}`;
    
    // Sort meeting points by driving time (if available)
    results.meetingPoints.sort((a, b) => {
        const aDriving = a.travelTimes.Driving ? a.travelTimes.Driving.durationValue : Infinity;
        const bDriving = b.travelTimes.Driving ? b.travelTimes.Driving.durationValue : Infinity;
        return aDriving - bDriving;
    });
    
    // Store the results for later use
    window.currentTravelResults = results;
    
    // Create results HTML
    let resultsHTML = '';
    
    // Add estimate notice if using the fallback method
    if (isEstimate) {
        resultsHTML += `
            <div class="travel-time-summary">
                <p>Showing travel times from ${results.person.name} to all meeting points.</p>
                <p class="estimate-notice">Note: These are estimates based on straight-line distance.</p>
            </div>
        `;
    } else {
        resultsHTML += `
            <div class="travel-time-summary">
                <p>Showing travel times from ${results.person.name} to all meeting points.</p>
            </div>
        `;
    }
    
    resultsHTML += `
        <table class="travel-time-table">
            <thead>
                <tr>
                    <th>Meeting Point</th>
                    <th>Driving</th>
                    <th>Transit</th>
                    <th>Walking</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    results.meetingPoints.forEach(meetingPoint => {
        // Find the meeting point data
        const meeting = meetingPoints.find(m => m.id === meetingPoint.id);
        
        // Get the group info if available
        let groupInfo = '';
        if (meeting && meeting.group) {
            const group = groups.find(g => g.id === meeting.group);
            if (group) {
                groupInfo = `<span class="group-indicator" style="background-color: ${group.color};">${group.name}</span>`;
            }
        }
        
        resultsHTML += `
            <tr data-meeting-id="${meetingPoint.id}">
                <td class="meeting-name-cell">
                    ${meetingPoint.name} ${groupInfo}
                </td>
                <td class="travel-time-cell ${getTravelTimeClass(meetingPoint.travelTimes.Driving?.durationValue)}">
                    ${meetingPoint.travelTimes.Driving?.duration || 'N/A'}<br>
                    <span class="distance-text">${meetingPoint.travelTimes.Driving?.distance || ''}</span>
                    ${meetingPoint.travelTimes.Driving?.isEstimate ? '<span class="estimate-tag">est</span>' : ''}
                </td>
                <td class="travel-time-cell ${getTravelTimeClass(meetingPoint.travelTimes.Transit?.durationValue)}">
                    ${meetingPoint.travelTimes.Transit?.duration || 'N/A'}<br>
                    <span class="distance-text">${meetingPoint.travelTimes.Transit?.distance || ''}</span>
                    ${meetingPoint.travelTimes.Transit?.isEstimate ? '<span class="estimate-tag">est</span>' : ''}
                </td>
                <td class="travel-time-cell ${getTravelTimeClass(meetingPoint.travelTimes.Walking?.durationValue)}">
                    ${meetingPoint.travelTimes.Walking?.duration || 'N/A'}<br>
                    <span class="distance-text">${meetingPoint.travelTimes.Walking?.distance || ''}</span>
                    ${meetingPoint.travelTimes.Walking?.isEstimate ? '<span class="estimate-tag">est</span>' : ''}
                </td>
            </tr>
        `;
    });
    
    resultsHTML += `
            </tbody>
        </table>
    `;
    
    // Update the modal content
    resultsContainer.innerHTML = resultsHTML;
    
    // Add click handlers to rows
    const rows = resultsContainer.querySelectorAll('tr[data-meeting-id]');
    rows.forEach(row => {
        row.addEventListener('click', () => {
            const meetingId = row.getAttribute('data-meeting-id');
            const meeting = meetingPoints.find(m => m.id === meetingId);
            if (meeting) {
                // Zoom to the meeting point
                map.panTo(meeting.marker.getPosition());
                map.setZoom(15);
                
                // Highlight meeting point
                highlightMarker(meeting.marker);
            }
        });
    });
}

// Get CSS class based on travel time
function getTravelTimeClass(durationSeconds) {
    if (!durationSeconds || durationSeconds === Infinity) return 'travel-time-na';
    
    const minutes = durationSeconds / 60;
    
    if (minutes < 15) {
        return 'travel-time-short';
    } else if (minutes < 30) {
        return 'travel-time-medium';
    } else if (minutes < 60) {
        return 'travel-time-long';
    } else {
        return 'travel-time-very-long';
    }
}

// Highlight a marker temporarily
function highlightMarker(marker) {
    // Store original icon
    const originalIcon = marker.getIcon();
    
    // Create a larger version or different color
    let highlightIcon;
    
    if (typeof originalIcon === 'object' && originalIcon !== null) {
        // For complex icons (SVG paths, etc.)
        highlightIcon = {
            ...originalIcon,
            scale: originalIcon.scale ? originalIcon.scale * 1.5 : undefined,
            strokeWeight: originalIcon.strokeWeight ? originalIcon.strokeWeight + 2 : undefined,
            strokeColor: '#FFFF00'
        };
    } else {
        // For URL-based icons, just use a default highlight
        highlightIcon = {
            url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            scaledSize: new google.maps.Size(42, 42)
        };
    }
    
    // Set the highlighted icon
    marker.setIcon(highlightIcon);
    
    // Reset after a delay
    setTimeout(() => {
        marker.setIcon(originalIcon);
    }, 2000);
}

// Initialize travel time functionality
function initTravelTime() {
    // Set up the close button event handler
    document.getElementById('close-travel-time').addEventListener('click', () => {
        document.getElementById('travel-time-modal').style.display = 'none';
    });
}

// Show travel time modal for a person
function showTravelTimeModal(personData) {
    // Calculate travel times
    calculateTravelTimes(personData);
}

// Add to map initialization
function initTravelTimeServices() {
    initTravelTime();
}