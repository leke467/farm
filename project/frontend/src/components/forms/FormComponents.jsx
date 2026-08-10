import { useState } from "react";
import { FiInfo } from "react-icons/fi";

/**
 * Helper component for rendering Field Label + Hoverable Tooltip Hint Icon
 */
export function FieldLabelWithHint({ label, required, hint, htmlFor }) {
  if (!label) return null;
  return (
    <div className="flex items-center gap-1.5 mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
        <span>{label}</span>
        {required ? <span className="text-red-500 ml-1">*</span> : null}
      </label>
      {hint ? (
        <div className="relative group flex items-center">
          <FiInfo className="w-3.5 h-3.5 text-gray-400 hover:text-green-600 transition-colors cursor-help flex-shrink-0" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2 bg-slate-900 text-white text-xs rounded-md shadow-xl z-50 pointer-events-none leading-relaxed text-center font-normal">
            <span>{hint}</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * FormField Component - Reusable form field with validation
 * Handles text, email, password, number, tel inputs
 */
export function FormField({
  label,
  type = "text",
  register,
  name,
  errors,
  placeholder,
  required = false,
  minLength,
  maxLength,
  pattern,
  disabled = false,
  className = "",
  helperText,
  explanation,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const error = errors?.[name];
  const hasError = !!error;
  const hint = helperText || explanation;

  const inputClasses = `
    w-full px-4 py-2 border rounded-lg transition-colors
    ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
    ${className}
  `.trim();

  const fieldType = type === "password" && showPassword ? "text" : type;

  return (
    <div className="mb-4">
      <FieldLabelWithHint label={label} required={required} hint={hint} htmlFor={name} />

      <div className="relative">
        <input
          {...register(name, {
            required: required ? `${label || name} is required` : false,
            minLength:
              minLength && {
                value: minLength,
                message: `Minimum ${minLength} characters required`,
              },
            maxLength:
              maxLength && {
                value: maxLength,
                message: `Maximum ${maxLength} characters allowed`,
              },
            pattern: pattern && {
              value: pattern.value,
              message: pattern.message,
            },
          })}
          type={fieldType}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        )}
      </div>

      {hasError && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}

/**
 * SelectField Component - Dropdown field with validation
 */
export function SelectField({
  label,
  register,
  name,
  errors,
  options,
  required = false,
  disabled = false,
  className = "",
  helperText,
  explanation,
}) {
  const error = errors?.[name];
  const hasError = !!error;
  const hint = helperText || explanation;

  return (
    <div className="mb-4">
      <FieldLabelWithHint label={label} required={required} hint={hint} htmlFor={name} />

      <select
        {...register(name, {
          required: required ? `${label || name} is required` : false,
        })}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors
          ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `.trim()}
      >
        <option value="">Select {label || name}</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasError && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}

/**
 * TextAreaField Component - Multi-line text input with validation
 */
export function TextAreaField({
  label,
  register,
  name,
  errors,
  placeholder,
  required = false,
  minLength,
  maxLength,
  rows = 4,
  disabled = false,
  className = "",
  helperText,
  explanation,
}) {
  const error = errors?.[name];
  const hasError = !!error;
  const hint = helperText || explanation;

  return (
    <div className="mb-4">
      <FieldLabelWithHint label={label} required={required} hint={hint} htmlFor={name} />

      <textarea
        {...register(name, {
          required: required ? `${label || name} is required` : false,
          minLength:
            minLength && {
              value: minLength,
              message: `Minimum ${minLength} characters required`,
            },
          maxLength:
            maxLength && {
              value: maxLength,
              message: `Maximum ${maxLength} characters allowed`,
            },
        })}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg resize-vertical transition-colors
          ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `.trim()}
      />

      {hasError && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}

/**
 * DateField Component - Date input with validation
 */
export function DateField({
  label,
  register,
  name,
  errors,
  required = false,
  min,
  max,
  disabled = false,
  className = "",
  helperText,
  explanation,
}) {
  const error = errors?.[name];
  const hasError = !!error;
  const hint = helperText || explanation;

  return (
    <div className="mb-4">
      <FieldLabelWithHint label={label} required={required} hint={hint} htmlFor={name} />

      <input
        {...register(name, {
          required: required ? `${label || name} is required` : false,
          validate: (value) => {
            if (!value) return true;

            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (max === "today" && selectedDate > today) {
              return `${label || "Date"} cannot be in the future`;
            }

            return true;
          },
        })}
        type="date"
        min={min}
        max={max}
        disabled={disabled}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors
          ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `.trim()}
      />

      {hasError && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}

/**
 * Format string/number to include thousands separator commas
 * e.g. "1000000" -> "1,000,000"
 * e.g. "2000.50" -> "2,000.50"
 */
export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === "") return "";
  const str = String(value).replace(/,/g, "");
  if (isNaN(str) && str !== "-" && !str.includes(".")) return value;
  const parts = str.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

/**
 * Remove commas from formatted string
 * e.g. "1,000,000" -> "1000000"
 */
export function cleanCommaNumber(value) {
  if (value === null || value === undefined || value === "") return "";
  return String(value).replace(/,/g, "");
}

/**
 * NumberField Component - Input with automatic thousands separator commas
 */
export function NumberField({
  label,
  register,
  name,
  errors,
  placeholder,
  required = false,
  min,
  max,
  step = "any",
  disabled = false,
  className = "",
  helperText,
  explanation,
  onChange: customOnChange,
}) {
  const error = errors?.[name];
  const hasError = !!error;
  const hint = helperText || explanation;

  const fieldRegister = register
    ? register(name, {
        required: required ? `${label || name} is required` : false,
        validate: (value) => {
          if (!value) return true;
          const cleanVal = cleanCommaNumber(value);
          const numValue = parseFloat(cleanVal);
          if (isNaN(numValue)) return "Please enter a valid number";
          if (min !== undefined && numValue < parseFloat(min)) {
            return `Must be at least ${min}`;
          }
          if (max !== undefined && numValue > parseFloat(max)) {
            return `Cannot exceed ${max}`;
          }
          return true;
        },
      })
    : {};

  const handleChange = (e) => {
    const rawVal = e.target.value;
    const cleaned = cleanCommaNumber(rawVal);
    // Allow digits, single decimal dot, negative sign
    if (/^-?\d*\.?\d*$/.test(cleaned)) {
      const formatted = formatNumberWithCommas(cleaned);
      e.target.value = formatted;
      if (fieldRegister.onChange) fieldRegister.onChange(e);
      if (customOnChange) customOnChange(cleaned, formatted);
    }
  };

  return (
    <div className="mb-4">
      <FieldLabelWithHint label={label} required={required} hint={hint} htmlFor={name} />

      <input
        {...fieldRegister}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        className={`
          w-full px-4 py-2 border rounded-lg transition-colors font-mono font-medium
          ${hasError ? "border-red-500 bg-red-50" : "border-gray-300 bg-white"}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
          ${className}
        `.trim()}
      />

      {hasError && (
        <p className="text-red-500 text-sm mt-1">{error.message}</p>
      )}
    </div>
  );
}

/**
 * FormError Component - Display form-level errors
 */
export function FormError({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex justify-between items-center">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-700 hover:text-red-900 font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * FormSuccess Component - Display success message
 */
export function FormSuccess({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex justify-between items-center">
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-green-700 hover:text-green-900 font-bold"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * SubmitButton Component - Styled submit button with loading state
 */
export function SubmitButton({
  label = "Submit",
  loading = false,
  disabled = false,
  className = "",
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={`
        w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium
        transition-colors duration-200
        ${
          loading || disabled
            ? "bg-blue-400 cursor-not-allowed"
            : "hover:bg-blue-700 active:bg-blue-800"
        }
        ${className}
      `.trim()}
    >
      {loading ? "Loading..." : label}
    </button>
  );
}
