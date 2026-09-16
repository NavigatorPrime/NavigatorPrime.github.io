/* ============================================================
   CONTROL PANEL PORTFOLIO — INTERACTIVITY & ANIMATIONS
   ============================================================ */

(function () {
  'use strict';

  // --- Reduced Motion Check ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================
  // HERO: Oscilloscope Animation
  // ============================

  function generateSinePath(width, height, cycles, points, phaseOffset) {
    const amplitude = height * 0.38;
    const midY = height / 2;
    const phase = phaseOffset || 0;
    let d = '';
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      const y = midY + amplitude * Math.sin((i / points) * cycles * 2 * Math.PI + phase);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ',' + y.toFixed(2);
    }
    return d;
  }

  function initOscilloscope() {
    const trace = document.getElementById('scope-trace');
    const statusEl = document.getElementById('scope-status');
    if (!trace) return;

    const W = 500, H = 140, CYCLES = 3.5, PTS = 200;
    const SCROLL_SPEED = 0.018; // radians per frame — smooth, not frantic
    let phase = 0;
    let animating = false;

    // Generate the initial static sine wave
    trace.setAttribute('d', generateSinePath(W, H, CYCLES, PTS, 0));

    // Measure total path length for stroke-dasharray animation
    const totalLength = trace.getTotalLength();
    trace.style.strokeDasharray = totalLength;
    trace.style.strokeDashoffset = totalLength;

    // --- Continuous oscillation loop ---
    function oscillate() {
      phase += SCROLL_SPEED;
      trace.setAttribute('d', generateSinePath(W, H, CYCLES, PTS, phase));
      requestAnimationFrame(oscillate);
    }

    if (prefersReducedMotion) {
      // Skip animation — show final state immediately
      trace.style.strokeDashoffset = '0';
      document.querySelectorAll('.led').forEach(led => led.classList.add('on'));
      if (statusEl) {
        statusEl.textContent = 'ACTIVE';
        statusEl.classList.add('active');
      }
      return;
    }

    // Animate the trace drawing in
    requestAnimationFrame(() => {
      trace.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)';
      trace.style.strokeDashoffset = '0';
    });

    // After draw-in completes, start continuous oscillation
    setTimeout(() => {
      // Remove the dasharray so the full path is always visible
      trace.style.transition = 'none';
      trace.style.strokeDasharray = 'none';
      trace.style.strokeDashoffset = '0';
      oscillate();
    }, 1600);

    // LEDs light up sequentially starting ~1.5s after load
    const leds = [
      document.getElementById('led-1'),
      document.getElementById('led-2'),
      document.getElementById('led-3'),
      document.getElementById('led-4'),
    ];

    leds.forEach((led, i) => {
      if (!led) return;
      setTimeout(() => {
        led.classList.add('on');
      }, 1500 + i * 160);
    });

    // Status text swap after LED sequence finishes
    const statusDelay = 1500 + leds.length * 160 + 100;
    setTimeout(() => {
      if (statusEl) {
        statusEl.textContent = 'ACTIVE';
        statusEl.classList.add('active');
      }
    }, statusDelay);
  }


  // ============================
  // SCROLL: Project Card Fade-In
  // ============================

  function initProjectCards() {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;

    if (prefersReducedMotion) {
      cards.forEach(card => card.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach(card => observer.observe(card));
  }


  // ============================
  // SCROLL: Skill Gauge Fill
  // ============================

  function initSkillGauges() {
    const gauges = document.querySelectorAll('.skill-gauge');
    if (!gauges.length) return;

    const RADIUS = 50;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    // Initialize all gauge arcs
    gauges.forEach(gauge => {
      const fill = gauge.querySelector('.gauge-fill');
      if (!fill) return;
      fill.style.strokeDasharray = CIRCUMFERENCE;
      fill.style.strokeDashoffset = CIRCUMFERENCE; // start empty
    });

    if (prefersReducedMotion) {
      // Show all filled immediately
      gauges.forEach(gauge => {
        const fill = gauge.querySelector('.gauge-fill');
        const pct = parseInt(gauge.dataset.percent, 10) || 0;
        if (!fill) return;
        const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
        fill.style.strokeDashoffset = offset;
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const gauge = entry.target;
            const fill = gauge.querySelector('.gauge-fill');
            const pct = parseInt(gauge.dataset.percent, 10) || 0;
            if (!fill) return;

            const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
            // Trigger the CSS transition
            requestAnimationFrame(() => {
              fill.style.strokeDashoffset = offset;
            });
            observer.unobserve(gauge);
          }
        });
      },
      { threshold: 0.4 }
    );

    gauges.forEach(gauge => observer.observe(gauge));
  }



  // ============================
  // SCROLL: Timeline Current Fill
  // ============================

  function initTimeline() {
    const timeline = document.getElementById('timeline');
    const current = document.getElementById('timeline-current');
    const items = document.querySelectorAll('.timeline-item');
    if (!timeline || !current) return;

    function updateTimeline() {
      const rect = timeline.getBoundingClientRect();
      const timelineTop = rect.top;
      const timelineHeight = rect.height;
      const viewportHeight = window.innerHeight;

      // How far through the timeline section we've scrolled
      // Start filling when timeline enters the viewport, complete when it exits
      const triggerPoint = viewportHeight * 0.6;
      const progress = (triggerPoint - timelineTop) / timelineHeight;
      const clampedProgress = Math.max(0, Math.min(1, progress));

      current.style.height = (clampedProgress * 100) + '%';

      // Light up nodes as the current passes them
      items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        const itemRelativeTop = itemRect.top - rect.top;
        const itemFraction = itemRelativeTop / timelineHeight;

        if (clampedProgress >= itemFraction) {
          item.classList.add('lit');
        } else {
          item.classList.remove('lit');
        }
      });
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateTimeline();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Initial call
    updateTimeline();
  }


  // ============================
  // UPLOAD: Profile Photo
  // ============================

  function initPhotoUpload() {
    const input = document.getElementById('photo-input');
    const preview = document.getElementById('photo-preview');
    const label = document.getElementById('photo-upload-label');
    if (!input || !preview) return;

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        preview.src = ev.target.result;
        preview.alt = 'Profile photo of ' + (document.querySelector('.logo span:last-child')?.textContent || 'the engineer');

        // Trigger the fade/scale animation
        if (prefersReducedMotion) {
          preview.classList.add('loaded');
        } else {
          requestAnimationFrame(() => {
            preview.classList.add('loaded');
          });
        }

        // Hide the upload hint after a moment
        if (label) {
          setTimeout(() => {
            label.style.opacity = '0';
            label.style.pointerEvents = 'none';
          }, 300);
        }
      };
      reader.readAsDataURL(file);
    });
  }



  // ============================
  // SMOOTH SCROLL NAV
  // ============================

  function initSmoothScroll() {
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });
      });
    });
  }


  // ============================
  // INIT
  // ============================

  document.addEventListener('DOMContentLoaded', () => {
    initOscilloscope();
    initProjectCards();
    initSkillGauges();
    initTimeline();
    initPhotoUpload();
    initSmoothScroll();
    initMarqueeScroll();
    if (!prefersReducedMotion) initParticles();
  });

  // ============================
  // MARQUEE: Manual Scrolling
  // ============================

  function initMarqueeScroll() {
    const container = document.getElementById('achievement-marquee');
    const leftBtn = document.getElementById('marquee-left');
    const rightBtn = document.getElementById('marquee-right');
    if (!container || !leftBtn || !rightBtn) return;

    // Scroll by approximately one card width + gap (340 + 24 = 364)
    const scrollAmount = 364;

    leftBtn.addEventListener('click', () => {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  // ============================
  // HERO: Floating Particle System
  // ============================

  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const hero = document.getElementById('hero');
    let particles = [];
    const PARTICLE_COUNT = 45;
    const CONNECTION_DIST = 120;
    const colors = [
      'rgba(242, 169, 59, 0.5)',  // amber
      'rgba(95, 182, 214, 0.5)',   // cyan
      'rgba(74, 222, 128, 0.35)', // green
      'rgba(242, 169, 59, 0.3)',  // amber dim
    ];

    function resize() {
      const rect = hero.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    }

    function createParticle() {
      const rect = hero.getBoundingClientRect();
      return {
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.8 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.5 + 0.3,
      };
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function draw() {
      const rect = hero.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(242, 169, 59, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener('resize', () => { resize(); });
  }

})();
