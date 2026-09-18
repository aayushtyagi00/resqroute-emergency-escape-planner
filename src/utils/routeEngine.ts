import {
  BASELINE_ROUTES,
  INITIAL_DANGER_ZONES,
  INITIAL_HOSPITALS,
  INITIAL_IOT_SENSORS,
  INITIAL_SHELTERS,
} from '../data/mockData';
import {
  DangerZone,
  EmergencySetup,
  Hospital,
  IoTSensor,
  RouteOption,
  Shelter,
  WhatIfScenario,
} from '../types';

export interface EngineResult {
  routes: RouteOption[];
  recommendedRoute: RouteOption;
  recommendedShelter: Shelter;
  shelters: Shelter[];
  nearestHospital: Hospital;
  hospitals: Hospital[];
  dangerZones: DangerZone[];
  sensors: IoTSensor[];
  evacuationWindowMinutes: number;
  overallThreatLevel: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Critical';
  weightBreakdown: {
    disasterRisk: number;
    roadCondition: number;
    distance: number;
    travelTime: number;
    traffic: number;
    shelterAccessibility: number;
    vulnerabilityPenalty: number;
  };
}

// Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function computeEmergencyPlan(
  setup: EmergencySetup,
  scenario: WhatIfScenario,
  customFacilities?: {
    shelters?: Shelter[];
    hospitals?: Hospital[];
    dangerZones?: DangerZone[];
    sensors?: IoTSensor[];
    routes?: RouteOption[];
  }
): EngineResult {
  const originLat = setup.latitude ?? 28.6139;
  const originLng = setup.longitude ?? 77.2090;

  // 1. Calculate weights based on disaster type & vulnerabilities
  let w_disaster = 0.30;
  let w_road = 0.20;
  let w_distance = 0.15;
  let w_time = 0.10;
  let w_traffic = 0.10;
  let w_shelter = 0.10;
  let w_vuln = 0.05;

  if (setup.emergencyType === 'flash_flood') {
    w_disaster = 0.35;
    w_road = 0.20;
  } else if (setup.emergencyType === 'landslide') {
    w_road = 0.35;
    w_disaster = 0.25;
  } else if (setup.emergencyType === 'wildfire') {
    w_disaster = 0.40;
    w_time = 0.15;
  } else if (setup.emergencyType === 'earthquake') {
    w_road = 0.30;
    w_traffic = 0.15;
  } else if (setup.emergencyType === 'accident') {
    w_traffic = 0.25;
    w_road = 0.25;
    w_disaster = 0.15;
  }

  const hasInjured = setup.vulnerabilities.injured || scenario.injuredPersonAdded;
  const hasElderly = setup.vulnerabilities.elderly;
  const hasChildren = setup.vulnerabilities.children;
  const hasDisabled = setup.vulnerabilities.disabled;

  if (hasInjured) {
    w_shelter = 0.20;
    w_road = 0.25;
    w_vuln = 0.15;
  }

  // Normalize all factor weights so their sum is strictly 1.0 (100%)
  const totalWeight =
    w_disaster + w_road + w_distance + w_time + w_traffic + w_shelter + w_vuln;
  w_disaster /= totalWeight;
  w_road /= totalWeight;
  w_distance /= totalWeight;
  w_time /= totalWeight;
  w_traffic /= totalWeight;
  w_shelter /= totalWeight;
  w_vuln /= totalWeight;

  // 2. Adjust Sensors based on scenario
  const rawSensors = customFacilities?.sensors && customFacilities.sensors.length > 0 ? customFacilities.sensors : INITIAL_IOT_SENSORS;
  const sensors: IoTSensor[] = rawSensors.map((s) => {
    const copy = { ...s };
    if (scenario.heavyRainSurge) {
      if (s.type === 'water_level') {
        copy.value = 88;
        copy.status = 'critical';
        copy.trend = 'rising';
      }
      if (s.type === 'rainfall') {
        copy.value = 112;
        copy.status = 'critical';
        copy.trend = 'rising';
      }
      if (s.type === 'landslide_tilt') {
        copy.value = 5.6;
        copy.status = 'critical';
      }
    }
    return copy;
  });

  // 3. Adjust Danger Zones
  const rawDangerZones = customFacilities?.dangerZones && customFacilities.dangerZones.length > 0 ? customFacilities.dangerZones : INITIAL_DANGER_ZONES;
  const dangerZones: DangerZone[] = rawDangerZones.map((dz) => {
    const copy = { ...dz };
    if (scenario.heavyRainSurge && dz.type === 'flash_flood') {
      copy.radiusKm = 2.4;
      copy.severity = 'critical';
      copy.description = 'Extreme surge: Water overflowing embankments. All adjacent bridges in danger.';
    }
    return copy;
  });

  // 4. Adjust Shelters based on scenario & live origin coordinates
  const speedKmH =
    setup.transportMode === 'walking'
      ? 4.5
      : setup.transportMode === 'bike'
      ? 14
      : setup.transportMode === 'bus'
      ? 24
      : 35;

  const rawShelters = customFacilities?.shelters && customFacilities.shelters.length > 0 ? customFacilities.shelters : INITIAL_SHELTERS;
  const shelters: Shelter[] = rawShelters.map((sh) => {
    const copy = { ...sh };
    if (scenario.shelterAlphaFull && (sh.id === 'sh-1' || sh.id === 'shelter-live-1')) {
      copy.capacityOccupied = copy.capacityTotal;
      copy.status = 'Full';
      copy.riskLevel = 'High';
    }

    if (sh.coordinates && sh.coordinates.lat && sh.coordinates.lng) {
      const realDist = calculateHaversineDistanceKm(
        originLat,
        originLng,
        sh.coordinates.lat,
        sh.coordinates.lng
      );
      if (realDist > 0) {
        copy.distanceKm = realDist;
        copy.timeMinutes = Math.max(1, Math.round((realDist / speedKmH) * 60));
      }
    }
    return copy;
  });

  // Determine target recommended shelter
  let recommendedShelter = shelters.find((s) => s.status !== 'Full') || shelters[0];
  if (hasInjured) {
    // Prefer shelter with medical post
    const medicalShelter = shelters.find((s) => s.hasMedicalPost && s.status !== 'Full');
    if (medicalShelter) recommendedShelter = medicalShelter;
  }

  // 5. Adjust Hospitals based on origin coordinates
  const rawHospitals = customFacilities?.hospitals && customFacilities.hospitals.length > 0 ? customFacilities.hospitals : INITIAL_HOSPITALS;
  const hospitals: Hospital[] = rawHospitals.map((hosp) => {
    const copy = { ...hosp };
    if (hasInjured && (copy.id === 'hosp-1' || copy.id === 'hosp-live-1')) {
      copy.icuBedsAvailable = Math.max(1, (copy.icuBedsAvailable || 12) - 2);
    }
    if (copy.coordinates && copy.coordinates.lat && copy.coordinates.lng) {
      const realDist = calculateHaversineDistanceKm(
        originLat,
        originLng,
        copy.coordinates.lat,
        copy.coordinates.lng
      );
      if (realDist > 0) {
        copy.distanceKm = realDist;
        copy.timeMinutes = Math.max(1, Math.round((realDist / 35) * 60));
      }
    }
    return copy;
  });
  const nearestHospital: Hospital = hospitals[0];

  // 6. Compute Routes with dynamic GPS path points
  const timeMultiplier =
    setup.transportMode === 'walking'
      ? 3.8
      : setup.transportMode === 'bike'
      ? 1.4
      : setup.transportMode === 'bus'
      ? 1.2
      : 1.0;

  const rawRoutes = customFacilities?.routes && customFacilities.routes.length > 0 ? customFacilities.routes : BASELINE_ROUTES;
  const isCustomRoadRoute = !!(customFacilities?.routes && customFacilities.routes.length > 0);

  const routes: RouteOption[] = rawRoutes.map((base) => {
    const r: RouteOption = JSON.parse(JSON.stringify(base));

    // Base time adjusted by transport mode
    r.timeMinutes = Math.round(base.timeMinutes * timeMultiplier);

    // Dynamic GPS path coordinates alignment
    if (r.pathPoints.length > 0) {
      r.pathPoints[0].lat = originLat;
      r.pathPoints[0].lng = originLng;
      r.pathPoints[0].name = setup.location || 'Current Position';

      // If not custom OSRM route, align endpoint to shelter
      if (!isCustomRoadRoute) {
        const destPt = r.pathPoints[r.pathPoints.length - 1];
        if (recommendedShelter.coordinates.lat && recommendedShelter.coordinates.lng) {
          destPt.lat = recommendedShelter.coordinates.lat;
          destPt.lng = recommendedShelter.coordinates.lng;
          destPt.name = recommendedShelter.name;
        }
      }

      // Calculate path distance from genuine GPS waypoints if not already computed by OSRM
      if (!isCustomRoadRoute) {
        let totalPathDist = 0;
        for (let i = 0; i < r.pathPoints.length - 1; i++) {
          const p1 = r.pathPoints[i];
          const p2 = r.pathPoints[i + 1];
          if (p1.lat && p1.lng && p2.lat && p2.lng) {
            totalPathDist += calculateHaversineDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
          }
        }
        if (totalPathDist > 0) {
          r.distanceKm = Math.round(totalPathDist * 10) / 10;
          const speedMultiplier =
            r.roadCondition === 'Waterlogged' ? 0.5 : r.gradient === 'Steep Mountain' ? 0.75 : 1.0;
          r.timeMinutes = Math.max(
            1,
            Math.round((r.distanceKm / (speedKmH * speedMultiplier)) * 60)
          );
        }
      }
    }

    // Weather impact
    if (scenario.heavyRainSurge) {
      if (r.id === 'route-a') {
        r.factors.disasterRisk = 12;
        r.factors.roadCondition = 20;
        r.floodRisk = 'Severe';
        r.roadCondition = 'Waterlogged';
      } else if (r.id === 'route-b') {
        r.factors.disasterRisk = 88;
        r.factors.roadCondition = 84;
      }
    }

    // Road A block scenario
    if ((scenario.roadABlocked || (scenario.heavyRainSurge && sensors[0].value >= 85)) && r.id === 'route-a') {
      r.status = 'blocked';
      r.safetyScore = 15;
      r.blockedReason = 'Bridge 2 Submerged by 88cm water surge. Road barricaded by Emergency Response.';
      r.cautions.unshift('ROAD IS CURRENTLY IMPASSABLE DUE TO FLOODWATER');
      return r;
    }

    // Vulnerability penalties and boosts
    let vulnScore = 90;
    if (hasElderly) {
      if (r.gradient === 'Steep Mountain') vulnScore -= 30;
      if (setup.transportMode === 'walking') vulnScore -= 20;
      if (r.roadCondition !== 'Paved & Clear' && r.roadCondition !== 'Good') vulnScore -= 25;
    }
    if (hasInjured) {
      if (r.id === 'route-c') vulnScore += 10; // Highway connects right to hospital
      if (r.roadCondition === 'Waterlogged' || r.roadCondition === 'Debris & Unstable') vulnScore -= 40;
    }
    if (hasDisabled) {
      if (r.roadCondition !== 'Paved & Clear') vulnScore -= 35;
    }
    if (hasChildren && r.factors.disasterRisk < 60) {
      vulnScore -= 20;
    }
    r.factors.vulnerabilityFit = Math.max(10, Math.min(100, vulnScore));

    // Calculate composite safety score: 0 to 100
    const compositeScore = Math.round(
      r.factors.disasterRisk * w_disaster +
      r.factors.roadCondition * w_road +
      r.factors.distanceScore * w_distance +
      r.factors.travelTimeScore * w_time +
      r.factors.trafficScore * w_traffic +
      r.factors.shelterAccessibility * w_shelter +
      r.factors.vulnerabilityFit * w_vuln
    );

    // Evacuation delay reduces overall margin
    const delayPenalty = Math.round((scenario.evacuationDelayMinutes / 60) * 18);
    r.safetyScore = Math.max(5, Math.min(99, compositeScore - delayPenalty));

    // Classify status
    if (r.safetyScore >= 80) {
      r.status = 'recommended';
    } else if (r.safetyScore >= 60) {
      r.status = 'available';
    } else {
      r.status = 'risky';
    }

    return r;
  });

  // Pick top recommended route (highest safety score among non-blocked)
  const nonBlocked = routes.filter((r) => r.status !== 'blocked');
  nonBlocked.sort((a, b) => b.safetyScore - a.safetyScore);

  // If injured is active, route-c or high safety with hospital connection gets highest priority
  let topRoute = nonBlocked[0] || routes[0];
  if (hasInjured) {
    const accessibleRoute = routes.find((r) => r.id === 'route-c' && r.status !== 'blocked');
    if (accessibleRoute && accessibleRoute.safetyScore >= 75) {
      topRoute = accessibleRoute;
    }
  }

  // Tag top route as recommended
  routes.forEach((r) => {
    if (r.id === topRoute.id) {
      r.status = 'recommended';
    } else if (r.status !== 'blocked') {
      r.status = r.safetyScore >= 60 ? 'available' : 'risky';
    }
  });

  // Calculate remaining evacuation window
  let evacuationWindowMinutes = Math.max(5, 35 - scenario.evacuationDelayMinutes - (scenario.heavyRainSurge ? 10 : 0));

  const overallThreatLevel =
    scenario.heavyRainSurge || scenario.roadABlocked ? 'Severe' :
    topRoute.safetyScore < 70 ? 'High' :
    topRoute.safetyScore < 85 ? 'Moderate' : 'Low';

  return {
    routes,
    recommendedRoute: topRoute,
    recommendedShelter,
    shelters,
    nearestHospital,
    hospitals,
    dangerZones,
    sensors,
    evacuationWindowMinutes,
    overallThreatLevel,
    weightBreakdown: (() => {
      const dRisk = Math.round(w_disaster * 100);
      const rCond = Math.round(w_road * 100);
      const dist = Math.round(w_distance * 100);
      const tTime = Math.round(w_time * 100);
      const traf = Math.round(w_traffic * 100);
      const shAccess = Math.round(w_shelter * 100);
      const remaining = 100 - (dRisk + rCond + dist + tTime + traf + shAccess);
      return {
        disasterRisk: dRisk,
        roadCondition: rCond,
        distance: dist,
        travelTime: tTime,
        traffic: traf,
        shelterAccessibility: shAccess,
        vulnerabilityPenalty: Math.max(0, remaining),
      };
    })(),
  };
}
