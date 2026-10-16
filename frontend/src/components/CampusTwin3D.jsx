
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import './CampusTwin3D.css';

// Coordinate system matches campus_map.py's 0..100 x/y layout.
const SCALE = 0.56;
const toX = (n) => (n - 50) * SCALE;
const toZ = (n) => (50 - n) * SCALE;

const BUILDINGS = [
  { name: 'A Block / School of Engineering', short: 'A BLOCK · SOE', box: [59, 77, 69, 84], color: '#9caeaa', height: 4.5, floors: 5, category: 'academic', aliases: ['A Block - SOE', 'A Block - School of Engineering', 'A Block', 'School of Engineering', 'SOE', 'Engineering Block'] },
  { name: 'B Block / AI Block', short: 'B BLOCK · AI', box: [67, 68, 74, 74], color: '#aab9b3', height: 5.5, floors: 6, category: 'academic', aliases: ['B Block - AI', 'B Block - AI Block', 'B Block', 'AI Block', 'Artificial Intelligence Block'] },
  { name: 'Academic Building', short: 'ACADEMIC', box: [50, 55, 59, 62], color: '#b8c4be', height: 4, floors: 4, category: 'academic', aliases: ['academic building', 'academic block'] },
  { name: 'BBA & B.Com', short: 'BBA · B.COM', box: [42, 48, 49, 54], color: '#b9c5be', height: 3.3, floors: 3, category: 'academic', aliases: ['bba & b.com', 'bba bcom', 'commerce block'] },
  { name: 'Nursing Building', short: 'NURSING', box: [58, 48, 65, 54], color: '#b7c3bd', height: 3.8, floors: 4, category: 'academic', aliases: ['nursing building', 'nursing block'] },
  { name: 'CDSIMER Medical College', short: 'CDSIMER', box: [61, 39, 70, 46], color: '#c0c9c1', height: 5.2, floors: 5, category: 'medical', aliases: ['CDSIMER Medical College', 'CDSIMER - Medical College', 'CDSIMER', 'Medical College'] },
  { name: 'Library', short: 'LIBRARY', box: [47, 42, 53, 47], color: '#d3d6c5', height: 3.2, floors: 2, category: 'academic', aliases: ['library'] },
  { name: 'Canteen', short: 'CANTEEN', box: [51, 37, 56, 41], color: '#bda47e', height: 2.2, floors: 1, category: 'service', aliases: ['canteen', 'food court'] },
  { name: 'ICICI Bank', short: 'ICICI BANK', box: [72, 42, 77, 46], color: '#a89fbe', height: 2.1, floors: 1, category: 'service', aliases: ['icici bank', 'bank'] },
  { name: 'Main Arena', short: 'MAIN ARENA', box: [76, 30, 85, 36], color: '#aa9bbd', height: 3.4, floors: 1, category: 'arena', aliases: ['main arena', 'auditorium', 'open auditorium'] },
  { name: 'Boys Hostel Tower 1', short: 'BOYS HOSTEL 1', box: [28, 10, 33, 16], color: '#bd987f', height: 9, floors: 10, category: 'hostel', aliases: ['Boys Hostel - 4 Sharing 1', 'Boys Hostel - 4 Sharing Tower 1', 'Boys Hostel Tower 1'] },
  { name: 'Boys Hostel Tower 2', short: 'BOYS HOSTEL 2', box: [33, 10, 38, 16], color: '#bd987f', height: 9, floors: 10, category: 'hostel', aliases: ['Boys Hostel - 4 Sharing 2', 'Boys Hostel - 4 Sharing Tower 2', 'Boys Hostel Tower 2'] },
  { name: 'Boys Hostel Tower 3', short: 'BOYS HOSTEL 3', box: [29, 5, 34, 10], color: '#ae886f', height: 8.5, floors: 10, category: 'hostel', aliases: ['Boys Hostel - 2 Sharing', 'Boys Hostel - 2 Sharing Tower', 'Boys Hostel Tower 3'] },
  { name: 'Girls Hostel Tower 1', short: 'GIRLS HOSTEL 1', box: [39, 10, 44, 16], color: '#c399aa', height: 9, floors: 10, category: 'hostel', aliases: ['Girls Hostel - 4 Sharing 1', 'Girls Hostel - 4 Sharing Tower 1', 'Girls Hostel Tower 1'] },
  { name: 'Girls Hostel Tower 2', short: 'GIRLS HOSTEL 2', box: [44, 10, 49, 16], color: '#c399aa', height: 9, floors: 10, category: 'hostel', aliases: ['Girls Hostel - 4 Sharing 2', 'Girls Hostel - 4 Sharing Tower 2', 'Girls Hostel Tower 2'] },
  { name: 'Girls Hostel Tower 3', short: 'GIRLS HOSTEL 3', box: [39, 5, 44, 10], color: '#b6859a', height: 8.5, floors: 10, category: 'hostel', aliases: ['Girls Hostel - 2 Sharing', 'Girls Hostel - 2 Sharing Tower', 'Girls Hostel Tower 3'] },
  { name: 'Staff Quarters Tower 1', short: 'STAFF QUARTERS 1', box: [77, 12, 82, 17], color: '#c8b681', height: 6.8, floors: 7, category: 'residential', aliases: ['staff quarters', 'staff quarters tower 1'] },
  { name: 'Staff Quarters Tower 2', short: 'STAFF QUARTERS 2', box: [82, 12, 87, 17], color: '#c8b681', height: 6.8, floors: 7, category: 'residential', aliases: ['staff quarters tower 2'] },
];

const SPORTS = [
  { name: 'Football Stadium', box: [86, 68, 97, 82], type: 'football', aliases: ['Football Ground', 'Football Stadium'] },
  { name: 'Cricket Ground', box: [88, 54, 97, 64], type: 'cricket', aliases: ['Cricket Ground'] },
  { name: 'Basketball Court 1', box: [80, 47, 84, 51], type: 'court', aliases: ['Basketball Courts', 'Basketball Court 1'] },
  { name: 'Basketball Court 2', box: [84.5, 47, 88.5, 51], type: 'court', aliases: ['Basketball Courts', 'Basketball Court 2'] },
  { name: 'Basketball Court 3', box: [89, 47, 93, 51], type: 'court', aliases: ['Basketball Courts', 'Basketball Court 3'] },
  { name: 'Volleyball Court 1', box: [80, 41, 84, 44], type: 'court', aliases: ['Volleyball Courts', 'Volleyball Court 1'] },
  { name: 'Volleyball Court 2', box: [85, 41, 89, 44], type: 'court', aliases: ['Volleyball Courts', 'Volleyball Court 2'] },
  { name: 'Pickleball Court 1', box: [80, 37.5, 84, 39.5], type: 'court', aliases: ['Pickleball Courts', 'Pickleball Court 1'] },
  { name: 'Pickleball Court 2', box: [85, 37.5, 89, 39.5], type: 'court', aliases: ['Pickleball Courts', 'Pickleball Court 2'] },
];

const ROADS = [
  { width: 1.05, points: [[13,0],[16,12],[23,24],[30,36],[38,48],[45,60],[53,72],[60,85],[65,100]] },
  { width: .72, points: [[38,48],[43,45],[48,40],[52,34]] },
  { width: .72, points: [[62,91],[57,82],[52,72],[48,62],[45,52],[47,43],[51,34],[54,26],[51,18]] },
  { width: .6, points: [[57,82],[66,85],[73,79],[78,69]] },
  { width: .72, points: [[43,60],[51,65],[60,64],[68,57],[72,48],[67,39],[58,35],[51,34]] },
  { width: .72, points: [[68,57],[76,62],[82,70],[88,76],[91,67],[89,56],[84,47],[78,40],[72,48]] },
  { width: .58, points: [[67,39],[74,34],[80,29],[84,24]] },
  { width: .72, points: [[51,34],[45,27],[39,20],[34,14],[29,9]] },
  { width: .58, points: [[39,20],[47,17],[56,17],[64,20],[70,24],[77,21],[84,18]] },
  { width: .58, points: [[64,20],[66,27],[67,39]] },
  { width: .45, points: [[48,62],[40,61],[34,55]] },
  { width: .45, points: [[58,35],[61,28],[64,20]] },
  { width: .45, points: [[76,62],[74,54],[78,40]] },
];

function makeReadingLookup(rows) {
  const map = new Map();
  const normalize = (s) => String(s ?? '').toLowerCase().trim().replace(/\s+/g, ' ');

  for (const row of rows || []) {
    const key = normalize(row.building ?? row.building_key ?? row.name);

    if (key) {
      const previous = map.get(key);
      const t = Date.parse(row.timestamp || '') || 0;
      const pt = Date.parse(previous?.timestamp || '') || 0;

      if (!previous || t >= pt) map.set(key, row);
    }
  }

  return { map, normalize };
}

function findReading(building, lookup) {
  const aliases = (building.aliases || [building.name])
    .map(lookup.normalize)
    .filter(Boolean);

  const exactRows = aliases
    .map((alias) => lookup.map.get(alias))
    .filter(Boolean);

  if (exactRows.length) {
    return exactRows.reduce((best, row) =>
      (Date.parse(row.timestamp || '') || 0) >=
      (Date.parse(best.timestamp || '') || 0) ? row : best
    );
  }

  let winner = null;
  let bestScore = -1;

  for (const [key, row] of lookup.map) {
    for (const alias of aliases) {
      if (!alias || !(key.includes(alias) || alias.includes(key))) continue;

      const score =
        Math.min(alias.length, key.length) * 100 +
        Math.min(alias.length, key.length) / Math.max(alias.length, key.length);

      const currentTime = Date.parse(row.timestamp || '') || 0;
      const winnerTime = Date.parse(winner?.timestamp || '') || 0;

      if (score > bestScore || (score === bestScore && currentTime > winnerTime)) {
        bestScore = score;
        winner = row;
      }
    }
  }

  return winner;
}

function formatValue(value, unit = '') {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) {
    return 'N/A';
  }

  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`;
}

function SensorPin({ item, reading, onSelect }) {
  const [hover, setHover] = useState(false);
  const [x0, y0, x1, y1] = item.box;
  const x = toX((x0 + x1) / 2);
  const z = toZ((y0 + y1) / 2);
  const buildingTop = (item.height || 2.5) + 0.25;

  return (
    <group position={[x, buildingTop, z]}>
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(item);
        }}
      >
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial
          color={reading ? '#f2cc62' : '#d6ded4'}
          emissive={reading ? '#8e6f20' : '#3a453b'}
          emissiveIntensity={0.5}
        />
      </mesh>

      {(hover || item.selected) && (
        <Html distanceFactor={14} position={[0, 0.42, 0]} center zIndexRange={[100, 0]}>
          <div className="ct3d-tooltip">
            <div className="ct3d-tooltip-kicker">CAMPUS SENSOR</div>
            <strong>{item.name}</strong>
            <div className="ct3d-readings">
              <span>Energy <b>{formatValue(reading?.energy, ' kWh')}</b></span>
              <span>Water <b>{formatValue(reading?.water, ' L')}</b></span>
              <span>Occupancy <b>{formatValue(reading?.occupancy)}</b></span>
              <span>Temperature <b>{formatValue(reading?.temperature, ' °C')}</b></span>
              <span>Waste <b>{formatValue(reading?.waste, ' kg')}</b></span>
            </div>
            {reading?.timestamp && <small>Updated {String(reading.timestamp)}</small>}
            {!reading && <small>No sensor reading matched this location yet.</small>}
          </div>
        </Html>
      )}
    </group>
  );
}

function Building({ item, reading, selected, onSelect }) {
  const [x0, y0, x1, y1] = item.box;
  const width = (x1 - x0) * SCALE;
  const depth = (y1 - y0) * SCALE;
  const x = toX((x0 + x1) / 2);
  const z = toZ((y0 + y1) / 2);
  const h = item.height;
  const [hover, setHover] = useState(false);
  const floorCount = item.floors || 2;
  const windowColor = item.category === 'hostel' ? '#e6d6c4' : '#d8e5df';
  const isSelected = selected === item.name;

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <boxGeometry args={[width + 0.24, 0.12, depth + 0.24]} />
        <meshStandardMaterial color={isSelected ? '#d5d1ad' : '#b8c4b0'} roughness={0.94} />
      </mesh>

      <mesh position={[0, h / 2 + 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, h, depth]} />
        <meshStandardMaterial color={isSelected ? '#d8d8bf' : item.color} roughness={0.83} metalness={0.02} />
      </mesh>

      <mesh position={[0, h + 0.2, 0]} castShadow>
        <boxGeometry args={[width + 0.08, 0.16, depth + 0.08]} />
        <meshStandardMaterial color={item.category === 'hostel' ? '#988c7c' : '#8f9b92'} roughness={0.9} />
      </mesh>

      <mesh position={[width * 0.14, h + 0.34, -depth * 0.08]} castShadow>
        <boxGeometry args={[Math.max(0.18, width * 0.25), 0.22, Math.max(0.16, depth * 0.24)]} />
        <meshStandardMaterial color="#8f9991" roughness={0.9} />
      </mesh>

      {Array.from({ length: Math.min(floorCount, 10) }).map((_, i) => {
        const wy = 0.38 + i * (h / floorCount);

        return (
          <mesh key={`win-${i}`} position={[0, wy, depth / 2 + 0.008]}>
            <boxGeometry args={[Math.max(0.12, width * 0.76), Math.max(0.045, h / floorCount * 0.28), 0.018]} />
            <meshStandardMaterial color={windowColor} roughness={0.45} metalness={0.15} />
          </mesh>
        );
      })}

      {width > 2.2 && [-0.32, 0.32].map((factor, i) => (
        <mesh key={`fin-${i}`} position={[width * factor, h / 2 + 0.15, depth / 2 + 0.02]}>
          <boxGeometry args={[0.06, h * 0.92, 0.04]} />
          <meshStandardMaterial color="#7c8f86" roughness={0.8} />
        </mesh>
      ))}

      {(hover || isSelected) && (
        <Html position={[0, h + 0.85, 0]} center distanceFactor={18} zIndexRange={[90, 0]}>
          <div className="ct3d-nameplate">{item.name}</div>
        </Html>
      )}
    </group>
  );
}

function SportsArea({ item, onSelect, selected }) {
  const [x0, y0, x1, y1] = item.box;
  const w = (x1 - x0) * SCALE;
  const d = (y1 - y0) * SCALE;
  const x = toX((x0 + x1) / 2);
  const z = toZ((y0 + y1) / 2);
  const court = item.type === 'court';
  const fieldColor = item.type === 'cricket' ? '#89a87a' : '#739d6d';
  const [hover, setHover] = useState(false);

  return (
    <group
      position={[x, 0, z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(item);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = 'auto';
      }}
    >
      <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
        <boxGeometry args={[w + (court ? 0.12 : 0.24), 0.2, d + (court ? 0.12 : 0.24)]} />
        <meshStandardMaterial color={selected === item.name ? '#c8d6a9' : '#b3c4a9'} roughness={0.95} />
      </mesh>

      <mesh position={[0, 0.26, 0]} receiveShadow>
        <boxGeometry args={[w, 0.06, d]} />
        <meshStandardMaterial color={court ? '#b96f58' : fieldColor} roughness={0.95} />
      </mesh>

      {court && (
        <>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[w * 0.84, 0.012, d * 0.82]} />
            <meshStandardMaterial color="#f0e9d6" />
          </mesh>
          <mesh position={[0, 0.312, 0]}>
            <boxGeometry args={[0.025, 0.01, d * 0.82]} />
            <meshStandardMaterial color="#e7dcff" />
          </mesh>
          <mesh position={[0, 0.318, 0]}>
            <boxGeometry args={[w * 0.84, 0.01, 0.02]} />
            <meshStandardMaterial color="#e7dcff" />
          </mesh>
        </>
      )}

      {item.type === 'football' && (
        <>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[w * 0.88, 0.012, d * 0.86]} />
            <meshStandardMaterial color="#d8c9ff" />
          </mesh>
          <mesh position={[0, 0.31, 0]}>
            <boxGeometry args={[0.025, 0.012, d * 0.86]} />
            <meshStandardMaterial color="#d8c9ff" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[w * 0.12, w * 0.12, 0.014, 24]} />
            <meshStandardMaterial color="#d8c9ff" />
          </mesh>
        </>
      )}

      {item.type === 'cricket' && (
        <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[Math.min(w, d) * 0.2, 32]} />
          <meshStandardMaterial color="#9c67b1" />
        </mesh>
      )}

      {(hover || selected === item.name) && (
        <Html position={[0, 0.75, 0]} center distanceFactor={18}>
          <div className="ct3d-nameplate">{item.name}</div>
        </Html>
      )}
    </group>
  );
}

// Build a flat road ribbon along each path.
function createRoadRibbon(curve, fullWidth, divisions, y) {
  const positions = [];
  const indices = [];

  for (let i = 0; i <= divisions; i += 1) {
    const t = i / divisions;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const length = Math.hypot(tangent.x, tangent.z) || 1;
    const perpX = -tangent.z / length;
    const perpZ = tangent.x / length;
    const half = fullWidth / 2;

    positions.push(point.x + perpX * half, y, point.z + perpZ * half);
    positions.push(point.x - perpX * half, y, point.z - perpZ * half);

    if (i < divisions) {
      const a = i * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function RoadRibbon({ road, index }) {
  const geometries = useMemo(() => {
    const points = road.points.map(([x, y]) => new THREE.Vector3(toX(x), 0, toZ(y)));
    const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    const divisions = Math.max(48, road.points.length * 16);

    return {
      shoulder: createRoadRibbon(curve, road.width + 0.22, divisions, 0.012),
      surface: createRoadRibbon(curve, road.width, divisions, 0.028),
    };
  }, [road]);

  useEffect(() => () => {
    geometries.shoulder.dispose();
    geometries.surface.dispose();
  }, [geometries]);

  return (
    <group key={`road-ribbon-${index}`}>
      <mesh geometry={geometries.shoulder} receiveShadow>
        <meshStandardMaterial color="#302846" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometries.surface} receiveShadow>
        <meshStandardMaterial color="#514365" roughness={0.98} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CampusScene({ readings, selected, setSelected }) {
  const lookup = useMemo(() => makeReadingLookup(readings), [readings]);

  const buildingWithReadings = useMemo(
    () => BUILDINGS.map((item) => ({
      ...item,
      reading: findReading(item, lookup),
      selected: selected === item.name,
    })),
    [lookup, selected]
  );

  const sportsWithReadings = useMemo(
    () => SPORTS.map((item) => ({
      ...item,
      reading: findReading({ ...item, aliases: item.aliases || [item.name] }, lookup),
    })),
    [lookup]
  );

  return (
    <>
      <color attach="background" args={['#0c0e2a']} />
      <fog attach="fog" args={['#0c0e2a', 44, 95]} />

      <ambientLight intensity={1.25} />
      <hemisphereLight args={['#e5d8ff', '#201536', 1.25]} />
      <directionalLight
        position={[-12, 24, 8]}
        intensity={1.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[10, 12, -10]} intensity={0.55} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[58, 58]} />
        <meshStandardMaterial color="#17142f" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <planeGeometry args={[56.8, 56.8]} />
        <meshStandardMaterial color="#1b1738" roughness={1} />
      </mesh>

      {ROADS.map((road, i) => (
        <RoadRibbon key={`road-${i}`} road={road} index={i} />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[toX(50), 0.035, toZ(12)]} receiveShadow>
        <circleGeometry args={[2.65, 64]} />
        <meshStandardMaterial color="#624b91" roughness={0.32} metalness={0.08} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[toX(50), 0.04, toZ(12)]}>
        <ringGeometry args={[2.35, 2.48, 64]} />
        <meshStandardMaterial color="#b7a0ff" roughness={0.4} />
      </mesh>

      {[[62,79,9,8],[53,58,11,9],[66,43,12,10],[82,60,17,26],[37,12,24,15]].map(([cx,cy,w,d], i) => (
        <mesh key={`land-${i}`} rotation={[-Math.PI/2,0,0]} position={[toX(cx),0.02,toZ(cy)]} receiveShadow>
          <planeGeometry args={[w*SCALE,d*SCALE]} />
          <meshStandardMaterial color={i===3 ? '#201a3d' : '#191633'} roughness={1} />
        </mesh>
      ))}

      {sportsWithReadings.map((item) => (
        <SportsArea
          key={item.name}
          item={item}
          selected={selected}
          onSelect={(x) => setSelected(x.name)}
        />
      ))}

      {buildingWithReadings.map((item) => (
        <Building
          key={item.name}
          item={item}
          reading={item.reading}
          selected={selected}
          onSelect={(x) => setSelected(x.name)}
        />
      ))}

      {buildingWithReadings.filter((x) => x.reading).map((item) => (
        <SensorPin
          key={`sensor-${item.name}`}
          item={item}
          reading={item.reading}
          onSelect={(x) => setSelected(x.name)}
        />
      ))}

      {sportsWithReadings.filter((x) => x.reading).map((item) => (
        <SensorPin
          key={`sensor-${item.name}`}
          item={{ ...item, height: 0.5 }}
          reading={item.reading}
          onSelect={(x) => setSelected(x.name)}
        />
      ))}

      <Html position={[toX(27), 0.18, toZ(35)]} rotation={[0, 0.9, 0]} center distanceFactor={25}>
        <div className="ct3d-road-label">CAMPUS HIGHWAY</div>
      </Html>

      <ContactShadows position={[0, -0.02, 0]} opacity={0.24} scale={60} blur={2.2} far={24} resolution={512} />

      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minDistance={18}
        maxDistance={63}
        maxPolarAngle={Math.PI / 2.08}
        minPolarAngle={0.2}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  );
}

/**
 * Interactive 3D campus model.
 * Reads live sensor data from the configured API, unless readings are supplied by the parent.
 */
export default function CampusTwin3D({
  readings: suppliedReadings,
  dataMode = 'database',
  apiStatus: suppliedApiStatus,
  lastUpdated: suppliedLastUpdated,
  apiUrl = 'https://ecotwin-bkfb.onrender.com/api/readings',
}) {
  const [fetchedReadings, setFetchedReadings] = useState([]);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('orbit');

  useEffect(() => {
    if (suppliedReadings !== undefined && suppliedReadings !== null) {
      return undefined;
    }

    let active = true;
    let loading = false;
    let timer;

    const load = async () => {
      if (loading || !active) return;

      loading = true;
      try {
        const response = await fetch(apiUrl, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const payload = await response.json();

        const rows = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.readings)
            ? payload.readings
            : Array.isArray(payload?.data)
              ? payload.data
              : null;

        if (!rows) {
          throw new Error('Unexpected API response format');
        }

        if (!active) return;

        setFetchedReadings(rows);
        setApiStatus('connected');
        setLastUpdated(
          payload?.updatedAt ||
          payload?.updated_at ||
          new Date().toISOString()
        );
      } catch (error) {
        if (!active) return;

        console.error('CampusTwin3D API error:', error);
        setApiStatus('offline');
      } finally {
        loading = false;
      }
    };

    load();
    timer = window.setInterval(load, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [apiUrl, suppliedReadings]);

  const readings = suppliedReadings ?? fetchedReadings;

  const displayApiStatus = suppliedReadings !== undefined && suppliedReadings !== null
    ? (dataMode === 'demo' ? 'demo' : (suppliedApiStatus || 'connected'))
    : apiStatus;

  const shownUpdatedAt = suppliedLastUpdated || lastUpdated;

  const matchedCount = useMemo(() => {
    const lookup = makeReadingLookup(readings);

    return (
      BUILDINGS.filter((building) => findReading(building, lookup)).length +
      SPORTS.filter((sport) =>
        findReading({ ...sport, aliases: sport.aliases || [sport.name] }, lookup)
      ).length
    );
  }, [readings]);

  return (
    <section className="ct3d-page">
      <header className="ct3d-header">
        <div>
          <div className="ct3d-eyebrow">DSU HAROHALLI · DIGITAL TWIN</div>
          <h1>Campus, in three dimensions.</h1>
          <p>
            Explore the campus layout in 3D. Hover over glowing sensor points
            for resource readings from the selected demo or database source.
          </p>
        </div>

        <div className="ct3d-controls">
          <span className={`ct3d-status ${displayApiStatus === 'connected' ? 'is-live' : ''}`}>
            <i />
            {displayApiStatus === 'demo'
              ? 'DEMO PLAYBACK · SIMULATED'
              : displayApiStatus === 'connected'
                ? 'DATABASE CONNECTED'
                : displayApiStatus === 'connecting'
                  ? 'CONNECTING TO SENSORS'
                  : 'API OFFLINE'}
          </span>

          <button type="button" onClick={() => setView('orbit')}>
            Explore
          </button>

          <button type="button" onClick={() => setSelected(null)}>
            Clear selection
          </button>
        </div>
      </header>

      <div className="ct3d-viewer">
        <div className="ct3d-viewer-note">
          <span>3D CAMPUS MODEL</span>
          <span>Drag to orbit · Scroll to zoom · Select a building</span>
        </div>

        <Canvas
          shadows
          dpr={[1, 1.8]}
          camera={{ position: [25, 26, 30], fov: 43 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Suspense fallback={null}>
            <CampusScene
              readings={readings}
              selected={selected}
              setSelected={setSelected}
            />
          </Suspense>
        </Canvas>

        <div className="ct3d-compass">N <span>↑</span></div>

        <div className="ct3d-legend">
          <span><i className="academic" />Academic</span>
          <span><i className="residential" />Hostels &amp; quarters</span>
          <span><i className="sports" />Sports</span>
          <span><i className="sensor" />Sensor point</span>
        </div>
      </div>

      <footer className="ct3d-footer">
        <div>
          <b>{BUILDINGS.length}</b>
          <span>Buildings / towers</span>
        </div>
        <div>
          <b>{SPORTS.length}</b>
          <span>Sports facilities</span>
        </div>
        <div>
          <b>{matchedCount}</b>
          <span>Locations with readings</span>
        </div>
        <div>
          <b>
            {shownUpdatedAt
              ? new Date(shownUpdatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </b>
          <span>Last sensor sync</span>
        </div>
      </footer>

      <p className="ct3d-disclaimer">
        The 3D geometry is a schematic visualization derived from your existing
        2D campus coordinates, not a surveyed architectural model. Demo Playback
        is simulated for presentation; Database mode reads the configured SQLite API.
      </p>
    </section>
  );
}
