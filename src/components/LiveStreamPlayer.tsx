import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Video, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { io, Socket } from 'socket.io-client';

interface LiveStreamPlayerProps {
  gameId: string;
  isStreaming?: boolean;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
  ws?: WebSocket | null;
  isViewer?: boolean;
}

const LiveStreamPlayer = ({ gameId, isStreaming = false, onStreamStart, onStreamStop, ws, isViewer = false }: LiveStreamPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStartingStream, setIsStartingStream] = useState(false);
  const [mediaSocket, setMediaSocket] = useState<Socket | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    // Setup media server socket
    const socket = io('http://localhost:5005');
    
    socket.on('connect', () => {
      setMediaSocket(socket);
      const role = isViewer ? 'viewer' : 'broadcaster';
      socket.emit('join-game', { gameId, role });
    });
    
    socket.on('ready-to-stream', () => {
      console.log('Ready to stream');
    });
    
    socket.on('stream-available', () => {
      if (isViewer) {
        socket.emit('request-video-updates', gameId);
      }
    });
    
    socket.on('video-update', (data) => {
      if (isViewer && videoRef.current) {
        const videoUrl = `http://localhost:5005${data.videoUrl}?t=${Date.now()}`;
        videoRef.current.src = videoUrl;
        videoRef.current.load();
        setStream(new MediaStream());
        setIsPlaying(true);
      }
    });
    
    socket.on('stream-ended', () => {
      if (isViewer) {
        setStream(null);
        setIsPlaying(false);
        if (videoRef.current) {
          videoRef.current.src = '';
        }
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [gameId, isViewer]);



  const startStream = async () => {
    setIsStartingStream(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        setIsPlaying(true);
      }
      
      // Setup MediaRecorder to save complete video blobs
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264,opus')) {
        mimeType = 'video/webm;codecs=h264,opus';
      }
      
      console.log('Using MIME type:', mimeType);
      const recorder = new MediaRecorder(mediaStream, { mimeType });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('Recorder stopped, chunks:', chunks.length);
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          console.log('Created blob, size:', blob.size);
          const reader = new FileReader();
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            console.log('Sending video data, size:', arrayBuffer.byteLength);
            if (mediaSocket) {
              mediaSocket.emit('save-video', {
                videoData: Array.from(new Uint8Array(arrayBuffer))
              });
            }
          };
          reader.readAsArrayBuffer(blob);
        } else {
          console.log('No chunks to save');
        }
      };
      
      // Save video every 5 seconds
      const saveInterval = setInterval(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setTimeout(() => {
            if (mediaStream.active) {
              chunks.length = 0;
              recorder.start();
            }
          }, 100);
        }
      }, 5000);
      
      // Store interval for cleanup
      setMediaRecorder({ recorder, interval: saveInterval } as any);
      
      recorder.start();
      setMediaRecorder(recorder);
      
      // Update backend streaming status
      const userEmail = localStorage.getItem('userEmail');
      await fetch(`http://localhost:5000/games/${gameId}/toggle-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStreaming: true, userEmail })
      });
      
      // Broadcast stream start via WebSocket
      if (ws) {
        ws.send(JSON.stringify({
          type: 'stream_update',
          gameId,
          isStreaming: true
        }));
      }
      
      onStreamStart?.();
    } catch (err) {
      console.error('Failed to start stream:', err);
    } finally {
      setIsStartingStream(false);
    }
  };

  const stopStream = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Stop media recorder
    if (mediaRecorder) {
      if (mediaRecorder.recorder) {
        mediaRecorder.recorder.stop();
        clearInterval(mediaRecorder.interval);
      } else {
        mediaRecorder.stop();
      }
      setMediaRecorder(null);
    }
    
    // Notify media server
    if (mediaSocket) {
      mediaSocket.emit('stop-stream');
    }
    
    // Update backend streaming status
    const userEmail = localStorage.getItem('userEmail');
    await fetch(`http://localhost:5000/games/${gameId}/toggle-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStreaming: false, userEmail })
    });
    
    // Broadcast stream stop via WebSocket
    if (ws) {
      ws.send(JSON.stringify({
        type: 'stream_update',
        gameId,
        isStreaming: false
      }));
    }
    
    setIsPlaying(false);
    onStreamStop?.();
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted={isMuted}
      />

      {/* Stream Status Overlay */}
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <Card className="p-6 text-center">
            <div className="space-y-4">
              <div className="text-white/70">
                <Video className="w-12 h-12 mx-auto mb-2" />
                <div className="text-lg">
                  {isViewer ? 'Watching Live Stream' : 'Live Stream'}
                </div>
                <div className="text-sm opacity-70">
                  {isStreaming 
                    ? (isViewer ? 'Connecting to live stream...' : 'Stream is live') 
                    : 'No active stream'
                  }
                </div>
              </div>
              
              {!isStreaming && !isViewer && (
                <Button 
                  onClick={startStream} 
                  disabled={isStartingStream}
                  className="btn-action"
                >
                  <Video className="w-4 h-4 mr-2" />
                  {isStartingStream ? 'Starting...' : 'Start Stream'}
                </Button>
              )}
              
              {isStreaming && isViewer && (
                <div className="text-green-400 font-medium animate-pulse">
                  🔴 Connecting to Live Stream...
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Controls Overlay */}
      {stream && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white text-sm">LIVE</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={stopStream}
                className="text-white hover:bg-white/20"
              >
                <VideoOff className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPlayer;