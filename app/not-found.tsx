import { redirect } from "next/navigation";

/**
 * Handle 404 Not Found - Automatically redirect to homepage
 * This is useful for migrating from old systems (like WordPress) 
 * to ensure users don't land on dead pages.
 */
export default function NotFound() {
  redirect("/");
}
