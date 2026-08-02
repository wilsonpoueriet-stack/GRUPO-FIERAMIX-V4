type StationApiConfig = {
  apiBase: string;
  stationId: string;
};

export const radioBossApi = {
  apiKey: process.env.RADIOBOSS_API_KEY ?? "",
  stations: {
    fieramix: {
      apiBase: "https://c11.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_FIERAMIX ?? "",
    },
    bachata: {
      apiBase: "https://c15.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_BACHATA ?? "",
    },
    merengue: {
      apiBase: "https://c15.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_MERENGUE ?? "",
    },
    salsa: {
      apiBase: "https://c15.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_SALSA ?? "",
    },
    baladas: {
      apiBase: "https://c15.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_BALADAS ?? "",
    },
    reggaeton: {
      apiBase: "https://c13.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_REGGAETON ?? "",
    },
    rancheras: {
      apiBase: "https://c11.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_RANCHERAS ?? "",
    },
    internacional: {
      apiBase: "https://c13.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_INTERNACIONAL ?? "",
    },
    cristiana: {
      apiBase: "https://c11.radioboss.fm",
      stationId: process.env.RADIOBOSS_STATION_CRISTIANA ?? "",
    },
  } satisfies Record<string, StationApiConfig>,
};
