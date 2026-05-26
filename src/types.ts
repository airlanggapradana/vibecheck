export interface Song {
  id: string;
  title: string;
  artist: string;
}

export interface Metric {
  labelLeft: string;
  labelRight: string;
  value: number; // 0-100
}

export interface MissingTrack {
  title: string;
  artist: string;
  reason: string;
}

export interface PersonalityProfile {
  themeName: string;
  traits: string[];
  musicalVibe: string;
  summary: string;
  hexColor: string;
  metrics: Metric[];
  missingTrack: MissingTrack;
}
