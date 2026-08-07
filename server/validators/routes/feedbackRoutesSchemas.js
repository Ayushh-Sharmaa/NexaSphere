import { z } from 'zod';

/**
 * Schema for POST / — Submit feedback for an event.
 */
export const submitFeedbackSchema = z
  .object({
    eventId: z.string().trim().min(1, 'eventId is required'),
    userId: z.string().trim().optional(),
    ratingOverall: z.number().int().min(1).max(5).optional(),
    wouldAttendAgain: z.boolean().optional(),
    recommendFriend: z.boolean().optional(),
    ratingVenue: z.number().int().min(1).max(5).optional(),
    ratingContent: z.number().int().min(1).max(5).optional(),
    ratingSpeaker: z.number().int().min(1).max(5).optional(),
    ratingPace: z.number().int().min(1).max(5).optional(),
    suggestions: z.string().trim().max(2000).optional(),
    bestParts: z.string().trim().max(2000).optional(),
  })
  .strict();

/**
 * Schema for POST /actions — Create an action item from feedback.
 */
export const createActionItemSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required').max(500),
    description: z.string().trim().max(2000).optional(),
    eventId: z.string().trim().min(1, 'eventId is required'),
    assigneeId: z.string().trim().optional(),
    status: z.string().trim().max(50).optional(),
  })
  .strict();
