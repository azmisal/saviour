import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Vault from "@/models/Vault";
import { verifyToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    // 1. auth check
    const token = req.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // 2. read request body
    const body = await req.json();

    const { type, website, username, email, title, filename, data, iv } = body;

    if (!type || !data || !iv) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. create vault entry
    const entry = await Vault.create({
      userId: user.id,
      type,

      website,
      username,
      email,

      title,
      filename,

      data,
      iv,
    });

    // 4. response
    return NextResponse.json(
      {
        message: "Saved successfully",
        id: entry._id,
      },
      { status: 201 }
    );

  } catch (err) {
    console.error("Vault save error:", err);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // -------------------------
    // AUTH
    // -------------------------
    const token = req.cookies.get("accessToken")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = verifyToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // -------------------------
    // QUERY TYPE FILTER
    // -------------------------
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (!type) {
      return NextResponse.json(
        { error: "Type is required" },
        { status: 400 }
      );
    }

    // -------------------------
    // FETCH FROM DB
    // -------------------------
    const items = await Vault.find({
      userId: user.id,
      type,
    }).sort({ createdAt: -1 });

    return NextResponse.json({ items });

  } catch (err) {
    console.error("Vault GET error:", err);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}