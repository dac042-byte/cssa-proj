// ========================================
// CONFIGURATION
// ========================================

// REPLACE THIS WITH YOUR DEPLOYED VERCEL FUNCTION URL
const BACKEND_URL = 'https://your-project.vercel.app/api/reflect';

// ========================================
// STATE MANAGEMENT
// ========================================

const STATE = {
  IDLE: 'idle',
  STEP_A: 'stepA',
  STEP_B: 'stepB',
  STEP_C: 'stepC',
  LOADING: 'loading',
  RESULTS: 'results'
};

let currentState = STATE.IDLE;
let currentPoints = 0;
let userSelections = {
  thought: '',
  classification: null,
  distortions: [],
  evidence: null
};

// ========================================
// DOM ELEMENTS
// ========================================

const elements = {
  // Points
  pointsValue: document.getElementById('pointsValue'),
  pointsToast: document.getElementById('pointsToast'),

  // Settings
  saveThoughtToggle: document.getElementById('saveThoughtToggle'),

  // Input
  thoughtInput: document.getElementById('thoughtInput'),
  interrogateBtn: document.getElementById('interrogateBtn'),
  clearBtn: document.getElementById('clearBtn'),

  // Sections
  inputSection: document.getElementById('inputSection'),
  stepASection: document.getElementById('stepASection'),
  stepBSection: document.getElementById('stepBSection'),
  stepCSection: document.getElementById('stepCSection'),
  loadingSection: document.getElementById('loadingSection'),
  resultsSection: document.getElementById('resultsSection'),

  // Status
  statusLine: document.getElementById('statusLine'),

  // Step B
  stepBContinue: document.getElementById('stepBContinue'),

  // Results
  resultType: document.getElementById('resultType'),
  resultDistortions: document.getElementById('resultDistortions'),
  resultAssumptions: document.getElementById('resultAssumptions'),
  resultReframe: document.getElementById('resultReframe'),
  startOverBtn: document.getElementById('startOverBtn')
};

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadStoredData();
  setupEventListeners();
  updatePointsDisplay();
});

// ========================================
// STORAGE FUNCTIONS
// ========================================

async function loadStoredData() {
  try {
    const data = await chrome.storage.local.get(['points', 'saveThought', 'lastThought']);

    currentPoints = data.points || 0;

    if (data.saveThought) {
      elements.saveThoughtToggle.checked = true;
      if (data.lastThought) {
        elements.thoughtInput.value = data.lastThought;
      }
    }
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

async function savePoints(points) {
  try {
    await chrome.storage.local.set({ points });
  } catch (error) {
    console.error('Error saving points:', error);
  }
}

async function saveThought(thought) {
  try {
    const saveEnabled = elements.saveThoughtToggle.checked;
    await chrome.storage.local.set({
      saveThought: saveEnabled,
      lastThought: saveEnabled ? thought : ''
    });
  } catch (error) {
    console.error('Error saving thought:', error);
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
  // Main buttons
  elements.interrogateBtn.addEventListener('click', startInterrogation);
  elements.clearBtn.addEventListener('click', clearInput);
  elements.startOverBtn.addEventListener('click', startOver);

  // Settings toggle
  elements.saveThoughtToggle.addEventListener('change', async (e) => {
    await chrome.storage.local.set({ saveThought: e.target.checked });
    if (!e.target.checked) {
      await chrome.storage.local.set({ lastThought: '' });
    }
  });

  // Step A: Classification buttons
  const stepAButtons = elements.stepASection.querySelectorAll('.choice-btn');
  stepAButtons.forEach(btn => {
    btn.addEventListener('click', () => handleStepASelection(btn));
  });

  // Step B: Distortion chips
  const distortionChips = elements.stepBSection.querySelectorAll('.chip');
  distortionChips.forEach(chip => {
    chip.addEventListener('click', () => handleDistortionSelection(chip));
  });

  // Step B: Continue button
  elements.stepBContinue.addEventListener('click', proceedToStepC);

  // Step C: Evidence buttons
  const stepCButtons = elements.stepCSection.querySelectorAll('.choice-btn');
  stepCButtons.forEach(btn => {
    btn.addEventListener('click', () => handleStepCSelection(btn));
  });
}

// ========================================
// STATE TRANSITIONS
// ========================================

function setState(newState) {
  currentState = newState;

  // Hide all sections
  elements.inputSection.classList.add('hidden');
  elements.stepASection.classList.add('hidden');
  elements.stepBSection.classList.add('hidden');
  elements.stepCSection.classList.add('hidden');
  elements.loadingSection.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');

  // Show appropriate section
  switch (newState) {
    case STATE.IDLE:
      elements.inputSection.classList.remove('hidden');
      break;
    case STATE.STEP_A:
      elements.stepASection.classList.remove('hidden');
      break;
    case STATE.STEP_B:
      elements.stepBSection.classList.remove('hidden');
      break;
    case STATE.STEP_C:
      elements.stepCSection.classList.remove('hidden');
      break;
    case STATE.LOADING:
      elements.loadingSection.classList.remove('hidden');
      break;
    case STATE.RESULTS:
      elements.resultsSection.classList.remove('hidden');
      break;
  }
}

// ========================================
// MAIN FLOW HANDLERS
// ========================================

function startInterrogation() {
  const thought = elements.thoughtInput.value.trim();

  if (!thought) {
    showStatus('Please enter a thought first.', 'error');
    return;
  }

  // Validate thought length (basic input sanitization)
  if (thought.length > 2000) {
    showStatus('Thought is too long. Please keep it under 2000 characters.', 'error');
    return;
  }

  userSelections.thought = thought;

  // Save thought if enabled
  saveThought(thought);

  // Clear status and proceed to Step A
  clearStatus();
  setState(STATE.STEP_A);
}

function handleStepASelection(selectedBtn) {
  // Deselect all buttons
  const allButtons = elements.stepASection.querySelectorAll('.choice-btn');
  allButtons.forEach(btn => btn.classList.remove('selected'));

  // Select clicked button
  selectedBtn.classList.add('selected');
  userSelections.classification = selectedBtn.dataset.value;

  // Award points and proceed to Step B after short delay
  setTimeout(() => {
    awardPoints(5, 'Step 1 complete');
    setState(STATE.STEP_B);
  }, 300);
}

function handleDistortionSelection(selectedChip) {
  const distortion = selectedChip.dataset.distortion;
  const isSelected = selectedChip.classList.contains('selected');

  if (isSelected) {
    // Deselect
    selectedChip.classList.remove('selected');
    userSelections.distortions = userSelections.distortions.filter(d => d !== distortion);
  } else {
    // Check if we can select more (max 2)
    if (userSelections.distortions.length >= 2) {
      showStatus('Maximum 2 distortions can be selected.', 'info');
      return;
    }

    // Select
    selectedChip.classList.add('selected');
    userSelections.distortions.push(distortion);
  }

  // Enable/disable continue button
  elements.stepBContinue.disabled = userSelections.distortions.length === 0;
  clearStatus();
}

function proceedToStepC() {
  if (userSelections.distortions.length === 0) {
    showStatus('Please select at least one distortion.', 'error');
    return;
  }

  awardPoints(5, 'Step 2 complete');
  setState(STATE.STEP_C);
}

function handleStepCSelection(selectedBtn) {
  // Deselect all buttons
  const allButtons = elements.stepCSection.querySelectorAll('.choice-btn');
  allButtons.forEach(btn => btn.classList.remove('selected'));

  // Select clicked button
  selectedBtn.classList.add('selected');
  userSelections.evidence = selectedBtn.dataset.value;

  // Award points and proceed to API call after short delay
  setTimeout(() => {
    awardPoints(10, 'Step 3 complete');
    callBackendAPI();
  }, 300);
}

// ========================================
// BACKEND API CALL
// ========================================

async function callBackendAPI() {
  setState(STATE.LOADING);

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        thought: userSelections.thought,
        classification: userSelections.classification,
        chosen_distortions: userSelections.distortions,
        evidence_choice: userSelections.evidence
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.type || !data.distortions || !data.assumptions_vs_facts || !data.grounded_reframe) {
      throw new Error('Invalid response format from server');
    }

    displayResults(data);
    awardPoints(5, 'Analysis complete');

  } catch (error) {
    console.error('API Error:', error);
    showStatus(`Error: ${error.message}. Please try again.`, 'error');
    setState(STATE.STEP_C); // Return to last step
  }
}

// ========================================
// RESULTS DISPLAY
// ========================================

function displayResults(data) {
  // Display type
  elements.resultType.textContent = data.type || 'Unknown';

  // Display distortions
  elements.resultDistortions.innerHTML = '';
  if (Array.isArray(data.distortions) && data.distortions.length > 0) {
    data.distortions.forEach(distortion => {
      const li = document.createElement('li');
      li.textContent = distortion;
      elements.resultDistortions.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'None identified';
    elements.resultDistortions.appendChild(li);
  }

  // Display assumptions vs facts
  elements.resultAssumptions.textContent = data.assumptions_vs_facts || 'N/A';

  // Display grounded reframe
  elements.resultReframe.textContent = data.grounded_reframe || 'N/A';

  setState(STATE.RESULTS);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function clearInput() {
  elements.thoughtInput.value = '';
  elements.thoughtInput.focus();
  clearStatus();
}

function startOver() {
  // Reset selections
  userSelections = {
    thought: '',
    classification: null,
    distortions: [],
    evidence: null
  };

  // Clear input
  elements.thoughtInput.value = '';

  // Reset all button selections
  document.querySelectorAll('.choice-btn.selected').forEach(btn => {
    btn.classList.remove('selected');
  });

  document.querySelectorAll('.chip.selected').forEach(chip => {
    chip.classList.remove('selected');
  });

  // Reset Step B continue button
  elements.stepBContinue.disabled = true;

  // Clear status
  clearStatus();

  // Return to idle state
  setState(STATE.IDLE);
}

function awardPoints(points, message) {
  currentPoints += points;
  updatePointsDisplay();
  savePoints(currentPoints);
  showPointsToast(`+${points} points`, message);
}

function updatePointsDisplay() {
  elements.pointsValue.textContent = currentPoints;
}

function showPointsToast(points, message) {
  elements.pointsToast.textContent = `${points} – ${message}`;
  elements.pointsToast.classList.remove('hidden');

  setTimeout(() => {
    elements.pointsToast.classList.add('hidden');
  }, 3000);
}

function showStatus(message, type = 'info') {
  elements.statusLine.textContent = message;
  elements.statusLine.className = `status-line ${type}`;
}

function clearStatus() {
  elements.statusLine.textContent = '';
  elements.statusLine.className = 'status-line';
}
