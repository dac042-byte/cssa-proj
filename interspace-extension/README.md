# Interspace - CBT-Style Cognitive Clarity Extension

A Chrome Extension (Manifest V3) that provides CBT-style cognitive reappraisal in under 90 seconds. Built with a clean, minimal UI and a secure serverless backend.

## Features

- **Interactive 3-Step Flow**: Classification → Distortion Identification → Evidence Check
- **AI-Powered Analysis**: Secure OpenAI integration via serverless backend
- **Points System**: Gamified engagement (no correctness judgment)
- **Privacy-Focused**: No tracking, no analytics, local-only storage
- **Clean UI**: Minimal, distraction-free interface

## Project Structure

```
interspace-extension/
├── manifest.json          # Chrome extension manifest (V3)
├── popup.html            # Extension popup UI
├── popup.css             # Styling
├── popup.js              # Frontend logic and state machine
├── icon16.png            # Extension icon (16x16)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
├── api/
│   └── reflect.js        # Vercel serverless function
├── vercel.json           # Vercel configuration
├── package.json          # Project metadata
└── README.md             # This file
```

## Setup Instructions

### Part 1: Create Extension Icons

You need to create three icon files. You can use any image editor or online tool:

1. Create three PNG files:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

2. Quick method using online tools:
   - Go to [Canva](https://www.canva.com/) or [Figma](https://www.figma.com/)
   - Create a simple icon (e.g., a brain, lightbulb, or abstract shape)
   - Export in the three required sizes
   - Save them in the `interspace-extension/` directory

3. Alternative: Use placeholder icons temporarily:
   - Download any simple icon from [Flaticon](https://www.flaticon.com/) or [Icons8](https://icons8.com/)
   - Resize to the required dimensions
   - You can update these later

### Part 2: Deploy the Serverless Backend to Vercel

#### Prerequisites

1. Create a [Vercel account](https://vercel.com/signup) (free tier is sufficient)
2. Get an [OpenAI API key](https://platform.openai.com/api-keys)
3. Install Vercel CLI (optional but recommended):
   ```bash
   npm install -g vercel
   ```

#### Deployment Steps

**Option A: Using Vercel CLI (Recommended)**

1. Open your terminal in the `interspace-extension/` directory

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Follow the prompts:
   - Set up and deploy? `Y`
   - Which scope? (Select your account)
   - Link to existing project? `N`
   - What's your project's name? `interspace` (or your choice)
   - In which directory is your code located? `./`
   - Want to override the settings? `N`

5. After deployment, you'll get a URL like:
   ```
   https://interspace-xxxx.vercel.app
   ```

6. Add your OpenAI API key as an environment variable:
   ```bash
   vercel env add OPENAI_API_KEY
   ```
   - Select `Production`, `Preview`, and `Development`
   - Paste your OpenAI API key when prompted

7. Redeploy to apply the environment variable:
   ```bash
   vercel --prod
   ```

8. **Copy your production URL** - you'll need it for the next step!

**Option B: Using Vercel Dashboard**

1. Go to [vercel.com](https://vercel.com/) and sign in

2. Click "Add New Project"

3. Import your project:
   - If using Git: Connect your repository
   - If local: Use "Import Git Repository" or drag-and-drop the folder

4. Configure the project:
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Leave build settings as default

5. Add environment variable:
   - Go to "Environment Variables"
   - Add: `OPENAI_API_KEY` = `your-openai-api-key-here`
   - Select all environments (Production, Preview, Development)

6. Click "Deploy"

7. After deployment, copy your production URL:
   ```
   https://your-project.vercel.app
   ```

### Part 3: Configure the Extension

1. Open `popup.js` in a text editor

2. Find line 7:
   ```javascript
   const BACKEND_URL = 'https://your-project.vercel.app/api/reflect';
   ```

3. Replace `https://your-project.vercel.app` with your actual Vercel URL:
   ```javascript
   const BACKEND_URL = 'https://interspace-xxxx.vercel.app/api/reflect';
   ```

4. Save the file

### Part 4: Load the Extension in Chrome

1. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

2. Enable **Developer mode** (toggle in the top-right corner)

3. Click **Load unpacked**

4. Select the `interspace-extension/` directory

5. The extension should now appear in your extensions list!

6. Pin the extension to your toolbar:
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Interspace"
   - Click the pin icon

### Part 5: Test the Extension

1. Click the Interspace icon in your Chrome toolbar

2. Enter a looping thought (e.g., "Everyone thinks I'm incompetent")

3. Click **Interrogate**

4. Follow the 3-step flow:
   - **Step 1**: Select classification (Fact/Thought/Prediction)
   - **Step 2**: Select 1-2 distortions
   - **Step 3**: Choose evidence level

5. View your AI-generated clarity report!

6. Check that:
   - Points are awarded at each step
   - The final analysis appears correctly
   - "Start Over" resets the flow
   - Points persist after closing/reopening the popup

## Configuration Options

### Settings Toggle

- **Save my last thought locally**: When enabled, your most recent thought is stored locally in Chrome storage (not sent to any server except during analysis)
- Default: OFF (for privacy)

### Points System

Points are awarded for participation:
- Step 1 complete: +5 points
- Step 2 complete: +5 points
- Step 3 complete: +10 points
- Analysis received: +5 bonus points

Points are stored locally and never reset automatically.

## Privacy & Security

- ✅ No background scripts or tracking
- ✅ No analytics or telemetry
- ✅ Thoughts stored locally only (if enabled)
- ✅ OpenAI API key never exposed to the extension
- ✅ Serverless function handles all AI requests securely
- ✅ CORS enabled for extension-to-backend communication

## Troubleshooting

### Extension doesn't load

- Make sure all files are in the correct directory
- Check that icon files exist (even if they're placeholders)
- Verify `manifest.json` has no syntax errors

### "Error calling backend" message

1. **Check the backend URL**: Make sure `BACKEND_URL` in `popup.js` matches your Vercel deployment URL

2. **Verify environment variable**:
   - Go to your Vercel dashboard → Project → Settings → Environment Variables
   - Ensure `OPENAI_API_KEY` is set correctly

3. **Check Vercel function logs**:
   - Go to Vercel dashboard → Your Project → Deployments
   - Click on the latest deployment → Functions tab
   - Click `api/reflect.js` to view logs

4. **Test the backend directly**:
   ```bash
   curl -X POST https://your-project.vercel.app/api/reflect \
     -H "Content-Type: application/json" \
     -d '{"thought":"test thought","classification":"thought","chosen_distortions":["catastrophizing"],"evidence_choice":"no"}'
   ```

### OpenAI Rate Limits

If you see "Rate limit exceeded":
- Wait a moment and try again
- Consider upgrading your OpenAI plan if you're using this frequently
- The extension uses `gpt-4o-mini` which is cost-effective

### Points not saving

- Check Chrome's storage permissions
- Clear extension storage and reload:
  - Go to `chrome://extensions/`
  - Click "Details" on Interspace
  - Scroll to "Storage" → "Clear"

## Development

### Local Testing

To test changes:

1. Make your changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the Interspace extension
4. Test your changes

### Backend Testing Locally

To test the Vercel function locally:

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Create .env file
echo "OPENAI_API_KEY=your-key-here" > .env

# Run local dev server
vercel dev
```

The function will be available at `http://localhost:3000/api/reflect`

Update `popup.js` temporarily to use `http://localhost:3000/api/reflect` for testing.

## API Reference

### Backend Endpoint: `/api/reflect`

**Method**: POST

**Request Body**:
```json
{
  "thought": "string (required, max 2000 chars)",
  "classification": "string (fact/thought/prediction)",
  "chosen_distortions": ["array", "of", "strings"],
  "evidence_choice": "string (yes/no)"
}
```

**Response**:
```json
{
  "type": "Interpretation/Prediction/etc.",
  "distortions": ["Catastrophizing", "Mind reading"],
  "assumptions_vs_facts": "Paragraph separating assumptions from observable facts...",
  "grounded_reframe": "One neutral, accurate restatement..."
}
```

**Error Response**:
```json
{
  "error": "Error message",
  "details": "Optional additional details"
}
```

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Extension**: Chrome Manifest V3
- **Backend**: Vercel Serverless Functions (Node.js)
- **AI**: OpenAI GPT-4o-mini with JSON mode
- **Storage**: Chrome Storage API (local)

## License

MIT

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Vercel function logs for backend issues
3. Check browser console for frontend errors (F12 → Console)

---

**Built with focus on privacy, simplicity, and evidence-based cognitive reappraisal.**
