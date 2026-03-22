import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, X, QrCode } from 'lucide-react'
import { Facility } from '@/lib/types'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  facilities: Facility[]
}

export function QRScanner({ onScan, onClose, facilities }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let stream: MediaStream | null = null
    let animationFrame: number
    let detector: any = null

    if ('BarcodeDetector' in window) {
      // @ts-expect-error
      detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    }

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setHasCamera(true)

        const tick = async () => {
          if (
            videoRef.current &&
            videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
          ) {
            if (detector) {
              try {
                const barcodes = await detector.detect(videoRef.current)
                if (barcodes.length > 0) {
                  onScan(barcodes[0].rawValue)
                  return
                }
              } catch (e) {
                // Ignore detection errors to allow continuous scanning
              }
            }
          }
          animationFrame = requestAnimationFrame(tick)
        }

        animationFrame = requestAnimationFrame(tick)
      } catch (err) {
        setHasCamera(false)
        setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      cancelAnimationFrame(animationFrame)
    }
  }, [onScan])

  const simulateScan = () => {
    if (facilities.length > 0) {
      onScan(`nowavet-facility:${facilities[0].id}`)
    } else {
      onScan(`nowavet-facility:unknown`)
    }
  }

  const simulateInvalidScan = () => {
    onScan(`invalid-qr-code-123`)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-fade-in">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {hasCamera === false ? (
          <div className="p-6 text-center text-white space-y-4 max-w-sm mx-auto">
            <Camera className="w-16 h-16 mx-auto opacity-50 mb-4" />
            <h3 className="text-xl font-bold">Câmera indisponível</h3>
            <p className="text-white/70">{error}</p>
            <div className="pt-8 space-y-3">
              <Button variant="secondary" className="w-full" onClick={simulateScan}>
                Simular Leitura Válida (Demo)
              </Button>
              <Button
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10"
                onClick={simulateInvalidScan}
              >
                Simular Leitura Inválida
              </Button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
              <div className="flex-1 bg-black/60" />
              <div className="flex bg-transparent h-72">
                <div className="flex-1 bg-black/60" />
                <div className="w-72 border-2 border-primary relative flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-primary/30 animate-pulse" />
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1" />
                </div>
                <div className="flex-1 bg-black/60" />
              </div>
              <div className="flex-1 bg-black/60 flex items-center justify-center p-6 text-center">
                <p className="text-white bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm shadow-sm">
                  Posicione o QR Code da instalação no centro da tela
                </p>
              </div>
            </div>

            {!('BarcodeDetector' in window) && hasCamera && (
              <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-3 px-6 pb-safe">
                <div className="bg-black/80 text-yellow-300 text-xs px-3 py-2 rounded mb-2 text-center max-w-sm">
                  Seu navegador não suporta leitura nativa de QR Code. Use os botões abaixo para
                  simular.
                </div>
                <div className="flex gap-2 w-full max-w-sm">
                  <Button variant="secondary" className="flex-1" onClick={simulateScan}>
                    Scan Válido
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={simulateInvalidScan}>
                    Scan Inválido
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="h-24 bg-black flex items-center justify-center px-4 relative z-20 pb-safe">
        <Button
          variant="ghost"
          onClick={onClose}
          className="rounded-full w-14 h-14 p-0 flex items-center justify-center bg-white/10 text-white hover:bg-white/20"
        >
          <X className="w-8 h-8" />
        </Button>
      </div>
    </div>
  )
}
