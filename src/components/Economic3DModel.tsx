import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Play, Pause, RotateCcw, Eye, Compass, Info, Zap } from 'lucide-react';
import { ASSETS } from '../assets';

interface EconomicNodeData {
  id: string;
  name: string;
  icon: string;
  metric: string;
  stat: string;
  description: string;
  color: string;
}

const NODE_INFO: Record<string, EconomicNodeData> = {
  factory: {
    id: 'factory',
    name: 'Industrial Production & Manufacturing',
    icon: '🏭',
    metric: 'Industrial Output',
    stat: '+4.2% QoQ',
    description: 'Capital goods production, manufacturing capacity utilization, and raw material throughput in primary sectors.',
    color: '#B03A40'
  },
  house: {
    id: 'house',
    name: 'Household Sector & Consumer Market',
    icon: '🏠',
    metric: 'Personal Consumption & Labor',
    stat: 'Savings Rate 6.8%',
    description: 'Household expenditure dynamics, labor supply participation, disposable income elasticity, and wage growth.',
    color: '#D96832'
  },
  retail: {
    id: 'retail',
    name: 'Commerce & Retail Distribution',
    icon: '🏪',
    metric: 'Retail Price Index (CPI)',
    stat: '+2.1% YoY',
    description: 'Final consumer goods transactions, velocity of money in retail markets, and demand-pull price equilibrium.',
    color: '#F07B41'
  },
  markets: {
    id: 'markets',
    name: 'Financial Capital Markets & Equity',
    icon: '📈',
    metric: '10-Yr Treasury & Index',
    stat: 'Yield 4.15%',
    description: 'Capital allocation, liquidity flows, equity valuation multiples, central bank benchmark rates, and corporate investment.',
    color: '#3B82F6'
  },
  truck: {
    id: 'truck',
    name: 'Global Supply Chain & Logistics',
    icon: '🚚',
    metric: 'Freight Logistics Index',
    stat: 'Capacity 94%',
    description: 'Intermodal freight distribution, trade balances, maritime shipping velocity, and intermediate supply shock buffering.',
    color: '#10B981'
  }
};

export const Economic3DModel: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeNode, setActiveNode] = useState<EconomicNodeData | null>(NODE_INFO.factory);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [cameraView, setCameraView] = useState<'iso' | 'top' | 'front'>('iso');

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mainGroupRef = useRef<THREE.Group | null>(null);

  // Drag interaction variables
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  const isRotatingRef = useRef(isRotating);
  isRotatingRef.current = isRotating;

  const speedMultiplierRef = useRef(speedMultiplier);
  speedMultiplierRef.current = speedMultiplier;

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera (Isometric Perspective)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(16, 14, 16);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff8f0, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfffaee, 2.2);
    mainLight.position.set(15, 25, 15);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0003;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.7);
    fillLight.position.set(-15, 12, -10);
    scene.add(fillLight);

    const bottomGlow = new THREE.PointLight(0xffe8d6, 1.0, 25);
    bottomGlow.position.set(0, -2, 0);
    scene.add(bottomGlow);

    // 5. Main Rotating Scene Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    // Load uploaded .glb 3D Model from Asset System Folder
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      ASSETS.models.baseBasicShadedGlb,
      (gltf) => {
        if (gltf && gltf.scene) {
          // Traverse child meshes to set shadows and optimize materials with embedded texture
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;

              if (mesh.material) {
                const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                materials.forEach((m) => {
                  const mat = m as THREE.MeshStandardMaterial;
                  // Use embedded texture map from GLB
                  if (mat.emissiveMap && !mat.map) {
                    mat.map = mat.emissiveMap;
                  }
                  mat.color = new THREE.Color(0xffffff);
                  mat.emissive = new THREE.Color(0x222222);
                  mat.emissiveIntensity = 0.4;
                  mat.roughness = 0.4;
                  mat.metalness = 0.1;
                  mat.side = THREE.DoubleSide;
                  mat.needsUpdate = true;
                });
              }
            }
          });

          // Calculate bounding box and dimensions before scaling
          const box = new THREE.Box3().setFromObject(gltf.scene);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());

          // Center gltf.scene at local (0, 0, 0)
          gltf.scene.position.sub(center);

          // Wrap in a parent group for clean, reliable scaling and positioning
          const modelWrapper = new THREE.Group();
          modelWrapper.add(gltf.scene);

          const maxDim = Math.max(size.x, size.y, size.z);
          if (maxDim > 0) {
            const scale = 11.0 / maxDim;
            modelWrapper.scale.set(scale, scale, scale);
          }

          // Compute scaled height to align bottom neatly on pedestal
          const scaledBox = new THREE.Box3().setFromObject(modelWrapper);
          const scaledMinY = scaledBox.min.y;
          modelWrapper.position.y = -scaledMinY;

          mainGroup.add(modelWrapper);
        }
      },
      undefined,
      (err) => {
        console.warn('GLB asset loading notice:', err);
      }
    );

    // Pedestal Base Platform for GLB Model
    const pedestalGeo = new THREE.CylinderGeometry(7.0, 7.5, 0.6, 64);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0xF2E8DE,
      roughness: 0.6,
      metalness: 0.05
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.3;
    pedestal.receiveShadow = true;
    mainGroup.add(pedestal);

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(mainGroup.children, true);

      let foundId: string | null = null;
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== mainGroup) {
          if (curr.userData && curr.userData.id) {
            foundId = curr.userData.id;
            break;
          }
          curr = curr.parent;
        }
        if (foundId) break;
      }

      setHoveredNode(foundId);
      renderer.domElement.style.cursor = foundId ? 'pointer' : isDraggingRef.current ? 'grabbing' : 'grab';
    };

    const handlePointerDown = (event: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(mainGroup.children, true);

      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== mainGroup) {
          if (curr.userData && curr.userData.id && NODE_INFO[curr.userData.id]) {
            setActiveNode(NODE_INFO[curr.userData.id]);
            break;
          }
          curr = curr.parent;
        }
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      if (rendererRef.current) {
        rendererRef.current.domElement.style.cursor = hoveredNode ? 'pointer' : 'grab';
      }
    };

    const handleMouseDrag = (event: MouseEvent) => {
      if (!isDraggingRef.current || !mainGroupRef.current) return;
      const deltaX = event.clientX - previousMousePositionRef.current.x;
      const deltaY = event.clientY - previousMousePositionRef.current.y;

      mainGroupRef.current.rotation.y += deltaX * 0.008;

      if (cameraRef.current) {
        cameraRef.current.position.y = Math.max(6, Math.min(26, cameraRef.current.position.y - deltaY * 0.05));
        cameraRef.current.lookAt(0, 1.5, 0);
      }

      previousMousePositionRef.current = { x: event.clientX, y: event.clientY };
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('mousemove', handlePointerMove);
    domElem.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('mousemove', handleMouseDrag);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Continuous Scene Auto-Rotation if enabled
      if (isRotatingRef.current && mainGroupRef.current && !isDraggingRef.current) {
        mainGroupRef.current.rotation.y += delta * 0.25 * speedMultiplierRef.current;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('mousemove', handlePointerMove);
      domElem.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('mousemove', handleMouseDrag);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Adjust Camera View preset
  const setPresetView = (preset: 'iso' | 'top' | 'front') => {
    setCameraView(preset);
    if (!cameraRef.current) return;
    if (preset === 'iso') {
      cameraRef.current.position.set(16, 14, 16);
    } else if (preset === 'top') {
      cameraRef.current.position.set(0, 24, 0.1);
    } else if (preset === 'front') {
      cameraRef.current.position.set(0, 8, 22);
    }
    cameraRef.current.lookAt(0, 0, 0);
  };

  const resetRotation = () => {
    if (mainGroupRef.current) {
      mainGroupRef.current.rotation.y = 0;
    }
    setPresetView('iso');
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[600px] md:h-[680px] rounded-3xl overflow-hidden select-none flex flex-col justify-between">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10" />

      {/* Floating Active Node Data Badge (Top Left Overlay) */}
      <div className="relative z-20 p-4 sm:p-6 pointer-events-none max-w-sm">
        {activeNode && (
          <div className="pointer-events-auto bg-[#FFFDF9]/90 backdrop-blur-md border border-[#EADBCE] shadow-xl rounded-2xl p-4 transition-all duration-300">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-2xl">{activeNode.icon}</span>
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: activeNode.color }}
              >
                {activeNode.stat}
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#1C1817] leading-tight mb-1">
              {activeNode.name}
            </h4>
            <p className="text-xs text-[#605753] leading-relaxed">
              {activeNode.description}
            </p>
            <div className="mt-2.5 pt-2 border-t border-[#F0E5D9] flex items-center justify-between text-[11px] font-medium text-[#B03A40]">
              <span>Key Indicator: {activeNode.metric}</span>
              <span className="inline-flex items-center gap-1 font-semibold">
                <Zap className="w-3 h-3 text-[#F07B41]" /> Live Model
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar (Bottom Overlay) */}
      <div className="relative z-20 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        {/* Node Quick Selectors */}
        <div className="flex items-center gap-1.5 bg-[#FFFDF9]/90 backdrop-blur-md border border-[#EADBCE] p-1.5 rounded-2xl shadow-lg overflow-x-auto max-w-full">
          {Object.values(NODE_INFO).map((node) => {
            const isSelected = activeNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setActiveNode(node)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#B03A40] text-white shadow-sm scale-105'
                    : 'text-[#524B47] hover:bg-[#FDF8F1] hover:text-[#1C1817]'
                }`}
              >
                <span>{node.icon}</span>
                <span className="hidden sm:inline">{node.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Play / Speed / View Controls */}
        <div className="flex items-center gap-2 bg-[#FFFDF9]/90 backdrop-blur-md border border-[#EADBCE] p-1.5 rounded-2xl shadow-lg">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className="p-2 rounded-xl text-[#1C1817] hover:bg-[#FDF8F1] transition-colors"
            title={isRotating ? 'Pause Rotation' : 'Start Rotation'}
          >
            {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-[#B03A40]" />}
          </button>

          <button
            onClick={() => setSpeedMultiplier(speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 0.5 : 1)}
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-[#B03A40] hover:bg-[#FDF8F1] transition-colors"
            title="Toggle Speed"
          >
            {speedMultiplier}x
          </button>

          <div className="w-[1px] h-4 bg-[#EADBCE]" />

          <button
            onClick={() => setPresetView(cameraView === 'iso' ? 'top' : cameraView === 'top' ? 'front' : 'iso')}
            className="p-2 rounded-xl text-[#524B47] hover:bg-[#FDF8F1] transition-colors flex items-center gap-1 text-xs font-medium"
            title="Switch View Angle"
          >
            <Eye className="w-4 h-4" />
            <span className="uppercase text-[10px] font-bold">{cameraView}</span>
          </button>

          <button
            onClick={resetRotation}
            className="p-2 rounded-xl text-[#524B47] hover:bg-[#FDF8F1] transition-colors"
            title="Reset Model Position"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
