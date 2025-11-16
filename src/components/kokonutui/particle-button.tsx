"use client";

import * as React from "react";
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";

interface ParticleButtonProps extends ButtonProps, VariantProps<typeof buttonVariants> {
  particleCount?: number;
  particleColor?: string;
  showParticles?: boolean;
}

const ParticleButton = React.forwardRef<HTMLButtonElement, ParticleButtonProps>(
  (
    {
      className,
      variant,
      size,
      particleCount = 20,
      particleColor = "currentColor",
      showParticles = true,
      children,
      ...props
    },
    ref
  ) => {
    const [particles, setParticles] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!showParticles || !buttonRef.current) {
        props.onClick?.(e);
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }));

      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => {
        setParticles([]);
      }, 600);

      props.onClick?.(e);
    };

    return (
      <Button
        ref={(node) => {
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
          buttonRef.current = node;
        }}
        className={cn("relative overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95", className)}
        variant={variant}
        size={size}
        onClick={handleClick}
        {...props}
      >
        {children}
        {showParticles && particles.length > 0 && (
          <span className="absolute inset-0 pointer-events-none">
            {particles.map((particle) => (
              <span
                key={particle.id}
                className="absolute w-1 h-1 rounded-full animate-ping"
                style={{
                  left: `${particle.x}px`,
                  top: `${particle.y}px`,
                  backgroundColor: particleColor,
                  animationDuration: "600ms",
                }}
              />
            ))}
          </span>
        )}
      </Button>
    );
  }
);

ParticleButton.displayName = "ParticleButton";

export { ParticleButton, type ParticleButtonProps };

