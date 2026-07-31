export const radioBossApi = {
  /**
   * Copia aquí la URL API y la clave que aparecen en el panel de RadioBOSS Cloud.
   * Ejemplo de URL base: https://c11.radioboss.fm
   * Mientras estos valores estén vacíos, el portal seguirá funcionando y mostrará
   * el nombre de la emisora como información de la transmisión.
   */
  apiKey: "",
  stations: {
    fieramix: { apiBase: "https://c11.radioboss.fm", stationId: "" },
    "solo-bachata": { apiBase: "https://c15.radioboss.fm", stationId: "" },
    "solo-merengue": { apiBase: "https://c15.radioboss.fm", stationId: "" },
    "solo-salsa": { apiBase: "https://c15.radioboss.fm", stationId: "" },
    "solo-baladas": { apiBase: "https://c15.radioboss.fm", stationId: "" },
    "solo-reggaeton": { apiBase: "https://c13.radioboss.fm", stationId: "" },
    "solo-rancheras": { apiBase: "https://c11.radioboss.fm", stationId: "" },
    "solo-musica-internacional": { apiBase: "https://c13.radioboss.fm", stationId: "" },
    "solo-musica-cristiana": { apiBase: "https://c11.radioboss.fm", stationId: "" },
  } as Record<string, { apiBase: string; stationId: string }>,
};
