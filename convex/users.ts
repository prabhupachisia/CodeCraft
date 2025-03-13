import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const syncUser = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!existingUser) {
      await ctx.db.insert("users", {
        userId: args.userId,
        email: args.email,
        name: args.name,
        isPro: false,
      });
    }
  },
});

export const getUser = query({
  args: { userId: v.string() },

  handler: async (ctx, args) => {
    if (!args.userId) return null;

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId)) // FIXED `.withIndex()`
      .first();

    return user || null;
  },
});

export const upgradeToPro = mutation({
  args: {
    email: v.string(),
    lemonSqueezyCustomerId: v.string(),
    lemonSqueezyOrderId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      isPro: true,
      proSince: Date.now(),
      lemonSqueezyCustomerId: args.lemonSqueezyCustomerId,
      lemonSqueezyOrderId: args.lemonSqueezyOrderId,
    });

    return { success: true };
  },
});

export const storeUser = mutation({
  args: {}, // No args needed, user info comes from Clerk
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity(); // Get user from Clerk

    if (!identity) throw new Error("Not authenticated");

    // Check if user already exists in Convex DB
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), identity.subject))
      .first();

    if (existingUser) {
      console.log("User already exists:", existingUser);
      return existingUser;
    }

    // Create new user in Convex
    const newUser = await ctx.db.insert("users", {
      userId: identity.subject, // Clerk user ID
      email: identity.email ?? "", // Optional email
      name: identity.name ?? "Anonymous",
      isPro: false, // Default value
      proSince: undefined, // FIXED: Use `undefined` instead of `null`
      lemonSqueezyCustomerId: undefined, // FIXED: Use `undefined`
      lemonSqueezyOrderId: undefined, // FIXED: Use `undefined`
    });

    console.log("New user created:", newUser);
    return newUser;
  },
});
