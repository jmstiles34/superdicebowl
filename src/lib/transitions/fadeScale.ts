export default function fadeScale (
    node:HTMLElement, { delay = 0, duration = 200, easing = (x:number) => x, baseScale = 0 }
  ) {
    const o = +getComputedStyle(node).opacity;
    //const m:RegExpMatchArray | null = getComputedStyle(node).transform.match(/scale\(([0-9.]+)\)/);
    //const s:string|1 = m ? m[1] : 1;
    const s = 1;
    const is = 1 - baseScale;
    return {
      delay,
      duration,
      css: (t:number) => {
        const eased = easing(t);
        return `opacity: ${eased * o}; transform: scale(${(eased * s * is) + baseScale})`;
      }
    };
  }