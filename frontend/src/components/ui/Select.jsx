import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && <label className="input-label">{label}</label>}
      <div className="relative">
        <select
          className={`input-field appearance-none pr-10 cursor-pointer ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
          }`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400 pointer-events-none" />
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Select;
