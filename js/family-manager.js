// family-manager.js - Functions for managing family relationships

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing family manager');
  initFamilySystem();
});

// Initialize family system
function initFamilySystem() {
  // Make sure the families array exists
  if (!window.families) {
      window.families = [];
  }
  
  // Extend person model to include family properties
  extendPersonModel();
  
  // Add family management tab to sidebar
  addFamilyManagementTab();
}

// Extend person model with family properties
function extendPersonModel() {
  // Add family-related properties to existing persons
  if (!window.persons) {
      console.error('Persons array not defined');
      return;
  }
  
  window.persons.forEach(person => {
      if (!person.hasOwnProperty('familyId')) {
          person.familyId = null;        // The family this person belongs to
          person.familyRole = null;      // 'head', 'spouse', or 'child'
          person.relationshipIds = [];   // IDs of related persons (spouse ID or parent IDs)
      }
      
      // Ensure the relationshipIds is initialized as an array
      if (!person.relationshipIds) {
          person.relationshipIds = [];
      }
  });
}

// Add family management tab to sidebar
function addFamilyManagementTab() {
  // Make sure the families-list-section exists in the DOM
  const familiesSection = document.getElementById('families-list-section');
  if (!familiesSection) {
      console.error('Families list section not found in DOM');
      return;
  }
  
  // Setup event listeners for family management
  setupFamilyEventListeners();
  
  console.log('Family management tab initialized');
}

// Set up family-related event listeners
function setupFamilyEventListeners() {
  // Create family button
  const createFamilyBtn = document.getElementById('create-family-btn');
  if (createFamilyBtn) {
      createFamilyBtn.addEventListener('click', function() {
          setActivePage('family-create-section');
      });
  }
  
  // Family form
  const createFamilyForm = document.getElementById('create-family-form');
  if (createFamilyForm) {
      createFamilyForm.addEventListener('submit', function(e) {
          e.preventDefault();
          createFamily();
      });
  }
  
  // Cancel button
  const cancelCreateFamilyBtn = document.getElementById('cancel-create-family');
  if (cancelCreateFamilyBtn) {
      cancelCreateFamilyBtn.addEventListener('click', function() {
          setActivePage('families-list-section');
      });
  }
  
  // Add child button
  const addChildBtn = document.getElementById('add-child-btn');
  if (addChildBtn) {
      addChildBtn.addEventListener('click', addChildToForm);
  }
}

// Create a new family
function createFamily() {
  // Get form values
  const familyNameInput = document.getElementById('family-name');
  const familyHeadSelect = document.getElementById('family-head');
  const familySpouseSelect = document.getElementById('family-spouse');
  
  if (!familyNameInput || !familyHeadSelect) {
      console.error('Family form elements not found');
      return;
  }
  
  const familyName = familyNameInput.value;
  const headId = familyHeadSelect.value;
  const spouseId = familySpouseSelect ? familySpouseSelect.value : null;
  
  if (!familyName) {
      alert('Please enter a family name');
      return;
  }
  
  if (!headId) {
      alert('Please select a family head');
      return;
  }
  
  // Create the family object
  const familyId = 'family_' + Date.now();
  const family = {
      id: familyId,
      name: familyName,
      headId: headId,
      spouseId: spouseId || null,
      childrenIds: [],
      color: getRandomColor()
  };
  
  // Add the family to the global array
  window.families.push(family);
  
  // Update the head person
  const head = window.persons.find(p => p.id === headId);
  if (head) {
      head.familyId = familyId;
      head.familyRole = 'head';
      head.familyHead = true;
  }
  
  // Update the spouse if selected
  if (spouseId) {
      const spouse = window.persons.find(p => p.id === spouseId);
      if (spouse) {
          spouse.familyId = familyId;
          spouse.familyRole = 'spouse';
          spouse.spouse = true;
          
          // Connect head and spouse
          spouse.relationshipIds = [headId];
          if (head) {
              head.relationshipIds = [spouseId];
          }
      }
  }
  
  // Get all children from form
  const childrenContainer = document.getElementById('children-container');
  if (childrenContainer) {
      const childSelects = childrenContainer.querySelectorAll('select[id^="child-"]');
      childSelects.forEach(select => {
          const childId = select.value;
          if (childId) {
              // Add child to family
              family.childrenIds.push(childId);
              
              // Update child person
              const child = window.persons.find(p => p.id === childId);
              if (child) {
                  child.familyId = familyId;
                  child.familyRole = 'child';
                  child.child = true;
                  
                  // Connect to parents
                  child.relationshipIds = [headId];
                  if (spouseId) {
                      child.relationshipIds.push(spouseId);
                  }
              }
          }
      });
  }
  
  // Save data
  if (typeof saveData === 'function') {
      saveData();
  }
  
  // Update UI
  populateFamiliesList();
  
  // Show success message
  if (typeof showNotification === 'function') {
      showNotification(`${familyName} family created successfully`);
  } else {
      alert(`${familyName} family created successfully`);
  }
  
  // Reset form
  document.getElementById('create-family-form').reset();
  
  // Navigate back to families list
  setActivePage('families-list-section');
}

// Add a child field to the family creation form
function addChildToForm() {
  const childrenContainer = document.getElementById('children-container');
  if (!childrenContainer) {
      console.error('Children container not found');
      return;
  }
  
  // Remove empty message if present
  const emptyMessage = childrenContainer.querySelector('.empty-children-message');
  if (emptyMessage) {
      emptyMessage.remove();
  }
  
  // Create unique ID for this child
  const childId = 'child-' + Date.now();
  
  // Create child item
  const childItem = document.createElement('div');
  childItem.className = 'child-item';
  childItem.innerHTML = `
      <select id="${childId}" name="${childId}">
          <option value="">-- Select Child --</option>
          ${getAvailableChildrenOptions()}
      </select>
      <button type="button" class="remove-child-btn" data-child-id="${childId}">Remove</button>
  `;
  
  // Add remove button handler
  childItem.querySelector('.remove-child-btn').addEventListener('click', function() {
      childItem.remove();
      
      // Add empty message if no children left
      if (childrenContainer.children.length === 0) {
          childrenContainer.innerHTML = '<div class="empty-children-message">No children added</div>';
      }
  });
  
  // Add to container
  childrenContainer.appendChild(childItem);
}

// Get options for available children
function getAvailableChildrenOptions() {
  // Get the selected head and spouse
  const headSelect = document.getElementById('family-head');
  const spouseSelect = document.getElementById('family-spouse');
  
  if (!headSelect) return '';
  
  const headId = headSelect.value;
  const spouseId = spouseSelect ? spouseSelect.value : null;
  
  // Get people who aren't the head or spouse and don't have a family
  const availableChildren = window.persons.filter(person => 
      person.id !== headId && 
      person.id !== spouseId && 
      !person.familyId
  );
  
  return availableChildren.map(person => 
      `<option value="${person.id}">${person.name}</option>`
  ).join('');
}

// Populate families list
function populateFamiliesList() {
  console.log('Populating families list');
  const familiesTableBody = document.getElementById('families-table-body');
  if (!familiesTableBody) {
      console.error('Families table body not found');
      return;
  }
  
  // Clear the table
  familiesTableBody.innerHTML = '';
  
  // Check if we have any families
  if (!window.families || window.families.length === 0) {
      familiesTableBody.innerHTML = `
          <tr>
              <td colspan="4" class="empty-table-message">No families created yet</td>
          </tr>
      `;
      return;
  }
  
  // Create a row for each family
  window.families.forEach(family => {
      const row = document.createElement('tr');
      
      // Get family members
      const members = getFamilyMembers(family.id);
      let membersText = 'No members';
      
      if (members) {
          const membersList = [];
          
          if (members.head) {
              membersList.push(`${members.head.name} (Head)`);
          }
          
          if (members.spouse) {
              membersList.push(`${members.spouse.name} (Spouse)`);
          }
          
          if (members.children && members.children.length > 0) {
              membersList.push(`${members.children.length} ${members.children.length === 1 ? 'child' : 'children'}`);
          }
          
          membersText = membersList.join(', ');
      }
      
      // Get family's group if all members are in the same group
      let groupInfo = 'Various';
      
      if (members) {
          const allMembers = [
              members.head,
              members.spouse,
              ...(members.children || [])
          ].filter(Boolean); // Remove null values
          
          if (allMembers.length > 0 && allMembers.every(m => m.group === allMembers[0].group)) {
              const groupId = allMembers[0].group;
              if (groupId) {
                  const group = window.groups.find(g => g.id === groupId);
                  if (group) {
                      groupInfo = group.name;
                  }
              } else {
                  groupInfo = 'None';
              }
          }
      }
      
      row.innerHTML = `
          <td style="background-color: ${family.color}33;">
              <span class="color-indicator" style="background-color: ${family.color};"></span>
              ${family.name}
          </td>
          <td>${membersText}</td>
          <td>${groupInfo}</td>
          <td>
              <button class="view-family-btn small-button" data-id="${family.id}">View</button>
              <button class="edit-family-btn small-button" data-id="${family.id}">Edit</button>
              <button class="delete-family-btn small-button danger" data-id="${family.id}">Delete</button>
          </td>
      `;
      
      // Add event listeners to buttons
      row.querySelector('.view-family-btn').addEventListener('click', function() {
          viewFamily(family.id);
      });
      
      row.querySelector('.edit-family-btn').addEventListener('click', function() {
          editFamily(family.id);
      });
      
      row.querySelector('.delete-family-btn').addEventListener('click', function() {
          if (confirm(`Are you sure you want to delete the ${family.name} family?`)) {
              deleteFamily(family.id);
          }
      });
      
      familiesTableBody.appendChild(row);
  });
}

// Get family members based on ID
function getFamilyMembers(familyId) {
  const family = window.families.find(f => f.id === familyId);
  if (!family) return null;
  
  return {
      head: window.persons.find(p => p.id === family.headId),
      spouse: family.spouseId ? window.persons.find(p => p.id === family.spouseId) : null,
      children: family.childrenIds.map(id => window.persons.find(p => p.id === id)).filter(p => p !== undefined)
  };
}

// View family on map
function viewFamily(familyId) {
  const family = window.families.find(f => f.id === familyId);
  if (!family) return;
  
  const members = getFamilyMembers(familyId);
  if (!members || (!members.head && !members.spouse && members.children.length === 0)) {
      alert('No family members to display');
      return;
  }
  
  // Create bounds that include all family members
  const bounds = new google.maps.LatLngBounds();
  
  // Add head to bounds
  if (members.head && members.head.marker) {
      bounds.extend(members.head.marker.getPosition());
      // Highlight temporarily
      if (typeof highlightMarker === 'function') {
          highlightMarker(members.head.marker);
      }
  }
  
  // Add spouse to bounds
  if (members.spouse && members.spouse.marker) {
      bounds.extend(members.spouse.marker.getPosition());
      // Highlight temporarily
      if (typeof highlightMarker === 'function') {
          highlightMarker(members.spouse.marker);
      }
  }
  
  // Add children to bounds
  if (members.children) {
      members.children.forEach(child => {
          if (child.marker) {
              bounds.extend(child.marker.getPosition());
              // Highlight temporarily
              if (typeof highlightMarker === 'function') {
                  highlightMarker(child.marker);
              }
          }
      });
  }
  
  // Fit map to these bounds
  if (window.map) {
      window.map.fitBounds(bounds);
  }
  
  // Draw family connections on the map temporarily
  drawFamilyConnections(familyId);
}

// Draw temporary connections between family members
let familyConnectionLines = [];

function drawFamilyConnections(familyId) {
  // Clear any existing lines
  clearFamilyConnections();
  
  const family = window.families.find(f => f.id === familyId);
  if (!family) return;
  
  const members = getFamilyMembers(familyId);
  if (!members || !members.head || !members.head.marker) return;
  
  const headPosition = members.head.marker.getPosition();
  
  // Draw line to spouse if exists
  if (members.spouse && members.spouse.marker) {
      const spousePosition = members.spouse.marker.getPosition();
      const spouseLine = new google.maps.Polyline({
          path: [headPosition, spousePosition],
          geodesic: true,
          strokeColor: family.color,
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: window.map
      });
      familyConnectionLines.push(spouseLine);
  }
  
  // Draw lines to children
  if (members.children) {
      members.children.forEach(child => {
          if (!child.marker) return;
          
          const childPosition = child.marker.getPosition();
          const childLine = new google.maps.Polyline({
              path: [headPosition, childPosition],
              geodesic: true,
              strokeColor: family.color,
              strokeOpacity: 0.5,
              strokeWeight: 2,
              map: window.map
          });
          familyConnectionLines.push(childLine);
          
          // If there's a spouse, draw line from spouse to child too
          if (members.spouse && members.spouse.marker) {
              const spousePosition = members.spouse.marker.getPosition();
              const spouseChildLine = new google.maps.Polyline({
                  path: [spousePosition, childPosition],
                  geodesic: true,
                  strokeColor: family.color,
                  strokeOpacity: 0.5,
                  strokeWeight: 2,
                  map: window.map,
                  icons: [{
                      icon: {
                          path: 'M 0,-1 0,1',
                          strokeOpacity: 1,
                          scale: 3
                      },
                      offset: '0',
                      repeat: '10px'
                  }]
              });
              familyConnectionLines.push(spouseChildLine);
          }
      });
  }
  
  // Remove the lines after a delay
  setTimeout(clearFamilyConnections, 10000);
}

// Clear family connection lines
function clearFamilyConnections() {
  familyConnectionLines.forEach(line => {
      if (line) {
          line.setMap(null);
      }
  });
  familyConnectionLines = [];
}

// Edit family
function editFamily(familyId) {
  // TODO: Implement edit family functionality
  console.log('Editing family:', familyId);
}

// Delete family
function deleteFamily(familyId) {
  const family = window.families.find(f => f.id === familyId);
  if (!family) return;
  
  // Get family members
  const members = getFamilyMembers(familyId);
  
  // Reset the family head
  if (members.head) {
      members.head.familyId = null;
      members.head.familyRole = null;
      members.head.familyHead = false;
      members.head.relationshipIds = [];
  }
  
  // Reset the spouse
  if (members.spouse) {
      members.spouse.familyId = null;
      members.spouse.familyRole = null;
      members.spouse.spouse = false;
      members.spouse.relationshipIds = [];
  }
  
  // Reset all children
  if (members.children) {
      members.children.forEach(child => {
          child.familyId = null;
          child.familyRole = null;
          child.child = false;
          child.relationshipIds = [];
      });
  }
  
  // Remove the family from the array
  const index = window.families.findIndex(f => f.id === familyId);
  if (index !== -1) {
      window.families.splice(index, 1);
  }
  
  // Save data
  if (typeof saveData === 'function') {
      saveData();
  }
  
  // Update UI
  populateFamiliesList();
  
  // Show success message
  if (typeof showNotification === 'function') {
      showNotification(`Family deleted successfully`);
  } else {
      alert(`Family deleted successfully`);
  }
}

// Populate dropdowns for family head and spouse
function populateFamilyDropdowns() {
  const headSelect = document.getElementById('family-head');
  const spouseSelect = document.getElementById('family-spouse');
  
  if (!headSelect || !spouseSelect) {
      console.error('Family dropdowns not found');
      return;
  }
  
  // Clear existing options except the first one
  while (headSelect.options.length > 1) headSelect.remove(1);
  while (spouseSelect.options.length > 1) spouseSelect.remove(1);
  
  // Get people who don't have a family yet
  const availablePeople = window.persons.filter(person => !person.familyId);
  
  // Add options for each person
  availablePeople.forEach(person => {
      const headOption = document.createElement('option');
      headOption.value = person.id;
      headOption.textContent = person.name;
      headSelect.appendChild(headOption);
      
      const spouseOption = document.createElement('option');
      spouseOption.value = person.id;
      spouseOption.textContent = person.name;
      spouseSelect.appendChild(spouseOption);
  });
  
  // Update spouse select based on head selection
  headSelect.addEventListener('change', function() {
      const headId = this.value;
      
      // Enable/disable spouse select
      spouseSelect.disabled = !headId;
      
      // Reset spouse selection
      spouseSelect.value = '';
      
      // Remove all options except the first one
      while (spouseSelect.options.length > 1) spouseSelect.remove(1);
      
      if (headId) {
          // Add options for people who aren't the head and don't have a family
          const availableSpouses = window.persons.filter(person => 
              person.id !== headId && !person.familyId
          );
          
          availableSpouses.forEach(person => {
              const option = document.createElement('option');
              option.value = person.id;
              option.textContent = person.name;
              spouseSelect.appendChild(option);
          });
      }
  });
}

// Helper function to generate a random color
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}