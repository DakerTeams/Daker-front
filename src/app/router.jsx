import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx'
import MainLayout from '../layouts/MainLayout.jsx'
import AccessDeniedPage from '../pages/AccessDeniedPage.jsx'
import CampPage from '../pages/CampPage.jsx'
import AdminPage from '../pages/AdminPage.jsx'
import HackathonDetailPage from '../pages/HackathonDetailPage.jsx'
import HackathonsPage from '../pages/HackathonsPage.jsx'
import JudgePage from '../pages/JudgePage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import MainPage from '../pages/MainPage.jsx'
import MyPage from '../pages/MyPage.jsx'
import RankingsPage from '../pages/RankingsPage.jsx'
import SignupPage from '../pages/SignupPage.jsx'
import TeamCreatePage from '../pages/TeamCreatePage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        path: 'hackathons',
        element: <HackathonsPage />,
      },
      {
        path: 'hackathons/:id',
        element: <HackathonDetailPage />,
      },
      {
        path: 'camp',
        element: <CampPage />,
      },
      {
        path: 'team-create',
        element: <TeamCreatePage />,
      },
      {
        path: 'rankings',
        element: <RankingsPage />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
      {
        path: 'me',
        element: (
          <ProtectedRoute>
            <MyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute allowRoles={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'judge',
        element: (
          <ProtectedRoute allowRoles={['judge', 'admin']}>
            <JudgePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'access-denied',
        element: <AccessDeniedPage />,
      },
    ],
  },
])
