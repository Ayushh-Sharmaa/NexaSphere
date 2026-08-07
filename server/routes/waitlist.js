import { Router } from "express";
import { validate } from "../middleware/validate.js";
import {
  joinWaitlistSchema,
  autoEnrollSchema,
  setDeadlineSchema,
} from "../validators/routes/waitlistSchemas.js";
