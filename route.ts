// app/api/login/route.ts
import { NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app"; // 🔑 Modern flat sub-modules
import { getAuth } from "firebase-admin/auth";                   // 🔑 Direct sub-module auth
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "No identity token provided." }, { status: 400 });
    }

    // 1. 🔥 MODERN MODULAR INITIALIZATION (pnpm Monorepo Resilient)
    // getApps() safely checks active instances without relying on parent object structures
    if (getApps().length === 0) {
      const keyPath = path.resolve(process.cwd(), "secrets/firebase-service-account.json");
      
      if (fs.existsSync(keyPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
        
        initializeApp({
          credential: cert(serviceAccount), // 🛡️ Directly imported 'cert' primitive
          projectId: serviceAccount.project_id,
        });
        console.log("🚀 Firebase Admin Modular Engine initialized cleanly in workspace.");
      } else {
        initializeApp({ projectId: "jubilee-command-center---dev" });
      }
    }

    // 2. 🔐 VERIFY THE TOKEN AGAINST GOOGLE'S SERVERS
    // Call getAuth() directly from its dedicated entrypoint
    const decodedToken = await getAuth().verifyIdToken(idToken);
    
    return NextResponse.json({ 
      success: true, 
      uid: decodedToken.uid,
      email: decodedToken.email 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Token Verification Crash:", error.message);
    return NextResponse.json({ error: "Server rejected identity exchange token verification." }, { status: 401 });
  }
}