import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isRound?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, isRound = true }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[999999999] ${
        isRound ? 'rounded-2xl' : 'rounded-none'
      }`}
      onClick={onClose}>
      <div
        className="bg-white dark:bg-black/90 p-6 rounded-lg shadow-lg w-96"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* <button className="absolute top-2 right-2 text-gray-600" onClick={onClose}>
          ✕
        </button> */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
