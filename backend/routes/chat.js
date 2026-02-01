const express = require('express');
const router = express.Router();
const ChatSession = require('../models/ChatSession');
const jwtAuth = require('../middleware/jwtAuth');

// Get chat sessions count for logged-in farmer
router.get('/sessions/count', jwtAuth, async (req, res) => {
  try {
    const count = await ChatSession.countDocuments({ farmer: req.user.id });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching sessions count:', error);
    res.status(500).json({ message: 'Failed to fetch chat sessions count' });
  }
});

// Get all chat sessions for logged-in farmer
router.get('/sessions', jwtAuth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ farmer: req.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Failed to fetch chat sessions' });
  }
});

// Create a new chat session
router.post('/sessions', jwtAuth, async (req, res) => {
  try {
    const session = new ChatSession({
      farmer: req.user.id,
      title: 'New Chat',
      messages: [],
      lastMessageAt: new Date(),
      messageCount: 0
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
});

// Get messages for a specific session
router.get('/sessions/:sessionId/messages', jwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify session belongs to user and get messages
    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      farmer: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Return messages array from the session
    res.json(session.messages || []);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Delete a session (messages are embedded, so they're deleted automatically)
router.delete('/sessions/:sessionId', jwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Delete the session (messages are embedded, so they're deleted too)
    await ChatSession.deleteOne({ 
      _id: sessionId, 
      farmer: req.user.id 
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

// Update session title
router.patch('/sessions/:sessionId/title', jwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title } = req.body;

    const session = await ChatSession.findOneAndUpdate(
      { _id: sessionId, farmer: req.user.id },
      { title },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Failed to update session' });
  }
});

// Legacy: Get all messages from all sessions (deprecated - use sessions)
router.get('/history', jwtAuth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ farmer: req.user.id })
      .sort({ lastMessageAt: -1 })
      .limit(10);

    // Flatten all messages from all sessions
    const allMessages = sessions.flatMap(session => 
      (session.messages || []).map(msg => ({
        ...msg.toObject(),
        sessionId: session._id
      }))
    );

    res.json(allMessages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
});

// Save messages to a session (bulk save for user + bot pair)
router.post('/sessions/:sessionId/messages', jwtAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // Verify session belongs to user
    const session = await ChatSession.findOne({ 
      _id: sessionId, 
      farmer: req.user.id 
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Add messages to the session's messages array
    const newMessages = messages.map(msg => ({
      text: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp || new Date()
    }));

    session.messages.push(...newMessages);
    session.messageCount = session.messages.length;
    session.lastMessageAt = new Date();
    
    // Auto-generate title from first user message if still "New Chat"
    if (session.title === 'New Chat' && messages.length > 0) {
      const firstUserMsg = messages.find(m => m.sender === 'user');
      if (firstUserMsg) {
        session.title = firstUserMsg.text.substring(0, 50) + (firstUserMsg.text.length > 50 ? '...' : '');
      }
    }
    
    await session.save();

    res.status(201).json({ messages: newMessages, session });
  } catch (error) {
    console.error('Error saving messages:', error);
    res.status(500).json({ message: 'Failed to save messages' });
  }
});

// Clear all chat history for logged-in farmer (all sessions)
router.delete('/history', jwtAuth, async (req, res) => {
  try {
    await ChatSession.deleteMany({ farmer: req.user.id });
    res.json({ message: 'All chat history cleared successfully' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ message: 'Failed to clear chat history' });
  }
});

module.exports = router;