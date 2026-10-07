# D&D AI Dungeon Master - Deployment Guide

## Deploy to Vercel (Works on Mobile!)

This guide will help you deploy the app so it's accessible from phones, tablets, and any device with internet.

---

## Step 1: Get Groq API Key (Free)

Groq provides fast, free AI inference for your DM:

1. **Sign up**: https://console.groq.com
2. **Create API Key**: 
   - Go to "API Keys" section
   - Click "Create API Key"
   - Copy the key (you won't see it again)
3. **Free Tier Limits**:
   - ~500 requests/day
   - More than enough for D&D sessions!

---

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd E:\Project\dnd-ai-dungeon-master
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Your account**
- Link to existing project? **N**
- Project name? **dnd-ai-dm** (or your choice)
- Directory? **./ (current)**

### Option B: Using GitHub + Vercel Dashboard

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**:
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repo
   - Click "Deploy"

---

## Step 3: Configure Environment Variables

### Via Vercel Dashboard (Recommended):

1. Go to your project on Vercel
2. Navigate to **Settings → Environment Variables**
3. Add these variables:

| Variable | Value |
|----------|-------|
| `PREP_AI_PROVIDER` | `groq` |
| `PREP_AI_MODEL` | `llama-3.1-8b-instant` |
| `RUNTIME_AI_PROVIDER` | `groq` |
| `RUNTIME_AI_MODEL` | `llama-3.1-8b-instant` |
| `GROQ_API_KEY` | `your_actual_groq_key_here` |

4. Click **Save**
5. Redeploy: Go to **Deployments** → click latest → **Redeploy**

### Via CLI:

```bash
vercel env add GROQ_API_KEY
# Paste your Groq API key when prompted

vercel env add PREP_AI_PROVIDER groq
vercel env add PREP_AI_MODEL llama-3.1-8b-instant
vercel env add RUNTIME_AI_PROVIDER groq
vercel env add RUNTIME_AI_MODEL llama-3.1-8b-instant
```

---

## Step 4: Access Your App

After deployment completes (~2 minutes), you'll get a URL like:

```
https://dnd-ai-dm.vercel.app
```

**This works on:**
- ✅ Phones (iOS/Android)
- ✅ Tablets (iPad/Android)
- ✅ Laptops/Desktops
- ✅ Any device with a browser!

---

## Usage Tips for Mobile

### Best Experience:

1. **Bookmark the URL** on your phone
2. **Add to home screen** for app-like experience:
   - iOS Safari: Share → "Add to Home Screen"
   - Android Chrome: Menu → "Add to Home Screen"

3. **Use landscape mode** for better session view
4. **Keep screen awake** during sessions (disable auto-lock)

### At the Table:

- **DM runs the app** on their tablet/laptop
- **Players can view** character sheets on their phones
- **Everyone can roll dice** using the built-in roller
- **AI narration** appears in real-time for all to see

---

## Cost Breakdown

### Completely Free:
- ✅ Vercel hosting (free tier: unlimited deployments)
- ✅ Groq AI (free tier: 500 requests/day)
- ✅ D&D Beyond integration (free)
- ✅ All features included

### If You Exceed Free Tier:
- Groq paid: $0.40 per million tokens
- Typical session: ~50 requests
- Cost per session: <$0.01

---

## Troubleshooting

### Build Fails:
```bash
# Check build locally
npm run build

# Fix any TypeScript errors
# Retry deployment
```

### AI Not Working:
- Verify `GROQ_API_KEY` is set in Vercel
- Check Vercel function logs: **Deployment → Functions → Logs**
- Test Groq key locally first

### Data Not Persisting:
- Current MVP uses JSON file storage
- Files reset on each deployment
- **Solution**: Add database (see Future Enhancements)

---

## Custom Domain (Optional)

Want a custom domain like `mydm.app`?

1. Buy domain (Namecheap, Cloudflare, etc.)
2. In Vercel: **Settings → Domains**
3. Add your domain
4. Follow DNS configuration instructions
5. Wait for propagation (up to 48 hours)

---

## Future Enhancements

### For Production Use:

1. **Add Database** (Supabase/Neon):
   - Persistent campaign data
   - Survives redeployments
   
2. **Add Authentication** (Clerk/Auth0):
   - Protect your campaigns
   - Multi-player support
   
3. **Add Storage** (Vercel Blob):
   - Save campaign maps
   - Store character images

4. **Rate Limiting**:
   - Prevent AI abuse
   - Control costs

---

## Quick Reference

### Environment Variables:
```env
PREP_AI_PROVIDER=groq
PREP_AI_MODEL=llama-3.1-8b-instant
RUNTIME_AI_PROVIDER=groq
RUNTIME_AI_MODEL=llama-3.1-8b-instant
GROQ_API_KEY=your_key_here
```

### Useful Commands:
```bash
vercel              # Deploy
vercel --prod       # Deploy to production
vercel logs         # View logs
vercel env ls       # List environment variables
```

### Links:
- Vercel Dashboard: https://vercel.com/dashboard
- Groq Console: https://console.groq.com
- Project Repo: https://github.com/Adamlamia/dnd-ai-dungeon-master

---

*Happy adventuring! 🎲⚔️🐉*
