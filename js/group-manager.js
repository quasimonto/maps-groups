// group-manager.js - Functions for managing groups

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing group manager');
    initGroupManager();
});

// Initialize group manager
function initGroupManager() {
    // Set up event listeners for group-related actions
    setupGroupEventListeners();
}

// Set up group-related event listeners
function setupGroupEventListeners() {
    console.log('Setting up group event listeners');
    
    // Create group button
    const createGroupBtn = document.getElementById('create-group-btn');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', function() {
            setActivePage('group-create-section');
        });
    }
    
    // Create group form
    const createGroupForm = document.getElementById('create-group-form');
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createGroup();
        });
    }
    
    // Cancel button
    const cancelCreateGroupBtn = document.getElementById('cancel-create-group');
    if (cancelCreateGroupBtn) {
        cancelCreateGroupBtn.addEventListener('click', function() {
            setActivePage('groups-list-section');
        });
    }
    
    // Auto create groups button
    const autoCreateGroupsBtn = document.getElementById('auto-create-groups-btn');
    if (autoCreateGroupsBtn) {
        autoCreateGroupsBtn.addEventListener('click', function() {
            setActivePage('group-auto-section');
        });
    }
    
    // Run auto group button
    const runAutoGroupBtn = document.getElementById('run-auto-group');
    if (runAutoGroupBtn) {
        runAutoGroupBtn.addEventListener('click', autoCreateGroups);
    }
}

// Create a new group
function createGroup() {
    // Get form values
    const nameInput = document.getElementById('group-name');
    const colorInput = document.getElementById('group-color');
    const leaderSelect = document.getElementById('group-leader');
    const helperSelect = document.getElementById('group-helper');
    
    if (!nameInput || !colorInput) {
        console.error('Group form elements not found');
        return;
    }
    
    const name = nameInput.value;
    const color = colorInput.value;
    const leaderId = leaderSelect ? leaderSelect.value : '';
    const helperId = helperSelect ? helperSelect.value : '';
    
    if (!name) {
        alert('Please enter a group name');
        return;
    }
    
    // Create the group object
    const group = {
        id: 'group_' + Date.now(),
        name: name,
        color: color || getRandomColor()
    };
    
    // Add the group to the global array
    window.groups.push(group);
    
    // If leader is selected, assign role
    if (leaderId) {
        const leader = window.persons.find(p => p.id === leaderId);
        if (leader) {
            // First, remove any existing leader role from others in this group
            window.persons.forEach(person => {
                if (person.group === group.id && person.leader) {
                    person.leader = false;
                }
            });
            
            // Assign to group and set as leader
            leader.group = group.id;
            leader.leader = true;
            
            // Update marker
            updatePersonMarker(leader);
        }
    }
    
    // If helper is selected, assign role
    if (helperId) {
        const helper = window.persons.find(p => p.id === helperId);
        if (helper) {
            // First, remove any existing helper role from others in this group
            window.persons.forEach(person => {
                if (person.group === group.id && person.helper) {
                    person.helper = false;
                }
            });
            
            // Assign to group and set as helper
            helper.group = group.id;
            helper.helper = true;
            
            // Update marker
            updatePersonMarker(helper);
        }
    }
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populateGroupsList();
    
    // Update group dropdowns
    populateGroupDropdowns();
    
    // Show success message
    if (typeof showNotification === 'function') {
        showNotification(`${name} group created successfully`);
    } else {
        alert(`${name} group created successfully`);
    }
    
    // Reset form
    document.getElementById('create-group-form').reset();
    
    // Navigate back to groups list
    setActivePage('groups-list-section');
}

// Update a person's marker
function updatePersonMarker(person) {
    if (!person.marker) return;
    
    // Get group color if any
    let groupColor = null;
    if (person.group) {
        const group = window.groups.find(g => g.id === person.group);
        if (group) {
            groupColor = group.color;
        }
    }
    
    // Update marker icon
    if (typeof getPersonMarkerIcon === 'function') {
        person.marker.setIcon(getPersonMarkerIcon(person, groupColor));
    }
}

// Populate the groups list
function populateGroupsList() {
    console.log('Populating groups list');
    const groupsTableBody = document.getElementById('groups-table-body');
    if (!groupsTableBody) {
        console.error('Groups table body not found');
        return;
    }
    
    // Clear the table
    groupsTableBody.innerHTML = '';
    
    // Check if we have any groups
    if (!window.groups || window.groups.length === 0) {
        groupsTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table-message">No groups created yet</td>
            </tr>
        `;
        return;
    }
    
    // Create a row for each group
    window.groups.forEach(group => {
        const row = document.createElement('tr');
        
        // Get group members
        const groupMembers = window.persons.filter(p => p.group === group.id);
        
        // Get meeting points
        const groupMeetings = window.meetingPoints.filter(m => m.group === group.id);
        
        // Get leaders and helpers
        const leaders = groupMembers.filter(p => p.leader);
        const helpers = groupMembers.filter(p => p.helper);
        
        let leadersText = 'None';
        if (leaders.length > 0) {
            leadersText = leaders.map(l => l.name).join(', ');
        }
        
        row.innerHTML = `
            <td style="background-color: ${group.color}33;">
                <span class="color-indicator" style="background-color: ${group.color};"></span>
                ${group.name}
            </td>
            <td>${groupMembers.length} people</td>
            <td>${groupMeetings.length} locations</td>
            <td>${leadersText}</td>
            <td>
                <button class="view-group-btn small-button" data-id="${group.id}">View</button>
                <button class="edit-group-btn small-button" data-id="${group.id}">Edit</button>
                <button class="delete-group-btn small-button danger" data-id="${group.id}">Delete</button>
            </td>
        `;
        
        // Add event listeners to buttons
        row.querySelector('.view-group-btn').addEventListener('click', function() {
            viewGroup(group.id);
        });
        
        row.querySelector('.edit-group-btn').addEventListener('click', function() {
            showGroupDetailsModal(group.id);
        });
        
        row.querySelector('.delete-group-btn').addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete the ${group.name} group?`)) {
                deleteGroup(group.id);
            }
        });
        
        groupsTableBody.appendChild(row);
    });
}

// View a group on the map
function viewGroup(groupId) {
    const group = window.groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Find all markers in the group
    const groupMembers = window.persons.filter(p => p.group === groupId);
    const groupMeetings = window.meetingPoints.filter(m => m.group === groupId);
    
    // Check if we have any markers
    if (groupMembers.length === 0 && groupMeetings.length === 0) {
        alert('No markers in this group to display');
        return;
    }
    
    // Create bounds object
    const bounds = new google.maps.LatLngBounds();
    
    // Add member markers to bounds
    groupMembers.forEach(person => {
        if (person.marker) {
            bounds.extend(person.marker.getPosition());
            
            // Highlight temporarily
            if (typeof highlightMarker === 'function') {
                highlightMarker(person.marker);
            }
        }
    });
    
    // Add meeting markers to bounds
    groupMeetings.forEach(meeting => {
        if (meeting.marker) {
            bounds.extend(meeting.marker.getPosition());
            
            // Highlight temporarily
            if (typeof highlightMarker === 'function') {
                highlightMarker(meeting.marker);
            }
        }
    });
    
    // Fit map to bounds
    if (window.map) {
        window.map.fitBounds(bounds);
    }
}

// Delete a group
function deleteGroup(groupId) {
    const group = window.groups.find(g => g.id === groupId);
    if (!group) return;
    
    // Remove group assignment from all members
    window.persons.forEach(person => {
        if (person.group === groupId) {
            person.group = null;
            
            // Remove leader/helper roles
            if (person.leader) person.leader = false;
            if (person.helper) person.helper = false;
            
            // Update marker
            updatePersonMarker(person);
        }
    });
    
    // Remove group assignment from all meeting points
    window.meetingPoints.forEach(meeting => {
        if (meeting.group === groupId) {
            meeting.group = null;
            
            // Update marker
            if (typeof updateMeetingMarker === 'function') {
                updateMeetingMarker(meeting);
            }
        }
    });
    
    // Remove the group from the array
    const index = window.groups.findIndex(g => g.id === groupId);
    if (index !== -1) {
        window.groups.splice(index, 1);
    }
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populateGroupsList();
    
    // Update group dropdowns
    populateGroupDropdowns();
    
    // Show success message
    if (typeof showNotification === 'function') {
        showNotification(`Group deleted successfully`);
    } else {
        alert(`Group deleted successfully`);
    }
}

// Group details modal
let selectedGroup = null;

// Show group details modal
function showGroupDetailsModal(groupId) {
    console.log('Showing group details modal for group:', groupId);
    
    // Find the group
    const group = window.groups.find(g => g.id === groupId);
    if (!group) {
        console.error('Group not found:', groupId);
        return;
    }
    
    selectedGroup = group;
    
    // Create the modal if it doesn't exist
    if (!document.getElementById('group-details-modal')) {
        createGroupDetailsModal();
    }
    
    // Get the modal elements
    const modal = document.getElementById('group-details-modal');
    const titleElement = document.getElementById('group-details-title');
    const nameInput = document.getElementById('edit-group-name');
    const colorInput = document.getElementById('edit-group-color');
    
    if (!modal || !titleElement || !nameInput || !colorInput) {
        console.error('Group details modal elements not found');
        return;
    }
    
    // Set the title and form fields
    titleElement.textContent = `Group Details: ${group.name}`;
    nameInput.value = group.name;
    colorInput.value = group.color;
    
    // Update group statistics
    updateGroupStatistics(group);
    
    // Update members list
    updateGroupMembersList(group);
    
    // Update meeting points list
    updateGroupMeetingsList(group);
    
    // Set up family management if it's present
    const familySection = document.getElementById('group-family-management');
    if (familySection && typeof createFamilyManagementSection === 'function') {
        createFamilyManagementSection(modal, group);
    }
    
    // Set up member management 
    const memberSection = document.getElementById('group-member-management');
    if (!memberSection) {
        createMemberManagementSection(modal, group);
    } else {
        updateAvailablePeopleList(group);
    }
    
    // Set up meeting point management
    const meetingSection = document.getElementById('group-meeting-management');
    if (!meetingSection) {
        createMeetingManagementSection(modal, group);
    } else {
        updateAvailableMeetingsList(group);
    }
    
    // Show the modal
    modal.style.display = 'flex';
}

// Create group details modal
function createGroupDetailsModal() {
    console.log('Creating group details modal');
    
    const modal = document.createElement('div');
    modal.id = 'group-details-modal';
    modal.className = 'modal';
    
    modal.innerHTML = `
        <div class="modal-content group-details-modal-content">
            <div class="modal-header">
                <h3 id="group-details-title">Group Details</h3>
                <button class="close-modal" id="close-group-details">&times;</button>
            </div>
            <div class="group-details-container">
                <div class="group-edit-section">
                    <h4>Group Information</h4>
                    <div class="form-row">
                        <label for="edit-group-name">Name:</label>
                        <input type="text" id="edit-group-name">
                    </div>
                    <div class="form-row">
                        <label for="edit-group-color">Color:</label>
                        <input type="color" id="edit-group-color">
                    </div>
                    <button id="save-group-details" class="primary-button">Save Changes</button>
                </div>
                
                <div class="group-stats-section">
                    <h4>Group Statistics</h4>
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span class="stat-label">Total Members:</span>
                            <span id="group-stat-total" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Elders:</span>
                            <span id="group-stat-elders" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Servants:</span>
                            <span id="group-stat-servants" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Pioneers:</span>
                            <span id="group-stat-pioneers" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Leaders:</span>
                            <span id="group-stat-leaders" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Helpers:</span>
                            <span id="group-stat-helpers" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Children:</span>
                            <span id="group-stat-children" class="stat-value">0</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Meeting Points:</span>
                            <span id="group-stat-meetings" class="stat-value">0</span>
                        </div>
                    </div>
                </div>
                
                <div class="group-members-section">
                    <h4>Group Members</h4>
                    <div id="group-members-list" class="details-list"></div>
                </div>
                
                <div class="group-meetings-section">
                    <h4>Meeting Points</h4>
                    <div id="group-meetings-list" class="details-list"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('close-group-details').addEventListener('click', function() {
        modal.style.display = 'none';
        selectedGroup = null;
    });
    
    document.getElementById('save-group-details').addEventListener('click', saveGroupDetails);
    
    // Add styles if they don't exist
    addGroupDetailsStyles();
}

// Update group statistics
function updateGroupStatistics(group) {
    console.log('Updating group statistics');
    
    // Find all persons in the group
    const groupPersons = window.persons.filter(p => p.group === group.id);
    
    // Count roles
    const elderCount = groupPersons.filter(p => p.elder).length;
    const servantCount = groupPersons.filter(p => p.servant).length;
    const pioneerCount = groupPersons.filter(p => p.pioneer).length;
    const leaderCount = groupPersons.filter(p => p.leader).length;
    const helperCount = groupPersons.filter(p => p.helper).length;
    const childCount = groupPersons.filter(p => p.child).length;
    
    // Find meeting points in the group
    const groupMeetings = window.meetingPoints.filter(m => m.group === group.id);
    
    // Update statistics elements
    const totalElement = document.getElementById('group-stat-total');
    const eldersElement = document.getElementById('group-stat-elders');
    const servantsElement = document.getElementById('group-stat-servants');
    const pioneersElement = document.getElementById('group-stat-pioneers');
    const leadersElement = document.getElementById('group-stat-leaders');
    const helpersElement = document.getElementById('group-stat-helpers');
    const childrenElement = document.getElementById('group-stat-children');
    const meetingsElement = document.getElementById('group-stat-meetings');
    
    if (totalElement) totalElement.textContent = groupPersons.length;
    if (eldersElement) eldersElement.textContent = elderCount;
    if (servantsElement) servantsElement.textContent = servantCount;
    if (pioneersElement) pioneersElement.textContent = pioneerCount;
    if (leadersElement) leadersElement.textContent = leaderCount;
    if (helpersElement) helpersElement.textContent = helperCount;
    if (childrenElement) childrenElement.textContent = childCount;
    if (meetingsElement) meetingsElement.textContent = groupMeetings.length;
}

// Update the group members list
function updateGroupMembersList(group) {
    console.log('Updating group members list');
    
    const membersList = document.getElementById('group-members-list');
    if (!membersList) {
        console.error('Group members list element not found');
        return;
    }
    
    // Clear the list
    membersList.innerHTML = '';
    
    // Find all persons in the group
    const groupPersons = window.persons.filter(p => p.group === group.id);
    
    if (groupPersons.length === 0) {
        membersList.innerHTML = '<div class="empty-list-message">No members in this group</div>';
        return;
    }
    
    // Sort by name
    groupPersons.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a member item for each person
    groupPersons.forEach(person => {
        const item = document.createElement('div');
        item.className = 'member-item';
        
        // Generate role text
        let roleText = [];
        if (person.elder) roleText.push('Elder');
        if (person.servant) roleText.push('Servant');
        if (person.pioneer) roleText.push('Pioneer');
        if (person.leader) roleText.push('Leader');
        if (person.helper) roleText.push('Helper');
        if (person.child) roleText.push('Child');
        
        // Get family info
        let familyInfo = '';
        if (person.familyId && window.families) {
            const family = window.families.find(f => f.id === person.familyId);
            if (family) {
                const roleLabel = person.familyRole === 'head' ? 'Head' :
                                 person.familyRole === 'spouse' ? 'Spouse' :
                                 person.familyRole === 'child' ? 'Child' : '';
                familyInfo = `<div class="member-family">${family.name} (${roleLabel})</div>`;
            }
        }
        
        item.innerHTML = `
            <div class="member-info">
                <div class="member-name">${person.name}</div>
                <div class="member-role">${roleText.join(', ') || 'Publisher'}</div>
                ${familyInfo}
            </div>
            <div class="member-actions">
                <button class="member-locate-btn small-button" data-id="${person.id}">Locate</button>
                <button class="member-remove-btn small-button danger" data-id="${person.id}">Remove</button>
            </div>
        `;
        
        // Add event listeners
        item.querySelector('.member-locate-btn').addEventListener('click', function() {
            locatePerson(person);
        });
        
        item.querySelector('.member-remove-btn').addEventListener('click', function() {
            removePersonFromGroup(person);
        });
        
        membersList.appendChild(item);
    });
}

// Update the meeting points list
function updateGroupMeetingsList(group) {
    console.log('Updating group meetings list');
    
    const meetingsList = document.getElementById('group-meetings-list');
    if (!meetingsList) {
        console.error('Group meetings list element not found');
        return;
    }
    
    // Clear the list
    meetingsList.innerHTML = '';
    
    // Find all meeting points in the group
    const groupMeetings = window.meetingPoints.filter(m => m.group === group.id);
    
    if (groupMeetings.length === 0) {
        meetingsList.innerHTML = '<div class="empty-list-message">No meeting points in this group</div>';
        return;
    }
    
    // Sort by name
    groupMeetings.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create a meeting item for each meeting point
    groupMeetings.forEach(meeting => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        
        item.innerHTML = `
            <div class="meeting-info">
                <div class="meeting-name">${meeting.name}</div>
            </div>
            <div class="meeting-actions">
                <button class="meeting-locate-btn small-button" data-id="${meeting.id}">Locate</button>
                <button class="meeting-remove-btn small-button danger" data-id="${meeting.id}">Remove</button>
            </div>
        `;
        
        // Add event listeners
        item.querySelector('.meeting-locate-btn').addEventListener('click', function() {
            locateMeeting(meeting);
        });
        
        item.querySelector('.meeting-remove-btn').addEventListener('click', function() {
            removeMeetingFromGroup(meeting);
        });
        
        meetingsList.appendChild(item);
    });
}

// Create member management section
function createMemberManagementSection(modal, group) {
    console.log('Creating member management section');
    
    const detailsContainer = modal.querySelector('.group-details-container');
    if (!detailsContainer) {
        console.error('Group details container not found');
        return;
    }
    
    // Create section
    const section = document.createElement('div');
    section.id = 'group-member-management';
    section.className = 'group-management-section';
    
    section.innerHTML = `
        <h4>Add Members</h4>
        <div class="management-filters">
            <div class="filter-row">
                <input type="text" id="member-filter-name" placeholder="Filter by name" class="filter-input">
                <div class="role-filter-container">
                    <label>
                        <input type="checkbox" id="member-filter-elder">
                        Elders
                    </label>
                    <label>
                        <input type="checkbox" id="member-filter-servant">
                        Servants
                    </label>
                    <label>
                        <input type="checkbox" id="member-filter-pioneer">
                        Pioneers
                    </label>
                    <label>
                        <input type="checkbox" id="member-filter-leader">
                        Leaders
                    </label>
                    <label>
                        <input type="checkbox" id="member-filter-helper">
                        Helpers
                    </label>
                    <label>
                        <input type="checkbox" id="member-filter-publisher">
                        Publishers
                    </label>
                </div>
            </div>
            <button id="apply-member-filter" class="filter-button">Apply Filter</button>
            <button id="clear-member-filter" class="filter-button">Clear Filter</button>
        </div>
        <div class="available-items-container">
            <h5>Available People</h5>
            <div id="available-people-list" class="available-items-list"></div>
        </div>
    `;
    
    // Add to container
    detailsContainer.appendChild(section);
    
    // Add event listeners
    const applyFilterBtn = section.querySelector('#apply-member-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            updateAvailablePeopleList(group);
        });
    }
    
    const clearFilterBtn = section.querySelector('#clear-member-filter');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function() {
            const nameFilter = section.querySelector('#member-filter-name');
            const elderFilter = section.querySelector('#member-filter-elder');
            const servantFilter = section.querySelector('#member-filter-servant');
            const pioneerFilter = section.querySelector('#member-filter-pioneer');
            const leaderFilter = section.querySelector('#member-filter-leader');
            const helperFilter = section.querySelector('#member-filter-helper');
            const publisherFilter = section.querySelector('#member-filter-publisher');
            
            if (nameFilter) nameFilter.value = '';
            if (elderFilter) elderFilter.checked = false;
            if (servantFilter) servantFilter.checked = false;
            if (pioneerFilter) pioneerFilter.checked = false;
            if (leaderFilter) leaderFilter.checked = false;
            if (helperFilter) helperFilter.checked = false;
            if (publisherFilter) publisherFilter.checked = false;
            
            updateAvailablePeopleList(group);
        });
    }
    
    // Populate available people
    updateAvailablePeopleList(group);
}

// Create meeting management section
function createMeetingManagementSection(modal, group) {
    console.log('Creating meeting management section');
    
    const detailsContainer = modal.querySelector('.group-details-container');
    if (!detailsContainer) {
        console.error('Group details container not found');
        return;
    }
    
    // Create section
    const section = document.createElement('div');
    section.id = 'group-meeting-management';
    section.className = 'group-management-section';
    
    section.innerHTML = `
        <h4>Add Meeting Points</h4>
        <div class="management-filters">
            <div class="filter-row">
                <input type="text" id="meeting-filter-name" placeholder="Filter by name" class="filter-input">
            </div>
            <button id="apply-meeting-filter" class="filter-button">Apply Filter</button>
            <button id="clear-meeting-filter" class="filter-button">Clear Filter</button>
        </div>
        <div class="available-items-container">
            <h5>Available Meeting Points</h5>
            <div id="available-meetings-list" class="available-items-list"></div>
        </div>
    `;
    
    // Add to container
    detailsContainer.appendChild(section);
    
    // Add event listeners
    const applyFilterBtn = section.querySelector('#apply-meeting-filter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function() {
            updateAvailableMeetingsList(group);
        });
    }
    
    const clearFilterBtn = section.querySelector('#clear-meeting-filter');
    if (clearFilterBtn) {
        clearFilterBtn.addEventListener('click', function() {
            const nameFilter = section.querySelector('#meeting-filter-name');
            if (nameFilter) nameFilter.value = '';
            updateAvailableMeetingsList(group);
        });
    }
    
    // Populate available meeting points
    updateAvailableMeetingsList(group);
}

// Update available people list
function updateAvailablePeopleList(group) {
    console.log('Updating available people list');
    
    const container = document.getElementById('available-people-list');
    if (!container) {
        console.error('Available people list container not found');
        return;
    }
    
    // Clear the list
    container.innerHTML = '';
    
    // Get filter values
    const nameFilter = document.getElementById('member-filter-name');
    const elderFilter = document.getElementById('member-filter-elder');
    const servantFilter = document.getElementById('member-filter-servant');
    const pioneerFilter = document.getElementById('member-filter-pioneer');
    const leaderFilter = document.getElementById('member-filter-leader');
    const helperFilter = document.getElementById('member-filter-helper');
    const publisherFilter = document.getElementById('member-filter-publisher');
    
    const nameValue = nameFilter ? nameFilter.value.toLowerCase() : '';
    const elderValue = elderFilter ? elderFilter.checked : false;
    const servantValue = servantFilter ? servantFilter.checked : false;
    const pioneerValue = pioneerFilter ? pioneerFilter.checked : false;
    const leaderValue = leaderFilter ? leaderFilter.checked : false;
    const helperValue = helperFilter ? helperFilter.checked : false;
    const publisherValue = publisherFilter ? publisherFilter.checked : false;
    
    // Get persons not in this group
    let availablePeople = window.persons.filter(person => person.group !== group.id);
    
    // Apply name filter
    if (nameValue) {
        availablePeople = availablePeople.filter(person => 
            person.name.toLowerCase().includes(nameValue)
        );
    }
    
    // Apply role filters
    const anyRoleFilterActive = elderValue || servantValue || pioneerValue || 
                               leaderValue || helperValue || publisherValue;
    
    if (anyRoleFilterActive) {
        availablePeople = availablePeople.filter(person => 
            (elderValue && person.elder) ||
            (servantValue && person.servant) ||
            (pioneerValue && person.pioneer) ||
            (leaderValue && person.leader) ||
            (helperValue && person.helper) ||
            (publisherValue && person.publisher)
        );
    }
    
    // Sort alphabetically
    availablePeople.sort((a, b) => a.name.localeCompare(b.name));
    
    if (availablePeople.length === 0) {
        container.innerHTML = '<div class="empty-list-message">No people match the filters</div>';
        return;
    }
    
    // Create an item for each available person
    availablePeople.forEach(person => {
        const item = document.createElement('div');
        item.className = 'available-item';
        
        // Create role indicators
        let roleIndicators = '';
        if (person.elder) roleIndicators += '<span class="mini-tag elder-tag">E</span>';
        if (person.servant) roleIndicators += '<span class="mini-tag servant-tag">S</span>';
        if (person.pioneer) roleIndicators += '<span class="mini-tag pioneer-tag">P</span>';
        if (person.leader) roleIndicators += '<span class="mini-tag leader-tag">L</span>';
        if (person.helper) roleIndicators += '<span class="mini-tag helper-tag">H</span>';
        if (person.publisher) roleIndicators += '<span class="mini-tag publisher-tag">P</span>';
        
        // Get family info
        let familyInfo = '';
        if (person.familyId && window.families) {
            const family = window.families.find(f => f.id === person.familyId);
            if (family) {
                familyInfo = `<span class="family-badge" title="Member of ${family.name}">${family.name}</span>`;
            }
        }
        
        item.innerHTML = `
            <div class="available-item-info">
                <span class="available-item-name">${person.name}</span>
                <span class="role-indicators">${roleIndicators}</span>
                ${familyInfo}
            </div>
            <button class="add-to-group-btn" data-id="${person.id}">Add</button>
        `;
        
        // Add click handler
        item.querySelector('.add-to-group-btn').addEventListener('click', function() {
            addPersonToGroup(person, group);
        });
        
        container.appendChild(item);
    });
}

// Update available meeting points list
function updateAvailableMeetingsList(group) {
    console.log('Updating available meeting points list');
    
    const container = document.getElementById('available-meetings-list');
    if (!container) {
        console.error('Available meetings list container not found');
        return;
    }
    
    // Clear the list
    container.innerHTML = '';
    
    // Get filter value
    const nameFilter = document.getElementById('meeting-filter-name');
    const nameValue = nameFilter ? nameFilter.value.toLowerCase() : '';
    
    // Get meeting points not in this group
    let availableMeetings = window.meetingPoints.filter(meeting => meeting.group !== group.id);
    
    // Apply name filter
    if (nameValue) {
        availableMeetings = availableMeetings.filter(meeting => 
            meeting.name.toLowerCase().includes(nameValue)
        );
    }
    
    // Sort alphabetically
    availableMeetings.sort((a, b) => a.name.localeCompare(b.name));
    
    if (availableMeetings.length === 0) {
        container.innerHTML = '<div class="empty-list-message">No meeting points match the filter</div>';
        return;
    }
    
    // Create an item for each available meeting point
    availableMeetings.forEach(meeting => {
        const item = document.createElement('div');
        item.className = 'available-item';
        
        item.innerHTML = `
            <div class="available-item-info">
                <span class="available-item-name">${meeting.name}</span>
            </div>
            <button class="add-to-group-btn" data-id="${meeting.id}">Add</button>
        `;
        
        // Add click handler
        item.querySelector('.add-to-group-btn').addEventListener('click', function() {
            addMeetingToGroup(meeting, group);
        });
        
        container.appendChild(item);
    });
}

// Add this function to js/group-manager.js

// Auto create groups based on proximity
function autoCreateGroups() {
    console.log('Auto creating groups');
    
    // Check if we have enough people
    if (window.persons.length < appConfig.autoGrouping.minGroupSize) {
        alert(`Need at least ${appConfig.autoGrouping.minGroupSize} people to create groups`);
        return;
    }
    
    // First, remove any existing groups
    const confirmRemove = confirm('This will remove all existing groups. Continue?');
    if (!confirmRemove) return;
    
    // Remove all group assignments
    window.persons.forEach(person => {
        person.group = null;
        updatePersonMarker(person);
    });
    
    window.meetingPoints.forEach(meeting => {
        meeting.group = null;
        if (typeof updateMeetingMarker === 'function') {
            updateMeetingMarker(meeting);
        }
    });
    
    // Remove all groups
    window.groups = [];
    
    // Show loading indicator
    if (typeof showGroupingLoadingIndicator === 'function') {
        showGroupingLoadingIndicator();
    }
    
    // Group people based on proximity
    const newGroups = createGroupsByProximity();
    
    // Create the actual groups
    newGroups.forEach(groupData => {
        // Create a new group
        const group = {
            id: 'group_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            name: groupData.name,
            color: groupData.color
        };
        
        // Add to global array
        window.groups.push(group);
        
        // Assign people to this group
        groupData.members.forEach(person => {
            person.group = group.id;
            updatePersonMarker(person);
        });
    });
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populateGroupsList();
    
    // Hide loading indicator
    if (typeof hideGroupingLoadingIndicator === 'function') {
        hideGroupingLoadingIndicator();
    }
    
    // Show success message
    alert(`Created ${newGroups.length} groups successfully`);
}

// Create groups based on proximity
function createGroupsByProximity() {
    // Copy the persons array so we can modify it
    let remainingPersons = [...window.persons];
    
    // Groups array
    const groups = [];
    
    // Create groups while we have enough people left
    while (remainingPersons.length >= appConfig.autoGrouping.minGroupSize) {
        // Select a random person as a seed
        const randomIndex = Math.floor(Math.random() * remainingPersons.length);
        const seedPerson = remainingPersons[randomIndex];
        
        // Create a new group with this person
        const group = {
            name: `Group ${groups.length + 1}`,
            color: getRandomColor(),
            members: [seedPerson]
        };
        
        // Remove seed from remaining people
        remainingPersons.splice(randomIndex, 1);
        
        // Find nearby people (within threshold distance)
        const nearbyPersons = [];
        
        // Calculate distance threshold in degrees (roughly)
        // 1 degree = ~111 km, so dividing kilometers by 111 gives approximate degrees
        const distanceThreshold = appConfig.autoGrouping.distanceThreshold / 111;
        
        // Find the closest people to our seed
        for (let i = remainingPersons.length - 1; i >= 0; i--) {
            const person = remainingPersons[i];
            
            // Calculate distance
            const distance = calculateDistance(
                seedPerson.lat, seedPerson.lng,
                person.lat, person.lng
            );
            
            // If within threshold, add to group
            if (distance <= distanceThreshold) {
                nearbyPersons.push({
                    person: person,
                    distance: distance
                });
            }
        }
        
        // Sort by distance (closest first)
        nearbyPersons.sort((a, b) => a.distance - b.distance);
        
        // Add up to maxGroupSize (or all nearby persons if less)
        const maxToAdd = Math.min(
            nearbyPersons.length,
            appConfig.autoGrouping.maxGroupSize - 1 // -1 because we already added the seed
        );
        
        for (let i = 0; i < maxToAdd; i++) {
            const person = nearbyPersons[i].person;
            group.members.push(person);
            
            // Remove from remaining people
            const idx = remainingPersons.indexOf(person);
            if (idx !== -1) {
                remainingPersons.splice(idx, 1);
            }
        }
        
        // Add the group if it meets minimum size
        if (group.members.length >= appConfig.autoGrouping.minGroupSize) {
            groups.push(group);
        } else {
            // Put the seed person back if the group didn't meet minimum size
            remainingPersons.push(seedPerson);
        }
        
        // Break the loop if we can't form any more valid groups
        if (remainingPersons.length < appConfig.autoGrouping.minGroupSize) {
            break;
        }
    }
    
    return groups;
}