import { useProgress } from "@react-three/drei"
import { useEffect, useState } from "react"
import "./Loader.css"

export default function Loader() {
  const { progress } = useProgress()
  const [fadeOut, setFadeOut] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (progress >= 100) {
      setFadeOut(true)
      const timeout = setTimeout(() => setIsVisible(false), 1500) // match fade time
      return () => clearTimeout(timeout)
    }
  }, [progress])

  if (!isVisible) return null

  return (
    <div className={`loader-container ${fadeOut ? "fade-out" : ""}`}>
      <div className="logo-spinner">
        <div className="logo-pulse">
          <img src="/icons/Clear-Skies.svg" alt="logo" />
        </div>
      </div>
      <p className="loading-text">{Math.floor(progress)}%</p>
    </div>
  )
}
