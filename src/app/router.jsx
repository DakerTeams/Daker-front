import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout.jsx'
import CampPage from '../pages/CampPage.jsx'
import HackathonDetailPage from '../pages/HackathonDetailPage.jsx'
import HackathonsPage from '../pages/HackathonsPage.jsx'
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
        path: 'hackathons/:slug',
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
        element: <MyPage />,
      },
    ],
  },
])
