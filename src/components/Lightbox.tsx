import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { loadImage } from '../store';

interface LightboxProps {
  photoId: string | null;
  onClose: () => void;
}

export const Lightbox = ({ photoId, onClose }: LightboxProps) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (photoId) {
      setLoading(true);
      loadImage(photoId).then((data) => {
        setSrc(data);
        setLoading(false);
      });
    } else {
      setSrc(null);
    }
  }, [photoId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!photoId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
      >
        <X size={24} />
      </button>

      {loading ? (
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
      ) : src ? (
        <img
          src={src}
          alt="Evidencia"
          className="max-w-full max-h-full object-contain select-none"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      ) : (
        <p className="text-white/50">Imagen no encontrada</p>
      )}
    </div>
  );
};
