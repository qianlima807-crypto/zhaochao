'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { useAuth } from '@/lib/auth-context'
import { Phone, Shield, ArrowRight, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isLoggedIn } = useAuth()
  
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [countdown, setCountdown] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const redirectTo = searchParams.get('redirect') || '/'

  // 如果已登录，直接跳转
  useEffect(() => {
    if (isLoggedIn) {
      router.push(redirectTo)
    }
  }, [isLoggedIn, router, redirectTo])

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      return
    }
    
    setIsLoading(true)
    // 模拟发送验证码
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setCountdown(60)
    setStep('code')
  }

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      return
    }
    
    setIsLoading(true)
    // 模拟验证
    await new Promise(resolve => setTimeout(resolve, 1000))
    login(phone)
    setIsLoading(false)
    router.push(redirectTo)
  }

  const isPhoneValid = /^1\d{10}$/.test(phone)

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 装饰背景 */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[oklch(0.65_0.2_260)] opacity-5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-[oklch(0.55_0.25_300)] opacity-5 blur-3xl" />
        </div>

        <Card className="gradient-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)]">
              {step === 'phone' ? (
                <Phone className="h-8 w-8 text-white" />
              ) : (
                <Shield className="h-8 w-8 text-white" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {step === 'phone' ? '登录账号' : '输入验证码'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? '登录后可使用网站对比功能' 
                : `验证码已发送至 ${phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'phone' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号码</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    className="h-12 text-lg"
                  />
                  {phone && !isPhoneValid && (
                    <p className="text-sm text-destructive">请输入正确的手机号码</p>
                  )}
                </div>

                <Button
                  className="h-12 w-full bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] text-white hover:opacity-90"
                  onClick={handleSendCode}
                  disabled={!isPhoneValid || isLoading}
                >
                  {isLoading ? (
                    '发送中...'
                  ) : (
                    <>
                      获取验证码
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <Label>验证码</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={setCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={1} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={2} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={3} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={4} className="h-14 w-12 text-xl" />
                        <InputOTPSlot index={5} className="h-14 w-12 text-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    演示模式：输入任意6位数字即可登录
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep('phone')
                      setCode('')
                    }}
                  >
                    返回
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[oklch(0.65_0.2_260)] to-[oklch(0.55_0.25_300)] text-white hover:opacity-90"
                    onClick={handleVerifyCode}
                    disabled={code.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      '验证中...'
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        登录
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="link"
                    className="text-muted-foreground"
                    disabled={countdown > 0}
                    onClick={handleSendCode}
                  >
                    {countdown > 0 ? `${countdown}秒后可重发` : '重新发送验证码'}
                  </Button>
                </div>
              </>
            )}

            {/* 底部说明 */}
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-center text-xs text-muted-foreground">
                登录即表示您同意我们的服务条款和隐私政策
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
