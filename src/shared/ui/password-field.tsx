"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";
import { Field, type FieldProps } from "./field";

type Props = Omit<FieldProps, "type" | "icon" | "action"> & {
  toggleLabel: string;
};

export function PasswordField({ toggleLabel, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      {...props}
      type={visible ? "text" : "password"}
      icon={<Lock size={18} />}
      action={
        <button
          type="button"
          aria-label={toggleLabel}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="grid size-9 place-items-center rounded-full text-fg-muted transition-colors hover:text-fg"
        >
          {visible ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      }
    />
  );
}
