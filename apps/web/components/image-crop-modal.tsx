'use client'

import {useCallback, useRef, useState} from 'react'
import ReactCrop, {Crop, PixelCrop} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import {Button} from '@workspace/ui/ui/button'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@workspace/ui/ui/dialog'
import {useI18n} from '@/lib/i18n/provider'
import {Loader2} from 'lucide-react'

interface ImageCropModalProps {
    isOpen: boolean
    onClose: () => void
    imageSrc: string
    onCropComplete: (croppedImageBlob: Blob) => void
    isUploading?: boolean
}

export function ImageCropModal({
                                   isOpen,
                                   onClose,
                                   imageSrc,
                                   onCropComplete,
                                   isUploading = false,
                               }: ImageCropModalProps) {
    const {t} = useI18n()
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        width: 50,
        height: 50,
        x: 25,
        y: 25,
    })
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
    const imgRef = useRef<HTMLImageElement>(null)

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const {width, height} = e.currentTarget
        const size = Math.min(width, height)
        const x = (width - size) / 2
        const y = (height - size) / 2

        const initialCrop = {
            unit: 'px' as const,
            width: size,
            height: size,
            x,
            y,
        }

        setCrop(initialCrop)
        setCompletedCrop(initialCrop)
    }, [])

    const getCroppedImg = useCallback(
        async (image: HTMLImageElement, crop: PixelCrop): Promise<Blob> => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            if (!ctx) {
                throw new Error('No 2d context')
            }

            const scaleX = image.naturalWidth / image.width
            const scaleY = image.naturalHeight / image.height

            canvas.width = crop.width
            canvas.height = crop.height

            ctx.drawImage(
                image,
                crop.x * scaleX,
                crop.y * scaleY,
                crop.width * scaleX,
                crop.height * scaleY,
                0,
                0,
                crop.width,
                crop.height
            )

            return new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'))
                            return
                        }
                        resolve(blob)
                    },
                    'image/jpeg',
                    0.95
                )
            })
        },
        []
    )

    const handleCropConfirm = async () => {
        if (!imgRef.current || !completedCrop) {
            return
        }

        try {
            const croppedImageBlob = await getCroppedImg(imgRef.current, completedCrop)
            onCropComplete(croppedImageBlob)
        } catch (error) {
            console.error('Error cropping image:', error)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t.modal.cropTitle}</DialogTitle>
                    <DialogDescription>
                        {t.modal.cropDescription}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center items-center min-h-[240px] sm:min-h-[380px] bg-muted/30 rounded-lg p-2 sm:p-4 overflow-hidden">
                    <ReactCrop
                        crop={crop}
                        onChange={(c: Crop) => setCrop(c)}
                        onComplete={(c: PixelCrop) => setCompletedCrop(c)}
                        aspect={1}
                        circularCrop
                    >
                        <img
                            ref={imgRef}
                            src={imageSrc}
                            alt="Crop preview"
                            onLoad={onImageLoad}
                            className="max-h-[45vh] sm:max-h-[500px] max-w-full object-contain"
                        />
                    </ReactCrop>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUploading}>
                        {t.common.cancel}
                    </Button>
                    <Button onClick={handleCropConfirm} disabled={isUploading || !completedCrop}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                {t.modal.uploading}
                            </>
                        ) : (
                            t.modal.cropAndUpload
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
