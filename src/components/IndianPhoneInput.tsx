import { useState } from "react";
import { Input } from "@/components/ui/input";

interface IndianPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  required?: boolean;
  className?: string;
}

const formatPhone = (digits: string) => {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
};

const IndianPhoneInput = ({ value, onChange, id, required, className }: IndianPhoneInputProps) => {
  const [touched, setTouched] = useState(false);

  const digits = value.replace(/\D/g, "").replace(/^91/, "");
  const isValid = /^[6-9]\d{9}$/.test(digits);
  const showError = touched && digits.length > 0 && !isValid;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 10) {
      onChange(raw);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex">
        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground text-sm font-medium">
          +91
        </span>
        <Input
          id={id}
          required={required}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="XXXXX XXXXX"
          value={formatPhone(digits)}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          className={`rounded-l-none ${className ?? "bg-secondary border-border text-foreground placeholder:text-muted-foreground"}`}
        />
      </div>
      {showError && (
        <p className="text-xs text-destructive">Enter a valid Indian mobile number</p>
      )}
    </div>
  );
};

export default IndianPhoneInput;
