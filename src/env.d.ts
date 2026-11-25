/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import('./lib/supabase').DB;
    user: import('@supabase/supabase-js').User | null;
    me: import('./lib/data').MemberRow | null;
  }
}
