'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface DragSubmitSliderProps {
  onSubmit: (e?: React.FormEvent) => void;
  loading: boolean;
  disabled: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export default function DragSubmitSlider({ onSubmit, loading, disabled }: DragSubmitSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showSubmitText, setShowSubmitText] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const SUBMIT_THRESHOLD = 0.8; // 80% drag required
  const SLIDER_WIDTH = 400; // Fixed width for calculations

  // Generate new particle
  const createParticle = useCallback((x: number, y: number): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    const colors = ['#7c3aed', '#ec4899', '#3b82f6', '#fbbf24'];
    
    return {
      id: particleIdRef.current++,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 60,
      maxLife: 60,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }, []);

  // Update particles
  const updateParticles = useCallback(() => {
    setParticles(prev => 
      prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1,
          vx: particle.vx * 0.98, // Friction
          vy: particle.vy * 0.98
        }))
        .filter(particle => particle.life > 0)
    );
  }, []);

  // Spawn particles around handle
  const spawnParticles = useCallback((x: number, y: number, count: number = 3) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push(createParticle(x, y));
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, [createParticle]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      updateParticles();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    if (isDragging || particles.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, particles.length]);

  // Handle mouse/touch events
  const handleStart = useCallback((clientX: number) => {
    console.log('handleStart called', { disabled, loading, isSubmitted, clientX });
    if (disabled || loading || isSubmitted) {
      console.log('Drag blocked because:', { disabled, loading, isSubmitted });
      return;
    }
    
    setIsDragging(true);
    setShowSubmitText(false);
    
    // Spawn initial particles
    if (handleRef.current) {
      const rect = handleRef.current.getBoundingClientRect();
      spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 5);
    }
  }, [disabled, loading, isSubmitted]);

  const handleMove = useCallback((clientX: number) => {
    console.log('handleMove called', { isDragging, disabled, loading, isSubmitted, clientX });
    if (!isDragging || disabled || loading || isSubmitted) return;
    
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const handleWidth = 50; // Handle width
      const maxDrag = rect.width - handleWidth;
      const dragDistance = Math.max(0, Math.min(clientX - rect.left - handleWidth / 2, maxDrag));
      const progress = dragDistance / maxDrag;
      
      console.log('Drag progress:', { progress, dragDistance, maxDrag, rect });
      setDragProgress(progress);
      
      // Show submit text when close to threshold
      if (progress >= SUBMIT_THRESHOLD - 0.1) {
        setShowSubmitText(true);
      } else {
        setShowSubmitText(false);
      }
      
      // Spawn particles during drag
      if (handleRef.current && Math.random() < 0.3) {
        const handleRect = handleRef.current.getBoundingClientRect();
        spawnParticles(handleRect.left + handleRect.width / 2, handleRect.top + handleRect.height / 2, 1);
      }
    }
  }, [isDragging, disabled, loading, isSubmitted]);

  const handleEnd = useCallback(() => {
    if (!isDragging || disabled || loading || isSubmitted) return;
    
    setIsDragging(false);
    
    if (dragProgress >= SUBMIT_THRESHOLD) {
      // Success! Submit the form
      setIsSubmitted(true);
      setShowSubmitText(true);
      
      // Spawn success particles
      if (handleRef.current) {
        const rect = handleRef.current.getBoundingClientRect();
        for (let i = 0; i < 15; i++) {
          setTimeout(() => {
            spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2, 3);
          }, i * 50);
        }
      }
      
      // Call onSubmit after a brief delay
      setTimeout(() => {
        onSubmit();
      }, 800);
    } else {
      // Snap back
      setDragProgress(0);
      setShowSubmitText(false);
    }
  }, [isDragging, disabled, loading, isSubmitted, dragProgress, onSubmit]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('Mouse down event triggered', e);
    e.preventDefault();
    handleStart(e.clientX);
  }, [disabled, loading, isSubmitted, handleStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleStart(e.touches[0].clientX);
  }, [handleStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleEnd();
  }, [handleEnd]);

  // Add global event listeners
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Reset when loading starts
  useEffect(() => {
    if (loading) {
      setIsSubmitted(false);
      setDragProgress(0);
      setShowSubmitText(false);
    }
  }, [loading]);

  const handlePosition = dragProgress * (SLIDER_WIDTH - 50); // 50px is handle width
  const progressWidth = dragProgress * 100;

  return (
    <div className="drag-submit-container">
      {/* Particle Canvas */}
      <div className="particle-canvas">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.life / particle.maxLife,
              transform: `scale(${particle.life / particle.maxLife})`
            }}
          />
        ))}
      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className={`drag-slider ${isDragging ? 'dragging' : ''} ${showSubmitText ? 'near-submit' : ''} ${isSubmitted ? 'submitted' : ''} ${disabled ? 'disabled' : ''}`}
        style={{ width: SLIDER_WIDTH }}
      >
        {/* Progress Fill */}
        <div
          className="slider-progress"
          style={{ width: `${progressWidth}%` }}
        />
        
        {/* Submit Text */}
        {showSubmitText && (
          <div className="submit-text">
            {isSubmitted ? '🚀 LAUNCHING!' : 'SUBMIT'}
          </div>
        )}
        
        {/* Handle */}
        <div
          ref={handleRef}
          className={`slider-handle ${isDragging ? 'dragging' : ''} ${isSubmitted ? 'submitted' : ''}`}
          style={{ left: handlePosition }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="handle-icon">
            {isSubmitted ? '✨' : '🔮'}
          </div>
        </div>
        
        {/* Slider Text */}
        <div className="slider-text">
          {isSubmitted ? '🚀 Launching Your Destiny!' : 
           showSubmitText ? '✨ Preparing Eigenstates...' : 
           '🔮 Generate My Manifestation Timeline'}
        </div>
      </div>
    </div>
  );
}
