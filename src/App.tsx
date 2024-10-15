import { createResource, createSignal, Show } from 'solid-js';
import Map from './components/Map';
import { View } from './components/View';

import { maps, MapData } from './data';
import {
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';

function App() {
  const [loadedImageCount, setLoadedImageCount] = createSignal(0);
  const [panoramaTextures] = createResource(async () => {
    const panoramaImages = import.meta.glob<string>('./assets/panorama/*.jpg', {
      query: '?imageCompress',
      import: 'default',
    });

    const keys = Object.keys(panoramaImages);
    const imagePaths = await Promise.all(
      maps.map((map) =>
        panoramaImages[keys.find((it) => it.endsWith(map.panorama)) || ''](),
      ),
    );

    const textures = await Promise.all(
      maps.map((_, i) =>
        (async () => {
          const texture = await new TextureLoader().loadAsync(imagePaths[i]);
          setLoadedImageCount((prev) => prev + 1);
          return texture;
        })(),
      ),
    );

    textures.forEach((texture) => {
      texture.mapping = EquirectangularReflectionMapping;
      texture.colorSpace = SRGBColorSpace;
    });

    return textures;
  });

  const [data, setData] = createSignal<MapData>(
    maps[Math.floor(Math.random() * maps.length)],
  );
  const [counter, setCounter] = createSignal(0);
  const incrementCounter = () => setCounter((prev) => prev + 1);
  const [gameData, setGameData] = createSignal<number[]>([]);
  function nextMap() {
    incrementCounter();
    setData(maps[Math.floor(Math.random() * maps.length)]);
  }

  return (
    <>
      <Show when={counter() >= 4}>
        <div class="flex flex-col items-center justify-center">
          <span>
            {' '}
            {gameData()
              .map((x) => x.toString())
              .join(', ')}
          </span>
          <span>{gameData().reduce((a, b) => a + b, 0)}</span>
          <button
            onClick={() => {
              setGameData([]);
              setCounter(1);
              setData(maps[Math.floor(Math.random() * maps.length)]);
            }}
          >
            Restart
          </button>
        </div>
      </Show>
      <div class={counter() < 4 ? '' : 'hidden'}>
        <Map data={data()} setGameData={setGameData} nextMap={nextMap} />
        {panoramaTextures() && (
          <View data={data} textures={panoramaTextures() || []} />
        )}
        <Show when={!panoramaTextures()}>
          <div class="mx-auto my-24 h-2 w-96">
            Loading panoramas... ({loadedImageCount()}/{maps.length})
            <div class="my-2 h-full w-full rounded outline outline-2 outline-offset-1 outline-gray-300">
              <div
                class="h-full w-full rounded bg-green-500"
                style={{
                  transition: 'width 150ms ease-out',
                  width: `${(loadedImageCount() / maps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </Show>
      </div>
    </>
  );
}

export default App;
