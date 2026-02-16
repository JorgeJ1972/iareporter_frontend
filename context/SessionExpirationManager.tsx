import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';

const SessionExpirationManager: React.FC = () => {
  const navigate = useNavigate();

  const handleSessionExpired = useCallback(() => {
    // Al detectar un 401 de la API, limpiamos la sesión y redirigimos
    // pasando el motivo a la página de login. Esto unifica el comportamiento
    // con el que ya tiene PrivateRoute.
    sessionStorage.setItem('session_expired_reason', 'Tu sesión ha finalizado por inactividad. Por favor, inicia sesión de nuevo.');
    logout();
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [handleSessionExpired]);

  // Este componente no renderiza nada visible por sí mismo.
  // Su único propósito es escuchar el evento y actuar.
  return null;
};

export default SessionExpirationManager;