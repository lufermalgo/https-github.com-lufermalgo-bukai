
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
  // Se usa directamente la imagen ubicada en 'public/summan.png'.
  // Al compilar con Vite, el contenido de 'public' se mueve a la raíz del build,
  // asegurando que la imagen suba a Cloud Run correctamente.
  return (
    <img
      src="/summan.png"
      alt="BukAI Logo"
      className={className}
      style={style}
    />
  );
}
