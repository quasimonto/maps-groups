// UI-related functions

// Set up tab navigation
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Set up all the event listeners for the UI
function setupEventListeners() {
    // Config button
    const configButton = document.getElementById('open-config');
    if (configButton) {
        configButton.addEventListener('click', () => {
            console.log('Config button clicked');
            const configModal = document.getElementById('config-modal');
            if (configModal) {
                configModal.style.display = 'flex';
            } else {
                console.error('Config modal element not found');
            }
        });
    } else {
        console.error('Config button element not found');
    }

    // Person add button
    document.getElementById('add-person').addEventListener('click', () => {
        // Toggle the map click mode for adding persons
        mapClickMode = mapClickMode === 'person' ? null : 'person';
        // If switching to person mode, turn off meeting mode
        updateAddButtonStyles();
    });
    
    // Meeting point add button
    document.getElementById('add-meeting').addEventListener('click', () => {
        // Toggle the map click mode for adding meeting points
        mapClickMode = mapClickMode === 'meeting' ? null : 'meeting';
        // If switching to meeting mode, turn off person mode
        updateAddButtonStyles();
    });
    
    // Person modal save button
    document.getElementById('save-person').addEventListener('click', () => {
        const name = document.getElementById('person-name').value;
        const groupId = document.getElementById('person-group').value;
        
        const elder = document.getElementById('person-elder').checked;
        const servant = document.getElementById('person-servant').checked;
        const pioneer = document.getElementById('person-pioneer').checked;
        const spouse = document.getElementById('person-spouse').checked;
        const child = document.getElementById('person-child').checked;
        const familyHead = document.getElementById('person-familyhead').checked;
        
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
            updatePersonColor(selectedPerson);
        }
        
        // Close modal and update list
        document.getElementById('person-modal').style.display = 'none';
        updatePersonsList();
        selectedPerson = null;
    });
    
    // Person modal cancel button
    document.getElementById('cancel-person').addEventListener('click', () => {
        document.getElementById('person-modal').style.display = 'none';
        selectedPerson = null;
    });
    
    // Meeting modal save button
    document.getElementById('save-meeting').addEventListener('click', () => {
        const name = document.getElementById('meeting-name').value;
        const description = document.getElementById('meeting-description').value;
        const groupId = document.getElementById('meeting-group').value;
        
        if (selectedMeeting) {
            // Update existing meeting point
            selectedMeeting.name = name;
            selectedMeeting.description = description;
            selectedMeeting.group = groupId || null;
            updateMeetingColor(selectedMeeting);
        }
        
        // Close modal and update list
        document.getElementById('meeting-modal').style.display = 'none';
        updateMeetingsList();
        selectedMeeting = null;
    });
    
    // Meeting modal cancel button
    document.getElementById('cancel-meeting').addEventListener('click', () => {
        document.getElementById('meeting-modal').style.display = 'none';
        selectedMeeting = null;
    });
    
    // Create group button
    document.getElementById('create-group').addEventListener('click', () => {
        document.getElementById('group-modal').style.display = 'flex';
    });
    
    // Group modal save button
    document.getElementById('save-group').addEventListener('click', () => {
        const name = document.getElementById('group-name').value;
        const color = document.getElementById('group-color').value;
        
        if (name) {
            createGroup(name, color);
            document.getElementById('group-modal').style.display = 'none';
            document.getElementById('group-name').value = '';
        }
    });
    
    // Group modal cancel button
    document.getElementById('cancel-group').addEventListener('click', () => {
        document.getElementById('group-modal').style.display = 'none';
    });
    
    // Auto group button
    document.getElementById('auto-group').addEventListener('click', autoGroupByArea);
    
    // Filter buttons
    document.getElementById('apply-filter').addEventListener('click', () => {
        activeFilters.elder = document.getElementById('filter-elder').checked;
        activeFilters.servant = document.getElementById('filter-servant').checked;
        activeFilters.pioneer = document.getElementById('filter-pioneer').checked;
        activeFilters.familyHead = document.getElementById('filter-familyhead').checked;
        
        updatePersonsList();
    });
    
    document.getElementById('clear-filter').addEventListener('click', () => {
        document.getElementById('filter-elder').checked = false;
        document.getElementById('filter-servant').checked = false;
        document.getElementById('filter-pioneer').checked = false;
        document.getElementById('filter-familyhead').checked = false;
        
        activeFilters.elder = false;
        activeFilters.servant = false;
        activeFilters.pioneer = false;
        activeFilters.familyHead = false;
        
        updatePersonsList();
    });
}

// Make sure config event listeners are set up when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Set up config modal specific event listeners
    const configButton = document.getElementById('open-config');
    if (configButton) {
        configButton.addEventListener('click', function() {
            const configModal = document.getElementById('config-modal');
            if (configModal) {
                configModal.style.display = 'flex';
            }
        });
    }
    
    // Set up config save/cancel buttons if they exist
    const saveConfigButton = document.getElementById('save-config');
    if (saveConfigButton) {
        saveConfigButton.addEventListener('click', function() {
            // Logic to save config (should be defined in app-config.js)
            if (typeof readConfigFromUI === 'function') {
                readConfigFromUI();
                saveConfig();
                updateMarkerColors();
                document.getElementById('config-modal').style.display = 'none';
            }
        });
    }
    
    const cancelConfigButton = document.getElementById('cancel-config');
    if (cancelConfigButton) {
        cancelConfigButton.addEventListener('click', function() {
            document.getElementById('config-modal').style.display = 'none';
        });
    }
    
    const resetConfigButton = document.getElementById('reset-config');
    if (resetConfigButton) {
        resetConfigButton.addEventListener('click', function() {
            if (typeof resetConfig === 'function' && confirm('Reset all settings to defaults?')) {
                resetConfig();
            }
        });
    }
    
    // Set up tabs in the config modal
    const configTabButtons = document.querySelectorAll('#config-modal .tab-button');
    configTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            configTabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#config-modal .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
});