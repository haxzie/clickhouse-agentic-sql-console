type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'password';
  placeholder?: string;
  required?: boolean;
};

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
}: TextFieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sub font-medium text-neutral-500">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-neutral-300 px-2 py-1.5 outline-none focus:border-neutral-900"
      />
    </label>
  );
}
