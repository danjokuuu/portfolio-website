import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useEffect } from "react"
import { useGLTF, Environment, useHelper } from "@react-three/drei"
import * as THREE from "three"
import { EffectComposer, Bloom, DepthOfField} from "@react-three/postprocessing"
import AnimatedText from "./AnimatedText.jsx"

// -------------------------------------------------- #### SCENE #### --------------------------------------------------
function Scene() {
  const { scene, nodes } = useGLTF("/room(new)-opt.glb")

  useEffect(() => {
    // first monitor
    if (nodes.screen) {
      nodes.screen.material = new THREE.MeshStandardMaterial({
        color: "#111",
        emissive: "#00ffcc",   
        emissiveIntensity: 2,
      })
    }

    // second monitor
    if (nodes.second_screen) {
      nodes.second_screen.material = new THREE.MeshStandardMaterial({
        color: "#111",
        emissive: "#ff66aa",    
        emissiveIntensity: 5,
      })
    }
  }, [nodes])

  return (
    <primitive 
      object={scene}
      position={[0, 0, 0]}
      rotation={[0, THREE.MathUtils.degToRad(270), 0]}
      castShadow
      receiveShadow
    />
  )
}

// -------------------------------------------------- #### PARTICLES #### --------------------------------------------------
function DustParticles({ count = 500 }) {
  const pointsRef = useRef()
  const positions = useRef(
    new Float32Array(count * 3).map(() => (Math.random() - 0.5) * 10)
  )

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.01 // slow swirl
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        sizeAttenuation
        color="#aaaaaa"
        opacity={0.4}
        transparent
        depthWrite={false}
      />
    </points>
  )
}


// -------------------------------------------------- #### SCROLL CAMERA #### --------------------------------------------------
// smooth scroll-driven zoom
function ScrollCamera() {
  const { camera } = useThree()
  useFrame(() => {
    const scrollY = window.scrollY
    const targetZ = 1 + scrollY * 0.003 ///0.0045
    // smooth transition 
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.10)
  })
  return null
}

// -------------------------------------------------- #### MOUSE PARALLAX #### --------------------------------------------------
// mouse parallax orbit + subtle translation
function MouseParallax() { // disable this later for mobile devices!!
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })

  // track mouse 
  useEffect(() => {
    function handleMouseMove(e) {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useFrame(() => {
    // subtle position offset for parallax translation
    const targetX = mouse.current.x * 0.2 - 1   // shift left/right
    const targetY = mouse.current.y * 0.15 + 0.5 // shift up/down
    const targetZ = camera.position.z + mouse.current.y * 0.05 // slight forward/back

    // lerp camera toward target position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.05)

    // always look at computer screen 
    camera.lookAt(-1, 0.5, 0)
  })
  return null
}


// -------------------------------------------------- #### HELPERS #### --------------------------------------------------
function Helpers({ pointLightRef, rightLampRef, leftLampRef }) {
  useHelper(pointLightRef, THREE.PointLightHelper, 0.5, "red")
  useHelper(rightLampRef, THREE.SpotLightHelper, "yellow")
  useHelper(leftLampRef, THREE.SpotLightHelper, "orange")

  // axes helper in center
  const { scene } = useThree()
  useEffect(() => {
    const axes = new THREE.AxesHelper(2) 
    scene.add(axes)
    return () => scene.remove(axes)
  }, [scene])

  return null
}

// -------------------------------------------------- #### APP COMPONENT #### --------------------------------------------------
export default function App() {
  const pointLightRef = useRef()
  const rightLampRef = useRef()
  const leftLampRef = useRef()

  return (
    <>
      <Canvas
        shadows
        style={{
          height: "100vh",
          width: "100vw",
          background: "#111",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 0,
        }}
        camera={{ position: [0, 0, 1.5], fov: 70 }}
        gl={{ 
          physicallyCorrectLights: true, 
          toneMapping: THREE.ACESFilmicToneMapping, 
          outputEncoding: THREE.sRGBEncoding 
        }}
      >
        {/* -------------------------------------------------- #### LIGHTING #### -------------------------------------------------- */}
        <ambientLight intensity={0.01} />

        {/* CRT monitor glow */}
        <pointLight
          ref={pointLightRef}
          position={[-.8, .5,1.2]}   
          intensity={5}
          distance={2.5}
          color={"#ffffffff"}
          castShadow
        />

        {/* desk lamp , right */}
        <spotLight
          ref={rightLampRef}
          position={[3, 0.5, 1]}
          angle={0.9}
          penumbra={0.8}
          intensity={30}
          color={"#ffddaa"}
          target-position={[2.5, -1, 1]}   // right lamp target
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />

        {/* desk lamp , left */}
        <spotLight
          ref={leftLampRef}
          position={[-6, 6, 1]}
          angle={0.3}
          penumbra={2}
          intensity={100}
          color={"#ffddaa"}
          target-position={[-4, -1, 1]}  // left lamp target
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />

        {/* -------------------------------------------------- #### HELPERS #### -------------------------------------------------- */}

        <Helpers 
          // pointLightRef={pointLightRef} 
          // rightLampRef={rightLampRef} 
          // leftLampRef={leftLampRef} 
        />

        {/* -------------------------------------------------- #### REALISM / ENVIRONMENT #### -------------------------------------------------- */}
        <Environment preset="night" />

        {/* scene + camera effects */}
        <DustParticles count={800} />
        <Scene />
        <ScrollCamera />
        <MouseParallax /> 

        {/* -------------------------------------------------- #### POSTPROCESSING (CINEMATIC EFFECTS) #### -------------------------------------------------- */}
        <EffectComposer>
          <Bloom intensity={0.5} luminanceThreshold={.1} luminanceSmoothing={0.1} />
          {/* <SSAO radius={0.1} intensity={20} /> */}
          {/* <DepthOfField focusDistance={0.02} focalLength={0.03} bokehScale={1.1} /> */}
        </EffectComposer>
      </Canvas>

      {/* -------------------------------------------------- #### SCROLL SECTIONS #### -------------------------------------------------- */}
      <div className="scroll-container">
        <section className="panel intro">
          <div className="intro-content">
            <h1> Daniel Njoku</h1>
            <AnimatedText size="large" block>
              Full Stack Developer
            </AnimatedText>
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

        <section className="projects-section">
          <h1 className="section-title">
            <AnimatedText size="large" >MY PROJECTS</AnimatedText>
          </h1>

          <div className="projects-list">
            <a href="https://www.google.com" target="_blank" rel="noopener noreferrer">
              <div className="project-item">
                <div className="project-left">
                  <span className="project-name">Project 1</span>
                  <span className="project-dot">•</span>
                </div>
                <div className="project-right">
                  <AnimatedText size="small" color="pink">
                    lorem ipsum
                  </AnimatedText>
                  <div className="project-pill"></div>
                </div>
              </div>
            </a>


            {/* repeat for future projects!!!!! */}
          </div>
        </section>
        <section className="skills-section">
          <h1 className="section-title">
            <AnimatedText size="large">SKILLS & TECHNOLOGIES</AnimatedText>
          </h1>

          <div className="skills-list">
            <div className="skill-card">
              <h2 className="skill-title">DEVELOPMENT</h2>
              <div className="skill-items">
                <div className="skill-icon">
                  <img src="/icons/javascript-original.svg" alt="JavaScript" />
                  <span className="tooltip">JavaScript</span>
                </div>

                <div className="skill-icon">
                  <img src="/icons/python-original.svg" alt="Python" />
                  <span className="tooltip">Python</span>
                </div>

                <div className="skill-icon">
                  <img src="/icons/java-original.svg" alt="Java" />
                  <span className="tooltip">Java</span>
                </div>

                <div className="skill-icon">
                  <img src="/icons/html5-original-wordmark.svg" alt="HTML" />
                  <span className="tooltip">HTML5</span>
                </div>

                <div className="skill-icon">
                  <img src="/icons/css3-original-wordmark.svg" alt="CSS" />
                  <span className="tooltip">CSS3</span>
                </div>

                <div className="skill-icon">
                  <img src="/icons/react-original.svg" alt="React" />
                  <span className="tooltip">React</span>
                </div>

                <div className="skill-icon">
                  <img src="/icons/nodejs-original-wordmark.svg" alt="Node.js" />
                  <span className="tooltip">Node.js</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/tailwindcss-plain.svg" alt="Tailwind" />
                  <span className="tooltip">Tailwind</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/threejs-original-wordmark.svg" alt="Three.js" />
                  <span className="tooltip">Three.js</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/tensorflow-original.svg" alt="TensorFlow" />
                  <span className="tooltip">TensorFlow</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/mongodb-original-wordmark.svg" alt="MongoDB" />
                  <span className="tooltip">MongoDB</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/mysql-original-wordmark.svg" alt="MySQL" />
                  <span className="tooltip">MySQL</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/c-original.svg" alt="C" />
                  <span className="tooltip">C</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/cplusplus-original.svg" alt="C++" />
                  <span className="tooltip">C++</span>
                </div>
              </div>
            </div>

            <div className="skill-card">
              <h2 className="skill-title">DESIGN</h2>
              <div className="skill-items">
                <div className="skill-icon">
                  <img src="/icons/figma-original.svg" alt="Figma" />
                  <span className="tooltip">Figma</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/blender-original.svg" alt="Blender" />
                  <span className="tooltip">Blender</span>
                </div>
              </div>
            </div>
          </div>
        </section>

            
        <section className="contact-section">
            <h1 className="section-title">
              <AnimatedText size="large">HI, I'M <span>DANIEL</span></AnimatedText>
            </h1>
          <div className="contact-card">
            <p className="contact-intro">
              HI my name is Daniel  
            </p>
          </div>
          
          <div className="contact-card">
            <AnimatedText size="medium"> LETS CONNECT!</AnimatedText>

            <div className="contact-info">
              <p>📧 <a href="mailto:danjokuu@gmail.com">danjokuu@gmail.com</a></p>
              <p>🌐 <a href="https://github.com" target="_blank">GitHub</a> | <a href="https://linkedin.com" target="_blank">LinkedIn</a></p>
            </div>
          </div>
        </section>

      </div>
      {/* -------------------------------------------------- #### SIDEBAR CONTACT LINKS #### -------------------------------------------------- */}
      <div className="sidebar-links">
        <ul>
          <li><a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
          <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          <li><a href="mailto:danjokuu@gmail.com">Email</a></li>
        </ul>
      </div>

    </>
  )
}

// -------------------------------------------------- #### PRELOAD #### --------------------------------------------------
useGLTF.preload("/room(new)-opt.glb")
