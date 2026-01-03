import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and Password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: data.user,
        session: data.session,
      },
      { status: 200 }
    );

    // --- KONFIGURASI UNLIMITED ---
    // 100 Tahun dalam detik (secara efektif "unlimited" bagi user)
    const MAX_AGE_UNLIMITED = 60 * 60 * 24 * 365 * 100;

    // Set User Type Cookie
    const userType = data.user.user_metadata?.type || "user";

    response.cookies.set("user-type", userType, {
      httpOnly: true,
      path: "/",
      maxAge: MAX_AGE_UNLIMITED, // Ubah ke unlimited
      sameSite: "lax",
    });

    // Set Auth Cookies
    if (data.session) {
      // Access Token (Meskipun token asli expired 1 jam, cookie-nya kita buat abadi
      // agar middleware bisa membacanya sebelum mencoba refresh)
      response.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        path: "/",
        maxAge: MAX_AGE_UNLIMITED, // Ubah ke unlimited
        sameSite: "lax",
      });

      // Refresh Token (Ini kunci agar user tetap login selamanya)
      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        path: "/",
        maxAge: MAX_AGE_UNLIMITED, // Ubah ke unlimited
        sameSite: "lax",
      });
    }

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: "Internal Server Error", details: err },
      { status: 500 }
    );
  }
}
