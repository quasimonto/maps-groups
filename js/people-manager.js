// people-manager.js - Functions for managing people
// Add this safety check to the DOMContentLoaded event listener as well
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('Initializing people manager from DOMContentLoaded');
        initPeopleManager();
    } catch (error) {
        console.error('Error during people manager initialization:', error);
    }
});

// Set up people-related event listeners with safety checks
function setupPeopleEventListeners() {
    console.log('Setting up people event listeners');
    
    // Add button clicks
    const addPersonButton = document.getElementById('add-person-btn');
    if (addPersonButton) {
        addPersonButton.addEventListener('click', function() {
            setActivePage('person-add-section');
        });
    } else {
        console.log('add-person-btn element not found');
    }
    
    // Form submission
    const addPersonForm = document.getElementById('add-person-form');
    if (addPersonForm) {
        addPersonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addPerson();
        });
    } else {
        console.log('add-person-form element not found');
    }
    
    // Cancel button
    const cancelAddPersonButton = document.getElementById('cancel-add-person');
    if (cancelAddPersonButton) {
        cancelAddPersonButton.addEventListener('click', function() {
            setActivePage('people-list-section');
        });
    } else {
        console.log('cancel-add-person element not found');
    }
    
    // Filter buttons
    const applyFilterButton = document.getElementById('apply-filters-btn');
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', applyPersonFilters);
    } else {
        console.log('apply-filters-btn element not found');
    }
    
    const clearFilterButton = document.getElementById('clear-filters-btn');
    if (clearFilterButton) {
        clearFilterButton.addEventListener('click', clearPersonFilters);
    } else {
        console.log('clear-filters-btn element not found');
    }
    
    console.log('People event listeners setup complete');
}

// Also update the initPeopleManager function to include error handling
function initPeopleManager() {
    console.log('Initializing people manager');
    
    try {
        // Set up event listeners for people-related actions
        setupPeopleEventListeners();
        
        // Initialize the people array if it doesn't exist
        if (!window.persons) {
            window.persons = [];
            console.log('Initialized empty persons array');
        }
        
        console.log('People manager initialized successfully');
    } catch (error) {
        console.error('Error initializing people manager:', error);
    }
}


// Add a new person
function addPerson() {
    // Get form values
    const nameInput = document.getElementById('person-name');
    if (!nameInput) {
        console.error('Person name input not found');
        return;
    }
    
    const name = nameInput.value;
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    // Get location
    const latInput = document.getElementById('person-lat');
    const lngInput = document.getElementById('person-lng');
    
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
    
    // Get role checkboxes
    const elderCheckbox = document.getElementById('person-elder');
    const servantCheckbox = document.getElementById('person-servant');
    const pioneerCheckbox = document.getElementById('person-pioneer');
    const leaderCheckbox = document.getElementById('person-leader');
    const helperCheckbox = document.getElementById('person-helper');
    
    // Check if elements exist before accessing their values
    const elder = elderCheckbox ? elderCheckbox.checked : false;
    const servant = servantCheckbox ? servantCheckbox.checked : false;
    const pioneer = pioneerCheckbox ? pioneerCheckbox.checked : false;
    const leader = leaderCheckbox ? leaderCheckbox.checked : false;
    const helper = helperCheckbox ? helperCheckbox.checked : false;
    
    // Create the position
    const position = new google.maps.LatLng(lat, lng);
    
    // Create marker
    const marker = createPersonMarker(position, {
        name: name,
        elder: elder,
        servant: servant,
        pioneer: pioneer,
        leader: leader,
        helper: helper
    });
    
    // Create person object
    const person = {
        id: Date.now().toString(),
        name: name,
        lat: lat,
        lng: lng,
        elder: elder,
        servant: servant,
        pioneer: pioneer,
        leader: leader,
        helper: helper,
        publisher: true, // Default value
        marker: marker,
        group: null,
        familyId: null,
        familyRole: null,
        relationshipIds: []
    };
    
    // Add to global array
    window.persons.push(person);
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populatePeopleList();
    
    // Show success message
    if (typeof showNotification === 'function') {
        showNotification(`${name} added successfully`);
    } else {
        alert(`${name} added successfully`);
    }
    
    // Reset form
    document.getElementById('add-person-form').reset();
    
    // Navigate back to people list
    setActivePage('people-list-section');
}

// Populate the people list
function populatePeopleList() {
    console.log('Populating people list');
    const peopleTableBody = document.getElementById('people-table-body');
    if (!peopleTableBody) {
        console.error('People table body not found');
        return;
    }
    
    // Clear the table
    peopleTableBody.innerHTML = '';
    
    // Check if we have any people
    if (!window.persons || window.persons.length === 0) {
        peopleTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-table-message">No people added yet</td>
            </tr>
        `;
        return;
    }
    
    // Apply any active filters
    let filteredPersons = applyPersonFilters(true);
    
    // Create a row for each person
    filteredPersons.forEach(person => {
        const row = document.createElement('tr');
        
        // Get person's group if any
        let groupName = 'None';
        let groupColor = '';
        
        if (person.group) {
            const group = window.groups.find(g => g.id === person.group);
            if (group) {
                groupName = group.name;
                groupColor = group.color;
            }
        }
        
        // Get person's family if any
        let familyInfo = 'None';
        
        if (person.familyId) {
            const family = window.families.find(f => f.id === person.familyId);
            if (family) {
                const roleLabel = person.familyRole === 'head' ? 'Head' :
                                 person.familyRole === 'spouse' ? 'Spouse' :
                                 person.familyRole === 'child' ? 'Child' : '';
                familyInfo = `${family.name} (${roleLabel})`;
            }
        }
        
        // Build roles string
        let rolesHtml = '';
        if (person.elder) rolesHtml += '<span class="role-badge elder-badge">E</span>';
        if (person.servant) rolesHtml += '<span class="role-badge servant-badge">S</span>';
        if (person.pioneer) rolesHtml += '<span class="role-badge pioneer-badge">P</span>';
        if (person.leader) rolesHtml += '<span class="role-badge leader-badge">L</span>';
        if (person.helper) rolesHtml += '<span class="role-badge helper-badge">H</span>';
        if (!rolesHtml) rolesHtml = 'Publisher';
        
        row.innerHTML = `
            <td>${person.name}</td>
            <td>${rolesHtml}</td>
            <td style="${groupColor ? `background-color: ${groupColor}33;` : ''}">${groupName}</td>
            <td>${familyInfo}</td>
            <td>
                <button class="edit-person-btn small-button" data-id="${person.id}">Edit</button>
                <button class="locate-person-btn small-button" data-id="${person.id}">Locate</button>
                <button class="delete-person-btn small-button danger" data-id="${person.id}">Delete</button>
            </td>
        `;
        
        // Add event listeners to buttons
        row.querySelector('.edit-person-btn').addEventListener('click', function() {
            editPerson(person);
        });
        
        row.querySelector('.locate-person-btn').addEventListener('click', function() {
            locatePerson(person);
        });
        
        row.querySelector('.delete-person-btn').addEventListener('click', function() {
            if (confirm(`Are you sure you want to delete ${person.name}?`)) {
                deletePerson(person);
            }
        });
        
        peopleTableBody.appendChild(row);
    });
}

// Apply filters to people list
function applyPersonFilters(returnResults = false) {
    const nameFilterInput = document.getElementById('people-search');
    const elderFilterCheckbox = document.getElementById('filter-elder');
    const servantFilterCheckbox = document.getElementById('filter-servant');
    const pioneerFilterCheckbox = document.getElementById('filter-pioneer');
    const groupFilterCheckbox = document.getElementById('filter-group');
    const noGroupFilterCheckbox = document.getElementById('filter-no-group');
    
    // Check if elements exist before accessing their values
    const nameFilter = nameFilterInput ? nameFilterInput.value.toLowerCase() : '';
    const elderFilter = elderFilterCheckbox ? elderFilterCheckbox.checked : false;
    const servantFilter = servantFilterCheckbox ? servantFilterCheckbox.checked : false;
    const pioneerFilter = pioneerFilterCheckbox ? pioneerFilterCheckbox.checked : false;
    const groupFilter = groupFilterCheckbox ? groupFilterCheckbox.checked : false;
    const noGroupFilter = noGroupFilterCheckbox ? noGroupFilterCheckbox.checked : false;
    
    // Apply filters
    let filteredPersons = window.persons;
    
    // Apply name filter
    if (nameFilter) {
        filteredPersons = filteredPersons.filter(person => 
            person.name.toLowerCase().includes(nameFilter)
        );
    }
    
    // Apply role filters
    const anyRoleFilterActive = elderFilter || servantFilter || pioneerFilter;
    
    if (anyRoleFilterActive) {
        filteredPersons = filteredPersons.filter(person => 
            (elderFilter && person.elder) ||
            (servantFilter && person.servant) ||
            (pioneerFilter && person.pioneer)
        );
    }
    
    // Apply group filters
    if (groupFilter && !noGroupFilter) {
        filteredPersons = filteredPersons.filter(person => person.group !== null);
    } else if (!groupFilter && noGroupFilter) {
        filteredPersons = filteredPersons.filter(person => person.group === null);
    } else if (groupFilter && noGroupFilter) {
        // Both checked = no filtering by group
    }
    
    // If returning results, return the filtered array
    if (returnResults) {
        return filteredPersons;
    }
    
    // Otherwise update the list
    populatePeopleList();
}

// Clear filters
function clearPersonFilters() {
    const nameFilterInput = document.getElementById('people-search');
    const elderFilterCheckbox = document.getElementById('filter-elder');
    const servantFilterCheckbox = document.getElementById('filter-servant');
    const pioneerFilterCheckbox = document.getElementById('filter-pioneer');
    const groupFilterCheckbox = document.getElementById('filter-group');
    const noGroupFilterCheckbox = document.getElementById('filter-no-group');
    
    // Reset filter inputs
    if (nameFilterInput) nameFilterInput.value = '';
    if (elderFilterCheckbox) elderFilterCheckbox.checked = false;
    if (servantFilterCheckbox) servantFilterCheckbox.checked = false;
    if (pioneerFilterCheckbox) pioneerFilterCheckbox.checked = false;
    if (groupFilterCheckbox) groupFilterCheckbox.checked = false;
    if (noGroupFilterCheckbox) noGroupFilterCheckbox.checked = false;
    
    // Update the list
    populatePeopleList();
}

// Edit person
function editPerson(person) {
    // TODO: Implement edit functionality
    console.log('Editing person:', person);
}

// Locate person on map
function locatePerson(person) {
    if (!person.marker) {
        console.error('Person marker not found');
        return;
    }
    
    // Center map on person
    if (window.map) {
        window.map.setCenter(person.marker.getPosition());
        window.map.setZoom(15);
    }
    
    // Highlight marker
    if (typeof highlightMarker === 'function') {
        highlightMarker(person.marker);
    }
}

// Delete person
function deletePerson(person) {
    // Remove marker from map
    if (person.marker) {
        person.marker.setMap(null);
    }
    
    // Remove from global array
    const index = window.persons.findIndex(p => p.id === person.id);
    if (index !== -1) {
        window.persons.splice(index, 1);
    }
    
    // Save data
    if (typeof saveData === 'function') {
        saveData();
    }
    
    // Update UI
    populatePeopleList();
    
    // Show success message
    if (typeof showNotification === 'function') {
        showNotification(`${person.name} deleted successfully`);
    } else {
        alert(`${person.name} deleted successfully`);
    }
}



// Updated Person-related functions

// Add a person at a specific location
function addPersonAtLocation(location, name = 'New Person') {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: getPersonMarkerIcon({}) // Using empty object since it's a new person with no group
    });
    
    const personData = {
        id: Date.now().toString(),
        marker: marker,
        name: name,
        group: null,
        lat: location.lat(),
        lng: location.lng(),
        elder: false,
        servant: false,
        pioneer: false,
        spouse: false,
        child: false,
        familyHead: false,
        leader: false,  // New property
        helper: false   // New property
    };
    
    persons.push(personData);
    
    // Add click listener to the marker for editing
    marker.addListener('click', () => {
        selectedPerson = personData;
        showPersonModal(personData);
    });
    
    updatePersonsList();
    // Reset the map click mode after adding
    mapClickMode = null;
    updateAddButtonStyles();
}

// Update the persons list in the sidebar
function updatePersonsList() {
    const personList = document.getElementById('person-list');
    personList.innerHTML = '';
    
    // Apply filters
    let filteredPersons = persons;
    
    // Filter by name if name filter is active
    if (nameFilter && nameFilter !== '') {
        filteredPersons = filteredPersons.filter(person => 
            person.name.toLowerCase().includes(nameFilter.toLowerCase())
        );
    }
    
    // Check if any role filters are active
    const anyFilterActive = 
        activeFilters.elder || 
        activeFilters.servant || 
        activeFilters.pioneer || 
        activeFilters.familyHead ||
        activeFilters.leader ||    // New filter
        activeFilters.helper;      // New filter
        
    if (anyFilterActive) {
        filteredPersons = filteredPersons.filter(person => 
            (activeFilters.elder && person.elder) ||
            (activeFilters.servant && person.servant) ||
            (activeFilters.pioneer && person.pioneer) ||
            (activeFilters.familyHead && person.familyHead) ||
            (activeFilters.leader && person.leader) ||    // New filter condition
            (activeFilters.helper && person.helper)       // New filter condition
        );
    }
    
    filteredPersons.forEach(personData => {
        const item = document.createElement('div');
        item.className = 'person-item';
        
        // Add role indicators
        let roleIndicators = '';
        if (personData.elder) roleIndicators += '<span class="role-tag elder-tag">E</span>';
        if (personData.servant) roleIndicators += '<span class="role-tag servant-tag">S</span>';
        if (personData.pioneer) roleIndicators += '<span class="role-tag pioneer-tag">P</span>';
        if (personData.leader) roleIndicators += '<span class="role-tag leader-tag">L</span>';
        if (personData.helper) roleIndicators += '<span class="role-tag helper-tag">H</span>';
        
        item.innerHTML = `
            <div class="person-info">
                ${personData.name}
                <div class="role-indicators">${roleIndicators}</div>
            </div>
            <div class="person-actions">
                <button class="edit-button" data-id="${personData.id}">✎</button>
                <button class="delete-button" data-id="${personData.id}">✕</button>
            </div>
        `;
        
        // Add double-click event to edit the person
        item.querySelector('.person-info').addEventListener('dblclick', () => {
            selectedPerson = personData;
            showPersonModal(personData);
        });
        
        // Add click event to focus on the person
        item.querySelector('.person-info').addEventListener('click', () => {
            map.panTo(personData.marker.getPosition());
            map.setZoom(15);
        });
        
        // Add edit button handler
        item.querySelector('.edit-button').addEventListener('click', (e) => {
            e.stopPropagation();
            selectedPerson = personData;
            showPersonModal(personData);
        });
        
        // Add delete button handler
        item.querySelector('.delete-button').addEventListener('click', (e) => {
            e.stopPropagation();
            removePerson(personData.id);
        });
        
        personList.appendChild(item);
    });
}

// Remove a person
function removePerson(personId) {
    const personIndex = persons.findIndex(p => p.id === personId);
    if (personIndex !== -1) {
        // Remove the marker from the map
        persons[personIndex].marker.setMap(null);
        // Remove from the array
        persons.splice(personIndex, 1);
        // Update the list
        updatePersonsList();
    }
}

// Show modal for adding/editing person details
function showPersonModal(personData = null) {
    const modal = document.getElementById('person-modal');
    const title = document.getElementById('modal-title');
    const nameInput = document.getElementById('person-name');
    const groupSelect = document.getElementById('person-group');
    const travelTimesButton = document.getElementById('show-travel-times');
    
    const elderCheckbox = document.getElementById('person-elder');
    const servantCheckbox = document.getElementById('person-servant');
    const pioneerCheckbox = document.getElementById('person-pioneer');
    const spouseCheckbox = document.getElementById('person-spouse');
    const childCheckbox = document.getElementById('person-child');
    const familyHeadCheckbox = document.getElementById('person-familyhead');
    const leaderCheckbox = document.getElementById('person-leader');     // New checkbox
    const helperCheckbox = document.getElementById('person-helper');     // New checkbox
    
    // Update modal title
    title.textContent = personData ? 'Edit Person' : 'Add Person';
    
    // Show/hide travel time button based on whether we're editing or adding
    travelTimesButton.style.display = personData ? 'block' : 'none';
    
    // Set up travel time button click handler
    if (personData) {
        travelTimesButton.onclick = () => {
            // Close the person modal
            modal.style.display = 'none';
            // Open the travel time modal
            showTravelTimeModal(personData);
        };
    }
    
    // Populate form if editing
    if (personData) {
        nameInput.value = personData.name;
        elderCheckbox.checked = personData.elder;
        servantCheckbox.checked = personData.servant;
        pioneerCheckbox.checked = personData.pioneer;
        spouseCheckbox.checked = personData.spouse;
        childCheckbox.checked = personData.child;
        familyHeadCheckbox.checked = personData.familyHead;
        leaderCheckbox.checked = personData.leader;     // New property
        helperCheckbox.checked = personData.helper;     // New property
    } else {
        nameInput.value = 'New Person';
        elderCheckbox.checked = false;
        servantCheckbox.checked = false;
        pioneerCheckbox.checked = false;
        spouseCheckbox.checked = false;
        childCheckbox.checked = false;
        familyHeadCheckbox.checked = false;
        leaderCheckbox.checked = false;                // New property
        helperCheckbox.checked = false;                // New property
    }
    
    // Populate group dropdown
    groupSelect.innerHTML = '<option value="">No Group</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        if (personData && personData.group === group.id) {
            option.selected = true;
        }
        groupSelect.appendChild(option);
    });
    
    // Show the modal
    modal.style.display = 'flex';
}

// Handle person save
document.getElementById('save-person').addEventListener('click', () => {
    const name = document.getElementById('person-name').value;
    const groupId = document.getElementById('person-group').value;
    
    const elder = document.getElementById('person-elder').checked;
    const servant = document.getElementById('person-servant').checked;
    const pioneer = document.getElementById('person-pioneer').checked;
    const spouse = document.getElementById('person-spouse').checked;
    const child = document.getElementById('person-child').checked;
    const familyHead = document.getElementById('person-familyhead').checked;
    const leader = document.getElementById('person-leader').checked;     // New property
    const helper = document.getElementById('person-helper').checked;     // New property
    
    if (selectedPerson) {
        // Update existing person
        selectedPerson.name = name;
        selectedPerson.group = groupId || null;
        selectedPerson.elder = elder;
        selectedPerson.servant = servant;
        selectedPerson.pioneer = pioneer;
        selectedPerson.spouse = spouse;
        selectedPerson.child = child;
        selectedPerson.familyHead = familyHead;
        selectedPerson.leader = leader;     // New property
        selectedPerson.helper = helper;     // New property
        updatePersonColor(selectedPerson);
    }
    
    // Close modal and update list
    document.getElementById('person-modal').style.display = 'none';
    updatePersonsList();
    selectedPerson = null;
});

// Assign a person to a group
function assignPersonToGroup(personData, groupId) {
    personData.group = groupId;
    updatePersonColor(personData);
}

// Update a single person's color
function updatePersonColor(personData) {
    // Get the group color if the person is in a group
    let groupColor = null;
    if (personData.group) {
        const group = groups.find(g => g.id === personData.group);
        if (group) {
            groupColor = group.color;
        }
    }
    
    // Set icon based on configuration and group status
    personData.marker.setIcon(getPersonMarkerIcon(personData, groupColor));
}

