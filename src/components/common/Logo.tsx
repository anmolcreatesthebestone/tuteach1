import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Upload, X, Image as ImageIcon, Check } from 'lucide-react';

export const OFFICIAL_LOGO_URL = '/assets/aistudio/tuteach_logo_b6133804.png';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'phoneCall';
  variant?: 'full' | 'iconOnly';
  showTagline?: boolean;
  clickable?: boolean;
  allowUploadModal?: boolean;
  callState?: 'idle' | 'listening' | 'thinking' | 'speaking';
  volumeLevel?: number; // 0 to 1
  className?: string;
}

export const TUTeachLogo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  showTagline = true,
  clickable = true,
  allowUploadModal = false,
  callState = 'idle',
  volumeLevel = 0,
  className = ''
}) => {
  const { customLogoUrl, setCustomLogo, navigate } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  const activeLogoSrc = customLogoUrl || OFFICIAL_LOGO_URL;

  const sizeDimensions = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    phoneCall: 'w-48 h-48 sm:w-60 sm:h-60'
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setCustomLogo(reader.result);
          setIsModalOpen(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrl.trim()) {
      setCustomLogo(tempUrl.trim());
      setIsModalOpen(false);
    }
  };

  // Dynamic animation classes based on callState and audio volume
  const getCallRingStyles = () => {
    if (callState === 'speaking') {
      return {
        outerRing: 'scale-125 opacity-40 bg-[#F14C2F] animate-ping',
        midRing: 'scale-115 opacity-60 bg-[#F14C2F]/50 animate-pulse',
        glow: 'ring-4 ring-[#F14C2F] shadow-[0_0_50px_rgba(241,76,47,0.7)]'
      };
    }
    if (callState === 'listening') {
      return {
        outerRing: 'scale-120 opacity-30 bg-emerald-500 animate-pulse',
        midRing: 'scale-110 opacity-50 bg-emerald-400/40 animate-ping',
        glow: 'ring-4 ring-emerald-500 shadow-[0_0_45px_rgba(16,185,129,0.6)]'
      };
    }
    if (callState === 'thinking') {
      return {
        outerRing: 'scale-110 opacity-40 bg-amber-500 animate-spin duration-3000',
        midRing: 'scale-105 opacity-60 bg-amber-400/40 animate-pulse',
        glow: 'ring-4 ring-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.5)]'
      };
    }
    return {
      outerRing: 'scale-100 opacity-0',
      midRing: 'scale-100 opacity-0',
      glow: 'ring-1 ring-[#393636]/10 shadow-xs'
    };
  };

  const ringStyles = getCallRingStyles();

  // Dynamic scale boost based on volumeLevel
  const dynamicScale = callState === 'speaking' ? 1 + volumeLevel * 0.12 : 1;

  const logoMark = (
    <div
      onClick={() => {
        if (clickable && callState === 'idle') navigate('home');
      }}
      className={`relative flex items-center justify-center select-none ${
        clickable && callState === 'idle' ? 'cursor-pointer group' : ''
      } ${className}`}
      title="TUTeach Official Circular Logo"
    >
      {/* Animated Call Waves for Phone Call Experience */}
      {size === 'phoneCall' && (
        <>
          <div
            className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${ringStyles.outerRing}`}
          />
          <div
            className={`absolute inset-0 rounded-full transition-all duration-500 pointer-events-none ${ringStyles.midRing}`}
          />
        </>
      )}

      {/* Main Circular Container */}
      <div
        style={{ transform: `scale(${dynamicScale})` }}
        className={`${sizeDimensions[size]} rounded-full overflow-hidden bg-[#FAF7EE] transition-all duration-300 flex items-center justify-center ${ringStyles.glow}`}
      >
        <img
          src={activeLogoSrc}
          alt="TUTeach Logo"
          className="w-full h-full object-cover rounded-full block select-none pointer-events-none"
        />
      </div>

      {/* Upload button only if enabled */}
      {allowUploadModal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
          className="absolute -bottom-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#393636] text-[#EFEBDA] hover:text-[#F14C2F] hover:bg-black p-1 rounded-full text-[10px] shadow border border-[#EFEBDA]/20 z-10"
          title="Customize TUTeach logo"
        >
          <Upload className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );

  if (variant === 'iconOnly' || size === 'phoneCall') {
    return (
      <>
        {logoMark}
        {renderModal()}
      </>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-3 ${className}`}>
        {logoMark}

        {/* Text Title & Tagline */}
        <div
          onClick={() => {
            if (clickable) navigate('home');
          }}
          className={`flex flex-col ${clickable ? 'cursor-pointer' : ''}`}
        >
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-xl font-extrabold tracking-tight text-[#393636]">
              TU<span className="text-[#F14C2F]">TEACH</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold bg-[#F14C2F]/10 text-[#F14C2F] rounded border border-[#F14C2F]/20">
              AI
            </span>
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-[#393636]/70 tracking-tight mt-0.5">
              Learn Smarter With AI.
            </span>
          )}
        </div>
      </div>

      {renderModal()}
    </>
  );

  function renderModal() {
    if (!isModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#393636]/10 text-[#393636]">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#F14C2F]" />
              <h3 className="font-bold text-lg text-[#393636]">TUTeach Logo Management</h3>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-4 text-sm">
            <p className="text-gray-600">
              Official <strong>TUTeach circular logo</strong> is set to <code>/assets/aistudio/tuteach_logo_b6133804.png</code>.
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#F14C2F]/40 hover:border-[#F14C2F] rounded-xl cursor-pointer bg-[#EFEBDA]/30 hover:bg-[#EFEBDA]/60 transition-colors">
              <Upload className="w-8 h-8 text-[#F14C2F] mb-2" />
              <span className="font-semibold text-[#393636]">Upload new logo image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <form onSubmit={handleApplyUrl} className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-gray-700">Or paste public image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F14C2F]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#393636] hover:bg-black text-white text-sm font-semibold rounded-lg"
                >
                  Apply
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                <Check className="w-4 h-4 text-green-600" /> Active Logo Loaded
              </span>
              {customLogoUrl && (
                <button
                  onClick={() => {
                    setCustomLogo(null);
                    setIsModalOpen(false);
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Reset to Default
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};
