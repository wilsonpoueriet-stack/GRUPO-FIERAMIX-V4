import { stations } from "@/data/stations";
import type { Station, StationId } from "@/types/station";

/**
 * Núcleo de consulta para las emisoras de GRUPO FIERAMIX.
 *
 * v1.1:
 * - Usa StationId estricto.
 * - Mantiene compatibilidad con la plataforma actual.
 * - Valida IDs duplicados al inicializar.
 */
class StationEngine {
  private readonly stationList: readonly Station[];

  constructor(stationList: readonly Station[]) {
    if (stationList.length === 0) {
      throw new Error("StationEngine requiere al menos una emisora.");
    }

    const ids = new Set<StationId>();

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

  getStation(id: StationId): Station | undefined {
    return this.stationList.find((station) => station.id === id);
  }

  getStationOrDefault(id: StationId): Station {
    return this.getStation(id) ?? this.getDefaultStation();
  }

  hasStation(id: string): id is StationId {
    return this.stationList.some((station) => station.id === id);
  }

  parseStationId(value: string | null | undefined): StationId | null {
    if (!value || !this.hasStation(value)) {
      return null;
    }

    return value;
  }

  getIndex(id: StationId): number {
    return this.stationList.findIndex((station) => station.id === id);
  }

  getNextStation(id: StationId): Station {
    const currentIndex = this.getIndex(id);

    if (currentIndex < 0) {
      return this.getDefaultStation();
    }

    return this.stationList[(currentIndex + 1) % this.stationList.length];
  }

  getPreviousStation(id: StationId): Station {
    const currentIndex = this.getIndex(id);

    if (currentIndex < 0) {
      return this.getDefaultStation();
    }

    return this.stationList[
      (currentIndex - 1 + this.stationList.length) % this.stationList.length
    ];
  }

  supportsListeners(station: Station): boolean {
    return station.features?.listeners ?? true;
  }

  supportsHistory(station: Station): boolean {
    return station.features?.history ?? false;
  }

  supportsSongRequest(station: Station): boolean {
    return station.features?.songRequest ?? false;
  }

  supportsTop10(station: Station): boolean {
    return station.features?.top10 ?? false;
  }

  supportsSchedule(station: Station): boolean {
    return station.features?.schedule ?? false;
  }
}

export const stationEngine = new StationEngine(stations);
