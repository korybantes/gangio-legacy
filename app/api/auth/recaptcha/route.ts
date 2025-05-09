import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";

// Apply the same timeout pattern we used for server fetching
const VERIFY_TIMEOUT_MS = 5000;

export async function POST(req: NextRequest) {
  try {
    // Set a timeout for the entire API call to prevent Vercel function timeouts
    const apiTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('reCAPTCHA verification timeout')), VERIFY_TIMEOUT_MS);
    });
    
    // Wrap verification in a promise that can be raced against the timeout
    const verifyPromise = async () => {
      const body = await req.json();
      const { token } = body;
      
      if (!token) {
        return { success: false, error: "reCAPTCHA token is required" };
      }
      
      // Get reCAPTCHA secret key from environment variables or database
      let secretKey = process.env.RECAPTCHA_SECRET_KEY;
      
      // If not available in environment, try to get from database
      if (!secretKey) {
        const db = await connectToDatabase();
        const settings = await db.collection("settings").findOne({ type: "site" });
        
        if (!settings?.recaptchaSecretKey) {
          console.error("reCAPTCHA secret key not found in environment or database");
          return { success: false, error: "reCAPTCHA configuration error" };
        }
        
        secretKey = settings.recaptchaSecretKey;
      }
      
      // Fallback to hardcoded key if all else fails
      if (!secretKey) {
        secretKey = "6Lfv3DMrAAAAAGrO2sFmbq-goszIaQ06miX3r6wB";
        console.warn("Using fallback reCAPTCHA secret key");
      }
      
      // Verify token with Google reCAPTCHA API
      const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${secretKey}&response=${token}`,
      });
      
      const data = await response.json();
      
      return { success: data.success, score: data.score };
    };
    
    // Race the verification against the timeout
    const result = await Promise.race([verifyPromise(), apiTimeoutPromise]);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify reCAPTCHA" },
      { status: 500 }
    );
  }
}
