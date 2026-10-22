import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role') THEN
       CREATE TYPE "public"."enum_users_role" AS ENUM('author', 'editor', 'admin');
     END IF;
   END $$;

   ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "enum_users_role" DEFAULT 'author' NOT NULL;

   DO $$ BEGIN
     ALTER TYPE "public"."enum_posts_status" ADD VALUE IF NOT EXISTS 'in_review';
     ALTER TYPE "public"."enum_posts_status" ADD VALUE IF NOT EXISTS 'archived';
   EXCEPTION
     WHEN duplicate_object THEN null;
   END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" DROP COLUMN IF EXISTS "role";
   DROP TYPE IF EXISTS "public"."enum_users_role";
  `)
}
