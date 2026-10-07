# 🚀 Deploy Your D&D AI DM in 5 Minutes

## What You'll Get:
- ✅ Web app accessible from **any device** (phone, tablet, laptop)
- ✅ Cloud AI that works everywhere
- ✅ Free hosting on Vercel
- ✅ No need to keep your computer running

---

## Step-by-Step:

### 1. Get Groq API Key (2 minutes)
```
Visit: https://console.groq.com
Sign up → Create API Key → Copy it
```

### 2. Deploy to Vercel (3 minutes)

#### Quick Method:
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd E:\Project\dnd-ai-dungeon-master
vercel
```

Follow prompts, say Yes to everything!

### 3. Add Environment Variables (1 minute)

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add these:

```
PREP_AI_PROVIDER = groq
PREP_AI_MODEL = llama-3.1-8b-instant
RUNTIME_AI_PROVIDER = groq
RUNTIME_AI_MODEL = llama-3.1-8b-instant
GROQ_API_KEY = paste_your_key_here
```

4. Click Save

### 4. Redeploy (30 seconds)
```bash
vercel --prod
```

Or click "Redeploy" in Vercel dashboard

### 5. Done! 🎉

You'll get a URL like:
```
https://dnd-ai-dm-[random].vercel.app
```

**Share this with your players!**
- Works on phones ✅
- Works on tablets ✅
- Works anywhere with internet ✅

---

## Cost: $0
- Vercel: Free tier (unlimited deployments)
- Groq: Free tier (500 requests/day)
- Total: **FREE** 🎊

---

## Next Steps:

1. **Test it**: Open the URL on your phone
2. **Create a campaign**: Try making your first campaign
3. **Invite players**: Share the URL
4. **Start playing**: Run your first AI-powered session!

---

Need help? See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.
