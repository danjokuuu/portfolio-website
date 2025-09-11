// -------------------------------------------------- #### ANIMATED TEXT COMPONENT #### --------------------------------------------------
export default function AnimatedText({ 
  children, 
  size = "medium", 
  color = "black", 
  block = false,
  fontFamily = "inherit",   
  fontSize = null           
}) {
  return (
    <span 
      className={`animated-gradient-text gradient-${size} gradient-${color}`} 
      style={{ 
        display: block ? "block" : "inline-block",
        fontFamily: fontFamily,
        fontSize: fontSize
      }}
    >
      {children}
    </span>
  )
}
