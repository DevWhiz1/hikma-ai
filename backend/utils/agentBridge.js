const { spawn } = require('child_process');
const path = require('path');

function runPythonAgent(scriptName, payload, { timeoutMs = 60000 } = {}) {
  return new Promise((resolve) => {
    const pythonBin = process.env.PYTHON_BIN || 'python';
    const scriptPath = path.join(__dirname, '..', 'agents-python', scriptName);
    const start = Date.now();
    const child = spawn(pythonBin, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    let finished = false;

    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        child.kill('SIGKILL');
        resolve({ ok: false, error: 'Agent timed out', data: null, latencyMs: Date.now() - start });
      }
    }, timeoutMs);

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('error', (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      resolve({ ok: false, error: err.message, data: null, latencyMs: Date.now() - start });
    });

    child.on('close', () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        const json = JSON.parse(stdout.trim() || '{}');
        resolve({ ok: true, data: json, error: stderr || null, latencyMs: Date.now() - start });
      } catch (e) {
        resolve({ ok: false, error: `Invalid JSON from agent: ${e.message}. stdout: ${stdout}. stderr: ${stderr}`.slice(0, 4000), data: null, latencyMs: Date.now() - start });
      }
    });

    try {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    } catch (e) {
      // ignore
    }
  });
}

module.exports = { runPythonAgent };
