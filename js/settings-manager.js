// Application configuration management

// Application configuration management

// Default configuration
const DEFAULT_CONFIG = {
    // Appearance settings
    appearance: {
        person: {
            icon: 'default',
            color: '#FF0000'
        },
        meeting: {
            icon: 'blue-dot',
            color: '#0000FF'
        },
        group: {
            style: 'circle'
        }
    },
   // Auto-grouping settings
   autoGrouping: {
    distanceThreshold: 1.0, // in kilometers
    minGroupSize: 2,
    maxGroupSize: 20,
    maxGroupSizeDifference: 5,
    keepFamiliesTogether: true, // New option for families
    requirements: {
        minElders: 0,
        minServants: 0,
        minPioneers: 0,
        minLeaders: 1,
        minHelpers: 1,
        minPublishers: 0 // New requirement for publishers
        }
    },
};

// Current configuration (start with defaults)
// Use var instead of let to avoid redeclaration
let appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));




// Try to load saved configuration from localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('mapAppConfig');
    if (savedConfig) {
        try {
            appConfig = JSON.parse(savedConfig);
            
            // Add new properties if they don't exist (backward compatibility)
            if (!appConfig.autoGrouping.requirements.minLeaders) {
                appConfig.autoGrouping.requirements.minLeaders = 1;
            }
            if (!appConfig.autoGrouping.requirements.minHelpers) {
                appConfig.autoGrouping.requirements.minHelpers = 1;
            }
        } catch (e) {
            console.error('Error loading saved configuration:', e);
            appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    }
    

    
    // Apply loaded configuration to UI
    applyConfigToUI();
}

// Save current configuration to localStorage
function saveConfig() {
    localStorage.setItem('mapAppConfig', JSON.stringify(appConfig));
}

// Apply current configuration to UI elements with safety checks
function applyConfigToUI() {
    // Set appearance tab values with safety checks
    safelySetValue('person-icon-select', appConfig.appearance.person.icon);
    safelySetValue('person-color', appConfig.appearance.person.color);
    safelySetValue('meeting-icon-select', appConfig.appearance.meeting.icon);
    safelySetValue('meeting-color', appConfig.appearance.meeting.color);
    safelySetValue('group-icon-select', appConfig.appearance.group.style);
    
    // Set auto-grouping tab values with safety checks
    safelySetValue('distance-threshold', appConfig.autoGrouping.distanceThreshold);
    safelySetValue('min-group-size', appConfig.autoGrouping.minGroupSize);
    safelySetValue('max-group-size', appConfig.autoGrouping.maxGroupSize || 20);
    safelySetValue('min-elders', appConfig.autoGrouping.requirements.minElders);
    safelySetValue('min-servants', appConfig.autoGrouping.requirements.minServants);
    safelySetValue('min-pioneers', appConfig.autoGrouping.requirements.minPioneers);
    safelySetValue('min-leaders', appConfig.autoGrouping.requirements.minLeaders);
    safelySetValue('min-helpers', appConfig.autoGrouping.requirements.minHelpers);
    
    // Check if the checkbox exists before setting its value
    const keepFamiliesCheckbox = document.getElementById('keep-families-together');
    if (keepFamiliesCheckbox) {
        keepFamiliesCheckbox.checked = 
            appConfig.autoGrouping.keepFamiliesTogether !== undefined ? 
            appConfig.autoGrouping.keepFamiliesTogether : true;
    }
    
    safelySetValue('min-publishers', appConfig.autoGrouping.requirements.minPublishers || 0);
}
// Helper function to safely set a value on an element if it exists
function safelySetValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.value = value;
    } else {
        console.log(`Element with ID '${elementId}' not found.`);
    }
}

// Similarly, update the readConfigFromUI function
function readConfigFromUI() {
    // Read appearance tab values with safety checks
    appConfig.appearance.person.icon = safelyGetValue('person-icon-select', appConfig.appearance.person.icon);
    appConfig.appearance.person.color = safelyGetValue('person-color', appConfig.appearance.person.color);
    appConfig.appearance.meeting.icon = safelyGetValue('meeting-icon-select', appConfig.appearance.meeting.icon);
    appConfig.appearance.meeting.color = safelyGetValue('meeting-color', appConfig.appearance.meeting.color);
    appConfig.appearance.group.style = safelyGetValue('group-icon-select', appConfig.appearance.group.style);
    
    // Read auto-grouping tab values with safety checks
    appConfig.autoGrouping.distanceThreshold = parseFloat(safelyGetValue('distance-threshold', appConfig.autoGrouping.distanceThreshold));
    appConfig.autoGrouping.minGroupSize = parseInt(safelyGetValue('min-group-size', appConfig.autoGrouping.minGroupSize));
    appConfig.autoGrouping.maxGroupSize = parseInt(safelyGetValue('max-group-size', appConfig.autoGrouping.maxGroupSize));
    
    // Only try to get the value if the element exists
    const maxGroupSizeDifferenceElement = document.getElementById('max-group-size-difference');
    if (maxGroupSizeDifferenceElement) {
        appConfig.autoGrouping.maxGroupSizeDifference = parseInt(maxGroupSizeDifferenceElement.value);
    }
    
    // For checkbox element, check if it exists
    const keepFamiliesTogether = document.getElementById('keep-families-together');
    if (keepFamiliesTogether) {
        appConfig.autoGrouping.keepFamiliesTogether = keepFamiliesTogether.checked;
    }
    
    // Read requirements with safety checks
    appConfig.autoGrouping.requirements.minPublishers = parseInt(safelyGetValue('min-publishers', appConfig.autoGrouping.requirements.minPublishers || 0));
    appConfig.autoGrouping.requirements.minElders = parseInt(safelyGetValue('min-elders', appConfig.autoGrouping.requirements.minElders));
    appConfig.autoGrouping.requirements.minServants = parseInt(safelyGetValue('min-servants', appConfig.autoGrouping.requirements.minServants));
    appConfig.autoGrouping.requirements.minPioneers = parseInt(safelyGetValue('min-pioneers', appConfig.autoGrouping.requirements.minPioneers));
    appConfig.autoGrouping.requirements.minLeaders = parseInt(safelyGetValue('min-leaders', appConfig.autoGrouping.requirements.minLeaders));
    appConfig.autoGrouping.requirements.minHelpers = parseInt(safelyGetValue('min-helpers', appConfig.autoGrouping.requirements.minHelpers));
}

// Helper function to safely get a value from an element if it exists
function safelyGetValue(elementId, defaultValue) {
    const element = document.getElementById(elementId);
    return element ? element.value : defaultValue;
}

// Reset configuration to defaults
function resetConfig() {
    appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    applyConfigToUI();
    saveConfig();
    
    // Update all visual elements
    updateMarkerColors();
    
    // Update MAX_AUTO_GROUP_DISTANCE
    MAX_AUTO_GROUP_DISTANCE = appConfig.autoGrouping.distanceThreshold / 111;
}

// Get marker icon based on configuration
function getPersonMarkerIcon(person, groupColor = null) {
    // If person is in a group, use group styling
    if (person.group && groupColor) {
        switch (appConfig.appearance.group.style) {
            case 'circle':
                return {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: groupColor,
                    fillOpacity: 0.7,
                    strokeWeight: 1,
                    strokeColor: '#000'
                };
            case 'square':
                return {
                    path: 'M -8,-8 8,-8 8,8 -8,8 z',
                    scale: 1,
                    fillColor: groupColor,
                    fillOpacity: 0.7,
                    strokeWeight: 1,
                    strokeColor: '#000'
                };
            case 'star':
                return {
                    path: 'M 0,-10 2,-3 10,-3 4,1 6,9 0,4 -6,9 -4,1 -10,-3 -2,-3 z',
                    scale: 1,
                    fillColor: groupColor,
                    fillOpacity: 0.7,
                    strokeWeight: 1,
                    strokeColor: '#000'
                };
            case 'custom-color':
                // Just use default marker with custom color
                return {
                    url: `http://maps.google.com/mapfiles/ms/icons/red-dot.png`,
                    scaledSize: new google.maps.Size(32, 32)
                };
            default:
                return null; // Default marker
        }
    }
    
    // Not in a group, use person default styling
    switch (appConfig.appearance.person.icon) {
        case 'circle':
            return {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'square':
            return {
                path: 'M -8,-8 8,-8 8,8 -8,8 z',
                scale: 1,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'star':
            return {
                path: 'M 0,-10 2,-3 10,-3 4,1 6,9 0,4 -6,9 -4,1 -10,-3 -2,-3 z',
                scale: 1,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'person':
            return {
                path: 'M 0,0 c -2.1,0 -3.8,1.7 -3.8,3.8 0,2.1 1.7,3.8 3.8,3.8 2.1,0 3.8,-1.7 3.8,-3.8 0,-2.1 -1.7,-3.8 -3.8,-3.8 z M 0,10.5 c -2.5,0 -7.5,1.3 -7.5,3.8 v 1.8 H 7.5 v -1.8 c 0,-2.5 -5,-3.8 -7.5,-3.8 z',
                scale: 1.2,
                fillColor: appConfig.appearance.person.color,
                fillOpacity: 0.7,
                strokeWeight: 1,
                strokeColor: '#000'
            };
        case 'default':
        default:
            return null; // Default Google marker
    }
}

// Similar function for meeting marker icons
function getMeetingMarkerIcon(meeting, groupColor = null) {
    // If meeting is in a group, use group styling
    if (meeting.group && groupColor) {
        // For meeting points in groups, we keep them blue but might scale them differently
        return {
            url: `https://maps.google.com/mapfiles/ms/icons/blue-dot.png`,
            scaledSize: new google.maps.Size(32, 32)
        };
    }
    
    // Not in a group, use meeting default styling
    switch (appConfig.appearance.meeting.icon) {
        case 'blue-dot':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            };
        case 'green-dot':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
            };
        case 'purple-dot':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png'
            };
        case 'flag':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/flag.png'
            };
        case 'info':
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/info.png'
            };
        default:
            return {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            };
    }
}

// Setup configuration UI tabs
function setupConfigTabs() {
    const tabButtons = document.querySelectorAll('#config-modal .tab-button');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#config-modal .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Initialize configuration-related event listeners with safety checks
function initConfigListeners() {
    // Open configuration modal
    const openConfigBtn = document.getElementById('open-config');
    if (openConfigBtn) {
        openConfigBtn.addEventListener('click', () => {
            // Make sure UI reflects current config
            applyConfigToUI();
            const configModal = document.getElementById('config-modal');
            if (configModal) {
                configModal.style.display = 'flex';
            }
        });
    }
    
    // Save configuration
    const saveConfigBtn = document.getElementById('save-config');
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', () => {
            // Read values from UI
            readConfigFromUI();
            
            // Save to local storage
            saveConfig();
            
            // Apply changes to all existing markers
            if (typeof updateMarkerColors === 'function') {
                updateMarkerColors();
            }
            
            // Close modal
            const configModal = document.getElementById('config-modal');
            if (configModal) {
                configModal.style.display = 'none';
            }
        });
    }
    
    // Cancel configuration changes
    const cancelConfigBtn = document.getElementById('cancel-config');
    if (cancelConfigBtn) {
        cancelConfigBtn.addEventListener('click', () => {
            // Revert to saved config without saving
            applyConfigToUI();
            const configModal = document.getElementById('config-modal');
            if (configModal) {
                configModal.style.display = 'none';
            }
        });
    }
    
    // Reset to defaults
    const resetConfigBtn = document.getElementById('reset-config');
    if (resetConfigBtn) {
        resetConfigBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all settings to defaults?')) {
                resetConfig();
            }
        });
    }
    
    // Setup tabs in the configuration modal
    setupConfigTabs();
}

// Also update the setupConfigTabs function to check for elements
function setupConfigTabs() {
    const tabButtons = document.querySelectorAll('#config-modal .tab-button');
    
    if (tabButtons.length === 0) {
        console.log('No tab buttons found for config modal');
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('#config-modal .tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

// Update the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', () => {
    // Check if configuration is available before loading it
    try {
        loadConfig();
    } catch (e) {
        console.error('Error loading config:', e);
        // If loading fails, use defaults
        appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    
    // Check if necessary DOM elements exist before initializing listeners
    const configElements = ['open-config', 'save-config', 'cancel-config', 'reset-config'];
    const allExist = configElements.every(id => document.getElementById(id) !== null);
    
    // Only initialize if all required elements exist
    if (allExist) {
        initConfigListeners();
    } else {
        console.log('Not all config UI elements exist, skipping initConfigListeners');
        
        // If some elements exist but not all, we can try to create them
        // or just skip initialization until the full UI is ready
    }
});