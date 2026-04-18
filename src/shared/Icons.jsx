import React from 'react';

function baseProps(props) {
  return {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
    focusable: false,
    style: { display: 'inline-block', verticalAlign: '-3px', ...props?.style },
    ...props,
  };
}

export function IconArrowRight(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M5 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconArrowLeft(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M19 12H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconSpark(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2l1.2 5.2L18 9l-4.8 1.8L12 16l-1.2-5.2L6 9l4.8-1.8L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M4.5 14.5l.6 2.4 2.4.6-2.4.6-.6 2.4-.6-2.4-2.4-.6 2.4-.6.6-2.4Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 21c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 21c0-2.5-1.5-4.6-3.6-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6" />
    </svg>
  );
}

export function IconShieldCheck(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8.5 12.5l2.2 2.2L15.8 9.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconBolt(props) {
  return (
    <svg {...baseProps(props)}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

