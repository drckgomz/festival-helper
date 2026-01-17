// src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * FESTIVALS
 */
export const festivals = pgTable(
  "festivals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    city: text("city"),
    timezone: text("timezone").notNull().default("America/Chicago"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugUnique: uniqueIndex("festivals_slug_unique").on(t.slug),
  })
);

/**
 * FESTIVAL DAYS (Option B)
 * Explicit “days the festival runs”, supports gaps (ACL weekends).
 */

export const festivalDays = pgTable(
  "festival_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),

    dayDate: date("day_date").notNull(),
    label: text("label"),

    // ✅ add these
    groupKey: text("group_key"),       // ex: "w1", "w2"
    groupLabel: text("group_label"),   // ex: "WEEKEND ONE", "WEEKEND TWO"

    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalIdIdx: index("festival_days_festival_id_idx").on(t.festivalId),
    activeIdx: index("festival_days_active_idx").on(t.festivalId, t.isActive),
    // optional: grouping index helps querying/sorting later
    groupIdx: index("festival_days_group_idx").on(t.festivalId, t.groupKey, t.sortOrder),
  })
);


/**
 * STAGES
 */
export const stages = pgTable(
  "stages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalStageUnique: uniqueIndex("stages_festival_id_name_unique").on(t.festivalId, t.name),
    festivalIdIdx: index("stages_festival_id_idx").on(t.festivalId),
  })
);

/**
 * ARTISTS
 */
export const artists = pgTable(
  "artists",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    spotifyUrl: text("spotify_url"),
    websiteUrl: text("website_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: index("artists_name_idx").on(t.name),
  })
);

/**
 * USERS (linked to Clerk)
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    clerkUserIdUnique: uniqueIndex("users_clerk_user_id_unique").on(t.clerkUserId),
  })
);

/**
 * SETS / PERFORMANCES
 */
export const sets = pgTable(
  "sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),
    stageId: uuid("stage_id").references(() => stages.id, { onDelete: "set null" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    dayLabel: text("day_label"), // optional: "Friday", "W1-Sat", etc.
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalTimeIdx: index("sets_festival_time_idx").on(t.festivalId, t.startsAt),
    artistTimeIdx: index("sets_artist_time_idx").on(t.artistId, t.startsAt),
  })
);

/**
 * USER FAVORITES PER FESTIVAL
 */
export const userFestivalArtistFavorites = pgTable(
  "user_festival_artist_favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueFavorite: uniqueIndex("ufa_unique").on(t.userId, t.festivalId, t.artistId),
    festivalIdx: index("ufa_festival_idx").on(t.festivalId),
    userIdx: index("ufa_user_idx").on(t.userId),
  })
);

/**
 * GROUP PLANNING
 */
export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    joinCode: text("join_code").notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    joinCodeUnique: uniqueIndex("groups_join_code_unique").on(t.joinCode),
    festivalIdx: index("groups_festival_idx").on(t.festivalId),
  })
);

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueMember: uniqueIndex("group_members_unique").on(t.groupId, t.userId),
    groupIdx: index("group_members_group_idx").on(t.groupId),
    userIdx: index("group_members_user_idx").on(t.userId),
  })
);

/* ===========================
   RELATIONS (defined after)
   =========================== */

export const festivalsRelations = relations(festivals, ({ many }) => ({
  days: many(festivalDays),
  stages: many(stages),
  sets: many(sets),
  favorites: many(userFestivalArtistFavorites),
  groups: many(groups),
}));

export const festivalDaysRelations = relations(festivalDays, ({ one }) => ({
  festival: one(festivals, { fields: [festivalDays.festivalId], references: [festivals.id] }),
}));

export const stagesRelations = relations(stages, ({ one, many }) => ({
  festival: one(festivals, { fields: [stages.festivalId], references: [festivals.id] }),
  sets: many(sets),
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  sets: many(sets),
  favorites: many(userFestivalArtistFavorites),
}));

export const usersRelations = relations(users, ({ many }) => ({
  favorites: many(userFestivalArtistFavorites),
  groupMembers: many(groupMembers),
}));

export const setsRelations = relations(sets, ({ one }) => ({
  festival: one(festivals, { fields: [sets.festivalId], references: [festivals.id] }),
  stage: one(stages, { fields: [sets.stageId], references: [stages.id] }),
  artist: one(artists, { fields: [sets.artistId], references: [artists.id] }),
}));

export const userFestivalArtistFavoritesRelations = relations(
  userFestivalArtistFavorites,
  ({ one }) => ({
    user: one(users, { fields: [userFestivalArtistFavorites.userId], references: [users.id] }),
    festival: one(festivals, {
      fields: [userFestivalArtistFavorites.festivalId],
      references: [festivals.id],
    }),
    artist: one(artists, {
      fields: [userFestivalArtistFavorites.artistId],
      references: [artists.id],
    }),
  })
);

export const groupsRelations = relations(groups, ({ one, many }) => ({
  festival: one(festivals, { fields: [groups.festivalId], references: [festivals.id] }),
  createdBy: one(users, { fields: [groups.createdByUserId], references: [users.id] }),
  members: many(groupMembers),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));
