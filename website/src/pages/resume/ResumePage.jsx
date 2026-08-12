export default function ResumePage({ onBack }) {
  return (
    <div id="section-resume" style={{ minHeight: '80vh', padding: '60px 24px' }}>
      <button className="btn btn-primary" onClick={onBack}>
        ? Back
      </button>
      <h1>Resume Analyzer</h1>
    </div>
  );
}
