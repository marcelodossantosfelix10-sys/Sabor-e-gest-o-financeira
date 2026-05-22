import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import LoginScreen from '../components/LoginScreen';

describe('LoginScreen', () => {
  it('renders login buttons and reacts to clicks', async () => {
    const login = vi.fn(async () => undefined);
    const loginWithRedirect = vi.fn(async () => undefined);
    const clearError = vi.fn();

    render(
      <LoginScreen
        error="Erro de teste"
        login={login}
        loginWithRedirect={loginWithRedirect}
        clearError={clearError}
      />
    );

    expect(screen.getByRole('heading', { name: /sabor & gestão/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar com google/i })).toBeInTheDocument();
    expect(screen.getByText(/erro de teste/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /entrar com google/i }));
    expect(login).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /problemas no login/i }));
    expect(loginWithRedirect).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /fechar mensagem/i }));
    expect(clearError).toHaveBeenCalled();
  });
});
