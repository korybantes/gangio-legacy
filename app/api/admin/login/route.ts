import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcrypt";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sign } from "jsonwebtoken";

// Admin credentials from environment variables
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
// Hard-code the correct hash for now to ensure it works
const ADMIN_PASSWORD_HASH = "$2b$10$qUfg47cgJ7fio2t76Gso..UavUgBahqcUB4Q4wOjFIe2jOXrkdKSS";
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-fallback-secret-key";

// For debugging
console.log("Admin username:", ADMIN_USERNAME);
console.log("Admin password hash:", ADMIN_PASSWORD_HASH);
console.log("Password to compare against:", "ertacdemm");

export async function POST(req: NextRequest) {
  try {
    // Check if already authenticated as admin
    const session = await getServerSession(authOptions);
    if (session?.user?.isAdmin) {
      return NextResponse.json({ success: true, isAdmin: true });
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if username matches admin username
    if (username !== ADMIN_USERNAME) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await compare(password, ADMIN_PASSWORD_HASH);
    if (!isValid) {
      console.log("Password verification failed");
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create admin token
    const token = sign(
      {
        id: "admin",
        name: "Administrator",
        email: "admin@gangio.app",
        role: "admin",
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie with token
    const response = NextResponse.json({ success: true, isAdmin: true });
    response.cookies.set({
      name: "admin-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 1 day
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
