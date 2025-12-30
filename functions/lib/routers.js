"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const trpc_1 = require("./trpc");
const server_1 = require("@trpc/server");
const zod_1 = require("zod");
exports.appRouter = (0, trpc_1.router)({
    auth: (0, trpc_1.router)({
        me: trpc_1.publicProcedure.query(opts => opts.ctx.user),
        logout: trpc_1.publicProcedure.mutation(({ ctx }) => {
            return { success: true };
        }),
        checkEmailAccess: trpc_1.publicProcedure
            .input(zod_1.z.object({ email: zod_1.z.string().email() }))
            .query(async ({ ctx, input }) => {
            const whitelistDoc = await ctx.db.collection('whitelist').doc(input.email).get();
            return { allowed: whitelistDoc.exists };
        }),
    }),
    /**
     * Email whitelist management (admin only)
     */
    whitelist: (0, trpc_1.router)({
        getAll: trpc_1.protectedProcedure.query(async ({ ctx }) => {
            if (!ctx.user || ctx.user.role !== "admin") {
                throw new server_1.TRPCError({ code: "FORBIDDEN" });
            }
            const snapshot = await ctx.db.collection('whitelist').get();
            return snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() }));
        }),
        add: trpc_1.protectedProcedure
            .input(zod_1.z.object({ email: zod_1.z.string().email() }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user || ctx.user.role !== "admin") {
                throw new server_1.TRPCError({ code: "FORBIDDEN" });
            }
            await ctx.db.collection('whitelist').doc(input.email).set({
                addedBy: ctx.user.uid,
                addedAt: new Date(),
            });
            return { success: true };
        }),
        remove: trpc_1.protectedProcedure
            .input(zod_1.z.object({ email: zod_1.z.string().email() }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user || ctx.user.role !== "admin") {
                throw new server_1.TRPCError({ code: "FORBIDDEN" });
            }
            await ctx.db.collection('whitelist').doc(input.email).delete();
            return { success: true };
        }),
    }),
    /**
     * Collections management
     */
    collections: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure.query(async ({ ctx }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const collectionsSnap = await ctx.db.collection('collections').where('userId', '==', ctx.user.uid).get();
            return collectionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }),
        get: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.string() }))
            .query(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const doc = await ctx.db.collection('collections').doc(input.id).get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            return { id: doc.id, ...doc.data() };
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            name: zod_1.z.string().min(1).max(255),
            description: zod_1.z.string().optional(),
            color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
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
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.string(),
            name: zod_1.z.string().min(1).max(255).optional(),
            description: zod_1.z.string().optional(),
            color: zod_1.z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const { id, ...updateData } = input;
            const docRef = ctx.db.collection('collections').doc(id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            await docRef.update({ ...updateData, updatedAt: new Date() });
            return { success: true };
        }),
        delete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.string() }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const docRef = ctx.db.collection('collections').doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            await docRef.delete();
            return { success: true };
        }),
    }),
    /**
     * Quotes management
     */
    quotes: (0, trpc_1.router)({
        list: trpc_1.protectedProcedure.query(async ({ ctx }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const snapshot = await ctx.db.collection('quotes').where('userId', '==', ctx.user.uid).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }),
        listByCollection: trpc_1.protectedProcedure
            .input(zod_1.z.object({ collectionId: zod_1.z.string() }))
            .query(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            // First verify user owns the collection
            const collectionDoc = await ctx.db.collection('collections').doc(input.collectionId).get();
            if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            const snapshot = await ctx.db.collection('quotes').where('userId', '==', ctx.user.uid).where('collectionId', '==', input.collectionId).get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }),
        get: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.string() }))
            .query(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const doc = await ctx.db.collection('quotes').doc(input.id).get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            return { id: doc.id, ...doc.data() };
        }),
        create: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            collectionId: zod_1.z.string(),
            text: zod_1.z.string().min(1),
            source: zod_1.z.string().optional(),
            author: zod_1.z.string().optional(),
            pageNumber: zod_1.z.number().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            // Verify collection belongs to user
            const collectionDoc = await ctx.db.collection('collections').doc(input.collectionId).get();
            if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
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
        update: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            id: zod_1.z.string(),
            text: zod_1.z.string().min(1).optional(),
            source: zod_1.z.string().optional(),
            author: zod_1.z.string().optional(),
            pageNumber: zod_1.z.number().optional(),
            collectionId: zod_1.z.string().optional(),
        }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const { id, ...updateData } = input;
            const docRef = ctx.db.collection('quotes').doc(id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            // If changing collection, verify new collection belongs to user
            if (updateData.collectionId && updateData.collectionId !== doc.data()?.collectionId) {
                const collectionDoc = await ctx.db.collection('collections').doc(updateData.collectionId).get();
                if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
                    throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Destination collection not found" });
                }
            }
            await docRef.update({ ...updateData, updatedAt: new Date() });
            return { success: true };
        }),
        delete: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.string() }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const docRef = ctx.db.collection('quotes').doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            await docRef.delete();
            return { success: true };
        }),
        markAsRead: trpc_1.protectedProcedure
            .input(zod_1.z.object({ id: zod_1.z.string() }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const docRef = ctx.db.collection('quotes').doc(input.id);
            const doc = await docRef.get();
            if (!doc.exists || doc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND" });
            }
            await docRef.update({
                isRead: true,
                lastReadAt: new Date(),
                readCount: (doc.data()?.readCount || 0) + 1
            });
            return { success: true };
        }),
        getRandom: trpc_1.protectedProcedure.query(async ({ ctx }) => {
            // This is more complex in Firestore. A simple approach is to fetch all,
            // but this is inefficient. A better approach for large datasets would be
            // to use a dedicated counter and fetch a random document by index, but for
            // simplicity here, we'll fetch all and do client-side randomization.
            // For very large sets, this should be re-architected.
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
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
    kindle: (0, trpc_1.router)({
        sync: trpc_1.protectedProcedure
            .input(zod_1.z.object({
            highlights: zod_1.z.array(zod_1.z.object({
                text: zod_1.z.string(),
                source: zod_1.z.string().optional(),
                author: zod_1.z.string().optional(),
                pageNumber: zod_1.z.number().optional(),
                kindleHighlightId: zod_1.z.string(),
            })),
            collectionId: zod_1.z.string(),
        }))
            .mutation(async ({ ctx, input }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            // Verify collection belongs to user
            const collectionDoc = await ctx.db.collection('collections').doc(input.collectionId).get();
            if (!collectionDoc.exists || collectionDoc.data()?.userId !== ctx.user.uid) {
                throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
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
        getLastSync: trpc_1.protectedProcedure.query(async ({ ctx }) => {
            if (!ctx.user)
                throw new server_1.TRPCError({ code: "UNAUTHORIZED" });
            const snapshot = await ctx.db.collection('users').doc(ctx.user.uid).collection('kindleSyncLog').orderBy('syncedAt', 'desc').limit(1).get();
            if (snapshot.empty) {
                return null;
            }
            return snapshot.docs[0].data();
        }),
    }),
});
//# sourceMappingURL=routers.js.map