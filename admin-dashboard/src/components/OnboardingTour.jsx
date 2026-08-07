import React, { useState, useEffect, useRef } from "react";

const TOUR_STEPS = [
  {
    title: "👋 Welcome to NexaSphere Admin!",
    body: "We have designed this control center to make managing your community, events, and analytics seamless. Let’s take a quick 1-minute guided tour of the key tools available to you.",
    selector: null, // Centered
  },
  {
    title: "📊 Admin Dashboard Control",
    body: "This is your Home base. It gives you a real-time high-level view of core team size, membership applications, and upcoming events.",
    selector: '[data-tour="dashboard"]',
  },
  {
    title: "📈 Comprehensive Analytics",
    body: "Unlock platform metrics here. Dive deep into user engagement trends, user retention cohorts, sign-up funnels, and filterable custom reports.",
    selector: '[data-tour="analytics"]',
  },
  {
    title: "👥 User & Role Management",
    body: "Manage your users, update administration roles (member, moderator, admin), view audit timelines, award customized badges, and unlock accounts.",
    selector: '[data-tour="users"]',
  },
  {
    title: "📅 Events & Activities Manager",
    body: "Plan upcoming events, manage activity schedules, monitor RSVPs, download check-in tickets, scan attendee QR codes, and review post-event feedback.",
    selector: '[data-tour="events"]',
  },
  {
    title: "🎯 Ready to Go!",
    body: 'You are all set to manage NexaSphere! If you ever need to view this tutorial again, simply click the "Replay Tour" button located in the sidebar footer.',
    selector: null, // Centered
  },
];

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  // Auto-trigger on first admin login
  useEffect(() => {
    const completed = localStorage.getItem("ns-admin-onboarding-completed");
    if (!completed) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to manual replay triggers
  useEffect(() => {
    const handleReplay = () => {
      setIsActive(true);
      setCurrentStep(0);
    };

    window.addEventListener("start-ns-tour", handleReplay);
    return () => window.removeEventListener("start-ns-tour", handleReplay);
  }, []);

  // Track target element positions on step change, scroll, or resize
  useEffect(() => {
    if (!isActive) return;

    const step = TOUR_STEPS[currentStep];
    if (!step.selector) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.selector);
      if (element) {
        // Ensure element is visible in sidebar (scroll it if needed)
        element.scrollIntoView({ block: "nearest", behavior: "smooth" });

        // Get bounding client rect
        const rect = element.getBoundingClientRect();
        setTargetRect({
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        });
      } else {
        setTargetRect(null);
      }
    };

    // Delay slightly to allow any tab transitions/renders to finish
    const timer = setTimeout(updatePosition, 150);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem("ns-admin-onboarding-completed", "true");
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isCentered = !step.selector || !targetRect;

  // Determine popover position styles
  let popoverStyle = {};
  if (isCentered) {
    popoverStyle = {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
      position: "fixed",
    };
  } else {
    // Position to the right of the target (since we are highlighting sidebar items)
    const padding = 20;
    popoverStyle = {
      left: `${targetRect.right + padding}px`,
      top: `${Math.max(20, targetRect.top + targetRect.height / 2 - 100)}px`,
      position: "fixed",
    };
  }

  return (
    <div className="ns-tour-overlay" aria-modal="true" role="dialog">
      {/* Background Mask Spotlight */}
      <div
        className="ns-tour-spotlight"
        style={
          targetRect
            ? {
                left: `${targetRect.left - 6}px`,
                top: `${targetRect.top - 4}px`,
                width: `${targetRect.width + 12}px`,
                height: `${targetRect.height + 8}px`,
                opacity: 1,
              }
            : {
                left: "50%",
                top: "50%",
                width: "0px",
                height: "0px",
                opacity: 0,
                pointerEvents: "none",
              }
        }
      />

      {/* Popover Card */}
      <div className="ns-tour-popover" style={popoverStyle}>
        {/* Arrow (only if not centered) */}
        {!isCentered && <div className="ns-tour-arrow" />}

        <div className="ns-tour-title">{step.title}</div>
        <div className="ns-tour-body">{step.body}</div>

        <div className="ns-tour-footer">
          <div className="ns-tour-progress">
            {currentStep + 1} / {TOUR_STEPS.length}
          </div>
          <div className="ns-tour-buttons">
            {currentStep < TOUR_STEPS.length - 1 && (
              <button
                className="ns-tour-btn ns-tour-btn-skip"
                onClick={handleSkip}
              >
                Skip
              </button>
            )}
            {currentStep > 0 && (
              <button
                className="ns-tour-btn ns-tour-btn-back"
                onClick={handleBack}
              >
                Back
              </button>
            )}
            <button
              className="ns-tour-btn ns-tour-btn-next"
              onClick={handleNext}
            >
              {currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
