# Agent Configuration Guide

## Location
All agent configuration is in: **`services/aiAgent.service.js`**

Look for the `AGENT_CONFIG` object at the top of the file.

## What You Can Configure

### 1. Welcome Message
```javascript
welcomeMessage: "Hello! Welcome to our CRM system..."
```
This is shown when user first opens the chat.

### 2. Agent Prompt & Knowledge Base
```javascript
agentPrompt: `You are a professional customer service agent...

KNOWLEDGE BASE (Questions & Answers):

Q: What is your CRM system?
A: Our CRM system is...

Q: What features does your CRM offer?
A: Our CRM offers...
`
```

**Add your Q&A here** - The agent will only answer questions from this knowledge base.

### 3. Domain Restriction
```javascript
restrictedDomain: true  // Agent only answers from knowledge base
```
When `true`: Agent refuses to answer outside questions.

### 4. AI Behavior Settings
```javascript
temperature: 0.7,  // 0 = focused, 1 = creative
maxTokens: 500     // Maximum response length
```

## Example: Adding New Q&A

1. Open `services/aiAgent.service.js`
2. Find `KNOWLEDGE BASE (Questions & Answers):`
3. Add your Q&A:

```javascript
Q: Do you offer mobile app?
A: Yes! Our CRM has mobile apps for both iOS and Android with full feature access.
```

4. Save and restart server: `node index.js`

## Example: Change Welcome Message

```javascript
welcomeMessage: "Namaste! Welcome to XYZ CRM. मैं आपकी कैसे मदद कर सकता हूँ?"
```

## Testing Your Changes

After editing configuration:

1. **Stop server**: `Ctrl+C` or `pkill -f "node index.js"`
2. **Start server**: `node index.js`
3. **Test welcome**: `curl http://localhost:5000/api/welcome`
4. **Test chat**: Send a question from your knowledge base

## Important Notes

- ✅ **Domain Restriction**: Agent will NOT answer questions outside the knowledge base
- ✅ **Language Support**: Works in any language (English, Hindi, etc.)
- ✅ **User Details**: Automatically extracts name, email, contact, address
- ✅ **Conversation Memory**: Remembers last 6 messages per session
- ✅ **Static Backend Config**: All configuration is in the backend, not exposed to frontend
