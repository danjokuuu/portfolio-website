import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

// -------------------------------------------------- #### SCENE #### --------------------------------------------------
function Cube() {
  const ref = useRef()
  useFrame(() => {
    if (ref.current) {
      // cube rotation goes here 
    }
  })
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="pink" />
    </mesh>
  )
}

// -------------------------------------------------- #### SCROLL CAMERA #### --------------------------------------------------
// smooth scroll-driven zoom
function ScrollCamera() {
  const { camera } = useThree()
  useFrame(() => {
    const scrollY = window.scrollY
    const targetZ = 1.5 + scrollY * 0.002
    // Smooth transition (lerp = linear interpolation)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05)
  })
  return null
}

// -------------------------------------------------- #### MOUSE PARALLAX #### --------------------------------------------------
// mouse parallax orbit
function MouseParallax() { // disable this later for mobile devices!!
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })

  // track mouse
  window.addEventListener("mousemove", (e) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
  })

  useFrame(() => {
    // lerp camera toward mouse offset (subtle movement)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, mouse.current.x * 0.1, 0.03)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, mouse.current.y * 0.1, 0.03)
    camera.lookAt(0, 0, 0)
  })
  return null
}

// -------------------------------------------------- #### APP COMPONENT #### --------------------------------------------------
export default function App() {
  return (
    <>
      <Canvas
        style={{
          height: "100vh",
          width: "100vw",
          background: "#111",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
        camera={{ position: [0, 0, 1.5], fov: 75 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 2, 5]} />
        <Cube />
        <ScrollCamera />
        <MouseParallax /> 
      </Canvas>

      {/* -------------------------------------------------- #### SCROLL SECTIONS #### -------------------------------------------------- */}
      <div className="scroll-container">
        <section className="panel intro">
          <div className="intro-content">
            <h1>Daniel Njoku</h1>
            <h2>Full Stack Developer</h2>
            <button
              className="contact-btn"
              onClick={() =>
                document.querySelector(".panel.contact")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Contact Me
            </button>
          </div>
        </section>

        <section className="panel projects">
          <h1>Projects</h1>
          <p>Showcase of my work will go here.</p>
        </section>

        <section className="panel contact">
          <h1>Contact</h1>
          <p>Email: example@example.com</p>
        </section>
      </div>
    </>
  )
}
