"use server";

import { cookies } from "next/headers";

export async function setLocale(locale: string) {
  const store = await cookies();

  store.set("locale", locale, {
    path: "/",
    sameSite: "lax",
  });
}
