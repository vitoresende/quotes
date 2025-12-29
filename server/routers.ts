import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  isEmailWhitelisted,
  addEmailToWhitelist,
  removeEmailFromWhitelist,
  getAllWhitelistedEmails,
  createCollection,
  getUserCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  createQuote,
  getUserQuotes,
  getQuotesByCollection,
  getQuote,
  updateQuote,
  deleteQuote,
  markQuoteAsRead,
  getQuoteByKindleHighlightId,
  logKindleSync,
  getLatestSyncLog,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    checkEmailAccess: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ input }) => {
        const isWhitelisted = await isEmailWhitelisted(input.email);
        return { allowed: isWhitelisted };
      }),
  }),

  /**
   * Email whitelist management (admin only)
   */
  whitelist: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getAllWhitelistedEmails();
    }),
    add: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await addEmailToWhitelist(input.email, ctx.user.id);
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await removeEmailFromWhitelist(input.email);
        return { success: true };
      }),
  }),

  /**
   * Collections management
   */
  collections: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserCollections(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const collection = await getCollection(input.id);
        if (!collection || collection.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return collection;
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createCollection({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          color: input.color,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const collection = await getCollection(input.id);
        if (!collection || collection.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await updateCollection(input.id, {
          name: input.name,
          description: input.description,
          color: input.color,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const collection = await getCollection(input.id);
        if (!collection || collection.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await deleteCollection(input.id);
        return { success: true };
      }),
  }),

  /**
   * Quotes management
   */
  quotes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserQuotes(ctx.user.id);
    }),
    listByCollection: protectedProcedure
      .input(z.object({ collectionId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getQuotesByCollection(ctx.user.id, input.collectionId);
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const quote = await getQuote(input.id);
        if (!quote || quote.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return quote;
      }),
    create: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          text: z.string().min(1),
          source: z.string().optional(),
          author: z.string().optional(),
          pageNumber: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify collection belongs to user
        const collection = await getCollection(input.collectionId);
        if (!collection || collection.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
        }

        return createQuote({
          userId: ctx.user.id,
          collectionId: input.collectionId,
          text: input.text,
          source: input.source,
          author: input.author,
          pageNumber: input.pageNumber,
        });
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          text: z.string().min(1).optional(),
          source: z.string().optional(),
          author: z.string().optional(),
          pageNumber: z.number().optional(),
          collectionId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const quote = await getQuote(input.id);
        if (!quote || quote.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // If changing collection, verify new collection belongs to user
        if (input.collectionId && input.collectionId !== quote.collectionId) {
          const collection = await getCollection(input.collectionId);
          if (!collection || collection.userId !== ctx.user.id) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
          }
        }

        await updateQuote(input.id, {
          text: input.text,
          source: input.source,
          author: input.author,
          pageNumber: input.pageNumber,
          collectionId: input.collectionId,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const quote = await getQuote(input.id);
        if (!quote || quote.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await deleteQuote(input.id);
        return { success: true };
      }),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const quote = await getQuote(input.id);
        if (!quote || quote.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await markQuoteAsRead(input.id);
        return { success: true };
      }),
    getRandom: protectedProcedure.query(async ({ ctx }) => {
      const quotes = await getUserQuotes(ctx.user.id);
      if (quotes.length === 0) {
        return null;
      }

      // Smart randomization: weight unread quotes higher
      // Unread quotes get 3x weight, read quotes get 1x weight
      const weighted = quotes.map(q => ({
        quote: q,
        weight: q.isRead ? 1 : 3,
      }));

      const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
      let random = Math.random() * totalWeight;

      for (const item of weighted) {
        random -= item.weight;
        if (random <= 0) {
          return item.quote;
        }
      }

      return quotes[Math.floor(Math.random() * quotes.length)];
    }),
  }),

  /**
   * Kindle synchronization
   */
  kindle: router({
    sync: protectedProcedure
      .input(
        z.object({
          highlights: z.array(
            z.object({
              text: z.string(),
              source: z.string().optional(),
              author: z.string().optional(),
              pageNumber: z.number().optional(),
              kindleHighlightId: z.string(),
            })
          ),
          collectionId: z.number(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify collection belongs to user
        const collection = await getCollection(input.collectionId);
        if (!collection || collection.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
        }

        let added = 0;
        let duplicated = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const highlight of input.highlights) {
          try {
            // Check if this highlight already exists
            const existing = await getQuoteByKindleHighlightId(ctx.user.id, highlight.kindleHighlightId);
            if (existing) {
              duplicated++;
              continue;
            }

            // Create the quote
            await createQuote({
              userId: ctx.user.id,
              collectionId: input.collectionId,
              text: highlight.text,
              source: highlight.source,
              author: highlight.author,
              pageNumber: highlight.pageNumber,
              kindleHighlightId: highlight.kindleHighlightId,
            });
            added++;
          } catch (error) {
            skipped++;
            errors.push(`Failed to add highlight: ${String(error)}`);
          }
        }

        // Log the sync
        await logKindleSync({
          userId: ctx.user.id,
          quotesAdded: added,
          quotesDuplicated: duplicated,
          quotesSkipped: skipped,
          status: errors.length === 0 ? "success" : "partial",
          errorMessage: errors.length > 0 ? errors.join("; ") : undefined,
        });

        return {
          added,
          duplicated,
          skipped,
          errors,
        };
      }),
    getLastSync: protectedProcedure.query(async ({ ctx }) => {
      return getLatestSyncLog(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
