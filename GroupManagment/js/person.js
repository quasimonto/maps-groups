// Person-related functions

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
        familyHead: false
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
    
    // Check if any filters are active
    const anyFilterActive = 
        activeFilters.elder || 
        activeFilters.servant || 
        activeFilters.pioneer || 
        activeFilters.familyHead;
        
    if (anyFilterActive) {
        filteredPersons = persons.filter(person => 
            (activeFilters.elder && person.elder) ||
            (activeFilters.servant && person.servant) ||
            (activeFilters.pioneer && person.pioneer) ||
            (activeFilters.familyHead && person.familyHead)
        );
    }
    
    filteredPersons.forEach(personData => {
        const item = document.createElement('div');
        item.className = 'person-item';
        
        item.innerHTML = `
            <div>${personData.name}</div>
            <button class="delete-button" data-id="${personData.id}">✕</button>
        `;
        
        // Add click event to focus on the person
        item.querySelector('div').addEventListener('click', () => {
            map.panTo(personData.marker.getPosition());
            map.setZoom(15);
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
    
    const elderCheckbox = document.getElementById('person-elder');
    const servantCheckbox = document.getElementById('person-servant');
    const pioneerCheckbox = document.getElementById('person-pioneer');
    const spouseCheckbox = document.getElementById('person-spouse');
    const childCheckbox = document.getElementById('person-child');
    const familyHeadCheckbox = document.getElementById('person-familyhead');
    
    // Update modal title
    title.textContent = personData ? 'Edit Person' : 'Add Person';
    
    // Populate form if editing
    if (personData) {
        nameInput.value = personData.name;
        elderCheckbox.checked = personData.elder;
        servantCheckbox.checked = personData.servant;
        pioneerCheckbox.checked = personData.pioneer;
        spouseCheckbox.checked = personData.spouse;
        childCheckbox.checked = personData.child;
        familyHeadCheckbox.checked = personData.familyHead;
    } else {
        nameInput.value = 'New Person';
        elderCheckbox.checked = false;
        servantCheckbox.checked = false;
        pioneerCheckbox.checked = false;
        spouseCheckbox.checked = false;
        childCheckbox.checked = false;
        familyHeadCheckbox.checked = false;
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