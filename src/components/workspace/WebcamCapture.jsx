import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

/**
 * Left pane capture utility: webcam snapshot (or file upload) of a physical
 * notebook page, uploaded to the `notebook-scans` Supabase Storage bucket.
 */
export default function WebcamCapture({ onImageSaved, onCancel }) {
  const { user } = useAuth()
  const { notify } = useToast()

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  const [mode, setMode] = useState('idle') // idle | live | review
  const [cameraError, setCameraError] = useState(null)
  const [pending, setPending] = useState(null) // { blob, previewUrl }
  const [uploading, setUploading] = useState(false)

  // Always release the camera when the component goes away.
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl)
    },
    [pending],
  )

  async function startCamera() {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setMode('live')
    } catch {
      setCameraError(
        'Camera unavailable — allow camera access, or upload a photo instead.',
      )
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  function snap() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    stopCamera()
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setPending({ blob, previewUrl: URL.createObjectURL(blob) })
        setMode('review')
      },
      'image/jpeg',
      0.85,
    )
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPending({ blob: file, previewUrl: URL.createObjectURL(file) })
    setMode('review')
  }

  async function uploadScan(blob) {
    setUploading(true)
    try {
      const path = `${user.id}/${crypto.randomUUID()}.jpg`
      const { error } = await supabase.storage
        .from('notebook-scans')
        .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' })
      if (error) throw error
      const { data } = supabase.storage.from('notebook-scans').getPublicUrl(path)
      onImageSaved(data.publicUrl)
      notify('Page added to the lightbox.')
    } catch (err) {
      console.error(err)
      notify('Upload failed — please try again.', 'error')
    } finally {
      setUploading(false)
    }
  }

  function retake() {
    if (pending?.previewUrl) URL.revokeObjectURL(pending.previewUrl)
    setPending(null)
    setMode('idle')
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <canvas ref={canvasRef} className="hidden" />

      {mode === 'live' && (
        <>
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-rule bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={snap} className="btn btn-primary">
              Take snapshot
            </button>
            <button
              type="button"
              onClick={() => {
                stopCamera()
                setMode('idle')
              }}
              className="btn btn-quiet"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {mode === 'review' && pending && (
        <>
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-rule bg-white">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img
              src={pending.previewUrl}
              alt="Captured notebook page"
              className="max-h-[45vh] w-full object-contain"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => uploadScan(pending.blob)}
              disabled={uploading}
              className="btn btn-primary"
            >
              {uploading ? 'Uploading…' : 'Use this photo'}
            </button>
            <button
              type="button"
              onClick={retake}
              disabled={uploading}
              className="btn btn-quiet"
            >
              Retake
            </button>
          </div>
        </>
      )}

      {mode === 'idle' && (
        <>
          <div className="grid size-16 place-items-center rounded-full border border-rule bg-paper-raised">
            <svg
              viewBox="0 0 24 24"
              className="size-7 text-ink-faint"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H8l1.2-1.8A1.5 1.5 0 0 1 10.5 3.5h3a1.5 1.5 0 0 1 1.3.7L16 6h2.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-8Z" />
              <circle cx="12" cy="12.5" r="3.5" />
            </svg>
          </div>
          <div>
            <p className="font-serif text-lg">Scan your notebook page</p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-soft">
              Lay the page flat, fill the frame, and snap it. The photo appears
              on a clean lightbox where your parent can pin feedback.
            </p>
          </div>

          {cameraError && (
            <p className="max-w-sm rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {cameraError}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={startCamera} className="btn btn-primary">
              Turn on camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-quiet"
            >
              Upload a photo instead
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="btn btn-ghost">
                Cancel
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </>
      )}
    </div>
  )
}
