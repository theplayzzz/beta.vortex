interface ToggleSwitchFieldProps {
  value: boolean;
  onChange: (value: boolean) => void;
  onBlur: () => void;
  labels?: {
    on: string;
    off: string;
  };
}

export function ToggleSwitchField({ 
  value, 
  onChange, 
  onBlur,
  labels = { on: 'Sim', off: 'Não' }
}: ToggleSwitchFieldProps) {
  const handleToggle = () => {
    const newValue = !value;
    onChange(newValue);
    onBlur();
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Switch */}
      <button
        type="button"
        onClick={handleToggle}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sgbus-green focus:ring-offset-2 focus:ring-offset-night
          ${value ? 'bg-sgbus-green' : 'bg-seasalt/20'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${value ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>

      {/* Labels */}
      <div className="flex items-center space-x-4">
        <span 
          className={`text-sm transition-colors ${
            !value ? 'text-seasalt font-medium' : 'text-periwinkle'
          }`}
        >
          {labels.off}
        </span>
        <span 
          className={`text-sm transition-colors ${
            value ? 'text-seasalt font-medium' : 'text-periwinkle'
          }`}
        >
          {labels.on}
        </span>
      </div>

      {/* Estado visual adicional */}
      <div className="flex items-center">
        {value ? (
          <div className="flex items-center space-x-2 text-sgbus-green">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-sm font-medium">{labels.on}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-periwinkle">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path 
                fillRule="evenodd" 
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
            <span className="text-sm">{labels.off}</span>
          </div>
        )}
      </div>
    </div>
  );
} 