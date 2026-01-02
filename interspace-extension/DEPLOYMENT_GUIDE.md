# 🚀 Quick Deployment Guide

Follow these steps to get Interspace up and running in ~10 minutes.

## ✅ Pre-Deployment Checklist

### 1. Generate Icons (2 minutes)

```bash
# Open generate-icons.html in your browser
open generate-icons.html  # macOS
# or just double-click the file

# Download all three icons and save them in this directory:
# - icon16.png
# - icon48.png
# - icon128.png
```

### 2. Get Your OpenAI API Key (1 minute)

1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-...`)
4. Keep it safe - you'll need it in step 4

### 3. Deploy to Vercel (3 minutes)

**Quick Method (CLI)**:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# When prompted:
# - Set up and deploy? Y
# - Link to existing project? N
# - Project name: interspace (or your choice)
# - Directory: ./ (default)
# - Override settings? N

# Copy the URL you receive (e.g., https://interspace-xxxx.vercel.app)
```

**Alternative (Web Dashboard)**:

1. Go to https://vercel.com/new
2. Import this directory or connect your Git repo
3. Click "Deploy"
4. Copy your deployment URL

### 4. Add OpenAI API Key to Vercel (2 minutes)

**Via CLI**:
```bash
vercel env add OPENAI_API_KEY

# Paste your OpenAI key when prompted
# Select: Production, Preview, Development (all three)

# Redeploy to apply
vercel --prod
```

**Via Dashboard**:
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add: `OPENAI_API_KEY` = `your-key-here`
4. Select all environments
5. Redeploy from the Deployments tab

### 5. Update Extension Configuration (1 minute)

Open `popup.js` and update line 7:

```javascript
// Change this:
const BACKEND_URL = 'https://your-project.vercel.app/api/reflect';

// To your actual URL:
const BACKEND_URL = 'https://interspace-xxxx.vercel.app/api/reflect';
```

Save the file.

### 6. Load Extension in Chrome (1 minute)

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `interspace-extension/` folder
6. Pin the extension (puzzle icon → pin Interspace)

### 7. Test It! (1 minute)

1. Click the Interspace icon
2. Type: "Everyone thinks I'm failing"
3. Click "Interrogate"
4. Complete the 3-step flow
5. View your analysis
6. Check that points were awarded

## ✅ Post-Deployment Checklist

- [ ] Icons loaded correctly in Chrome
- [ ] Extension popup opens without errors
- [ ] Backend URL is correct in `popup.js`
- [ ] OpenAI API key is set in Vercel
- [ ] Test flow completes successfully
- [ ] Points are awarded and persist
- [ ] "Start Over" resets the flow

## 🔧 Quick Troubleshooting

### "Failed to fetch" or "Network error"

1. Check `popup.js` line 7 - is the URL correct?
2. Open Chrome DevTools (F12) → Console
3. Look for CORS errors or network errors
4. Verify your Vercel deployment is live: visit `https://your-url.vercel.app/api/reflect` in browser (should show "Method not allowed" error - that's OK!)

### "Server configuration error"

1. Vercel dashboard → Your Project → Settings → Environment Variables
2. Verify `OPENAI_API_KEY` exists and has your key
3. Redeploy from the Deployments tab

### Extension won't load

1. Check that all three icon files exist: `icon16.png`, `icon48.png`, `icon128.png`
2. Check Chrome DevTools for errors
3. Try: Remove extension → Reload → Add again

## 📊 Verify Backend is Working

Test your backend directly:

```bash
curl -X POST https://your-url.vercel.app/api/reflect \
  -H "Content-Type: application/json" \
  -d '{
    "thought": "I will definitely fail this test",
    "classification": "prediction",
    "chosen_distortions": ["catastrophizing", "fortune-telling"],
    "evidence_choice": "no"
  }'
```

You should get a JSON response with `type`, `distortions`, `assumptions_vs_facts`, and `grounded_reframe`.

## 🎉 Success!

If everything works:
- You should see points awarded after each step
- The AI analysis should appear after step 3
- Points should persist after closing/reopening
- The extension should work offline (except for AI analysis)

## 📝 Optional: Local Development

To test changes locally:

```bash
# Create .env file
cp .env.example .env
# Edit .env and add your OpenAI key

# Run Vercel dev server
vercel dev

# Update popup.js temporarily to use localhost:
# const BACKEND_URL = 'http://localhost:3000/api/reflect';
```

## 🆘 Still Having Issues?

1. Check Vercel function logs:
   - Vercel Dashboard → Your Project → Deployments
   - Click latest deployment → Functions → api/reflect.js

2. Check Chrome console:
   - Right-click extension popup → Inspect
   - Look for errors in Console tab

3. Verify files:
   ```bash
   ls -la interspace-extension/
   # Should show: manifest.json, popup.html, popup.css, popup.js, icon*.png, api/
   ```

---

**Total deployment time: ~10 minutes** ⚡️
