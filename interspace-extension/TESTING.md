# 🧪 Testing Guide for Interspace

This guide helps you test the extension thoroughly before and after deployment.

## Pre-Deployment Testing (Without Backend)

### 1. Test Extension Loading

```bash
# Verify all required files exist
ls -la interspace-extension/

# Required files:
# ✓ manifest.json
# ✓ popup.html
# ✓ popup.css
# ✓ popup.js
# ✓ icon16.png, icon48.png, icon128.png
# ✓ api/reflect.js
```

Load in Chrome:
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Load unpacked → select `interspace-extension/`
4. Should load without errors

**Expected**: Extension icon appears, no console errors

### 2. Test UI Components

Open the extension popup and verify:

- [ ] Title "Interspace" displays
- [ ] Subtitle shows correctly
- [ ] Points display shows "0"
- [ ] Settings toggle is present
- [ ] Textarea is visible and functional
- [ ] "Interrogate" and "Clear" buttons work visually
- [ ] No console errors (F12 → Console)

### 3. Test Local Storage

```javascript
// Open extension popup
// Right-click → Inspect → Console

// Test saving points
chrome.storage.local.set({ points: 100 }, () => {
  console.log('Points saved');
});

// Verify points persist
// Close and reopen popup - should show 100 points

// Clear storage
chrome.storage.local.clear(() => {
  console.log('Storage cleared');
});
```

## Backend Testing (Local)

### 1. Test Serverless Function Locally

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Create .env file
echo "OPENAI_API_KEY=your-key-here" > .env

# Start local dev server
vercel dev
```

### 2. Test API Endpoint

```bash
# Test with curl
curl -X POST http://localhost:3000/api/reflect \
  -H "Content-Type: application/json" \
  -d '{
    "thought": "Everyone will judge me for making a mistake",
    "classification": "prediction",
    "chosen_distortions": ["mind-reading", "catastrophizing"],
    "evidence_choice": "no"
  }'
```

**Expected Response**:
```json
{
  "type": "Prediction/Interpretation",
  "distortions": ["Mind reading", "Catastrophizing"],
  "assumptions_vs_facts": "Assumption: Everyone notices and judges mistakes harshly...",
  "grounded_reframe": "I made a mistake. Some people may notice, others may not..."
}
```

### 3. Test Error Handling

Test missing thought:
```bash
curl -X POST http://localhost:3000/api/reflect \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: `{"error": "Thought is required and must be a string"}`

Test invalid method:
```bash
curl -X GET http://localhost:3000/api/reflect
```

**Expected**: `{"error": "Method not allowed. Only POST is supported."}`

## Post-Deployment Testing (Production)

### 1. Test Extension Flow (Happy Path)

1. Click extension icon
2. Enter thought: "I'll never be good enough at my job"
3. Click "Interrogate"
4. **Step A**: Select "Thought"
   - [ ] Points toast shows "+5 points"
   - [ ] Total points = 5
5. **Step B**: Select "All-or-nothing" and "Should statements"
   - [ ] Can select 2 chips
   - [ ] Cannot select more than 2
   - [ ] "Continue" button enables
   - [ ] Click Continue
   - [ ] Points toast shows "+5 points"
   - [ ] Total points = 10
6. **Step C**: Select "No or unclear"
   - [ ] Points toast shows "+10 points"
   - [ ] Total points = 20
   - [ ] Loading spinner appears
7. **Results**:
   - [ ] AI analysis appears
   - [ ] All 4 sections populated
   - [ ] Points toast shows "+5 points"
   - [ ] Total points = 25
   - [ ] "Start Over" button visible

### 2. Test Edge Cases

**Empty Input**:
- Leave textarea empty → Click Interrogate
- **Expected**: Error message "Please enter a thought first."

**Very Long Input**:
- Paste 3000+ characters → Click Interrogate
- **Expected**: Error message about length limit

**Network Failure**:
- Disconnect internet after Step C
- **Expected**: Error message, flow returns to Step C

**Multiple Sessions**:
- Complete flow → note final points
- Close popup
- Reopen popup
- **Expected**: Points persist from previous session

### 3. Test Settings

**Save Thought Toggle**:
1. Enable "Save my last thought locally"
2. Enter a thought → Complete flow
3. Close popup
4. Reopen popup
5. **Expected**: Previous thought appears in textarea

**Disable Save**:
1. Disable toggle
2. Enter new thought → Complete flow
3. Close and reopen
4. **Expected**: Textarea is empty

### 4. Test Points System

Points should accumulate across multiple sessions:

| Action | Points Awarded | Running Total |
|--------|---------------|---------------|
| Start | - | 0 |
| Step A complete | +5 | 5 |
| Step B complete | +5 | 10 |
| Step C complete | +10 | 20 |
| Results shown | +5 | 25 |
| Second round - Step A | +5 | 30 |
| Second round - Step B | +5 | 35 |
| Second round - Step C | +10 | 45 |
| Second round - Results | +5 | 50 |

### 5. Test State Machine

Verify state transitions work correctly:

```
IDLE → (click Interrogate) → STEP_A
STEP_A → (select classification) → STEP_B
STEP_B → (select distortions + Continue) → STEP_C
STEP_C → (select evidence) → LOADING
LOADING → (API response) → RESULTS
RESULTS → (click Start Over) → IDLE
```

**Test "Start Over"**:
- Complete full flow
- Click "Start Over"
- **Expected**: Returns to IDLE, textarea cleared, selections reset, points unchanged

### 6. Test Different Thought Types

Test with various thought patterns:

**Catastrophizing**:
- "This small mistake will ruin my entire career"
- Expected distortions: Catastrophizing, Fortune telling

**Mind Reading**:
- "My friend didn't text back, they must hate me now"
- Expected distortions: Mind reading, Jumping to conclusions

**All-or-Nothing**:
- "If I'm not perfect at this, I'm a complete failure"
- Expected distortions: All-or-nothing thinking, Should statements

**Emotional Reasoning**:
- "I feel anxious, so something bad must be about to happen"
- Expected distortions: Emotional reasoning, Fortune telling

## Performance Testing

### 1. Response Time

- Complete flow and measure time from Step C → Results
- **Target**: < 5 seconds for API response
- **Acceptable**: < 10 seconds

### 2. Storage Limits

Test with many sessions:
- Complete 50+ flows
- Check points total
- Verify no storage errors
- **Expected**: Points continue accumulating, no issues

### 3. Memory Usage

- Open Chrome Task Manager (Shift + Esc)
- Find "Interspace" extension
- Complete multiple flows
- **Expected**: Memory stays < 50MB

## Browser Console Checklist

No errors should appear for:

- [ ] Extension load
- [ ] Popup open
- [ ] Each step transition
- [ ] API call
- [ ] Storage operations
- [ ] Points updates

## Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| "Failed to fetch" | Wrong backend URL | Check `popup.js` line 7 |
| Points not saving | Storage permission | Check `manifest.json` permissions |
| No AI response | Missing API key | Check Vercel env variables |
| CORS error | Backend issue | Check Vercel function CORS headers |
| Extension won't load | Missing icons | Generate icons using `generate-icons.html` |

## Automated Testing Script

For quick regression testing, paste this in the extension console:

```javascript
// Quick test script
async function quickTest() {
  console.log('🧪 Running quick test...');

  // Test storage
  await chrome.storage.local.set({ points: 999 });
  const data = await chrome.storage.local.get('points');
  console.assert(data.points === 999, '✓ Storage works');

  // Test points display
  const pointsEl = document.getElementById('pointsValue');
  console.assert(pointsEl !== null, '✓ Points element exists');

  // Test all sections exist
  const sections = ['inputSection', 'stepASection', 'stepBSection', 'stepCSection', 'loadingSection', 'resultsSection'];
  sections.forEach(id => {
    console.assert(document.getElementById(id) !== null, `✓ ${id} exists`);
  });

  console.log('✅ Quick test complete!');
}

quickTest();
```

## Manual Testing Checklist

Before considering the extension production-ready:

- [ ] Icons display correctly in Chrome toolbar
- [ ] All UI elements render properly
- [ ] Points system works and persists
- [ ] All 3 steps function correctly
- [ ] API integration works with real OpenAI
- [ ] Error handling graceful for all edge cases
- [ ] Settings toggle works and persists
- [ ] "Start Over" resets flow correctly
- [ ] No console errors during normal usage
- [ ] Works offline (UI only, API fails gracefully)
- [ ] Storage limits tested (many sessions)
- [ ] Multiple thought types tested
- [ ] Response quality is appropriate (CBT-style, neutral, no advice)

## Deployment Verification

After deploying to production:

1. [ ] Vercel deployment shows "Ready"
2. [ ] Environment variable set correctly
3. [ ] Backend URL updated in `popup.js`
4. [ ] Test API endpoint directly (curl)
5. [ ] Full flow test in extension
6. [ ] Check Vercel function logs for errors
7. [ ] Verify OpenAI API calls in OpenAI dashboard

---

**Testing complete when all checkboxes are ✓ and no console errors appear.**
