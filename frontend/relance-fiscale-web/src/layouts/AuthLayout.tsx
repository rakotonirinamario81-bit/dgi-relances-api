import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-fiscal-bordeaux">Service Fiscal</h1>
          <p className="text-sm text-gray-500">Plateforme de relances et recouvrement</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}