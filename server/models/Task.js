import mongoose from "mongoose";

// Task status values - single source of truth for all Task models
export const TASK_STATUSES = ["Todo", "In_Progress", "Review", "Done"];

const activityLogSchema = new mongoose.Schema(
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
  { _id: false }
);

const taskSchema = new mongoose.Schema(
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
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    activityLog: [activityLogSchema],
  },
  { timestamps: true }
);

taskSchema.index({ teamRoomId: 1, status: 1 });

export default mongoose.model("Task", taskSchema);
