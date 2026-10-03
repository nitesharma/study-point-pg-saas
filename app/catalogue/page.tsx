import { redirect } from "next/navigation";

// The catalogue now lives on the home page.
export default function CatalogueIndex() {
  redirect("/");
}
