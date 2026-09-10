import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Path to the favicon PNG file in public folder
    const faviconPath = path.join(process.cwd(), 'public', 'lms-hr-fav.png');

    // Check if file exists
    if (!fs.existsSync(faviconPath)) {
      return new NextResponse('Favicon not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = fs.readFileSync(faviconPath);

    // Return the PNG file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving favicon:', error);
    return new NextResponse('Error serving favicon', { status: 500 });
  }
}
