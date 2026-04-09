import { useState } from "react";

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
}) {
  const [showPassword, setShowPassword] = useState(false);

  const error = errors?.[name];
  const hasError = !!error;

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
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

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
}) {
  const error = errors?.[name];
  const hasError = !!error;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

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
}) {
  const error = errors?.[name];
  const hasError = !!error;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

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
}) {
  const error = errors?.[name];
  const hasError = !!error;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

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
 * NumberField Component - Number input with validation
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
}) {
  const error = errors?.[name];
  const hasError = !!error;

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <input
        {...register(name, {
          required: required ? `${label || name} is required` : false,
          validate: (value) => {
            if (!value) return true;

            const numValue = parseFloat(value);

            if (min !== undefined && numValue < parseFloat(min)) {
              return `Must be at least ${min}`;
            }

            if (max !== undefined && numValue > parseFloat(max)) {
              return `Cannot exceed ${max}`;
            }

            return true;
          },
        })}
        type="number"
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
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
