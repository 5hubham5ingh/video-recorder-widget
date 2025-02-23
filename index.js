let recorder, screenStream, audioStream, combinedStream, recordedBlob;
let isPaused = false;
let isAudioEnabled = false;
let isWebCamEnabled = false;
const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const pauseButton = document.getElementById("pause");
const downloadButton = document.getElementById("download");
const toggleAudioButton = document.getElementById("toggle-audio");
const toggleWebcamButton = document.getElementById("toggle-webcam");
const videoPreview = document.getElementById("preview");

function resetUI() {
  startButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;
  downloadButton.disabled = true;
  pauseButton.textContent = "Pause";
  isPaused = false;
}

startButton.onclick = async function () {
  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
  }

  screenStream = await navigator.mediaDevices
    [isWebCamEnabled ? "getUserMedia" : "getDisplayMedia"]({ video: true });

  if (isAudioEnabled) {
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      combinedStream = new MediaStream([
        ...screenStream.getTracks(),
        ...audioStream.getTracks(),
      ]);
    } catch (error) {
      console.error("Failed to get audio stream: ", error);
      combinedStream = screenStream;
    }
  } else {
    combinedStream = screenStream;
  }

  recorder = new RecordRTC(combinedStream, { type: "video" });
  recorder.startRecording();
  videoPreview.srcObject = combinedStream;
  videoPreview.play();

  startButton.disabled = true;
  pauseButton.disabled = false;
  stopButton.disabled = false;
  downloadButton.disabled = true;
};

pauseButton.onclick = function () {
  if (isPaused) {
    recorder.resumeRecording();
    pauseButton.textContent = "Pause";
  } else {
    recorder.pauseRecording();
    pauseButton.textContent = "Resume";
  }
  isPaused = !isPaused;
};

stopButton.onclick = function () {
  recorder.stopRecording(() => {
    recordedBlob = recorder.getBlob();
    const url = URL.createObjectURL(recordedBlob);
    videoPreview.srcObject = null;
    videoPreview.src = url;
    videoPreview.play();
  });

  screenStream.getTracks().forEach((track) => track.stop());
  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop());
  }

  startButton.disabled = false;
  pauseButton.disabled = true;
  stopButton.disabled = true;
  downloadButton.disabled = false;
};

downloadButton.onclick = function () {
  const url = URL.createObjectURL(recordedBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "screen_recording.webm";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  resetUI();
};

toggleAudioButton.onclick = function () {
  isAudioEnabled = !isAudioEnabled;
  toggleAudioButton.textContent = isAudioEnabled
    ? "Disable Audio"
    : "Enable Audio";
};

toggleWebcamButton.onclick = function () {
  isWebCamEnabled = !isWebCamEnabled;
  toggleWebcamButton.textContent = isWebCamEnabled
    ? "Disable Webcam"
    : "Enable webcam";
};

resetUI();
