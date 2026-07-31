export type RadioBossStationConfig = {
  apiBase: string;
  stationId: string;
};

const station = (apiBase: string, stationId = ""): RadioBossStationConfig => ({
  apiBase,
  stationId,
});

/**
 * Configuración pública y no sensible.
 *
 * Los identificadores pueden colocarse aquí, pero se recomienda configurarlos
 * mediante variables de entorno en Netlify. La clave API nunca debe escribirse
 * en este archivo ni subirse a GitHub.
 */
export const radioBossApi = {
  stations: {
    fieramix: station("https://c11.radioboss.fm"),
    "solo-bachata": station("https://c15.radioboss.fm"),
    "solo-merengue": station("https://c15.radioboss.fm"),
    "solo-salsa": station("https://c15.radioboss.fm"),
    "solo-baladas": station("https://c15.radioboss.fm"),
    "solo-reggaeton": station("https://c13.radioboss.fm"),
    "solo-rancheras": station("https://c11.radioboss.fm"),
    "solo-musica-internacional": station("https://c13.radioboss.fm"),
    "solo-musica-cristiana": station("https://c11.radioboss.fm"),
  } as Record<string, RadioBossStationConfig>,
};
