import { useState, useRef, useEffect } from "react";
import { FiInfo, FiX, FiCheckCircle } from "react-icons/fi";

const ChartInfoTooltip = ({ title, description, howToRead, actionTip }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-slate-100 focus:outline-none"
        title="How to read this chart"
        aria-label="Chart information"
      >
        <FiInfo className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 hover:scale-110 transition-transform" />
      </button>

      {isOpen && (
        <div className="absolute z-50 right-0 sm:left-0 sm:right-auto mt-2 w-72 sm:w-80 bg-slate-900/95 text-slate-100 p-4 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md text-xs sm:text-sm animate-in fade-in zoom-in-95 duration-150">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <FiInfo className="text-blue-400 flex-shrink-0" />
              <span>{title || "Understanding this Chart"}</span>
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-full hover:bg-slate-800"
            >
              <FiX size={16} />
            </button>
          </div>

          {description && (
            <p className="text-slate-300 mb-2.5 leading-relaxed">
              {description}
            </p>
          )}

          {howToRead && howToRead.length > 0 && (
            <div className="mb-2.5 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/50">
              <p className="font-semibold text-slate-200 mb-1.5 text-xs uppercase tracking-wider">
                💡 How to Read It:
              </p>
              <ul className="space-y-1 text-slate-300 text-xs">
                {howToRead.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-blue-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actionTip && (
            <div className="flex items-start gap-2 bg-emerald-950/60 text-emerald-300 p-2.5 rounded-lg border border-emerald-800/50 text-xs">
              <FiCheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" size={14} />
              <span><strong>Recommendation:</strong> {actionTip}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChartInfoTooltip;
