import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import Layout from '../components/Layout';
import { ticketsApi, eventsApi } from '../services/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import './QRScanner.css';

const QRScanner = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [manualEntry, setManualEntry] = useState(false);
  const [ticketIdInput, setTicketIdInput] = useState('');

  const { data: event } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getById(eventId!),
  });

  const verifyMutation = useMutation({
    mutationFn: (ticketId: string) => ticketsApi.verify(ticketId),
    onSuccess: () => {
      setMessage('Ticket verified successfully!');
      setError('');
      setTicketIdInput('');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Verification failed');
      setMessage('');
      setTimeout(() => setError(''), 5000);
    },
  });

  useEffect(() => {
    if (scanning && !scanner) {
      const html5QrCode = new Html5Qrcode('reader');
      setScanner(html5QrCode);
    }

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
        scanner.clear().catch(() => {});
      }
    };
  }, [scanning, scanner]);

  const startScanning = async () => {
    if (!scanner) {
      setError('Scanner not initialized. Please try again.');
      setScanning(false);
      return;
    }

    setError('');
    setMessage('');

    try {
      // Try to get available cameras first
      const cameras = await Html5Qrcode.getCameras();
      
      if (cameras.length === 0) {
        setError('No cameras found. Please connect a camera and try again.');
        setScanning(false);
        return;
      }

      // Use the first available camera (or try environment facing mode)
      const cameraIdOrConfig = cameras.length > 0 
        ? cameras[0].id 
        : { facingMode: 'environment' };

      await scanner.start(
        cameraIdOrConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleQrCodeScanned(decodedText);
        },
        (errorMessage) => {
          // Only log scanning errors, don't show them to user (they're frequent during scanning)
          console.debug('Scanning error:', errorMessage);
        }
      );
      setMessage('Camera started. Point at QR code to scan.');
      setTimeout(() => setMessage(''), 2000);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setScanning(false);
      
      let errorMsg = 'Failed to start camera. ';
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        errorMsg += 'Please allow camera access in your browser settings.';
      } else if (err.name === 'NotFoundError' || err.message?.includes('no camera')) {
        errorMsg += 'No camera found. Please ensure your camera is connected and not being used by another application.';
      } else if (err.name === 'NotReadableError' || err.message?.includes('could not start')) {
        errorMsg += 'Camera is already in use or not accessible. Close other applications using the camera.';
      } else if (err.message?.includes('WiFi') || err.message?.includes('wireless')) {
        errorMsg += 'WiFi/wireless cameras are not supported. Please use a built-in webcam or USB camera.';
      } else {
        errorMsg += err.message || 'Please check your camera connection and try again.';
      }
      
      setError(errorMsg);
      setTimeout(() => setError(''), 10000);
      
      // Clean up scanner on error
      try {
        await scanner.clear();
      } catch (clearErr) {
        // Ignore clear errors
      }
    }
  };

  const handleQrCodeScanned = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.ticketId) {
        verifyMutation.mutate(data.ticketId);
      } else {
        verifyMutation.mutate(decodedText);
      }
      stopScanning();
    } catch (e) {
      // If not JSON, treat as ticket ID directly
      verifyMutation.mutate(decodedText);
      stopScanning();
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        await scanner.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
    setScanning(false);
    setMessage('');
  };

  const toggleScanning = async () => {
    if (scanning) {
      await stopScanning();
    } else {
      setScanning(true);
      // Small delay to ensure scanner is initialized
      setTimeout(() => startScanning(), 200);
    }
  };

  const handleManualVerify = () => {
    if (!ticketIdInput.trim()) {
      setError('Please enter a ticket ID');
      return;
    }
    verifyMutation.mutate(ticketIdInput.trim());
  };

  return (
    <Layout>
      <div className="qr-scanner">
        <h1>QR Scanner - {event?.title}</h1>
        <div className="scanner-container">
          {!manualEntry ? (
            <>
              <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
              {!scanning && (
                <div className="scanner-controls">
                  <button onClick={toggleScanning} className="btn-start">
                    Start Camera Scanning
                  </button>
                  <button onClick={() => setManualEntry(true)} className="btn-manual">
                    Enter Ticket ID Manually
                  </button>
                </div>
              )}
              {scanning && (
                <button onClick={toggleScanning} className="btn-stop">
                  Stop Scanning
                </button>
              )}
            </>
          ) : (
            <div className="manual-entry">
              <h3>Manual Ticket Verification</h3>
              <p>Enter the ticket ID manually if camera scanning is not available</p>
              <input
                type="text"
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
                placeholder="Enter Ticket ID (e.g., TICKET-ABC12345)"
                className="ticket-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualVerify();
                  }
                }}
              />
              <div className="manual-controls">
                <button onClick={handleManualVerify} className="btn-verify" disabled={verifyMutation.isPending}>
                  {verifyMutation.isPending ? 'Verifying...' : 'Verify Ticket'}
                </button>
                <button onClick={() => {
                  setManualEntry(false);
                  setTicketIdInput('');
                  setError('');
                }} className="btn-cancel">
                  Back to Camera
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="message error">
              {error}
            </div>
          )}
          {message && (
            <div className={`message ${verifyMutation.isSuccess ? 'success' : ''}`}>
              {message}
            </div>
          )}
          
          {!manualEntry && (
            <div className="scanner-info">
              <p><strong>Note:</strong> If camera doesn't work, use manual entry instead.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QRScanner;

