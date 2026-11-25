import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ActiveTab } from '../types';

interface PulseWayScene3DProps {
  mode: 'login' | ActiveTab;
  delayMinutes?: number;
  queuePosition?: number;
  confirmationTick?: number;
  className?: string;
}

const _dummyObj = new THREE.Object3D();
const _tempColor = new THREE.Color();
const _tealColor = new THREE.Color('#00B4A6');
const _coralColor = new THREE.Color('#FF6B57');
const _navyMutedColor = new THREE.Color('#1B3F70');

function createDialCanvasTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const cx = size / 2;
    const cy = size / 2;

    ctx.fillStyle = '#091A31';
    ctx.fillRect(0, 0, size, size);

    // Subtle concentric calibration rings
    const radii = [160, 250, 340, 430, 475];
    radii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 2 ? 'rgba(0, 180, 166, 0.32)' : 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = idx === 2 ? 3 : 1.5;
      ctx.stroke();
    });

    // Precision chronometer ticks (60 minutes)
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const rInner = isMajor ? 412 : 426;
      const rOuter = 446;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * rInner, cy + Math.sin(angle) * rInner);
      ctx.lineTo(cx + Math.cos(angle) * rOuter, cy + Math.sin(angle) * rOuter);
      ctx.strokeStyle = isMajor ? 'rgba(0, 180, 166, 0.7)' : 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = isMajor ? 4 : 1.8;
      ctx.stroke();
    }

    // Crosshair axis hairlines
    ctx.strokeStyle = 'rgba(0, 180, 166, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 460, cy);
    ctx.lineTo(cx + 460, cy);
    ctx.moveTo(cx, cy - 460);
    ctx.lineTo(cx, cy + 460);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

export default function PulseWayScene3D({
  mode,
  delayMinutes = 0,
  queuePosition = 3,
  confirmationTick = 0,
  className = '',
}: PulseWayScene3DProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const stateRef = useRef({
    mode,
    delayMinutes,
    queuePosition,
    confirmationTick,
    pulseIntensity: 0,
    lastConfirmationTick: confirmationTick,
  });

  useEffect(() => {
    stateRef.current.mode = mode;
    stateRef.current.delayMinutes = delayMinutes;
    stateRef.current.queuePosition = queuePosition;
    if (confirmationTick !== stateRef.current.lastConfirmationTick) {
      stateRef.current.lastConfirmationTick = confirmationTick;
      stateRef.current.pulseIntensity = 1.0;
    }
  }, [mode, delayMinutes, queuePosition, confirmationTick]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Detect software WebGL strictly from renderer string
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 240);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0B1F3A');
    scene.fog = new THREE.FogExp2('#0B1F3A', 0.042);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 4.6, 8.8);
    camera.lookAt(0, 0.35, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setContextLost(true);
      return;
    }
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.innerHTML = '';
    container.appendChild(canvas);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const handleContextRestored = () => {
      setContextLost(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Studio IBL via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Warm/cool 3-point lighting rig
    const hemiLight = new THREE.HemisphereLight('#7DD3FC', '#08172B', 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#FFF5EB', 2.2);
    keyLight.position.set(6, 9, 6);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -6;
      keyLight.shadow.camera.right = 6;
      keyLight.shadow.camera.top = 6;
      keyLight.shadow.camera.bottom = -6;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#00B4A6', 1.4);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    const coralAccentLight = new THREE.PointLight('#FF6B57', 1.2, 16, 2);
    coralAccentLight.position.set(3.8, 2.2, 3.2);
    scene.add(coralAccentLight);

    // Procedural dial texture
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const dialTexture = createDialCanvasTexture(maxAniso);

    // Track disposable resources
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Ground architectural stage plane
    const stageGeo = new THREE.CircleGeometry(14, 64);
    geometries.push(stageGeo);
    const stageMat = new THREE.MeshStandardMaterial({
      color: '#08172B',
      roughness: 0.72,
      metalness: 0.25,
    });
    materials.push(stageMat);
    const stageFloor = new THREE.Mesh(stageGeo, stageMat);
    stageFloor.rotation.x = -Math.PI / 2;
    stageFloor.position.y = -0.02;
    stageFloor.receiveShadow = true;
    scene.add(stageFloor);

    // Root composite chronometer timeline group
    const timelineRoot = new THREE.Group();
    scene.add(timelineRoot);

    // Part 1: Stepped Navy Architectural Pedestal + Calibrated Dial Disc
    const pedestalGroup = new THREE.Group();
    timelineRoot.add(pedestalGroup);

    const outerBaseGeo = new THREE.CylinderGeometry(3.4, 3.65, 0.24, 64);
    geometries.push(outerBaseGeo);
    const navyMetalMat = new THREE.MeshStandardMaterial({
      color: '#102A4D',
      roughness: 0.3,
      metalness: 0.82,
    });
    materials.push(navyMetalMat);
    const outerBaseMesh = new THREE.Mesh(outerBaseGeo, navyMetalMat);
    outerBaseMesh.position.y = 0.12;
    outerBaseMesh.castShadow = true;
    outerBaseMesh.receiveShadow = true;
    pedestalGroup.add(outerBaseMesh);

    const dialDiscGeo = new THREE.CylinderGeometry(3.22, 3.22, 0.04, 64);
    geometries.push(dialDiscGeo);
    const dialMat = new THREE.MeshStandardMaterial({
      map: dialTexture,
      roughness: 0.42,
      metalness: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    materials.push(dialMat);
    const dialMesh = new THREE.Mesh(dialDiscGeo, dialMat);
    dialMesh.position.y = 0.26;
    dialMesh.receiveShadow = true;
    pedestalGroup.add(dialMesh);

    // Part 2: Four Beveled Structural Pylons anchoring the queue track
    const pylonGeo = new THREE.BoxGeometry(0.22, 0.56, 0.46);
    geometries.push(pylonGeo);
    const satinTrimMat = new THREE.MeshStandardMaterial({
      color: '#1D4478',
      roughness: 0.22,
      metalness: 0.88,
    });
    materials.push(satinTrimMat);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const pylon = new THREE.Mesh(pylonGeo, satinTrimMat);
      pylon.position.set(Math.cos(angle) * 3.15, 0.38, Math.sin(angle) * 3.15);
      pylon.rotation.y = -angle + Math.PI / 2;
      pylon.castShadow = true;
      pedestalGroup.add(pylon);
    }

    // Part 3: Central Clinical Beacon Core (Multi-part Lathe + Crystal Core + Teal Halo)
    const coreGroup = new THREE.Group();
    coreGroup.position.y = 0.3;
    timelineRoot.add(coreGroup);

    const plinthPoints = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(0.88, 0),
      new THREE.Vector2(0.82, 0.16),
      new THREE.Vector2(0.56, 0.28),
      new THREE.Vector2(0.48, 0.46),
      new THREE.Vector2(0, 0.46),
    ];
    const plinthGeo = new THREE.LatheGeometry(plinthPoints, 48);
    geometries.push(plinthGeo);
    const corePlinth = new THREE.Mesh(plinthGeo, navyMetalMat);
    corePlinth.castShadow = true;
    coreGroup.add(corePlinth);

    const crystalGeo = new THREE.OctahedronGeometry(0.46, 0);
    geometries.push(crystalGeo);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: '#00B4A6',
      emissive: '#004D47',
      emissiveIntensity: 0.65,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      transmission: isSoftwareGl ? 0 : 0.45,
      transparent: true,
      opacity: isSoftwareGl ? 0.88 : 1.0,
      ior: 1.6,
      thickness: 0.8,
    });
    materials.push(crystalMat);
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalMesh.position.y = 1.05;
    crystalMesh.castShadow = true;
    coreGroup.add(crystalMesh);

    const innerHaloGeo = new THREE.TorusGeometry(0.76, 0.045, 20, 64);
    geometries.push(innerHaloGeo);
    const tealGlowMat = new THREE.MeshStandardMaterial({
      color: '#00B4A6',
      emissive: '#00B4A6',
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.5,
    });
    materials.push(tealGlowMat);
    const innerHalo = new THREE.Mesh(innerHaloGeo, tealGlowMat);
    innerHalo.rotation.x = Math.PI / 2;
    innerHalo.position.y = 0.54;
    coreGroup.add(innerHalo);

    // Part 4: Layered Queue Orbit Ring + 24 Instanced Queue Token Nodes
    const queueLayerGroup = new THREE.Group();
    queueLayerGroup.position.y = 0.86;
    timelineRoot.add(queueLayerGroup);

    const trackGeo = new THREE.TorusGeometry(2.1, 0.055, 20, 96);
    geometries.push(trackGeo);
    const trackMesh = new THREE.Mesh(trackGeo, satinTrimMat);
    trackMesh.rotation.x = Math.PI / 2;
    trackMesh.castShadow = true;
    queueLayerGroup.add(trackMesh);

    const TOKEN_COUNT = 24;
    const tokenGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.24, 16);
    geometries.push(tokenGeo);
    const tokenMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.25,
      metalness: 0.65,
    });
    materials.push(tokenMat);

    const queueTokensMesh = new THREE.InstancedMesh(tokenGeo, tokenMat, TOKEN_COUNT);
    queueTokensMesh.frustumCulled = false;
    queueTokensMesh.castShadow = true;
    queueLayerGroup.add(queueTokensMesh);

    // Part 5: Outer Worst-Case Buffer Gimbal Ring + Warm Coral Arrival Marker
    const bufferLayerGroup = new THREE.Group();
    bufferLayerGroup.position.y = 1.38;
    timelineRoot.add(bufferLayerGroup);

    const outerGimbalGeo = new THREE.TorusGeometry(2.85, 0.04, 16, 96);
    geometries.push(outerGimbalGeo);
    const coralMat = new THREE.MeshStandardMaterial({
      color: '#FF6B57',
      emissive: '#FF6B57',
      emissiveIntensity: 0.75,
      roughness: 0.22,
      metalness: 0.55,
    });
    materials.push(coralMat);
    const outerGimbal = new THREE.Mesh(outerGimbalGeo, coralMat);
    outerGimbal.rotation.x = Math.PI / 2;
    bufferLayerGroup.add(outerGimbal);

    // Arrival Beacon Pylon on the outer buffer ring
    const markerGroup = new THREE.Group();
    markerGroup.position.set(2.85, 0, 0);
    bufferLayerGroup.add(markerGroup);

    const markerConeGeo = new THREE.ConeGeometry(0.16, 0.42, 4);
    geometries.push(markerConeGeo);
    const markerCone = new THREE.Mesh(markerConeGeo, coralMat);
    markerCone.rotation.x = Math.PI;
    markerCone.position.y = 0.12;
    markerGroup.add(markerCone);

    const markerCapGeo = new THREE.SphereGeometry(0.08, 16, 16);
    geometries.push(markerCapGeo);
    const markerCap = new THREE.Mesh(markerCapGeo, tealGlowMat);
    markerCap.position.y = 0.4;
    markerGroup.add(markerCap);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer tilt tracking
    let targetPointerX = 0;
    let targetPointerY = 0;
    let smoothPointerX = 0;
    let smoothPointerY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetPointerX = THREE.MathUtils.clamp(nx, -1, 1);
      targetPointerY = THREE.MathUtils.clamp(ny, -1, 1);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(container.clientWidth, 320);
      const h = Math.max(container.clientHeight, 240);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation state
    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    let currentQueueY = 0.86;
    let currentBufferY = 1.38;
    let currentGimbalTiltX = 0.08;
    let currentGimbalTiltZ = -0.05;
    let currentCamX = 0;
    let currentCamY = 4.5;
    let currentCamZ = 8.8;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function updateInstancedQueueTokens(elapsed: number) {
      const { delayMinutes: delayMin, queuePosition: qPos, mode: activeMode } = stateRef.current;
      const delayFactor = THREE.MathUtils.clamp(delayMin / 45, 0, 1);
      const activeSlots = Math.max(2, Math.min(TOKEN_COUNT, qPos + 2));

      for (let i = 0; i < TOKEN_COUNT; i++) {
        const angle = (i / TOKEN_COUNT) * Math.PI * 2 + elapsed * (prefersReducedMotion ? 0 : 0.14);
        const radius = 2.1;
        const isCurrentPatient = i === 0;
        const isAheadInQueue = i > 0 && i < activeSlots;
        const isDelayedBufferNode = delayFactor > 0.15 && i >= activeSlots && i < activeSlots + Math.round(delayFactor * 6);

        const yBounce = prefersReducedMotion
          ? 0
          : Math.sin(elapsed * 2.2 + i * 0.45) * (isCurrentPatient ? 0.09 : 0.03);
        const scaleY = isCurrentPatient ? 1.85 : isAheadInQueue ? 1.25 : isDelayedBufferNode ? 1.45 : 0.65;

        _dummyObj.position.set(Math.cos(angle) * radius, yBounce, Math.sin(angle) * radius);
        _dummyObj.rotation.set(0, -angle, 0);
        _dummyObj.scale.set(isCurrentPatient ? 1.35 : 1, scaleY, isCurrentPatient ? 1.35 : 1);
        _dummyObj.updateMatrix();
        queueTokensMesh.setMatrixAt(i, _dummyObj.matrix);

        if (isCurrentPatient) {
          _tempColor.copy(_tealColor).lerp(_coralColor, activeMode === 'book' ? 0.2 : delayFactor * 0.5);
        } else if (isDelayedBufferNode) {
          _tempColor.copy(_coralColor);
        } else if (isAheadInQueue) {
          _tempColor.copy(_tealColor);
        } else {
          _tempColor.copy(_navyMutedColor);
        }
        queueTokensMesh.setColorAt(i, _tempColor);
      }

      queueTokensMesh.instanceMatrix.needsUpdate = true;
      if (queueTokensMesh.instanceColor) {
        queueTokensMesh.instanceColor.needsUpdate = true;
      }
      queueTokensMesh.computeBoundingSphere();
    }

    function tick() {
      if (disposed) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // Decay booking confirmation pulse
      st.pulseIntensity = THREE.MathUtils.damp(st.pulseIntensity, 0, 3.2, delta);

      // Smooth pointer tilt
      const pointerScale = prefersReducedMotion ? 0 : 1;
      smoothPointerX = THREE.MathUtils.damp(smoothPointerX, targetPointerX * pointerScale, 5.5, delta);
      smoothPointerY = THREE.MathUtils.damp(smoothPointerY, targetPointerY * pointerScale, 5.5, delta);

      // Target spatial pose per tab & delay state
      const delayFactor = THREE.MathUtils.clamp(st.delayMinutes / 45, 0, 1);
      let targetCamX = 0;
      let targetCamY = 4.4;
      let targetCamZ = 8.6;
      let targetQueueY = 0.85;
      let targetBufferY = 1.32 + delayFactor * 0.65;
      let targetTiltX = 0.08 + delayFactor * 0.22;
      let targetTiltZ = -0.05 - delayFactor * 0.14;

      if (st.mode === 'login') {
        targetCamX = -0.8;
        targetCamY = 4.1;
        targetCamZ = 8.4;
      } else if (st.mode === 'book') {
        targetCamX = 1.25;
        targetCamY = 4.8;
        targetCamZ = 8.1;
        targetQueueY = 1.05;
        targetBufferY = 1.72;
        targetTiltX = -0.14;
        targetTiltZ = 0.12;
      } else if (st.mode === 'online') {
        targetCamX = -1.1;
        targetCamY = 3.9;
        targetCamZ = 7.9;
        targetQueueY = 0.72;
        targetBufferY = 1.18;
        targetTiltX = 0.16;
        targetTiltZ = -0.12;
      }

      // Apply exponential damping
      currentCamX = THREE.MathUtils.damp(currentCamX, targetCamX + smoothPointerX * 1.15, 4.5, delta);
      currentCamY = THREE.MathUtils.damp(currentCamY, targetCamY - smoothPointerY * 0.65, 4.5, delta);
      currentCamZ = THREE.MathUtils.damp(currentCamZ, targetCamZ, 4.5, delta);

      camera.position.set(currentCamX, currentCamY, currentCamZ);
      camera.lookAt(0, 0.55, 0);

      currentQueueY = THREE.MathUtils.damp(currentQueueY, targetQueueY + st.pulseIntensity * 0.35, 5.0, delta);
      currentBufferY = THREE.MathUtils.damp(currentBufferY, targetBufferY + st.pulseIntensity * 0.55, 4.2, delta);
      currentGimbalTiltX = THREE.MathUtils.damp(currentGimbalTiltX, targetTiltX, 4.5, delta);
      currentGimbalTiltZ = THREE.MathUtils.damp(currentGimbalTiltZ, targetTiltZ, 4.5, delta);

      queueLayerGroup.position.y = currentQueueY;
      bufferLayerGroup.position.y = currentBufferY;
      bufferLayerGroup.rotation.x = currentGimbalTiltX;
      bufferLayerGroup.rotation.z = currentGimbalTiltZ;

      if (!prefersReducedMotion) {
        crystalMesh.rotation.y = elapsed * 0.55 + st.pulseIntensity * 2.2;
        crystalMesh.position.y = 1.05 + Math.sin(elapsed * 1.8) * 0.08 + st.pulseIntensity * 0.25;
        innerHalo.rotation.z = elapsed * 0.35;
        bufferLayerGroup.rotation.y = elapsed * (0.22 + delayFactor * 0.35);
      }

      // Coral accent light responds to simulated delay or booking pulse
      coralAccentLight.intensity = 1.0 + delayFactor * 2.4 + st.pulseIntensity * 2.2;
      crystalMat.emissiveIntensity = 0.65 + st.pulseIntensity * 1.1;

      updateInstancedQueueTokens(elapsed);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      dialTexture.dispose();
      envTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#0B1F3A] ${className}`}>
      <div ref={mountRef} className="w-full h-full" />
      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B1F3A]">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#FF6B57]/55" />
            <div className="absolute inset-5 rounded-full border-2 border-[#00B4A6]/70" />
            <div className="absolute inset-12 rounded-full bg-[#112A4C] border border-[#00B4A6] flex items-center justify-center font-mono text-xs text-white">
              Queue #{queuePosition}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
