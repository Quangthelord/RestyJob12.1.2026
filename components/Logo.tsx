interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
    xl: 'text-5xl',
  }

  return (
    <span 
      className={`font-bold tracking-tight ${sizeClasses[size]} ${className} font-baloo`} 
      style={{ 
        fontFamily: 'var(--font-baloo), sans-serif',
        lineHeight: '1.1',
        display: 'inline-block',
      }}
    >
      <span className="text-orange-600">resty</span>
      <span 
        style={{
          backgroundImage: 'radial-gradient(200% 200% at center, #011131 0%, #050017 25%, rgba(0, 19, 57, 0.045) 50%, #000000 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: '#2563eb', // Fallback bright blue
        }}
      >
        job
      </span>
    </span>
  )
}

