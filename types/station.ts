export type StationId =
  | "fieramix"
  | "bachata"
  | "merengue"
  | "salsa"
  | "baladas"
  | "reggaeton"
  | "rancheras"
  | "internacional"
  | "cristiana"
  | "ahora"
  | "utopia"
  | "latinamix"
  | "radio-bavaro"
  | "estrella"
  | "magia"
  | "makao";

export type StationFeatures = {
  listeners: boolean;
  history: boolean;
  songRequest: boolean;
  top10: boolean;
  schedule: boolean;
};

export type StationTheme = {
  accent: string;
  background?: string;
};

export type StationRadioBossPublicConfig = {
  apiBase: string;
  songRequestWidgetId?: number;
};

export type Station = {
  id: StationId;
  name: string;
  slogan: string;
  streamUrl: string;
  logo: string;
  genre: string;
  accent: string;

  /**
   * Campos opcionales preparados para la homologación.
   * No cambian el comportamiento actual del portal.
   */
  shortName?: string;
  description?: string;
  theme?: StationTheme;
  radioBoss?: StationRadioBossPublicConfig;
  features?: StationFeatures;
  /** Las emisoras invitadas pueden sonar y medir audiencia sin sumar al TOP. */
  rankingEligible?: boolean;
};
