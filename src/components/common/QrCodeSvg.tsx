import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Real, 100% valid scannable QR Code generator using standard QR specification
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 140,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2, // high DPI resolution for crisp phone scanning
      color: {
        dark: '#020617', // slate-950
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Failed to generate real QR code', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-white rounded-xl shadow-inner ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-[10px] text-slate-400 font-semibold animate-pulse">Generating QR...</span>
      </div>
    );
  }

  return (
    <div
      className={`relative inline-block p-1.5 bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={dataUrl}
        alt={`Scan QR Code to join room: ${value}`}
        className="w-full h-full object-contain select-none"
      />
    </div>
  );
};
