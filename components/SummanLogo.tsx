
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { CSSProperties } from 'react';

interface SummanLogoProps {
  className?: string;
  style?: CSSProperties;
}

export default function SummanLogo({ className, style }: SummanLogoProps) {
  return (
    <img
      src="/img/logo-summan.png"
      alt="BukAI Logo"
      className={className}
      style={style}
    />
  );
}