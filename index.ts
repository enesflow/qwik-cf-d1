import type { RequestEventBase } from "@builder.io/qwik-city";
import type { D1Database } from "@cloudflare/workers-types";

export function getDB(e: RequestEventBase): D1Database | undefined {
  if (e.sharedMap.has("db")) {
    return e.sharedMap.get("db");
  }
  const DB = e.platform.env?.DB;
  e.sharedMap.set("db", DB);
  return DB;
}

// Generic query function
export async function runQuery<TResult>(
  e: RequestEventBase,
  dbGetter: (e: RequestEventBase) => any, // Function to get the database instance
  query: string, 
  params: any[] = [] // Array of query parameters
): Promise<TResult[] | undefined> {
  const db = dbGetter(e);
  if (!db) return undefined;

  // Assuming your database library has a way to execute parameterized queries
  const result = await db.prepare(query).bind(...params).all(); 

  return result as TResult[]; // Type assertion, adjust if needed based on your database library
}

// Example usage with your URL shortener (replace ... with your actual Zod schemas)
import { z } from "zod";

const UrlSchema = z.object({ ... }); 

export async function getUrls(e: RequestEventBase): Promise<z.infer<typeof UrlSchema>[] | undefined> {
  return runQuery(e, getDB, 'SELECT * FROM urls');
}

export async function insertUrl(e: RequestEventBase, urlData: z.infer<typeof UrlSchema>): Promise<void> {
  await runQuery(
    e, 
    getDB, 
    'INSERT INTO urls (original_url, short_code, description, password) VALUES (?, ?, ?, ?)', 
    [urlData.original_url, urlData.short_code, urlData.description, urlData.password]
  );
}
