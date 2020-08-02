import "./asteroids.css";
import ReactDOM from "react-dom";
import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Canvas,
  useFrame,
  extend,
  useThree,
  useUpdate,
} from "react-three-fiber";
import useKey from "@rooks/use-key";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { OutlineEffects } from "./effects";

const randomShade = () => {
  let shades = ["#ffcb77", "#00b4d8", "#DB3069"];
  return shades[Math.floor(Math.random() * shades.length)];
};

extend({ OrbitControls });

const TrailContext = React.createContext(null);

const Panel = ({ stats }) => {
  return (
    <div className="panels">
      <div className="panel">
        <strong>θ</strong> {stats.angle}{" "}
      </div>
      <div className="panel">
        <strong>φ</strong> {stats.azimuth}
      </div>
      <div className="panel">
        {stats.velocity} <strong>m/s</strong>
      </div>
    </div>
  );
};

const CameraControls = () => {
  // Get a reference to the Three.js Camera, and the canvas html element.
  // We need these to setup the OrbitControls component.
  // https://threejs.org/docs/#examples/en/controls/OrbitControls
  const {
    camera,
    gl: { domElement },
  } = useThree();
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef();
  useFrame((state) => controls.current.update());
  return <orbitControls ref={controls} args={[camera, domElement]} />;
};

const Universe = ({ children }) => {
  const [trail, setTrail] = React.useState([[]]);
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

  const addTrail = (position) => {
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

  const changeTrailColor = () => {};

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
  const [stars, setStars] = React.useState([]);
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
          position={star}
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

function Ship(props) {
  const mesh = useRef();

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

  const boundX = (value, breakTrail) => {
    if (value <= -5) {
      breakTrail();
      return 5;
    }
    if (value >= 5) {
      breakTrail();
      return -5;
    }
    return value;
  };

  const boundY = (value, breakTrail) => {
    if (value <= -5) {
      breakTrail();
      return 5;
    }
    if (value >= 5) {
      breakTrail();
      return -5;
    }
    return value;
  };

  const boundZ = (value, breakTrail) => {
    if (value <= -5) {
      breakTrail();
      return 5;
    }
    if (value >= 5) {
      breakTrail();
      return -5;
    }
    return value;
  };

  const newPosition = () => {
    return [
      shipState.position[0] +
        shipState.velocity[0] * Math.cos(angle) * Math.cos(azimuth),
      shipState.position[1] +
        shipState.velocity[0] * Math.cos(angle) * Math.sin(azimuth),
      shipState.position[2] + shipState.velocity[0] * Math.sin(angle),
    ];
  };

  const updateShipPosition = (breakTrail) => {
    const nextPosition = newPosition();

    setShipState((shipState) => {
      return {
        ...shipState,
        position: [
          boundX(nextPosition[0], breakTrail),
          boundY(nextPosition[1], breakTrail),
          boundZ(nextPosition[2], breakTrail),
        ],
      };
    });
  };

  const updateMeshPosition = () => {
    [
      mesh.current.position.x,
      mesh.current.position.y,
      mesh.current.position.z,
    ] = shipState.position;
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
    props.setTrailColors((colors) => {
      return colors.concat([randomShade()]);
    });
    props.setTrailIndex((index) => {
      return index + 1;
    });
    props.setTrail((trail) => {
      return trail.concat([[]]);
    });
  });

  const [lastTrail, setLastTrail] = useState(Date.now());

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
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
            wireframe={false}
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

const Trail = (props) => {
  // This reference will give us direct access to the mesh
  const convertPoints = (points) =>
    points.map((v, i) => new THREE.Vector3(v[0], v[1], v[2]));
  const ref = React.useRef();

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {});

  const meshes = useUpdate((self) => {
    self.setFromPoints(convertPoints(self.trail));
    self.verticesNeedUpdate = true;
  });

  return (
    <group ref={ref}>
      {props.trail.map((trail, idx) => {
        return (
          <line>
            <bufferGeometry
              attach="geometry"
              vertices={convertPoints(trail)}
              args={[]}
              ref={props.trail.length == idx + 1 ? meshes : null}
              trail={trail}
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

function Box(props) {
  // This reference will give us direct access to the mesh
  const mesh = useRef();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {});

  return (
    <group ref={mesh}>
      <mesh {...props}>
        <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
        <meshStandardMaterial attach="material" />
      </mesh>
    </group>
  );
}

ReactDOM.render(
  <body>
    <Universe />
  </body>,
  document.getElementById("root")
);
