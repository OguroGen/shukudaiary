'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const [error, setError] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch (err) {
        console.error('カメラ停止エラー:', err)
      }
      html5QrCodeRef.current = null
      setIsScanning(false)
    }
  }

  useEffect(() => {
    if (!scannerRef.current) return

    const html5QrCode = new Html5Qrcode(scannerRef.current.id)

    const startScanning = async () => {
      try {
        setError('')
        setIsScanning(true)

        // カメラの設定（CODE39のみをサポート）
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [Html5QrcodeSupportedFormats.CODE_39],
        }

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText, decodedResult) => {
            // バーコードが読み取れたら
            onScan(decodedText)
            // スキャンを停止
            if (html5QrCodeRef.current) {
              html5QrCodeRef.current.stop().then(() => {
                html5QrCodeRef.current.clear()
                html5QrCodeRef.current = null
                setIsScanning(false)
              }).catch((err) => {
                console.error('カメラ停止エラー:', err)
              })
            }
          },
          (errorMessage) => {
            // エラーは無視（スキャン継続）
          }
        )

        html5QrCodeRef.current = html5QrCode
      } catch (err) {
        console.error('カメラ起動エラー:', err)
        let errorMessage = 'カメラを起動できませんでした。'
        if (err.name === 'NotAllowedError') {
          errorMessage = 'カメラのアクセス権限が許可されていません。ブラウザの設定を確認してください。'
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'カメラが見つかりませんでした。'
        }
        setError(errorMessage)
        setIsScanning(false)
      }
    }

    startScanning()

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear()
        }).catch((err) => {
          console.error('クリーンアップ時のカメラ停止エラー:', err)
        })
        html5QrCodeRef.current = null
      }
      setIsScanning(false)
    }
  }, [onScan])

  const handleClose = () => {
    stopScanning()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">バーコードスキャン</h2>
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-2xl border-2 border-red-300">
            {error}
          </div>
        )}

        <div
          id="barcode-scanner"
          ref={scannerRef}
          className="w-full rounded-2xl overflow-hidden bg-black"
          style={{ minHeight: '300px' }}
        />

        {isScanning && (
          <p className="mt-4 text-center text-gray-600">
            バーコードをカメラの中央に合わせてください
          </p>
        )}

        <button
          onClick={handleClose}
          className="mt-4 w-full py-3 bg-gray-400 text-white rounded-2xl hover:bg-gray-500 font-bold"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}

