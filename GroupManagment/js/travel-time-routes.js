// Travel time estimation functionality with fallback calculation

// Calculate travel times from a person to all meeting points
function calculateTravelTimes(personData) {
    // If no meeting points exist, return
    if (meetingPoints.length === 0) {
        showNoMeetingPointsMessage();
        return;
    }
    
    // Show loading indicator
    showTravelTimeLoadingIndicator();
    
    // Use fallback method since Routes API is having issues
    calculateWithFallbackMethod(personData);
}

// Fallback calculation method using direct distance and estimates
function calculateWithFallbackMethod(personData) {
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
        
        // Estimate travel times based on distance
        // Driving: ~50 km/h average = 0.833 km/min
        const drivingMinutes = Math.round(distanceInMeters / 1000 / 0.833);
        // Transit: ~30 km/h average = 0.5 km/min + 5 min waiting time
        const transitMinutes = Math.round(distanceInMeters / 1000 / 0.5) + 5;
        // Walking: ~5 km/h average = 0.083 km/min
        const walkingMinutes = Math.round(distanceInMeters / 1000 / 0.083);
        
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
    
    // Create results HTML
    let resultsHTML = '';
    
    // Add estimate notice if using the fallback method
    if (isEstimate) {
        resultsHTML += `
            <div class="travel-time-summary">
                <p>Showing estimated travel times from ${results.person.name} to all meeting points.</p>
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
    calculateTravelTimes(personData);
}

// Add to map initialization
function initTravelTimeServices() {
    initTravelTime();
}