/* Allow CSS custom properties (--bg, --ar …) in React style objects. */
import 'react';

declare module 'react' {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
