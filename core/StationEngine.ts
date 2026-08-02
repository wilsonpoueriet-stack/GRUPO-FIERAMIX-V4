import { stations } from "@/data/stations";
import type { Station } from "@/types/station";

/**
 * Núcleo de consulta para las emisoras de GRUPO FIERAMIX.
 *
 * Esta primera versión no modifica el comportamiento del portal.
 * Centraliza búsquedas y navegación para que los componentes dejen de
 * manipular directamente el arreglo `stations`.
 */
class StationEngine {
  private readonly stationList: readonly Station[];

  constructor(stationList: readonly Station[]) {
    if (stationList.length === 0) {
      throw new Error("StationEngine requiere al menos una emisora.");
    }

    const ids = new Set<string>();

    for (const station of stationList) {
      if (ids.has(station.id)) {
        throw new Error(`ID de emisora duplicado: ${station.id}`);
      }

      ids.add(station.id);
    }

    this.stationList = stationList;
  }

  getStations(): readonly Station[] {
    return this.stationList;
  }

  getDefaultStation(): Station {
    return this.stationList[0];
  }

  getStation(id: string): Station | undefined {
    return this.stationList.find((station) => station.id === id);
  }

  getStationOrDefault(id: string): Station {
    return this.getStation(id) ?? this.getDefaultStation();
  }

  hasStation(id: string): boolean {
    return this.stationList.some((station) => station.id === id);
  }

  getIndex(id: string): number {
    return this.stationList.findIndex((station) => station.id === id);
  }

  getNextStation(id: string): Station {
    const currentIndex = this.getIndex(id);

    if (currentIndex < 0) {
      return this.getDefaultStation();
    }

    return this.stationList[(currentIndex + 1) % this.stationList.length];
  }

  getPreviousStation(id: string): Station {
    const currentIndex = this.getIndex(id);

    if (currentIndex < 0) {
      return this.getDefaultStation();
    }

    return this.stationList[
      (currentIndex - 1 + this.stationList.length) % this.stationList.length
    ];
  }
}

export const stationEngine = new StationEngine(stations);
