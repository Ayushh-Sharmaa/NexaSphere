import NotFound from './pages/NotFound';
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { stateToUrl, urlToState } from './utils/routing';
import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import './styles/themes.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/chatbot.css';
import './styles/components.css';
import './styles/portfolio.css';
import './styles/aurora.css';
import './styles/motion.css';
import SearchBar from './components/SearchBar';
import NotificationBell from './components/NotificationBell';

import ParticleBackground from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress from './shared/ScrollProgress';
import Navbar from './shared/Navbar';
import HeroSection from './pages/home/HeroSection';
import ActivitiesSection from './pages/activities/ActivitiesSection';
import EventsSection from './pages/events/EventsSection';
import AboutSection from './pages/about/AboutSection';
import TeamSection from './pages/team/TeamSection';
import Footer from './shared/Footer';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CinematicOpening from './shared/CinematicOpening';
import Chatbot from './shared/Chatbot';
import DashboardPage from './pages/dashboard/DashboardPage';
import GamificationDashboard from './components/gamification/GamificationDashboard';
import RecommendationWidget from './components/recommendation/RecommendationWidget';

import {
  AmbientOrbs,
  SectionDivider,
import FloatingDock from './components/common/FloatingDock';
import ParticleBackground from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress from './shared/ScrollProgress';
import Navbar from './shared/Navbar';
import HeroSection from './pages/home/HeroSection';
import ActivitiesSection from './pages/activities/ActivitiesSection';
import EventsSection from './pages/events/EventsSection';
import AboutSection from './pages/about/AboutSection';
import TeamSection from './pages/team/TeamSection';
import Footer from './shared/Footer';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CinematicOpening from './shared/CinematicOpening';
import Chatbot from './shared/Chatbot';
import {
  AmbientOrbs,
  SectionDivider,
import FloatingDock from './components/common/FloatingDock';
import ParticleBackground from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress from './shared/ScrollProgress';
import Navbar from './shared/Navbar';
import HeroSection from './pages/home/HeroSection';
import ActivitiesSection from './pages/activities/ActivitiesSection';
import EventsSection from './pages/events/EventsSection';
import AboutSection from './pages/about/AboutSection';
import TeamSection from './pages/team/TeamSection';
import Footer from './shared/Footer';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CinematicOpening from './shared/CinematicOpening';
import Chatbot from './shared/Chatbot';
import {
  AmbientOrbs,
  SectionDivider,
import { useState, useEffect, useRef, useCallback } from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";

import "./styles/aurora.css";
import "./styles/motion.css";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import SearchBar from "./components/SearchBar";
import FloatingDock from "./components/common/FloatingDock";
import ParticleBackground from "./shared/ParticleBackground";
import GeometricGridBackground from "./shared/GeometricGridBackground";
import ScrollProgress from "./shared/ScrollProgress";
import Navbar from "./shared/Navbar";
import HeroSection from "./pages/home/HeroSection";
import ActivitiesSection from "./pages/activities/ActivitiesSection";
import EventsSection from "./pages/events/EventsSection";
import AboutSection from "./pages/about/AboutSection";
import TeamSection from "./pages/team/TeamSection";
import Footer from "./shared/Footer";
import ActivityDetailPage from "./pages/activities/ActivityDetailPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CinematicOpening from "./shared/CinematicOpening";
import Chatbot from "./shared/Chatbot";
import {
  AmbientOrbs,
  SectionDivider,
import { useState, useEffect, useRef, useCallback } from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";

import "./styles/aurora.css";
import "./styles/motion.css";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import SearchBar from "./components/SearchBar";
import FloatingDock from "./components/common/FloatingDock";
import ParticleBackground from "./shared/ParticleBackground";
import GeometricGridBackground from "./shared/GeometricGridBackground";
import ScrollProgress from "./shared/ScrollProgress";
import Navbar from "./shared/Navbar";
import HeroSection from "./pages/home/HeroSection";
import ActivitiesSection from "./pages/activities/ActivitiesSection";
import EventsSection from "./pages/events/EventsSection";
import AboutSection from "./pages/about/AboutSection";
import TeamSection from "./pages/team/TeamSection";
import Footer from "./shared/Footer";
import ActivityDetailPage from "./pages/activities/ActivityDetailPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CinematicOpening from "./shared/CinematicOpening";
import Chatbot from "./shared/Chatbot";
import {
  AmbientOrbs,
  SectionDivider,
import { useState, useEffect, useRef, useCallback } from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";

import "./styles/aurora.css";
import "./styles/motion.css";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import SearchBar from "./components/SearchBar";
import FloatingDock from "./components/common/FloatingDock";
import ParticleBackground from "./shared/ParticleBackground";
import GeometricGridBackground from "./shared/GeometricGridBackground";
import ScrollProgress from "./shared/ScrollProgress";
import Navbar from "./shared/Navbar";
import HeroSection from "./pages/home/HeroSection";
import ActivitiesSection from "./pages/activities/ActivitiesSection";
import EventsSection from "./pages/events/EventsSection";
import AboutSection from "./pages/about/AboutSection";
import TeamSection from "./pages/team/TeamSection";
import Footer from "./shared/Footer";
import ActivityDetailPage from "./pages/activities/ActivityDetailPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CinematicOpening from "./shared/CinematicOpening";
import Chatbot from "./shared/Chatbot";
import {
  AmbientOrbs,
  SectionDivider,
import { useState, useEffect, useRef, useCallback } from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";

import "./styles/aurora.css";
import "./styles/motion.css";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import SearchBar from "./components/SearchBar";
import FloatingDock from "./components/common/FloatingDock";
import ParticleBackground from "./shared/ParticleBackground";
import GeometricGridBackground from "./shared/GeometricGridBackground";
import ScrollProgress from "./shared/ScrollProgress";
import Navbar from "./shared/Navbar";
import HeroSection from "./pages/home/HeroSection";
import ActivitiesSection from "./pages/activities/ActivitiesSection";
import EventsSection from "./pages/events/EventsSection";
import AboutSection from "./pages/about/AboutSection";
import TeamSection from "./pages/team/TeamSection";
import Footer from "./shared/Footer";
import ActivityDetailPage from "./pages/activities/ActivityDetailPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CinematicOpening from "./shared/CinematicOpening";
import Chatbot from "./shared/Chatbot";
import {
import { useState, useEffect, useRef, useCallback } from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";

import "./styles/aurora.css";
import "./styles/motion.css";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import SearchBar from "./components/SearchBar";
import FloatingDock from "./components/common/FloatingDock";
import ParticleBackground from "./shared/ParticleBackground";
import GeometricGridBackground from "./shared/GeometricGridBackground";
import ScrollProgress from "./shared/ScrollProgress";
import Navbar from "./shared/Navbar";
import HeroSection from "./pages/home/HeroSection";
import ActivitiesSection from "./pages/activities/ActivitiesSection";
import EventsSection from "./pages/events/EventsSection";
import AboutSection from "./pages/about/AboutSection";
import TeamSection from "./pages/team/TeamSection";
import Footer from "./shared/Footer";
import ActivityDetailPage from "./pages/activities/ActivityDetailPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CinematicOpening from "./shared/CinematicOpening";
import Chatbot from "./shared/Chatbot";
import {

  AmbientOrbs,
  SectionDivider,
import { useState, useEffect, useRef, useCallback } from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";
import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';

import './styles/themes.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/chatbot.css';
import './styles/components.css';
import './styles/portfolio.css';
import './styles/pwa.css';

import './styles/aurora.css';
import './styles/motion.css';
import WorkspacePage from './pages/workspace/WorkspacePage';
import SearchBar from './components/SearchBar';
import FloatingDock from './components/common/FloatingDock';
import ParticleBackground from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress from './shared/ScrollProgress';
import Navbar from './shared/Navbar';
import HeroSection from './pages/home/HeroSection';
import ActivitiesSection from './pages/activities/ActivitiesSection';
import EventsSection from './pages/events/EventsSection';
import AboutSection from './pages/about/AboutSection';
import TeamSection from './pages/team/TeamSection';
import Footer from './shared/Footer';
import ActivityDetailPage from './pages/activities/ActivityDetailPage';
import EventDetailPage from './pages/events/EventDetailPage';
import CinematicOpening from './shared/CinematicOpening';
import Chatbot from './shared/Chatbot';
import {
  AmbientOrbs,
  SectionDivider,
  PageFlash,
  BannerOrbs,
  useNsReveal,
  useHeroParallax,
  useNavScrollTint,
  useGlobalMouseParallax,
  useMagneticCards,
} from "./shared/MotionLayer";
import ActivitiesPage from "./pages/activities/ActivitiesPage";
import EventsPage from "./pages/events/EventsPage";
import AboutPage from "./pages/about/AboutPage";
import TeamPage from "./pages/team/TeamPage";
import ContactPage from "./pages/contact/ContactPage";
import dynamic from "next/dynamic";
import apiClient from "./utils/apiClient.js";
} from './shared/MotionLayer';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import EventsPage from './pages/events/EventsPage';
import AboutPage from './pages/about/AboutPage';
import TeamPage from './pages/team/TeamPage';
import ContactPage from './pages/contact/ContactPage';
import dynamic from 'next/dynamic';
import apiClient from './utils/apiClient.js';
import { getLocalEvents, mergeEvents, subscribePublicContent } from './utils/publicContentStore.js';
import NotFoundPage from './pages/NotFoundPage';

const RecruitmentPage = dynamic(() => import('./pages/recruitment/RecruitmentPage'), {
  ssr: false,
});
const MembershipPage = dynamic(() => import('./pages/membership/MembershipPage'), { ssr: false });
const AdminPage = dynamic(() => import('./pages/admin/AdminPage'), {
  ssr: false,
});
import RoadmapsPage from './pages/roadmaps/RoadmapsPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import CertificateVerifyPage from './pages/certificates/CertificateVerifyPage';
import CollabPage from './pages/collab/CollabPage';
import PortfolioBuilder from './components/portfolio/PortfolioBuilder';
import PublicPortfolio from './pages/portfolio/PublicPortfolio';
import DashboardPage from './pages/dashboard/DashboardPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';

import { activityPages } from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import nexasphereLogo from './assets/images/logos/nexasphere-logo.png';

import Terminal from './components/developer/Terminal';
import { useDeveloperMode } from './hooks/useDeveloperMode';

import BookmarksDrawer from "./components/bookmarks/BookmarksDrawer";
import { useTheme } from "./hooks/useTheme";
import { useInteractionEffects } from "./hooks/useInteractionEffects";
import { useBackToTop } from "./hooks/useScrollLogic";

  AmbientOrbs, SectionDivider, PageFlash, BannerOrbs,
  useNsReveal, useHeroParallax,
  useNavScrollTint, useGlobalMouseParallax, useMagneticCards,
} from './shared/MotionLayer';

import ActivitiesPage   from './pages/activities/ActivitiesPage';
import EventsPage       from './pages/events/EventsPage';
import AboutPage        from './pages/about/AboutPage';
import TeamPage         from './pages/team/TeamPage';
import ContactPage      from './pages/contact/ContactPage';
import RecruitmentPage  from './pages/recruitment/RecruitmentPage';
import MembershipPage   from './pages/membership/MembershipPage';
import AdminPage        from './pages/admin/AdminPage';
import RoadmapsPage     from './pages/roadmaps/RoadmapsPage';
import ProjectsPage     from './pages/projects/ProjectsPage';
import ResumePage       from './pages/resume/ResumePage';

import { activityPages }              from './data/activities/index';
import { events as fallbackEvents }   from './data/eventsData';
import nexasphereLogo                 from './assets/images/logos/nexasphere-logo.png';

import Terminal             from './components/developer/Terminal';
import CollabPage       from './pages/collab/CollabPage';
import PortfolioBuilder from './components/portfolio/PortfolioBuilder';
import PublicPortfolio  from './pages/portfolio/PublicPortfolio';

import { activityPages }            from './data/activities/index';

import ActivitiesPage      from './pages/activities/ActivitiesPage';
import EventsPage          from './pages/events/EventsPage';
import AboutPage           from './pages/about/AboutPage';
import TeamPage            from './pages/team/TeamPage';
import ContactPage         from './pages/contact/ContactPage';
import dynamic from 'next/dynamic';

import ActivitiesPage from './pages/activities/ActivitiesPage';
import EventsPage from './pages/events/EventsPage';
import AboutPage from './pages/about/AboutPage';
import TeamPage from './pages/team/TeamPage';
import ContactPage from './pages/contact/ContactPage';
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('./pages/membership/MembershipPage'));

import { activityPages } from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import Cursor from './components/Cursor';
import Wipe from './components/Wipe';
import PageIn from './components/PageIn';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import EventsPage from './pages/events/EventsPage';
import AboutPage from './pages/about/AboutPage';
import TeamPage from './pages/team/TeamPage';
import ContactPage from './pages/contact/ContactPage';
import dynamic from 'next/dynamic';

const RecruitmentPage = dynamic(() => import('./pages/recruitment/RecruitmentPage'), {
  ssr: false,
});
const MembershipPage = dynamic(() => import('./pages/membership/MembershipPage'), { ssr: false });
const AdminPage = dynamic(() => import('./pages/admin/AdminPage'), { ssr: false });
import RoadmapsPage from './pages/roadmaps/RoadmapsPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import CertificateVerifyPage from './pages/certificates/CertificateVerifyPage';
import CollabPage from './pages/collab/CollabPage';
import PortfolioBuilder from './components/portfolio/PortfolioBuilder';
import PublicPortfolio from './pages/portfolio/PublicPortfolio';
import DashboardPage from './pages/dashboard/DashboardPage';
import AnalyticsPage from './pages/analytics/AnalyticsPage';
} from "./shared/MotionLayer";
import ActivitiesPage from "./pages/activities/ActivitiesPage";
import EventsPage from "./pages/events/EventsPage";
import AboutPage from "./pages/about/AboutPage";
import TeamPage from "./pages/team/TeamPage";
import ContactPage from "./pages/contact/ContactPage";
import dynamic from "next/dynamic";
import apiClient from "./utils/apiClient.js";

const RecruitmentPage = dynamic(
  () => import("./pages/recruitment/RecruitmentPage"),
  { ssr: false }
);
const MembershipPage = dynamic(
  () => import("./pages/membership/MembershipPage"),
  { ssr: false }
);
const AdminPage = dynamic(() => import("./pages/admin/AdminPage"), {
  ssr: false,
});
import RoadmapsPage from "./pages/roadmaps/RoadmapsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CertificateVerifyPage from "./pages/certificates/CertificateVerifyPage";
import CollabPage from "./pages/collab/CollabPage";
import PortfolioBuilder from "./components/portfolio/PortfolioBuilder";
import PublicPortfolio from "./pages/portfolio/PublicPortfolio";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";

import "./styles/themes.css";
import "./styles/globals.css";
import "./styles/animations.css";
import "./styles/chatbot.css";
import "./styles/components.css";
import "./styles/portfolio.css";

import "./styles/aurora.css";
import "./styles/motion.css";
import WorkspacePage from "./pages/workspace/WorkspacePage";
import SearchBar from "./components/SearchBar";
import FloatingDock from "./components/common/FloatingDock";
import ParticleBackground from "./shared/ParticleBackground";
import GeometricGridBackground from "./shared/GeometricGridBackground";
import ScrollProgress from "./shared/ScrollProgress";
import Navbar from "./shared/Navbar";
import HeroSection from "./pages/home/HeroSection";
import ActivitiesSection from "./pages/activities/ActivitiesSection";
import EventsSection from "./pages/events/EventsSection";
import AboutSection from "./pages/about/AboutSection";
import TeamSection from "./pages/team/TeamSection";
import Footer from "./shared/Footer";
import ActivityDetailPage from "./pages/activities/ActivityDetailPage";
import EventDetailPage from "./pages/events/EventDetailPage";
import CinematicOpening from "./shared/CinematicOpening";
import Chatbot from "./shared/Chatbot";
import {
  AmbientOrbs,
  SectionDivider,
  PageFlash,
  BannerOrbs,
  useNsReveal,
  useHeroParallax,
  useNavScrollTint,
  useGlobalMouseParallax,
  useMagneticCards,
} from "./shared/MotionLayer";
import ActivitiesPage from "./pages/activities/ActivitiesPage";
import EventsPage from "./pages/events/EventsPage";
import AboutPage from "./pages/about/AboutPage";
import TeamPage from "./pages/team/TeamPage";
import ContactPage from "./pages/contact/ContactPage";
import dynamic from "next/dynamic";
import apiClient from "./utils/apiClient.js";

const RecruitmentPage = dynamic(
  () => import("./pages/recruitment/RecruitmentPage"),
  { ssr: false }
);
const MembershipPage = dynamic(
  () => import("./pages/membership/MembershipPage"),
  { ssr: false }
);
const AdminPage = dynamic(() => import("./pages/admin/AdminPage"), {
  ssr: false,
});
import RoadmapsPage from "./pages/roadmaps/RoadmapsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CertificateVerifyPage from "./pages/certificates/CertificateVerifyPage";
import CollabPage from "./pages/collab/CollabPage";
import PortfolioBuilder from "./components/portfolio/PortfolioBuilder";
import PublicPortfolio from "./pages/portfolio/PublicPortfolio";
import DashboardPage from "./pages/dashboard/DashboardPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";


const RecruitmentPage = dynamic(
  () => import("./pages/recruitment/RecruitmentPage"),
  { ssr: false }
);
const MembershipPage = dynamic(
  () => import("./pages/membership/MembershipPage"),
  { ssr: false }
);
const AdminPage = dynamic(() => import("./pages/admin/AdminPage"), {
  ssr: false,
});
import RoadmapsPage from "./pages/roadmaps/RoadmapsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CertificateVerifyPage from "./pages/certificates/CertificateVerifyPage";
import CollabPage from "./pages/collab/CollabPage";
import PortfolioBuilder from "./components/portfolio/PortfolioBuilder";
import PublicPortfolio from "./pages/portfolio/PublicPortfolio";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MentorshipDashboard from "./pages/mentorship/MentorshipDashboard";
import ReviewSession from "./pages/mentorship/ReviewSession";

import { activityPages } from "./data/activities/index";
import { events as fallbackEvents } from "./data/eventsData";
import nexasphereLogo from "./assets/images/logos/nexasphere-logo.png";

import { useInteractionEffects } from './hooks/useInteractionEffects';
import { useBackToTop, useActiveTabObserver } from './hooks/useScrollLogic';
import { useThemeManagement, useDynamicEvents } from './hooks/useDataHooks';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useAppActions } from './hooks/useAppActions';

import { NAV_HEIGHTS, SCROLL_TIMEOUT } from './data/config';

const NAV_TABS = [
  'Home',
  'Activities',
  'Events',
  'About',
  'Team',
  'Contact',
  'Dashboard',
  'Gamification',
];

export default function App() {
  const [cinDone, setCinDone] = useState(false);
import RoadmapsPage from './pages/roadmaps/RoadmapsPage';
import ProjectsPage from './pages/projects/ProjectsPage';
import CertificateVerifyPage from './pages/certificates/CertificateVerifyPage';
import CollabPage from './pages/collab/CollabPage';
import PortfolioBuilder from './components/portfolio/PortfolioBuilder';
import PublicPortfolio from './pages/portfolio/PublicPortfolio';
import DashboardPage from './pages/dashboard/DashboardPage';
import { activityPages } from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import nexasphereLogo from './assets/images/logos/nexasphere-logo.png';
import Terminal from './components/developer/Terminal';

import ActivitiesPage    from './pages/activities/ActivitiesPage';
import EventsPage        from './pages/events/EventsPage';
import AboutPage         from './pages/about/AboutPage';
import TeamPage          from './pages/team/TeamPage';
import ContactPage       from './pages/contact/ContactPage';
import RecruitmentPage   from './pages/recruitment/RecruitmentPage';
import MembershipPage    from './pages/membership/MembershipPage';
import AdminPage         from './pages/admin/AdminPage';
import RoadmapsPage      from './pages/roadmaps/RoadmapsPage';
import ProjectsPage      from './pages/projects/ProjectsPage';
import PortfolioBuilder  from './components/portfolio/PortfolioBuilder';
import PublicPortfolio   from './pages/portfolio/PublicPortfolio';
import { activityPages } from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import nexasphereLogo    from './assets/images/logos/nexasphere-logo.png';
import Terminal          from './components/developer/Terminal';
import RoadmapsPage        from './pages/roadmaps/RoadmapsPage';
import ProjectsPage        from './pages/projects/ProjectsPage';
import CollabPage          from './pages/collab/CollabPage';
import PortfolioBuilder    from './components/portfolio/PortfolioBuilder';
import PublicPortfolio     from './pages/portfolio/PublicPortfolio';
import DashboardPage       from './pages/dashboard/DashboardPage';

import { activityPages }   from './data/activities/index';

import { events as fallbackEvents } from './data/eventsData';
import nexasphereLogo               from './assets/images/logos/nexasphere-logo.png';

import Terminal            from './components/developer/Terminal';
import { useDeveloperMode } from './hooks/useDeveloperMode';
import { BookmarkProvider } from './context/BookmarkContext';
import BookmarksDrawer     from './components/bookmarks/BookmarksDrawer';


const MNH  = 88, DNH = 64;
const TABS = ['Home','Activities','Events','Projects','Roadmaps','Resume','About','Team','Contact'];

import BookmarksDrawer from './components/bookmarks/BookmarksDrawer';
import { useTheme } from './hooks/useTheme';
} from "./shared/MotionLayer";
import ActivitiesPage from "./pages/activities/ActivitiesPage";
import EventsPage from "./pages/events/EventsPage";
import AboutPage from "./pages/about/AboutPage";
import TeamPage from "./pages/team/TeamPage";
import ContactPage from "./pages/contact/ContactPage";
import dynamic from "next/dynamic";


const RecruitmentPage = dynamic(
  () => import("./pages/recruitment/RecruitmentPage"),
  { ssr: false }
);
const MembershipPage = dynamic(
  () => import("./pages/membership/MembershipPage"),
  { ssr: false }
);
const AdminPage = dynamic(() => import("./pages/admin/AdminPage"), {
  ssr: false,
});
import RoadmapsPage from "./pages/roadmaps/RoadmapsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CertificateVerifyPage from "./pages/certificates/CertificateVerifyPage";
import CollabPage from "./pages/collab/CollabPage";
import PortfolioBuilder from "./components/portfolio/PortfolioBuilder";
import PublicPortfolio from "./pages/portfolio/PublicPortfolio";
import DashboardPage from "./pages/dashboard/DashboardPage";
import MentorshipDashboard from "./pages/mentorship/MentorshipDashboard";
import ReviewSession from "./pages/mentorship/ReviewSession";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";

import { activityPages } from "./data/activities/index";
import { events as fallbackEvents } from "./data/eventsData";
import nexasphereLogo from "./assets/images/logos/nexasphere-logo.png";

import Terminal from "./components/developer/Terminal";
import { useDeveloperMode } from "./hooks/useDeveloperMode";

} from "./shared/MotionLayer";
import ActivitiesPage from "./pages/activities/ActivitiesPage";
import EventsPage from "./pages/events/EventsPage";
import AboutPage from "./pages/about/AboutPage";
import TeamPage from "./pages/team/TeamPage";
import ContactPage from "./pages/contact/ContactPage";
import dynamic from "next/dynamic";

const RecruitmentPage = dynamic(
  () => import("./pages/recruitment/RecruitmentPage"),
  { ssr: false }
);
const MembershipPage = dynamic(
  () => import("./pages/membership/MembershipPage"),
  { ssr: false }
);
const AdminPage = dynamic(() => import("./pages/admin/AdminPage"), {
  ssr: false,
});
import RoadmapsPage from "./pages/roadmaps/RoadmapsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CertificateVerifyPage from "./pages/certificates/CertificateVerifyPage";
import CollabPage from "./pages/collab/CollabPage";
import PortfolioBuilder from "./components/portfolio/PortfolioBuilder";
import PublicPortfolio from "./pages/portfolio/PublicPortfolio";
import DashboardPage from "./pages/dashboard/DashboardPage";

import { activityPages } from "./data/activities/index";
import { events as fallbackEvents } from "./data/eventsData";
import nexasphereLogo from "./assets/images/logos/nexasphere-logo.png";

import Terminal from "./components/developer/Terminal";
import { useDeveloperMode } from "./hooks/useDeveloperMode";

import Terminal from "./components/developer/Terminal";
import { useDeveloperMode } from "./hooks/useDeveloperMode";

import Terminal from "./components/developer/Terminal";
import { useDeveloperMode } from "./hooks/useDeveloperMode";

import { BookmarkProvider } from "./context/BookmarkContext";
import BookmarksDrawer from "./components/bookmarks/BookmarksDrawer";
import { useTheme } from "./hooks/useTheme";
import { useInteractionEffects } from "./hooks/useInteractionEffects";
import Terminal from "./components/developer/Terminal";
import { useDeveloperMode } from "./hooks/useDeveloperMode";

import BookmarksDrawer from "./components/bookmarks/BookmarksDrawer";
import { useTheme } from "./hooks/useTheme";
import { useInteractionEffects } from "./hooks/useInteractionEffects";
import { useBackToTop } from "./hooks/useScrollLogic";

import MoveToTop from "./shared/MoveToTop";
import { useInteractionEffects } from './hooks/useInteractionEffects';
import MoveToTop from './shared/MoveToTop';
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('./pages/membership/MembershipPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));
const MNH = 88,
  DNH = 64;
const TABS = [
  'Home',
  'Dashboard',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Portfolio',
  'Collab',
  'About',
  'Team',
  'Contact',
];

// ── Interview sub-page keys (mirrors the route paths) ──────────────────────
// dashboard  →  /interview
// quiz/:id   →  /interview/quiz/:sessionId
// code       →  /interview/code
// analytics  →  /interview/analytics
const TABS = ['Home','Activities','Events','Projects','Roadmaps','Resume','Portfolio','Collab','About','Team','Contact'];
const INTERVIEW_SUBPAGES = ['dashboard', 'quiz', 'code', 'analytics'];

const MNH = 88, DNH = 64;
const TABS = ['Home','Dashboard','Activities','Events','Projects','Roadmaps','Portfolio','Collab','About','Team','Contact'];
import { BookmarkProvider } from './context/BookmarkContext';
import BookmarksDrawer from './components/bookmarks/BookmarksDrawer';
import { useTheme } from './hooks/useTheme';
import { useInteractionEffects } from './hooks/useInteractionEffects';
import { useBackToTop } from './hooks/useScrollLogic';

import MoveToTop from './shared/MoveToTop';
import OfflineBanner from './components/pwa/OfflineBanner.jsx';
import InstallPrompt from './components/pwa/InstallPrompt.jsx';
import UpdatePrompt from './components/pwa/UpdatePrompt.jsx';
import MoveToTop from './shared/MoveToTop';
import OfflineBanner from './components/pwa/OfflineBanner.jsx';
import InstallPrompt from './components/pwa/InstallPrompt.jsx';
import UpdatePrompt from './components/pwa/UpdatePrompt.jsx';
import { useBackToTop } from "./hooks/useScrollLogic";
import NotFoundPage from "./pages/NotFoundPage";

import MoveToTop from "./shared/MoveToTop";

const MNH = 88,
  DNH = 64;
const TABS = [
  'Home',
  'Dashboard',
  'Analytics',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Portfolio',
  'Collab',
  'About',
  'Team',
  'Contact',
];

const MNH = 88,
  DNH = 64;
const TABS = [
  "Home",
  "Dashboard",
  "Analytics",
  DNH = 86;
const TABS = [
  "Home",
  "Dashboard",
  "Activities",
  "Events",
  "Projects",
  "Roadmaps",
  "Portfolio",
  "Collab",
  "About",
  "Team",
  "Contact",
];

const MNH = 88,
  DNH = 86;
const TABS = [
  'Home',
  'Dashboard',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Portfolio',
  'Collab',
  'About',
  'Team',
  'Contact',
import { Toaster } from "sonner";

const MNH = 88,
  DNH = 86;
const TABS = [
  "Home",
  "Dashboard",
  "Activities",
  "Events",
  "Projects",
  "Roadmaps",
  "Portfolio",
  "Collab",
  "About",
  "Team",
  "Contact",
];

const MNH = 88,
  DNH = 86;
const TABS = [
  'Home',
  'Dashboard',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Portfolio',
  'Collab',
  'About',
  'Team',
  'Contact',
];

import BookmarksDrawer   from './components/bookmarks/BookmarksDrawer';
// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { useInteractionEffects } from './hooks/useInteractionEffects';
import { useBackToTop, useActiveTabObserver } from './hooks/useScrollLogic';
const MNH = 88,
  DNH = 86;
const TABS = [
  "Home",
  "Dashboard",
  "Activities",
  "Events",
  "Projects",
  "Roadmaps",
  "Portfolio",
  "Collab",
  "About",
  "Team",
  "Contact",
];

import MoveToTop from './shared/MoveToTop';

const MNH = 88,
  DNH = 86;
const TABS = [
  'Home',
  'Dashboard',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Portfolio',
  'Collab',
  'About',
  'Team',
  'Contact',
];
const NAV_TABS = TABS;
const NAV_HEIGHTS = { MOBILE: MNH, DESKTOP: DNH };

import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";

import ProtectedRoute from "./components/ProtectedRoute";

function Home() {
  return <h1>Home Page</h1>;
/* ── Page wipe transition ── */
function Wipe({ on, ph }) {
  if (!on) return null;
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8000,
          background: 'var(--bg)',
          animation: `${ph === 'out' ? 'wipeDown .27s' : 'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'all',
          position: "fixed",
          inset: 0,
          zIndex: 8000,
          background: 'var(--bg)',
          animation: `${ph === 'out' ? 'wipeDown .27s' : 'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'all',
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8001,
          background: 'linear-gradient(90deg,#CC1111,#880000,#EE2222)',
          opacity: 0.09,
          animation: `${ph === 'out' ? 'wipeDown .20s .04s' : 'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'none',
        }}
      />
      {ph === 'out' && <div className="wipe-shimmer" aria-hidden="true" />}
      {ph === 'in' && <PageFlash />}
      {ph === 'out' && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 8002,
            pointerEvents: 'none',
            opacity: 0,
            animation: 'splashIn .16s .1s ease forwards',
          position: "fixed",
          inset: 0,
          zIndex: 8001,
          background: 'linear-gradient(90deg,#CC1111,#880000,#EE2222)',
          opacity: 0.09,
          animation: `${ph === 'out' ? 'wipeDown .20s .04s' : 'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'none',
        }}
      />
      {ph === 'out' && <div className="wipe-shimmer" aria-hidden="true" />}
      {ph === 'in' && <PageFlash />}
      {ph === 'out' && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 8002,
            pointerEvents: 'none',
            opacity: 0,
            animation: 'splashIn .16s .1s ease forwards',
          }}
        >
          <img
            loading="lazy"
            src={nexasphereLogo}
            style={{
              height: '46px',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 12px var(--c1))',
              height: "46px",
              mixBlendMode: "screen",
              filter: "drop-shadow(0 0 12px var(--c1))",
              opacity: 0.6,
            }}
            alt=""
          />
      <div style={{position:'fixed',inset:0,zIndex:8000,background:'var(--bg)',animation:`${ph==='out'?'wipeDown .27s':'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'all'}}/>
      <div style={{position:'fixed',inset:0,zIndex:8001,background:'linear-gradient(90deg,#CC1111,#880000,#EE2222)',opacity:.09,animation:`${ph==='out'?'wipeDown .20s .04s':'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'none'}}/>
      {ph==='out' && <div className="wipe-shimmer" aria-hidden="true"/>}
      {ph==='in'  && <PageFlash/>}
      {ph==='out' && (
        <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:8002,pointerEvents:'none',opacity:0,animation:'splashIn .16s .1s ease forwards'}}>
          <img src={nexasphereLogo} style={{height:'46px',mixBlendMode:'screen',filter:'drop-shadow(0 0 12px var(--c1))',opacity:.6}} alt=""/>
        </div>
      )}
    </>
  );
}

function AdminDashboard() {
  return <h1>Admin Dashboard</h1>;
}

function MentorDashboard() {
  return <h1>Mentor Dashboard</h1>;
}
import ResumeAnalyzer from "./pages/ResumeAnalyzer";

function App() {
  return <ResumeAnalyzer />;
}

/* ─────────────────────────────────────────
   PageIn — enter animation wrapper
───────────────────────────────────────── */
function PageIn({ children, k }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);

  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
    <div style={{
      opacity:   ready ? 1 : 0,
      transform: ready ? 'none' : 'translateY(16px) scale(.99)',
      transition: 'opacity .42s cubic-bezier(.22,1,.36,1), transform .42s cubic-bezier(.22,1,.36,1)',
      willChange: 'opacity, transform',
    }}>
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
    <div
      style={{
        opacity: r ? 1 : 0,
        transform: r ? 'none' : 'translateY(16px) scale(.99)',
        transition:
          'opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity,transform',
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useLayoutEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setR(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, [k]);
  return (
  const [r, setR] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setR(true));
    return () => cancelAnimationFrame(raf);
  }, [k]);
  return (
    <div
      style={{
        opacity: r ? 1 : 0,
        transform: r ? 'none' : 'translateY(16px) scale(.99)',
        transition:
          'opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity,transform',
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Cursor — anti-gravity orb
───────────────────────────────────────── */
function Cursor() {
  const orbRef   = useRef(null);
  const trailRef = useRef(null);
  const glowRef  = useRef(null);
  const stateRef = useRef({
    mx:0, my:0, ox:0, oy:0,
    floatY:0, floatPhase:0,

    hovering:false, clicking:false, raf:null,

    hovering:false,
    clicking:false,
    visible: true,
    raf:null

    mx: 0, my: 0,
    ox: 0, oy: 0,
    floatY: 0, floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    visible: true,
    raf: null,
    hovering:false, clicking:false,
    visible:true, raf:null,
  });

  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    document.body.style.cursor = 'none';

    const s = stateRef.current;
    const onMove = e => { s.mx = e.clientX; s.my = e.clientY; };
    const onDown = () => { s.clicking = true; };
    const onUp   = () => { s.clicking = false; };

    const onOver = e => { s.hovering = !!(e.target.closest('button,a,[role="button"],[tabindex]')); };
    const tick   = () => {
      s.ox += (s.mx - s.ox) * 1.00;
      s.oy += (s.my - s.oy) * 1.00;
      s.floatPhase += 0.022;
      s.floatY = Math.sin(s.floatPhase)*2 + Math.sin(s.floatPhase*1.7)*1 + Math.sin(s.floatPhase*0.5)*1;
      const fy     = s.oy + s.floatY;
      const scale  = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity= s.hovering ? 0.95 : 0.82;
      if (orbRef.current) {
        orbRef.current.style.left      = s.ox+'px';
        orbRef.current.style.top       = fy+'px';

    const onOver = e => {
      s.hovering = !!(e.target.closest('button,a,[role="button"],[tabindex]'));

    const onMove  = e => { s.mx = e.clientX; s.my = e.clientY; };
    const onDown  = ()  => { s.clicking = true; };
    const onUp    = ()  => { s.clicking = false; };
    const onOver  = e  => {
      s.hovering = !!e.target.closest('button,a,[role="button"],[tabindex]');
    };
    const onLeave = () => {
    const s = stateRef.current;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onDown = () => {
      s.clicking = true;
    };
    const onUp = () => {
      s.clicking = false;
    };
    const onOver = (e) => {
      s.hovering = !!e.target.closest('button,a,[role="button"],[tabindex]');
    };

    const onMouseLeave = () => {
      s.visible = false;
      [orbRef, trailRef, glowRef].forEach(r => {
        if (r.current) r.current.style.opacity = '0';
      });
    };
    const onEnter = () => {

    const onMouseEnter = () => {
      s.visible = true;
    };

    /* single tick — no duplicate */
    const tick = () => {
      s.ox += (s.mx - s.ox) * 1.0;
      s.oy += (s.my - s.oy) * 1.0;
      s.floatPhase += 0.022;
    const s = stateRef.current;
    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onDown = () => {
      s.clicking = true;
    };
    const onUp = () => {
      s.clicking = false;
    };
    const onOver = (e) => {
      s.hovering = !!e.target.closest('button,a,[role="button"],[tabindex]');
    };

    const onMouseLeave = () => {
      s.visible = false;
      if (orbRef.current) orbRef.current.style.display = "none";
      if (trailRef.current) trailRef.current.style.display = "none";
      if (glowRef.current) glowRef.current.style.display = "none";
    };

    const onMouseEnter = () => {
      s.visible = true;
      if (orbRef.current) orbRef.current.style.display = "block";
      if (trailRef.current) trailRef.current.style.display = "block";
      if (glowRef.current) glowRef.current.style.display = "block";
    };

    const tick = () => {
      s.ox += (s.mx - s.ox) * 1.0;
      s.oy += (s.my - s.oy) * 1.0;
      s.floatPhase += 0.022;
    if (window.matchMedia("(hover:none)").matches) return;
    document.body.style.cursor = "none";
    const s = stateRef.current;
    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onDown = () => {
      s.clicking = true;
    };
    const onUp = () => {
      s.clicking = false;
    };
    const onOver = (e) => {
      s.hovering = !!e.target.closest('button,a,[role="button"],[tabindex]');
    };
    const s = stateRef.current;

    const onMove      = e => { s.mx = e.clientX; s.my = e.clientY; };
    const onDown      = () => { s.clicking = true; };
    const onUp        = () => { s.clicking = false; };
    const onOver      = e => { s.hovering = !!(e.target.closest('button,a,[role="button"],[tabindex]')); };
    const onMouseLeave = () => {
      s.visible = false;
      if (orbRef.current)   orbRef.current.style.display   = 'none';
      if (trailRef.current) trailRef.current.style.display = 'none';
      if (glowRef.current)  glowRef.current.style.display  = 'none';
    };

    const onMouseEnter = () => {
      s.visible = true;
      if (orbRef.current)   orbRef.current.style.display   = 'block';
      if (trailRef.current) trailRef.current.style.display = 'block';
      if (glowRef.current)  glowRef.current.style.display  = 'block';
    };

    const tick = () => {
      s.ox += (s.mx - s.ox) * 1.0;
      s.oy += (s.my - s.oy) * 1.0;
      s.floatPhase += 0.022;
      s.floatY =
        Math.sin(s.floatPhase) * 2 +
        Math.sin(s.floatPhase * 1.7) * 1 +
        Math.sin(s.floatPhase * 0.5) * 1;
      const fy = s.oy + s.floatY;

      const scale = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.visible ? (s.hovering ? 0.95 : 0.82) : 0;

      if (orbRef.current) {
        orbRef.current.style.left = s.ox + 'px';
        orbRef.current.style.top = fy + 'px';

      s.ox += (s.mx - s.ox) * 1.0;
      s.oy += (s.my - s.oy) * 1.0;
      s.floatPhase += 0.022;
      s.floatY =
        Math.sin(s.floatPhase)       * 2 +
        Math.sin(s.floatPhase * 1.7) * 1 +
        Math.sin(s.floatPhase * 0.5) * 1;

      const fy      = s.oy + s.floatY;
      const scale   = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.visible ? (s.hovering ? 0.95 : 0.82) : 0;

      if (orbRef.current) {
        orbRef.current.style.left      = `${s.ox}px`;
        orbRef.current.style.top       = `${fy}px`;
        orbRef.current.style.left = s.ox + "px";
        orbRef.current.style.top = fy + "px";
      s.floatY = Math.sin(s.floatPhase) * 2
               + Math.sin(s.floatPhase * 1.7) * 1
               + Math.sin(s.floatPhase * 0.5) * 1;
      const fy      = s.oy + s.floatY;
      const scale   = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.visible ? (s.hovering ? 0.95 : 0.82) : 0;

      if (orbRef.current) {
        orbRef.current.style.left      = s.ox + 'px';
        orbRef.current.style.top       = fy + 'px';
        orbRef.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
        orbRef.current.style.opacity   = opacity;
      }
      if (trailRef.current) {

        trailRef.current.style.left    = s.ox+'px';
        trailRef.current.style.top     = s.oy+s.floatY*0.4+'px';
        trailRef.current.style.opacity = s.hovering ? 0 : 0.35;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx+'px';
        glowRef.current.style.top  = s.my+'px';
        trailRef.current.style.left    = s.ox + 'px';
        trailRef.current.style.top     = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
        trailRef.current.style.left = s.ox + "px";
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + "px";
        trailRef.current.style.opacity = s.visible
          ? s.hovering
            ? 0
            : 0.35
          : 0;
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top = s.my + 'px';
        glowRef.current.style.opacity = s.visible ? 1 : 0;
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top = s.my + 'px';
        glowRef.current.style.opacity = s.visible ? 1 : 0; 

        trailRef.current.style.left    = `${s.ox}px`;
        trailRef.current.style.top     = `${s.oy + s.floatY * 0.4}px`;
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
        glowRef.current.style.opacity = s.visible ? 1 : 0;
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top = s.my + 'px';
        trailRef.current.style.left = s.ox + "px";
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + "px";
        trailRef.current.style.opacity = s.visible
          ? s.hovering
            ? 0
            : 0.35
          : 0;
      }
      if (glowRef.current) {
        trailRef.current.style.left = s.ox + "px";
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + "px";
        trailRef.current.style.opacity = s.visible
          ? s.hovering
            ? 0
            : 0.35
          : 0;
      }
      if (glowRef.current) {
      }
      if (glowRef.current) {
      }
      if (glowRef.current) {
      }
      if (glowRef.current) {
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + "px";
        glowRef.current.style.top = s.my + "px";
        glowRef.current.style.opacity = s.visible ? 1 : 0;
      }
      if (glowRef.current) {
        glowRef.current.style.left    = `${s.mx}px`;
        glowRef.current.style.top     = `${s.my}px`;
        glowRef.current.style.opacity = s.visible ? 1 : 0;
      }

      s.raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive:true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);

    window.addEventListener('mouseover', onOver, { passive:true });

    window.addEventListener('mouseover', onOver,  { passive:true });
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);


    window.addEventListener('mousemove', onMove,  { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('mouseover', onOver,  { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onMouseLeave);
    document.documentElement.addEventListener("mouseenter", onMouseEnter);
    window.addEventListener('mouseover', onOver, { passive:true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    s.raf = requestAnimationFrame(tick);

    return () => {
      document.body.style.cursor = '';
      cancelAnimationFrame(s.raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onMouseLeave);
      document.documentElement.removeEventListener("mouseenter", onMouseEnter);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>

      <div ref={glowRef} style={{position:'fixed',pointerEvents:'none',zIndex:10000,width:'320px',height:'320px',borderRadius:'50%',background:'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',transform:'translate(-50%,-50%)',transition:'opacity .3s'}}/>
      <div ref={trailRef} style={{position:'fixed',pointerEvents:'none',zIndex:10002,width:'28px',height:'28px',borderRadius:'50%',background:'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',transform:'translate(-50%,-50%)',filter:'blur(6px)',transition:'opacity .25s'}}/>
      <div ref={orbRef} style={{position:'fixed',pointerEvents:'none',zIndex:100000,width:'18px',height:'18px',borderRadius:'50%',background:'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',boxShadow:'0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',transition:'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s'}}>
        <div style={{position:'absolute',top:'20%',left:'22%',width:'5px',height:'5px',borderRadius:'50%',background:'rgba(255,255,255,.9)',filter:'blur(1px)'}}/>
      <div ref={glowRef}  style={{position:'fixed',pointerEvents:'none',zIndex:10000,width:'320px',height:'320px',borderRadius:'50%',background:'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',transform:'translate(-50%,-50%)',transition:'opacity .3s'}}/>
      <div ref={trailRef} style={{position:'fixed',pointerEvents:'none',zIndex:10002,width:'28px',height:'28px',borderRadius:'50%',background:'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',transform:'translate(-50%,-50%)',filter:'blur(6px)',transition:'opacity .25s'}}/>
      <div ref={orbRef}   style={{position:'fixed',pointerEvents:'none',zIndex:100000,width:'18px',height:'18px',borderRadius:'50%',background:'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',boxShadow:'0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',transition:'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s'}}>

      <div ref={glowRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:10000,
        width:'320px', height:'320px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
        transform:'translate(-50%,-50%)',
        transition:'opacity .3s',
        willChange: 'transform, opacity',
      {/* Ambient glow */}
      <div ref={glowRef} style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 10000,
        width: '320px', height: '320px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
        transform: 'translate(-50%,-50%)',
        transition: 'opacity .3s',
      }}/>
      {/* Trail */}
      <div ref={trailRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:10002,
        width:'28px', height:'28px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
        transform:'translate(-50%,-50%)',
        filter:'blur(6px)',
        transition:'opacity .25s',
        willChange: 'transform, opacity',
        position: 'fixed', pointerEvents: 'none', zIndex: 10002,
        width: '28px', height: '28px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
        transform: 'translate(-50%,-50%)',
        filter: 'blur(6px)',
        transition: 'opacity .25s',
      }}/>
      {/* Orb */}
      <div ref={orbRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:100000,
        width:'18px', height:'18px', borderRadius:'50%',
        background:'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
        boxShadow:'0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
        transition:'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
        willChange: 'transform, opacity',
        position: 'fixed', pointerEvents: 'none', zIndex: 100000,
        width: '18px', height: '18px', borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
        boxShadow: '0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
        transition: 'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '22%',
          width: '5px', height: '5px', borderRadius: '50%',
          background: 'rgba(255,255,255,.9)',
          filter: 'blur(1px)',
        }}/>

      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10000,
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          transition: 'opacity .3s',
          willChange: 'transform, opacity',
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10000,
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          transition: 'opacity .3s',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={trailRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10002,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          filter: 'blur(6px)',
          transition: 'opacity .25s',
          willChange: 'transform, opacity',
          position: "fixed",
          pointerEvents: "none",
          zIndex: 10002,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          filter: 'blur(6px)',
          transition: 'opacity .25s',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={orbRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 100000,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
          boxShadow:
            '0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
          transition: 'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
          willChange: 'transform, opacity',
          position: "fixed",
          pointerEvents: "none",
          zIndex: 100000,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
          boxShadow:
            '0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
          transition: 'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '22%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            filter: 'blur(1px)',
            position: "absolute",
            top: "20%",
            left: "22%",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            background: "rgba(255,255,255,.9)",
            filter: "blur(1px)",
          }}
        />
      </div>
    </>
  );
}

export default function App() {
  const [cinDone,      setCinDone]      = useState(false);
  const [activeTab,    setActiveTab]    = useState('Home');
  const [mobile,       setMobile]       = useState(window.innerWidth <= 768);
  const [wipeOn,       setWipeOn]       = useState(false);
  const [wipePh,       setWipePh]       = useState('out');
  const [page,         setPage]         = useState(null);
  const [theme,        setTheme]        = useState(() => localStorage.getItem('ns-theme') || localStorage.getItem('nexasphere-theme') || 'dark');
  const [eventsData,   setEventsData]   = useState(fallbackEvents);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [bookmarksOpen,setBookmarksOpen]= useState(false);
  /* ── Certificate verify route detection ── */
  const verifyCertId = (() => {
    const path = window.location.pathname;
    const m = path.match(/^\/verify\/([A-Za-z0-9_%-]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  })();

  if (verifyCertId) {
    return (
      <CertificateVerifyPage
        certificateId={verifyCertId}
        onGoHome={() => {
          window.history.pushState({}, '', '/');
          window.history.pushState({}, "", "/");
          window.location.reload();
        }}
      />
    );
  }

  return <MainApp />;
}

/* ── Main app — all hooks live here, always called unconditionally ── */
function MainApp() {
  const [cinDone, setCinDone] = useState(false);
  const [activeTab, setActiveTab] = useState("Home");
  
  // Use lazy initialization for state derived from the URL
  const [activeTab, setActiveTab] = useState(() => urlToState(window.location.pathname).activeTab);
  const [page, setPage] = useState(() => urlToState(window.location.pathname).page);
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  const [wipeOn, setWipeOn] = useState(false);
  const [wipePh, setWipePh] = useState('out');
  const [cinDone, setCinDone] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  const [wipeOn, setWipeOn] = useState(false);
  const [wipePh, setWipePh] = useState('out');
  const [page, setPage] = useState(null);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [searchOpen, setSearchOpen] = useState(false); // ← Search state
  const [wipePh, setWipePh] = useState("out");
  const [page, setPage] = useState(null);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [wipePh, setWipePh] = useState("out");
  const [page, setPage] = useState(null);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [wipePh, setWipePh] = useState("out");
  const [page, setPage] = useState(null);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [eventsData, setEventsData] = useState(() => getLocalEvents(fallbackEvents));
  const [searchOpen, setSearchOpen] = useState(false); // 🔍 Search state
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const { resolvedTheme: theme, setTheme } = useTheme();
  const { isOpen: isTerminalOpen, closeTerminal } = useDeveloperMode();

  // Use lazy initialization for state derived from the URL
  const [activeTab, setActiveTab] = useState(() => urlToState(window.location.pathname).activeTab);
  const [page, setPage] = useState(() => urlToState(window.location.pathname).page);
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('nexa-fontsize') || 'normal');
  const [cinDone,       setCinDone]       = useState(false);
  const [activeTab,     setActiveTab]     = useState('Home');
  const [mobile,        setMobile]        = useState(window.innerWidth <= 768);
  const [wipeOn,        setWipeOn]        = useState(false);
  const [wipePh,        setWipePh]        = useState('out');
  const [page,          setPage]          = useState(null);
  const [theme,         setTheme]         = useState(() => localStorage.getItem('ns-theme') || localStorage.getItem('nexasphere-theme') || 'dark');
  const [eventsData,    setEventsData]    = useState(fallbackEvents);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const { isOpen: isTerminalOpen, closeTerminal } = useDeveloperMode();

  const { theme, toggleTheme } = useThemeManagement();
  const eventsData = useDynamicEvents(fallbackEvents);
  const { wipeOn, wipePh, handleTabChange, performTransition } = useAppNavigation(
    setPage,
    setActiveTab,
    mobile
  );
  const actions = useAppActions(performTransition, setPage, setActiveTab, mobile);
  useEffect(() => {
    const path  = window.location.pathname;
    const match = path.match(/^\/p\/([a-zA-Z0-9_-]+)/);
    if (match) setPage({ type:'portfolio', username: match[1] });
  }, []);

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-fontsize', fontSize);
    localStorage.setItem('nexa-fontsize', fontSize);
  }, [fontSize]);
  // Sync state changes to browser history
  useEffect(() => {
    const url = stateToUrl(page);
    if (window.location.pathname !== url) {
      window.history.pushState(null, '', url);
    }
  }, [page]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const { page: newPage, activeTab: newTab } = urlToState(window.location.pathname);
      performTransition(() => {
        setPage(newPage);
        setActiveTab(newTab);
    if (cinDone) {
      const initPush = async () => {
        try {
          const { initializePushNotifications } = await import('./utils/pushNotificationClient');
          const vapidKey =
            import.meta.env.VITE_VAPID_PUBLIC_KEY ||
            'BFG7-T9CszX7v2Xg707l3qTNY2p5N1N4iO3J8t5vJv5O7g7i5r5v5i5v5o5r5i5v5r5e5s5w5s';
          const { initializePushNotifications } =
            await import("./utils/pushNotificationClient");
          const vapidKey =
            import.meta.env.VITE_VAPID_PUBLIC_KEY ||
            "BFG7-T9CszX7v2Xg707l3qTNY2p5N1N4iO3J8t5vJv5O7g7i5r5v5i5v5o5r5i5v5r5e5s5w5s";
          await initializePushNotifications(vapidKey);
        } catch (err) {
          console.warn(
            "Push notification initialization skipped or failed gracefully:",
            err
          );
        }
      };
      const timer = setTimeout(initPush, 3500);
      return () => clearTimeout(timer);
    }
  }, [cinDone]);
/* ─────────────────────────────────────────
   NotFoundPage
───────────────────────────────────────── */
function NotFoundPage({ onGoHome }) {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '40px 24px',
    }}>
      <div style={{
        fontFamily: "'Orbitron',monospace",
        fontSize: 'clamp(5rem,18vw,10rem)',
        fontWeight: 900,
        background: 'linear-gradient(135deg,#CC1111 0%,#EE2222 50%,#FF4444 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        backgroundClip: 'text', lineHeight: 1, marginBottom: '16px',
      }}>404</div>
      <h2 style={{
        fontFamily: "'Orbitron',monospace",
        fontSize: 'clamp(1rem,3vw,1.5rem)',
        fontWeight: 700, color: 'var(--t1)', marginBottom: '12px',
      }}>Page Not Found</h2>
      <p style={{
        color: 'var(--t2)', fontSize: '1rem',
        maxWidth: '380px', lineHeight: 1.7, marginBottom: '32px',
      }}>
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <button className="btn btn-primary" onClick={onGoHome} style={{ cursor: 'pointer' }}>
        ← Go Home
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   App — root component
───────────────────────────────────────── */
export default function App() {
  const [cinDone,      setCinDone]      = useState(false);
  const [activeTab,    setActiveTab]    = useState('Home');
  const [mobile,       setMobile]       = useState(window.innerWidth <= 768);
  const [wipeOn,       setWipeOn]       = useState(false);
  const [wipePh,       setWipePh]       = useState('out');
  const [page,         setPage]         = useState(null);
  const [eventsData,   setEventsData]   = useState(fallbackEvents);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [bookmarksOpen,setBookmarksOpen]= useState(false);

  /* ── Theme: persisted to localStorage ── */
  const [theme, setTheme] = useState(
    () => localStorage.getItem('ns-theme') || localStorage.getItem('nexasphere-theme') || 'dark'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nexasphere-theme', theme);
  }, [theme]);

  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/p\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const name = match[1];
      setPage({ type: "portfolio", username: name });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);
  useEffect(() => {
    if (cinDone) {
      const initPush = async () => {
        try {
          const { initializePushNotifications } = await import('./utils/pushNotificationClient');
          const vapidKey =
            import.meta.env.VITE_VAPID_PUBLIC_KEY ||
            'BFG7-T9CszX7v2Xg707l3qTNY2p5N1N4iO3J8t5vJv5O7g7i5r5v5i5v5o5r5i5v5r5e5s5w5s';
          const { initializePushNotifications } =
            await import("./utils/pushNotificationClient");
          const vapidKey =
            import.meta.env.VITE_VAPID_PUBLIC_KEY ||
            'BFG7-T9CszX7v2Xg707l3qTNY2p5N1N4iO3J8t5vJv5O7g7i5r5v5i5v5o5r5i5v5r5e5s5w5s';
          await initializePushNotifications(vapidKey);
        } catch (err) {
          console.warn('Push notification initialization skipped or failed gracefully:', err);
        }
      };
      const timer = setTimeout(initPush, 3500);
      return () => clearTimeout(timer);
    }
    if (!cinDone) return;
    const initPush = async () => {
      try {
        const { initializePushNotifications } = await import('./utils/pushNotificationClient');
        const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || 'BFG7-T9CszX7v2Xg707l3qTNY2p5N1N4iO3J8t5vJv5O7g7i5r5v5i5v5o5r5i5v5r5e5s5w5s';
        await initializePushNotifications(vapidKey);
      } catch (err) {
        console.warn('Push notification initialization skipped or failed gracefully:', err);
      }
    };
    const timer = setTimeout(initPush, 3500);
    return () => clearTimeout(timer);
  }, [cinDone]);

  /* ── Developer mode ── */
  const { isOpen: isTerminalOpen, closeTerminal } = useDeveloperMode();

  /* ── Portfolio deep-link ── */
  useEffect(() => {
    const match = window.location.pathname.match(/^\/p\/([a-zA-Z0-9_-]+)/);
    if (match) setPage({ type: 'portfolio', username: match[1] });
  }, []);

  /* ── Fetch events ── */
  useEffect(() => {
    let alive = true;
    const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
    const url = base ? `${base}/api/content/events` : '/api/content/events';
    const base = (import.meta?.env?.VITE_API_BASE || "").replace(/\/+$/, "");
    const url = base ? `${base}/api/content/events` : "/api/content/events";
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (alive && Array.isArray(data?.events) && data.events.length > 0)
    const base = (import.meta?.env?.VITE_API_BASE || "").replace(/\/+$/, "");
    const url = base ? `${base}/api/content/events` : "/api/content/events";
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
    const base = (import.meta?.env?.VITE_API_BASE || "").replace(/\/+$/, "");
    const url = base ? `${base}/api/content/events` : "/api/content/events";
    apiClient(url)
      .then((data) => {
        if (!alive) return;
        if (data && Array.isArray(data.events)) {
          setEventsData(data.events);
        } else if (Array.isArray(data)) {
          setEventsData(data);
        } else {
          console.warn("Malformed API response for events:", data);
          setEventsData([]);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
      .catch((err) => {
        if (!alive) return;
        console.error("Failed to fetch events:", err);
        setEventsData([]);
      });
    const applyLocalEvents = () => {
      if (alive) setEventsData(getLocalEvents(fallbackEvents));
    };

    if (!base) {
      applyLocalEvents();
      return subscribePublicContent(applyLocalEvents);
    }

    const url = `${base}/api/content/events`;

    const fetchEvents = () => {
      apiClient(url)
        .then((data) => {
          if (!alive) return;
          if (data && Array.isArray(data.events)) {
            setEventsData(
              data.events.length
                ? mergeEvents(fallbackEvents, data.events)
                : getLocalEvents(fallbackEvents)
            );
          } else if (Array.isArray(data)) {
            setEventsData(
              data.length ? mergeEvents(fallbackEvents, data) : getLocalEvents(fallbackEvents)
            );
          } else {
            console.warn('Malformed API response for events:', data);
            setEventsData(getLocalEvents(fallbackEvents));
          }
        })
        .catch((err) => {
          if (!alive) return;
          console.error('Failed to fetch events:', err);
          setEventsData((prev) => (prev?.length ? prev : getLocalEvents(fallbackEvents)));
        });
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 4000);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    const handleScroll = () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    };

    const handleBackToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    btn.addEventListener('click', handleBackToTop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      btn.removeEventListener('click', handleBackToTop);
    };
  }, [cinDone]);
  /* ── Back-to-top button ── */
  useEffect(() => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const onScroll = () => btn.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Active tab by scroll ── */
  useEffect(() => {
    if (page) return;
    const nh = mobile ? MNH : DNH;
    const onScroll = () => {
      const sy = window.scrollY + nh + 30;
      for (let i = TABS.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${TABS[i].toLowerCase()}`);
        if (el && el.offsetTop <= sy) {
          setActiveTab(TABS[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobile, page]);

  /* ── Responsive ── */
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [mobile, page]);

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(()=>{
  /* ── Ctrl+K search shortcut ── */
  useEffect(() => {
    const fn = e => {
  /* ── Ctrl+K / Cmd+K opens search ── */
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [mobile, page]);
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  /* ── Ctrl+K / Cmd+K opens search ── */
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  /* ── Ctrl+K / Cmd+K opens search ── */
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((s) => !s);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  /* ── Scroll/intersection animations ── */
  useEffect(() => {
    if (!cinDone) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || e.target.classList.contains('fired')) return;
        e.target.classList.add('fired');
        e.target.addEventListener('animationend', () => {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'none';
        }, { once: true });
        obs.unobserve(e.target);
      });
    }, { threshold: 0.09, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll(
      '.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num'
    ).forEach(el => obs.observe(el));

    const onMove = e => {
      /* magnetic buttons */
      document.querySelectorAll('.mag-btn').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        const dx   = e.clientX - (rect.left + rect.width  / 2);
        const dy   = e.clientY - (rect.top  + rect.height / 2);
        const d    = Math.sqrt(dx * dx + dy * dy);
        btn.style.transform = d < 88
          ? `translate(${dx * (88 - d) / 88 * 0.32}px,${dy * (88 - d) / 88 * 0.32}px)`
          : '';
      });

      /* tilt cards */
      document.querySelectorAll('.activity-card').forEach(card => {
        const rect    = card.getBoundingClientRect();
        const cx      = rect.left + rect.width  / 2;
        const cy      = rect.top  + rect.height / 2;
        const dx      = e.clientX - cx;
        const dy      = e.clientY - cy;
        const dist    = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(rect.width, rect.height) * 0.9;
        const intensity = dist < maxDist ? (1 - dist / maxDist) * 6 : 0;
        card.style.setProperty('--rx',  intensity ? (dx / rect.width  * intensity).toFixed(2) : '0');
        card.style.setProperty('--ry', intensity ? (-dy / rect.height * intensity).toFixed(2) : '0');
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [performTransition]);
  const toggleFontSize = () => {
    setFontSize((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'extra-large';
      return 'normal';
    });
  };

  useInteractionEffects(cinDone, page);
  useBackToTop();
  useActiveTabObserver(page, mobile, NAV_TABS, NAV_HEIGHTS, setActiveTab);

    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { obs.disconnect(); window.removeEventListener('mousemove', onMove); };
  }, [cinDone, page]);
  useEffect(() => {
    if (!cinDone) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            e.target.addEventListener(
              'animationend',
              () => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'none';
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains("fired")) {
            e.target.classList.add("fired");
            e.target.addEventListener(
              "animationend",
              () => {
                e.target.style.opacity = "1";
                e.target.style.transform = "none";
              },
              { once: true }
            );
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.09, rootMargin: '0px 0px -36px 0px' }
    );
    document
      .querySelectorAll('.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num')
      .forEach((el) => obs.observe(el));

    const btns = document.querySelectorAll('.mag-btn');
      { threshold: 0.09, rootMargin: "0px 0px -36px 0px" }
    );
    document
      .querySelectorAll(
        ".pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num"
      )
      .forEach((el) => obs.observe(el));

      { threshold: 0.09, rootMargin: "0px 0px -36px 0px" }
    );
    document
      .querySelectorAll(
        ".pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num"
      )
      .forEach((el) => obs.observe(el));

      { threshold: 0.09, rootMargin: "0px 0px -36px 0px" }
    );
    document
      .querySelectorAll(
        ".pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num"
      )
      .forEach((el) => obs.observe(el));

      { threshold: 0.09, rootMargin: "0px 0px -36px 0px" }
    );
    document
      .querySelectorAll(
        ".pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num"
      )
      .forEach((el) => obs.observe(el));

      { threshold: 0.09, rootMargin: "0px 0px -36px 0px" }
    );
    document
      .querySelectorAll(
        ".pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num"
      )
      .forEach((el) => obs.observe(el));

    const btns = document.querySelectorAll(".mag-btn");
    const onMove = (e) => {
      btns.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const d = Math.sqrt(dx * dx + dy * dy);
        btn.style.transform =
          d < 88
            ? `translate(${((dx * (88 - d)) / 88) * 0.32}px,${((dy * (88 - d)) / 88) * 0.32}px)`
            : '';
      });
  useEffect(() => {
    if (!cinDone) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            e.target.addEventListener(
              'animationend',
              () => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'none';
              },
              { once: true }
            );
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.09, rootMargin: '0px 0px -36px 0px' }
    );
    document
      .querySelectorAll('.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num')
      .forEach((el) => obs.observe(el));

    const btns = document.querySelectorAll('.mag-btn');
    const onMove = (e) => {
      btns.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const d = Math.sqrt(dx * dx + dy * dy);
        btn.style.transform =
          d < 88
            ? `translate(${((dx * (88 - d)) / 88) * 0.32}px,${((dy * (88 - d)) / 88) * 0.32}px)`
            : '';
      });
      document.querySelectorAll('.activity-card').forEach((card) => {
  useEffect(() => {
    if (!cinDone) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains('fired')) {
            e.target.classList.add('fired');
            e.target.addEventListener(
              'animationend',
              () => {
                e.target.style.opacity = '1';
                e.target.style.transform = 'none';
              },
              { once: true }
            );
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.09, rootMargin: '0px 0px -36px 0px' }
    );
    document
      .querySelectorAll('.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num')
      .forEach((el) => obs.observe(el));

    const btns = document.querySelectorAll('.mag-btn');
    const onMove = (e) => {
      btns.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const d = Math.sqrt(dx * dx + dy * dy);
        btn.style.transform =
          d < 88
            ? `translate(${((dx * (88 - d)) / 88) * 0.32}px,${((dy * (88 - d)) / 88) * 0.32}px)`
            : '';
      });
      document.querySelectorAll(".activity-card").forEach((card) => {
      document.querySelectorAll('.activity-card').forEach((card) => {
  useEffect(() => {
    if (!cinDone) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !e.target.classList.contains("fired")) {
            e.target.classList.add("fired");
            e.target.addEventListener(
              "animationend",
              () => {
                e.target.style.opacity = "1";
                e.target.style.transform = "none";
              },
              { once: true }
            );
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.09, rootMargin: "0px 0px -36px 0px" }
    );
    document
      .querySelectorAll(
        ".pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num"
      )
      .forEach((el) => obs.observe(el));

    const btns = document.querySelectorAll(".mag-btn");
    const onMove = (e) => {
      btns.forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const d = Math.sqrt(dx * dx + dy * dy);
        btn.style.transform =
          d < 88
            ? `translate(${((dx * (88 - d)) / 88) * 0.32}px,${((dy * (88 - d)) / 88) * 0.32}px)`
            : "";
      });
            : "";
      });
            : "";
      });
            : "";
      });
            : "";
      });
            : "";
      });
      document.querySelectorAll(".activity-card").forEach((card) => {
      document.querySelectorAll('.activity-card').forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(rect.width, rect.height) * 0.9;
        const rect     = card.getBoundingClientRect();
        const cx       = rect.left + rect.width  / 2;
        const cy       = rect.top  + rect.height / 2;
        const dx       = e.clientX - cx;
        const dy       = e.clientY - cy;
        const dist     = Math.sqrt(dx*dx + dy*dy);
        const maxDist  = Math.max(rect.width, rect.height) * 0.9;
        if (dist < maxDist) {
          const intensity = (1 - dist / maxDist) * 6;
          card.style.setProperty('--rx', ((dx / rect.width) * intensity).toFixed(2));
          card.style.setProperty('--ry', ((-dy / rect.height) * intensity).toFixed(2));
          card.style.setProperty(
            "--rx",
            ((dx / rect.width) * intensity).toFixed(2)
          );
          card.style.setProperty(
            "--ry",
            ((-dy / rect.height) * intensity).toFixed(2)
          );
        } else {
          card.style.setProperty('--rx', '0');
          card.style.setProperty('--ry', '0');
        }
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener('mousemove', onMove);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener('mousemove', onMove);
    };
  }, [cinDone, page]);

  useInteractionEffects(cinDone, page);
  useBackToTop();
  useActiveTabObserver(page, mobile, NAV_TABS, NAV_HEIGHTS, setActiveTab);

  useEffect(() => {
    if (window.location.pathname.startsWith('/workspace/')) {
      const roomId = window.location.pathname.split('/workspace/')[1];
      if (roomId) {
        setCinDone(true);
        setPage({ type: 'workspace', roomId });
      }
    } else if (window.location.pathname.startsWith("/mentorship/review/")) {
      const roomId = window.location.pathname.split("/mentorship/review/")[1];
      if (roomId) {
        setCinDone(true);
        setPage({ type: "review_session", roomId });
      }
    } else if (window.location.pathname === "/mentorship") {
      setCinDone(true);
      setPage({ type: "mentorship" });
    }
  }, []);

  useNsReveal([cinDone, page]);
  useHeroParallax();
  useNavScrollTint();
  useGlobalMouseParallax();
  useMagneticCards();

  const navHeight = mobile ? NAV_HEIGHTS.MOBILE : NAV_HEIGHTS.DESKTOP;
  const currentActivity = page?.activityKey ? activityPages[page.activityKey] : null;

  return (
    <>
      <Chatbot />
      {!cinDone && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            background: theme === 'light' ? '#FFFFFF' : '#0A0A0A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
  const nav = useCallback((fn) => {
    setWipeOn(true); setWipePh('out');
  /* ── Navigation helper ── */
  const nav = useCallback(fn => {
    setWipeOn(true);
    setWipePh('out');
    setWipeOn(true);
    setWipePh("out");
    setWipeOn(true);
    setWipePh('out');
    setWipeOn(true);
    setWipePh('out');
    setTimeout(() => {
      fn();
      window.scrollTo({ top: 0 });
      requestAnimationFrame(() => {
        setWipePh('in');
        setTimeout(() => setWipeOn(false), 340);
      });
    }, 275);
  }, []);

  const openInterview = useCallback((subpage = 'dashboard', sessionId = null) => {
    nav(() => setPage({ type:'interview', subpage, sessionId }));
  }, [nav]);

  const onBackFromInterview = useCallback(() => {
    nav(() => setPage({ type:'interview', subpage:'dashboard', sessionId:null }));
  }, [nav]);

  const onTab = useCallback(tab => {


    if (['Activities','Events','Projects','Roadmaps','Resume','About','Team','Contact'].includes(tab)) {

    if (['Activities','Events','Projects','Roadmaps','Portfolio','Collab','About','Team','Contact'].includes(tab)) {

    if (['Activities','Events','Projects','Roadmaps','Resume','Portfolio','Collab','About','Team','Contact'].includes(tab)) {

    if (['Dashboard','Activities','Events','Projects','Roadmaps','Portfolio','Collab','About','Team','Contact'].includes(tab)) {

      nav(() => { setPage({ type:'section', section:tab }); setActiveTab(tab); });
  /* ── Tab handler ── */
  const onTab = useCallback(tab => {
    if (SECTION_TABS.includes(tab)) {
      nav(() => { setPage({ type: 'section', section: tab }); setActiveTab(tab); });
      return;
    }
    nav(() => {
      setPage(null);
      setActiveTab(tab);
      setTimeout(() => {
        const el = document.getElementById(`section-${tab.toLowerCase()}`);
        if (!el) return;
        window.scrollTo({ top: el.offsetTop - (mobile ? MNH : DNH), behavior: 'smooth' });
      }, 50);
    });
  }, [nav, mobile]);

  /* ── Navigation callbacks ── */
  const onNavigate = useCallback((type, title) => {
    if (type === 'activity') nav(() => setPage({ type: 'activity', activityKey: title }));
  }, [nav]);
  const onTab = useCallback(
    (tab) => {
      if (
        [
          'Dashboard',
          'Analytics',
          'Activities',
          'Events',
          'Projects',
          'Roadmaps',
          'Portfolio',
          'Collab',
          'About',
          'Team',
          'Contact',
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: 'section', section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({ top: el.offsetTop - (mobile ? MNH : DNH), behavior: 'smooth' });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(() => setPage({ type: 'activity', activityKey: title }));
  const onTab = useCallback(
    (tab) => {
      if (
        [
          'Dashboard',
          'Analytics',
          'Activities',
          'Events',
          'Projects',
          'Roadmaps',
          'Portfolio',
          'Collab',
          'About',
          'Team',
          'Contact',
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: 'section', section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({ top: el.offsetTop - (mobile ? MNH : DNH), behavior: 'smooth' });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(() => setPage({ type: 'activity', activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: 'event', event: ev })));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: 'event', event: ev })));
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(() => setPage({ type: 'event', activityKey: 'Insight Session', event: ev }));
  const onTab = useCallback(
    (tab) => {
      if (
        [
          "Dashboard",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
          'Dashboard',
          'Analytics',
          'Projects',
          'Roadmaps',
          'Portfolio',
          'Collab',
          'About',
          'Team',
          'Contact',
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: 'section', section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: 'smooth',
          });
        }, 50);
      });
        } else if (tab === 'Home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        // Transition back to main page, then scroll
        nav(() => {
          setPage(null);
          setActiveTab(tab);
          setTimeout(() => {
            const el = document.getElementById(`section-${tab.toLowerCase()}`);
            if (el) {
              window.scrollTo({
                top: el.offsetTop - (mobile ? MNH : DNH),
                behavior: 'smooth',
              });
            } else if (tab === 'Home') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }, 50);
        });
      }
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === "activity")
        nav(() => setPage({ type: "activity", activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: "event", event: ev })));
    },
    [nav]
  );

  const onTab = useCallback(
    (tab) => {
      if (
        [
          "Dashboard",
          "Analytics",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: "section", section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: "smooth",
          });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === "activity")
        nav(() => setPage({ type: "activity", activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: "event", event: ev })));
    },
    [nav]
  );

  const onTab = useCallback(
    (tab) => {
      if (
        [
          "Dashboard",
          "Analytics",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: "section", section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: "smooth",
          });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === "activity")
        nav(() => setPage({ type: "activity", activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: "event", event: ev })));
    },
    [nav]
  );

  const onTab = useCallback(
    (tab) => {
      if (
        [
          "Dashboard",
          "Analytics",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: "section", section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: "smooth",
          });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === "activity")
        nav(() => setPage({ type: "activity", activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: "event", event: ev })));
    },
    [nav]
  );

  const onTab = useCallback(
    (tab) => {
      if (
        [
          "Dashboard",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: "section", section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: "smooth",
          });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === "activity")
        nav(() => setPage({ type: "activity", activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: "event", event: ev })));
    },
    [nav]
  );

  const onTab = useCallback(
    (tab) => {
      if (tab === "Mentorship") {
        nav(() => {
          window.history.pushState({}, "", "/mentorship");
          setPage({ type: "mentorship" });
          setActiveTab(tab);
        });
        return;
      }
      if (
        [
          "Dashboard",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: "section", section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: "smooth",
          });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === "activity")
        nav(() => setPage({ type: "activity", activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: "event", event: ev })));
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(() =>
        setPage({ type: "event", activityKey: "Insight Session", event: ev })
      );
    },
    [nav]
  );

  const onBackAct = useCallback(() => {
    nav(() => setPage(p => ({ type: 'activity', activityKey: p.activityKey })));
  const onTab = useCallback(
    (tab) => {
      if (
        [
          'Dashboard',
          'Activities',
          'Events',
          'Projects',
          'Roadmaps',
          'Portfolio',
          'Collab',
          'About',
          'Team',
          'Contact',
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: 'section', section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({ top: el.offsetTop - (mobile ? MNH : DNH), behavior: 'smooth' });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(() => setPage({ type: 'activity', activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: 'event', event: ev })));
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(() => setPage({ type: 'event', activityKey: 'Insight Session', event: ev }));
    },
    [nav]
  );

  const onBackAct = useCallback(() => {
  const onTab = useCallback(
    (tab) => {
      if (
        [
          'Dashboard',
          'Activities',
          'Events',
          'Projects',
          'Roadmaps',
          'Portfolio',
          'Collab',
          'About',
          'Team',
          'Contact',
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: 'section', section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({ top: el.offsetTop - (mobile ? MNH : DNH), behavior: 'smooth' });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(() => setPage({ type: 'activity', activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: 'event', event: ev })));
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(() => setPage({ type: 'event', activityKey: 'Insight Session', event: ev }));
    },
    [nav]
  );

  const onBackAct = useCallback(() => {
    nav(() => setPage((p) => ({ type: 'activity', activityKey: p.activityKey })));
  const onTab = useCallback(
    (tab) => {
      if (tab === "Mentorship") {
        nav(() => {
          window.history.pushState({}, "", "/mentorship");
          setPage({ type: "mentorship" });
          setActiveTab(tab);
        });
        return;
      }
      if (
        [
          "Dashboard",
          "Activities",
          "Events",
          "Projects",
          "Roadmaps",
          "Portfolio",
          "Collab",
          "About",
          "Team",
          "Contact",
        ].includes(tab)
      ) {
        nav(() => {
          setPage({ type: "section", section: tab });
          setActiveTab(tab);
        });
        return;
      }
      nav(() => {
        setPage(null);
        setActiveTab(tab);
        setTimeout(() => {
          const el = document.getElementById(`section-${tab.toLowerCase()}`);
          if (!el) return;
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: "smooth",
          });
        }, 50);
      });
    },
    [nav, mobile]
  );

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(() => setPage({ type: 'activity', activityKey: title }));
    },
    [nav]
  );

  const onEvent = useCallback(
    (ev) => {
      nav(() => setPage((p) => ({ ...p, type: 'event', event: ev })));
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(() => setPage({ type: 'event', activityKey: 'Insight Session', event: ev }));
    },
    [nav]
  );

  const onBackAct = useCallback(() => {
    nav(() =>
      setPage((p) => ({ type: "activity", activityKey: p.activityKey }))
    );
    nav(() => setPage((p) => ({ type: 'activity', activityKey: p.activityKey })));
    nav(() =>
      setPage((p) => ({ type: "activity", activityKey: p.activityKey }))
    );
    nav(() => setPage((p) => ({ type: 'activity', activityKey: p.activityKey })));
  }, [nav]);

  const onBackMain = useCallback(() => {
    nav(() => {
      setPage(null);
      setTimeout(() => {
        const el = document.getElementById('section-activities');
        if (!el) return;
        window.scrollTo({ top: el.offsetTop - (mobile ? MNH : DNH), behavior: 'smooth' });
        window.scrollTo({
          top: el.offsetTop - (mobile ? MNH : DNH),
          behavior: 'smooth',
        });
      }, 50);
    });
  }, [nav, mobile]);

  const onBackToSection = useCallback(
    (section) => {
      nav(() => setPage({ type: 'section', section }));
      nav(() => setPage({ type: "section", section }));
    },
    [nav]
  );

  const openApply = useCallback(() => { nav(() => setPage({ type:'apply' })); }, [nav]);
  const openJoin  = useCallback(() => { nav(() => setPage({ type:'join'  })); }, [nav]);

  const onBackHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    nav(() => { setPage(null); setActiveTab('Home'); window.scrollTo({ top: 0 }); });
    nav(() => { setPage(null); setActiveTab('Home'); window.scrollTo({ top:0 }); });
  }, [nav]);
      nav(() => setPage({ type: "section", section }));
    },
    [nav]
  );

  const openApply = useCallback(() => nav(() => setPage({ type: 'apply' })), [nav]);
  const openJoin  = useCallback(() => nav(() => setPage({ type: 'join'  })), [nav]);

  /* ── Derived ── */
  const nh  = mobile ? MNH : DNH;
  const openApply = useCallback(() => {
    nav(() => setPage({ type: "apply" }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: "join" }));
  }, [nav]);

  const onBackHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    nav(() => {
      setPage(null);
      setActiveTab('Home');
    nav(() => setPage({ type: "apply" }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: "join" }));
  }, [nav]);

  const onBackHome = useCallback(() => {
    window.history.pushState({}, "", "/");
    nav(() => {
      setPage(null);
      setActiveTab("Home");
      window.scrollTo({ top: 0 });
    });
  }, [nav]);

    nav(() => setPage({ type: "apply" }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: "join" }));
  }, [nav]);

  const onBackHome = useCallback(() => {
  const openApply = useCallback(() => {
    nav(() => setPage({ type: "apply" }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: "join" }));
  }, [nav]);

  const onBackHome = useCallback(() => {
  const openApply = useCallback(() => {
    nav(() => setPage({ type: "apply" }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: "join" }));
  }, [nav]);

  const onBackHome = useCallback(() => {
  const openApply = useCallback(() => {
    nav(() => setPage({ type: "apply" }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: "join" }));
  }, [nav]);

  const onBackHome = useCallback(() => {
  const openApply = useCallback(() => {
    nav(() => setPage({ type: 'apply' }));
  }, [nav]);

  const openJoin = useCallback(() => {
    nav(() => setPage({ type: 'join' }));
  }, [nav]);

  const onBackHome = useCallback(() => {
    window.history.pushState({}, '', '/');
    nav(() => {
      setPage(null);
      setActiveTab('Home');
      window.scrollTo({ top: 0 });
    });
  }, [nav]);

  const nh = mobile ? MNH : DNH;
  const cur = page?.activityKey ? activityPages[page.activityKey] : null;

  return (
    <>
    <BookmarkProvider>
      {/* Chatbot – kept at very top */}
      <Chatbot />
      <Chatbot/>

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)}/>}

      {cinDone && <ScrollProgress/>}
      <Chatbot/>

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)}/>}
      {cinDone  && <ScrollProgress/>}
      <Cursor/>
      <Wipe on={wipeOn} ph={wipePh}/>

      {cinDone && <AmbientOrbs theme={theme}/>}
      {cinDone && <GeometricGridBackground theme={theme}/>}
      {cinDone && <ParticleBackground theme={theme}/>}

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && <ScrollProgress />}
      <Cursor />
      <Wipe on={wipeOn} ph={wipePh} />

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && <ScrollProgress />}
      <Cursor />
      <Wipe on={wipeOn} ph={wipePh} />

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && <ScrollProgress />}
      <Cursor />
      <Wipe on={wipeOn} ph={wipePh} />
      {/* ── Loading background: prevents white-flash on fast devices while
           cinDone is false. Z-index sits beneath the CinematicOpening (z 9999)
           but above everything else. Fades out once the opening completes. ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8900,
          background: theme === 'light' ? '#FFFFFF' : '#0A0A0A',
          opacity: cinDone ? 0 : 1,
          transition: 'opacity .5s ease',
          pointerEvents: 'none',
        }}
      />

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && <ScrollProgress />}
      <Cursor />
      <Wipe on={wipeOn} ph={wipePh} />

      {cinDone && <AmbientOrbs theme={theme} />}
      {cinDone && <GeometricGridBackground theme={theme} />}
      {cinDone && <ParticleBackground theme={theme} />}
      {cinDone && (
        <Navbar
          activeTab={activeTab}
          onTabChange={onTab}
          onToggleTheme={toggleTheme}
          theme={theme}
          onApply={openApply}
          onJoin={openJoin}
          bookmarksOpen={bookmarksOpen}
          onToggleBookmarks={() => setBookmarksOpen((prev) => !prev)}
        />
      )}

      <main style={{ paddingTop: nh, position: 'relative', zIndex: 1 }}>
      <main style={{ paddingTop: nh, position: "relative", zIndex: 1 }}>
        {page ? (

          <PageIn k={page.type + (page.section || page.activityKey || page.subpage || '')}>

            {/* ── Section pages ── */}

          <PageIn k={page.type + (page.section || page.activityKey)}>
            {page.section === 'Dashboard'  && <DashboardPage onBack={onBackHome}/>}

          <PageIn k={page.type + (page.section || page.activityKey || '')}>

            {/* ── Section pages ── */}
            {page.section === 'Activities' && <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome}/>}
            {page.section === 'Events'     && <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData}/>}
            {page.section === 'Projects'   && <ProjectsPage onBack={onBackHome}/>}
            {page.section === 'Roadmaps'   && <RoadmapsPage onBack={onBackHome}/>}

            {page.section === 'Resume'     && <ResumePage   onBack={onBackHome}/>}
            {page.section === 'About'      && <AboutPage    onBack={onBackHome}/>}
            {page.section === 'Team'       && <TeamPage     onBack={onBackHome} onApply={openApply}/>}
            {page.section === 'Contact'    && <ContactPage  onBack={onBackHome}/>}

            {/* ── Deep pages ── */}

            {page.section === 'Portfolio'  && <PortfolioBuilder />}
            {page.section === 'Resume'     && <ResumePage onBack={onBackHome}/>}
            {page.section === 'Portfolio'  && <PortfolioBuilder/>}
            {page.section === 'Collab'     && <CollabPage onBack={onBackHome}/>}
            {page.section === 'Portfolio'  && <PortfolioBuilder/>}
            {page.section === 'About'      && <AboutPage onBack={onBackHome}/>}
            {page.section === 'Team'       && <TeamPage onBack={onBackHome} onApply={openApply}/>}
            {page.section === 'Contact'    && <ContactPage onBack={onBackHome}/>}

            {page.type === 'activity' && cur && <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent}/>}
            {/* ── Deep pages ── */}
            {page.type === 'activity' && cur      && <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent}/>}
            {page.type === 'event'    && page.event && <EventDetailPage event={page.event} onBack={page.activityKey ? onBackAct : onBackMain}/>}
            {page.type === 'apply'    && <RecruitmentPage onBack={onBackHome}/>}
            {page.type === 'join'     && <MembershipPage  onBack={onBackHome}/>}
            {page.type === 'admin'    && <AdminPage       onBack={onBackHome}/>}
            {page.type === 'portfolio' && <PublicPortfolio username={page.username} onBack={onBackHome}/>}

            {/* ── Interview pages ── */}
            {page.type === 'interview' && page.subpage === 'dashboard' && (
              <InterviewDashboard
                onBack={onBackHome}
                onStartQuiz={(sessionId) => openInterview('quiz', sessionId)}
                onOpenCode={() => openInterview('code')}
                onOpenAnalytics={() => openInterview('analytics')}
              />
            )}
            {/* Mirrors: /interview/quiz/:sessionId */}
            {page.type === 'interview' && page.subpage === 'quiz' && (
              <QuizInterface sessionId={page.sessionId} onBack={onBackFromInterview}/>
            )}
            {page.type === 'interview' && page.subpage === 'code' && (
              <CodingEditor onBack={onBackFromInterview}/>
            )}

            {/* Mirrors: /interview/analytics */}
            {page.type === 'interview' && page.subpage === 'analytics' && (
              <AnalyticsDashboard onBack={onBackFromInterview}/>
            )}

            {/* ── 404 fallback ── */}
            {page.type && !['section','activity','event','apply','join','admin','interview'].includes(page.type) && (

            {page.type === 'portfolio' && <PublicPortfolio username={page.username} onBack={onBackHome} />}
            {page.type && !['section','activity','event','apply','join','portfolio'].includes(page.type) && (

            {/* ── Detail / action pages ── */}
            {page.type === 'activity' && cur && (
              <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent}/>
            )}
            {page.type === 'apply' && <RecruitmentPage onBack={onBackHome}/>}
            {page.type === 'join'  && <MembershipPage  onBack={onBackHome}/>}
            {page.type === 'admin' && <AdminPage        onBack={onBackHome}/>}
            {page.type === 'event' && page.event && (
              <EventDetailPage
                event={page.event}
                onBack={page.activityKey ? onBackAct : onBackMain}
              />
            )}
            {page.type === 'portfolio' && (
              <PublicPortfolio username={page.username} onBack={onBackHome}/>
            )}

            {/* ── 404 fallback ── */}
            {page.type && !VALID_PAGE_TYPES.includes(page.type) && (
            {page.type && !['section','activity','event','apply','join','admin','interview','portfolio'].includes(page.type) && (
              <NotFoundPage onGoHome={onBackHome}/>
            )}

            {page.section === 'Dashboard' && <DashboardPage onBack={onBackHome} />}
            {page.section === 'Activities' && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === 'Events' && (
              <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
            )}
            {page.section === 'Projects' && <ProjectsPage onBack={onBackHome} />}
            {page.section === 'Roadmaps' && <RoadmapsPage onBack={onBackHome} />}
            {page.section === 'Portfolio' && <PortfolioBuilder />}
            {page.section === 'Collab' && <CollabPage onBack={onBackHome} />}
            {page.section === 'About' && <AboutPage onBack={onBackHome} />}
            {page.section === 'Team' && <TeamPage onBack={onBackHome} onApply={openApply} />}
            {page.section === 'Contact' && <ContactPage onBack={onBackHome} />}
            {page.type === 'activity' && cur && (
              <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent} />
            )}
            {page.type === 'apply' && (
              <Suspense fallback={<div>Loading...</div>}>
                <RecruitmentPage onBack={onBackHome} />
              </Suspense>
            )}
            {page.type === 'join' && (
              <Suspense fallback={<div>Loading...</div>}>
                <MembershipPage onBack={onBackHome} />
              </Suspense>
            )}
            {page.type === 'admin' && (
              <Suspense fallback={<div>Loading...</div>}>
                <AdminPage onBack={onBackHome} />
              </Suspense>
            )}
            {page.type === 'event' && page.event && (
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Activities" && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Analytics" && (
              <AnalyticsPage onBack={onBackHome} />
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Analytics" && (
              <AnalyticsPage onBack={onBackHome} />
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Analytics" && (
              <AnalyticsPage onBack={onBackHome} />
            )}
            {page.section === "Activities" && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Activities" && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === "Dashboard" && (
              <DashboardPage onBack={onBackHome} />
            )}
            {page.section === "Activities" && (
            {page.section === 'Dashboard' && <DashboardPage onBack={onBackHome} />}
            {page.section === 'Analytics' && <AnalyticsPage onBack={onBackHome} />}
            {page.section === 'Activities' && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === 'Events' && (
              <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
            )}
            {page.section === 'Projects' && <ProjectsPage onBack={onBackHome} />}
            {page.section === 'Roadmaps' && <RoadmapsPage onBack={onBackHome} />}
            {page.section === 'Portfolio' && <PortfolioBuilder />}
            {page.section === 'Collab' && <CollabPage onBack={onBackHome} />}
            {page.section === 'About' && <AboutPage onBack={onBackHome} />}
            {page.section === 'Team' && <TeamPage onBack={onBackHome} onApply={openApply} />}
            {page.section === 'Contact' && <ContactPage onBack={onBackHome} />}
            {page.type === 'activity' && cur && (
              <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent} />
            )}
            {page.section === "Roadmaps" && (
              <RoadmapsPage onBack={onBackHome} />
            )}
            {page.section === "Portfolio" && <PortfolioBuilder />}
            {page.section === "Collab" && <CollabPage onBack={onBackHome} />}
            {page.section === "About" && <AboutPage onBack={onBackHome} />}
            {page.section === "Team" && (
              <TeamPage onBack={onBackHome} onApply={openApply} />
            )}
            {page.section === "Contact" && <ContactPage onBack={onBackHome} />}
            {page.type === "activity" && (
              <ActivityDetailPage
                activityKey={page.activityKey}
                onBack={onBackMain}
                onEventClick={onEvent}
            {page.type === "activity" && cur && (
              <ActivityDetailPage
                activity={cur}
                onBack={onBackMain}
                onSelectEvent={onEvent}
              />
            )}
            {page.type === "apply" && <RecruitmentPage onBack={onBackHome} />}
            {page.type === "join" && <MembershipPage onBack={onBackHome} />}
            {page.type === "admin" && <AdminPage onBack={onBackHome} />}
            {page.type === "event" && page.event && (
            {page.type === 'apply' && <RecruitmentPage onBack={onBackHome} />}
            {page.type === 'join' && <MembershipPage onBack={onBackHome} />}
            {page.type === 'admin' && <AdminPage onBack={onBackHome} />}
            {page.type === 'event' && page.event && (
              <EventDetailPage
                event={page.event}
                onBack={page.activityKey ? onBackAct : onBackMain}
              />
            )}
            {page.type === 'portfolio' && (
              <PublicPortfolio username={page.username} onBack={onBackHome} />
            )}
            {page.section === 'Dashboard' && <DashboardPage onBack={onBackHome} />}
            {page.section === 'Activities' && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === 'Events' && (
              <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
            )}
            {page.section === 'Projects' && <ProjectsPage onBack={onBackHome} />}
            {page.section === 'Roadmaps' && <RoadmapsPage onBack={onBackHome} />}
            {page.section === 'Portfolio' && <PortfolioBuilder />}
            {page.section === 'Collab' && <CollabPage onBack={onBackHome} />}
            {page.section === 'About' && <AboutPage onBack={onBackHome} />}
            {page.section === 'Team' && <TeamPage onBack={onBackHome} onApply={openApply} />}
            {page.section === 'Contact' && <ContactPage onBack={onBackHome} />}
            {page.type === 'activity' && cur && (
              <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent} />
            )}
            {page.type === 'apply' && <RecruitmentPage onBack={onBackHome} />}
            {page.type === 'join' && <MembershipPage onBack={onBackHome} />}
            {page.type === 'admin' && <AdminPage onBack={onBackHome} />}
            {page.type === 'event' && page.event && (
              <EventDetailPage
                event={page.event}
                onBack={page.activityKey ? onBackAct : onBackMain}
              />
            )}
            {page.type === 'portfolio' && (
              <PublicPortfolio username={page.username} onBack={onBackHome} />
            )}
            {page.section === 'Dashboard' && <DashboardPage onBack={onBackHome} />}
            {page.section === 'Analytics' && <AnalyticsPage onBack={onBackHome} />}
            {page.section === 'Activities' && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === 'Events' && (
              <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
            )}
            {page.section === 'Projects' && <ProjectsPage onBack={onBackHome} />}
            {page.section === 'Roadmaps' && <RoadmapsPage onBack={onBackHome} />}
            {page.section === 'Portfolio' && <PortfolioBuilder />}
            {page.section === 'Collab' && <CollabPage onBack={onBackHome} />}
            {page.section === 'About' && <AboutPage onBack={onBackHome} />}
            {page.section === 'Team' && <TeamPage onBack={onBackHome} onApply={openApply} />}
            {page.section === 'Contact' && <ContactPage onBack={onBackHome} />}
            {page.type === 'activity' && cur && (
              <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent} />
            )}
            {page.type === 'apply' && <RecruitmentPage onBack={onBackHome} />}
            {page.type === 'join' && <MembershipPage onBack={onBackHome} />}
            {page.type === 'admin' && <AdminPage onBack={onBackHome} />}
            {page.type === 'event' && page.event && (
              <EventDetailPage
                event={page.event}
                onBack={page.activityKey ? onBackAct : onBackMain}
              />
            )}
            {page.type === 'portfolio' && (
              <PublicPortfolio username={page.username} onBack={onBackHome} />
            )}
            {page.section === 'Dashboard' && <DashboardPage onBack={onBackHome} />}
            {page.section === 'Analytics' && <AnalyticsPage onBack={onBackHome} />}
            {page.section === 'Activities' && (
              <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
            )}
            {page.section === 'Events' && (
              <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
            )}
            {page.section === 'Projects' && <ProjectsPage onBack={onBackHome} />}
            {page.section === 'Roadmaps' && <RoadmapsPage onBack={onBackHome} />}
            {page.section === 'Portfolio' && <PortfolioBuilder />}
            {page.section === 'Collab' && <CollabPage onBack={onBackHome} />}
            {page.section === 'About' && <AboutPage onBack={onBackHome} />}
            {page.section === 'Team' && <TeamPage onBack={onBackHome} onApply={openApply} />}
            {page.section === 'Contact' && <ContactPage onBack={onBackHome} />}
            {page.type === 'activity' && cur && (
              <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent} />
            )}
            {page.type === 'apply' && <RecruitmentPage onBack={onBackHome} />}
            {page.type === 'join' && <MembershipPage onBack={onBackHome} />}
            {page.type === 'admin' && <AdminPage onBack={onBackHome} />}
            {page.type === 'event' && page.event && (
              <EventDetailPage
                event={page.event}
                onBack={page.activityKey ? onBackAct : onBackMain}
              />
            )}
            {page.type === 'portfolio' && (
              <PublicPortfolio username={page.username} onBack={onBackHome} />
            )}
            {page.type === 'workspace' && (
              <WorkspacePage roomId={page.roomId} onBack={onBackHome} />
            )}
            {page.type &&
              !['section', 'activity', 'event', 'apply', 'join', 'portfolio', 'workspace'].includes(
                page.type
              ) && <NotFoundPage onGoHome={onBackHome} />}
            {page.type === "portfolio" && (
              <PublicPortfolio username={page.username} />
            )}
            {page.type === "dashboard" && <DashboardPage onBack={onBackHome} />}
            {page.type === "workspace" && (
              <WorkspacePage roomId={page.roomId} onBack={onBackHome} />
            )}
            {page.type === "mentorship" && (
              <MentorshipDashboard
                onBack={onBackHome}
                onOpenSession={(id) => {
                  window.history.pushState({}, "", `/mentorship/review/${id}`);
                  setPage({ type: "review_session", roomId: id });
                }}
              />
            )}
            {page.type === "review_session" && (
              <ReviewSession
                roomId={page.roomId}
                onBack={() => {
                  window.history.pushState({}, "", "/mentorship");
                  setPage({ type: "mentorship" });
                }}
              />
            )}
            {page.type === "portfolio" && (
              <PublicPortfolio username={page.username} onBack={onBackHome} />
            )}
            {page.type === 'workspace' && (
              <WorkspacePage roomId={page.roomId} onBack={onBackHome} />
            )}
            {page.type &&
              ![
                "section",
                "activity",
                "event",
                "apply",
                "join",
                "portfolio",
                "workspace",
                "dashboard",
                "mentorship",
                "review_session",
              ].includes(page.type) && <NotFoundPage onGoHome={onBackHome} />}
              !['section', 'activity', 'event', 'apply', 'join', 'portfolio', 'workspace'].includes(
                page.type
              ) && <NotFoundPage onGoHome={onBackHome} />}
          </PageIn>
        ) : (
          cinDone && (
            <PageIn k="main">
              <HeroSection onTabChange={onTab} onApply={openApply} onJoin={openJoin} theme={theme}/>
              <SectionDivider/>
              <ActivitiesSection onNavigate={onNavigate}/>
              <SectionDivider/>
              <EventsSection onEventClick={onKSSClick} events={eventsData}/>
              <SectionDivider/>
              <AboutSection/>
              <SectionDivider/>
              <TeamSection onApply={openApply}/>
              <Footer
                onAdmin={()    => nav(() => setPage({ type:'admin' }))}
                onProjects={() => onTab('Projects')}
                onRoadmaps={() => onTab('Roadmaps')}
                onInterview={() => openInterview('dashboard')}
              <HeroSection
                onTabChange={onTab}
                onApply={openApply}
                onJoin={openJoin}
                theme={theme}
              />
              <SectionDivider />
              <ActivitiesSection onNavigate={onNavigate} />
              <SectionDivider />
              <EventsSection onEventClick={onKSSClick} events={eventsData} />
              <SectionDivider />
              <AboutSection />
              <SectionDivider />
              <TeamSection onApply={openApply} />
              <Footer
                onAdmin={() => nav(() => setPage({ type: 'admin' }))}
                onProjects={() => onTab('Projects')}
                onRoadmaps={() => onTab('Roadmaps')}
                onAdmin={() => nav(() => setPage({ type: "admin" }))}
                onProjects={() => onTab("Projects")}
                onRoadmaps={() => onTab("Roadmaps")}
              />
              <div id="section-contact">
                <Footer
                  onAdmin={() => nav(() => setPage({ type: 'admin' }))}
                  onProjects={() => onTab('Projects')}
                  onRoadmaps={() => onTab('Roadmaps')}
                />
              </div>
            </PageIn>
          )
        )}
      </main>

      {cinDone && <button id="back-to-top" aria-label="Back to top">↑</button>}

      {/* ── Floating Search Button ── */}
      {/* ── Floating search button ── */}
      {cinDone && (
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          aria-expanded={searchOpen}
          aria-controls="global-search-dialog"
          title="Search (Ctrl+K)"
          style={{
            position:'fixed', bottom:'80px', left:'24px', zIndex:8500,
            width:'46px', height:'46px', borderRadius:'50%',
            background:'linear-gradient(135deg,#CC1111,#880000)',
            border:'none', cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 20px rgba(204,17,17,0.5)',
            transition:'transform 0.2s, box-shadow 0.2s',
            position: 'fixed',
            bottom: '80px',
            left: '24px',
            zIndex: 8500,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#CC1111,#880000)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(204,17,17,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(204,17,17,0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(204,17,17,0.5)';
            position: "fixed",
            bottom: "80px",
            left: "24px",
            zIndex: 8500,
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#CC1111,#880000)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(204,17,17,0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "fixed",
            bottom: "80px",
            left: "24px",
            zIndex: 8500,
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#CC1111,#880000)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(204,17,17,0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "fixed",
            bottom: "80px",
            left: "24px",
            zIndex: 8500,
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#CC1111,#880000)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(204,17,17,0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "fixed",
            bottom: "80px",
            left: "24px",
            zIndex: 8500,
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#CC1111,#880000)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(204,17,17,0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "fixed",
            bottom: "80px",
            left: "24px",
            zIndex: 8500,
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#CC1111,#880000)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(204,17,17,0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "fixed",
            bottom: "80px",
            left: "24px",
            zIndex: 8500,
            width: "46px",
            height: "46px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#CC1111,#880000)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(204,17,17,0.5)",
            transition: "transform 0.2s, box-shadow 0.2s",
            position: "fixed",
            bottom: "80px",
            left: "24px",
            position: 'fixed',
            bottom: '80px',
            left: '24px',
            zIndex: 8500,
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#CC1111,#880000)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(204,17,17,0.5)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(204,17,17,0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(204,17,17,0.5)';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(204,17,17,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,17,17,0.5)";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(204,17,17,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,17,17,0.5)";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(204,17,17,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,17,17,0.5)";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(204,17,17,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,17,17,0.5)";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(204,17,17,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,17,17,0.5)";
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.12)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(204,17,17,0.75)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(204,17,17,0.5)";
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.12)'; e.currentTarget.style.boxShadow='0 6px 28px rgba(204,17,17,0.75)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';    e.currentTarget.style.boxShadow='0 4px 20px rgba(204,17,17,0.5)';  }}
        >
          <div
            className="skeleton-fallback-spinner"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: '2px dashed rgba(230,57,70,0.35)',
              borderTopColor: '#E63946',
              animation: 'animate-spin 1s linear infinite',
            }}
          />
        </div>
      )}
      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && (
        <>
          <ScrollProgress />
          <Cursor />
          <Wipe on={wipeOn} ph={wipePh} />
          <AmbientOrbs theme={theme} />
          <GeometricGridBackground theme={theme} />
          <ParticleBackground theme={theme} />
          <Navbar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onToggleTheme={toggleTheme}
            theme={theme}
          />
        </>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}

      <main className="app-main" style={{ paddingTop: navHeight }}>
        <>
          {page?.type === 'section' && (
            <SectionContent page={page} eventsData={eventsData} actions={actions} />
          )}

          {page?.type === 'activity' && currentActivity && (
            <PageIn k={`a-${page.activityKey}`}>
              <ActivityDetailPage
                activity={currentActivity}
                onBack={() =>
                  performTransition(() => setPage({ type: 'section', section: 'Activities' }))
                }
                onSelectEvent={actions.onEvent}
              />
            </PageIn>
          )}

          {page?.type === 'event' && page.event && currentActivity && (
            <PageIn k={`e-${page.event?.id}`}>
              <EventContent
                page={page}
                currentActivity={currentActivity}
                onBack={actions.onBackActivity}
              />
            </PageIn>
          )}
      {/* ── Developer Terminal ── */}
      {/* ── Search overlay ── */}
      <SearchBar
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        activities={activityPages}
        events={eventsData}
        onNavigate={onNavigate}
        onEventClick={onKSSClick}
      />

      {/* ── Developer terminal ── */}
      {/* ── Developer Terminal ── */}
      <Terminal
        isOpen={isTerminalOpen}
        onClose={closeTerminal}
        theme={theme}
        setTheme={setTheme}
        setTheme={() => {}}
        onNavigate={onTab}
      />

      {/* ── Bookmarks drawer ── */}
      <BookmarksDrawer
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onNavigate={(type) => {
          if      (type === 'Event')    onTab('Events');
        onNavigate={type => {
          if (type === 'Event')    onTab('Events');
          else if (type === 'Activity') onTab('Activities');
          else if (type === 'Roadmap')  onTab('Roadmaps');
          if (type === "Event") onTab("Events");
          else if (type === "Activity") onTab("Activities");
          else if (type === "Roadmap") onTab("Roadmaps");
          if (type === 'Event') onTab('Events');
          else if (type === 'Activity') onTab('Activities');
          else if (type === 'Roadmap') onTab('Roadmaps');
        }}
      />
      {cinDone && <FloatingDock />}
      <Toaster richColors />
    </BookmarkProvider>

          {page?.type === 'apply' && (
            <PageIn k="pg-apply">
              <Suspense
                fallback={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '80px 0',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div
                      className="skeleton-fallback-spinner"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2.5px dashed rgba(230,57,70,0.3)',
                        borderTopColor: '#E63946',
                        animation: 'animate-spin 1s linear infinite',
                      }}
                    />
                  </div>
                }
              >
                <RecruitmentPage onBack={actions.onBackHome} />
              </Suspense>
            </PageIn>
          )}

          {page?.type === 'join' && (
            <PageIn k="pg-join">
              <Suspense
                fallback={
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '80px 0',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div
                      className="skeleton-fallback-spinner"
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: '2.5px dashed rgba(230,57,70,0.3)',
                        borderTopColor: '#E63946',
                        animation: 'animate-spin 1s linear infinite',
                      }}
                    />
                  </div>
                }
              >
                <MembershipPage onBack={actions.onBackHome} />
              </Suspense>
            </PageIn>
          )}

          {page?.type === 'gamification' && (
            <PageIn k="pg-gamification">
              <GamificationDashboard />
            </PageIn>
          )}

          {!page && cinDone && (
            <PageIn k="main">
              <MainContent
                actions={actions}
                theme={theme}
                handleTabChange={handleTabChange}
                eventsData={eventsData}
              />
            </PageIn>
          )}
        </>
      </main>

      {cinDone && (
        <button id="back-to-top" aria-label="Back to top">
          ▲
        </button>
      )}
    </>
  );
}

function SectionContent({ page, eventsData, actions }) {
  switch (page.section) {
    case 'Activities':
      return (
        <PageIn k="pg-activities">
          <ActivitiesPage onNavigate={actions.onNavigate} onBack={actions.onBackHome} />
        </PageIn>
      );
    case 'Events':
      return (
        <PageIn k="pg-events">
          <EventsPage
            onBack={actions.onBackHome}
            onEventClick={actions.onKSSClick}
            events={eventsData}
          />
        </PageIn>
      );
    case 'About':
      return (
        <PageIn k="pg-about">
          <AboutPage onBack={actions.onBackHome} />
        </PageIn>
      );
    case 'Team':
      return (
        <PageIn k="pg-team">
          <TeamPage onBack={actions.onBackHome} onApply={actions.openApply} />
        </PageIn>
      );
    case 'Contact':
      return (
        <PageIn k="pg-contact">
          <ContactPage onBack={actions.onBackHome} />
        </PageIn>
      );
    case 'Dashboard':
      return (
        <PageIn k="pg-dashboard">
          <DashboardPage onBack={actions.onBackHome} />
        </PageIn>
      );
    default:
      return null;
  }
}

function EventContent({ page, currentActivity, onBack }) {
  const displayEvent = useMemo(() => {
    const hasDetailPage = !!page.event.hasDetailPage;
    if (page.activityKey === 'Insight Session' && hasDetailPage) {
      return currentActivity.conductedEvents?.find((e) => e.id === 'kss-153') || page.event;
    }
    return page.event;
  }, [page.event, page.activityKey, currentActivity.conductedEvents]);

  return (
    <EventDetailPage
      event={displayEvent}
      activityColor={currentActivity.color}
      activityIcon={currentActivity.icon}
      onBack={onBack}
    />
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 24px',
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 'clamp(5rem,18vw,10rem)',
          fontWeight: 900,
          background: 'linear-gradient(135deg,#CC1111 0%,#EE2222 50%,#FF4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1,
          marginBottom: '16px',
          fontSize: "clamp(5rem,18vw,10rem)",
          fontWeight: 900,
          background:
            "linear-gradient(135deg,#CC1111 0%,#EE2222 50%,#FF4444 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          marginBottom: "16px",
        }}
      >
        404
      </div>
      <h2
        style={{
          fontFamily: "'Orbitron',monospace",
          fontSize: 'clamp(1rem,3vw,1.5rem)',
          fontWeight: 700,
          color: 'var(--t1)',
          marginBottom: '12px',
          fontSize: "clamp(1rem,3vw,1.5rem)",
          fontWeight: 700,
          color: "var(--t1)",
          marginBottom: "12px",
        }}
      >
        Page Not Found
      </h2>
      <p
        style={{
          color: 'var(--t2)',
          fontSize: '1rem',
          maxWidth: '380px',
          lineHeight: 1.7,
          marginBottom: '32px',
          color: "var(--t2)",
          fontSize: "1rem",
          maxWidth: "380px",
          lineHeight: 1.7,
          marginBottom: "32px",
        }}
      >
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <button className="btn btn-primary" onClick={onGoHome} style={{ cursor: 'pointer' }}>
      <button
        className="btn btn-primary"
        onClick={onGoHome}
        style={{ cursor: "pointer" }}
      >
        ← Go Home
      </button>
    </div>
  );
}

function MainContent({ actions, theme, handleTabChange, eventsData }) {
  return (
    <>
      <HeroSection
        onTabChange={handleTabChange}
        onApply={actions.openApply}
        onJoin={actions.openJoin}
        theme={theme}
      />

      {/* AI Recommendation Widget */}
      <div className="container">
        <RecommendationWidget events={eventsData} onEventClick={actions.onKSSClick} />
      </div>

      <SectionDivider />
      <ActivitiesSection onNavigate={actions.onNavigate} />
      <SectionDivider />
      <EventsSection onEventClick={actions.onKSSClick} events={eventsData} />
      <SectionDivider />
      <AboutSection />
      <SectionDivider />
      <TeamSection onApply={actions.openApply} />
      <Footer />
    </>
  );
}
}
export default App;
