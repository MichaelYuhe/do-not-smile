import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import * as faceapi from "face-api.js";

function VideoChat() {
  const [peerId, setPeerId] = useState("");
  const [remotePeerId, setRemotePeerId] = useState("");
  const [peer, setPeer] = useState(null);
  const [call, setCall] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [expression, setExpression] = useState("");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const peer = new Peer({
      host: "localhost",
      port: 9000,
      path: "/myapp",
      debug: 3,
    });

    peer.on("open", (id) => {
      console.log("My peer ID is: " + id);
      setPeerId(id);
      setConnectionStatus("Connected");
    });

    peer.on("call", handleIncomingCall);

    peer.on("error", (error) => {
      console.error("PeerJS error:", error);
      setConnectionStatus("Error: " + error.type);
    });

    setPeer(peer);

    // Start local video and load face-api models
    startLocalVideoAndLoadModels();

    return () => {
      peer.destroy();
    };
  }, []);

  const startLocalVideoAndLoadModels = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Load face-api models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        faceapi.nets.faceExpressionNet.loadFromUri("/models"),
      ]);

      // Start face detection
      detectFace();
    } catch (error) {
      console.error("Error accessing media devices or loading models:", error);
    }
  };

  const detectFace = async () => {
    if (!localVideoRef.current) return;

    const options = new faceapi.TinyFaceDetectorOptions();

    setInterval(async () => {
      const detections = await faceapi
        .detectSingleFace(localVideoRef.current, options)
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections) {
        const canvas = canvasRef.current;
        const displaySize = {
          width: localVideoRef.current.width,
          height: localVideoRef.current.height,
        };
        faceapi.matchDimensions(canvas, displaySize);

        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

        const dominantExpression = Object.entries(
          detections.expressions,
        ).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        setExpression(dominantExpression);
      }
    }, 100);
  };

  const handleIncomingCall = async (incomingCall) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      incomingCall.answer(stream);
      incomingCall.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
      setCall(incomingCall);
    } catch (error) {
      console.error("Error handling incoming call:", error);
    }
  };

  const startCall = async () => {
    try {
      if (!peer) {
        console.error("Peer not initialized");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const call = peer.call(remotePeerId, stream);
      call.on("stream", (remoteStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
      setCall(call);
    } catch (error) {
      console.error("Error starting call:", error);
    }
  };

  const endCall = () => {
    if (call) {
      call.close();
      setCall(null);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    }
  };

  const sendHappyMessage = () => {
    console.log("send");
    if (call) {
      call.send("I'm happy!");
    }
  };

  useEffect(() => {
    if (expression === "happy") sendHappyMessage();
  }, [expression]);

  return (
    <div>
      <h1>P2P Video Chat with Face Expression Detection</h1>
      <p>Connection Status: {connectionStatus}</p>
      <p>Your Peer ID: {peerId || "Not yet assigned"}</p>
      <p>Detected Expression: {expression}</p>
      <input
        type="text"
        value={remotePeerId}
        onChange={(e) => setRemotePeerId(e.target.value)}
        placeholder="Enter remote peer id"
      />
      <button onClick={startCall}>Start Call</button>
      <button onClick={endCall}>End Call</button>
      <div style={{ position: "relative" }}>
        <h2>Local Video</h2>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          width="300"
          height="225"
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: "25px", left: "0" }}
          width="300"
          height="225"
        />
      </div>
      <div>
        <h2>Remote Video</h2>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          width="300"
          height="225"
        />
      </div>
    </div>
  );
}

export default VideoChat;
