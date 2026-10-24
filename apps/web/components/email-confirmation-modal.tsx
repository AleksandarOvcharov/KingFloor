'use client'

import {Mail} from 'lucide-react'
import {Button} from '@workspace/ui/ui/button'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@workspace/ui/ui/card'
import {useI18n} from '@/lib/i18n/provider'

interface EmailConfirmationModalProps {
    email: string
    onClose: () => void
}

export function EmailConfirmationModal({email, onClose}: EmailConfirmationModalProps) {
    const {t} = useI18n()
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-6 w-6 text-primary"/>
                    </div>
                    <CardTitle>{t.auth.checkYourEmail}</CardTitle>
                    <CardDescription>
                        {t.auth.confirmationSentTo}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="font-semibold text-lg">{email}</p>
                    <p className="text-sm text-muted-foreground mt-4">
                        {t.auth.confirmationInstructions}
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <Button onClick={onClose} className="w-full">
                        {t.common.gotIt}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                        {t.auth.didntReceiveEmail}
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
