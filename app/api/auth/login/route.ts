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

    // --- FIX IS HERE ---
    // We must return 'session' so the client can use it
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: data.user,
        session: data.session, // <--- Add this back!
      },
      { status: 200 }
    );

    // Set User Type Cookie for Middleware
    const userType = data.user.user_metadata?.type || "user";

    console.log(data, "ini typenya");

    response.cookies.set("user-type", userType, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    // Optional: Set auth tokens in cookies if needed for middleware
    if (data.session) {
      response.cookies.set("sb-access-token", data.session.access_token, {
        httpOnly: true,
        path: "/",
        maxAge: data.session.expires_in,
        sameSite: "lax",
      });

      response.cookies.set("sb-refresh-token", data.session.refresh_token, {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
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
