'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/providers/auth-provider';
import { ApiClientError } from '@/lib/api/client';
import { registerSchema, type RegisterFormData } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegisterForm() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      password: formData.get('password') as string,
    };

    // Validate
    const result = registerSchema.safeParse(data);
    if (!result.success) {
      const errors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    // Submit
    setIsLoading(true);
    try {
      await register(result.data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.errorCode === 'EMAIL_EXISTS') {
          setError('An account with this email already exists');
        } else if (err.details && err.details.length > 0) {
          setError(err.details.join(', '));
        } else {
          setError(err.message || 'An error occurred');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Input
        name="name"
        type="text"
        label="Full Name"
        placeholder="John Doe"
        error={fieldErrors.name}
        autoComplete="name"
        disabled={isLoading}
      />

      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="agent@example.com"
        error={fieldErrors.email}
        autoComplete="email"
        disabled={isLoading}
      />

      <Input
        name="phone"
        type="tel"
        label="Phone (optional)"
        placeholder="+905551234567"
        error={fieldErrors.phone}
        autoComplete="tel"
        disabled={isLoading}
      />

      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="Create a strong password"
        error={fieldErrors.password}
        autoComplete="new-password"
        disabled={isLoading}
      />

      <Button type="submit" className="w-full" isLoading={isLoading}>
        Create Account
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
