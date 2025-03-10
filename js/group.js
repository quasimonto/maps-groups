// Updated Group-related functions with leader/helper requirements

// Create a new group
function createGroup(name, color, id = null) {
    const group = {
        id: id || Date.now().toString(),
        name: name,
        color: color
    };
    
    groups.push(group);
    updateGroupsList();
    updateGroupDropdowns();
    
    return group;
}

// Update the groups list in the sidebar
function updateGroupsList() {
    const groupList = document.getElementById('group-list');
    groupList.innerHTML = '';
    
    groups.forEach(group => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.style.borderLeft = `4px solid ${group.color}`;
        
        const personCount = persons.filter(p => p.group === group.id).length;
        const meetingCount = meetingPoints.filter(m => m.group === group.id).length;
        
        item.innerHTML = `
            <span>${group.name} (${personCount + meetingCount})</span>
            <div class="group-buttons">
                <button class="view-group" data-id="${group.id}">View</button>
                <button class="delete-group" data-id="${group.id}">✕</button>
            </div>
        `;
        
        const viewButton = item.querySelector('.view-group');
        viewButton.addEventListener('click', () => {
            // Show the group details modal instead of just viewing on map
            showGroupDetailsModal(group.id);
        });
        
        const deleteButton = item.querySelector('.delete-group');
        deleteButton.addEventListener('click', () => {
            removeGroup(group.id);
        });
        
        groupList.appendChild(item);
    });
}

// Remove a group and update all markers that were in that group
function removeGroup(groupId) {
    // Find the group index
    const groupIndex = groups.findIndex(g => g.id === groupId);
    
    if (groupIndex === -1) return;
    
    // Update all persons that were in this group
    persons.forEach(person => {
        if (person.group === groupId) {
            person.group = null;
            updatePersonColor(person);
        }
    });
    
    // Update all meeting points that were in this group
    meetingPoints.forEach(meeting => {
        if (meeting.group === groupId) {
            meeting.group = null;
            updateMeetingColor(meeting);
        }
    });
    
    // Remove the group
    groups.splice(groupIndex, 1);
    
    // Update UI
    updateGroupsList();
    updateGroupDropdowns();
    updatePersonsList();
    updateMeetingsList();
}

// Update the group dropdowns in the modals
function updateGroupDropdowns() {
    updateDropdown('person-group');
    updateDropdown('meeting-group');
}

// View a specific group (focus map on all markers in the group)
function viewGroup(groupId) {
    const groupPersons = persons.filter(p => p.group === groupId);
    const groupMeetings = meetingPoints.filter(m => m.group === groupId);
    
    if (groupPersons.length === 0 && groupMeetings.length === 0) {
        alert('No items in this group');
        return;
    }
    
    // Create bounds that include all markers in the group
    const bounds = new google.maps.LatLngBounds();
    
    groupPersons.forEach(personData => {
        bounds.extend(personData.marker.getPosition());
    });
    
    groupMeetings.forEach(meetingData => {
        bounds.extend(meetingData.marker.getPosition());
    });
    
    // Fit map to these bounds
    map.fitBounds(bounds);
}

// Check if a potential group meets the minimum requirements
function groupMeetsRequirements(personsInGroup) {
    // Check minimum group size
    if (personsInGroup.length < appConfig.autoGrouping.minGroupSize) {
        return false;
    }
    
    // Count roles in the group
    const elderCount = personsInGroup.filter(p => p.elder).length;
    const servantCount = personsInGroup.filter(p => p.servant).length;
    const pioneerCount = personsInGroup.filter(p => p.pioneer).length;
    const leaderCount = personsInGroup.filter(p => p.leader).length;
    const helperCount = personsInGroup.filter(p => p.helper).length;
    
    // Check role requirements
    if (elderCount < appConfig.autoGrouping.requirements.minElders) {
        return false;
    }
    
    if (servantCount < appConfig.autoGrouping.requirements.minServants) {
        return false;
    }
    
    if (pioneerCount < appConfig.autoGrouping.requirements.minPioneers) {
        return false;
    }
    
    // Check new requirements
    if (leaderCount < appConfig.autoGrouping.requirements.minLeaders) {
        return false;
    }
    
    if (helperCount < appConfig.autoGrouping.requirements.minHelpers) {
        return false;
    }
    
    return true;
}

// Auto-group items based on proximity and configuration settings
function autoGroupByArea() {
    if (persons.length < appConfig.autoGrouping.minGroupSize) {
        alert(`Need at least ${appConfig.autoGrouping.minGroupSize} people to create groups`);
        return;
    }
    
    // Show loading indicator
    showGroupingLoadingIndicator();
    
    // Combine all markers for clustering
    const allItems = [
        ...persons.map(p => ({...p, type: 'person'})),
        ...meetingPoints.map(m => ({...m, type: 'meeting'}))
    ];
    
    // Simple clustering algorithm
    // Group items that are within a certain distance of each other
    let ungroupedItems = [...allItems];
    let autoGroups = [];
    
    while (ungroupedItems.length > 0) {
        const seed = ungroupedItems[0];
        const group = [seed];
        ungroupedItems.splice(0, 1);
        
        for (let i = ungroupedItems.length - 1; i >= 0; i--) {
            const item = ungroupedItems[i];
            const distance = calculateDistance(
                seed.lat, seed.lng,
                item.lat, item.lng
            );
            
            if (distance <= MAX_AUTO_GROUP_DISTANCE) {
                group.push(item);
                ungroupedItems.splice(i, 1);
            }
        }
        
        // Check if the group meets requirements
        const personsInGroup = group.filter(item => item.type === 'person');
        
        if (groupMeetsRequirements(personsInGroup)) {
            autoGroups.push(group);
        } else {
            // Put these items back in ungrouped list for potential inclusion in other groups
            ungroupedItems.push(...group);
        }
    }
    
    // If no valid groups could be formed
    if (autoGroups.length === 0) {
        alert("Couldn't create any groups that meet the requirements. Try adjusting your settings.");
        hideGroupingLoadingIndicator();
        return;
    }
    
    // Create actual groups for clusters
    autoGroups.forEach((group, index) => {
        const groupName = `Auto Group ${index + 1}`;
        const color = getRandomColor();
        const newGroup = createGroup(groupName, color);
        
        // Assign items to this group
        group.forEach(item => {
            if (item.type === 'person') {
                const person = persons.find(p => p.id === item.id);
                if (person) {
                    assignPersonToGroup(person, newGroup.id);
                }
            } else if (item.type === 'meeting') {
                const meeting = meetingPoints.find(m => m.id === item.id);
                if (meeting) {
                    assignMeetingToGroup(meeting, newGroup.id);
                }
            }
        });
    });
    
    updatePersonsList();
    updateMeetingsList();
    updateMarkerColors();
    
    // Hide loading indicator
    hideGroupingLoadingIndicator();
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

// Update marker colors based on their groups
function updateMarkerColors() {
    persons.forEach(personData => {
        updatePersonColor(personData);
    });
    
    meetingPoints.forEach(meetingData => {
        updateMeetingColor(meetingData);
    });
}