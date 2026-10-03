/**
 * Stjärnspåren bakom sidan.
 *
 * Som ett fotografi med lång slutartid av natthimlen: ljusspår som mjuka
 * bågar kring en punkt på himlen, strax utanför skärmen uppe till höger.
 * Varje spår är en enda båge som är ljus i huvudet och tonar ut längs
 * svansen. Hela himlen vrider sig mycket långsamt, så spåren glider runt
 * polen nästan omärkligt, och var och ett andas sakta starkare och
 * svagare. Mellan spåren glimmar små stjärnor.
 *
 * Det ersätter sidenbandet. Bandet bestod av många tunna linjer tätt
 * intill varandra som rörde sig, och mellan dem uppstod ett skimmer som
 * var jobbigt att titta på hur mycket det än tonades ned. Spåren här
 * ligger glest och är lite tjockare, så det finns inget som kan skimra.
 *
 * Färgerna är märkets: plommon, lila och syren, och här och där en
 * aning cyan.
 *
 * Bakgrunden reagerar varken på muspekaren eller på rullningen. Den ska
 * ligga still bakom innehållet, inte leka med det.
 */

/* Färgerna spåren väljer bland. */
const STOPS: [number, [number, number, number]][] = [
  [0, [110, 43, 146]],
  [0.42, [178, 107, 222]],
  [0.72, [198, 150, 235]],
  [1, [120, 205, 240]],
];

const colorAt = (u: number): [number, number, number] => {
  for (let i = 1; i < STOPS.length; i += 1) {
    const [p1, c1] = STOPS[i];
    const [p0, c0] = STOPS[i - 1];
    if (u <= p1) {
      const k = (u - p0) / (p1 - p0);
      return [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k];
    }
  }
  return STOPS[STOPS.length - 1][1];
};

/* Slumpen har ett frö, så himlen ser likadan ut varje gång sidan laddas. */
const seeded = (start: number) => {
  let seed = start;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
};

type Trail = {
  /** Avstånd från polen, som andel av skärmhöjden. */
  radius: number;
  /** Var på varvet spåret börjar, i radianer. */
  angle: number;
  /** Hur lång svansen är, i radianer. */
  length: number;
  width: number;
  alpha: number;
  color: [number, number, number];
  /** Andningens takt och fas. */
  rate: number;
  phase: number;
};

const makeTrails = (count: number): Trail[] => {
  const rand = seeded(20261002);
  return Array.from({ length: count }, () => {
    /* Fler spår nära polen än långt ut, som på ett riktigt foto - men
       inte så tätt att de flyter ihop. */
    const radius = 0.25 + Math.pow(rand(), 0.8) * 2.1;
    /* Nästan alla spår är lila. Ungefär vart sjätte drar åt cyan. */
    const tone = rand() < 0.16 ? 0.85 + rand() * 0.15 : rand() * 0.75;
    return {
      radius,
      angle: rand() * Math.PI * 2,
      length: 0.25 + rand() * 0.7,
      width: 1.6 + rand() * 1.8,
      alpha: 0.45 + rand() * 0.55,
      color: colorAt(tone),
      rate: 0.08 + rand() * 0.15,
      phase: rand() * Math.PI * 2,
    };
  });
};

const TRAILS = makeTrails(110);

/*
 * Stjärnorna: små korn som svävar sakta och glimmar till då och då.
 */
type Mote = { x: number; y: number; vx: number; vy: number; size: number; rate: number; phase: number };

const makeMotes = (count: number): Mote[] => {
  const rand = seeded(917);
  return Array.from({ length: count }, () => ({
    x: rand(),
    y: rand(),
    vx: 0.0025 + rand() * 0.004,
    vy: (rand() - 0.5) * 0.003,
    size: 0.6 + rand() * 1.1,
    rate: 0.3 + rand() * 0.6,
    phase: rand() * Math.PI * 2,
  }));
};

const MOTES = makeMotes(60);

/* De första kornen är lite större stjärnor som glimtar till med ett
   fyruddigt ljuskors när de lyser som starkast - som ljuset bryts i en
   kameralins. Bara ett fåtal, annars blir det glitter. */
const GLINTS = 7;

/*
 * Nebulosan: ett svagt dis av lila, plommon och en aning cyan kring
 * polen, så spåren ser ut att virvla ut ur ett lysande moln. Molnen
 * följer himlens vridning, fast lite långsammare, så de glider mot
 * spåren och himlen får djup.
 */
type Cloud = { angle: number; dist: number; size: number; color: [number, number, number]; alpha: number };

const CLOUDS: Cloud[] = [
  { angle: 1.9, dist: 0.35, size: 0.95, color: [178, 107, 222], alpha: 0.075 },
  { angle: 2.5, dist: 0.6, size: 0.8, color: [110, 43, 146], alpha: 0.09 },
  { angle: 1.3, dist: 0.55, size: 0.6, color: [120, 205, 240], alpha: 0.04 },
  { angle: 2.9, dist: 0.95, size: 0.7, color: [150, 80, 200], alpha: 0.045 },
];

/*
 * Stjärnfallen. Ett åt gången, med långa pauser emellan - en liten
 * överraskning för den som råkar titta, inte ett fyrverkeri. Tiderna
 * ligger fast i ett schema som upprepas, så ett stjärnfall aldrig dyker
 * upp tätt efter ett annat av en slump.
 */
type Meteor = { at: number; x: number; y: number; angle: number; reach: number };

const METEOR_CYCLE = 96;
const METEOR_DURATION = 1.3;
const METEORS: Meteor[] = (() => {
  const rand = seeded(4242);
  return [6, 21, 39, 52, 70, 84].map((at) => ({
    at,
    x: 0.25 + rand() * 0.7,
    y: 0.04 + rand() * 0.4,
    /* Snett nedåt åt vänster, ungefär i spårens riktning. */
    angle: 2.55 + rand() * 0.35,
    reach: 0.22 + rand() * 0.16,
  }));
})();

export type StarTrailsOptions = {
  canvas: HTMLCanvasElement;
  /**
   * Ett andra, litet canvas för skenet. Bilden skalas ned hit varje
   * bildruta och visas sedan uppförstorad och mjuk bakom spåren, så de
   * glöder. Samma sak som bloom på ett foto, och det kostar nästan inget.
   */
  glow?: HTMLCanvasElement | null;
  reducedMotion: boolean;
};

/** Startar himlen. Returnerar en funktion som stänger av den, eller null utan canvas. */
export const startStarTrails = ({ canvas, glow, reducedMotion }: StarTrailsOptions) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const glowCtx = glow?.getContext("2d") ?? null;

  let width = 0;
  let height = 0;
  let dpr = 1;

  /* Skenet ritas i en sjättedels storlek och läggs i två lager. */
  const GLOW_SCALE = 6;
  const GLOW_PASSES = 3;
  const GLOW_BLUR = 3;

  const layout = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (glow) {
      glow.width = Math.max(1, Math.round(width / GLOW_SCALE));
      glow.height = Math.max(1, Math.round(height / GLOW_SCALE));
    }
  };
  layout();

  /* Konisk gradient finns i alla nya webbläsare. Saknas den ritas svansen
     i stycken med allt svagare ton i stället - nästan lika mjukt. */
  const hasConic = typeof ctx.createConicGradient === "function";

  /* Ett varv tar knappt en halvtimme. Rörelsen ska märkas om man tittar
     en stund, inte medan man läser. */
  const SPIN = 0.0038;

  const draw = (time: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    /* Polen ligger utanför skärmen uppe till höger, så bågarna sveper in
       över sidan från det hörnet. */
    const px = width * 0.86;
    const py = -height * 0.32;
    const spin = time * SPIN;

    /* Nebulosan längst bak, så spåren lyser ovanpå den. */
    CLOUDS.forEach((cloud, index) => {
      const a = cloud.angle + spin * 0.6;
      const cx = px + Math.cos(a) * cloud.dist * height;
      const cy = py + Math.sin(a) * cloud.dist * height;
      const radius = cloud.size * height;
      const [cr, cg, cb] = cloud.color;
      const pulse = 0.85 + 0.15 * Math.sin(time * 0.05 + index * 1.7);
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${(cloud.alpha * pulse).toFixed(3)})`);
      gradient.addColorStop(0.55, `rgba(${cr}, ${cg}, ${cb}, ${(cloud.alpha * pulse * 0.4).toFixed(3)})`);
      gradient.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    });

    for (const trail of TRAILS) {
      const r = trail.radius * height;
      const head = trail.angle + spin;
      const tail = head - trail.length;
      const breath = 0.6 + 0.4 * Math.sin(time * trail.rate + trail.phase);
      const [cr, cg, cb] = trail.color;

      ctx.lineWidth = trail.width;
      ctx.globalAlpha = trail.alpha * breath;

      if (hasConic) {
        /* Gradienten vrids så att den börjar vid svansen: genomskinlig
           där, full färg vid huvudet. Andelen av varvet som spåret täcker
           avgör var huvudet hamnar i gradienten. */
        const span = trail.length / (Math.PI * 2);
        const gradient = ctx.createConicGradient(tail, px, py);
        gradient.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        gradient.addColorStop(span * 0.6, `rgba(${cr}, ${cg}, ${cb}, 0.35)`);
        gradient.addColorStop(span, `rgba(${cr}, ${cg}, ${cb}, 1)`);
        gradient.addColorStop(Math.min(1, span + 0.0001), `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, r, tail, head);
        ctx.stroke();
      } else {
        const pieces = 10;
        for (let p = 0; p < pieces; p += 1) {
          const a0 = tail + (trail.length * p) / pieces;
          const a1 = tail + (trail.length * (p + 1)) / pieces;
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${((p + 1) / pieces) ** 1.6})`;
          ctx.beginPath();
          ctx.arc(px, py, r, a0, a1);
          ctx.stroke();
        }
      }

      /* Huvudet: en liten ljus punkt där spåret slutar, som stjärnan
         själv. */
      ctx.globalAlpha = trail.alpha * breath * 0.9;
      ctx.fillStyle = `rgb(${Math.round(cr + (255 - cr) * 0.5)}, ${Math.round(cg + (255 - cg) * 0.5)}, ${Math.round(cb + (255 - cb) * 0.5)})`;
      ctx.beginPath();
      ctx.arc(px + Math.cos(head) * r, py + Math.sin(head) * r, trail.width * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Stjärnorna. De glider sakta och glimmar till var för sig. */
    MOTES.forEach((mote, index) => {
      const u = (((mote.x + mote.vx * time) % 1) + 1) % 1;
      const v = (((mote.y + mote.vy * time + 0.02 * Math.sin(time * 0.2 + mote.phase)) % 1) + 1) % 1;
      const twinkle = Math.pow(0.5 + 0.5 * Math.sin(time * mote.rate + mote.phase), 3);
      const x = u * width;
      const y = v * height;
      const bright = index < GLINTS;

      ctx.globalAlpha = 0.12 + 0.6 * twinkle;
      ctx.fillStyle = "rgb(225, 205, 245)";
      ctx.beginPath();
      ctx.arc(x, y, bright ? mote.size * 1.4 : mote.size, 0, Math.PI * 2);
      ctx.fill();

      /* Ljuskorset, bara när den större stjärnan lyser som starkast. */
      if (bright && twinkle > 0.45) {
        const strength = (twinkle - 0.45) / 0.55;
        const reach = 5 + 11 * strength;
        ctx.globalAlpha = 0.85 * strength;
        ctx.lineWidth = 1;
        for (const [dx, dy] of [
          [1, 0],
          [0, 1],
        ]) {
          const spike = ctx.createLinearGradient(x - dx * reach, y - dy * reach, x + dx * reach, y + dy * reach);
          spike.addColorStop(0, "rgba(225, 205, 245, 0)");
          spike.addColorStop(0.5, "rgba(240, 228, 255, 1)");
          spike.addColorStop(1, "rgba(225, 205, 245, 0)");
          ctx.strokeStyle = spike;
          ctx.beginPath();
          ctx.moveTo(x - dx * reach, y - dy * reach);
          ctx.lineTo(x + dx * reach, y + dy * reach);
          ctx.stroke();
        }
      }
    });

    /* Stjärnfallet, om det är dags för ett. Huvudet rusar snett nedåt,
       svansen dras efter, och allt tonar in och ut på ett drygt sekund. */
    const inCycle = time % METEOR_CYCLE;
    const meteor = METEORS.find((m) => inCycle >= m.at && inCycle < m.at + METEOR_DURATION);
    if (meteor) {
      const p = (inCycle - meteor.at) / METEOR_DURATION;
      const eased = 1 - Math.pow(1 - p, 2);
      const fade = Math.sin(Math.PI * p);
      const dirX = Math.cos(meteor.angle);
      const dirY = Math.sin(meteor.angle);
      const travel = meteor.reach * width * eased;
      const hx = meteor.x * width + dirX * travel;
      const hy = meteor.y * height + dirY * travel;
      const tailLength = 90 + 170 * fade;
      const tx = hx - dirX * tailLength;
      const ty = hy - dirY * tailLength;

      const streak = ctx.createLinearGradient(tx, ty, hx, hy);
      streak.addColorStop(0, "rgba(178, 107, 222, 0)");
      streak.addColorStop(0.7, "rgba(198, 150, 235, 0.5)");
      streak.addColorStop(1, "rgba(245, 238, 255, 1)");
      ctx.globalAlpha = fade;
      ctx.strokeStyle = streak;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      ctx.fillStyle = "rgb(245, 238, 255)";
      ctx.beginPath();
      ctx.arc(hx, hy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    /* Skenet: bilden nedskalad, med lätt oskärpa, i två lager. */
    if (glow && glowCtx) {
      glowCtx.clearRect(0, 0, glow.width, glow.height);
      glowCtx.imageSmoothingQuality = "high";
      glowCtx.globalCompositeOperation = "lighter";
      glowCtx.filter = `blur(${GLOW_BLUR}px)`;
      for (let pass = 0; pass < GLOW_PASSES; pass += 1) {
        glowCtx.drawImage(canvas, 0, 0, glow.width, glow.height);
      }
      glowCtx.filter = "none";
      glowCtx.globalCompositeOperation = "source-over";
    }
  };

  const start = performance.now();
  const TIME_OFFSET = 40;
  const seconds = () => (performance.now() - start) / 1000 + TIME_OFFSET;

  /* Mindre rörelse: en stillbild. */
  if (reducedMotion) {
    draw(TIME_OFFSET);
    const onResize = () => {
      layout();
      draw(TIME_OFFSET);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }

  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(layout, 120);
  };
  window.addEventListener("resize", onResize);

  /* Trettio bilder i sekunden räcker för något som rör sig så här sakta.
     requestAnimationFrame står still av sig själv när fliken inte syns. */
  const FRAME = 1000 / 30;
  let last = 0;
  let raf = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - last < FRAME) return;
    last = now;
    draw(seconds());
  };
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
  };
};
