/**
 * voiceClient.js - Real-time WebSocket Voice Client for SAHAYAK Frontend.
 * Integrates:
 * - 16 kHz Mono PCM streaming to Gnani Prisma v3.0 STT
 * - 24 kHz Mono PCM playback from Gnani Timbre v3.0 TTS (sequential non-overlapping queue)
 * - Push-to-Talk (PTT) with instant barge-in
 * - Bidirectional clinical events & field synchronisation
 */

import { getWsUrl } from "./api";

export class SahayakVoiceClient {
  constructor({ url = getWsUrl(), onEvent } = {}) {
    this.url = url;
    this.onEvent = onEvent || (() => {});
    this.ws = null;
    this.playCtx = null;
    this.micCtx = null;
    this.stream = null;
    this.workletNode = null;
    this.sources = [];
    this.nextTime = 0;
    this.carry = null;
    this.talking = false;
    this.connected = false;
    this.audioBufferQueue = [];
    this.downsamplePos = 0;
  }

  async connect(language = "hi") {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.playCtx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 24000,
    });
    await this.playCtx.resume();

    await this.initMicrophone();

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        this.onEvent({ type: "ws_connected" });
        resolve();
      };

      this.ws.onclose = () => {
        this.connected = false;
        this.onEvent({ type: "ws_disconnected" });
      };

      this.ws.onerror = (err) => {
        this.onEvent({ type: "error", message: "WebSocket connection error" });
        reject(err);
      };

      this.ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          this.handleServerMessage(msg);
        } catch (err) {
          console.error("Failed to parse WS frame:", err);
        }
      };
    });
  }

  handleServerMessage(msg) {
    switch (msg.type) {
      case "agent_audio_chunk":
        this.playPcm(msg.data);
        break;
      case "flush_audio":
        this.flushAudio();
        break;
      default:
        break;
    }
    this.onEvent(msg);
  }

  playPcm(base64Data) {
    if (!this.playCtx || !base64Data) return;
    try {
      const binary = atob(base64Data);
      let bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      if (this.carry) {
        const merged = new Uint8Array(this.carry.length + bytes.length);
        merged.set(this.carry);
        merged.set(bytes, this.carry.length);
        bytes = merged;
        this.carry = null;
      }

      if (bytes.length % 2 !== 0) {
        this.carry = bytes.slice(bytes.length - 1);
        bytes = bytes.slice(0, bytes.length - 1);
      }

      const numSamples = bytes.length / 2;
      const float32 = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        let val = bytes[2 * i] | (bytes[2 * i + 1] << 8);
        if (val >= 32768) val -= 65536;
        float32[i] = val / 32768.0;
      }

      if (numSamples === 0) return;

      const audioBuffer = this.playCtx.createBuffer(1, numSamples, 24000);
      audioBuffer.copyToChannel(float32, 0);

      const source = this.playCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playCtx.destination);

      // Strict sequential scheduling (fixes the overlapping voices bug)
      if (this.nextTime < this.playCtx.currentTime) {
        this.nextTime = this.playCtx.currentTime + 0.02;
      }
      const startTime = this.nextTime;
      source.start(startTime);
      this.nextTime = startTime + audioBuffer.duration;

      this.sources.push(source);
      source.onended = () => {
        this.sources = this.sources.filter((s) => s !== source);
      };
    } catch (err) {
      console.warn("PCM decoding error:", err);
    }
  }

  flushAudio() {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {}
    });
    this.sources = [];
    this.nextTime = 0;
    this.carry = null;
  }

  async initMicrophone() {
    if (this.stream) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
    });

    this.micCtx = new (window.AudioContext || window.webkitAudioContext)();
    const processorCode = `
      class AudioProcessor extends AudioWorkletProcessor {
        process(inputs) {
          const channel = inputs[0] && inputs[0][0];
          if (channel) this.port.postMessage(channel.slice(0));
          return true;
        }
      }
      registerProcessor('audio-processor', AudioProcessor);
    `;

    const blob = new Blob([processorCode], { type: "application/javascript" });
    const moduleUrl = URL.createObjectURL(blob);
    await this.micCtx.audioWorklet.addModule(moduleUrl);

    const sourceNode = this.micCtx.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.micCtx, "audio-processor");

    this.workletNode.port.onmessage = (e) => {
      if (this.talking) {
        this.processAndSendPcm(e.data);
      }
    };

    const muteNode = this.micCtx.createGain();
    muteNode.gain.value = 0;
    sourceNode.connect(this.workletNode);
    this.workletNode.connect(muteNode);
    muteNode.connect(this.micCtx.destination);
  }

  processAndSendPcm(float32Chunk) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Resample from mic sampleRate to 16,000 Hz
    const ratio = this.micCtx.sampleRate / 16000;
    while (this.downsamplePos < float32Chunk.length) {
      this.audioBufferQueue.push(float32Chunk[Math.floor(this.downsamplePos)]);
      this.downsamplePos += ratio;
    }
    this.downsamplePos -= float32Chunk.length;

    // Send exact 512-sample (1024-byte) frames
    while (this.audioBufferQueue.length >= 512) {
      const slice = this.audioBufferQueue.splice(0, 512);
      const int16 = new Int16Array(512);
      for (let i = 0; i < 512; i++) {
        int16[i] = Math.max(-1, Math.min(1, slice[i])) * 32767;
      }
      const bytes = new Uint8Array(int16.buffer);
      let binaryStr = "";
      for (let i = 0; i < bytes.length; i++) {
        binaryStr += String.fromCharCode(bytes[i]);
      }
      this.send({
        type: "audio_chunk",
        data: btoa(binaryStr),
      });
    }
  }

  async startTalking() {
    if (this.talking) return;
    if (this.micCtx) await this.micCtx.resume();
    if (this.playCtx) await this.playCtx.resume();

    this.flushAudio();
    this.audioBufferQueue = [];
    this.downsamplePos = 0;
    this.talking = true;

    this.send({ type: "ptt_start" });
  }

  stopTalking() {
    if (!this.talking) return;
    this.talking = false;
    this.send({ type: "ptt_end" });
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  startVisit({ visit_type = "ANC", language = "hi", beneficiary_id = null, speak = false } = {}) {
    this.send({
      type: "start_visit",
      visit_type,
      language,
      beneficiary_id,
      speak,
    });
  }

  confirmSave() {
    this.send({ type: "confirm_save" });
  }

  correctField(field, value) {
    this.send({ type: "correct_field", field, value });
  }

  sendTextInput(text) {
    this.send({ type: "text_input", text });
  }

  disconnect() {
    this.flushAudio();
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
