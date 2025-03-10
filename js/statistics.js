// Statistics functionality

// Show statistics modal
function showStatisticsModal() {
    // Update all statistics
    updateAllStatistics();
    
    // Show the modal
    document.getElementById('statistics-modal').style.display = 'flex';
}

// Update all statistics in the modal
function updateAllStatistics() {
    // Update people statistics
    updatePeopleStatistics();
    
    // Update location statistics
    updateLocationStatistics();
    
    // Update groups overview
    updateGroupsOverview();
}

// Update people statistics
function updatePeopleStatistics() {
    // Count roles
    const elderCount = persons.filter(p => p.elder).length;
    const servantCount = persons.filter(p => p.servant).length;
    const pioneerCount = persons.filter(p => p.pioneer).length;
    const leaderCount = persons.filter(p => p.leader).length;
    const helperCount = persons.filter(p => p.helper).length;
    const childCount = persons.filter(p => p.child).length;
    const familyHeadCount = persons.filter(p => p.familyHead).length;
    
    // Update statistics elements
    document.getElementById('stat-total-people').textContent = persons.length;
    document.getElementById('stat-total-elders').textContent = elderCount;
    document.getElementById('stat-total-servants').textContent = servantCount;
    document.getElementById('stat-total-pioneers').textContent = pioneerCount;
    document.getElementById('stat-total-leaders').textContent = leaderCount;
    document.getElementById('stat-total-helpers').textContent = helperCount;
    document.getElementById('stat-total-children').textContent = childCount;
    document.getElementById('stat-total-familyheads').textContent = familyHeadCount;
}

// Update location statistics
function updateLocationStatistics() {
    // Count groups and meeting points
    const totalGroups = groups.length;
    const totalMeetings = meetingPoints.length;
    
    // Count people in groups and not in groups
    const peopleInGroups = persons.filter(p => p.group !== null).length;
    const peopleNotInGroups = persons.length - peopleInGroups;
    
    // Update statistics elements
    document.getElementById('stat-total-groups').textContent = totalGroups;
    document.getElementById('stat-total-meetings').textContent = totalMeetings;
    document.getElementById('stat-people-in-groups').textContent = peopleInGroups;
    document.getElementById('stat-people-not-in-groups').textContent = peopleNotInGroups;
}

// Update groups overview
function updateGroupsOverview() {
    const groupsList = document.getElementById('groups-statistics-list');
    groupsList.innerHTML = '';
    
    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="empty-list-message">No groups created yet</div>';
        return;
    }
    
    // Sort groups by name
    const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a group statistics item for each group
    sortedGroups.forEach(group => {
        // Find all persons in the group
        const groupPersons = persons.filter(p => p.group === group.id);
        
        const item = document.createElement('div');
        item.className = 'group-stat-item';
        
        item.innerHTML = `
            <div class="group-stat-header">
                <div class="group-stat-name">
                    <span class="group-color-indicator" style="background-color: ${group.color};"></span>
                    ${group.name}
                </div>
                <button class="view-group-btn" data-id="${group.id}">View</button>
            </div>
            <div class="group-stat-details">
                <span class="group-stat-detail">${groupPersons.length} Members</span>
            </div>
        `;
        
        groupsList.appendChild(item);
    });
}

// Add statistics button to the map
function addStatisticsButton() {
    // Create the button if it doesn't exist
    if (!document.getElementById('statistics-button')) {
        const button = document.createElement('div');
        button.id = 'statistics-button';
        button.className = 'stats-button';
        button.title = 'Show Statistics';
        button.innerHTML = '📊';
        button.addEventListener('click', showStatisticsModal);
        
        // Add to the map container
        document.getElementById('map-container').appendChild(button);
    }
}

// Initialize statistics functionality
function initStatistics() {
    // Add the statistics button
    addStatisticsButton();
    
    // Set up close button handler
    document.getElementById('close-statistics').addEventListener('click', () => {
        document.getElementById('statistics-modal').style.display = 'none';
    });
}

// Add to initialization
document.addEventListener('DOMContentLoaded', initStatistics);