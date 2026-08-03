import assert from 'node:assert/strict';
import test from 'node:test';
import { Writable } from 'node:stream';
import { exportPDF } from '../controllers/whiteboardController.js';

class MockResponse extends Writable {
  constructor(onEnd) {
    super();
    this.headers = {};
    this.sentData = [];
    this.statusCode = 200;
    this.onEnd = onEnd;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  status(code) {
    this.statusCode = code;
    return {
      json: (data) => {
        this.jsonData = data;
      },
    };
  }

  _write(chunk, encoding, callback) {
    this.sentData.push(chunk);
    callback();
  }

  end() {
    super.end();
    if (this.onEnd) {
      this.onEnd(this);
    }
  }
}

test('Whiteboard Controller: exportPDF generates PDF output', (t, done) => {
  const req = {
    body: {
      eventId: 'test-event',
      elements: [
        {
          type: 'rect',
          x: 10,
          y: 10,
          w: 100,
          h: 50,
          color: '#ff0000',
          opacity: 0.8,
          strokeWidth: 3,
        },
        { type: 'circle', x: 200, y: 100, w: 80, h: 80, color: '#00ff00', fill: '#0000ff' },
        { type: 'text', x: 50, y: 300, text: 'Hello PDF', fontSize: 24, color: '#000000' },
      ],
    },
  };

  const res = new MockResponse((mockRes) => {
    try {
      assert.equal(mockRes.statusCode, 200);
      assert.equal(mockRes.headers['Content-Type'], 'application/pdf');
      assert.ok(mockRes.headers['Content-Disposition'].includes('whiteboard-test-event.pdf'));
      assert.ok(mockRes.sentData.length > 0);
      done();
    } catch (err) {
      done(err);
    }
  });

  exportPDF(req, res);
});

test('Whiteboard Controller: exportPDF handles empty element array', (t, done) => {
  const req = {
    body: {
      eventId: 'empty-event',
      elements: [],
    },
  };

  const res = new MockResponse((mockRes) => {
    try {
      assert.equal(mockRes.statusCode, 200);
      assert.equal(mockRes.headers['Content-Type'], 'application/pdf');
      assert.ok(mockRes.headers['Content-Disposition'].includes('whiteboard-empty-event.pdf'));
      assert.ok(mockRes.sentData.length > 0);
      done();
    } catch (err) {
      done(err);
    }
  });

  exportPDF(req, res);
});
