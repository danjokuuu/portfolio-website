import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useEffect, useState, Suspense } from "react"
import { useGLTF, Environment, AdaptiveDpr, Preload, useTexture} from "@react-three/drei"
import * as THREE from "three"
import { EffectComposer, Bloom} from "@react-three/postprocessing"
import AnimatedText from "./components/AnimatedText.jsx"
import FuzzyText from "./components/FuzzyText.jsx"
import { FaLinkedin, FaGithub, FaEnvelope } from "react-icons/fa"
import Loader from "./components/Loader.jsx"

// -------------------------------------------------- #### SCENE #### --------------------------------------------------

useTexture.preload("/screens/portfolio.jpg")
useTexture.preload("/screens/music-genre-identifier.jpg")
useTexture.preload("/screens/default.jpg")

function Scene({ currentProject }) {
  const { scene, nodes } = useGLTF("/room-opt.glb")
  const materialRef = useRef() // store monitor material so we don't recreate endlessly

  useEffect(() => {
    const loader = new THREE.TextureLoader()

    // first monitor = dynamic texture
    if (nodes.screen) {
      const texture = loader.load(`/screens/${currentProject}.jpg`)
      texture.colorSpace = THREE.SRGBColorSpace // replaces encoding
      texture.flipY = false   // prevent upside-down image

      texture.wrapS = THREE.ClampToEdgeWrapping
      texture.wrapT = THREE.ClampToEdgeWrapping
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter

      // adjust scale/offset 
      texture.repeat.set(1, 1)    // scale (X, Y)
      texture.offset.set(0, 0)    // shift (X, Y)

      // CRT scanline texture
      const scanlineTex = loader.load("/screens/scanlines.png")
      scanlineTex.wrapS = THREE.RepeatWrapping
      scanlineTex.wrapT = THREE.RepeatWrapping
      scanlineTex.repeat.set(3, 3) // tile scanlines
      // scanlineTex.generateMipmaps = false
      // scanlineTex.minFilter = THREE.LinearFilter
      // scanlineTex.magFilter = THREE.NearestFilter

      if (!materialRef.current) {
        // build once with MeshPhysicalMaterial
        materialRef.current = new THREE.MeshPhysicalMaterial({
          map: texture,
          emissive: new THREE.Color("#abcaee"), 
          emissiveMap: texture,                 
          emissiveIntensity: 1.5,               
          toneMapped: false,     
          
          transparent: false,
          opacity: 1,
          roughness: 0.05,
          metalness: 0.2,
          clearcoat: 1.0,
          clearcoatRoughness: 0.05,
          transmission: 0.9,
          thickness: 0.5,

          alphaMap: scanlineTex,   // overlay scanlines
          alphaTest: 0.2,         
          combine: THREE.MixOperation
        })
        nodes.screen.material = materialRef.current
      } else {
        // swap maps without rebuilding
        const m = materialRef.current
        m.map?.dispose()
        m.emissiveMap?.dispose()
        m.alphaMap = scanlineTex
        m.map = m.emissiveMap = texture
        m.needsUpdate = true
      }
    }

    // second monitor = looped video
    let video, videoTexture
    if (nodes.second_screen) {
      video = document.createElement("video")
      video.src = "/videos/tv-static.mp4" // 
      video.crossOrigin = "Anonymous"
      video.loop = true
      video.muted = true
      video.playsInline = true
      video.play()

      videoTexture = new THREE.VideoTexture(video)
      videoTexture.colorSpace = THREE.SRGBColorSpace
      videoTexture.minFilter = THREE.LinearFilter
      videoTexture.magFilter = THREE.LinearFilter
      videoTexture.wrapS = THREE.ClampToEdgeWrapping
      videoTexture.wrapT = THREE.ClampToEdgeWrapping
      videoTexture.rotation = Math.PI / 2

      nodes.second_screen.material = new THREE.MeshStandardMaterial({
        map: videoTexture,
        emissive: new THREE.Color("#ffffff"),
        emissiveMap: videoTexture,
        emissiveIntensity: 2,
        toneMapped: false,
      })
    }

    // cleanup on unmount / project change
    return () => {
      if (video) {
        video.pause()
        video.src = ""
        video.load()
      }
      if (videoTexture) videoTexture.dispose()
      if (nodes.second_screen?.material) nodes.second_screen.material.dispose()
    }
  }, [nodes, currentProject])

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



// -------------------------------------------------- #### LIGHTS #### --------------------------------------------------
function SceneLights() {
  const pointLightRef = useRef()
  const rightLampRef = useRef()
  const leftLampRef = useRef()

  useEffect(() => {
    if (rightLampRef.current) {
      rightLampRef.current.target.position.set(2.5, -1, 1)
      rightLampRef.current.target.updateMatrixWorld()
    }
    if (leftLampRef.current) {
      leftLampRef.current.target.position.set(-4, -1, 1)
      leftLampRef.current.target.updateMatrixWorld()
    }
  }, [])

  return (
    <>
      <ambientLight intensity={0.01} />
      <pointLight 
        ref={pointLightRef} 
        position={[-0.8, 0.5, 1.2]} 
        intensity={0.1} 
        distance={2.5} 
        color={"#ffffff"} 
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />
      <spotLight 
        ref={rightLampRef} 
        position={[3, 0.5, 1]} 
        angle={0.9} 
        penumbra={0.8} 
        intensity={30} 
        color={"#ffddaa"} 
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />
      <spotLight 
        ref={leftLampRef} 
        position={[-6, 6, 1]} 
        angle={0.3} 
        penumbra={2} 
        intensity={150} 
        color={"#ffddaa"} 
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />
    </>

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


// -------------------------------------------------- #### SCROLL/CAMERA #### --------------------------------------------------
// smooth scroll-driven zoom
function ScrollCamera() {
  const { camera } = useThree()
  useFrame(() => {
    const scrollY = window.scrollY
    const targetZ = 1 + scrollY * 0.002 ///0.0045
    // smooth transition 
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.30)
  })
  return null
}

function ScrollIndicator() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {  // if scrolled down more than 50px, hide it     
        setHidden(true)
      } else {
        setHidden(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className={`scroll-indicator ${hidden ? "hidden" : ""}`}>
      <p>Start scrolling to explore</p>
      <svg
        className="bounce"
        width="36"
        height="36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 33a15 15 0 1 0 0-30 15 15 0 0 0 0 30Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m12 18 6 6 6-6M18 12v12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
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
    const targetX = mouse.current.x * 0.25 - 1   // shift left/right
    const targetY = mouse.current.y * 0.2 + 0.5 // shift up/down
    const targetZ = camera.position.z + mouse.current.y * 0.01 // slight forward/back

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
// function Helpers({ pointLightRef, rightLampRef, leftLampRef }) {
//   useHelper(pointLightRef, THREE.PointLightHelper, 0.5, "red")
//   useHelper(rightLampRef, THREE.SpotLightHelper, "yellow")
//   useHelper(leftLampRef, THREE.SpotLightHelper, "orange")

//   const { scene } = useThree()
//   useEffect(() => {
//     const axes = new THREE.AxesHelper(2) 
//     scene.add(axes)
//     return () => scene.remove(axes)
//   }, [scene])

//   return null
// }

// -------------------------------------------------- #### APP COMPONENT #### --------------------------------------------------
export default function App() {
  const pointLightRef = useRef()
  const rightLampRef = useRef()
  const leftLampRef = useRef()
  const [currentProject, setCurrentProject] = useState("default") 


  return (
    <> 
      <Loader />
      <Canvas
        dpr={[1]}
        onCreated={({ gl }) => {
          gl.setPixelRatio(0.75)
        }}
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
          powerPreference: "high-performance",
          physicallyCorrectLights: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        <AdaptiveDpr pixelated />

        {/* -------------------------------------------------- #### LIGHTING #### -------------------------------------------------- */}
        <SceneLights />

        {/* -------------------------------------------------- #### REALISM / ENVIRONMENT #### -------------------------------------------------- */}
        <Suspense fallback={null}>
          <Environment preset="night" />
          <DustParticles count={800} />
          <Scene currentProject={currentProject} />
          <Preload all />
        </Suspense>

        {/* -------------------------------------------------- #### CAMERA / CONTROLS #### -------------------------------------------------- */}
        <ScrollCamera />
        <MouseParallax />

        {/* -------------------------------------------------- #### POSTPROCESSING (CINEMATIC EFFECTS) #### -------------------------------------------------- */}
        <EffectComposer multisampling={0} resolutionScale={0.25}>
          <Bloom
            intensity={2.1}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.1}
          />
        </EffectComposer>
      </Canvas>



      {/* -------------------------------------------------- #### SCROLL SECTIONS #### -------------------------------------------------- */}
      <div className="scroll-container">
        <section className="panel intro">
          <div className="intro-content">
            <h1 className="intro-name"> 
              <FuzzyText
                fontSize="max(3rem, 8vw, 8rem)"
                fontFamily="'Poppins', sans-serif"
                fontWeight={900}
                color="#000000"
                baseIntensity={0.18}
                hoverIntensity={0.5}
              >
                DANIEL NJOKU
              </FuzzyText>
            </h1>
            <h2 className="intro-subtitle">
              <FuzzyText
                fontSize="max(1.5rem, 4vw, 4rem)"
                fontFamily="'FigtreeExtraBoldItalic', sans-serif"
                fontWeight={900}
                color="#000000"
                baseIntensity={0.18}
                hoverIntensity={0.5}
              >
                Fullstack Developer
              </FuzzyText>
            </h2>
            
            {/* <button
              className="contact-btn"
              onClick={() =>
                document.querySelector(".contact-section")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Contact Me
            </button> */}
            <ScrollIndicator />
          </div>
        </section>

        <section className="projects-section">
          <h1 className="section-title">
            <AnimatedText size="large" >MY PROJECTS</AnimatedText>
          </h1>

          <div className="projects-list">
            <div 
              className="project-item"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              onMouseEnter={() => setCurrentProject("portfolio")}
              onMouseLeave={() => setCurrentProject("default")}
              style={{ cursor: "pointer" }}  
            >
              <div className="project-left">
                <span className="project-name">Portfolio</span>
                <span className="project-dot">•</span>
              </div>
              <div className="project-right">
                <AnimatedText size="small" color="pink">
                  Three.js Portfolio Website
                </AnimatedText>
                <div className="project-pill"></div>
              </div>
            </div>

            <a href="https://colab.research.google.com/drive/1gnF13xNiBz43F6wCgNUZhtBByEB2IsbI?usp=sharing" target="_blank" rel="noopener noreferrer">
              <div 
                className="project-item"
                onMouseEnter={() => setCurrentProject("music-genre-identifier")}
                onMouseLeave={() => setCurrentProject("default")}
              >
                <div className="project-left">
                  <span className="project-name">Music Genre Identifier</span>
                  <span className="project-dot">•</span>
                </div>
                <div className="project-right">
                  <AnimatedText size="small" color="pink">
                    Detect music genre using nueral networks
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
                <div className="skill-icon">
                  <img src="/icons/vscode.svg" alt="VSCode" />
                  <span className="tooltip">VSCode</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/adobe-photoshop-icon.svg" alt="Photoshop" />
                  <span className="tooltip">Photoshop</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/designer.svg" alt="Substance Designer" />
                  <span className="tooltip">Substance Designer</span>
                </div>
                <div className="skill-icon">
                  <img src="/icons/painter.svg" alt="Substance Painter" />
                  <span className="tooltip">Substance Painter</span>
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
              I'm a student at the University of Alberta with a passion for software development and full-stack engineering. 
            </p>
            <p className="contact-intro">
              I mainly work with <AnimatedText fontSize="1rem" color="pink" fontFamily="'Ubuntu', sans-serif">Python </AnimatedText> and <AnimatedText fontSize="1rem" color="pink" fontFamily="'Ubuntu', sans-serif">JavaScript</AnimatedText>, though I am  also experienced in <AnimatedText fontSize="1rem" color="pink" fontFamily="'Ubuntu', sans-serif">C, C++, Java, and Lua</AnimatedText>. I enjoy solving problems through code, building systems from the ground up, and collaborating with others to create impactful and well-designed software. My interests span from <AnimatedText fontSize="1rem" color="cyan" fontFamily="'Ubuntu', sans-serif">machine learning</AnimatedText> and <AnimatedText fontSize="1rem" color="cyan" fontFamily="'Ubuntu', sans-serif">web development</AnimatedText> to <AnimatedText fontSize="1rem" color="cyan" fontFamily="'Ubuntu', sans-serif">low-level programming</AnimatedText>,  giving me a versatile foundation to tackle challenges across different domains.
            </p>
            <p className="contact-intro">
              Outside of coursework and coding, I like exploring <AnimatedText fontSize="1rem" color="blue" fontFamily="'Ubuntu', sans-serif">3D modeling, game development</AnimatedText>, and <AnimatedText fontSize="1rem" color="blue" fontFamily="'Ubuntu', sans-serif">procedural</AnimatedText> <AnimatedText fontSize="1rem" color="blue" fontFamily="'Ubuntu', sans-serif">animation</AnimatedText> as creative outlets. When I’m not coding, I’m usually sketching out game concepts, experimenting with design tools, or trying to convince myself that “just one more refactor” really means I’m done.  
            </p>
          </div>
          
          <div className="contact-card">
            <h2 className="skill-title">LET'S CONNECT!</h2>

            <div className="contact-info">
              <p>📧 <a href="mailto:danjokuu@gmail.com" rel="noopener noreferrer">danjokuu@gmail.com</a></p>
              <p>🌐 <a href="https://github.com/danjokuuu" target="_blank">GitHub</a> | <a href="https://www.linkedin.com/in/daniel-njoku-4578172a1/" target="_blank" rel="noopener noreferrer">LinkedIn</a></p>
            </div>
          </div>
        </section>

      </div>
      {/* -------------------------------------------------- #### SIDEBAR CONTACT LINKS #### -------------------------------------------------- */}
      <div className="sidebar-links">
        <ul>
          <li>
            <a href="https://www.linkedin.com/in/daniel-njoku-4578172a1/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin style={{ marginRight: "8px" }} /> LinkedIn
            </a>
          </li>
          <li>
            <a href="https://github.com/danjokuuu" target="_blank" rel="noopener noreferrer">
              <FaGithub style={{ marginRight: "8px" }} /> GitHub
            </a>
          </li>
          <li>
            <a href="mailto:danjokuu@gmail.com">
              <FaEnvelope style={{ marginRight: "8px" }} /> Email
            </a>
          </li>
        </ul>
      </div>

    </>
  )
}

// -------------------------------------------------- #### PRELOAD #### --------------------------------------------------
useGLTF.preload("/room-opt.glb")
