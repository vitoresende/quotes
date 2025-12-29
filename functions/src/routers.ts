
import { publicProcedure, router, protectedProcedure } from "./trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      return { success: true };
    }),
    checkEmailAccess: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .query(async ({ ctx, input }) => {
        const whitelistDoc = await ctx.db.collection('whitelist').doc(input.email).get();
        return { allowed: whitelistDoc.exists };
      }),
  }),

  /**
   * Email whitelist management (admin only)
   */
  whitelist: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user || ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const snapshot = await ctx.db.collection('whitelist').get();
      return snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));
    }),
    add: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await ctx.db.collection('whitelist').doc(input.email).set({
          addedBy: ctx.user.uid,
          addedAt: new Date(),
        });
        return { success: true };
      }),
    remove: protectedProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user || ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await ctx.db.collection('whitelist').doc(input.email).delete();
        return { success: true };
      }),
  }),

  /**
   * Collections management
   */
  collections: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const collectionsSnap = await ctx.db.collection('collections').where('userId', '==', ctx.user.uid).get();
      return collectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const doc = await ctx.db.collection('collections').doc(input.id).get();
        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return { id: doc.id, ...doc.data() };
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
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const { name, description, color } = input;
        const docRef = await ctx.db.collection('collections').add({
          userId: ctx.user.uid,
          name,
          description: description || null,
          color: color || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { id: docRef.id, name, description, color };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional(),
          color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const { id, ...updateData } = input;
        const docRef = ctx.db.collection('collections').doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        await docRef.update({ ...updateData, updatedAt: new Date() });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const docRef = ctx.db.collection('collections').doc(input.id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        await docRef.delete();
        return { success: true };
      }),
  }),

  /**
   * Quotes management
   */
  quotes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const snapshot = await ctx.db.collection('quotes').where('userId', '==', ctx.user.uid).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }),
    listByCollection: protectedProcedure
      .input(z.object({ collectionId: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        // First verify user owns the collection
        const collectionDoc = await ctx.db.collection('collections').doc(input.collectionId).get();
        if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        const snapshot = await ctx.db.collection('quotes').where('userId', '==', ctx.user.uid).where('collectionId', '==', input.collectionId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }),
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const doc = await ctx.db.collection('quotes').doc(input.id).get();
        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return { id: doc.id, ...doc.data() };
      }),
    create: protectedProcedure
      .input(
        z.object({
          collectionId: z.string(),
          text: z.string().min(1),
          source: z.string().optional(),
          author: z.string().optional(),
          pageNumber: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        // Verify collection belongs to user
        const collectionDoc = await ctx.db.collection('collections').doc(input.collectionId).get();
        if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
        }

        const docRef = await ctx.db.collection('quotes').add({
          ...input,
          userId: ctx.user.uid,
          isRead: false,
          readCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return { id: docRef.id, ...input };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.string(),
          text: z.string().min(1).optional(),
          source: z.string().optional(),
          author: z.string().optional(),
          pageNumber: z.number().optional(),
          collectionId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const { id, ...updateData } = input;
        const docRef = ctx.db.collection('quotes').doc(id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // If changing collection, verify new collection belongs to user
        if (updateData.collectionId && updateData.collectionId !== doc.data()?.collectionId) {
          const collectionDoc = await ctx.db.collection('collections').doc(updateData.collectionId).get();
          if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Destination collection not found" });
          }
        }
        
        await docRef.update({ ...updateData, updatedAt: new Date() });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const docRef = ctx.db.collection('quotes').doc(input.id);
        const doc = await docRef.get();
        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await docRef.delete();
        return { success: true };
      }),
    markAsRead: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
        const docRef = ctx.db.collection('quotes').doc(input.id);
        const doc = await docRef.get();

        if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        await docRef.update({ 
          isRead: true,
          lastReadAt: new Date(),
          readCount: (doc.data()?.readCount || 0) + 1
        });
        return { success: true };
      }),
    getRandom: protectedProcedure.query(async ({ ctx }) => {
      // This is more complex in Firestore. A simple approach is to fetch all,
      // but this is inefficient. A better approach for large datasets would be
      // to use a dedicated counter and fetch a random document by index, but for
      // simplicity here, we'll fetch all and do client-side randomization.
      // For very large sets, this should be re-architected.
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const snapshot = await ctx.db.collection('quotes').where('userId', '==', ctx.user.uid).get();
      const quotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (quotes.length === 0) {
        return null;
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
          collectionId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // Verify collection belongs to user
        const collectionDoc = await ctx.db.collection('collections').doc(input.collectionId).get();
        if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
        }

        let added = 0;
        let duplicated = 0;
        
        const quotesCol = ctx.db.collection('quotes');

        for (const highlight of input.highlights) {
            // Check if this highlight already exists for the user
            const existingQuery = await quotesCol
              .where('userId', '==', ctx.user.uid)
              .where('kindleHighlightId', '==', highlight.kindleHighlightId)
              .limit(1)
              .get();

            if (!existingQuery.empty) {
              duplicated++;
              continue;
            }

            // Create the quote
            await quotesCol.add({
              userId: ctx.user.uid,
              collectionId: input.collectionId,
              text: highlight.text,
              source: highlight.source,
              author: highlight.author,
              pageNumber: highlight.pageNumber,
              kindleHighlightId: highlight.kindleHighlightId,
              isRead: false,
              readCount: 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            added++;
        }

        // Log the sync - creating a subcollection under the user
        await ctx.db.collection('users').doc(ctx.user.uid).collection('kindleSyncLog').add({
          syncedAt: new Date(),
          quotesAdded: added,
          quotesDuplicated: duplicated,
          status: 'success',
        });

        return { added, duplicated };
      }),
    getLastSync: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      const snapshot = await ctx.db.collection('users').doc(ctx.user.uid).collection('kindleSyncLog').orderBy('syncedAt', 'desc').limit(1).get();
      if (snapshot.empty) {
        return null;
      }
      return snapshot.docs[0].data();
    }),
  }),
});

export type AppRouter = typeof appRouter;
