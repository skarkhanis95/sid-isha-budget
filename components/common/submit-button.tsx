"use client";

import React from "react";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pendingChildren?: React.ReactNode;
}

export function SubmitButton({ children, pendingChildren, disabled, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} {...props}>
      {pending ? pendingChildren ?? children : children}
    </button>
  );
}
