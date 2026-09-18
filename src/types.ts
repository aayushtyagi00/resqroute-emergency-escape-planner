export type DisasterType = 'flash_flood' | 'landslide' | 'wildfire' | 'earthquake' | 'accident';

export type TransportMode = 'car' | 'walking' | 'ambulance' | 'bike' | 'bus';

export interface VulnerabilityFlags {
  elderly: boolean;
  children: boolean;
  injured: boolean;
  disabled: boolean;
}

export interface FactorScores {
  disasterRisk: number;       // 0-100 (lower risk = higher safety score)
  roadCondition: number;      // 0-100
  distanceScore: number;      // 0-100
  travelTimeScore: number;    // 0-100
  trafficScore: number;       // 0-100
  shelterAccessibility: number; // 0-100
  vulnerabilityFit: number;   // 0-100
}

export interface RoutePoint {
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  name?: string;
  isHazard?: boolean;
}

export interface RouteOption {
  id: string;
  name: string;
  tag: 'safest' | 'fastest' | 'accessible' | 'alternate';
  distanceKm: number;
  timeMinutes: number;
  safetyScore: number; // 0-100
  status: 'recommended' | 'available' | 'risky' | 'blocked';
  floodRisk: 'None' | 'Very Low' | 'Low' | 'Medium' | 'High' | 'Severe';
  roadCondition: 'Paved & Clear' | 'Good' | 'Fair' | 'Waterlogged' | 'Debris & Unstable' | 'Blocked';
  gradient: 'Gentle' | 'Moderate' | 'Steep Mountain' | 'Flat Valley';
  factors: FactorScores;
  benefits: string[];
  cautions: string[];
  pathPoints: RoutePoint[];
  suitableFor: string[];
  blockedReason?: string;
}

export interface Shelter {
  id: string;
  name: string;
  type: 'Community Hall' | 'Higher Secondary School' | 'Sports Complex' | 'Disaster Relief Camp' | 'Town Hall';
  distanceKm: number;
  timeMinutes: number;
  capacityTotal: number;
  capacityOccupied: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  status: 'Available' | 'Filling Fast' | 'Almost Full' | 'Full';
  amenities: string[];
  wheelchairAccessible: boolean;
  hasMedicalPost: boolean;
  foodSuppliesDays: number;
  coordinates: { x: number; y: number; lat?: number; lng?: number };
}

export interface Hospital {
  id: string;
  name: string;
  distanceKm: number;
  timeMinutes: number;
  traumaLevel: 'Level 1 Trauma' | 'District Emergency Hospital' | 'Community Clinic';
  icuBedsAvailable: number;
  ambulanceAccess: 'Clear' | 'Heavy Traffic' | 'Impaired';
  emergencyStatus: 'Active & Accepting' | 'Triage Only' | 'Overcapacity';
  coordinates: { x: number; y: number; lat?: number; lng?: number };
}

export interface DangerZone {
  id: string;
  name: string;
  type: DisasterType;
  severity: 'moderate' | 'high' | 'critical';
  radiusKm: number;
  center: { x: number; y: number; lat?: number; lng?: number };
  description: string;
  expansionRate: string;
}

export interface IoTSensor {
  id: string;
  name: string;
  coordinates?: { lat: number; lng: number };
  location: string;
  type: 'water_level' | 'rainfall' | 'landslide_tilt' | 'smoke_aqi' | 'bridge_stress';
  value: number;
  unit: string;
  threshold: number;
  status: 'normal' | 'warning' | 'critical';
  trend: 'rising' | 'stable' | 'falling';
  lastUpdated: string;
}

export interface OfflineTileSector {
  id: string;
  name: string;
  description: string;
  tileCount: number;
  sizeMb: number;
  status: 'cached' | 'downloading' | 'pending';
}

export interface OfflineStorageState {
  tilesDownloaded: boolean;
  downloadProgress: number; // 0 - 100
  isDownloading: boolean;
  downloadedAt?: string;
  totalSizeMb: number;
  totalTiles: number;
  cacheVersion: string;
  sectors: OfflineTileSector[];
  isSimulatedOffline: boolean;
}

export interface EmergencySetup {
  location: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationSource?: 'gps' | 'manual' | 'preset';
  emergencyType: DisasterType;
  peopleCount: number;
  vulnerabilities: VulnerabilityFlags;
  transportMode: TransportMode;
  offlineTilesEnabled?: boolean;
  offlineStorage?: OfflineStorageState;
}

export interface WhatIfScenario {
  roadABlocked: boolean;
  heavyRainSurge: boolean;
  shelterAlphaFull: boolean;
  injuredPersonAdded: boolean;
  evacuationDelayMinutes: number;
}

export interface ChecklistItem {
  id: string;
  category: 'Essential' | 'Medical' | 'Special Care' | 'Documentation' | 'Gear';
  text: string;
  checked: boolean;
  criticalFor: string[];
}
