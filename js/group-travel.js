// Advanced grouping functionality using travel time data

// Auto-group people based on travel time to meeting points
function autoGroupByMeetingPoints() {
    // Check if we have enough people and meeting points
    if (persons.length < appConfig.autoGrouping.minGroupSize) {
        alert(`Need at least ${appConfig.autoGrouping.minGroupSize} people to create groups`);
        return;
    }
    
    if (meetingPoints.length === 0) {
        alert("Need at least one meeting point to create groups");
        return;
    }
    
    // Show loading indicator
    showGroupingLoadingIndicator();
    
    // Calculate travel times for all people to all meeting points
    calculateAllTravelTimes().then(travelData => {
        // Create groups based on travel times
        const newGroups = createGroupsFromTravelData(travelData);
        
        // Apply the new groups
        applyNewGroups(newGroups);
        
        // Hide loading indicator
        hideGroupingLoadingIndicator();
    });
}

// Show loading indicator while grouping
function showGroupingLoadingIndicator() {
    // Create loading overlay if it doesn't exist
    if (!document.getElementById('grouping-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'grouping-overlay';
        overlay.innerHTML = `
            <div class="grouping-loading-container">
                <div class="spinner"></div>
                <p>Creating optimal groups...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('grouping-overlay').style.display = 'flex';
    }
}

// Hide loading indicator
function hideGroupingLoadingIndicator() {
    const overlay = document.getElementById('grouping-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Calculate travel times for all persons to all meeting points
async function calculateAllTravelTimes() {
    const travelData = {
        personTravelTimes: []
    };
    
    // For each person, calculate travel times to all meeting points
    for (const person of persons) {
        const personData = {
            person: person,
            meetingPointTimes: []
        };
        
        // For each meeting point, calculate travel time
        for (const meeting of meetingPoints) {
            // Calculate straight-line distance in meters
            const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(
                person.marker.getPosition(), 
                meeting.marker.getPosition()
            );
            
            // Convert to kilometers for display
            const distanceInKm = (distanceInMeters / 1000).toFixed(1);
            
            // Estimate driving time (using the same logic as in travel-time.js)
            let drivingMinutes;
            if (distanceInMeters < 100) {
                drivingMinutes = 0;
            } else if (distanceInMeters < 500) {
                drivingMinutes = Math.max(2, Math.round(distanceInMeters / 1000 / (25/60)));
            } else {
                drivingMinutes = Math.round((distanceInMeters / 1000 / 0.417) + 2);
            }
            
            // Store the travel time data
            personData.meetingPointTimes.push({
                meetingPoint: meeting,
                drivingMinutes: drivingMinutes,
                distanceInKm: parseFloat(distanceInKm)
            });
        }
        
        // Sort meeting points by travel time (shortest first)
        personData.meetingPointTimes.sort((a, b) => a.drivingMinutes - b.drivingMinutes);
        
        // Add to the collection
        travelData.personTravelTimes.push(personData);
    }
    
    return travelData;
}

// Create groups based on travel time data
function createGroupsFromTravelData(travelData) {
    // Initialize array to store the new groups
    const newGroups = [];
    
    // Make a copy of all persons that we can remove from as they get assigned
    let unassignedPersons = [...persons];
    
    // Sort meeting points by importance (we could prioritize certain meeting points)
    // For now, just use the order they were created
    const sortedMeetingPoints = [...meetingPoints];
    
    // For each meeting point, try to create a group
    for (const meetingPoint of sortedMeetingPoints) {
        // Skip if we have no more unassigned persons
        if (unassignedPersons.length < appConfig.autoGrouping.minGroupSize) {
            break;
        }
        
        // Find people who are closest to this meeting point
        const closestPersons = findClosestPersons(
            meetingPoint, 
            unassignedPersons, 
            travelData, 
            appConfig.autoGrouping.minGroupSize
        );
        
        // If we found enough people who meet requirements, create a group
        if (closestPersons.length >= appConfig.autoGrouping.minGroupSize && 
            groupMeetsRequirements(closestPersons)) {
            
            // Create a new group
            const groupName = `Group - ${meetingPoint.name}`;
            const groupColor = getRandomColor();
            
            newGroups.push({
                name: groupName,
                color: groupColor,
                meeting: meetingPoint,
                persons: closestPersons
            });
            
            // Remove these people from the unassigned list
            unassignedPersons = unassignedPersons.filter(
                person => !closestPersons.includes(person)
            );
        }
    }
    
    // If we still have unassigned people, try to create additional groups
    if (unassignedPersons.length >= appConfig.autoGrouping.minGroupSize) {
        // Group remaining people by proximity to each other
        const additionalGroups = groupRemainingByProximity(unassignedPersons);
        newGroups.push(...additionalGroups);
    }
    
    return newGroups;
}

// Find persons closest to a meeting point
function findClosestPersons(meetingPoint, persons, travelData, minSize) {
    // Get travel times for all persons to this meeting point
    const personTravelTimes = [];
    
    for (const person of persons) {
        // Find this person's travel data
        const personData = travelData.personTravelTimes.find(
            data => data.person.id === person.id
        );
        
        if (personData) {
            // Find travel time to this meeting point
            const travelInfo = personData.meetingPointTimes.find(
                time => time.meetingPoint.id === meetingPoint.id
            );
            
            if (travelInfo) {
                personTravelTimes.push({
                    person: person,
                    drivingMinutes: travelInfo.drivingMinutes,
                    distanceInKm: travelInfo.distanceInKm
                });
            }
        }
    }
    
    // Sort by travel time (shortest first)
    personTravelTimes.sort((a, b) => a.drivingMinutes - b.drivingMinutes);
    
    // Calculate how many people we need to meet role requirements
    let requiredSize = Math.max(
        minSize,
        appConfig.autoGrouping.requirements.minElders,
        appConfig.autoGrouping.requirements.minServants,
        appConfig.autoGrouping.requirements.minPioneers
    );
    
    // Take up to 50% more than required to have a buffer for role requirements
    const maxSize = Math.min(
        Math.ceil(requiredSize * 1.5),
        personTravelTimes.length
    );
    
    // Start with the closest people
    let selectedPersons = personTravelTimes.slice(0, maxSize).map(item => item.person);
    
    // If we don't meet requirements, try adding more people until we do or run out
    while (!groupMeetsRequirements(selectedPersons) && 
           selectedPersons.length < personTravelTimes.length) {
        selectedPersons.push(personTravelTimes[selectedPersons.length].person);
    }
    
    // If we still don't meet requirements, return empty array (can't create group)
    if (!groupMeetsRequirements(selectedPersons)) {
        return [];
    }
    
    // If we have more than minimum size and meet requirements, optimize the group
    if (selectedPersons.length > minSize) {
        // Try to reduce size while still meeting requirements
        for (let i = selectedPersons.length - 1; i >= minSize; i--) {
            const testGroup = selectedPersons.slice(0, i);
            if (groupMeetsRequirements(testGroup)) {
                selectedPersons = testGroup;
            } else {
                break;
            }
        }
    }
    
    return selectedPersons;
}

// Group remaining people by proximity to each other
function groupRemainingByProximity(persons) {
    // Create a copy of persons that we can modify
    let remainingPersons = [...persons];
    const groups = [];
    
    while (remainingPersons.length >= appConfig.autoGrouping.minGroupSize) {
        // Start with the first person
        const seed = remainingPersons[0];
        const group = [seed];
        
        // Remove seed from remaining
        remainingPersons = remainingPersons.filter(p => p.id !== seed.id);
        
        // Find closest people to the seed
        const proximityOrder = remainingPersons.map(person => {
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                seed.marker.getPosition(),
                person.marker.getPosition()
            );
            return { person, distance };
        }).sort((a, b) => a.distance - b.distance);
        
        // Add people to the group until it meets requirements or we run out
        let currentIdx = 0;
        while (currentIdx < proximityOrder.length) {
            // Add next closest person
            group.push(proximityOrder[currentIdx].person);
            
            // Check if we meet requirements
            if (group.length >= appConfig.autoGrouping.minGroupSize && 
                groupMeetsRequirements(group)) {
                break;
            }
            
            currentIdx++;
        }
        
        // If we have a valid group, save it
        if (group.length >= appConfig.autoGrouping.minGroupSize && 
            groupMeetsRequirements(group)) {
            
            // Find centroid of the group to use as a virtual meeting point
            const positions = group.map(person => person.marker.getPosition());
            const centroid = findCentroid(positions);
            
            // Create a new group
            groups.push({
                name: `Group ${groups.length + 1}`,
                color: getRandomColor(),
                persons: group,
                centroid: centroid
            });
            
            // Remove these people from remaining
            remainingPersons = remainingPersons.filter(
                person => !group.slice(1).some(p => p.id === person.id)
            );
        } else {
            // If we couldn't form a valid group, break the loop
            break;
        }
    }
    
    return groups;
}

// Find the centroid (average position) of a set of points
function findCentroid(positions) {
    if (positions.length === 0) return null;
    
    let sumLat = 0;
    let sumLng = 0;
    
    for (const position of positions) {
        sumLat += position.lat();
        sumLng += position.lng();
    }
    
    return new google.maps.LatLng(
        sumLat / positions.length,
        sumLng / positions.length
    );
}

// Apply the new groups to the model
function applyNewGroups(newGroups) {
    // First, remove all people from existing groups
    persons.forEach(person => {
        person.group = null;
        updatePersonColor(person);
    });
    
    // Then create new groups and assign people
    newGroups.forEach(newGroup => {
        // Create the actual group
        const group = createGroup(newGroup.name, newGroup.color);
        
        // Assign the meeting point to this group if it exists
        if (newGroup.meeting) {
            assignMeetingToGroup(newGroup.meeting, group.id);
        }
        
        // Assign all people to this group
        newGroup.persons.forEach(person => {
            assignPersonToGroup(person, group.id);
        });
    });
    
    // Update UI
    updateGroupsList();
    updatePersonsList();
    updateMeetingsList();
}

// Add button to UI for this new grouping method
function addMeetingBasedGroupingButton() {
    const groupControls = document.querySelector('.group-controls');
    
    // Create button if it doesn't exist
    if (!document.getElementById('auto-group-meeting')) {
        const button = document.createElement('button');
        button.id = 'auto-group-meeting';
        button.textContent = 'Auto Group by Meeting Points';
        button.addEventListener('click', autoGroupByMeetingPoints);
        
        // Add after existing auto-group button
        const existingButton = document.getElementById('auto-group');
        if (existingButton && groupControls) {
            groupControls.insertBefore(button, existingButton.nextSibling);
        } else if (groupControls) {
            groupControls.appendChild(button);
        }
    }
}

// Initialize the new grouping functionality
document.addEventListener('DOMContentLoaded', () => {
    addMeetingBasedGroupingButton();
    
    // Add CSS for the loading overlay
    const style = document.createElement('style');
    style.textContent = `
        #grouping-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .grouping-loading-container {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
    `;
    document.head.appendChild(style);
});