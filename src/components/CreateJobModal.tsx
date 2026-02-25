// src/components/CreateJobModal.tsx — 建立任務 Modal（單一職責：Modal 容器 + 開關動畫）
import { X } from 'lucide-react';
import CreateJobForm from './CreateJobForm';
import type { CreateJobPayload } from '../types/job';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateJobPayload) => void;
  isSubmitting: boolean;
  error: string | null;
}

export default function CreateJobModal({ isOpen, onClose, onSubmit, isSubmitting, error }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-gray-900 border border-gray-700/50
                      rounded-2xl shadow-2xl shadow-black/50 animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
          <h2 className="text-base font-semibold text-white">建立新任務</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <CreateJobForm
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </div>
      </div>
    </div>
  );
}
