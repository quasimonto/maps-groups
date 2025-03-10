// Global variables and configuration
let map;
let autocomplete;
let mapClickMode = null; // 'person', 'meeting', or null

// Active filters for people list
let activeFilters = {
    elder: false,
    servant: false,
    pioneer: false,
    familyHead: false
};

// Data storage
let persons = [];
let meetingPoints = [];
let groups = [];

// Selected item references
let selectedPerson = null;
let selectedMeeting = null;

// Constants
const MAX_AUTO_GROUP_DISTANCE = 0.01; // Approximately 1km