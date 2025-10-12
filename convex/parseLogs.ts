import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const create = mutation({
	args: {
		filename: v.string(),
		fileSize: v.number(),
		parseSuccess: v.boolean(),
		parseLog: v.array(v.string()),
		sampleText: v.optional(v.string()),
		confidenceSummary: v.object({ high: v.number(), medium: v.number(), low: v.number() }),
		createdAt: v.number(),
	},
	handler: async (ctx, args) => {
		const id = await ctx.db.insert('parseLogs', {
			...args,
		})
		return { id }
	}
})


