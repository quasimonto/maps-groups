// Import/Export functionality

// Export all data to a JSON file
function exportData() {
    // Create a data object that includes all of our data
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        persons: persons.map(person => ({
            id: person.id,
            name: person.name,
            lat: person.marker.getPosition().lat(),
            lng: person.marker.getPosition().lng(),
            group: person.group,
            elder: person.elder,
            servant: person.servant,
            pioneer: person.pioneer,
            spouse: person.spouse,
            child: person.child,
            familyHead: person.familyHead
        })),
        meetingPoints: meetingPoints.map(meeting => ({
            id: meeting.id,
            name: meeting.name,
            description: meeting.description,
            lat: meeting.marker.getPosition().lat(),
            lng: meeting.marker.getPosition().lng(),
            group: meeting.group
        })),
        groups: groups.map(group => ({
            id: group.id,
            name: group.name,
            color: group.color
        }))
    };

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create a blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Import data from a JSON file
function importData(jsonData) {
    try {
        const data = JSON.parse(jsonData);
        
        // Validate the data format
        if (!data.version || !data.persons || !data.meetingPoints || !data.groups) {
            throw new Error('Invalid data format');
        }
        
        // Clear existing data
        clearAllData();
        
        // Import groups first
        data.groups.forEach(groupData => {
            createGroup(groupData.name, groupData.color, groupData.id);
        });
        
        // Import persons
        data.persons.forEach(personData => {
            try {
                // Create a proper LatLng object for the position
                const location = new google.maps.LatLng(
                    parseFloat(personData.lat),
                    parseFloat(personData.lng)
                );
                
                // Create marker
                const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    icon: getPersonMarkerIcon(personData)
                });
                
                // Create person object
                const person = {
                    id: personData.id,
                    marker: marker,
                    name: personData.name,
                    group: personData.group,
                    lat: parseFloat(personData.lat),
                    lng: parseFloat(personData.lng),
                    elder: personData.elder || false,
                    servant: personData.servant || false,
                    pioneer: personData.pioneer || false,
                    spouse: personData.spouse || false,
                    child: personData.child || false,
                    familyHead: personData.familyHead || false
                };
                
                persons.push(person);
                
                // Add click listener to the marker for editing
                marker.addListener('click', () => {
                    selectedPerson = person;
                    showPersonModal(person);
                });
                
                // Update marker color
                updatePersonColor(person);
            } catch (err) {
                console.error('Error importing person:', err, personData);
            }
        });
        
        // Import meeting points
        data.meetingPoints.forEach(meetingData => {
            try {
                // Create a proper LatLng object for the position
                const location = new google.maps.LatLng(
                    parseFloat(meetingData.lat),
                    parseFloat(meetingData.lng)
                );
                
                // Create marker
                const marker = new google.maps.Marker({
                    position: location,
                    map: map,
                    draggable: true,
                    animation: google.maps.Animation.DROP,
                    icon: getMeetingMarkerIcon(meetingData)
                });
                
                // Create meeting object
                const meeting = {
                    id: meetingData.id,
                    marker: marker,
                    name: meetingData.name,
                    description: meetingData.description || '',
                    group: meetingData.group,
                    lat: parseFloat(meetingData.lat),
                    lng: parseFloat(meetingData.lng)
                };
                
                meetingPoints.push(meeting);
                
                // Add click listener to the marker for editing
                marker.addListener('click', () => {
                    selectedMeeting = meeting;
                    showMeetingModal(meeting);
                });
                
                // Update marker color
                updateMeetingColor(meeting);
            } catch (err) {
                console.error('Error importing meeting point:', err, meetingData);
            }
        });
        
        // Update UI
        updatePersonsList();
        updateMeetingsList();
        updateGroupsList();
        
        // Fit map to all markers
        fitMapToAllMarkers();
        
        return { success: true, message: 'Data imported successfully' };
    } catch (error) {
        console.error('Import error:', error);
        return { success: false, message: `Import failed: ${error.message}` };
    }
}

// Clear all existing data from the map
function clearAllData() {
    // Remove all person markers from the map
    persons.forEach(personData => {
        personData.marker.setMap(null);
    });
    
    // Remove all meeting markers from the map
    meetingPoints.forEach(meetingData => {
        meetingData.marker.setMap(null);
    });
    
    // Clear arrays
    persons = [];
    meetingPoints = [];
    groups = [];
    
    // Reset selected items
    selectedPerson = null;
    selectedMeeting = null;
    
    // Update UI
    updatePersonsList();
    updateMeetingsList();
    updateGroupsList();
}

// Fit the map to show all markers
function fitMapToAllMarkers() {
    if (persons.length === 0 && meetingPoints.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    
    persons.forEach(person => {
        bounds.extend(person.marker.getPosition());
    });
    
    meetingPoints.forEach(meeting => {
        bounds.extend(meeting.marker.getPosition());
    });
    
    map.fitBounds(bounds);
}

// Handler for the file import input
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const result = importData(e.target.result);
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    };
    reader.readAsText(file);
    
    // Reset the file input so the same file can be loaded again if needed
    event.target.value = '';
}

// Initialize import/export functionality
function initImportExport() {
    // Add event listener for import file input
    document.getElementById('import-file-input').addEventListener('change', handleFileImport);
    
    // Add event listeners for import/export buttons
    document.getElementById('export-data').addEventListener('click', exportData);
    document.getElementById('import-data').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });
}

// Add to initialization when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initImportExport();
});