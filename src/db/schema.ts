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

    groupKey: text("group_key"), // ex: "w1", "w2"
    groupLabel: text("group_label"), // ex: "WEEKEND ONE", "WEEKEND TWO"

    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalIdIdx: index("festival_days_festival_id_idx").on(t.festivalId),
    activeIdx: index("festival_days_active_idx").on(t.festivalId, t.isActive),
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
 * USER PREFERENCES (per-user app settings)
 * - store non-security preferences here
 * - keep "status" here if you want (active/suspended/etc.)
 */
export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    status: text("status").notNull().default("active"), // active | suspended | invited | etc.
    timezone: text("timezone").default("America/Chicago"),
    notifyEmail: boolean("notify_email").notNull().default(true),
    notifyPush: boolean("notify_push").notNull().default(false),

    defaultFestivalId: uuid("default_festival_id").references(() => festivals.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    defaultFestivalIdx: index("user_preferences_default_festival_idx").on(t.defaultFestivalId),
    statusIdx: index("user_preferences_status_idx").on(t.status),
  })
);

/**
 * FESTIVAL ADMINS (per-festival roles, plus optional global superadmin audit)
 * This is your DB mirror for auditing + joins.
 *
 * Role meanings (suggestion):
 * - "owner": can manage admins + everything for that festival
 * - "admin": can manage content for that festival
 * - "editor": can edit sets/stages/days but not admins/publish
 * - "viewer": read-only
 *
 * NOTE: Global superadmin should still live in Clerk metadata as the source of truth.
 * If you want to audit it in DB too, log it in roleAuditLog below.
 */
export const festivalAdmins = pgTable(
  "festival_admins",
  {
    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    role: text("role").notNull().default("admin"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),

    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (t) => ({
    pk: uniqueIndex("festival_admins_pkey").on(t.festivalId, t.userId),
    festivalIdx: index("festival_admins_festival_id_idx").on(t.festivalId),
    userIdx: index("festival_admins_user_id_idx").on(t.userId),
  })
);


/**
 * ROLE AUDIT LOG
 * Records changes to roles (festival-scoped or global).
 *
 * - Use festivalId = null for global superadmin changes
 * - "actorUserId" = who performed the change
 * - "targetUserId" = whose role changed
 */
export const roleAuditLog = pgTable(
  "role_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    targetUserId: uuid("target_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    festivalId: uuid("festival_id").references(() => festivals.id, { onDelete: "cascade" }),

    action: text("action").notNull(),
    prevRole: text("prev_role"),
    nextRole: text("next_role"),

    source: text("source").notNull().default("app"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalIdx: index("role_audit_festival_idx").on(t.festivalId),
    actorIdx: index("role_audit_actor_idx").on(t.actorUserId),
    targetIdx: index("role_audit_target_idx").on(t.targetUserId),
    createdIdx: index("role_audit_created_idx").on(t.createdAt),
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
    dayLabel: text("day_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalTimeIdx: index("sets_festival_time_idx").on(t.festivalId, t.startsAt),
    artistTimeIdx: index("sets_artist_time_idx").on(t.artistId, t.startsAt),
  })
);

/**
 * FESTIVAL LOCATIONS
 * - Unified “map pins” system for stages, merch booths, restrooms, entrances, etc.
 */
export const festivalLocations = pgTable(
  "festival_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    festivalId: uuid("festival_id")
      .notNull()
      .references(() => festivals.id, { onDelete: "cascade" }),

    // Display
    name: text("name").notNull(),
    type: text("type").notNull().default("stage"),
    description: text("description"),

    // Grouping / sections (ex: "Main Grounds", "VIP", "East Side")
    groupKey: text("group_key"),
    groupLabel: text("group_label"),

    // Ordering in lists
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),

    // GPS (decimal degrees). Keep as text-friendly numeric precision.
    lat: text("lat"), // store as string "30.2672"
    lng: text("lng"), // store as string "-97.7431"

    // Optional extra metadata (ex: vendor, hours, etc.)
    meta: text("meta"), // JSON string if you want later

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    festivalIdx: index("festival_locations_festival_idx").on(t.festivalId),
    typeIdx: index("festival_locations_type_idx").on(t.festivalId, t.type),
    groupIdx: index("festival_locations_group_idx").on(t.festivalId, t.groupKey, t.sortOrder),
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
   RELATIONS
   =========================== */

export const festivalsRelations = relations(festivals, ({ many }) => ({
  days: many(festivalDays),
  stages: many(stages),
  sets: many(sets),
  favorites: many(userFestivalArtistFavorites),
  groups: many(groups),
  admins: many(festivalAdmins),
  roleAudit: many(roleAuditLog),

  locations: many(festivalLocations),
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

export const usersRelations = relations(users, ({ many, one }) => ({
  favorites: many(userFestivalArtistFavorites),
  groupMembers: many(groupMembers),
  preferences: one(userPreferences, { fields: [users.id], references: [userPreferences.userId] }),
  festivalAdminRoles: many(festivalAdmins),
  actedRoleAudits: many(roleAuditLog, { relationName: "roleAudit_actor" }),
  targetRoleAudits: many(roleAuditLog, { relationName: "roleAudit_target" }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
  defaultFestival: one(festivals, {
    fields: [userPreferences.defaultFestivalId],
    references: [festivals.id],
  }),
}));

export const festivalAdminsRelations = relations(festivalAdmins, ({ one }) => ({
  festival: one(festivals, { fields: [festivalAdmins.festivalId], references: [festivals.id] }),
  user: one(users, { fields: [festivalAdmins.userId], references: [users.id] }),
  createdBy: one(users, { fields: [festivalAdmins.createdByUserId], references: [users.id] }),
}));



export const roleAuditLogRelations = relations(roleAuditLog, ({ one }) => ({
  festival: one(festivals, { fields: [roleAuditLog.festivalId], references: [festivals.id] }),
  actor: one(users, {
    relationName: "roleAudit_actor",
    fields: [roleAuditLog.actorUserId],
    references: [users.id],
  }),
  target: one(users, {
    relationName: "roleAudit_target",
    fields: [roleAuditLog.targetUserId],
    references: [users.id],
  }),
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
