# Chatbot API Guide

## Base URL
```
http://localhost:5000
```

## Endpoints

### 1. Health Check
**GET** `/api/health`

Response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 2. Get Welcome Message
**GET** `/api/welcome`

Response:
```json
{
  "success": true,
  "welcomeMessage": "Hello! Welcome to our CRM system. I'm here to help you with your queries. How can I assist you today?"
}
```

**Usage:** Call this when user first opens the chat to display welcome message.

### 3. Chat with AI
**POST** `/api/chat`

Request Body:
```json
{
  "sessionId": "unique-session-id",
  "message": "Hello! My name is John and my email is john@example.com",
  "conversationHistory": [] // Optional: Last 6 messages if you want to manage history yourself
}
```

Response:
```json
{
  "success": true,
  "response": "Hello John! Nice to meet you. How can I help you today?",
  "userDetails": {
    "name": "John",
    "email": "john@example.com",
    "contact": null,
    "address": null
  },
  "conversationHistory": [
    { "role": "user", "content": "Hello! My name is John..." },
    { "role": "assistant", "content": "Hello John! Nice to meet you..." }
  ]
}
```

### 4. Get User Details
**GET** `/api/user-details/:sessionId`

Response:
```json
{
  "success": true,
  "userDetails": {
    "name": "John",
    "email": "john@example.com",
    "contact": null,
    "address": null
  }
}
```

### 5. Clear Session
**DELETE** `/api/session/:sessionId`

Response:
```json
{
  "success": true,
  "message": "Session cleared"
}
```

## Features

### ✅ Static Agent Configuration (Backend)
The agent behavior is **configured statically in the backend** (`services/aiAgent.service.js`):

- **Welcome Message**: Customizable greeting shown to users
- **Agent Prompt**: Defines agent personality and behavior
- **Knowledge Base**: Q&A pairs the agent can answer
- **Domain Restriction**: Agent ONLY answers questions from the knowledge base

**To customize:** Edit `AGENT_CONFIG` object in `services/aiAgent.service.js`

### ✅ Domain Restriction (No Outside Answers)
The agent is configured to **ONLY answer questions from the knowledge base**:
- Questions about CRM features, pricing, support, integrations, etc. ✅
- Outside questions (weather, sports, general knowledge) ❌ - Will politely redirect

Example outside question:
```json
{
  "message": "What's the weather today?"
}
```
Response:
```
"I'm sorry, I can only help with questions about our CRM products and services. Is there anything specific about our CRM system I can assist you with?"
```

### ✅ Language Switching
OpenAI naturally supports multiple languages. Just ask in any language:

**Example:**
```json
{
  "sessionId": "user123",
  "message": "Can you switch to Hindi?"
}
```

Response will be in Hindi:
```json
{
  "success": true,
  "response": "हां, मैं हिंदी में बात कर सकता हूं। आप मुझसे क्या पूछना चाहते हैं?",
  ...
}
```

### ✅ Automatic User Detail Extraction
The AI automatically extracts and stores:
- **Name** - "My name is John"
- **Email** - "john@example.com"
- **Contact** - "My phone is 9876543210"
- **Address** - "My address is 123 Main St"

### ✅ Conversation History
- Server automatically maintains last 6 messages per session
- You can also provide your own history in the request
- History is session-based (use unique sessionId per user)

## Example Usage

### Simple Chat Flow:
```bash
# 0. Get welcome message (when user opens chat)
curl http://localhost:5000/api/welcome

# 1. First message
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"user123","message":"Hello"}'

# 2. User provides details
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"user123","message":"My name is Sarah and email is sarah@email.com"}'

# 3. Switch to Hindi
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"user123","message":"Can you speak Hindi?"}'

# 4. Check stored details
curl http://localhost:5000/api/user-details/user123
```

## Notes

- **sessionId**: Use a unique ID for each user (e.g., UUID, user ID from your database)
- **Conversation History**: Automatically limited to last 6 messages to keep context relevant
- **Language Support**: OpenAI GPT-4 supports 50+ languages natively
- **State Management**: User details are stored in memory per session

## Configuration

### Customizing Agent Behavior

Edit `services/aiAgent.service.js` - `AGENT_CONFIG` object:

```javascript
const AGENT_CONFIG = {
  // Welcome message shown when user starts chat
  welcomeMessage: "Your custom welcome message here",
  
  // Agent prompt - defines behavior and knowledge base
  agentPrompt: `Your agent instructions here
  
  Add Q&A pairs:
  Q: Question 1?
  A: Answer 1
  
  Q: Question 2?
  A: Answer 2
  `,
  
  // Domain restriction (true = only answer from knowledge base)
  restrictedDomain: true,
  
  // OpenAI settings
  temperature: 0.7,  // 0-1, higher = more creative
  maxTokens: 500     // Max response length
};
```

### Adding New Q&A to Knowledge Base

Simply add to the `KNOWLEDGE BASE` section in `agentPrompt`:

```
Q: Your new question?
A: Your detailed answer here.
```

The agent will automatically learn and answer based on these Q&A pairs!
