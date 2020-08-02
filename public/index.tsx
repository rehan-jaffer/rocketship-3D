import "./asteroids.css";
import ReactDOM from "react-dom";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Canvas, useFrame, extend, useUpdate } from "react-three-fiber";
import useKey from "@rooks/use-key";
import * as THREE from "three";
import { RGBA_ASTC_10x10_Format, PointLight } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OutlineEffects, GlowEffects } from "./effects";
import { Panel } from "./Panel";
import { CameraControls } from "./CameraControls";

const randomShade = () => {
  let shades = ["#ffcb77", "#00b4d8", "#DB3069"];
  return shades[Math.floor(Math.random() * shades.length)];
};

extend({ OrbitControls });

const TrailContext = React.createContext(null);

const Universe = (props: any) => {
  const [trail, setTrail] = React.useState([[]] as Array<number[]>);
  const [trailIndex, setTrailIndex] = React.useState(0);
  const [trailColors, setTrailColors] = React.useState([]);
  const [stats, setStats] = React.useState({
    angle: 0,
    azimuth: 0,
    velocity: [0.0, 0.0, 0.0],
  });

  const breakTrail = () => {
    setTrailIndex(0);
    setTrailColors([]);
    setTrail((trail) => [[]]);
  };

  const addTrail = (position: any) => {
    setTrail((trail) => {
      /*      if (trail.length > 50) {
        return [].concat(position);
      }*/
      return trail.map((t, index) => {
        if (index !== trailIndex) {
          return t;
        }
        return trail[trailIndex].concat([position]);
      });
    });
  };

  const changeTrailColor = () => null;

  return (
    <body>
      <Panel stats={stats} />
      <Canvas pixelRatio={window.devicePixelRatio}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} />
        <CameraControls />
        <Stars />
        <Ship
          setStats={setStats}
          addTrail={addTrail}
          breakTrail={breakTrail}
          setTrailIndex={setTrailIndex}
          setTrailColors={setTrailColors}
          setTrail={setTrail}
        />
        <Trail
          trail={trail}
          trailColors={trailColors}
          trailIndex={trailIndex}
        />
      </Canvas>
    </body>
  );
};

const STAR_COUNT = 100;

const Stars = () => {
  const [stars, setStars] = React.useState([] as Array<number[]>);
  const mesh = React.useRef();

  useEffect(() => {
    for (let i = 0; i < STAR_COUNT; i++) {
      setStars((stars) =>
        stars.concat([
          [
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
            Math.random() * 10 - 5,
          ],
        ])
      );
    }
  }, []);

  return (
    <group ref={mesh}>
      {stars.map((star, idx) => (
        <mesh
          position={new THREE.Vector3(...star)}
          rotation={[Math.random(), Math.random(), Math.random()]}
        >
          <boxBufferGeometry attach="geometry" args={[0.01, 0.01, 0.01]} />
          <meshStandardMaterial
            attach="material"
            color={["white", "blue"][idx % 2]}
          />
        </mesh>
      ))}
    </group>
  );
};

function Ship(props: any) {
  const mesh = useRef<THREE.Mesh>();

  const trailContext = React.useContext(TrailContext);

  const [time, setTime] = useState(Date.now());
  const [angle, setShipAngle] = useState(0);
  const [azimuth, setShipAzimuth] = useState(0);
  const [shipState, setShipState] = useState({
    position: [0.0, 0.0, 0.0],
    velocity: [0.05, 0.05, 0.05],
    accel: [0],
  });

  useEffect(() => {
    updateMeshPosition();
  });

  const LOWER_BOUND = -5;
  const UPPER_BOUND = 5;

  const bound = (value: any, breakTrail: any) => {
    if (value <= LOWER_BOUND) {
      breakTrail();
      return UPPER_BOUND;
    }
    if (value >= UPPER_BOUND) {
      breakTrail();
      return LOWER_BOUND;
    }
    return value;
  };

  const updateX = (shipState: any, angle: any, azimuth: any) =>
    shipState.position[0] +
    shipState.velocity[0] * Math.cos(angle) * Math.cos(azimuth);
  const updateY = (shipState: any, angle: any, azimuth: any) =>
    shipState.position[1] +
    shipState.velocity[0] * Math.cos(angle) * Math.cos(azimuth);
  const updateZ = (shipState: any, angle: any, azimuth: any) =>
    shipState.position[2] +
    shipState.velocity[0] * Math.cos(angle) * Math.cos(azimuth);

  const newPosition = () => [
    updateX(shipState, angle, azimuth),
    updateY(shipState, angle, azimuth),
    updateZ(shipState, angle, azimuth),
  ];

  const updateShipPosition = (breakTrail: any) => {
    const nextPosition = newPosition();

    setShipState((shipState) => {
      return {
        ...shipState,
        position: [
          bound(nextPosition[0], breakTrail),
          bound(nextPosition[1], breakTrail),
          bound(nextPosition[2], breakTrail),
        ],
      };
    });
  };

  const updateMeshPosition = () => {
    if (mesh.current !== undefined) {
      [
        mesh.current.position.x,
        mesh.current.position.y,
        mesh.current.position.z,
      ] = shipState.position;
    }
  };

  const updateShipVelocity = () => {
    setShipState((shipState) => {
      return {
        ...shipState,
        velocity: shipState.velocity.map(
          (value, idx) => value + shipState.accel[0]
        ),
      };
    });
  };

  useKey(["w"], () => {
    setShipState((shipState) => {
      let new_x = shipState.velocity[0] + 0.001;
      let new_y = shipState.velocity[1] + 0.001;
      let new_z = shipState.velocity[2] + 0.001;
      return { ...shipState, velocity: [new_x, new_y, new_z] };
    });
  });

  useKey(["s"], () => {
    setShipState((shipState) => {
      let new_x = shipState.velocity[0] - 0.001;
      let new_y = shipState.velocity[1] - 0.001;
      let new_z = shipState.velocity[2] - 0.001;
      return { ...shipState, velocity: [new_x, new_y, new_z] };
    });
  });

  useKey(["d"], () => {
    setShipAngle((angle) => (angle - 0.05) % 6.28);
  });

  useKey(["a"], () => {
    setShipAngle((angle) => (angle + 0.05) % 6.28);
  });

  useKey(["z"], () => {
    setShipAzimuth((angle) => (angle + 0.05) % 6.28);
  });

  useKey(["p"], () => {
    props.setTrailColors((colors: any) => {
      return colors.concat([randomShade()]);
    });
    props.setTrailIndex((index: any) => {
      return index + 1;
    });
    props.setTrail((trail: any) => {
      return trail.concat([[]]);
    });
  });

  const [lastTrail, setLastTrail] = useState(Date.now());

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    if (mesh.current === undefined) return null;

    mesh.current.lookAt(new THREE.Vector3(...newPosition()));

    if (Date.now() - time > 1000) {
      setTime(Date.now());
      updateShipVelocity();
      //      props.addTrail(mesh.current.position, Date.now());
    }
    if (Date.now() - lastTrail > 10) {
      props.addTrail(shipState.position);
      setLastTrail(Date.now());
    }
    updateShipPosition(props.breakTrail);
    updateMeshPosition();
    props.setStats({
      angle: Math.round(angle * 2 * 3.14),
      azimuth: Math.round(azimuth * 2 * 3.14),
      velocity: Math.round(
        shipState.velocity[0] +
          shipState.velocity[1] +
          shipState.velocity[2] * 100
      ),
    });
  });

  return (
    <group ref={mesh}>
      <OutlineEffects mesh={mesh}>
        <mesh {...props} position={[0.1, 0, -0.05]}>
          <boxBufferGeometry attach="geometry" args={[0.1, 0.15, 0.1]} />
          <meshStandardMaterial
            attach="material"
            color={"black"}
            wireframe={false}
          />
        </mesh>
        <mesh {...props} position={[0.05, 0, 0]}>
          <boxBufferGeometry attach="geometry" args={[0.1, 0.1, 0.3]} />
          <meshStandardMaterial
            attach="material"
            color={"black"}
            wireframe={true}
          />
        </mesh>
        <mesh {...props} position={[0, 0, -0.05]}>
          <boxBufferGeometry attach="geometry" args={[0.1, 0.15, 0.1]} />
          <meshStandardMaterial
            attach="material"
            color={"black"}
            wireframe={false}
          />
        </mesh>
      </OutlineEffects>
    </group>
  );
}

const Trail = (props: any) => {
  // This reference will give us direct access to the mesh
  const convertPoints = (points: any) =>
    points.map(
      (v: [number, number, number], i: number) =>
        new THREE.Vector3(v[0], v[1], v[2])
    );

  const ref = React.useRef<THREE.Mesh>();

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {});

  const meshes = useUpdate((mesh: THREE.Mesh) => {
    // mesh.setFromPoints(convertPoints(self.trail));
    // mesh.verticesNeedUpdate = true;
   }, []);

  return (
    <group ref={ref}>
      {props.trail.map((trail: any, idx: number) => {
        return (
          <line>
            <geometry
              attach="geometry"
              vertices={convertPoints(trail)}
              args={[]}
              ref={props.trail.length == idx + 1 ? meshes : null}
            />
            <lineBasicMaterial
              attach="material"
              color={props.trailColors[idx - 1] || "#DB3069"}
              linewidth={5}
              opacity={1}
            />
          </line>
        );
      })}
    </group>
  );
};

ReactDOM.render(
  <body>
    <Universe />
  </body>,
  document.getElementById("root")
);
