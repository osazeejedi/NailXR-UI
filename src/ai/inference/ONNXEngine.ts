/**
 * ONNX Runtime Web Inference Engine
 * Handles model loading and inference for nail segmentation
 */

import * as ort from 'onnxruntime-web'

export interface InferenceResult {
  segmentationMask: Float32Array
  width: number
  height: number
  inferenceTime: number
}

export interface ModelConfig {
  modelPath: string
  inputShape: [number, number, number, number] // [batch, channels, height, width]
  outputShape: [number, number, number, number]
  inputName: string
  outputName: string
}

export class ONNXEngine {
  private session: ort.InferenceSession | null = null
  private config: ModelConfig
  private isInitialized = false

  constructor(config: ModelConfig) {
    this.config = config
    this.initializeORT()
  }

  private initializeORT() {
    // Configure ONNX Runtime for optimal web performance
    ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4
    ort.env.wasm.simd = true
    ort.env.wasm.proxy = false
    
    // Use WebGL for better performance if available
    ort.env.webgl.contextId = 'webgl2'
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      console.log('Loading ONNX model from:', this.config.modelPath)
      
      // Load model with WebGL backend for best performance
      this.session = await ort.InferenceSession.create(
        this.config.modelPath,
        {
          executionProviders: ['webgl', 'wasm'],
          graphOptimizationLevel: 'all',
          enableCpuMemArena: true,
          enableMemPattern: true,
          executionMode: 'sequential'
        }
      )

      this.isInitialized = true
      console.log('ONNX model loaded successfully')
      console.log('Input names:', this.session.inputNames)
      console.log('Output names:', this.session.outputNames)
    } catch (error) {
      console.error('Failed to load ONNX model:', error)
      throw new Error(`Model initialization failed: ${error}`)
    }
  }

  async runInference(imageData: Float32Array): Promise<InferenceResult> {
    if (!this.session || !this.isInitialized) {
      throw new Error('Model not initialized. Call initialize() first.')
    }

    const startTime = performance.now()

    try {
      // Create input tensor
      const inputTensor = new ort.Tensor(
        'float32',
        imageData,
        this.config.inputShape
      )

      // Run inference
      const feeds: Record<string, ort.Tensor> = {}
      feeds[this.config.inputName] = inputTensor

      const results = await this.session.run(feeds)
      const outputTensor = results[this.config.outputName]

      if (!outputTensor) {
        throw new Error('No output tensor received')
      }

      const inferenceTime = performance.now() - startTime

      return {
        segmentationMask: outputTensor.data as Float32Array,
        width: this.config.outputShape[3],
        height: this.config.outputShape[2],
        inferenceTime
      }
    } catch (error) {
      console.error('Inference failed:', error)
      throw error
    }
  }

  async dispose(): Promise<void> {
    if (this.session) {
      await this.session.release()
      this.session = null
      this.isInitialized = false
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }

  getModelInfo() {
    return {
      config: this.config,
      isInitialized: this.isInitialized,
      inputNames: this.session?.inputNames || [],
      outputNames: this.session?.outputNames || []
    }
  }
}

// Singleton instance manager
class ModelManager {
  private static instance: ONNXEngine | null = null
  private static initializationPromise: Promise<void> | null = null

  static async getEngine(config: ModelConfig): Promise<ONNXEngine> {
    if (!this.instance) {
      this.instance = new ONNXEngine(config)
      
      if (!this.initializationPromise) {
        this.initializationPromise = this.instance.initialize()
      }
      
      await this.initializationPromise
    }

    return this.instance
  }

  static async disposeEngine(): Promise<void> {
    if (this.instance) {
      await this.instance.dispose()
      this.instance = null
      this.initializationPromise = null
    }
  }
}

export { ModelManager }
