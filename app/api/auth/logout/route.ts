import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // 🔥 HAPUS SEMUA AUTH COOKIE
  res.cookies.set("sb-access-token", "", {
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("sb-refresh-token", "", {
    path: "/",
    maxAge: 0,
  });

  res.cookies.set("user-type", "", {
    path: "/",
    maxAge: 0,
  });

  return res;
}
