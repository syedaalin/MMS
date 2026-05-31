CREATE TABLE "collections" (
	"name" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "objects" (
	"key" text PRIMARY KEY NOT NULL,
	"data" text NOT NULL
);
