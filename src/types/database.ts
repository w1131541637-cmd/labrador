/**
 * src/types/database.ts
 * Tipos TypeScript com TODAS as colunas EXATAS da planilha
 */

// ============================================================================
// POLITICS
// ============================================================================
export interface Politics {
  id: string;
  user_id: string;
  country_name: string;
  flag_emoji: string;
  motto: string;
  regions_count: number;
  capital_city: string;
  head_state: string;
  internacional_trust: number;
  leader_title: string;
  religion: string;
  currency: string;
  political_power: number;
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

// ============================================================================
// USERS
// ============================================================================
export interface Users {
  id: string;
  user_id: string;
  email: string;
  password: string;
  created_at: string;
  last_login: string;
  is_active: boolean;
  role: string;
  flag_url: string;
  leader_url: string;
  banner1_url: string;
  banner2_url: string;
  banner3_url: string;
  banner4_url: string;
  banner5_url: string;
  banner6_url: string;
  banner7_url: string;
  banner8_url: string;
  banner9_url: string;
  last_updated: string;
}

// ============================================================================
// BUILDING
// ============================================================================
export interface Building {
  id: string;
  user_id: string;
  wind_farm: number;
  nuclear_power_plant: number;
  hydroelectric_power_plant: number;
  oil_power_plant: number;
  coal_power_plant: number;
  farm: number;
  gold_mine: number;
  iron_mine: number;
  oil_well: number;
  coal_mine: number;
  sawmill: number;
  uranium_mine: number;
  steel_mill: number;
  police_station: number;
  bombers_station: number;
  hospital: number;
  school: number;
  university: number;
  supermarket: number;
  shopping_mall: number;
  recycling_center: number;
  subway: number;
  train: number;
  airport: number;
  port: number;
  terminal: number;
  highways: number;
  oil_station: number;
  park: number;
  treatment_plant: number;
  residence: number;
  office: number;
  research_center: number;
  weapons_factory: number;
  last_updated: string;
}

// ============================================================================
// ECONOMY
// ============================================================================
export interface Economy {
  id: string;
  user_id: string;
  money: number;
  revenue: number;
  expenses: number;
  hdi: number;
  inflation_rate: number;
  exports: number;
  imports: number;
  population: number;
  pollution: number;
  food: number;
  gold: number;
  iron: number;
  coal: number;
  oil: number;
  wood: number;
  uranium: number;
  steel: number;
  energy: number;
  last_updated: string;
}

// ============================================================================
// PHYSICAL (Biomas/Terrenos)
// ============================================================================
export interface Physical {
  id: string;
  material: string;
  depressions: number;
  plains: number;
  mountains: number;
  plateaus: number;
  coastline: number;
  desert: number;
  prairies: number;
  savannas: number;
  tropical_forest: number;
  temperate_forest: number;
  tundra: number;
  taiga: number;
  urban: number;
}

// ============================================================================
// BALANCE (Produção e Manutenção)
// ============================================================================
export interface Balance {
  id: string;
  material: string;
  waiting_time: number;
  production: number;
  perfomace: number;
  energy: number;
  maintenance: number;
  gold: number;
  iron: number;
  coal: number;
  uranium: number;
  wood: number;
  steel: number;
  oil: number;
  food: number;
}

// ============================================================================
// CHAT
// ============================================================================
export interface Chat {
  id: string;
  user_id: string;
  flag_emoji: string;
  message: string;
  created_at: string;
  media_type: string;
  media_url: string;
  poll: string;
}

// ============================================================================
// COMMENTS
// ============================================================================
export interface Comments {
  id: string;
  user_id: string;
  created_at: string;
  post_id: string;
  author_id: string;
  avatar_url: string;
  content: string;
  likes: number;
  dislikes: number;
}

// ============================================================================
// POST
// ============================================================================
export interface Post {
  id: string;
  user_id: string;
  created_at: string;
  post_id: string;
  title: string;
  content: string;
  newspaper: string;
  country: string;
  avatar_url: string;
  media_url: string;
  music_url: string;
  share: number;
  likes: number;
  deslikes: number;
  comments_count: number;
}

// ============================================================================
// TAXES
// ============================================================================
export interface Taxes {
  user_id: string;
  last_updated: string;
  income_tax: number;
  corporate_tax: number;
  property_tax: number;
  manufacturing_tax: number;
  vat: number;
  customs: number;
}

// ============================================================================
// DESTROYED BUILDINGS
// ============================================================================
export interface DestroyedBuildings {
  id: string;
  user_id: string;
  building_name: string;
  region_name: string;
  destroyed_at: string;
  effect: string;
}

// ============================================================================
// MILITARY LOSSES
// ============================================================================
export interface MilitaryLosses {
  user_id: string;
  soldiers: number;
  tanks: number;
  ships: number;
  submarine: number;
  missiles: number;
  aircraft: number;
  drones: number;
  helicopters: number;
  artillery: number;
}

// ============================================================================
// WAR
// ============================================================================
export interface War {
  id: string;
  attacker_country: string;
  attacker_flag: string;
  attacker_damage: number;
  defender_country: string;
  defender_flag: string;
  defender_damage: number;
  start_date: string;
  ends_at: string;
  region_name: string;
  winner_id: string;
  biome: string;
  relief: string;
}

// ============================================================================
// MARKET
// ============================================================================
export interface Market {
  id: string;
  seller_country: string;
  seller_flag: string;
  resource: string;
  type: string;
  price: number;
  quantity: number;
  available: number;
  created_at: string;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
export interface Notifications {
  id: string;
  user_id: string;
  type: string;
  message: string;
  title: string;
  is_read: boolean;
  created_at: string;
  read: string;
}