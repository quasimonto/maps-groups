// app.js - Main application file that initializes everything

// Define global variables that will be shared across files
window.map = null; // Google Maps instance
window.persons = []; // Array of people
window.meetingPoints = []; // Array of meeting points
window.groups = []; // Array of groups
window.families = []; // Array of families
window.geocoder = null; // Geocoder instance
window.selectedGroup = null; // Currently selected group

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - initializing application');
    
    // Load saved data
    if (typeof loadData === 'function') {
        loadData();
    } else {
        console.error('loadData function not found');
    }
    
    // Initialize the map
    if (typeof initMap === 'function') {
        initMap();
    } else {
        console.error('initMap function not found');
    }
    
    // Initialize sidebar navigation
    if (typeof initSidebar === 'function') {
        initSidebar();
    } else {
        console.error('initSidebar function not found');
    }
    
    // Set up event listeners for the application
    setupEventListeners();
});

// Setup global event listeners
function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Check if elements exist before adding listeners
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            if (typeof searchLocation === 'function') {
                searchLocation();
            } else {
                console.error('searchLocation function not found');
            }
        });
    }
    
    // Add person button
    const addPersonBtn = document.getElementById('add-person-btn');
    if (addPersonBtn) {
        addPersonBtn.addEventListener('click', function() {
            if (typeof setActivePage === 'function') {
                setActivePage('person-add-section');
            } else {
                console.error('setActivePage function not found');
            }
        });
    }
    
    // Add person form
    const addPersonForm = document.getElementById('add-person-form');
    if (addPersonForm) {
        addPersonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof addPerson === 'function') {
                addPerson();
            } else {
                console.error('addPerson function not found');
            }
        });
    }
    
    // Add meeting point button
    const addMeetingBtn = document.getElementById('add-meeting-btn');
    if (addMeetingBtn) {
        addMeetingBtn.addEventListener('click', function() {
            if (typeof setActivePage === 'function') {
                setActivePage('meeting-add-section');
            } else {
                console.error('setActivePage function not found');
            }
        });
    }
    
    // Add meeting form
    const addMeetingForm = document.getElementById('add-meeting-form');
    if (addMeetingForm) {
        addMeetingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof addMeetingPoint === 'function') {
                addMeetingPoint();
            } else {
                console.error('addMeetingPoint function not found');
            }
        });
    }
    
    // Create group button
    const createGroupBtn = document.getElementById('create-group-btn');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', function() {
            if (typeof setActivePage === 'function') {
                setActivePage('group-create-section');
            } else {
                console.error('setActivePage function not found');
            }
        });
    }
    
    // Create group form
    const createGroupForm = document.getElementById('create-group-form');
    if (createGroupForm) {
        createGroupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (typeof createGroup === 'function') {
                createGroup();
            } else {
                console.error('createGroup function not found');
            }
        });
    }
    
    // Auto create groups button
    const autoCreateGroupsBtn = document.getElementById('auto-create-groups-btn');
    if (autoCreateGroupsBtn) {
        autoCreateGroupsBtn.addEventListener('click', function() {
            if (typeof setActivePage === 'function') {
                setActivePage('group-auto-section');
            } else {
                console.error('setActivePage function not found');
            }
        });
    }
    
    // Run auto group button
    const runAutoGroupBtn = document.getElementById('run-auto-group');
    if (runAutoGroupBtn) {
        runAutoGroupBtn.addEventListener('click', function() {
            if (typeof autoCreateGroups === 'function') {
                autoCreateGroups();
            } else {
                console.error('autoCreateGroups function not found');
            }
        });
    }
    
    // Listen for page changes
    document.addEventListener('pageChanged', function(e) {
        const pageId = e.detail.pageId;
        console.log('Page changed to:', pageId);
        
        // Update UI when relevant pages are shown
        if (pageId === 'people-list-section' && typeof populatePeopleList === 'function') {
            populatePeopleList();
        } else if (pageId === 'meeting-list-section' && typeof populateMeetingPointsList === 'function') {
            populateMeetingPointsList();
        } else if (pageId === 'groups-list-section' && typeof populateGroupsList === 'function') {
            populateGroupsList();
        } else if (pageId === 'families-list-section' && typeof populateFamiliesList === 'function') {
            populateFamiliesList();
        }
    });
    
    console.log('Event listeners setup complete');
}

// Trigger page changed event
function triggerPageChangedEvent(pageId) {
    console.log('Triggering page changed event for:', pageId);
    const event = new CustomEvent('pageChanged', {
        detail: { pageId: pageId }
    });
    document.dispatchEvent(event);
}

// Function to populate UI elements with data (called once data is loaded)
window.populateUI = function() {
    console.log('Populating UI elements');
    
    // Call populate functions if they exist
    if (typeof populatePeopleList === 'function') {
        populatePeopleList();
    }
    
    if (typeof populateMeetingPointsList === 'function') {
        populateMeetingPointsList();
    }
    
    if (typeof populateGroupsList === 'function') {
        populateGroupsList();
    }
    
    if (typeof populateFamiliesList === 'function') {
        populateFamiliesList();
    }
    
    // Populate form dropdowns
    if (typeof populateGroupDropdowns === 'function') {
        populateGroupDropdowns();
    }
    
    if (typeof populateFamilyDropdowns === 'function') {
        populateFamilyDropdowns();
    }
};