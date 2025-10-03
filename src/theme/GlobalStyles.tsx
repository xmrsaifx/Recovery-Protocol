import { Global, css } from '@emotion/react';
import { colors, typography } from './tokens';

export function GlobalStyles() {
  return (
    <Global
      styles={css`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          height: 100%;
        }

        body {
          margin: 0;
          background: linear-gradient(180deg, #020617 0%, #0F172A 100%);
          color: ${colors.text};
          font-family: ${typography.fontFamily};
          letter-spacing: 0.02em;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button {
          font-family: inherit;
        }
      `}
    />
  );
}
