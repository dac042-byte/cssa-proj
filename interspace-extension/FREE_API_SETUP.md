# 🎉 100% Free Setup Guide

This guide shows you how to use **completely free AI APIs** instead of OpenAI (no credit card required!).

---

## ⭐ Recommended: Google Gemini (Best Free Option)

### Why Gemini?
- ✅ **Completely free** (1,500 requests/day)
- ✅ **No credit card required**
- ✅ **High quality** responses
- ✅ **Easy setup** (5 minutes)

### Setup Steps

#### 1. Get Free API Key (1 minute)

1. Go to: https://aistudio.google.com/app/apikey
2. Click **"Get API key"** or **"Create API key"**
3. Select **"Create API key in new project"**
4. Copy the key (looks like: `AIzaSy...`)

**No credit card needed!**

#### 2. Switch to Gemini Backend (1 minute)

```bash
cd interspace-extension/api

# Backup the original
cp reflect.js reflect-openai-backup.js

# Use the Gemini version
cp reflect-gemini.js reflect.js
```

**Or manually**: Copy all the code from `api/reflect-gemini.js` and paste it into `api/reflect.js`

#### 3. Deploy to Vercel (2 minutes)

```bash
cd interspace-extension

# Deploy
vercel

# When prompted for directory, answer: ./
```

#### 4. Add Your Free API Key (1 minute)

```bash
# Add Gemini API key as environment variable
vercel env add GEMINI_API_KEY

# Paste your API key when prompted
# Select: Production, Preview, Development (all three)

# Redeploy to apply
vercel --prod

# Copy the URL you get (e.g., https://interspace-abc123.vercel.app)
```

#### 5. Update Extension (30 seconds)

Edit `popup.js`, line 7:

```javascript
// Change this line:
const BACKEND_URL = 'https://your-project.vercel.app/api/reflect';

// To your actual Vercel URL:
const BACKEND_URL = 'https://interspace-abc123.vercel.app/api/reflect';
```

Save the file.

#### 6. Load Extension in Chrome (1 minute)

1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `interspace-extension/` folder
5. Test it!

---

## 🚀 Alternative: Groq (Fastest Free Option)

### Why Groq?
- ✅ **Completely free** (14,400 requests/day!)
- ✅ **Ultra-fast** (<1 second responses)
- ✅ **No credit card required**
- ⚠️ Slightly lower quality than Gemini

### Setup Steps

#### 1. Get Free API Key

1. Go to: https://console.groq.com/
2. Sign up (email only, no credit card)
3. Go to **API Keys** → **Create API Key**
4. Copy the key (looks like: `gsk_...`)

#### 2. Switch to Groq Backend

```bash
cd interspace-extension/api
cp reflect.js reflect-openai-backup.js
cp reflect-groq.js reflect.js
```

#### 3. Deploy to Vercel

```bash
cd interspace-extension
vercel

# Add Groq API key
vercel env add GROQ_API_KEY
# Paste your key, select all environments

vercel --prod
```

#### 4. Update popup.js and load extension (same as Gemini above)

---

## 📊 Free Tier Comparison

| API | Daily Limit | Speed | Quality | Setup Time |
|-----|------------|-------|---------|-----------|
| **Google Gemini** | 1,500/day | 2-3s | Excellent ⭐ | 5 min |
| **Groq** | 14,400/day | <1s ⚡ | Good | 5 min |
| OpenAI | Unlimited | 2-4s | Excellent | 5 min + $5 |

---

## 🧪 Test Your Free Setup

After deployment, test the backend:

```bash
# Test Gemini
curl -X POST https://your-url.vercel.app/api/reflect \
  -H "Content-Type: application/json" \
  -d '{
    "thought": "I will definitely fail this test",
    "classification": "prediction",
    "chosen_distortions": ["catastrophizing"],
    "evidence_choice": "no"
  }'
```

**Expected**: JSON response with analysis

---

## ❓ FAQ

### How much does the free tier cost?
**$0.00** - Completely free forever!

### Do I need a credit card?
**No** - Both Gemini and Groq are free without any payment info.

### What happens if I exceed the daily limit?
- **Gemini**: After 1,500 requests/day, you'll get rate limit errors
- **Groq**: After 14,400 requests/day, you'll get rate limit errors
- **Solution**: Wait until next day (resets at midnight UTC)

### Can I switch between APIs later?
**Yes!** Just:
1. Replace `api/reflect.js` with the version you want
2. Update the environment variable in Vercel
3. Redeploy

### Which free API should I use?
- **For best quality**: Google Gemini
- **For fastest responses**: Groq
- **For most requests/day**: Groq (14.4k vs 1.5k)

### Is 1,500 requests/day enough?
**Yes!** For personal use:
- 1,500/day = 62 uses per hour
- 1,500/day = 45,000/month
- Most people use it 5-20 times/day

---

## 🔧 Troubleshooting

### "Invalid API key" error

**Gemini**:
- Make sure you copied the full key from https://aistudio.google.com/app/apikey
- Check it's set as `GEMINI_API_KEY` in Vercel (not `OPENAI_API_KEY`)

**Groq**:
- Make sure you copied the full key from https://console.groq.com/
- Check it's set as `GROQ_API_KEY` in Vercel

### "Rate limit exceeded"

You've hit the daily limit. Solutions:
1. Wait until tomorrow (resets at midnight UTC)
2. Switch to the other free API
3. Upgrade to OpenAI paid tier

### Backend not working after switch

1. Verify you copied the entire file contents
2. Check Vercel environment variable matches the backend:
   - `reflect-gemini.js` needs `GEMINI_API_KEY`
   - `reflect-groq.js` needs `GROQ_API_KEY`
3. Redeploy: `vercel --prod`

---

## 📁 Quick Reference

### Current Backend Files

| File | API | Env Variable Needed |
|------|-----|---------------------|
| `reflect.js` | OpenAI (default) | `OPENAI_API_KEY` |
| `reflect-gemini.js` | Google Gemini | `GEMINI_API_KEY` |
| `reflect-groq.js` | Groq | `GROQ_API_KEY` |

### To Switch APIs

```bash
# Switch to Gemini
cp api/reflect-gemini.js api/reflect.js

# Switch to Groq
cp api/reflect-groq.js api/reflect.js

# Switch back to OpenAI
cp api/reflect-openai-backup.js api/reflect.js

# Then redeploy
vercel --prod
```

---

## 💰 Cost Summary

### Google Gemini (Free Tier)
- **Cost**: $0
- **Credit card**: Not required
- **Monthly value**: ~$100 if you used a paid API
- **Usage**: 45,000 analyses/month free

### Groq (Free Tier)
- **Cost**: $0
- **Credit card**: Not required
- **Monthly value**: ~$150 if you used a paid API
- **Usage**: 432,000 analyses/month free

### Total savings vs OpenAI
- **Per month**: Save ~$1-10 depending on usage
- **Per year**: Save ~$12-120

---

## ✅ Quick Start Checklist

- [ ] Get free API key (Gemini or Groq)
- [ ] Copy the appropriate backend file to `api/reflect.js`
- [ ] Deploy to Vercel: `vercel`
- [ ] Add environment variable with correct name
- [ ] Redeploy: `vercel --prod`
- [ ] Update `popup.js` with Vercel URL
- [ ] Generate icons using `generate-icons.html`
- [ ] Load extension in Chrome
- [ ] Test with a real thought
- [ ] Verify analysis appears

**Total time**: ~5-10 minutes

---

**🎉 Enjoy your completely free CBT clarity tool!**
