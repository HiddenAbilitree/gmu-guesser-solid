import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapData } from '../data';
import { Setter } from 'solid-js';

export default function Map(props: {
  data: MapData;
  setGameData: Setter<number[]>;
  nextMap: () => void;
}) {
  const [map, setMap] = createSignal<maplibregl.Map>();
  const [userMarker, setUserMarker] = createSignal<maplibregl.Marker>();
  const [solutionMarker, setSolutionMarker] = createSignal<maplibregl.Marker>();
  const [distance, setDistance] = createSignal<number>();
  onMount(() => {
    const map = new maplibregl.Map({
      container: 'map', // container id
      style: 'https://tiles.openfreemap.org/styles/liberty', // style URL
      center: [-77.30720649743205, 38.83095313606133], // starting position [lng, lat]
      zoom: 16, // starting zoom
      minZoom: 14,
      maplibreLogo: false,
      attributionControl: {
        compact: true,
      },
      maxBounds: [
        [-77.31456068310384, 38.82217363377614],
        [-77.29968251510037, 38.83736941965788],
      ],
    });

    setMap(map);
    props.nextMap();

    map.once('load', () => {
      map.on('click', (e: maplibregl.MapMouseEvent) => {
        if (solutionMarker()) return;
        const userMarker = new maplibregl.Marker({
          color: '#FF0000',
          draggable: false,
        })
          .setLngLat(e.lngLat)
          .addTo(e.target);
        setUserMarker((prev) => {
          prev?.remove();
          return userMarker;
        });
      });
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [],
          },
        },
      });
    });
  });

  onCleanup(() => map()?.remove());
  return (
    <>
      <div id="map" class="h-[50vh] w-[50vw]" />
      <button
        onClick={() => {
          const curUserMarker = userMarker();
          if (!curUserMarker) return;

          const curMap = map();

          if (!curMap) return;
          const source = curMap.getSource('route') as maplibregl.GeoJSONSource;
          if (!source) return;
          if (solutionMarker()) return;
          const newSolutionMarker = setSolutionMarker(() => {
            return new maplibregl.Marker({
              color: '#0AFF00',
              draggable: false,
            })
              .setLngLat([props.data.latlong[1], props.data.latlong[0]])
              .addTo(curMap);
          });

          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                curUserMarker.getLngLat().toArray(),
                props.data.latlong.reverse() as [number, number],
              ],
            },
          });
          const distance = Math.floor(
            Math.max(
              0,
              1000 -
                curUserMarker
                  .getLngLat()
                  .distanceTo(newSolutionMarker.getLngLat()),
            ),
          );
          props.setGameData((prev) => [...prev, distance]);
          setDistance(distance);
          curMap.addLayer({
            id: 'routeLine',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#888',
              'line-width': 8,
            },
          });
        }}
        class="absolute left-1/2 top-5 z-50 -translate-x-1/2 rounded-md bg-slate-700 px-3 py-2 text-white hover:bg-slate-800"
      >
        Submit
      </button>

      <button
        onClick={() => {
          const curMap = map();
          if (!curMap) return;

          if (curMap.getLayer('routeLine')) {
            curMap.removeLayer('routeLine');
          }
          if (!solutionMarker()) return;

          setUserMarker((prev) => {
            prev?.remove();
            return undefined;
          });
          setSolutionMarker((prev) => {
            prev?.remove();
            return undefined;
          });
          setDistance(undefined);
          props.nextMap();
        }}
        class="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-md bg-slate-700 px-3 py-2 text-white hover:bg-slate-800"
      >
        Next
      </button>
      <Show when={distance()}>
        <div class="absolute left-1/2 top-32 z-50 -translate-x-1/2 rounded-md bg-slate-700 px-3 py-2 text-white">
          {distance()}
        </div>
      </Show>
    </>
  );
}