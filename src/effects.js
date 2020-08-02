import React, { useRef, useEffect } from "react";
import { extend, useThree, useFrame } from "react-three-fiber";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

extend({
  EffectComposer,
  ShaderPass,
  RenderPass,
  UnrealBloomPass,
  FilmPass,
  OutlinePass,
});

export function OutlineEffects({ mesh, children }) {
    const composer = useRef();
    const { scene, gl, size, camera, aspect } = useThree();
    useEffect(() => void composer.current.setSize(size.width, size.height), [
      size,
    ]);
    useFrame(() => composer.current.render(), 2);
    return (
        <>
      {children}
      <effectComposer ref={composer} args={[gl]}>
        <renderPass
          attachArray="passes"
          scene={scene}
          camera={camera}
          args={[scene, camera]}
        />
        <outlinePass
          attachArray="passes"
          scene={scene}
          camera={camera}
          args={[aspect, scene, camera]}
          selectedObjects={[mesh.current]}
          visibleEdgeColor={"white"}
          edgeStrength={5}
          edgeThickness={1}
        />
      <unrealBloomPass attachArray="passes" args={[undefined, 1.8, 1, 0]} />
      </effectComposer>
      </>
    );
  }

export function GlowEffects({ mesh, children }) {
    return null;
  const composer = useRef();
  const { scene, gl, size, camera, aspect } = useThree();
  useEffect(() => void composer.current.setSize(size.width, size.height), [
    size,
  ]);
  useFrame(() => composer.current.render(), 2);
  return (
      <>
    {children}
    <effectComposer ref={composer} args={[gl]}>
      <renderPass
        attachArray="passes"
        scene={scene}
        camera={camera}
        args={[scene, camera]}
      />

    </effectComposer>
    </>
  );
}
