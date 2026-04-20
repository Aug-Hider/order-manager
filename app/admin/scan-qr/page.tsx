'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

export default function ScanQRPage() {
  const { data: session } = useSession();
  const [scanning, setScanning] = useState(false);
  const [scannedOrder, setScannedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');

  const isStaff = ['chef', 'staff'].includes(session?.user?.role || '');

  const startScanning = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
        scanQRCode(videoRef.current, canvasRef.current);
      }
    } catch (err) {
      setError('Accès caméra refusé');
      console.error('Erreur:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setScanning(false);
  };

  const scanQRCode = (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');

    const scan = () => {
      if (!scanning) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context?.drawImage(video, 0, 0);

        try {
          const imageData = context?.getImageData(0, 0, canvas.width, canvas.height);
          if (imageData) {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              const url = new URL(code.data);
              const id = url.searchParams.get('order');
              if (id) {
                fetchOrder(id);
                return;
              }
            }
          }
        } catch (error) {
          console.error('Erreur détection:', error);
        }
      }

      requestAnimationFrame(scan);
    };

    scan();
  };

  const fetchOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();

      if (res.ok) {
        setScannedOrder(data.order);
        stopScanning();
      } else {
        setError('Commande non trouvée');
      }
    } catch (error) {
      setError('Erreur de lecture');
    }
  };

  const handleAcceptOrder = async () => {
    if (!scannedOrder) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${scannedOrder.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'picked_up' }),
      });

      if (res.ok) {
        setScannedOrder(null);
        setError('');
      } else {
        setError('Erreur mise à jour');
      }
    } catch (error) {
      setError('Erreur');
    }
    setLoading(false);
  };

  if (!isStaff) return <div className="p-8">Accès refusé</div>;

  return (
    <div className="p-8 h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6">📱 Scanner QR</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {!scanning && !scannedOrder && (
        <div className="bg-white rounded-xl p-8 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📷</div>
          <p className="text-gray-600 mb-6">Cliquez pour scanner</p>
          <Button onClick={startScanning} className="w-full">
            Démarrer
          </Button>
        </div>
      )}

      {scanning && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-lg">
            <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border-4 border-orange-500 aspect-square object-cover" />
            <div className="absolute inset-0 rounded-lg pointer-events-none">
              <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-orange-500"></div>
              <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-orange-500"></div>
              <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-orange-500"></div>
              <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-orange-500"></div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-gray-600 mt-6">Alignez le QR</p>
          <Button onClick={stopScanning} variant="outline" className="mt-6">
            Arrêter
          </Button>
        </div>
      )}

      {scannedOrder && (
        <div className="flex items-center justify-center flex-1">
          <div className="bg-white rounded-xl p-8 max-w-md border-4 border-green-400">
            <h2 className="text-3xl font-bold mb-6 text-center">✅ Valide</h2>
            <div className="bg-green-50 p-6 rounded-lg mb-6">
              <p className="text-4xl font-bold text-green-600">#{scannedOrder.displayNumber}</p>
              <p className="text-lg mt-4">{scannedOrder.customerName}</p>
              <p className="text-2xl font-bold mt-2">{scannedOrder.totalPizzas} 🍕</p>
              <p className="text-2xl font-bold text-orange-600">{scannedOrder.totalAmount}€</p>
            </div>
            <Button onClick={handleAcceptOrder} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 py-3">
              {loading ? '...' : 'Partie ✓'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}