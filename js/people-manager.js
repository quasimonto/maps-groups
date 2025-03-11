// people-manager.js - Functions for managing people

// Wait for DOM to be fully loaded before accessing DOM elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing people manager');
    initPeopleManager();
});

// Initialize people manager functionality
function initPeopleManager() {
    // Set up event listeners for people-related actions
    setupPeopleEventListeners();
}

// Set up people-related event listeners
function setupPeopleEventListeners() {
    // Add button clicks
    const addPersonButton = document.getElementById('add-person-btn');
    if (addPersonButton) {
        addPersonButton.addEventListener('click', function() {
            setActivePage('person-add-section');
        });
    }
    
    // Form submission
    const addPersonForm = document.getElementById('add-person-form');
    if (addPersonForm) {
        addPersonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addPerson();
        });
    }
    
    // Cancel button
    const cancelAddPersonButton = document.getElementById('cancel-add-person');
    if (cancelAddPersonButton) {
        cancelAddPersonButton.addEventListener('click', function() {
            setActivePage('people-list-section');
        });
    }
    
    // Filter buttons
    const applyFilterButton = document.getElementById('apply-filters-btn');
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', applyPersonFilters);
    }
    
    const clearFilterButton = document.getElementById('clear-filters-btn');
    if (clearFilterButton) {
        clearFilterButton.addEventListener('click', clearPersonFilters);
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