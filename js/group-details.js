// Group details functionality

// Current selected group
let selectedGroup = null;

// Update the showGroupDetailsModal function
function showGroupDetailsModal(groupId) {
    // Find the group
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    selectedGroup = group;
    
    // Get the modal elements
    const modal = document.getElementById('group-details-modal');
    const titleElement = document.getElementById('group-details-title');
    const nameInput = document.getElementById('edit-group-name');
    const colorInput = document.getElementById('edit-group-color');
    
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
    
    // Create or update role assignment section
    createRoleAssignmentSection(modal, group);
    
    // Add member management section if it doesn't exist
    createMemberManagementSection(modal, group);
    
    // Add family management section if it doesn't exist
    createFamilyManagementSection(modal, group);
    
    // Add meeting point management section if it doesn't exist
    createMeetingManagementSection(modal, group);
    
    // Show the modal
    modal.style.display = 'flex';
}


// Update the available people list with filtering
function updateAvailablePeopleList(group) {
    const container = document.getElementById('available-people-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get filter values
    const nameFilter = document.getElementById('member-filter-name').value.toLowerCase();
    const elderFilter = document.getElementById('member-filter-elder').checked;
    const servantFilter = document.getElementById('member-filter-servant').checked;
    const pioneerFilter = document.getElementById('member-filter-pioneer').checked;
    const leaderFilter = document.getElementById('member-filter-leader').checked;
    const helperFilter = document.getElementById('member-filter-helper').checked;
    const publisherFilter = document.getElementById('member-filter-publisher').checked;
    
    // Find unassigned people matching filters
    let availablePeople = persons.filter(person => person.group !== group.id);
    
    // Apply name filter
    if (nameFilter) {
        availablePeople = availablePeople.filter(person => 
            person.name.toLowerCase().includes(nameFilter)
        );
    }
    
    // Apply role filters if any are checked
    const anyRoleFilterActive = elderFilter || servantFilter || pioneerFilter || 
                                leaderFilter || helperFilter || publisherFilter;
    
    if (anyRoleFilterActive) {
        availablePeople = availablePeople.filter(person => 
            (elderFilter && person.elder) ||
            (servantFilter && person.servant) ||
            (pioneerFilter && person.pioneer) ||
            (leaderFilter && person.leader) ||
            (helperFilter && person.helper) ||
            (publisherFilter && person.publisher)
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
        
        // Check if person is part of a family
        let familyInfo = '';
        if (person.familyId) {
            const family = families.find(f => f.id === person.familyId);
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
        item.querySelector('.add-to-group-btn').addEventListener('click', () => {
            // Add person to group
            assignPersonToGroup(person, group.id);
            
            // Update UI
            updateGroupStatistics(group);
            updateGroupMembersList(group);
            updateAvailablePeopleList(group);
            updateAvailableFamiliesList(group);
            populateRoleDropdowns(group);
        });
        
        container.appendChild(item);
    });
}


// Update the available families list with filtering
function updateAvailableFamiliesList(group) {
    // Skip if families functionality is not available
    if (typeof families === 'undefined' || !families) return;
    
    const container = document.getElementById('available-families-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get filter value
    const nameFilter = document.getElementById('family-filter-name').value.toLowerCase();
    
    // Get current group members
    const groupMemberIds = persons
        .filter(person => person.group === group.id)
        .map(person => person.id);
    
    // Find available families (a family is available if any member is not already in the group)
    const availableFamilies = [];
    
    families.forEach(family => {
        // Get all family members
        const familyMembers = getFamilyMembers(family.id);
        if (!familyMembers) return;
        
        // Check if any family member is not in the group
        const allMembersArray = [];
        if (familyMembers.head) allMembersArray.push(familyMembers.head);
        if (familyMembers.spouse) allMembersArray.push(familyMembers.spouse);
        if (familyMembers.children) allMembersArray.push(...familyMembers.children);
        
        const anyMemberNotInGroup = allMembersArray.some(member => !groupMemberIds.includes(member.id));
        
        if (anyMemberNotInGroup) {
            availableFamilies.push({
                family: family,
                members: allMembersArray
            });
        }
    });
    
    // Apply name filter
    let filteredFamilies = availableFamilies;
    if (nameFilter) {
        filteredFamilies = availableFamilies.filter(item => 
            item.family.name.toLowerCase().includes(nameFilter)
        );
    }
    
    // Sort alphabetically by family name
    filteredFamilies.sort((a, b) => a.family.name.localeCompare(b.family.name));
    
    if (filteredFamilies.length === 0) {
        container.innerHTML = '<div class="empty-list-message">No families match the filter or all members are already in the group</div>';
        return;
    }
    
    // Create an item for each available family
    filteredFamilies.forEach(familyItem => {
        const family = familyItem.family;
        const members = familyItem.members;
        
        const memberCount = members.length;
        const membersInGroup = members.filter(member => groupMemberIds.includes(member.id)).length;
        
        const item = document.createElement('div');
        item.className = 'available-item family-item';
        
        item.innerHTML = `
            <div class="available-item-info">
                <span class="available-item-name">${family.name}</span>
                <span class="family-members-count">${memberCount} members (${membersInGroup} already in group)</span>
            </div>
            <button class="add-family-to-group-btn" data-id="${family.id}">Add Family</button>
        `;
        
        // Add click handler
        item.querySelector('.add-family-to-group-btn').addEventListener('click', () => {
            // Add all family members to group that aren't already in it
            const membersToAdd = members.filter(member => !groupMemberIds.includes(member.id));
            
            membersToAdd.forEach(member => {
                assignPersonToGroup(member, group.id);
            });
            
            // Update UI
            updateGroupStatistics(group);
            updateGroupMembersList(group);
            updateAvailablePeopleList(group);
            updateAvailableFamiliesList(group);
            populateRoleDropdowns(group);
            
            // Show confirmation
            alert(`Added ${membersToAdd.length} family members to the group`);
        });
        
        container.appendChild(item);
    });
}


// Update the available meeting points list with filtering
function updateAvailableMeetingsList(group) {
    const container = document.getElementById('available-meetings-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get filter value
    const nameFilter = document.getElementById('meeting-filter-name').value.toLowerCase();
    
    // Find unassigned meeting points matching filter
    let availableMeetings = meetingPoints.filter(meeting => meeting.group !== group.id);
    
    // Apply name filter
    if (nameFilter) {
        availableMeetings = availableMeetings.filter(meeting => 
            meeting.name.toLowerCase().includes(nameFilter)
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
        item.querySelector('.add-to-group-btn').addEventListener('click', () => {
            // Add meeting to group
            assignMeetingToGroup(meeting, group.id);
            
            // Update UI
            updateGroupStatistics(group);
            updateGroupMeetingsList(group);
            updateAvailableMeetingsList(group);
        });
        
        container.appendChild(item);
    });
}


// Update group statistics in the modal
function updateGroupStatistics(group) {
    // Find all persons in the group
    const groupPersons = persons.filter(p => p.group === group.id);
    
    // Count roles
    const elderCount = groupPersons.filter(p => p.elder).length;
    const servantCount = groupPersons.filter(p => p.servant).length;
    const pioneerCount = groupPersons.filter(p => p.pioneer).length;
    const leaderCount = groupPersons.filter(p => p.leader).length;
    const helperCount = groupPersons.filter(p => p.helper).length;
    const childCount = groupPersons.filter(p => p.child).length;
    
    // Find meeting points in the group
    const groupMeetings = meetingPoints.filter(m => m.group === group.id);
    
    // Update statistics elements
    document.getElementById('group-stat-total').textContent = groupPersons.length;
    document.getElementById('group-stat-elders').textContent = elderCount;
    document.getElementById('group-stat-servants').textContent = servantCount;
    document.getElementById('group-stat-pioneers').textContent = pioneerCount;
    document.getElementById('group-stat-leaders').textContent = leaderCount;
    document.getElementById('group-stat-helpers').textContent = helperCount;
    document.getElementById('group-stat-children').textContent = childCount;
    document.getElementById('group-stat-meetings').textContent = groupMeetings.length;
}

// Update the group members list to include remove buttons
function updateGroupMembersList(group) {
    const membersList = document.getElementById('group-members-list');
    membersList.innerHTML = '';
    
    // Find all persons in the group
    const groupPersons = persons.filter(p => p.group === group.id);
    
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
        if (person.publisher) roleText.push('Publisher');
        
        // Check if person is part of a family
        let familyInfo = '';
        if (person.familyId) {
            const family = families.find(f => f.id === person.familyId);
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
                <button class="member-locate-btn" data-id="${person.id}">Locate</button>
                <button class="member-remove-btn" data-id="${person.id}">Remove</button>
            </div>
        `;
        
        // Add locate button handler
        item.querySelector('.member-locate-btn').addEventListener('click', () => {
            // Zoom to the person
            map.panTo(person.marker.getPosition());
            map.setZoom(15);
            
            // Highlight the marker
            highlightMarker(person.marker);
        });
        
        // Add remove button handler
        item.querySelector('.member-remove-btn').addEventListener('click', () => {
            // Remove person from group
            person.group = null;
            
            // If person was a leader or helper for this group, remove that role
            if (person.leader || person.helper) {
                person.leader = false;
                person.helper = false;
            }
            
            updatePersonColor(person);
            
            // Update UI
            updateGroupStatistics(group);
            updateGroupMembersList(group);
            updateAvailablePeopleList(group);
            updateAvailableFamiliesList(group);
            populateRoleDropdowns(group);
        });
        
        membersList.appendChild(item);
    });
}

// Update the meeting points list to include remove buttons
function updateGroupMeetingsList(group) {
    const meetingsList = document.getElementById('group-meetings-list');
    meetingsList.innerHTML = '';
    
    // Find all meeting points in the group
    const groupMeetings = meetingPoints.filter(m => m.group === group.id);
    
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
                <button class="meeting-locate-btn" data-id="${meeting.id}">Locate</button>
                <button class="meeting-remove-btn" data-id="${meeting.id}">Remove</button>
            </div>
        `;
        
        // Add locate button handler
        item.querySelector('.meeting-locate-btn').addEventListener('click', () => {
            // Zoom to the meeting point
            map.panTo(meeting.marker.getPosition());
            map.setZoom(15);
            
            // Highlight the marker
            highlightMarker(meeting.marker);
        });
        
        // Add remove button handler
        item.querySelector('.meeting-remove-btn').addEventListener('click', () => {
            // Remove meeting from group
            meeting.group = null;
            updateMeetingColor(meeting);
            
            // Update UI
            updateGroupStatistics(group);
            updateGroupMeetingsList(group);
            updateAvailableMeetingsList(group);
        });
        
        meetingsList.appendChild(item);
    });
}


// Save group details changes
function saveGroupDetails() {
    if (!selectedGroup) return;
    
    // Get the updated values
    const nameInput = document.getElementById('edit-group-name');
    const colorInput = document.getElementById('edit-group-color');
    
    const newName = nameInput.value.trim();
    const newColor = colorInput.value;
    
    if (newName === '') {
        alert('Group name cannot be empty');
        return;
    }
    
    // Update the group
    selectedGroup.name = newName;
    selectedGroup.color = newColor;
    
    // Update markers for all persons in this group
    persons.forEach(person => {
        if (person.group === selectedGroup.id) {
            updatePersonColor(person);
        }
    });
    
    // Update UI
    updateGroupsList();
    
    // Close the modal
    document.getElementById('group-details-modal').style.display = 'none';
    
    // Reset selected group
    selectedGroup = null;
}

// Create the member management section
function createMemberManagementSection(modal, group) {
    let memberManagementSection = document.getElementById('group-member-management');
    
    if (!memberManagementSection) {
        const detailsContainer = modal.querySelector('.group-details-container');
        
        // Create new section
        memberManagementSection = document.createElement('div');
        memberManagementSection.id = 'group-member-management';
        memberManagementSection.className = 'group-management-section';
        
        memberManagementSection.innerHTML = `
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
        
        // Insert after the group statistics section
        const statsSection = document.querySelector('.group-stats-section');
        if (statsSection && statsSection.nextSibling) {
            detailsContainer.insertBefore(memberManagementSection, statsSection.nextSibling);
        } else {
            detailsContainer.appendChild(memberManagementSection);
        }
        
        // Add event listeners for filter buttons
        document.getElementById('apply-member-filter').addEventListener('click', () => {
            updateAvailablePeopleList(group);
        });
        
        document.getElementById('clear-member-filter').addEventListener('click', () => {
            document.getElementById('member-filter-name').value = '';
            document.getElementById('member-filter-elder').checked = false;
            document.getElementById('member-filter-servant').checked = false;
            document.getElementById('member-filter-pioneer').checked = false;
            document.getElementById('member-filter-leader').checked = false;
            document.getElementById('member-filter-helper').checked = false;
            document.getElementById('member-filter-publisher').checked = false;
            updateAvailablePeopleList(group);
        });
        
        // Initial population of available people
        updateAvailablePeopleList(group);
    } else {
        // Just update the list if section already exists
        updateAvailablePeopleList(group);
    }
}


// Create the meeting management section
function createMeetingManagementSection(modal, group) {
    let meetingManagementSection = document.getElementById('group-meeting-management');
    
    if (!meetingManagementSection) {
        const detailsContainer = modal.querySelector('.group-details-container');
        
        // Create new section
        meetingManagementSection = document.createElement('div');
        meetingManagementSection.id = 'group-meeting-management';
        meetingManagementSection.className = 'group-management-section';
        
        meetingManagementSection.innerHTML = `
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
        
        // Insert after the meetings list
        const meetingsSection = modal.querySelector('.group-meetings-section');
        if (meetingsSection && meetingsSection.nextSibling) {
            detailsContainer.insertBefore(meetingManagementSection, meetingsSection.nextSibling);
        } else {
            detailsContainer.appendChild(meetingManagementSection);
        }
        
        // Add event listeners
        document.getElementById('apply-meeting-filter').addEventListener('click', () => {
            updateAvailableMeetingsList(group);
        });
        
        document.getElementById('clear-meeting-filter').addEventListener('click', () => {
            document.getElementById('meeting-filter-name').value = '';
            updateAvailableMeetingsList(group);
        });
        
        // Initial population
        updateAvailableMeetingsList(group);
    } else {
        // Just update the list if section already exists
        updateAvailableMeetingsList(group);
    }
}


// Create a role assignment section
function createRoleAssignmentSection(modal, group) {
    let roleSection = document.getElementById('group-role-assignment');
    
    if (!roleSection) {
        const detailsContainer = modal.querySelector('.group-details-container');
        
        // Create new section
        roleSection = document.createElement('div');
        roleSection.id = 'group-role-assignment';
        roleSection.className = 'group-role-section';
        
        roleSection.innerHTML = `
            <h4>Role Assignment</h4>
            <div class="role-assignment-container">
                <div class="role-assignment-row">
                    <label for="group-leader-select">Group Leader:</label>
                    <select id="group-leader-select">
                        <option value="">-- Select Group Leader --</option>
                    </select>
                </div>
                <div class="role-assignment-row">
                    <label for="group-helper-select">Group Helper:</label>
                    <select id="group-helper-select">
                        <option value="">-- Select Group Helper --</option>
                    </select>
                </div>
                <button id="save-group-roles" class="role-assign-btn">Save Roles</button>
            </div>
        `;
        
        // Insert at the top of the container
        if (detailsContainer.firstChild) {
            detailsContainer.insertBefore(roleSection, detailsContainer.firstChild);
        } else {
            detailsContainer.appendChild(roleSection);
        }
        
        // Add event listener for saving roles
        document.getElementById('save-group-roles').addEventListener('click', () => {
            saveGroupRoles(group);
        });
    }
    
    // Populate role dropdowns with group members
    populateRoleDropdowns(group);
}

// Create the family management section
function createFamilyManagementSection(modal, group) {
    // Skip if families functionality is not available
    if (typeof families === 'undefined' || !families) return;
    
    let familyManagementSection = document.getElementById('group-family-management');
    
    if (!familyManagementSection) {
        const detailsContainer = modal.querySelector('.group-details-container');
        
        // Create new section
        familyManagementSection = document.createElement('div');
        familyManagementSection.id = 'group-family-management';
        familyManagementSection.className = 'group-management-section';
        
        familyManagementSection.innerHTML = `
            <h4>Add Families</h4>
            <div class="management-filters">
                <div class="filter-row">
                    <input type="text" id="family-filter-name" placeholder="Filter by family name" class="filter-input">
                </div>
                <button id="apply-family-filter" class="filter-button">Apply Filter</button>
                <button id="clear-family-filter" class="filter-button">Clear Filter</button>
            </div>
            <div class="available-items-container">
                <h5>Available Families</h5>
                <div id="available-families-list" class="available-items-list"></div>
            </div>
        `;
        
        // Insert after the member management section
        const memberSection = document.getElementById('group-member-management');
        if (memberSection && memberSection.nextSibling) {
            detailsContainer.insertBefore(familyManagementSection, memberSection.nextSibling);
        } else {
            detailsContainer.appendChild(familyManagementSection);
        }
        
        // Add event listeners
        document.getElementById('apply-family-filter').addEventListener('click', () => {
            updateAvailableFamiliesList(group);
        });
        
        document.getElementById('clear-family-filter').addEventListener('click', () => {
            document.getElementById('family-filter-name').value = '';
            updateAvailableFamiliesList(group);
        });
        
        // Initial population
        updateAvailableFamiliesList(group);
    } else {
        // Just update the list if section already exists
        updateAvailableFamiliesList(group);
    }
}
// Populate the role selection dropdowns
function populateRoleDropdowns(group) {
    const leaderSelect = document.getElementById('group-leader-select');
    const helperSelect = document.getElementById('group-helper-select');
    
    if (!leaderSelect || !helperSelect) return;
    
    // Get current leader and helper if any
    const currentLeader = persons.find(p => p.group === group.id && p.leader);
    const currentHelper = persons.find(p => p.group === group.id && p.helper);
    
    // Clear existing options (except the first one)
    while (leaderSelect.options.length > 1) leaderSelect.remove(1);
    while (helperSelect.options.length > 1) helperSelect.remove(1);
    
    // Get all group members
    const groupMembers = persons.filter(p => p.group === group.id);
    
    // Sort by name
    groupMembers.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add options for each member
    groupMembers.forEach(person => {
        // Add to leader dropdown
        const leaderOption = document.createElement('option');
        leaderOption.value = person.id;
        leaderOption.textContent = person.name;
        if (currentLeader && person.id === currentLeader.id) {
            leaderOption.selected = true;
        }
        leaderSelect.appendChild(leaderOption);
        
        // Add to helper dropdown
        const helperOption = document.createElement('option');
        helperOption.value = person.id;
        helperOption.textContent = person.name;
        if (currentHelper && person.id === currentHelper.id) {
            helperOption.selected = true;
        }
        helperSelect.appendChild(helperOption);
    });
}

// Save the assigned roles
function saveGroupRoles(group) {
    const leaderSelect = document.getElementById('group-leader-select');
    const helperSelect = document.getElementById('group-helper-select');
    
    const leaderId = leaderSelect.value;
    const helperId = helperSelect.value;
    
    // Reset all roles for group members
    persons.forEach(person => {
        if (person.group === group.id) {
            person.leader = false;
            person.helper = false;
        }
    });
    
    // Set new leader if selected
    if (leaderId) {
        const leader = persons.find(p => p.id === leaderId);
        if (leader) {
            leader.leader = true;
        }
    }
    
    // Set new helper if selected
    if (helperId) {
        const helper = persons.find(p => p.id === helperId);
        if (helper) {
            helper.helper = true;
        }
    }
    
    // Update UI
    updateGroupStatistics(group);
    updateGroupMembersList(group);
    populateRoleDropdowns(group);
    
    // Show confirmation
    alert('Group roles updated successfully');
}


// Add CSS styles for the enhanced group details modal
function addGroupDetailsStyles() {
    // Check if styles already exist
    if (document.getElementById('group-details-enhanced-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'group-details-enhanced-styles';
    style.textContent = `
        .group-details-modal-content {
            width: 800px;
            max-width: 90vw;
            max-height: 85vh;
        }
        
        .group-details-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .group-role-section {
            grid-column: 1 / 3;
            background-color: #e8f4ff;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #1976D2;
        }
        
        .role-assignment-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .role-assignment-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .role-assignment-row label {
            width: 120px;
            font-weight: bold;
        }
        
        .role-assignment-row select {
        flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .role-assign-btn {
            align-self: flex-start;
            padding: 8px 16px;
            background-color: #1976D2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        
        .role-assign-btn:hover {
            background-color: #1565C0;
        }
        
        .group-management-section {
            grid-column: 1 / 3;
            background-color: #f0f7ff;
            border-radius: 4px;
            padding: 15px;
            margin-top: 15px;
        }
        
        .management-filters {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .filter-row {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
        }
        
        .filter-input {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            flex: 1;
        }
        
        .role-filter-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .role-filter-container label {
            display: flex;
            align-items: center;
            gap: 5px;
            white-space: nowrap;
        }
        
        .filter-button {
            padding: 6px 12px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9em;
        }
        
        .filter-button:hover {
            background-color: #0b7dda;
        }
        
        .available-items-container {
            background-color: white;
            border-radius: 4px;
            padding: 10px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .available-items-list {
            max-height: 250px;
            overflow-y: auto;
            margin-top: 10px;
        }
        
        .available-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #eee;
        }
        
        .available-item:hover {
            background-color: #f5f5f5;
        }
        
        .available-item-info {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .add-to-group-btn, .add-family-to-group-btn {
            padding: 4px 8px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8em;
            white-space: nowrap;
        }
        
        .add-to-group-btn:hover, .add-family-to-group-btn:hover {
            background-color: #388E3C;
        }
        
        .mini-tag {
            display: inline-block;
            width: 18px;
            height: 18px;
            line-height: 18px;
            text-align: center;
            border-radius: 50%;
            color: white;
            font-size: 0.7em;
            font-weight: bold;
        }
        
        .elder-tag { background-color: #3f51b5; }
        .servant-tag { background-color: #009688; }
        .pioneer-tag { background-color: #ff9800; }
        .leader-tag { background-color: #9c27b0; }
        .helper-tag { background-color: #4caf50; }
        .publisher-tag { background-color: #607d8b; }
        
        .member-actions, .meeting-actions {
            display: flex;
            gap: 5px;
        }
        
        .member-remove-btn, .meeting-remove-btn {
            padding: 3px 8px;
            font-size: 0.85em;
            background-color: #f44336;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .member-remove-btn:hover, .meeting-remove-btn:hover {
            background-color: #d32f2f;
        }
        
        .member-family {
            font-size: 0.85em;
            color: #666;
            margin-top: 3px;
        }
        
        .family-badge {
            display: inline-block;
            padding: 2px 6px;
            background-color: #E8F5E9;
            color: #1B5E20;
            border-radius: 10px;
            font-size: 0.75em;
            white-space: nowrap;
        }
        
        .family-item {
            border-left: 3px solid #4CAF50;
        }
        
        .family-members-count {
            font-size: 0.85em;
            color: #666;
        }
        
        @media screen and (max-width: 768px) {
            .group-details-container {
                grid-template-columns: 1fr;
            }
            
            .group-role-section,
            .group-management-section {
                grid-column: 1;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Call this function when DOM is loaded to add the styles
document.addEventListener('DOMContentLoaded', () => {
    addGroupDetailsStyles();
});


// Initialize group details functionality
function initGroupDetails() {
    // Set up save button handler
    document.getElementById('save-group-details').addEventListener('click', saveGroupDetails);
    
    // Set up close button handler
    document.getElementById('close-group-details').addEventListener('click', () => {
        document.getElementById('group-details-modal').style.display = 'none';
        selectedGroup = null;
    });
}

// Add to initialization
document.addEventListener('DOMContentLoaded', initGroupDetails);