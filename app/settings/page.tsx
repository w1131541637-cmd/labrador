// src/types/database.ts
export interface Politics {
  id: string;
  user_id: string;
  country_name: string;
  flag_emoji: string;
  flag_url: string;
  motto: string;
  regions_count: number;
  capital_city: string;
  head_state: string;
  internacional_trust: number;
  leader_title: string;
  leader_photo_url: string;
  religion: string;
  currency: string;
  political_power: number;
  state_structure: string; // ← ADICIONADO
  ammo: number;
  soldiers: number;
  tanks: number;
  artillery: number;
  drone: number;
  aircraft: number;
  helicopter: number;
  ships: number;
  submarine: number;
  missile: number;
  warhead: number;
}