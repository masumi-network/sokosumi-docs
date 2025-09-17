"use client"
import { useRef } from 'react';

export default function MCPDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleToggle = () => {
    const vid = videoRef.current;
    if (vid) {
      if (vid.paused) {
        vid.play();
      } else {
        vid.pause();
      }
    }
  };

  return (
    <div>
      <video
        ref={videoRef}
        src="/assets/mcp-setup-demo.mp4"
        style={{ width: '100%', maxWidth: '600px', cursor: 'pointer' }}
        onClick={handleToggle}
        loop
        playsInline
      />
    </div>
  );
}