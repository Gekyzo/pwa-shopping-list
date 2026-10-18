import { FORMATS, isBarcode } from '#barcode';
import { $, ui, t, showToast, render } from '#ui/context';

// The wait between two reads of the camera image.
const SCAN_MS = 250;

// The camera while the scan sheet is open: its stream and the timer of the next read.
let session = null;

// The formats of FORMATS that the phone reads, or [] with no detector or no camera.
const supportedFormats = async () => {
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) return [];
  try {
    const formats = await window.BarcodeDetector.getSupportedFormats();
    return FORMATS.filter((format) => formats.includes(format));
  } catch {
    return [];
  }
};

const stopTracks = (stream) => stream?.getTracks().forEach((track) => track.stop());

export const renderScan = () => {
  $('scan').hidden = !ui.scanOpen;
};

export const closeScan = () => {
  if (session) {
    clearTimeout(session.timer);
    stopTracks(session.stream);
    session = null;
  }
  $('scan-video').srcObject = null;
  ui.scanOpen = false;
  render();
};

// Opens the camera and calls `onCode` with the first valid code that it reads.
export const openScan = async (onCode) => {
  if (session) return;
  const own = { stream: null, timer: null };
  session = own;
  ui.scanOpen = true;
  render();
  try {
    const detector = new window.BarcodeDetector({ formats: await supportedFormats() });
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    // The sheet closed while the phone asked for the camera.
    if (session !== own) {
      stopTracks(stream);
      return;
    }
    own.stream = stream;
    const video = $('scan-video');
    video.srcObject = stream;
    await video.play();
    const read = async () => {
      if (session !== own) return;
      try {
        const code = (await detector.detect(video)).map((found) => found.rawValue.trim()).find(isBarcode);
        if (code && session === own) {
          closeScan();
          onCode(code);
          return;
        }
      } catch {
        // A frame that is not ready yet: the next read tries again.
      }
      if (session === own) own.timer = setTimeout(read, SCAN_MS);
    };
    read();
  } catch (error) {
    if (session !== own) return;
    closeScan();
    showToast(t(error?.name === 'NotAllowedError' ? 'error.cameraDenied' : 'error.cameraFailed'));
  }
};

export const bind = () => {
  $('scan-veil').addEventListener('click', closeScan);
  $('scan-cancel').addEventListener('click', closeScan);
  // The camera stays on only while the app is in view.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ui.scanOpen) closeScan();
  });
  supportedFormats().then((formats) => {
    ui.scan = formats.length > 0;
    render();
  });
};
