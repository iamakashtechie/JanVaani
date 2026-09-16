import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AdminProvider } from './context/AdminContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SkeletonPage } from './components/SkeletonCard';
import Login from './screens/Login';
import Signup from './screens/Signup';
import NotFound from './screens/NotFound';

// Lazy-loaded route screens
const Home           = lazy(() => import('./screens/Home'));
const ReportIssue    = lazy(() => import('./screens/ReportIssue'));
const TrackProgress  = lazy(() => import('./screens/TrackProgress'));
const Analytics      = lazy(() => import('./screens/Analytics'));
const MapView        = lazy(() => import('./screens/MapView'));
const MyAccount      = lazy(() => import('./screens/MyAccount'));
const AdminDashboard = lazy(() => import('./screens/AdminDashboard'));

const PageLoader = () => <SkeletonPage count={3} />;

const withNav = (Component) => (
    <ProtectedRoute>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
            <Component />
        </Suspense>
    </ProtectedRoute>
);

const router = createBrowserRouter([
    { path: "/signup", element: <Signup /> },
    { path: "/login",  element: <Login /> },
    { path: "/",        element: withNav(Home) },
    { path: "/report",  element: withNav(ReportIssue) },
    { path: "/track",   element: withNav(TrackProgress) },
    { path: "/map",     element: withNav(MapView) },
    { path: "/analytics", element: withNav(Analytics) },
    { path: "/account", element: withNav(MyAccount) },
    {
        path: "/admin",
        element: (
            <ProtectedRoute>
                <AdminRoute>
                    <Navbar />
                    <Suspense fallback={<PageLoader />}>
                        <AdminDashboard />
                    </Suspense>
                </AdminRoute>
            </ProtectedRoute>
        )
    },
    { path: "*", element: <NotFound /> },
]);

function App() {
    return (
        <AuthProvider>
            <AdminProvider>
                <NotificationProvider>
                    <RouterProvider router={router} />
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 3500,
                            style: {
                                borderRadius: '10px',
                                fontSize: '14px',
                            },
                        }}
                    />
                </NotificationProvider>
            </AdminProvider>
        </AuthProvider>
    );
}

export default App;
