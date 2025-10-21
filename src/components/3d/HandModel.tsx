'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import * as THREE from 'three'

interface HandModelProps {
  nailColor?: string
  nailStyle?: string
  handSide?: 'left' | 'right'
  onColorChange?: (color: string) => void
  interactive?: boolean
}

function Hand({ nailColor = '#FF6B6B', nailStyle = 'classic', handSide = 'right' }: HandModelProps) {
  const meshRef = useRef<THREE.Group>(null)
  const [hoveredNail, setHoveredNail] = useState<number | null>(null)

  // Create hand geometry
  const handGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.15)
  const fingerGeometry = new THREE.CylinderGeometry(0.03, 0.04, 0.3, 8)
  const nailGeometry = new THREE.CylinderGeometry(0.025, 0.03, 0.02, 8)

  // Materials
  const skinMaterial = new THREE.MeshLambertMaterial({ 
    color: '#FDBCB4',
    transparent: true,
    opacity: 0.95
  })
  
  const nailMaterial = new THREE.MeshPhongMaterial({
    color: nailColor,
    shininess: 100,
    transparent: true,
    opacity: 0.9
  })

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Palm */}
      <mesh geometry={handGeometry} material={skinMaterial} position={[0, 0, 0]} />
      
      {/* Fingers with nails */}
      {[0, 1, 2, 3, 4].map((fingerIndex) => {
        const xOffset = (fingerIndex - 2) * 0.08
        const yOffset = fingerIndex === 0 ? -0.3 : 0.3 // Thumb position
        
        return (
          <group key={fingerIndex}>
            {/* Finger */}
            <mesh 
              geometry={fingerGeometry} 
              material={skinMaterial} 
              position={[xOffset, yOffset, 0]}
              rotation={fingerIndex === 0 ? [0, 0, Math.PI / 6] : [0, 0, 0]}
            />
            
            {/* Nail */}
            <mesh
              geometry={nailGeometry}
              material={nailMaterial}
              position={[xOffset, yOffset + (fingerIndex === 0 ? 0.1 : 0.15), 0.05]}
              rotation={fingerIndex === 0 ? [0, 0, Math.PI / 6] : [0, 0, 0]}
              onPointerEnter={() => setHoveredNail(fingerIndex)}
              onPointerLeave={() => setHoveredNail(null)}
              scale={hoveredNail === fingerIndex ? 1.1 : 1}
            />
          </group>
        )
      })}
    </group>
  )
}

export default function HandModel(props: HandModelProps) {
  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
      <Canvas
        camera={{ position: [0, 0, 2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <pointLight position={[-10, -10, -10]} intensity={0.3} />
        
        <Hand {...props} />
        
        <OrbitControls 
          enablePan={props.interactive !== false}
          enableZoom={props.interactive !== false}
          enableRotate={props.interactive !== false}
          maxDistance={4}
          minDistance={1}
        />
        
        <Environment preset="studio" />
      </Canvas>
    </div>
  )
}
