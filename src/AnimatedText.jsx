// -------------------------------------------------- #### ANIMATED TEXT COMPONENT #### --------------------------------------------------
export default function AnimatedText({ 
  children, 
  size = "medium", 
  color = "black", 
  block = false
}) {
  return (
    <span 
      className={`animated-gradient-text gradient-${size} gradient-${color}`} 
      style={{ display: block ? "block" : "inline-block" }}
    >
      {children}
    </span>
  )
}
