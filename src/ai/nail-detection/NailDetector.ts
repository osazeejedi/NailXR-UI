/**
 * Nail Detection from MediaPipe Hand Landmarks
 * Calculates nail regions from hand landmarks for precise segmentation
 */

export interface NailRegion {
  fingerId: number
  fingerName: string
  center: { x: number; y: number }
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  landmarks: {
    tip: { x: number; y: number }
    dip: { x: number; y: number }
    pip: { x: number; y: number }
    mcp: { x: number; y: number }
  }
  rotation: number
  confidence: number
}

export interface HandLandmark {
  x: number
  y: number
  z?: number
}

// MediaPipe Hand landmark indices
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20
}

export const FINGERS = [
  {
    id: 0,
    name: 'Thumb',
    landmarks: {
      tip: HAND_LANDMARKS.THUMB_TIP,
      dip: HAND_LANDMARKS.THUMB_IP,
      pip: HAND_LANDMARKS.THUMB_MCP,
      mcp: HAND_LANDMARKS.THUMB_CMC
    }
  },
  {
    id: 1,
    name: 'Index',
    landmarks: {
      tip: HAND_LANDMARKS.INDEX_FINGER_TIP,
      dip: HAND_LANDMARKS.INDEX_FINGER_DIP,
      pip: HAND_LANDMARKS.INDEX_FINGER_PIP,
      mcp: HAND_LANDMARKS.INDEX_FINGER_MCP
    }
  },
  {
    id: 2,
    name: 'Middle',
    landmarks: {
      tip: HAND_LANDMARKS.MIDDLE_FINGER_TIP,
      dip: HAND_LANDMARKS.MIDDLE_FINGER_DIP,
      pip: HAND_LANDMARKS.MIDDLE_FINGER_PIP,
      mcp: HAND_LANDMARKS.MIDDLE_FINGER_MCP
    }
  },
  {
    id: 3,
    name: 'Ring',
    landmarks: {
      tip: HAND_LANDMARKS.RING_FINGER_TIP,
      dip: HAND_LANDMARKS.RING_FINGER_DIP,
      pip: HAND_LANDMARKS.RING_FINGER_PIP,
      mcp: HAND_LANDMARKS.RING_FINGER_MCP
    }
  },
  {
    id: 4,
    name: 'Pinky',
    landmarks: {
      tip: HAND_LANDMARKS.PINKY_TIP,
      dip: HAND_LANDMARKS.PINKY_DIP,
      pip: HAND_LANDMARKS.PINKY_PIP,
      mcp: HAND_LANDMARKS.PINKY_MCP
    }
  }
]

export class NailDetector {
  private imageWidth: number
  private imageHeight: number
  private nailSizeMultiplier: number
  private paddingMultiplier: number

  constructor(
    imageWidth: number,
    imageHeight: number,
    nailSizeMultiplier: number = 0.12,
    paddingMultiplier: number = 1.5
  ) {
    this.imageWidth = imageWidth
    this.imageHeight = imageHeight
    this.nailSizeMultiplier = nailSizeMultiplier
    this.paddingMultiplier = paddingMultiplier
  }

  /**
   * Detect all nail regions from hand landmarks
   */
  detectNails(landmarks: HandLandmark[]): NailRegion[] {
    if (!landmarks || landmarks.length < 21) {
      return []
    }

    const nailRegions: NailRegion[] = []

    for (const finger of FINGERS) {
      const nailRegion = this.detectFingerNail(landmarks, finger)
      if (nailRegion) {
        nailRegions.push(nailRegion)
      }
    }

    return nailRegions
  }

  /**
   * Detect nail region for a single finger
   */
  private detectFingerNail(
    landmarks: HandLandmark[],
    finger: typeof FINGERS[0]
  ): NailRegion | null {
    const tip = landmarks[finger.landmarks.tip]
    const dip = landmarks[finger.landmarks.dip]
    const pip = landmarks[finger.landmarks.pip]
    const mcp = landmarks[finger.landmarks.mcp]

    if (!tip || !dip || !pip || !mcp) {
      return null
    }

    // Convert normalized coordinates to pixel coordinates
    const tipPx = {
      x: tip.x * this.imageWidth,
      y: tip.y * this.imageHeight
    }
    const dipPx = {
      x: dip.x * this.imageWidth,
      y: dip.y * this.imageHeight
    }
    const pipPx = {
      x: pip.x * this.imageWidth,
      y: pip.y * this.imageHeight
    }
    const mcpPx = {
      x: mcp.x * this.imageWidth,
      y: mcp.y * this.imageHeight
    }

    // Calculate finger length for nail size estimation
    const fingerLength = this.calculateDistance(tipPx, mcpPx)
    const nailLength = fingerLength * this.nailSizeMultiplier

    // Calculate rotation (finger direction)
    const rotation = Math.atan2(tipPx.y - dipPx.y, tipPx.x - dipPx.x)

    // Calculate nail center (slightly below the fingertip)
    const nailCenter = {
      x: tipPx.x - Math.cos(rotation) * (nailLength * 0.3),
      y: tipPx.y - Math.sin(rotation) * (nailLength * 0.3)
    }

    // Calculate bounding box with padding
    const boxWidth = nailLength * this.paddingMultiplier
    const boxHeight = nailLength * 1.4 * this.paddingMultiplier // Nails are more elongated

    const boundingBox = {
      x: Math.max(0, nailCenter.x - boxWidth / 2),
      y: Math.max(0, nailCenter.y - boxHeight / 2),
      width: Math.min(boxWidth, this.imageWidth - nailCenter.x + boxWidth / 2),
      height: Math.min(boxHeight, this.imageHeight - nailCenter.y + boxHeight / 2)
    }

    // Calculate confidence based on finger visibility and straightness
    const confidence = this.calculateConfidence(tipPx, dipPx, pipPx, mcpPx)

    return {
      fingerId: finger.id,
      fingerName: finger.name,
      center: nailCenter,
      boundingBox,
      landmarks: {
        tip: tipPx,
        dip: dipPx,
        pip: pipPx,
        mcp: mcpPx
      },
      rotation: rotation * (180 / Math.PI),
      confidence
    }
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  /**
   * Calculate detection confidence based on finger geometry
   */
  private calculateConfidence(
    tip: { x: number; y: number },
    dip: { x: number; y: number },
    pip: { x: number; y: number },
    mcp: { x: number; y: number }
  ): number {
    // Check if finger is relatively straight
    const dist1 = this.calculateDistance(tip, dip)
    const dist2 = this.calculateDistance(dip, pip)
    const dist3 = this.calculateDistance(pip, mcp)
    const totalDist = this.calculateDistance(tip, mcp)

    // If finger is bent, confidence is lower
    const straightness = (dist1 + dist2 + dist3) / totalDist
    const straightnessScore = Math.max(0, Math.min(1, 2 - straightness))

    // Check if landmarks are within image bounds
    const withinBounds =
      tip.x >= 0 && tip.x <= this.imageWidth &&
      tip.y >= 0 && tip.y <= this.imageHeight &&
      dip.x >= 0 && dip.x <= this.imageWidth &&
      dip.y >= 0 && dip.y <= this.imageHeight

    const boundsScore = withinBounds ? 1.0 : 0.5

    return straightnessScore * boundsScore
  }

  /**
   * Filter nail regions by confidence threshold
   */
  filterByConfidence(
    nailRegions: NailRegion[],
    threshold: number = 0.5
  ): NailRegion[] {
    return nailRegions.filter(region => region.confidence >= threshold)
  }

  /**
   * Get nail region for a specific finger
   */
  getNailByFingerId(
    nailRegions: NailRegion[],
    fingerId: number
  ): NailRegion | undefined {
    return nailRegions.find(region => region.fingerId === fingerId)
  }

  /**
   * Calculate average nail size from detected regions
   */
  getAverageNailSize(nailRegions: NailRegion[]): number {
    if (nailRegions.length === 0) return 0

    const totalSize = nailRegions.reduce(
      (sum, region) => sum + region.boundingBox.width * region.boundingBox.height,
      0
    )

    return totalSize / nailRegions.length
  }

  /**
   * Check if hands are suitable for nail detection
   * (not too close, not too far, visible)
   */
  isHandSuitable(landmarks: HandLandmark[]): {
    suitable: boolean
    reason?: string
  } {
    if (!landmarks || landmarks.length < 21) {
      return { suitable: false, reason: 'Incomplete hand landmarks' }
    }

    // Calculate hand size
    const wrist = landmarks[HAND_LANDMARKS.WRIST]
    const middleTip = landmarks[HAND_LANDMARKS.MIDDLE_FINGER_TIP]

    const wristPx = {
      x: wrist.x * this.imageWidth,
      y: wrist.y * this.imageHeight
    }
    const tipPx = {
      x: middleTip.x * this.imageWidth,
      y: middleTip.y * this.imageHeight
    }

    const handSize = this.calculateDistance(wristPx, tipPx)
    const minSize = Math.min(this.imageWidth, this.imageHeight) * 0.2
    const maxSize = Math.min(this.imageWidth, this.imageHeight) * 0.8

    if (handSize < minSize) {
      return { suitable: false, reason: 'Hand too far from camera' }
    }

    if (handSize > maxSize) {
      return { suitable: false, reason: 'Hand too close to camera' }
    }

    return { suitable: true }
  }

  /**
   * Update image dimensions
   */
  setImageDimensions(width: number, height: number) {
    this.imageWidth = width
    this.imageHeight = height
  }
}

/**
 * Coordinate mapper for converting between different coordinate systems
 */
export class CoordinateMapper {
  /**
   * Convert nail region coordinates from one image size to another
   */
  static scaleNailRegion(
    region: NailRegion,
    fromWidth: number,
    fromHeight: number,
    toWidth: number,
    toHeight: number
  ): NailRegion {
    const scaleX = toWidth / fromWidth
    const scaleY = toHeight / fromHeight

    return {
      ...region,
      center: {
        x: region.center.x * scaleX,
        y: region.center.y * scaleY
      },
      boundingBox: {
        x: region.boundingBox.x * scaleX,
        y: region.boundingBox.y * scaleY,
        width: region.boundingBox.width * scaleX,
        height: region.boundingBox.height * scaleY
      },
      landmarks: {
        tip: {
          x: region.landmarks.tip.x * scaleX,
          y: region.landmarks.tip.y * scaleY
        },
        dip: {
          x: region.landmarks.dip.x * scaleX,
          y: region.landmarks.dip.y * scaleY
        },
        pip: {
          x: region.landmarks.pip.x * scaleX,
          y: region.landmarks.pip.y * scaleY
        },
        mcp: {
          x: region.landmarks.mcp.x * scaleX,
          y: region.landmarks.mcp.y * scaleY
        }
      }
    }
  }

  /**
   * Convert normalized MediaPipe coordinates to pixel coordinates
   */
  static normalizedToPixel(
    x: number,
    y: number,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } {
    return {
      x: x * imageWidth,
      y: y * imageHeight
    }
  }

  /**
   * Convert pixel coordinates to normalized coordinates
   */
  static pixelToNormalized(
    x: number,
    y: number,
    imageWidth: number,
    imageHeight: number
  ): { x: number; y: number } {
    return {
      x: x / imageWidth,
      y: y / imageHeight
    }
  }
}
