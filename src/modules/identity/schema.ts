import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "sales",
  "operations",
  "finance",
  "management",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  // Rol provisional; irrelevante mientras is_active=false. La activación
  // y el rol real los asigna un admin. El primer admin entra activo vía
  // INITIAL_ADMIN_EMAIL (ver users-repository).
  role: userRoleEnum("role").notNull().default("sales"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
