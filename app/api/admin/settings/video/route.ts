import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, requireRole, verifyAccessToken } from "@/lib/auth";

const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;

function ensureAdmin(request: NextRequest): NextResponse | null {
  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: "Missing token." }, { status: 401 });
  }

  try {
    const payload = verifyAccessToken(token);
    if (!requireRole(payload, "ADMIN")) {
      return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    return null;
  } catch {
    return NextResponse.json({ message: "Invalid token." }, { status: 401 });
  }
}

function getFileExtensionFromType(type: string): string | null {
  if (type === "video/mp4") return "mp4";
  if (type === "video/webm") return "webm";
  if (type === "video/ogg") return "ogv";
  return null;
}

export async function POST(request: NextRequest) {
  const authError = ensureAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const formData = await request.formData();
    const entry = formData.get("video");

    if (!(entry instanceof File)) {
      return NextResponse.json({ message: "Missing video file." }, { status: 400 });
    }

    if (!entry.type.startsWith("video/")) {
      return NextResponse.json({ message: "Only video files are allowed." }, { status: 400 });
    }

    if (entry.size <= 0 || entry.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        { message: "Video must be between 1 byte and 25MB." },
        { status: 400 },
      );
    }

    const extension = getFileExtensionFromType(entry.type);
    if (!extension) {
      return NextResponse.json({ message: "Use MP4, WebM, or OGG video." }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const filename = `landing-video.${extension}`;
    const outputPath = path.join(uploadsDir, filename);

    const bytes = await entry.arrayBuffer();
    await writeFile(outputPath, Buffer.from(bytes));

    const videoUrl = `/uploads/${filename}?v=${Date.now()}`;
    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Failed to upload video." }, { status: 500 });
  }
}
