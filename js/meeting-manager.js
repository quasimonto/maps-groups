// meeting-manager.js - Functions for managing meeting points

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing meeting manager');
    initMeetingManager();
});

// Initialize meeting manager
function initMeetingManager() {
    // Set up event listeners for meeting point-related actions
    setupMeetingEventListeners();
}

// Set up meeting point-related event listeners
function setupMeetingEventListeners() {
    console.log('Setting up meeting event listeners');
    
    // Add meeting point button
    const addMeetingBtn = document.getElementById('add-meeting-btn');
    if (addMeetingBtn) {
        addMeetingBtn.addEventListener('click', function() {
            setActivePage('meeting-add-section');
        });
    }
    
    // Add meeting form
    const addMeetingForm = document.getElementById('add-meeting-form');
    if (addMeetingForm) {
        addMeetingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addMeetingPoint();
        });
    }
    
    // Cancel button
    const cancelAddMeetingBtn = document.getElementById('cancel-add-meeting');
    if (cancelAddMeetingBtn) {
        cancelAddMeetingBtn.addEventListener('click', function() {
            setActivePage('meeting-list-section');
        });
    }
}

// Add a new meeting point
function addMeetingPoint() {
    // Get form values
    const nameInput = document.getElementById('meeting-name');
    if (!nameInput) {
        console.error('Meeting name input not found');
        return;
    }
    
    const name = nameInput.value;
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    // Get location
    const latInput = document.getElementById('meeting-lat');
    const lngInput = document.getElementById('meeting-lng');
    
    if (!latInput || !lngInput) {
        console.error('Location inputs not found');
        return;
    }
    
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);
    
    if (isNaN(lat) || isNaN(lng)) {
        alert('Please select a valid location');
        return;
    }
    
    // Create the position
    const position = new google.maps.LatLng(lat, lng);
    
    // Create marker
    const marker = createMeetingMarker(position, {
        name: name
    });
    
    // Create meeting object
    const meeting = {
        id: Date.now().toString(),
        name: name,
        lat: lat,
        lng: lng,
        marker: marker,
        group: null
    };
    
    // Add to global array
    window.meetingPoints.push(meeting);
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populateMeetingPointsList();
    
    // Show success message
    if (typeof showNotification === 'function') {
        showNotification(`${name} added successfully`);
    } else {
        alert(`${name} added successfully`);
    }
    
    // Reset form
    document.getElementById('add-meeting-form').reset();
    
    // Navigate back to meeting list
    setActivePage('meeting-list-section');
}

// Create a meeting marker
function createMeetingMarker(position, meeting) {
    // Get marker color based on meeting's group
    let markerColor = '#0000ff'; // Default blue for meeting points
    
    if (meeting.group && window.groups) {
        const group = window.groups.find(g => g.id === meeting.group);
        if (group) {
            markerColor = group.color;
        }
    }
    
    // Create marker with custom icon
    const marker = new google.maps.Marker({
        position: position,
        map: window.map,
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
    marker.addListener('click', function() {
        if (typeof showMeetingInfoWindow === 'function') {
            showMeetingInfoWindow(meeting, marker);
        } else {
            // Basic fallback if the info window function doesn't exist
            window.selectedMeeting = meeting;
            showMeetingModal(meeting);
        }
    });
    
    // Add drag end listener to update meeting's position
    marker.addListener('dragend', function() {
        const newPosition = marker.getPosition();
        meeting.lat = newPosition.lat();
        meeting.lng = newPosition.lng();
        
        // Save the updated data
        if (typeof saveData === 'function') {
            saveData();
        }
    });
    
    return marker;
}

// Show meeting info window
function showMeetingInfoWindow(meeting, marker) {
    // Close any open info windows
    if (window.activeInfoWindow) {
        window.activeInfoWindow.close();
    }
    
    // Get meeting's group if any
    let groupInfo = '';
    if (meeting.group && window.groups) {
        const group = window.groups.find(g => g.id === meeting.group);
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
    google.maps.event.addListener(infoWindow, 'domready', function() {
        document.getElementById('edit-meeting-btn').addEventListener('click', function() {
            editMeeting(meeting);
            infoWindow.close();
        });
        
        document.getElementById('delete-meeting-btn').addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete ${meeting.name}?`)) {
                deleteMeeting(meeting);
                infoWindow.close();
            }
        });
        
        document.getElementById('view-nearby-people-btn').addEventListener('click', function() {
            showNearbyPeople(meeting);
            infoWindow.close();
        });
    });
    
    // Open the info window
    infoWindow.open(window.map, marker);
}

// Populate the meeting points list
function populateMeetingPointsList() {
    console.log('Populating meeting points list');
    
    // Try to find either the table body or the list container
    const meetingTableBody = document.getElementById('meeting-table-body');
    const meetingList = document.getElementById('meeting-list');
    
    if (!meetingTableBody && !meetingList) {
        console.error('Neither meeting-table-body nor meeting-list found in DOM');
        return;
    }
    
    // Check if the array exists and has items
    if (!window.meetingPoints || !Array.isArray(window.meetingPoints)) {
        console.error('Meeting points array is not properly initialized');
        
        // Initialize it if needed
        window.meetingPoints = [];
        return;
    }
    
    console.log(`Found ${window.meetingPoints.length} meeting points to display`);
    
    // If using the table view
    if (meetingTableBody) {
        // Clear the table
        meetingTableBody.innerHTML = '';
        
        // Check if we have any meeting points
        if (window.meetingPoints.length === 0) {
            meetingTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-table-message">No meeting points added yet</td>
                </tr>
            `;
            return;
        }
        
        // Create a row for each meeting point
        window.meetingPoints.forEach(meeting => {
            try {
                const row = document.createElement('tr');
                
                // Get meeting's group if any
                let groupInfo = 'None';
                
                if (meeting.group && window.groups) {
                    const group = window.groups.find(g => g.id === meeting.group);
                    if (group) {
                        groupInfo = group.name;
                    }
                }
                
                row.innerHTML = `
                    <td>${meeting.name || 'Unnamed Meeting Point'}</td>
                    <td>${meeting.address || 'No address'}</td>
                    <td>${groupInfo}</td>
                    <td>
                        <button class="edit-meeting-btn small-button" data-id="${meeting.id}">Edit</button>
                        <button class="locate-meeting-btn small-button" data-id="${meeting.id}">Locate</button>
                        <button class="delete-meeting-btn small-button danger" data-id="${meeting.id}">Delete</button>
                    </td>
                `;
                
                // Add event listeners to buttons
                const editButton = row.querySelector('.edit-meeting-btn');
                if (editButton) {
                    editButton.addEventListener('click', function() {
                        editMeeting(meeting);
                    });
                }
                
                const locateButton = row.querySelector('.locate-meeting-btn');
                if (locateButton) {
                    locateButton.addEventListener('click', function() {
                        locateMeeting(meeting);
                    });
                }
                
                const deleteButton = row.querySelector('.delete-meeting-btn');
                if (deleteButton) {
                    deleteButton.addEventListener('click', function() {
                        if (confirm(`Are you sure you want to delete ${meeting.name}?`)) {
                            deleteMeeting(meeting);
                        }
                    });
                }
                
                meetingTableBody.appendChild(row);
            } catch (err) {
                console.error(`Error creating row for meeting point ${meeting.name || meeting.id}:`, err);
            }
        });
    }
    
    // If using the list view
    if (meetingList) {
        // Clear the list
        meetingList.innerHTML = '';
        
        // Apply name filter if active
        let filteredMeetings = window.meetingPoints;
        
        if (window.nameFilter && window.nameFilter !== '') {
            filteredMeetings = filteredMeetings.filter(meeting => 
                meeting.name && meeting.name.toLowerCase().includes(window.nameFilter.toLowerCase())
            );
        }
        
        // Create a list item for each meeting point
        filteredMeetings.forEach(meeting => {
            try {
                const item = document.createElement('div');
                item.className = 'meeting-item';
                
                item.innerHTML = `
                    <div>${meeting.name || 'Unnamed Meeting Point'}</div>
                    <div class="meeting-actions">
                        <button class="edit-button" data-id="${meeting.id}">✎</button>
                        <button class="delete-button" data-id="${meeting.id}">✕</button>
                    </div>
                `;
                
                // Add click event to focus on the meeting point
                item.querySelector('div').addEventListener('click', () => {
                    if (window.map && meeting.marker) {
                        window.map.panTo(meeting.marker.getPosition());
                        window.map.setZoom(15);
                    } else {
                        console.warn(`Cannot locate meeting ${meeting.name}: map or marker not available`);
                    }
                });
                
                // Add edit button handler
                const editButton = item.querySelector('.edit-button');
                if (editButton) {
                    editButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        editMeeting(meeting);
                    });
                }
                
                // Add delete button handler
                const deleteButton = item.querySelector('.delete-button');
                if (deleteButton) {
                    deleteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${meeting.name}?`)) {
                            deleteMeeting(meeting);
                        }
                    });
                }
                
                meetingList.appendChild(item);
            } catch (err) {
                console.error(`Error creating list item for meeting point ${meeting.name || meeting.id}:`, err);
            }
        });
        
        // Show message if no meeting points
        if (filteredMeetings.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-list-message';
            emptyMessage.textContent = 'No meeting points found';
            meetingList.appendChild(emptyMessage);
        }
    }
    
    console.log('Meeting points list populated successfully');
}

// Delete a meeting point
function deleteMeeting(meeting) {
    if (!meeting) {
        console.error('No meeting provided to delete');
        return;
    }
    
    // Remove marker from map
    if (meeting.marker) {
        meeting.marker.setMap(null);
    }
    
    // Remove from the array
    const index = window.meetingPoints.findIndex(m => m.id === meeting.id);
    if (index !== -1) {
        window.meetingPoints.splice(index, 1);
        
        // Save data
        if (typeof saveData === 'function') {
            saveData();
        }
        
        // Update UI
        populateMeetingPointsList();
        
        // Show success message
        if (typeof showNotification === 'function') {
            showNotification(`${meeting.name} deleted successfully`);
        } else {
            alert(`${meeting.name} deleted successfully`);
        }
    } else {
        console.warn(`Meeting point ${meeting.name || meeting.id} not found in array`);
    }
}

// Show meeting modal
function showMeetingModal(meeting = null) {
    // Get or create the modal element
    let modal = document.getElementById('meeting-modal');
    if (!modal) {
        createMeetingModal();
        modal = document.getElementById('meeting-modal');
    }
    
    // Set up modal content
    const titleElement = document.getElementById('meeting-modal-title');
    const nameInput = document.getElementById('meeting-modal-name');
    const descriptionInput = document.getElementById('meeting-modal-description');
    const groupSelect = document.getElementById('meeting-modal-group');
    
    // Set values based on meeting data
    titleElement.textContent = meeting ? 'Edit Meeting Point' : 'Add Meeting Point';
    
    if (meeting) {
        nameInput.value = meeting.name || '';
        descriptionInput.value = meeting.description || '';
    } else {
        nameInput.value = '';
        descriptionInput.value = '';
    }
    
    // Populate group dropdown
    groupSelect.innerHTML = '<option value="">No Group</option>';
    
    if (window.groups) {
        window.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            
            if (meeting && meeting.group === group.id) {
                option.selected = true;
            }
            
            groupSelect.appendChild(option);
        });
    }
    
    // Set up save button handler
    const saveButton = document.getElementById('save-meeting-modal');
    saveButton.onclick = function() {
        saveMeetingFromModal(meeting);
    };
    
    // Set up close button handler
    const closeButton = document.getElementById('close-meeting-modal');
    closeButton.onclick = function() {
        modal.style.display = 'none';
    };
    
    // Show the modal
    modal.style.display = 'flex';
}

// Create meeting modal if it doesn't exist
function createMeetingModal() {
    const modal = document.createElement('div');
    modal.id = 'meeting-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="meeting-modal-title">Meeting Point</h3>
                <button class="close-modal" id="close-meeting-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="meeting-modal-name">Name:</label>
                    <input type="text" id="meeting-modal-name" required>
                </div>
                <div class="form-group">
                    <label for="meeting-modal-description">Description:</label>
                    <textarea id="meeting-modal-description" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label for="meeting-modal-group">Group:</label>
                    <select id="meeting-modal-group">
                        <option value="">No Group</option>
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="primary-button" id="save-meeting-modal">Save</button>
                <button class="secondary-button" id="close-meeting-modal">Cancel</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Save meeting data from modal
function saveMeetingFromModal(meeting) {
    const nameInput = document.getElementById('meeting-modal-name');
    const descriptionInput = document.getElementById('meeting-modal-description');
    const groupSelect = document.getElementById('meeting-modal-group');
    
    if (!nameInput.value.trim()) {
        alert('Please enter a name for the meeting point');
        return;
    }
    
    if (meeting) {
        // Update existing meeting
        meeting.name = nameInput.value.trim();
        meeting.description = descriptionInput.value.trim();
        
        // Update group assignment
        const oldGroup = meeting.group;
        const newGroup = groupSelect.value || null;
        
        if (oldGroup !== newGroup) {
            meeting.group = newGroup;
            
            // Update marker appearance
            if (meeting.marker) {
                updateMeetingMarker(meeting);
            }
        }
    } else {
        // Get map center for new meeting
        const center = window.map.getCenter();
        
        // Create new meeting point
        const newMeeting = {
            id: Date.now().toString(),
            name: nameInput.value.trim(),
            description: descriptionInput.value.trim(),
            group: groupSelect.value || null,
            lat: center.lat(),
            lng: center.lng()
        };
        
        // Create marker
        const position = new google.maps.LatLng(newMeeting.lat, newMeeting.lng);
        newMeeting.marker = createMeetingMarker(position, newMeeting);
        
        // Add to array
        window.meetingPoints.push(newMeeting);
    }
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populateMeetingPointsList();
    
    // Close modal
    document.getElementById('meeting-modal').style.display = 'none';
}

// Update a meeting marker appearance
function updateMeetingMarker(meeting) {
    if (!meeting.marker) return;
    
    // Get marker color based on group
    let markerColor = '#0000ff'; // Default blue
    
    if (meeting.group && window.groups) {
        const group = window.groups.find(g => g.id === meeting.group);
        if (group) {
            markerColor = group.color;
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
}

// Helper function to locate a meeting point
function locateMeeting(meeting) {
    if (!meeting) {
        console.error('No meeting provided to locate');
        return;
    }
    
    if (!window.map) {
        console.error('Map not available');
        return;
    }
    
    if (!meeting.marker) {
        console.warn(`Meeting ${meeting.name} has no marker`);
        
        // Try to create a marker if we have coordinates
        if (meeting.lat && meeting.lng) {
            try {
                const position = new google.maps.LatLng(
                    parseFloat(meeting.lat),
                    parseFloat(meeting.lng)
                );
                
                meeting.marker = createMeetingMarker(position, meeting);
            } catch (err) {
                console.error(`Error creating marker for meeting ${meeting.name}:`, err);
                return;
            }
        } else {
            console.error(`Meeting ${meeting.name} has no coordinates`);
            return;
        }
    }
    
    // Center map on meeting
    window.map.setCenter(meeting.marker.getPosition());
    window.map.setZoom(15);
    
    // Highlight marker
    if (typeof highlightMarker === 'function') {
        highlightMarker(meeting.marker);
    }
}

// Show nearby people to a meeting point
function showNearbyPeople(meeting) {
    if (!meeting) {
        console.error('No meeting provided to show nearby people');
        return;
    }
    
    if (!window.map) {
        console.error('Map not available');
        return;
    }
    
    if (!meeting.marker) {
        console.error('Meeting marker not available');
        return;
    }
    
    // Create temporary overlay for displaying closest people
    const meetingPosition = meeting.marker.getPosition();
    
    // Find people within threshold distance
    const nearbyRadius = 2; // km
    const nearbyPeople = [];
    
    window.persons.forEach(person => {
        if (person.marker) {
            const personPosition = person.marker.getPosition();
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                meetingPosition, personPosition
            ) / 1000; // convert to kilometers
            
            if (distance <= nearbyRadius) {
                nearbyPeople.push({
                    person: person,
                    distance: distance.toFixed(2)
                });
            }
        }
    });
    
    // Sort by distance
    nearbyPeople.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    // Show the info
    showNearbyPeopleModal(meeting, nearbyPeople);
}

// Create and show modal with nearby people
function showNearbyPeopleModal(meeting, nearbyPeople) {
    // Get or create modal
    let modal = document.getElementById('nearby-people-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'nearby-people-modal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="nearby-people-title">People Near Meeting Point</h3>
                    <button class="close-modal" id="close-nearby-people">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="nearby-people-content"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up close button
        document.getElementById('close-nearby-people').addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Update modal content
    document.getElementById('nearby-people-title').textContent = `People Near ${meeting.name}`;
    
    const contentContainer = document.getElementById('nearby-people-content');
    contentContainer.innerHTML = '';
    
    if (nearbyPeople.length === 0) {
        contentContainer.innerHTML = '<p>No people found within 2km of this meeting point.</p>';
    } else {
        // Create a table to display the results
        const table = document.createElement('table');
        table.className = 'nearby-people-table';
        
        // Add table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Person</th>
                <th>Distance (km)</th>
                <th>Group</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        
        nearbyPeople.forEach(item => {
            const person = item.person;
            const row = document.createElement('tr');
            
            // Get person's group if any
            let groupInfo = 'None';
            if (person.group && window.groups) {
                const group = window.groups.find(g => g.id === person.group);
                if (group) {
                    groupInfo = group.name;
                }
            }
            
            row.innerHTML = `
                <td>${person.name}</td>
                <td>${item.distance}</td>
                <td>${groupInfo}</td>
                <td><button class="locate-person-btn" data-id="${person.id}">Locate</button></td>
            `;
            
            // Add event listener to locate button
            row.querySelector('.locate-person-btn').addEventListener('click', function() {
                locatePerson(person);
                modal.style.display = 'none';
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        contentContainer.appendChild(table);
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

// Locate a person on the map
function locatePerson(person) {
    if (!person) {
        console.error('No person provided to locate');
        return;
    }
    
    if (!window.map) {
        console.error('Map not available');
        return;
    }
    
    if (!person.marker) {
        console.warn(`Person ${person.name} has no marker`);
        return;
    }
    
    // Center map on person
    window.map.setCenter(person.marker.getPosition());
    window.map.setZoom(15);
    
    // Highlight marker
    if (typeof highlightMarker === 'function') {
        highlightMarker(person.marker);
    }
}

// Edit a meeting
function editMeeting(meeting) {
    if (!meeting) {
        console.error('No meeting provided to edit');
        return;
    }
    
    showMeetingModal(meeting);
}