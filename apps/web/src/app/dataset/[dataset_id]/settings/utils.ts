import { z } from 'zod'

export const FormSchema = z.object({
  name: z
    .string()
    .nonempty('Dataset name is required.')
    .max(50, { message: 'Dataset name must be less than 50 characters.' }),
  loaderType: z.string().optional(),
  splitType: z.string().optional(),
  embeddingType: z.string().optional(),
  files: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.string(),
        uid: z.string(),
      })
    )
    .optional(),
  chunkSize: z.number().optional(),
  chunkOverlap: z.number().optional(),
  storeType: z.string().optional(),
  collectionName: z.string().optional(),
  chromaUrl: z.string().optional(),
  apiKey: z.string().optional(),
  instanceName: z.string().optional(),
  developmentName: z.string().optional(),
  apiVersion: z.string().optional(),
})
