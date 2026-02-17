import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getMenus, checkAuthStatus, logout } from "../services/authService";
import LayoutFinal from "../layouts/LayoutFinal";

const PrivateRoute = () => {
  const location = useLocation();
  const authStatus = checkAuthStatus();

  // 1. Verificar si el usuario está autenticado.
  if (!authStatus.isAuthenticated) {
    // Si no está autenticado, cerramos la sesión para limpiar cualquier dato residual.
    logout();

    // Si la razón es que el token expiró o es inválido, lo comunicamos a la página de login.
    if (authStatus.reason === 'EXPIRED' || authStatus.reason === 'INVALID_TOKEN') {
      sessionStorage.setItem('session_expired_reason', 'Tu sesión ha finalizado. Por favor, inicia sesión de nuevo.');
      return <Navigate to="/login" replace />;
    }

    // Para cualquier otro caso (ej. no hay token), redirigimos silenciosamente.
    return <Navigate to="/login" replace />;
  }

  // 2. Obtener las rutas permitidas para el usuario desde el menú guardado.
  const allowedRoutes = getMenus().map(menu => menu.route);

  // 3. Asegurarse de que la página principal siempre sea accesible si el usuario está logueado.
  if (!allowedRoutes.includes('/main')) {
    allowedRoutes.push('/main');
  }

  // 4. Comprobar si la ruta actual está en la lista de rutas permitidas.
  const isPathAllowed = allowedRoutes.includes(location.pathname);

  if(!isPathAllowed && allowedRoutes.includes('/environments')  //TODO VALIDAR
      &&  
      (
        location.pathname.startsWith('/tablegroups/') ||
        location.pathname.startsWith('/profileconfiguration/') ||
        location.pathname.startsWith('/environment-config/') ||
        location.pathname.startsWith('/tables-group-config/')
        
      )
    ){
      // 6. Si el usuario está autenticado y la ruta está permitida, renderizar el layout y la página solicitada.
      return (
        <LayoutFinal>
          <Outlet />
        </LayoutFinal>
      );
  }

  if(!isPathAllowed && allowedRoutes.includes('/users')  //TODO VALIDAR
    && location.pathname.startsWith('/tablegroups-user/')){
      // 6. Si el usuario está autenticado y la ruta está permitida, renderizar el layout y la página solicitada.
      return (
        <LayoutFinal>
          <Outlet />
        </LayoutFinal>
      );
  }

  if (!isPathAllowed) {
    // 5. Si la ruta no está permitida, redirigir al usuario a la página principal.
    // Esto previene el acceso directo por URL a rutas no autorizadas.
    return <Navigate to="/main" replace />;
  }

  // 6. Si el usuario está autenticado y la ruta está permitida, renderizar el layout y la página solicitada.
  return (
    <LayoutFinal>
      <Outlet />
    </LayoutFinal>
  );
};

export default PrivateRoute;