import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiAgentService from './services/aiAgent.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Initialize chat session (when user opens chatbox)
app.post('/api/chat/init', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    // Initialize session
    aiAgentService.getSession(sessionId);
    
    // Return welcome message
    const welcomeMessage = aiAgentService.getWelcomeMessage();
    
    res.json({
      success: true,
      sessionId: sessionId,
      welcomeMessage: welcomeMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get welcome message (standalone endpoint if needed)
app.get('/api/welcome', (req, res) => {
  try {
    const welcomeMessage = aiAgentService.getWelcomeMessage();
    res.json({
      success: true,
      welcomeMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { sessionId, message, conversationHistory } = req.body;

    // Validate input
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }

    // Process chat
    const result = await aiAgentService.chat(sessionId, message, conversationHistory);

    res.json({
      success: true,
      response: result.response,
      userDetails: result.userDetails,
      conversationHistory: result.conversationHistory
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user details
app.get('/api/user-details/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const userDetails = aiAgentService.getUserDetails(sessionId);
    
    res.json({
      success: true,
      userDetails
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Close chat session (when user closes chatbox)
app.post('/api/chat/close', (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionId is required'
      });
    }
    
    // Clear session
    aiAgentService.clearSession(sessionId);
    
    res.json({
      success: true,
      message: 'Chat session closed and cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear session (alternative DELETE endpoint)
app.delete('/api/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    aiAgentService.clearSession(sessionId);
    
    res.json({
      success: true,
      message: 'Session cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ Minimal chat API ready');
});
