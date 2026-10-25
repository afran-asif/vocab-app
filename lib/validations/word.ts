import { z } from "zod";

export const wordSchema = z.object({
  term: z.string().trim().min(1, "শব্দ লিখো").max(100),
  meaning: z.string().trim().max(500).optional(),
  example: z.string().trim().max(500).optional(),
  meaningBn: z.string().trim().min(1, "অর্থ লিখো").max(500),
  partOfSpeech: z.string().trim().max(50).optional(),
  pronunciation: z.string().trim().max(100).optional(),
  tags: z.string().trim().max(200).optional(),
});

export type WordInput = z.infer<typeof wordSchema>;