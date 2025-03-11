// data-manager.js - Handles data loading, saving, import and export

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing data manager');
    initDataManager();
});

// Initialize data manager
function initDataManager() {
    // Set up import/export event listeners
    initImportExport();
}

// Initialize import/export functionality
function initImportExport() {
    console.log('Setting up import/export event listeners');
    
    // Export button
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Import button
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', function() {
            const importFile = document.getElementById('import-file');
            if (importFile && importFile.files.length > 0) {
                importData();
            } else {
                showNotification('Please select a file to import', 'warning');
            }
        });
    }
    
    // Import file input
    const importFileInput = document.getElementById('import-file');
    if (importFileInput) {
        importFileInput.addEventListener('change', function() {
            const importType = document.getElementById('import-type');
            if (importType) {
                // Update preview based on selected file
                if (this.files.length > 0) {
                    previewImportFile(this.files[0], importType.value);
                }
            }
        });
    }
    
    // Confirm import button
    const confirmImportBtn = document.getElementById('confirm-import');
    if (confirmImportBtn) {
        confirmImportBtn.addEventListener('click', function() {
            const importFile = document.getElementById('import-file');
            if (importFile && importFile.files.length > 0) {
                confirmImport();
            } else {
                showNotification('Please select a file to import', 'warning');
            }
        });
    }
    
    // Cancel import button
    const cancelImportBtn = document.getElementById('cancel-import');
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', function() {
            const importPreview = document.getElementById('import-preview');
            if (importPreview) {
                importPreview.style.display = 'none';
            }
        });
    }
}

// Load data from localStorage
function loadData() {
    console.log('Loading data from localStorage');
    
    try {
        // Load persons
        const personsData = localStorage.getItem('persons');
        if (personsData) {
            window.persons = JSON.parse(personsData);
            console.log(`Loaded ${window.persons.length} persons`);
        } else {
            window.persons = [];
        }
        
        // Load meeting points
        const meetingPointsData = localStorage.getItem('meetingPoints');
        if (meetingPointsData) {
            window.meetingPoints = JSON.parse(meetingPointsData);
            console.log(`Loaded ${window.meetingPoints.length} meeting points`);
        } else {
            window.meetingPoints = [];
        }
        
        // Load groups
        const groupsData = localStorage.getItem('groups');
        if (groupsData) {
            window.groups = JSON.parse(groupsData);
            console.log(`Loaded ${window.groups.length} groups`);
        } else {
            window.groups = [];
        }
        
        // Load families
        const familiesData = localStorage.getItem('families');
        if (familiesData) {
            window.families = JSON.parse(familiesData);
            console.log(`Loaded ${window.families.length} families`);
        } else {
            window.families = [];
        }
        
        // Load settings
        loadSettings();
        
        return true;
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// Save data to localStorage
function saveData() {
    console.log('Saving data to localStorage');
    
    try {
        // Save persons (without circular references like markers)
        const personsToSave = window.persons.map(person => {
            const { marker, ...personData } = person;
            return personData;
        });
        localStorage.setItem('persons', JSON.stringify(personsToSave));
        
        // Save meeting points (without circular references)
        const meetingPointsToSave = window.meetingPoints.map(meetingPoint => {
            const { marker, ...meetingPointData } = meetingPoint;
            return meetingPointData;
        });
        localStorage.setItem('meetingPoints', JSON.stringify(meetingPointsToSave));
        
        // Save groups
        localStorage.setItem('groups', JSON.stringify(window.groups));
        
        // Save families
        localStorage.setItem('families', JSON.stringify(window.families));
        
        // Save settings
        saveSettings();
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Load application settings
function loadSettings() {
    console.log('Loading application settings');
    
    try {
        const settings = localStorage.getItem('appSettings');
        if (settings) {
            const appSettings = JSON.parse(settings);
            
            // Apply settings
            applySettings(appSettings);
        }
        
        return true;
    } catch (error) {
        console.error('Error loading settings:', error);
        return false;
    }
}

// Apply loaded settings
function applySettings(appSettings) {
    // Apply theme
    if (appSettings.theme === 'dark') {
        document.body.classList.add('dark-mode');
        
        // Update radio buttons if they exist
        const darkThemeRadio = document.querySelector('input[name="theme"][value="dark"]');
        if (darkThemeRadio) {
            darkThemeRadio.checked = true;
        }
    }
    
    // Apply map settings if map exists
    if (window.map && appSettings.mapType) {
        window.map.setMapTypeId(appSettings.mapType);
        
        // Update select if it exists
        const mapTypeSelect = document.getElementById('map-type');
        if (mapTypeSelect) {
            mapTypeSelect.value = appSettings.mapType;
        }
    }
    
    // Apply other settings to form elements if they exist
    applySettingToCheckbox('show-names-on-markers', appSettings.showNamesOnMarkers);
    applySettingToCheckbox('show-role-indicators', appSettings.showRoleIndicators);
    applySettingToCheckbox('cluster-markers', appSettings.clusterMarkers);
    applySettingToCheckbox('auto-save', appSettings.autoSave);
    
    applySettingToInput('auto-save-interval', appSettings.autoSaveInterval);
    applySettingToInput('person-color', appSettings.personColor);
    applySettingToInput('meeting-color', appSettings.meetingColor);
    applySettingToInput('elder-color', appSettings.elderColor);
    
    // Start auto save if enabled
    if (appSettings.autoSave) {
        startAutoSave(appSettings.autoSaveInterval || 5);
    }
}

// Helper function to apply a setting to a checkbox
function applySettingToCheckbox(id, value) {
    if (value !== undefined) {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.checked = value;
        }
    }
}

// Helper function to apply a setting to an input
function applySettingToInput(id, value) {
    if (value !== undefined) {
        const input = document.getElementById(id);
        if (input) {
            input.value = value;
        }
    }
}

// Save application settings
function saveSettings() {
    console.log('Saving application settings');
    
    try {
        // Get settings from UI if elements exist
        const settings = getSettingsFromUI();
        
        // Save settings to localStorage
        localStorage.setItem('appSettings', JSON.stringify(settings));
        
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// Get settings from UI elements
function getSettingsFromUI() {
    const settings = {};
    
    // Get theme setting
    const themeRadios = document.querySelectorAll('input[name="theme"]');
    if (themeRadios.length > 0) {
        themeRadios.forEach(radio => {
            if (radio.checked) {
                settings.theme = radio.value;
            }
        });
    } else {
        // Default to light theme
        settings.theme = 'light';
    }
    
    // Get auto save settings
    const autoSaveCheckbox = document.getElementById('auto-save');
    if (autoSaveCheckbox) {
        settings.autoSave = autoSaveCheckbox.checked;
    }
    
    const autoSaveIntervalInput = document.getElementById('auto-save-interval');
    if (autoSaveIntervalInput) {
        settings.autoSaveInterval = parseInt(autoSaveIntervalInput.value) || 5;
    }
    
    // Get map settings
    const mapTypeSelect = document.getElementById('map-type');
    if (mapTypeSelect) {
        settings.mapType = mapTypeSelect.value;
    }
    
    // Get marker settings
    const showNamesCheckbox = document.getElementById('show-names-on-markers');
    if (showNamesCheckbox) {
        settings.showNamesOnMarkers = showNamesCheckbox.checked;
    }
    
    const showRoleIndicatorsCheckbox = document.getElementById('show-role-indicators');
    if (showRoleIndicatorsCheckbox) {
        settings.showRoleIndicators = showRoleIndicatorsCheckbox.checked;
    }
    
    const clusterMarkersCheckbox = document.getElementById('cluster-markers');
    if (clusterMarkersCheckbox) {
        settings.clusterMarkers = clusterMarkersCheckbox.checked;
    }
    
    // Get marker colors
    const personColorInput = document.getElementById('person-color');
    if (personColorInput) {
        settings.personColor = personColorInput.value;
    }
    
    const meetingColorInput = document.getElementById('meeting-color');
    if (meetingColorInput) {
        settings.meetingColor = meetingColorInput.value;
    }
    
    const elderColorInput = document.getElementById('elder-color');
    if (elderColorInput) {
        settings.elderColor = elderColorInput.value;
    }
    
    return settings;
}

// Auto save functionality
let autoSaveInterval;

// Start auto save with specified interval
function startAutoSave(minutes) {
    console.log(`Setting up auto save every ${minutes} minutes`);
    
    // Clear any existing interval
    stopAutoSave();
    
    // Set new interval
    autoSaveInterval = setInterval(() => {
        console.log('Auto saving data...');
        saveData();
        showNotification('Data auto-saved', 'info');
    }, minutes * 60 * 1000);
}

// Stop auto save
function stopAutoSave() {
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
}

// Export data
function exportData() {
    console.log('Exporting data');
    
    const exportTypeSelect = document.getElementById('export-type');
    const exportFormatSelect = document.getElementById('export-format');
    
    if (!exportTypeSelect || !exportFormatSelect) {
        console.error('Export form elements not found');
        showNotification('Error: Export form elements not found', 'error');
        return;
    }
    
    const exportType = exportTypeSelect.value;
    const exportFormat = exportFormatSelect.value;
    
    console.log(`Export type: ${exportType}, format: ${exportFormat}`);
    
    // Prepare data based on export type
    let dataToExport = {};
    
    if (exportType === 'all' || exportType === 'people') {
        const personsToExport = window.persons.map(person => {
            const { marker, ...personData } = person;
            return personData;
        });
        dataToExport.persons = personsToExport;
    }
    
    if (exportType === 'all' || exportType === 'meetings') {
        const meetingsToExport = window.meetingPoints.map(meeting => {
            const { marker, ...meetingData } = meeting;
            return meetingData;
        });
        dataToExport.meetingPoints = meetingsToExport;
    }
    
    if (exportType === 'all' || exportType === 'groups') {
        dataToExport.groups = window.groups;
    }
    
    if (exportType === 'all' || exportType === 'families') {
        dataToExport.families = window.families;
    }
    
    // Export based on format
    if (exportFormat === 'json') {
        exportAsJson(dataToExport, `territory-data-${exportType}`);
    } else if (exportFormat === 'csv') {
        exportAsCsv(dataToExport, exportType);
    }
}

// Export data as JSON file
function exportAsJson(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
    
    // Show confirmation
    showNotification('Data exported successfully');
}

// Export data as CSV file
function exportAsCsv(data, exportType) {
    // Handle different data types
    if (exportType === 'people' || exportType === 'all') {
        const csv = convertToCsv(data.persons);
        downloadCsv(csv, 'territory-data-persons');
    }
    
    if (exportType === 'meetings' || exportType === 'all') {
        const csv = convertToCsv(data.meetingPoints);
        downloadCsv(csv, 'territory-data-meeting-points');
    }
    
    if (exportType === 'groups' || exportType === 'all') {
        const csv = convertToCsv(data.groups);
        downloadCsv(csv, 'territory-data-groups');
    }
    
    if (exportType === 'families' || exportType === 'all') {
        const csv = convertToCsv(data.families);
        downloadCsv(csv, 'territory-data-families');
    }
    
    // Show confirmation
    showNotification('Data exported successfully');
}

// Convert array of objects to CSV
function convertToCsv(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const item of data) {
        const values = headers.map(header => {
            const value = item[header];
            // Handle special types
            if (value === null || value === undefined) return '';
            if (typeof value === 'object') return JSON.stringify(value);
            return `"${value}"`;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
}

// Download CSV file
function downloadCsv(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Import data - preview file
function previewImportFile(file, importType) {
    console.log('Previewing import file:', file.name);
    
    // Check if file is JSON
    if (!file.name.endsWith('.json')) {
        showNotification('Only JSON files are supported for import', 'warning');
        return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            showImportPreview(importedData, importType);
        } catch (error) {
            console.error('Error parsing import file:', error);
            showNotification('Error: Invalid JSON format', 'error');
        }
    };
    reader.readAsText(file);
}

// Show import preview
function showImportPreview(importedData, importType) {
    // Get preview container
    const previewContainer = document.getElementById('import-preview-container');
    if (!previewContainer) {
        console.error('Import preview container not found');
        return;
    }
    
    // Clear previous content
    previewContainer.innerHTML = '';
    
    let hasData = false;
    
    // Process people data
    if ((importType === 'all' || importType === 'people') && importedData.persons) {
        hasData = true;
        const personsCount = importedData.persons.length;
        
        const previewItem = document.createElement('div');
        previewItem.className = 'import-preview-item';
        previewItem.innerHTML = `
            <div class="import-preview-header">
                <h4>People</h4>
                <span class="import-preview-count">${personsCount} records</span>
            </div>
            <div class="import-preview-details">
                <ul>
                    ${importedData.persons.slice(0, 5).map(person => 
                        `<li>${person.name} ${person.elder ? '(Elder)' : ''} ${person.pioneer ? '(Pioneer)' : ''}</li>`
                    ).join('')}
                    ${importedData.persons.length > 5 ? `<li>...and ${importedData.persons.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
        previewContainer.appendChild(previewItem);
    }
    
    // Process meeting points data
    if ((importType === 'all' || importType === 'meetings') && importedData.meetingPoints) {
        hasData = true;
        const meetingsCount = importedData.meetingPoints.length;
        
        const previewItem = document.createElement('div');
        previewItem.className = 'import-preview-item';
        previewItem.innerHTML = `
            <div class="import-preview-header">
                <h4>Meeting Points</h4>
                <span class="import-preview-count">${meetingsCount} records</span>
            </div>
            <div class="import-preview-details">
                <ul>
                    ${importedData.meetingPoints.slice(0, 5).map(meeting => 
                        `<li>${meeting.name}</li>`
                    ).join('')}
                    ${importedData.meetingPoints.length > 5 ? `<li>...and ${importedData.meetingPoints.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
        previewContainer.appendChild(previewItem);
    }
    
    // Process groups data
    if ((importType === 'all' || importType === 'groups') && importedData.groups) {
        hasData = true;
        const groupsCount = importedData.groups.length;
        
        const previewItem = document.createElement('div');
        previewItem.className = 'import-preview-item';
        previewItem.innerHTML = `
            <div class="import-preview-header">
                <h4>Groups</h4>
                <span class="import-preview-count">${groupsCount} records</span>
            </div>
            <div class="import-preview-details">
                <ul>
                    ${importedData.groups.slice(0, 5).map(group => 
                        `<li>${group.name}</li>`
                    ).join('')}
                    ${importedData.groups.length > 5 ? `<li>...and ${importedData.groups.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
        previewContainer.appendChild(previewItem);
    }
    
    // Process families data
    if ((importType === 'all' || importType === 'families') && importedData.families) {
        hasData = true;
        const familiesCount = importedData.families.length;
        
        const previewItem = document.createElement('div');
        previewItem.className = 'import-preview-item';
        previewItem.innerHTML = `
            <div class="import-preview-header">
                <h4>Families</h4>
                <span class="import-preview-count">${familiesCount} records</span>
            </div>
            <div class="import-preview-details">
                <ul>
                    ${importedData.families.slice(0, 5).map(family => 
                        `<li>${family.name}</li>`
                    ).join('')}
                    ${importedData.families.length > 5 ? `<li>...and ${importedData.families.length - 5} more</li>` : ''}
                </ul>
            </div>
        `;
        previewContainer.appendChild(previewItem);
    }
    
    if (!hasData) {
        previewContainer.innerHTML = `
            <div class="alert alert-warning">
                No data found for the selected import type.
            </div>
        `;
    }
    
    // Show preview section
    const importPreview = document.getElementById('import-preview');
    if (importPreview) {
        importPreview.style.display = 'block';
    }
    
    // Store imported data in a global variable for later use
    window.importedData = importedData;
}

// Import data - confirm import
function confirmImport() {
    console.log('Confirming import');
    
    if (!window.importedData) {
        showNotification('No data to import', 'error');
        return;
    }
    
    // Get import options
    const importTypeSelect = document.getElementById('import-type');
    const importOverwriteCheckbox = document.getElementById('import-overwrite');
    const importMergeCheckbox = document.getElementById('import-merge');
    
    if (!importTypeSelect || !importOverwriteCheckbox || !importMergeCheckbox) {
        console.error('Import form elements not found');
        showNotification('Error: Import form elements not found', 'error');
        return;
    }
    
    const importType = importTypeSelect.value;
    const importOverwrite = importOverwriteCheckbox.checked;
    const importMerge = importMergeCheckbox.checked;
    
    console.log(`Import type: ${importType}, overwrite: ${importOverwrite}, merge: ${importMerge}`);
    
    // Process the import
    processImport(window.importedData, importType, importOverwrite, importMerge);
    
    // Clear stored data
    window.importedData = null;
    
    // Hide preview section
    const importPreview = document.getElementById('import-preview');
    if (importPreview) {
        importPreview.style.display = 'none';
    }
}

// Process import data
function processImport(importedData, importType, importOverwrite, importMerge) {
    // Process people data
    if ((importType === 'all' || importType === 'people') && importedData.persons) {
        if (importOverwrite) {
            // Clear existing people (remove markers first)
            window.persons.forEach(person => {
                if (person.marker) {
                    person.marker.setMap(null);
                }
            });
            
            // Clear array
            window.persons = [];
        }
        
        // Process imported people
        importedData.persons.forEach(importedPerson => {
            if (importMerge) {
                // Check if person already exists
                const existingPersonIndex = window.persons.findIndex(p => p.id === importedPerson.id);
                
                if (existingPersonIndex !== -1) {
                    // Update existing person
                    const existingPerson = window.persons[existingPersonIndex];
                    const marker = existingPerson.marker;
                    
                    // Preserve marker reference and update all other properties
                    window.persons[existingPersonIndex] = { 
                        ...importedPerson,
                        marker
                    };
                    
                    // Update marker position if needed
                    if (marker && (importedPerson.lat !== existingPerson.lat || 
                                  importedPerson.lng !== existingPerson.lng)) {
                        const position = new google.maps.LatLng(importedPerson.lat, importedPerson.lng);
                        marker.setPosition(position);
                    }
                } else {
                    // Add as new person (marker will be created when map is ready)
                    window.persons.push(importedPerson);
                }
            } else {
                // Add as new person
                window.persons.push(importedPerson);
            }
        });
    }
    
    // Process meeting points data
    if ((importType === 'all' || importType === 'meetings') && importedData.meetingPoints) {
        if (importOverwrite) {
            // Clear existing meeting points (remove markers first)
            window.meetingPoints.forEach(meeting => {
                if (meeting.marker) {
                    meeting.marker.setMap(null);
                }
            });
            
            // Clear array
            window.meetingPoints = [];
        }
        
        // Process imported meeting points
        importedData.meetingPoints.forEach(importedMeeting => {
            if (importMerge) {
                // Check if meeting already exists
                const existingMeetingIndex = window.meetingPoints.findIndex(m => m.id === importedMeeting.id);
                
                if (existingMeetingIndex !== -1) {
                    // Update existing meeting
                    const existingMeeting = window.meetingPoints[existingMeetingIndex];
                    const marker = existingMeeting.marker;
                    
                    // Preserve marker reference and update all other properties
                    window.meetingPoints[existingMeetingIndex] = { 
                        ...importedMeeting,
                        marker
                    };
                    
                    // Update marker position if needed
                    if (marker && (importedMeeting.lat !== existingMeeting.lat || 
                                  importedMeeting.lng !== existingMeeting.lng)) {
                        const position = new google.maps.LatLng(importedMeeting.lat, importedMeeting.lng);
                        marker.setPosition(position);
                    }
                } else {
                    // Add as new meeting (marker will be created when map is ready)
                    window.meetingPoints.push(importedMeeting);
                }
            } else {
                // Add as new meeting
                window.meetingPoints.push(importedMeeting);
            }
        });
    }
    
    // Process groups data
    if ((importType === 'all' || importType === 'groups') && importedData.groups) {
        if (importOverwrite) {
            // Clear existing groups
            window.groups = [];
        }
        
        // Process imported groups
        importedData.groups.forEach(importedGroup => {
            if (importMerge) {
                // Check if group already exists
                const existingGroupIndex = window.groups.findIndex(g => g.id === importedGroup.id);
                
                if (existingGroupIndex !== -1) {
                    // Update existing group
                    window.groups[existingGroupIndex] = importedGroup;
                } else {
                    // Add as new group
                    window.groups.push(importedGroup);
                }
            } else {
                // Add as new group
                window.groups.push(importedGroup);
            }
        });
    }
    
    // Process families data
    if ((importType === 'all' || importType === 'families') && importedData.families) {
        if (importOverwrite) {
            // Clear existing families
            window.families = [];
        }
        
        // Process imported families
        importedData.families.forEach(importedFamily => {
            if (importMerge) {
                // Check if family already exists
                const existingFamilyIndex = window.families.findIndex(f => f.id === importedFamily.id);
                
                if (existingFamilyIndex !== -1) {
                    // Update existing family
                    window.families[existingFamilyIndex] = importedFamily;
                } else {
                    // Add as new family
                    window.families.push(importedFamily);
                }
            } else {
                // Add as new family
                window.families.push(importedFamily);
            }
        });
    }
    
    // Save data
    saveData();
    
    // Create markers for imported data
    createMarkersForImportedData();
    
    // Update UI
    if (typeof window.populateUI === 'function') {
        window.populateUI();
    }
    
    // Show success message
    showNotification('Data imported successfully');
}

// Create map markers for imported data
function createMarkersForImportedData() {
    // Skip if map isn't initialized yet
    if (!window.map) {
        console.log('Map not ready, skipping marker creation');
        return;
    }
    
    console.log('Creating markers for imported data');
    
    // Create markers for people
    window.persons.forEach(person => {
        if (!person.marker && person.lat && person.lng) {
            const position = new google.maps.LatLng(person.lat, person.lng);
            
            if (typeof createPersonMarker === 'function') {
                person.marker = createPersonMarker(position, person);
            } else {
                // Fallback if createPersonMarker isn't available
                person.marker = new google.maps.Marker({
                    position: position,
                    map: window.map,
                    title: person.name
                });
            }
        }
    });
    
    // Create markers for meeting points
    window.meetingPoints.forEach(meeting => {
        if (!meeting.marker && meeting.lat && meeting.lng) {
            const position = new google.maps.LatLng(meeting.lat, meeting.lng);
            
            if (typeof createMeetingMarker === 'function') {
                meeting.marker = createMeetingMarker(position, meeting);
            } else {
                // Fallback if createMeetingMarker isn't available
                meeting.marker = new google.maps.Marker({
                    position: position,
                    map: window.map,
                    title: meeting.name
                });
            }
        }
    });
    
    // Fit map to show all markers
    if (typeof fitMapToMarkers === 'function') {
        fitMapToMarkers();
    }
}

// Show notification
function showNotification(message, type = 'success') {
    console.log(`Notification (${type}): ${message}`);
    
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
        
        // Add styles if they don't exist
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 4px;
                    color: white;
                    font-weight: 500;
                    z-index: 9999;
                    transform: translateY(100px);
                    transition: transform 0.3s ease;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    max-width: 300px;
                }
                
                .notification.success {
                    background-color: #2ecc71;
                }
                
                .notification.error {
                    background-color: #e74c3c;
                }
                
                .notification.warning {
                    background-color: #f39c12;
                }
                
                .notification.info {
                    background-color: #3498db;
                }
                
                .notification.show {
                    transform: translateY(0);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Set message and type
    notification.textContent = message;
    notification.className = `notification ${type}`;
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after a delay
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Backup and restore data
function backupData() {
    // Create backup object
    const backup = {
        persons: window.persons.map(person => {
            const { marker, ...personData } = person;
            return personData;
        }),
        meetingPoints: window.meetingPoints.map(meeting => {
            const { marker, ...meetingData } = meeting;
            return meetingData;
        }),
        groups: window.groups,
        families: window.families,
        date: new Date().toISOString()
    };
    
    // Save backup to localStorage
    localStorage.setItem('dataBackup', JSON.stringify(backup));
    
    // Export as file
    exportAsJson(backup, `territory-backup-${new Date().toISOString().split('T')[0]}`);
    
    // Show confirmation
    showNotification('Backup created successfully');
}

// Restore from backup
function restoreFromBackup() {
    // Check if backup exists
    const backupData = localStorage.getItem('dataBackup');
    if (!backupData) {
        showNotification('No backup found', 'error');
        return;
    }
    
    try {
        // Parse backup
        const backup = JSON.parse(backupData);
        
        // Confirm restore
        if (confirm(`Are you sure you want to restore data from backup (${new Date(backup.date).toLocaleString()})?`)) {
            // Clear current markers
            window.persons.forEach(person => {
                if (person.marker) {
                    person.marker.setMap(null);
                }
            });
            
            window.meetingPoints.forEach(meeting => {
                if (meeting.marker) {
                    meeting.marker.setMap(null);
                }
            });
            
            // Restore data
            window.persons = backup.persons || [];
            window.meetingPoints = backup.meetingPoints || [];
            window.groups = backup.groups || [];
            window.families = backup.families || [];
            
            // Create markers for restored data
            createMarkersForImportedData();
            
            // Save data
            saveData();
            
            // Update UI
            if (typeof window.populateUI === 'function') {
                window.populateUI();
            }
            
            // Show confirmation
            showNotification('Data restored successfully from backup');
        }
    } catch (error) {
        console.error('Error restoring backup:', error);
        showNotification('Error restoring backup: ' + error.message, 'error');
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        // Create backup first
        backupData();
        
        // Clear data
        window.persons.forEach(person => {
            if (person.marker) {
                person.marker.setMap(null);
            }
        });
        window.persons = [];
        
        window.meetingPoints.forEach(meeting => {
            if (meeting.marker) {
                meeting.marker.setMap(null);
            }
        });
        window.meetingPoints = [];
        
        window.groups = [];
        window.families = [];
        
        // Save empty data
        saveData();
        
        // Update UI
        if (typeof window.populateUI === 'function') {
            window.populateUI();
        }
        
        // Show confirmation
        showNotification('All data has been cleared. A backup was created.');
    }
}    