import { z } from 'zod';

export const customFunnelSchema = z
  .object({
    steps: z.array(z.string().trim().min(1)).min(2, 'At least 2 funnel steps are required'),
  })
  .strict();

export const saveReportSchema = z
  .object({
    name: z.string().trim().min(1, 'Report name is required'),
    description: z.string().trim().optional(),
    config: z.any().optional(),
    scheduleType: z.string().trim().optional(),
  })
  .strict();

export const executeReportSchema = z
  .object({
    metric: z.string().trim().min(1, 'Metric is required'),
    timeRange: z.any().optional(),
  })
  .strict();
