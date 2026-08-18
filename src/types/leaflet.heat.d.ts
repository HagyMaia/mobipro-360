declare module 'leaflet.heat' {
  import type * as L from 'leaflet';

  type HeatLatLngTuple = [number, number, number?];

  interface HeatOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  interface HeatLayer extends L.Layer {
    setOptions(options: HeatOptions): HeatLayer;
    addLatLng(latlng: HeatLatLngTuple | L.LatLng): HeatLayer;
    setLatLngs(latlngs: HeatLatLngTuple[] | L.LatLng[]): HeatLayer;
  }

  function heat(
    latlngs?: HeatLatLngTuple[] | L.LatLng[],
    options?: HeatOptions
  ): HeatLayer;

  export default heat;
}
