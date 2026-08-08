/**
 * Task Model (Backend)
 *
 * This model is deprecated. The canonical Task model is defined in:
 * - server/models/Task.js (Mongoose/MongoDB)
 * - prisma/schema.prisma (Prisma/PostgreSQL)
 *
 * This file is kept for backward compatibility with existing imports.
 * Please migrate to using Prisma for new code.
 */

const mongoose = require("mongoose");

// Task status values - must match server/models/Task.js and validationMiddleware.js
const TASK_STATUSES = ["Todo", "In_Progress", "Review", "Done"];

// Task priority values
const TASK_PRIORITIES = ["low", "medium", "high"];

const TaskSchema = new mongoose.Schema(
  {
    teamRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamRoom",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "Todo",
      index: true,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: "medium",
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    activityLog: [
      {
        fromStatus: {
          type: String,
          enum: TASK_STATUSES,
        },
        toStatus: {
          type: String,
          enum: TASK_STATUSES,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Compound index for common queries
TaskSchema.index({ teamRoomId: 1, status: 1 });

// Export constants for use elsewhere
module.exports = mongoose.model("Task", TaskSchema);
module.exports.TASK_STATUSES = TASK_STATUSES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
