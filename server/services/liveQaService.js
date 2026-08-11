/**
 * Live Q&A and Polling Service
 * Manages in-memory questions and polls per event with Socket.IO broadcasting.
 */
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

const questions = new Map();
const polls = new Map();

function getEventQuestions(eventId) {
  if (!questions.has(eventId)) questions.set(eventId, []);
  return questions.get(eventId);
}

function getEventPolls(eventId) {
  if (!polls.has(eventId)) polls.set(eventId, []);
  return polls.get(eventId);
}

function broadcast(io, eventId, event, data) {
  if (!io) return;
  io.to(`qa:${eventId}`).emit(event, data);
  logger.debug(`[liveQaService] Broadcast ${event} to qa:${eventId}`);
}

export const liveQaService = {
  joinRoom(socket, eventId) {
    socket.join(`qa:${eventId}`);
  },

  leaveRoom(socket, eventId) {
    socket.leave(`qa:${eventId}`);
  },

  askQuestion({ eventId, askedBy, email, text, isAnonymous = false }) {
    const qs = getEventQuestions(eventId);
    const question = {
      id: uuidv4(),
      eventId,
      text: String(text).trim().slice(0, 1000),
      askedBy: isAnonymous ? 'Anonymous' : String(askedBy).slice(0, 100),
      email: isAnonymous ? null : String(email).slice(0, 256),
      isAnonymous: !!isAnonymous,
      upvotes: 0,
      upvotedBy: [],
      status: 'open',
      isFeatured: false,
      answer: null,
      answeredBy: null,
      createdAt: Date.now(),
    };
    qs.push(question);
    const io = liveQaService._io;
    if (io) broadcast(io, eventId, 'qa:new-question', question);
    return question;
  },

  listQuestions(eventId, sortBy = 'upvotes') {
    const qs = getEventQuestions(eventId);
    const sorted = [...qs];
    if (sortBy === 'upvotes') sorted.sort((a, b) => b.upvotes - a.upvotes);
    else if (sortBy === 'recent') sorted.sort((a, b) => b.createdAt - a.createdAt);
    else if (sortBy === 'unanswered') sorted.sort((a, b) => (a.status === 'answered' ? 1 : -1));
    return { questions: sorted };
  },

  upvoteQuestion(eventId, questionId, userId) {
    if (!userId || typeof userId !== 'string') {
      return { error: 'Valid userId is required' };
    }
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) {
      return { error: 'Valid userId is required' };
    }

    const qs = getEventQuestions(eventId);
    const q = qs.find((q) => q.id === questionId);
    if (!q) return { error: 'Question not found' };
    if (q.upvotedBy.includes(normalizedUserId)) return { error: 'Already upvoted' };
    q.upvotes += 1;
    q.upvotedBy.push(normalizedUserId);
    const io = liveQaService._io;
    if (io) broadcast(io, eventId, 'qa:updated', { id: questionId, upvotes: q.upvotes });
    return { id: questionId, upvotes: q.upvotes };
  },

  answerQuestion(eventId, questionId, answer, answeredBy) {
    const qs = getEventQuestions(eventId);
    const q = qs.find((q) => q.id === questionId);
    if (!q) return { error: 'Question not found' };
    q.answer = String(answer).trim().slice(0, 2000);
    q.answeredBy = String(answeredBy).slice(0, 100);
    q.status = 'answered';
    const io = liveQaService._io;
    if (io)
      broadcast(io, eventId, 'qa:answered', {
        id: questionId,
        answer: q.answer,
        answeredBy: q.answeredBy,
      });
    return q;
  },

  moderateQuestion(eventId, questionId, action) {
    const qs = getEventQuestions(eventId);
    const q = qs.find((q) => q.id === questionId);
    if (!q) return { error: 'Question not found' };
    if (action === 'feature') q.isFeatured = true;
    else if (action === 'unfeature') q.isFeatured = false;
    else if (action === 'answered') q.status = 'answered';
    else if (action === 'duplicate') q.status = 'duplicate';
    else if (action === 'open') q.status = 'open';
    else if (action === 'remove') {
      const idx = qs.findIndex((q) => q.id === questionId);
      if (idx >= 0) qs.splice(idx, 1);
      const io = liveQaService._io;
      if (io) broadcast(io, eventId, 'qa:removed', { id: questionId });
      return { success: true };
    }
    const io = liveQaService._io;
    if (io)
      broadcast(io, eventId, 'qa:moderated', {
        id: questionId,
        status: q.status,
        isFeatured: q.isFeatured,
      });
    return q;
  },

  createPoll({ eventId, question, options, type = 'single' }) {
    const ps = getEventPolls(eventId);
    const poll = {
      id: uuidv4(),
      eventId,
      question: String(question).trim().slice(0, 500),
      options: options.map((opt, i) => ({
        id: uuidv4(),
        text: String(opt).trim().slice(0, 200),
        votes: 0,
        voters: [],
      })),
      type, // 'single', 'multiple', 'rating'
      status: 'active',
      totalVotes: 0,
      createdAt: Date.now(),
    };
    ps.push(poll);
    const io = liveQaService._io;
    if (io) broadcast(io, eventId, 'poll:new', poll);
    return poll;
  },

  votePoll(eventId, pollId, optionIds, voterId) {
    if (!voterId || typeof voterId !== 'string') {
      return { error: 'Valid voterId is required' };
    }
    const normalizedVoterId = voterId.trim();
    if (!normalizedVoterId) {
      return { error: 'Valid voterId is required' };
    }

    const ps = getEventPolls(eventId);
    const poll = ps.find((p) => p.id === pollId);
    if (!poll) return { error: 'Poll not found' };
    if (poll.status !== 'active') return { error: 'Poll is closed' };

    const ids = Array.isArray(optionIds) ? optionIds : [optionIds];
    for (const opt of poll.options) {
      if (opt.voters.includes(normalizedVoterId)) return { error: 'Already voted' };
    }
    let votedCount = 0;
    for (const opt of poll.options) {
      if (ids.includes(opt.id)) {
        opt.votes += 1;
        opt.voters.push(normalizedVoterId);
        votedCount += 1;
      }
    }
    if (votedCount === 0) return { error: 'Invalid option' };
    if (poll.type === 'single' && votedCount > 1) return { error: 'Single choice only' };
    poll.totalVotes += votedCount;
    const io = liveQaService._io;
    if (io)
      broadcast(io, eventId, 'poll:updated', {
        id: pollId,
        options: poll.options.map((o) => ({ id: o.id, text: o.text, votes: o.votes })),
        totalVotes: poll.totalVotes,
      });
    return { id: pollId, totalVotes: poll.totalVotes };
  },

  closePoll(eventId, pollId) {
    const ps = getEventPolls(eventId);
    const poll = ps.find((p) => p.id === pollId);
    if (!poll) return { error: 'Poll not found' };
    poll.status = 'closed';
    const io = liveQaService._io;
    if (io) broadcast(io, eventId, 'poll:closed', { id: pollId, status: 'closed' });
    return poll;
  },

  listPolls(eventId) {
    return { polls: getEventPolls(eventId) };
  },

  getPollResults(eventId, pollId) {
    const ps = getEventPolls(eventId);
    const poll = ps.find((p) => p.id === pollId);
    if (!poll) return { error: 'Poll not found' };
    const results = poll.options.map((o) => ({ id: o.id, text: o.text, votes: o.votes }));
    const total = poll.totalVotes;
    return {
      id: pollId,
      question: poll.question,
      type: poll.type,
      status: poll.status,
      options: results,
      totalVotes: total,
      percentages: results.map((r) => ({
        ...r,
        percentage: total > 0 ? Math.round((r.votes / total) * 100) : 0,
      })),
    };
  },

  setIO(io) {
    liveQaService._io = io;
  },
};
