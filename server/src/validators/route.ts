import { z } from "zod";

export const GeoJSONLineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z
    .array(z.tuple([z.number(), z.number()]))
    .min(2, "At least 2 coordinates required"),
});

export const CreateRouteSchema = z.object({
  name: z.string().min(1),
  geometry: GeoJSONLineStringSchema,
  distance: z.number().positive(),
});

export const UpdateRouteSchema = CreateRouteSchema.partial();

export type CreateRouteInput = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteInput = z.infer<typeof UpdateRouteSchema>;
