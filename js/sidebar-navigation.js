// sidebar-navigation.js

// DOM Elements for sidebar
let sidebar;
let sidebarToggle;
let pageContent;
let currentActivePage = 'map-section'; // Default active page

// Initialize the sidebar navigation
function initSidebar() {
    // Create sidebar DOM elements if they don't exist yet
    if (!document.getElementById('sidebar-menu')) {
        createSidebarStructure();
    }
    
    // Get sidebar elements
    sidebar = document.getElementById('sidebar-menu');
    sidebarToggle = document.getElementById('sidebar-toggle');
    pageContent = document.getElementById('page-content');
    
    // Set up event listeners
    setupSidebarEventListeners();
    
    // Set initial state
    setActivePage(currentActivePage);
}

// Create the sidebar structure in the DOM
function createSidebarStructure() {
    // Create sidebar container
    const sidebarContainer = document.createElement('div');
    sidebarContainer.id = 'sidebar-container';
    
    // Create sidebar toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'sidebar-toggle';
    toggleButton.innerHTML = '<span>☰</span>';
    toggleButton.className = 'sidebar-toggle-button';
    
    // Create sidebar menu
    const sidebarMenu = document.createElement('div');
    sidebarMenu.id = 'sidebar-menu';
    sidebarMenu.className = 'sidebar';
    
    // Create sidebar content
    sidebarMenu.innerHTML = `
        <div class="sidebar-header">
            <h3>Territory Manager</h3>
        </div>
        <div class="sidebar-content">
            <ul class="sidebar-nav">
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>Map</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="map-section" class="sidebar-item active">
                            <span class="sidebar-icon">🗺️</span>
                            <span>View Map</span>
                        </li>
                        <li data-page="search-section" class="sidebar-item">
                            <span class="sidebar-icon">🔍</span>
                            <span>Search Location</span>
                        </li>
                        <li data-page="map-settings-section" class="sidebar-item">
                            <span class="sidebar-icon">⚙️</span>
                            <span>Map Settings</span>
                        </li>
                    </ul>
                </li>
                
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>People</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="people-list-section" class="sidebar-item">
                            <span class="sidebar-icon">👥</span>
                            <span>View All People</span>
                        </li>
                        <li data-page="person-add-section" class="sidebar-item">
                            <span class="sidebar-icon">➕</span>
                            <span>Add New Person</span>
                        </li>
                        <li data-page="people-filter-section" class="sidebar-item">
                            <span class="sidebar-icon">🔎</span>
                            <span>Search/Filter</span>
                        </li>
                    </ul>
                </li>
                
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>Meeting Points</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="meeting-list-section" class="sidebar-item">
                            <span class="sidebar-icon">📍</span>
                            <span>View All Meeting Points</span>
                        </li>
                        <li data-page="meeting-add-section" class="sidebar-item">
                            <span class="sidebar-icon">➕</span>
                            <span>Add New Meeting Point</span>
                        </li>
                    </ul>
                </li>
                
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>Groups</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="groups-list-section" class="sidebar-item">
                            <span class="sidebar-icon">👪</span>
                            <span>View All Groups</span>
                        </li>
                        <li data-page="group-create-section" class="sidebar-item">
                            <span class="sidebar-icon">➕</span>
                            <span>Create New Group</span>
                        </li>
                        <li data-page="group-auto-section" class="sidebar-item">
                            <span class="sidebar-icon">⚡</span>
                            <span>Auto Create Groups</span>
                        </li>
                    </ul>
                </li>
                
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>Families</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="families-list-section" class="sidebar-item">
                            <span class="sidebar-icon">👨‍👩‍👧‍👦</span>
                            <span>View All Families</span>
                        </li>
                        <li data-page="family-create-section" class="sidebar-item">
                            <span class="sidebar-icon">➕</span>
                            <span>Create New Family</span>
                        </li>
                    </ul>
                </li>
                
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>Data Management</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="data-import-section" class="sidebar-item">
                            <span class="sidebar-icon">📥</span>
                            <span>Import Data</span>
                        </li>
                        <li data-page="data-export-section" class="sidebar-item">
                            <span class="sidebar-icon">📤</span>
                            <span>Export Data</span>
                        </li>
                    </ul>
                </li>
                
                <li class="sidebar-category">
                    <div class="sidebar-category-header">
                        <span>Settings</span>
                        <span class="toggle-icon">▼</span>
                    </div>
                    <ul class="sidebar-submenu">
                        <li data-page="app-settings-section" class="sidebar-item">
                            <span class="sidebar-icon">⚙️</span>
                            <span>Application Settings</span>
                        </li>
                        <li data-page="display-settings-section" class="sidebar-item">
                            <span class="sidebar-icon">🖥️</span>
                            <span>Display Preferences</span>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    `;
    
    // Add sidebar elements to the DOM
    sidebarContainer.appendChild(toggleButton);
    sidebarContainer.appendChild(sidebarMenu);
    
    // Add sidebar container to the body
    document.body.insertBefore(sidebarContainer, document.body.firstChild);
    
    // Create page content container if it doesn't exist
    if (!document.getElementById('page-content')) {
        const contentContainer = document.createElement('div');
        contentContainer.id = 'page-content';
        
        // Move all existing body content into this container
        while (document.body.children.length > 1) {
            contentContainer.appendChild(document.body.children[1]);
        }
        
        document.body.appendChild(contentContainer);
    }
    
    // Add sidebar styles
    addSidebarStyles();
}

// Set up event listeners for sidebar interactions
function setupSidebarEventListeners() {
    // Toggle sidebar visibility when toggle button is clicked
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('sidebar-collapsed');
        document.getElementById('page-content').classList.toggle('content-expanded');
    });
    
    // Toggle submenu visibility when category headers are clicked
    const categoryHeaders = document.querySelectorAll('.sidebar-category-header');
    categoryHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const parent = header.parentElement;
            parent.classList.toggle('collapsed');
            
            // Update toggle icon
            const toggleIcon = header.querySelector('.toggle-icon');
            if (parent.classList.contains('collapsed')) {
                toggleIcon.textContent = '▶';
            } else {
                toggleIcon.textContent = '▼';
            }
        });
    });
    
    // Handle navigation item clicks
    const navItems = document.querySelectorAll('.sidebar-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPage = item.getAttribute('data-page');
            if (targetPage) {
                setActivePage(targetPage);
            }
        });
    });
}

// Set active page and update UI
function setActivePage(pageId) {
    // Update active state in sidebar
    const navItems = document.querySelectorAll('.sidebar-item');
    navItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Show/hide page sections
    showPageSection(pageId);
    
    // Update current active page
    currentActivePage = pageId;
    
    // Save to local storage (optional)
    localStorage.setItem('lastActivePage', pageId);
}

// Show specified page section and hide others
function showPageSection(pageId) {
    // First, make sure the page sections exist
    ensurePageSectionsExist();
    
    // Hide all page sections
    const pageSections = document.querySelectorAll('.page-section');
    pageSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the target page section
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.style.display = 'block';
    } else {
        console.error(`Page section with ID "${pageId}" not found.`);
    }
}

// Make sure all page sections exist
function ensurePageSectionsExist() {
    // Create a container for page sections if it doesn't exist
    let pageSectionsContainer = document.getElementById('page-sections-container');
    if (!pageSectionsContainer) {
        pageSectionsContainer = document.createElement('div');
        pageSectionsContainer.id = 'page-sections-container';
        pageContent.appendChild(pageSectionsContainer);
    }
    
    // Define all section IDs and titles
    const sectionDefinitions = [
        { id: 'map-section', title: 'Map View' },
        { id: 'search-section', title: 'Search Location' },
        { id: 'map-settings-section', title: 'Map Settings' },
        { id: 'people-list-section', title: 'People List' },
        { id: 'person-add-section', title: 'Add New Person' },
        { id: 'people-filter-section', title: 'Search/Filter People' },
        { id: 'meeting-list-section', title: 'Meeting Points List' },
        { id: 'meeting-add-section', title: 'Add New Meeting Point' },
        { id: 'groups-list-section', title: 'Groups List' },
        { id: 'group-create-section', title: 'Create New Group' },
        { id: 'group-auto-section', title: 'Auto Create Groups' },
        { id: 'families-list-section', title: 'Families List' },
        { id: 'family-create-section', title: 'Create New Family' },
        { id: 'data-import-section', title: 'Import Data' },
        { id: 'data-export-section', title: 'Export Data' },
        { id: 'app-settings-section', title: 'Application Settings' },
        { id: 'display-settings-section', title: 'Display Preferences' }
    ];
    
    // Create sections that don't exist yet
    sectionDefinitions.forEach(section => {
        if (!document.getElementById(section.id)) {
            createPageSection(section.id, section.title, pageSectionsContainer);
        }
    });
}

// Create a page section with the specified ID and title
function createPageSection(id, title, container) {
    const section = document.createElement('div');
    section.id = id;
    section.className = 'page-section';
    section.style.display = 'none'; // Hidden by default
    
    section.innerHTML = `
        <div class="section-header">
            <h2>${title}</h2>
        </div>
        <div class="section-content" id="${id}-content">
            <!-- Content will be populated dynamically -->
        </div>
    `;
    
    container.appendChild(section);
}

// Add styles for the sidebar
function addSidebarStyles() {
    // Check if styles already exist
    if (document.getElementById('sidebar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sidebar-styles';
    style.textContent = `
        /* Sidebar styles */
        #sidebar-container {
            position: relative;
            z-index: 1000;
        }
        
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            width: 250px;
            height: 100%;
            background-color: #2c3e50;
            color: #ecf0f1;
            overflow-y: auto;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .sidebar-collapsed {
            left: -250px;
        }
        
        .sidebar-header {
            padding: 20px 15px;
            background-color: #1a2530;
            text-align: center;
        }
        
        .sidebar-header h3 {
            margin: 0;
            font-size: 1.5em;
        }
        
        .sidebar-content {
            padding: 10px 0;
        }
        
        .sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .sidebar-category {
            margin-bottom: 5px;
        }
        
        .sidebar-category-header {
            display: flex;
            justify-content: space-between;
            padding: 10px 15px;
            background-color: #34495e;
            cursor: pointer;
            font-weight: bold;
        }
        
        .sidebar-category-header:hover {
            background-color: #435c77;
        }
        
        .toggle-icon {
            transition: transform 0.3s ease;
        }
        
        .sidebar-category.collapsed .toggle-icon {
            transform: rotate(-90deg);
        }
        
        .sidebar-submenu {
            list-style: none;
            padding: 0;
            margin: 0;
            max-height: 500px;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .sidebar-category.collapsed .sidebar-submenu {
            max-height: 0;
        }
        
        .sidebar-item {
            display: flex;
            align-items: center;
            padding: 8px 15px 8px 25px;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .sidebar-item:hover {
            background-color: #3e5771;
        }
        
        .sidebar-item.active {
            background-color: #2980b9;
        }
        
        .sidebar-icon {
            margin-right: 10px;
            font-size: 1.1em;
        }
        
        .sidebar-toggle-button {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 1001;
            background-color: #2c3e50;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .sidebar-toggle-button:hover {
            background-color: #3e5771;
        }
        
        /* Page content styles */
        #page-content {
            margin-left: 250px;
            padding: 20px;
            transition: margin 0.3s ease;
        }
        
        #page-content.content-expanded {
            margin-left: 0;
        }
        
        .page-section {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }
        
        .section-header {
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .section-header h2 {
            margin: 0;
            color: #333;
            font-size: 1.5em;
        }
        
        .section-content {
            padding: 20px;
        }
        
        /* Responsive styles */
        @media screen and (max-width: 768px) {
            .sidebar {
                left: -250px;
            }
            
            .sidebar.sidebar-collapsed {
                left: 0;
            }
            
            #page-content {
                margin-left: 0;
                padding: 15px;
            }
            
            .sidebar-toggle-button {
                left: 10px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Organize existing content into the appropriate page sections
function organizeExistingContent() {
    // Map content
    const mapSection = document.getElementById('map-section-content');
    if (mapSection) {
        // Move map elements to the map section
        const mapElement = document.getElementById('map');
        if (mapElement) {
            mapSection.appendChild(mapElement);
        }
    }
    
    // People list content
    const peopleListSection = document.getElementById('people-list-section-content');
    if (peopleListSection) {
        // Move people list elements to the people list section
        const personList = document.getElementById('person-list');
        if (personList) {
            peopleListSection.appendChild(personList);
        }
    }
    
    // Continue with other sections...
    // This function will need to be expanded based on your exact DOM structure
}

// Initialize the sidebar when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    
    // Restore last active page from local storage (optional)
    const lastPage = localStorage.getItem('lastActivePage');
    if (lastPage) {
        setActivePage(lastPage);
    } else {
        setActivePage('map-section'); // Default to map view
    }
    
    // Organize existing content (this should be adapted to your needs)
    organizeExistingContent();
});