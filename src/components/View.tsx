import { Accessor, createEffect, createSignal } from 'solid-js';
import { PerspectiveCamera, Scene, Texture, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { MapData } from '../data';
import { maps } from '../data';
export type ViewProps = {
  textures: Texture[];
  data: Accessor<MapData>;
};

export const View = (props: ViewProps) => {
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>();
  const [canvasScene, setCanvasScene] = createSignal<Scene>();
  const [canvasCamera, setCanvasCamera] = createSignal<PerspectiveCamera>();

  createEffect(() => {
    const canvas = canvasElement();
    if (!canvas) return;

    const renderer = new WebGLRenderer({ canvas });

    const scene = new Scene();
    setCanvasScene(scene);

    const camera = new PerspectiveCamera(60);
    setCanvasCamera(camera);
    camera.position.set(1, 0, 0);
    camera.rotation.set(1, 0, 0);

    const orbitControls = new OrbitControls(camera, canvas);
    orbitControls.rotateSpeed = -0.25;
    orbitControls.enableZoom = true;
    orbitControls.enableDamping = true;
    orbitControls.update();

    let frameHandle = 0;

    let prevTimestamp = Date.now();
    const renderFrame = (timestamp: number) => {
      const deltaTime = timestamp - prevTimestamp;
      prevTimestamp = timestamp;
      frameHandle = requestAnimationFrame(renderFrame);

      orbitControls.update(deltaTime * 1000);
      renderer.render(scene, camera);
    };

    frameHandle = requestAnimationFrame(renderFrame);

    const resizeHandler = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    const textures = props.textures;

    const handleSpaceHit = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;

      event.preventDefault();
      scene.background = textures[Math.floor(Math.random() * textures.length)];
    };

    window.addEventListener('keypress', handleSpaceHit);

    return () => {
      cancelAnimationFrame(frameHandle);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('keypress', handleSpaceHit);

      renderer.dispose();
      orbitControls.dispose();
    };
  });
  createEffect(() => {
    const curData = props.data;
    const index = maps.indexOf(curData());
    const currentScene = canvasScene();
    if (!currentScene) return;
    currentScene.background = props.textures[index];
  });
  return <canvas ref={setCanvasElement} class="h-screen w-screen" />;
};
