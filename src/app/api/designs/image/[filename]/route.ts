/**
 * Serve scraped design images
 * GET /api/designs/image/[filename]
 */

import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const IMAGES_DIR = path.join(process.cwd(), 'data', 'scraped', 'images')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Security: prevent directory traversal
  const safeName = path.basename(filename)
  const filepath = path.join(IMAGES_DIR, safeName)

  if (!fs.existsSync(filepath)) {
    return new NextResponse('Image not found', { status: 404 })
  }

  const ext = path.extname(safeName).toLowerCase()
  const contentType = ext === '.png' ? 'image/png' :
                      ext === '.webp' ? 'image/webp' :
                      'image/jpeg'

  const imageBuffer = fs.readFileSync(filepath)

  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, immutable',
    },
  })
}
