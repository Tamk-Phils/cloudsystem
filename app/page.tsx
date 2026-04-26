import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to dashboard (or login later when auth is ready)
  redirect("/dashboard");
}
