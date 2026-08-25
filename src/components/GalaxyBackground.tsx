import React, { useEffect, useRef } from "react";

interface GalaxyBackgroundProps {
  intensity?: "full" | "subtle" | "off";
  interactive?: boolean;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  maxOpacity: number;
  width: number;
  color: string;
}

export const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({
  intensity = "full",
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (intensity === "off") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener("resize", handleResize);

    // Stars data
    interface Star {
      x: number;
      y: number;
      radius: number;
      baseAlpha: number;
      twinkleSpeed: number;
      phase: number;
      hue: number;
    }

    let stars: Star[] = [];
    const starCount = intensity === "full" ? 220 : 120;

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 1.6 + 0.3,
          baseAlpha: Math.random() * 0.7 + 0.2,
          twinkleSpeed: Math.random() * 0.03 + 0.008,
          phase: Math.random() * Math.PI * 2,
          hue: Math.random() > 0.6 ? 200 : Math.random() > 0.3 ? 230 : 190,
        });
      }
    };

    initStars();

    // Meteors data
    let meteors: Meteor[] = [];
    const maxMeteors = intensity === "full" ? 5 : 2;

    const spawnMeteor = (): Meteor => {
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1); // ~45 deg
      const colors = ["#89ceff", "#38bdf8", "#c084fc", "#ffffff"];
      const chosenColor = colors[Math.floor(Math.random() * colors.length)];
      const maxOp = intensity === "full" ? (Math.random() * 0.6 + 0.4) : (Math.random() * 0.25 + 0.15);

      return {
        x: Math.random() * width * 1.2 - width * 0.1,
        y: Math.random() * (height * 0.4) - 80,
        length: Math.random() * 120 + 80,
        speed: Math.random() * 8 + 6,
        angle: angle,
        opacity: 0,
        maxOpacity: maxOp,
        width: Math.random() * 1.8 + 0.8,
        color: chosenColor,
      };
    };

    // Mouse coordinates
    let mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Deep obsidian space gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, "#05070f");
      bgGrad.addColorStop(0.5, "#080e20");
      bgGrad.addColorStop(1, "#0a1026");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Nebula clouds
      const nebula1 = ctx.createRadialGradient(
        width * 0.25 + Math.sin(time * 0.3) * 60,
        height * 0.3 + Math.cos(time * 0.2) * 50,
        10,
        width * 0.25,
        height * 0.3,
        width * 0.5
      );
      const nebulaOpacity = intensity === "full" ? 0.14 : 0.06;
      nebula1.addColorStop(0, `rgba(14, 165, 233, ${nebulaOpacity})`);
      nebula1.addColorStop(0.5, `rgba(99, 102, 241, ${nebulaOpacity * 0.6})`);
      nebula1.addColorStop(1, "rgba(5, 7, 15, 0)");
      ctx.fillStyle = nebula1;
      ctx.fillRect(0, 0, width, height);

      const nebula2 = ctx.createRadialGradient(
        width * 0.8 - Math.cos(time * 0.25) * 60,
        height * 0.7 - Math.sin(time * 0.3) * 50,
        20,
        width * 0.8,
        height * 0.7,
        width * 0.45
      );
      nebula2.addColorStop(0, `rgba(139, 92, 246, ${nebulaOpacity * 0.9})`);
      nebula2.addColorStop(0.6, `rgba(14, 165, 233, ${nebulaOpacity * 0.4})`);
      nebula2.addColorStop(1, "rgba(5, 7, 15, 0)");
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // Interactive mouse aura
      if (interactive) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          320
        );
        const auraAlpha = intensity === "full" ? 0.09 : 0.04;
        mouseGlow.addColorStop(0, `rgba(56, 189, 248, ${auraAlpha})`);
        mouseGlow.addColorStop(1, "rgba(14, 165, 233, 0)");
        ctx.fillStyle = mouseGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw Twinkling Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle = Math.sin(time * 3 + s.phase) * 0.5 + 0.5;
        const alpha = s.baseAlpha * (0.3 + 0.7 * twinkle);

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${s.hue}, 90%, 85%, ${alpha})`;
        ctx.shadowColor = `hsla(${s.hue}, 95%, 70%, ${alpha * 0.8})`;
        ctx.shadowBlur = s.radius * 3;
        ctx.fill();
        ctx.restore();
      }

      // Manage & Draw Meteors
      if (meteors.length < maxMeteors && Math.random() < (intensity === "full" ? 0.03 : 0.012)) {
        meteors.push(spawnMeteor());
      }

      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;

        // Fade in and out
        if (m.y < height * 0.2) {
          m.opacity = Math.min(m.maxOpacity, m.opacity + 0.04);
        } else if (m.y > height * 0.7) {
          m.opacity = Math.max(0, m.opacity - 0.03);
        } else {
          m.opacity = m.maxOpacity;
        }

        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.7, `${m.color}${Math.floor(m.opacity * 255 * 0.6).toString(16).padStart(2, "0")}`);
        grad.addColorStop(1, `#ffffff${Math.floor(m.opacity * 255).toString(16).padStart(2, "0")}`);

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = m.width;
        ctx.lineCap = "round";
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 8;

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(m.x, m.y);
        ctx.stroke();

        // Head spark
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.width * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${m.opacity})`;
        ctx.fill();

        ctx.restore();

        // Remove if off-screen or faded out
        if (m.x > width + 150 || m.y > height + 150 || (m.y > height * 0.8 && m.opacity <= 0.01)) {
          meteors.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, interactive]);

  if (intensity === "off") {
    return <div className="fixed inset-0 bg-[#05070f] -z-50" />;
  }

  return (
    <canvas
      ref={canvasRef}
      id="light-ai-galaxy-canvas"
      className="fixed inset-0 w-full h-full pointer-events-none -z-50"
      style={{ display: "block" }}
    />
  );
};
