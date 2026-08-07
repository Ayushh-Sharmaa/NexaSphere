import React, { useState } from "react";

export function HelpTooltip({ content, position = "top" }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="ns-help-container"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <button
        type="button"
        className="ns-help-trigger"
        aria-label="Help information"
        onClick={(e) => e.preventDefault()}
      >
        ?
      </button>
      {visible && (
        <span className={`ns-help-tooltip ns-help-tooltip-${position}`}>
          {content}
          <span
            className={`ns-help-tooltip-arrow ns-help-tooltip-arrow-${position}`}
          />
        </span>
      )}
    </span>
  );
}
export default HelpTooltip;
